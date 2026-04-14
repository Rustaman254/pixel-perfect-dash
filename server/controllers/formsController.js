import { getDb, getAuthDb } from "../config/db.js";
import { protect } from "../middlewares/authMiddleware.js";

const generateSlug = (title) => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const random = Math.random().toString(36).substring(2, 8);
  return `${slug}-${random}`;
};

export const createForm = async (req, res) => {
  try {
    const { title, description, questions, settings } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const slug = generateSlug(title);
    const db = getAuthDb();

    const result = await db('forms')
      .insert({
        userId: req.user.id,
        title: title,
        description: description || '',
        questions: JSON.stringify(questions || []),
        settings: JSON.stringify(settings || {}),
        slug: slug
      })
      .returning(['id', 'slug']);

    res.status(201).json({
      message: 'Form created successfully',
      id: result[0].id,
      slug: result[0].slug,
    });
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({ message: 'Failed to create form', error: error.message });
  }
};

export const getForms = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getAuthDb();

    const forms = await db('forms')
      .where('userId', userId)
      .orderBy('createdAt', 'desc')
      .select('*');

    // Get response counts for each form
    for (const form of forms) {
      const responses = await db('form_responses')
        .where('formid', form.id)
        .count('* as count')
        .first();
      form.responses = parseInt(responses?.count || 0);
      form.questions = typeof form.questions === 'string' ? JSON.parse(form.questions) : form.questions;
      form.settings = typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings;
    }

    res.json({ forms });
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ message: 'Failed to get forms', error: error.message });
  }
};

export const getForm = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const db = getAuthDb();

    const form = await db('forms')
      .where('id', id)
      .where('userId', userId)
      .first();

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    form.questions = typeof form.questions === 'string' ? JSON.parse(form.questions) : form.questions;
    form.settings = typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings;

    res.json(form);
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ message: 'Failed to get form', error: error.message });
  }
};

export const updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, questions, settings } = req.body;
    const userId = req.user.id;
    const db = getAuthDb();

    const existing = await db('forms')
      .where('id', id)
      .where('userId', userId)
      .first();

    if (!existing) {
      return res.status(404).json({ message: 'Form not found' });
    }

    await db('forms')
      .where('id', id)
      .update({
        title,
        description: description || '',
        questions: JSON.stringify(questions || []),
        settings: JSON.stringify(settings || {}),
        updatedAt: new Date()
      });

    res.json({ message: 'Form updated successfully', id: parseInt(id) });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ message: 'Failed to update form', error: error.message });
  }
};

export const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const db = getAuthDb();

    const existing = await db('forms')
      .where('id', id)
      .where('userId', userId)
      .first();

    if (!existing) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Delete responses first
    await db('form_responses').where('formid', id).del();
    // Delete form
    await db('forms').where('id', id).del();

    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ message: 'Failed to delete form', error: error.message });
  }
};

export const getPublicForm = async (req, res) => {
  try {
    const { slug } = req.params;
    const db = getAuthDb();

    const form = await db('forms')
      .where('slug', slug)
      .select('id', 'title', 'description', 'questions', 'settings')
      .first();

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    form.questions = typeof form.questions === 'string' ? JSON.parse(form.questions) : form.questions;
    form.settings = typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings;

    res.json(form);
  } catch (error) {
    console.error('Get public form error:', error);
    res.status(500).json({ message: 'Failed to get form', error: error.message });
  }
};

export const submitResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, answers } = req.body;
    const db = getAuthDb();

    const form = await db('forms').where('id', id).first();
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    const settings = typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings;
    
    // Check response limit
    if (settings.limitResponses) {
      const count = await db('form_responses')
        .where('formid', id)
        .count('* as count')
        .first();
      if (parseInt(count?.count || 0) >= (settings.maxResponses || 0)) {
        return res.status(400).json({ message: 'Response limit reached' });
      }
    }

    await db('form_responses').insert({
      formid: parseInt(id),
      email: email || null,
      answers: JSON.stringify(answers || {})
    });

    res.json({ message: 'Response submitted successfully' });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ message: 'Failed to submit response', error: error.message });
  }
};

export const getFormResponses = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const db = getAuthDb();

    const form = await db('forms')
      .where('id', id)
      .where('userId', userId)
      .first();

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    const responses = await db('form_responses')
      .where('formid', id)
      .orderBy('createdAt', 'desc')
      .select('*');

    // Parse answers
    for (const response of responses) {
      response.answers = typeof response.answers === 'string' ? JSON.parse(response.answers) : response.answers;
      response.submittedAt = response.createdAt;
    }

    form.questions = typeof form.questions === 'string' ? JSON.parse(form.questions) : form.questions;
    form.settings = typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings;
    form.responses = responses;

    res.json(form);
  } catch (error) {
    console.error('Get form responses error:', error);
    res.status(500).json({ message: 'Failed to get responses', error: error.message });
  }
};

export const getAllForms = async (req, res) => {
  try {
    const db = getAuthDb();
    const forms = await db('forms').orderBy('createdAt', 'desc').select('*');
    res.json(forms);
  } catch (error) {
    console.error('Get all forms error:', error);
    res.status(500).json({ message: 'Failed to get forms', error: error.message });
  }
};