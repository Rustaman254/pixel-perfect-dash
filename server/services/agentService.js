import { Glove, Displaymanager, createAdapter } from "glove-core";
import { getAuthDb } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import z from "zod";

class PostgresStore {
  constructor(db, sessionId) {
    this.db = db;
    this.sessionId = sessionId;
    this.messages = [];
    this.tokenCount = 0;
    this.turnCount = 0;
    this.userId = sessionId;
  }

  async getMessages() {
    return this.messages;
  }

  async appendMessages(msgs) {
    this.messages.push(...msgs);
  }

  async getTokenCount() {
    return this.tokenCount;
  }

  async addTokens(count) {
    this.tokenCount += count;
  }

  async getTurnCount() {
    return this.turnCount;
  }

  async incrementTurn() {
    this.turnCount++;
  }

  async resetCounters() {
    this.tokenCount = 0;
    this.turnCount = 0;
  }
}

const generateSlug = (title) => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const random = Math.random().toString(36).substring(2, 8);
  return `${slug}-${random}`;
};

export const createFormAgent = (userId) => {
  const db = getAuthDb();
  const store = new PostgresStore(db, userId);

  const model = createAdapter({
    provider: "openrouter",
    model: "deepseek/deepseek-chat",
    apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
    stream: true,
  });

  const dm = new Displaymanager();

  const agent = new Glove({
    store,
    model,
    displayManager: dm,
    systemPrompt: `You are a Sokostack Forms AI assistant. Your role is to help users create, manage, and analyze forms.

IMPORTANT: When users ask to create a form, YOU MUST generate questions that are RELEVANT to what the user is requesting. Do NOT use generic template questions.

Example of what to do:
- If user says "Create a customer feedback form", generate questions like: "How would you rate your experience?", "What did you like most?", "What can we improve?"
- If user says "Create an event registration form", generate questions like: "What is your name?", "Which event are you attending?", "What is your email?"
- If user says "Create a job application form", generate questions like: "What is your full name?", "What is your email?", "What is your phone number?", "What is your LinkedIn profile?", "Describe your experience"

NEVER use generic questions like "What is your full name?" for a feedback form. Always generate questions that make sense for the specific form type.

When users ask to create a form, YOU MUST use the create_form tool to generate the form with questions.
Do NOT ask users to manually create questions - use the tool to generate them automatically.

You can also help with:
- Analyzing form responses and generating insights
- Suggesting improvements to forms
- Creating forms based on user requirements
- Managing existing forms
- Exporting form data

Available tools:
1. create_form - Create a new form with questions from a description. IMPORTANT: Generate questions that are relevant to the form type!
2. list_forms - List all forms for the user (returns id, title, description, slug, createdAt, responseCount)
3. get_form - Get a specific form by ID or slug with all details
4. update_form - Update an existing form (title, description, questions, settings, theme)
5. delete_form - Delete a form and all its responses
6. get_form_responses - Get all responses for a specific form
7. get_all_responses - Get ALL responses from ALL forms for analytics
8. get_form_analytics - Get analytics for a specific form (total responses, completion rate, etc.)
9. duplicate_form - Duplicate an existing form
10. share_form - Generate shareable links for a form

User context: userId = ${userId}`,
    compaction_config: {
      compaction_instructions: "Summarize the form creation request and any questions generated.",
    },
  })
    .fold({
      name: "create_form",
      description: "Create a new form with questions. The AI generates questions RELEVANT to what the user requested. IMPORTANT: Don't use generic templates - generate questions that make sense for the specific form type.",
      inputSchema: z.object({
        title: z.string().describe("The title/name of the form"),
        description: z.string().describe("Detailed description of what the form is for"),
        questions: z.array(z.object({
          type: z.string().describe("Question type: text, textarea, number, email, date, checkbox, radio, select"),
          question: z.string().describe("The actual question text"),
          required: z.boolean().optional().describe("Whether the question is required"),
          options: z.array(z.string()).optional().describe("Options for checkbox, radio, select types"),
        })).describe("Array of questions to include in the form"),
      }),
      async do(input) {
        const questions = input.questions || [];
        
        const slug = generateSlug(input.title);
        
        const result = await db("forms")
          .insert({
            userId: userId,
            title: input.title,
            description: input.description,
            questions: JSON.stringify(questions),
            settings: JSON.stringify({
              collectEmail: true,
              showProgressBar: true,
              shuffleQuestions: false,
              limitResponses: false,
            }),
            theme: JSON.stringify({
              view: "list",
              color: "#025864",
              showPoweredBy: true,
            }),
            slug: slug,
          })
          .returning(["id", "slug"]);

        return {
          status: "success",
          data: {
            id: result[0].id,
            slug: result[0].slug,
            title: input.title,
            description: input.description,
            questions: questions,
            message: "Form created successfully! The questions were generated based on your description.",
          },
        };
      },
    })
    .fold({
      name: "list_forms",
      description: "List all forms created by the user.",
      inputSchema: z.object({}),
      async do() {
        const forms = await db("forms")
          .where("userId", userId)
          .orderBy("createdAt", "desc")
          .select("id", "title", "description", "slug", "createdAt");

        for (const form of forms) {
          const responses = await db("form_responses")
            .where("formId", form.id)
            .count("* as count")
            .first();
          form.responseCount = parseInt(responses?.count || 0);
          form.questions = typeof form.questions === "string" ? JSON.parse(form.questions) : form.questions;
        }

        return {
          status: "success",
          data: forms,
        };
      },
    })
    .fold({
      name: "get_form",
      description: "Get a specific form by ID or slug.",
      inputSchema: z.object({
        formId: z.string().optional(),
        slug: z.string().optional(),
      }),
      async do(input) {
        const form = await db("forms")
          .where("userId", userId)
          .where(input.formId ? "id" : "slug", input.formId || input.slug)
          .first();

        if (!form) {
          return { status: "error", message: "Form not found" };
        }

        const responses = await db("form_responses")
          .where("formId", form.id)
          .count("* as count")
          .first();

        form.responseCount = parseInt(responses?.count || 0);
        form.questions = typeof form.questions === "string" ? JSON.parse(form.questions) : form.questions;
        form.settings = typeof form.settings === "string" ? JSON.parse(form.settings) : form.settings;
        form.theme = typeof form.theme === "string" ? JSON.parse(form.theme) : form.theme;

        return {
          status: "success",
          data: form,
        };
      },
    })
    .fold({
      name: "update_form",
      description: "Update an existing form.",
      inputSchema: z.object({
        formId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        questions: z.array(z.any()).optional(),
      }),
      async do(input) {
        const existing = await db("forms")
          .where("id", input.formId)
          .where("userId", userId)
          .first();

        if (!existing) {
          return { status: "error", message: "Form not found" };
        }

        const updates = {};
        if (input.title) updates.title = input.title;
        if (input.description) updates.description = input.description;
        if (input.questions) updates.questions = JSON.stringify(input.questions);
        updates.updatedAt = new Date();

        await db("forms").where("id", input.formId).update(updates);

        return {
          status: "success",
          data: { message: "Form updated successfully", id: input.formId },
        };
      },
    })
    .fold({
      name: "delete_form",
      description: "Delete a form and all its responses.",
      inputSchema: z.object({
        formId: z.string(),
      }),
      async do(input) {
        const existing = await db("forms")
          .where("id", input.formId)
          .where("userId", userId)
          .first();

        if (!existing) {
          return { status: "error", message: "Form not found" };
        }

        await db("form_responses").where("formId", input.formId).del();
        await db("forms").where("id", input.formId).del();

        return {
          status: "success",
          data: { message: "Form deleted successfully" },
        };
      },
    })
    .fold({
      name: "get_form_responses",
      description: "Get all responses for a form.",
      inputSchema: z.object({
        formId: z.string(),
      }),
      async do(input) {
        const form = await db("forms")
          .where("id", input.formId)
          .where("userId", userId)
          .first();

        if (!form) {
          return { status: "error", message: "Form not found" };
        }

        const responses = await db("form_responses")
          .where("formId", input.formId)
          .orderBy("createdAt", "desc")
          .select("*");

        for (const response of responses) {
          response.answers = typeof response.answers === "string" ? JSON.parse(response.answers) : response.answers;
        }

        return {
          status: "success",
          data: {
            form: {
              id: form.id,
              title: form.title,
              questions: typeof form.questions === "string" ? JSON.parse(form.questions) : form.questions,
            },
            responses: responses,
          },
        };
      },
    })
    .fold({
      name: "get_all_responses",
      description: "Get ALL responses from ALL forms for comprehensive analytics.",
      inputSchema: z.object({}),
      async do() {
        const forms = await db("forms")
          .where("userId", userId)
          .orderBy("createdAt", "desc")
          .select("id", "title", "slug");

        const allResponses = [];
        
        for (const form of forms) {
          const responses = await db("form_responses")
            .where("formId", form.id)
            .orderBy("createdAt", "desc")
            .select("id", "email", "createdAt");
          
          for (const response of responses) {
            response.answers = typeof response.answers === "string" ? JSON.parse(response.answers) : response.answers;
            response.formTitle = form.title;
            response.formSlug = form.slug;
          }
          
          allResponses.push(...responses);
        }

        return {
          status: "success",
          data: {
            totalForms: forms.length,
            totalResponses: allResponses.length,
            responses: allResponses,
          },
        };
      },
    })
    .fold({
      name: "get_form_analytics",
      description: "Get analytics for a specific form including response stats.",
      inputSchema: z.object({
        formId: z.string().optional(),
        slug: z.string().optional(),
      }),
      async do(input) {
        const form = await db("forms")
          .where("userId", userId)
          .where(input.formId ? "id" : "slug", input.formId || input.slug)
          .first();

        if (!form) {
          return { status: "error", message: "Form not found" };
        }

        const responses = await db("form_responses")
          .where("formId", form.id)
          .select("id", "email", "createdAt");

        const totalResponses = responses.length;
        const uniqueEmails = new Set(responses.filter(r => r.email).map(r => r.email)).size;
        
        const recentResponses = responses
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);

        const questions = typeof form.questions === "string" ? JSON.parse(form.questions) : form.questions;
        
        return {
          status: "success",
          data: {
            form: {
              id: form.id,
              title: form.title,
              slug: form.slug,
              totalQuestions: questions?.length || 0,
            },
            analytics: {
              totalResponses,
              uniqueEmails,
              completionRate: questions?.length > 0 ? Math.round((totalResponses / Math.max(questions.length, 1)) * 100) : 0,
              recentResponses: recentResponses.map(r => ({
                id: r.id,
                submittedAt: r.createdAt,
              })),
            },
          },
        };
      },
    })
    .fold({
      name: "duplicate_form",
      description: "Duplicate an existing form with a new title.",
      inputSchema: z.object({
        formId: z.string().optional(),
        slug: z.string().optional(),
        newTitle: z.string().optional(),
      }),
      async do(input) {
        const form = await db("forms")
          .where("userId", userId)
          .where(input.formId ? "id" : "slug", input.formId || input.slug)
          .first();

        if (!form) {
          return { status: "error", message: "Form not found" };
        }

        const newTitle = input.newTitle || `${form.title} (Copy)`;
        const newSlug = generateSlug(newTitle);

        const result = await db("forms")
          .insert({
            userId: userId,
            title: newTitle,
            description: form.description,
            questions: form.questions,
            settings: form.settings,
            theme: form.theme,
            slug: newSlug,
          })
          .returning(["id", "slug"]);

        return {
          status: "success",
          data: {
            id: result[0].id,
            slug: result[0].slug,
            title: newTitle,
            message: "Form duplicated successfully!",
          },
        };
      },
    })
    .fold({
      name: "share_form",
      description: "Generate shareable links for a form.",
      inputSchema: z.object({
        formId: z.string().optional(),
        slug: z.string().optional(),
      }),
      async do(input) {
        const form = await db("forms")
          .where("userId", userId)
          .where(input.formId ? "id" : "slug", input.formId || input.slug)
          .first();

        if (!form) {
          return { status: "error", message: "Form not found" };
        }

        const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const publicUrl = `${baseUrl}/forms/public/${form.slug}`;
        const embedCode = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0"></iframe>`;

        return {
          status: "success",
          data: {
            form: {
              id: form.id,
              title: form.title,
              slug: form.slug,
            },
            links: {
              public: publicUrl,
              embed: embedCode,
            },
          },
        };
      },
    })
    .build();

  return agent;
};

export const processAgentRequest = async (userId, message,AbortSignal) => {
  const agent = createFormAgent(userId);
  const result = await agent.processRequest(message, AbortSignal);
  return result;
};