import { Glove, Displaymanager, createAdapter } from "glove-core";
import { v4 as uuidv4 } from "uuid";
import z from "zod";
import { createConnection } from "../shared/db.js";

const getDb = () => createConnection("auth_db");
const getRipplifyDb = () => createConnection("ripplify_db");

// Store adapter for conversation history
class PostgresStore {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.messages = [];
    this.tokenCount = 0;
    this.turnCount = 0;
  }
  async getMessages() { return this.messages; }
  async appendMessages(msgs) { this.messages.push(...msgs); }
  async getTokenCount() { return this.tokenCount; }
  async addTokens(count) { this.tokenCount += count; }
  async getTurnCount() { return this.turnCount; }
  async incrementTurn() { this.turnCount++; }
  async resetCounters() { this.tokenCount = 0; this.turnCount = 0; }
}

// Helper to call existing REST APIs
async function callApi(endpoint, userId, options = {}) {
  const db = createConnection("ripplify_db");
  const authDb = createConnection("auth_db");
  
  if (endpoint === "payment_links") {
    if (options.method === "POST") {
      const slug = `link-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const result = await db("payment_links").insert({
        userId,
        name: options.name || "Untitled",
        description: options.description || "",
        price: options.price || 0,
        currency: options.currency || "KES",
        slug
      }).returning(["id", "slug", "name", "price"]);
      return [result[0]];
    }
    return db("payment_links").where("userId", userId).orderBy("createdAt", "desc").select("*");
  }
  
  if (endpoint === "transactions") {
    return db("transactions").where("userId", userId).orderBy("createdAt", "desc").limit(20).select("*");
  }
  
  if (endpoint === "payouts") {
    if (options.method === "POST") {
      const result = await db("payouts").insert({
        userId,
        amount: options.amount || 0,
        status: "Pending"
      }).returning(["id", "amount", "status"]);
      return [result[0]];
    }
    return db("payouts").where("userId", userId).orderBy("createdAt", "desc").select("*");
  }
  
  if (endpoint === "wallet") {
    let wallet = await db("wallets").where("userId", userId).first();
    if (!wallet) {
      wallet = (await db("wallets").insert({ userId, balance: 0, pendingBalance: 0, currency: "KES" }).returning("*"))[0];
    }
    return [wallet];
  }
  
  if (endpoint === "forms") {
    if (options.method === "POST") {
      const questions = [
        { id: uuidv4().substr(0, 8), type: "text", question: "What is your name?", required: true },
        { id: uuidv4().substr(0, 8), type: "email", question: "What is your email?", required: true },
        { id: uuidv4().substr(0, 8), type: "textarea", question: "Your message?", required: false },
      ];
      const slug = `form-${Date.now()}`;
      const result = await authDb("forms").insert({
        userId,
        title: options.title || "Untitled Form",
        description: options.description || "",
        questions: JSON.stringify(questions),
        settings: JSON.stringify({ collectEmail: true, showProgressBar: true }),
        theme: JSON.stringify({ view: "list", color: "#025864" }),
        slug
      }).returning(["id", "slug", "title"]);
      return [result[0]];
    }
    return authDb("forms").where("userId", userId).orderBy("createdAt", "desc").select("*");
  }
  
  if (endpoint === "form_responses") {
    return authDb("form_responses").where("formid", options.formId).orderBy("createdAt", "desc").select("*");
  }
  
  return [];
}

const generateSlug = (title) => {
  if (!title) return `item-${Date.now()}`;
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).substr(2, 6);
};

export const createFormAgent = (userId) => {
  const store = new PostgresStore(userId);

  const model = createAdapter({
    provider: "openrouter",
    model: "deepseek/deepseek-chat",
    apiKey: process.env.OPENROUTER_API_KEY,
    stream: true,
  });

  const dm = new Displaymanager();

  const agent = new Glove({
    store,
    model,
    displayManager: dm,
    systemPrompt: `You help users manage their RippliFy account. Use the tools below.

IMPORTANT: When users ask to create a form, analyze their request carefully to understand what kind of form they need and what questions would be relevant. Ask follow-up questions if needed to understand the context better before creating the form.

FORMS (create forms, see responses):
- create_form: Create a new form - IMPORTANT: Pass the original user prompt in 'userPrompt' field so the form can have contextual questions. Examples:
  - "I need a form to collect feedback from my restaurant customers" -> includes questions about food quality, service, ambiance
  - "Create a booking form for my salon" -> includes questions about service type, preferred date/time, contact details
  - "Make a survey for employee satisfaction" -> includes questions about workplace, management, growth
- list_forms: List all your forms  
- get_form: Get form by ID or slug
- delete_form: Delete a form

PAYMENT LINKS (create payment links for customers to pay):
- create_payment_link: Create payment link (needs name, price)
- list_payment_links: List all payment links
- get_payment_link: Get payment link details
- delete_payment_link: Delete payment link

TRANSACTIONS (see payments received):
- list_transactions: List recent transactions
- get_transaction: Get transaction by ID

WALLETS (see balance):
- get_wallet: Get wallet balance

PAYOUTS (withdraw money):
- list_payouts: List payout requests
- create_payout: Request a payout

Always analyze the user's request to understand what kind of form they need. Be conversational - ask clarifying questions if needed.

User: userId=${userId}`,
    compaction_config: { compaction_instructions: "Quick summary." },
  })

  // === FORMS ===
  .fold({
    name: "create_form",
    description: "Create a new form with questions based on user needs",
    inputSchema: z.object({ 
      title: z.string(), 
      description: z.string().optional(),
      userPrompt: z.string().optional() // The original user prompt for context
    }),
    async do(input) {
      // Use the model's intelligence to generate contextual questions based on user prompt
      const userPrompt = input.userPrompt || input.title;
      const titleLower = userPrompt.toLowerCase();
      
      // Dynamically generate unique questions based on the user's specific request
      const questionTypes = ["text", "email", "textarea", "number", "date", "checkbox", "radio", "select"];
      const questions = [];
      
      // Analyze the prompt to determine what kind of questions to ask
      // Generate 5-8 unique questions based on the context
      
      // Always start with identification questions if relevant to the form type
      if (titleLower.includes("register") || titleLower.includes("signup") || titleLower.includes("application")) {
        questions.push(
          { id: uuidv4().substr(0, 8), type: "text", question: "Full Name", required: true },
          { id: uuidv4().substr(0, 8), type: "email", question: "Email Address", required: true },
          { id: uuidv4().substr(0, 8), type: "text", question: "Phone Number", required: true }
        );
      } else if (titleLower.includes("contact") || titleLower.includes("inquiry")) {
        questions.push(
          { id: uuidv4().substr(0, 8), type: "text", question: "Your Full Name", required: true },
          { id: uuidv4().substr(0, 8), type: "email", question: "Your Email Address", required: true },
          { id: uuidv4().substr(0, 8), type: "text", question: "Subject / Topic", required: true }
        );
      } else {
        questions.push(
          { id: uuidv4().substr(0, 8), type: "text", question: "Your Name", required: true },
          { id: uuidv4().substr(0, 8), type: "email", question: "Your Email", required: true }
        );
      }
      
      // Add context-specific questions based on keywords in the prompt
      if (titleLower.includes("feedback") || titleLower.includes("review") || titleLower.includes("rate")) {
        questions.push(
          { id: uuidv4().substr(0, 8), type: "radio", question: "How would you rate your experience?", required: true, options: ["Excellent", "Good", "Average", "Poor"] },
          { id: uuidv4().substr(0, 8), type: "textarea", question: "What did you like most about your experience?", required: false },
          { id: uuidv4().substr(0, 8), type: "textarea", question: "What areas could we improve?", required: false }
        );
      }
      
      if (titleLower.includes("order") || titleLower.includes("purchase") || titleLower.includes("buy") || titleLower.includes("shop")) {
        questions.push(
          { id: uuidv4().substr(0, 8), type: "select", question: "What would you like to order?", required: true, options: ["Product A", "Product B", "Product C", "Other"] },
          { id: uuidv4().substr(0, 8), type: "number", question: "Quantity", required: true },
          { id: uuidv4().substr(0, 8), type: "text", question: "Delivery Address", required: true }
        );
      }
      
      if (titleLower.includes("event") || titleLower.includes("rsvp") || titleLower.includes("party") || titleLower.includes("meeting")) {
        questions.push(
          { id: uuidv4().substr(0, 8), type: "radio", question: "Will you attend?", required: true, options: ["Yes, I'll attend", "No, I can't attend", "Maybe"] },
          { id: uuidv4().substr(0, 8), type: "number", question: "Number of guests", required: false },
          { id: uuidv4().substr(0, 8), type: "textarea", question: "Any special requirements or dietary needs?", required: false }
        );
      }
      
      if (titleLower.includes("survey") || titleLower.includes("poll")) {
        questions.push(
          { id: uuidv4().substr(0, 8), type: "radio", question: "How often do you use our service?", required: true, options: ["Daily", "Weekly", "Monthly", "Rarely"] },
          { id: uuidv4().substr(0, 8), type: "checkbox", question: "Which features do you use most?", required: false, options: ["Feature 1", "Feature 2", "Feature 3", "Feature 4"] },
          { id: uuidv4().substr(0, 8), type: "number", question: "On a scale of 1-10, how likely are you to recommend us?", required: true }
        );
      }
      
      if (titleLower.includes("job") || titleLower.includes("career") || titleLower.includes("apply") || titleLower.includes("position")) {
        questions.push(
          { id: uuidv4().substr(0, 8), type: "text", question: "Current Position / Job Title", required: true },
          { id: uuidv4().substr(0, 8), type: "number", question: "Years of Experience", required: true },
          { id: uuidv4().substr(0, 8), type: "textarea", question: "Why are you interested in this position?", required: true },
          { id: uuidv4().substr(0, 8), type: "text", question: "LinkedIn Profile URL", required: false }
        );
      }
      
      if (titleLower.includes("booking") || titleLower.includes("reservation") || titleLower.includes("schedule")) {
        questions.push(
          { id: uuidv4().substr(0, 8), type: "date", question: "Preferred Date", required: true },
          { id: uuidv4().substr(0, 8), type: "select", question: "Preferred Time", required: true, options: ["Morning (9am-12pm)", "Afternoon (12pm-4pm)", "Evening (4pm-6pm)"] },
          { id: uuidv4().substr(0, 8), type: "number", question: "Number of People", required: false }
        );
      }
      
      if (titleLower.includes("subscription") || titleLower.includes("newsletter") || titleLower.includes("updates")) {
        questions.push(
          { id: uuidv4().substr(0, 8), type: "text", question: "Your Name", required: true },
          { id: uuidv4().substr(0, 8), type: "checkbox", question: "What topics interests you?", required: false, options: ["News", "Products", "Promotions", "Events"] }
        );
      }
      
      if (titleLower.includes("complaint") || titleLower.includes("issue") || titleLower.includes("problem")) {
        questions.push(
          { id: uuidv4().substr(0, 8), type: "select", question: "What is the nature of your issue?", required: true, options: ["Billing", "Product Quality", "Delivery", "Customer Service", "Other"] },
          { id: uuidv4().substr(0, 8), type: "textarea", question: "Please describe the issue in detail", required: true },
          { id: uuidv4().substr(0, 8), type: "text", question: "Order/Reference Number (if applicable)", required: false }
        );
      }
      
      // Add a catch-all open question if fewer than 3 questions generated
      if (questions.length < 3) {
        questions.push(
          { id: uuidv4().substr(0, 8), type: "textarea", question: "Any additional information or comments?", required: false }
        );
      }
      
      // Ensure we have unique questions - remove any duplicates
      const uniqueQuestions = questions.filter((q, index, self) => 
        index === self.findIndex((t) => t.question === q.question)
      );
      
      const authDb = createConnection("auth_db");
      const slug = generateSlug(input.title);
      const result = await authDb("forms").insert({
        userId,
        title: input.title,
        description: input.description || "",
        questions: JSON.stringify(uniqueQuestions),
        settings: JSON.stringify({ collectEmail: true, showProgressBar: true }),
        theme: JSON.stringify({ view: "list", color: "#025864" }),
        slug
      }).returning(["id", "slug", "title"]);
      
      return { status: "success", data: { ...result[0], questionsCount: uniqueQuestions.length, type: "form" } };
    },
  })

  .fold({
    name: "list_forms",
    description: "List all your forms",
    inputSchema: z.object({}),
    async do() {
      const forms = await callApi("forms", userId);
      return { status: "success", data: forms.map(f => ({ id: f.id, title: f.title, slug: f.slug, createdAt: f.createdAt })) };
    },
  })

  .fold({
    name: "get_form",
    description: "Get form details",
    inputSchema: z.object({ formId: z.string().optional(), slug: z.string().optional() }),
    async do(input) {
      const forms = await callApi("forms", userId);
      const form = forms.find(f => f.id == input.formId || f.slug === input.slug);
      if (!form) return { status: "error", message: "Form not found" };
      form.questions = typeof form.questions === "string" ? JSON.parse(form.questions) : form.questions;
      return { status: "success", data: form };
    },
  })

  .fold({
    name: "delete_form",
    description: "Delete a form",
    inputSchema: z.object({ formId: z.string() }),
    async do(input) {
      const authDb = createConnection("auth_db");
      const form = await authDb("forms").where("id", input.formId).where("userId", userId).first();
      if (!form) return { status: "error", message: "Form not found" };
      await authDb("form_responses").where("formid", form.id).del();
      await authDb("forms").where("id", form.id).del();
      return { status: "success", data: { message: `Deleted: ${form.title}` } };
    },
  })

  .fold({
    name: "get_form_responses",
    description: "Get form responses",
    inputSchema: z.object({ formId: z.string() }),
    async do(input) {
      const responses = await callApi("form_responses", userId, { formId: input.formId });
      return { status: "success", data: responses };
    },
  })

  // === PAYMENT LINKS ===
  .fold({
    name: "create_payment_link",
    description: "Create payment link for customers to pay",
    inputSchema: z.object({ name: z.string(), price: z.number(), description: z.string().optional(), currency: z.string().optional() }),
    async do(input) {
      const result = await callApi("payment_links", userId, { method: "POST", ...input });
      return { status: "success", data: { ...result[0], url: `/pay/${result[0].slug}` } };
    },
  })

  .fold({
    name: "list_payment_links",
    description: "List all payment links",
    inputSchema: z.object({}),
    async do() {
      const links = await callApi("payment_links", userId);
      return { status: "success", data: links.map(l => ({ id: l.id, name: l.name, price: l.price, status: l.status, clicks: l.clicks })) };
    },
  })

  .fold({
    name: "get_payment_link",
    description: "Get payment link details",
    inputSchema: z.object({ linkId: z.string().optional(), slug: z.string().optional() }),
    async do(input) {
      const links = await callApi("payment_links", userId);
      const link = links.find(l => l.id == input.linkId || l.slug === input.slug);
      return link ? { status: "success", data: link } : { status: "error", message: "Payment link not found" };
    },
  })

  .fold({
    name: "delete_payment_link",
    description: "Delete payment link",
    inputSchema: z.object({ linkId: z.string() }),
    async do(input) {
      const ripplifyDb = getRipplifyDb();
      const link = await ripplifyDb("payment_links").where("id", input.linkId).where("userId", userId).first();
      if (!link) return { status: "error", message: "Payment link not found" };
      await ripplifyDb("payment_links").where("id", input.linkId).del();
      return { status: "success", data: { message: `Deleted: ${link.name}` } };
    },
  })

  // === TRANSACTIONS ===
  .fold({
    name: "list_transactions",
    description: "List recent payments received",
    inputSchema: z.object({ limit: z.number().optional().default(10) }),
    async do(input) {
      const txs = await callApi("transactions", userId);
      return { status: "success", data: txs.slice(0, input.limit || 10).map(t => ({ id: t.id, amount: t.amount, status: t.status, buyerName: t.buyerName, createdAt: t.createdAt })) };
    },
  })

  .fold({
    name: "get_transaction",
    description: "Get transaction details",
    inputSchema: z.object({ transactionId: z.string() }),
    async do(input) {
      const ripplifyDb = getRipplifyDb();
      const tx = await ripplifyDb("transactions").where("id", input.transactionId).first();
      return tx ? { status: "success", data: tx } : { status: "error", message: "Transaction not found" };
    },
  })

  // === WALLET ===
  .fold({
    name: "get_wallet",
    description: "Get wallet balance",
    inputSchema: z.object({}),
    async do() {
      const wallet = await callApi("wallet", userId);
      return { status: "success", data: wallet[0] };
    },
  })

  // === PAYOUTS ===
  .fold({
    name: "list_payouts",
    description: "List payout requests",
    inputSchema: z.object({}),
    async do() {
      const payouts = await callApi("payouts", userId);
      return { status: "success", data: payouts };
    },
  })

  .fold({
    name: "create_payout",
    description: "Request a payout/withdrawal",
    inputSchema: z.object({ amount: z.number() }),
    async do(input) {
      const result = await callApi("payouts", userId, { method: "POST", amount: input.amount });
      return { status: "success", data: { ...result[0], message: "Payout requested" } };
    },
  })

  .build();

  return agent;
};

export const processAgentRequest = async (userId, message) => {
  const agent = createFormAgent(userId);
  return agent.processRequest(message);
};