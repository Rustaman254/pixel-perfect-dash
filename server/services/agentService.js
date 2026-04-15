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
    systemPrompt: `You are a forms expert AI assistant. Your role is to help users create forms with questions.
    
When users ask to create a form, YOU MUST use the create_form tool to generate the form with questions.
Do NOT ask users to manually create questions - use the tool to generate them automatically.

Guidelines:
- Ask clarifying questions to understand the form's purpose
- Generate appropriate questions based on the form description
- Questions should be relevant to the business context
- Return the full form JSON structure that can be saved directly

Available tools:
1. create_form - Create a form with questions from a description
2. list_forms - List all forms for the user
3. get_form - Get a specific form by ID
4. update_form - Update an existing form
5. delete_form - Delete a form

User context: userId = ${userId}`,
    compaction_config: {
      compaction_instructions: "Summarize the form creation request and any questions generated.",
    },
  })
    .fold({
      name: "create_form",
      description: "Create a new form with questions. The AI generates questions based on the form description.",
      inputSchema: z.object({
        title: z.string().describe("The title/ name of the form"),
        description: z.string().describe("Detailed description of what the form is for"),
        questionCount: z.number().optional().default(5).describe("Approximate number of questions to generate"),
        questionTypes: z.array(z.string()).optional().describe("Types of questions: text, textarea, number, email, date, checkbox, radio, select"),
      }),
      async do(input) {
        const questionTypes = input.questionTypes || ["text", "textarea", "number", "radio", "select"];
        
        const questions = [];
        const questionTemplates = {
          text: [
            "What is your full name?",
            "What is the name of your business?",
            "What is your address?",
            "What is the product name?",
            "What service are you interested in?",
            "Describe your experience",
            "What is your preferred contact method?",
          ],
          textarea: [
            "Please describe your requirements in detail",
            "What are your goals for this project?",
            "Tell us about your experience with our service",
            "What feedback do you have?",
            "Describe the issue you are experiencing",
          ],
          number: [
            "What is your budget?",
            "How many employees do you have?",
            "What is your order quantity?",
            "How many items do you need?",
            "What is the expected delivery timeframe (in days)?",
          ],
          email: [
            "What is your email address?",
            "What is your business email?",
            "Where should we send the confirmation?",
          ],
          date: [
            "When do you need this by?",
            "What is your preferred date?",
            "When should we schedule the appointment?",
          ],
          checkbox: [
            "Which services are you interested in? (Select all that apply)",
            "What are your preferred contact methods?",
            "Which features would you like to enable?",
          ],
          radio: [
            "How would you rate our service?",
            "What is your priority level?",
            "Which plan would you like to choose?",
            "How did you hear about us?",
          ],
          select: [
            "What is your country?",
            "What is your business type?",
            "Which department are you in?",
            "What is your preferred language?",
          ],
        };

        const numQuestions = Math.min(input.questionCount || 5, 10);
        
        for (let i = 0; i < numQuestions; i++) {
          const availableTypes = questionTypes.filter(t => questionTemplates[t]?.length > 0);
          const typeIndex = i % availableTypes.length;
          const questionType = availableTypes[typeIndex] || "text";
          const templateQuestions = questionTemplates[questionType];
          const templateIndex = i % templateQuestions.length;
          
          const questionText = templateQuestions[templateIndex] || `Question ${i + 1}`;
          
          const question = {
            id: `q_${uuidv4().substring(0, 8)}`,
            type: questionType,
            question: questionText,
            required: i < 2,
            description: "",
            options: (questionType === "checkbox" || questionType === "radio" || questionType === "select") 
              ? ["Option 1", "Option 2", "Option 3"] 
              : undefined,
          };
          questions.push(question);
        }

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
    .build();

  return agent;
};

export const processAgentRequest = async (userId, message,AbortSignal) => {
  const agent = createFormAgent(userId);
  const result = await agent.processRequest(message, AbortSignal);
  return result;
};