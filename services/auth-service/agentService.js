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

FORMS (create forms, see responses):
- create_form: Create a new form (needs title)
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

Always call the right tool when user asks. Example:
- "show my payment links" -> list_payment_links
- "create a link for 500" -> create_payment_link with price=500
- "show my transactions" -> list_transactions

User: userId=${userId}`,
    compaction_config: { compaction_instructions: "Quick summary." },
  })

  // === FORMS ===
  .fold({
    name: "create_form",
    description: "Create a new form",
    inputSchema: z.object({ title: z.string(), description: z.string().optional() }),
    async do(input) {
      // Generate contextual questions based on form title
      const titleLower = input.title.toLowerCase();
      let questions = [];
      
      // Feedback forms
      if (titleLower.includes("feedback") || titleLower.includes("review")) {
        questions = [
          { id: uuidv4().substr(0, 8), type: "text", question: "What is your name?", required: true },
          { id: uuidv4().substr(0, 8), type: "email", question: "What is your email address?", required: true },
          { id: uuidv4().substr(0, 8), type: "radio", question: "How satisfied are you with our service?", required: true, options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied"] },
          { id: uuidv4().substr(0, 8), type: "textarea", question: "What did you like most about our service?", required: false },
          { id: uuidv4().substr(0, 8), type: "textarea", question: "What could we improve?", required: false },
          { id: uuidv4().substr(0, 8), type: "checkbox", question: "Would you recommend us to others?", required: false, options: ["Yes", "No", "Maybe"] },
        ];
      }
      // Contact forms
      else if (titleLower.includes("contact")) {
        questions = [
          { id: uuidv4().substr(0, 8), type: "text", question: "Your Full Name", required: true },
          { id: uuidv4().substr(0, 8), type: "email", question: "Your Email Address", required: true },
          { id: uuidv4().substr(0, 8), type: "text", question: "Subject", required: true },
          { id: uuidv4().substr(0, 8), type: "textarea", question: "Your Message", required: true },
          { id: uuidv4().substr(0, 8), type: "select", question: "How did you hear about us?", required: false, options: ["Google", "Social Media", "Friend", "Other"] },
        ];
      }
      // Application forms
      else if (titleLower.includes("application") || titleLower.includes("apply")) {
        questions = [
          { id: uuidv4().substr(0, 8), type: "text", question: "Full Name", required: true },
          { id: uuidv4().substr(0, 8), type: "email", question: "Email Address", required: true },
          { id: uuidv4().substr(0, 8), type: "text", question: "Phone Number", required: true },
          { id: uuidv4().substr(0, 8), type: "select", question: "Position applied for", required: true, options: ["Sales", "Marketing", "Support", "Developer"] },
          { id: uuidv4().substr(0, 8), type: "textarea", question: "Tell us about yourself and why you fit this role", required: true },
        ];
      }
      // Survey forms
      else if (titleLower.includes("survey")) {
        questions = [
          { id: uuidv4().substr(0, 8), type: "text", question: "Your Name (optional)", required: false },
          { id: uuidv4().substr(0, 8), type: "email", question: "Your Email (optional)", required: false },
          { id: uuidv4().substr(0, 8), type: "radio", question: "How often do you use our product?", required: true, options: ["Daily", "Weekly", "Monthly", "Rarely"] },
          { id: uuidv4().substr(0, 8), type: "checkbox", question: "Which features do you use most?", required: false, options: ["Dashboard", "Reports", "Analytics", "Export"] },
          { id: uuidv4().substr(0, 8), type: "number", question: "How many years of experience do you have?", required: false },
          { id: uuidv4().substr(0, 8), type: "textarea", question: "Any additional comments?", required: false },
        ];
      }
      // Order / Purchase
      else if (titleLower.includes("order") || titleLower.includes("purchase") || titleLower.includes("buy")) {
        questions = [
          { id: uuidv4().substr(0, 8), type: "text", question: "Full Name", required: true },
          { id: uuidv4().substr(0, 8), type: "email", question: "Email Address", required: true },
          { id: uuidv4().substr(0, 8), type: "text", question: "Phone Number", required: true },
          { id: uuidv4().substr(0, 8), type: "text", question: "Delivery Address", required: true },
          { id: uuidv4().substr(0, 8), type: "textarea", question: "Special instructions (optional)", required: false },
        ];
      }
      // RSVP / Event
      else if (titleLower.includes("rsvp") || titleLower.includes("event")) {
        questions = [
          { id: uuidv4().substr(0, 8), type: "text", question: "Your Full Name", required: true },
          { id: uuidv4().substr(0, 8), type: "email", question: "Email Address", required: true },
          { id: uuidv4().substr(0, 8), type: "radio", question: "Will you attend?", required: true, options: ["Yes, Attending", "No, Not Attending", "Maybe"] },
          { id: uuidv4().substr(0, 8), type: "number", question: "Number of guests", required: false },
          { id: uuidv4().substr(0, 8), type: "textarea", question: "Any dietary requirements?", required: false },
        ];
      }
      // Default generic form
      else {
        questions = [
          { id: uuidv4().substr(0, 8), type: "text", question: "What is your name?", required: true },
          { id: uuidv4().substr(0, 8), type: "email", question: "What is your email?", required: true },
          { id: uuidv4().substr(0, 8), type: "text", question: "Your Phone (optional)", required: false },
          { id: uuidv4().substr(0, 8), type: "textarea", question: "Your message or feedback?", required: false },
        ];
      }
      
      const authDb = createConnection("auth_db");
      const slug = generateSlug(input.title);
      const result = await authDb("forms").insert({
        userId,
        title: input.title,
        description: input.description || "",
        questions: JSON.stringify(questions),
        settings: JSON.stringify({ collectEmail: true, showProgressBar: true }),
        theme: JSON.stringify({ view: "list", color: "#025864" }),
        slug
      }).returning(["id", "slug", "title"]);
      
      return { status: "success", data: { ...result[0], questionsCount: questions.length, type: "form" } };
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