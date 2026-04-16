import { Glove, Displaymanager, createAdapter } from "glove-core";
import { v4 as uuidv4 } from "uuid";
import z from "zod";
import { createConnection } from "../shared/db.js";

const getAuthDb = () => createConnection("auth_db");
const getRipplifyDb = () => createConnection("ripplify_db");
const getShopalizeDb = () => createConnection("shopalize_db");
const getWatchtowerDb = () => createConnection("watchtower_db");

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

const generateSlug = (title) => {
  if (!title) return `item-${Date.now()}`;
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).substr(2, 6);
};

const generateQuestionId = () => `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const generateQuestionsFromPrompt = (userPrompt) => {
  const titleLower = userPrompt.toLowerCase();
  const questions = [];
  
  // Check if user provided actual questions in their prompt (formatted list)
  // This handles cases where user pastes a full form with questions and options
  const lines = userPrompt.split('\n').filter(line => line.trim());
  const hasStructuredQuestions = lines.some(line => 
    line.includes('?') || 
    line.includes('Select all') || 
    line.includes('Select') ||
    /^[A-Z]/.test(line.trim()) // Starts with uppercase - likely a question
  );
  
  if (hasStructuredQuestions) {
    // Parse the user's provided questions
    let currentQuestion = null;
    let currentOptions = [];
    let currentRequired = true;
    let isCollectingOptions = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip section headers and empty lines
      if (!trimmed || trimmed.length < 2) continue;
      if (trimmed.endsWith(':') && !trimmed.includes('?')) continue;
      if (trimmed.length > 100 && !trimmed.includes('?')) continue; // Skip long non-question lines
      
      // Check if this is a new question (contains ?)
      if (trimmed.includes('?')) {
        // Save previous question if exists
        if (currentQuestion && currentQuestion.length > 0) {
          questions.push({
            id: generateQuestionId(),
            type: currentOptions.length > 0 ? (currentOptions.length > 3 ? 'checkbox' : 'radio') : 'text',
            question: currentQuestion,
            required: currentRequired,
            options: currentOptions.length > 0 ? currentOptions : undefined
          });
        }
        
        // Start new question
        currentQuestion = trimmed;
        currentOptions = [];
        currentRequired = true;
        isCollectingOptions = true;
      } else if (isCollectingOptions && currentQuestion) {
        // This is an option for the current question
        // Options can be: with/without dash, or short lines after the question
        const option = trimmed.replace(/^[-\d.)]+\.?\s*/, '').replace(/^[•]\s*/, '');
        
        // Skip if it's a new section header (ends with :)
        if (trimmed.endsWith(':') || trimmed.length > 60) {
          isCollectingOptions = false;
          continue;
        }
        
        // If it's a valid option (short, not a question)
        if (option.length > 0 && option.length < 60) {
          currentOptions.push(option);
        }
      }
    }
    
    // Don't forget the last question
    if (currentQuestion) {
      questions.push({
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: currentOptions.length > 0 ? (currentOptions.length > 3 ? 'checkbox' : 'radio') : 'text',
        question: currentQuestion,
        required: currentRequired,
        options: currentOptions.length > 0 ? currentOptions : undefined
      });
    }
    
    // If we successfully parsed questions, return them
    if (questions.length > 3) {
      return questions;
    }
  }
  
  // Fallback to keyword-based generation for simple prompts
  if (titleLower.includes("register") || titleLower.includes("signup") || titleLower.includes("application")) {
    questions.push(
      { id: generateQuestionId(), type: "text", question: "Full Name", required: true },
      { id: generateQuestionId(), type: "email", question: "Email Address", required: true },
      { id: generateQuestionId(), type: "text", question: "Phone Number", required: true }
    );
  } else if (titleLower.includes("contact") || titleLower.includes("inquiry")) {
    questions.push(
      { id: generateQuestionId(), type: "text", question: "Your Full Name", required: true },
      { id: generateQuestionId(), type: "email", question: "Your Email Address", required: true },
      { id: generateQuestionId(), type: "text", question: "Subject / Topic", required: true }
    );
  } else {
    questions.push(
      { id: generateQuestionId(), type: "text", question: "Your Name", required: true },
      { id: generateQuestionId(), type: "email", question: "Your Email", required: true }
    );
  }
  
  if (titleLower.includes("feedback") || titleLower.includes("review") || titleLower.includes("rate")) {
    questions.push(
      { id: generateQuestionId(), type: "radio", question: "How would you rate your experience?", required: true, options: ["Excellent", "Good", "Average", "Poor"] },
      { id: generateQuestionId(), type: "textarea", question: "What did you like most?", required: false },
      { id: generateQuestionId(), type: "textarea", question: "What areas could we improve?", required: false }
    );
  }
  
  if (titleLower.includes("order") || titleLower.includes("purchase") || titleLower.includes("buy") || titleLower.includes("shop")) {
    questions.push(
      { id: generateQuestionId(), type: "select", question: "What would you like to order?", required: true, options: ["Product A", "Product B", "Product C", "Other"] },
      { id: generateQuestionId(), type: "number", question: "Quantity", required: true },
      { id: generateQuestionId(), type: "text", question: "Delivery Address", required: true }
    );
  }
  
  if (titleLower.includes("event") || titleLower.includes("rsvp") || titleLower.includes("party") || titleLower.includes("meeting")) {
    questions.push(
      { id: generateQuestionId(), type: "radio", question: "Will you attend?", required: true, options: ["Yes, I'll attend", "No, I can't attend", "Maybe"] },
      { id: generateQuestionId(), type: "number", question: "Number of guests", required: false },
      { id: generateQuestionId(), type: "textarea", question: "Any special requirements?", required: false }
    );
  }
  
  if (titleLower.includes("survey") || titleLower.includes("poll") || titleLower.includes("questionnaire")) {
    questions.push(
      { id: generateQuestionId(), type: "radio", question: "How often do you use our service?", required: true, options: ["Daily", "Weekly", "Monthly", "Rarely"] },
      { id: generateQuestionId(), type: "checkbox", question: "Which features do you use most?", required: false, options: ["Feature 1", "Feature 2", "Feature 3", "Feature 4"] },
      { id: generateQuestionId(), type: "number", question: "On a scale of 1-10, how likely are you to recommend us?", required: true },
      { id: generateQuestionId(), type: "select", question: "What is your primary goal?", required: false, options: ["Personal", "Business", "Education", "Other"] },
      { id: generateQuestionId(), type: "textarea", question: "What improvements would you like to see?", required: false },
      { id: generateQuestionId(), type: "textarea", question: "Any additional comments?", required: false }
    );
  }
  
  if (titleLower.includes("job") || titleLower.includes("career") || titleLower.includes("apply") || titleLower.includes("position")) {
    questions.push(
      { id: generateQuestionId(), type: "text", question: "Current Position / Job Title", required: true },
      { id: generateQuestionId(), type: "number", question: "Years of Experience", required: true },
      { id: generateQuestionId(), type: "textarea", question: "Why are you interested in this position?", required: true },
      { id: generateQuestionId(), type: "text", question: "LinkedIn Profile URL", required: false }
    );
  }
  
  if (titleLower.includes("booking") || titleLower.includes("reservation") || titleLower.includes("schedule")) {
    questions.push(
      { id: generateQuestionId(), type: "date", question: "Preferred Date", required: true },
      { id: generateQuestionId(), type: "select", question: "Preferred Time", required: true, options: ["Morning (9am-12pm)", "Afternoon (12pm-4pm)", "Evening (4pm-6pm)"] },
      { id: generateQuestionId(), type: "number", question: "Number of People", required: false }
    );
  }
  
  if (titleLower.includes("restaurant") || titleLower.includes("food") || titleLower.includes("meal") || titleLower.includes("dining")) {
    questions.push(
      { id: generateQuestionId(), type: "select", question: "How was the food quality?", required: true, options: ["Excellent", "Good", "Average", "Poor"] },
      { id: generateQuestionId(), type: "select", question: "How was the service?", required: true, options: ["Excellent", "Good", "Average", "Poor"] },
      { id: generateQuestionId(), type: "radio", question: "Would you recommend us to a friend?", required: true, options: ["Definitely", "Probably", "Unlikely"] },
      { id: generateQuestionId(), type: "textarea", question: "Any specific feedback on your meal?", required: false }
    );
  }
  
  if (titleLower.includes("hotel") || titleLower.includes("accommodation") || titleLower.includes("stay")) {
    questions.push(
      { id: generateQuestionId(), type: "date", question: "Check-in Date", required: true },
      { id: generateQuestionId(), type: "date", question: "Check-out Date", required: true },
      { id: generateQuestionId(), type: "number", question: "Number of Guests", required: true },
      { id: generateQuestionId(), type: "select", question: "Room Type", required: true, options: ["Standard", "Deluxe", "Suite", "Family"] },
      { id: generateQuestionId(), type: "textarea", question: "Special Requests", required: false }
    );
  }
  
  if (titleLower.includes("quiz") || titleLower.includes("test") || titleLower.includes("exam")) {
    questions.push(
      { id: generateQuestionId(), type: "text", question: "Your Full Name", required: true },
      { id: generateQuestionId(), type: "email", question: "Email Address", required: true },
      { id: generateQuestionId(), type: "radio", question: "Question 1: [Add your question here]", required: true, options: ["Option A", "Option B", "Option C", "Option D"] }
    );
  }
  
  if (titleLower.includes("support") || titleLower.includes("help") || titleLower.includes("ticket")) {
    questions.push(
      { id: generateQuestionId(), type: "text", question: "Your Name", required: true },
      { id: generateQuestionId(), type: "email", question: "Email Address", required: true },
      { id: generateQuestionId(), type: "select", question: "Issue Category", required: true, options: ["Technical", "Billing", "General Inquiry", "Feature Request"] },
      { id: generateQuestionId(), type: "textarea", question: "Describe your issue in detail", required: true },
      { id: generateQuestionId(), type: "text", question: "Order/Reference Number (if applicable)", required: false }
    );
  }
  
  if (titleLower.includes("lead") || titleLower.includes("contact") || titleLower.includes("get in touch")) {
    questions.push(
      { id: generateQuestionId(), type: "text", question: "Full Name", required: true },
      { id: generateQuestionId(), type: "email", question: "Email Address", required: true },
      { id: generateQuestionId(), type: "text", question: "Company Name", required: false },
      { id: generateQuestionId(), type: "text", question: "Phone Number", required: false },
      { id: generateQuestionId(), type: "textarea", question: "How can we help you?", required: true }
    );
  }
  
  if (titleLower.includes("product") && (titleLower.includes("review") || titleLower.includes("rating"))) {
    questions.push(
      { id: generateQuestionId(), type: "text", question: "Your Name", required: true },
      { id: generateQuestionId(), type: "email", question: "Email Address", required: true },
      { id: generateQuestionId(), type: "select", question: "Overall Rating", required: true, options: ["5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star"] },
      { id: generateQuestionId(), type: "textarea", question: "What did you like about the product?", required: false },
      { id: generateQuestionId(), type: "textarea", question: "What could be improved?", required: false }
    );
  }
  
  if (questions.length < 3) {
    questions.push(
      { id: generateQuestionId(), type: "textarea", question: "Any additional information or comments?", required: false }
    );
  }
  
  return questions.filter((q, index, self) => index === self.findIndex((t) => t.question === q.question));
};

export const createUnifiedAgent = (userId, context = {}) => {
  const store = new PostgresStore(userId);
  const { formId, currentForm } = context;

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
    systemPrompt: `You are the Sokostack AI Assistant. You help users manage ALL their products in the Sokostack ecosystem.

SOKOSTACK PRODUCTS:
1. RippliFy - Payment links, transactions, wallets, payouts
2. Shopalize - E-commerce store builder with products, orders, customers
3. Watchtower - Analytics and visitor tracking
4. Forms - Form builder for collecting responses

IMPORTANT SECURITY RULES:
- You MUST only return data that belongs to the current user (userId=${userId})
- NEVER show data from other users - always filter by userId
- When listing items, use userId=${userId} to filter
- Never reveal information about other users

IMPORTANT: When users ask to create a form, YOU MUST generate questions that are RELEVANT to what the user is requesting. Do NOT use generic template questions.

Example of what to do:
- If user says "Create a customer feedback form", generate questions like: "How would you rate your experience?", "What did you like most?", "What can we improve?"
- If user says "Create an event registration form", generate questions like: "What is your name?", "Which event are you attending?", "What is your email?"
- If user says "Create a job application form", generate questions like: "What is your full name?", "What is your email?", "What is your phone number?", "What is your LinkedIn profile?", "Describe your experience"

NEVER use generic questions like "What is your full name?" for a feedback form. Always generate questions that make sense for the specific form type.

When users ask to create a form, YOU MUST use the create_form tool with the user's original request in the 'userPrompt' field so contextual questions are generated automatically. Do NOT ask users to manually create questions - the tool generates them automatically.

AVAILABLE TOOLS BY PRODUCT:

=== FORMS (from auth_db) ===
- create_form: Create form with contextual questions based on user request
- list_forms: List all your forms
- get_form: Get form details by ID or slug
- update_form: Update form title, description, or questions
- delete_form: Delete a form
- get_form_responses: Get responses for a specific form

=== PAYMENT LINKS (from ripplify_db) ===
- create_payment_link: Create payment link for customers to pay you
- list_payment_links: List all your payment links
- get_payment_link: Get payment link details
- delete_payment_link: Delete a payment link

=== TRANSACTIONS (from ripplify_db) ===
- list_transactions: List recent payments received
- get_transaction: Get transaction details by ID

=== WALLET (from ripplify_db) ===
- get_wallet: Get your wallet balance

=== PAYOUTS (from ripplify_db) ===
- list_payouts: List your payout requests
- create_payout: Request a payout/withdrawal

=== SHOPALIZE PRODUCTS (from shopalize_db) ===
- list_shopalize_products: List all products in your Shopalize stores
- get_shopalize_product: Get product details
- create_shopalize_product: Add a new product to your store
- update_shopalize_product: Update a product
- delete_shopalize_product: Delete a product

=== SHOPALIZE ORDERS (from shopalize_db) ===
- list_shopalize_orders: List orders from your Shopalize stores
- get_shopalize_order: Get order details
- update_shopalize_order: Update order status

=== SHOPALIZE CUSTOMERS (from shopalize_db) ===
- list_shopalize_customers: List all customers from your stores

=== SHOPALIZE DASHBOARD (from shopalize_db) ===
- get_shopalize_dashboard: Get dashboard stats (products, orders, revenue, customers)

=== WATCHTOWER ANALYTICS (from watchtower_db) ===
- get_watchtower_overview: Get analytics overview (sessions, pageviews, rage clicks, dead clicks)
- get_watchtower_sessions: List visitor sessions
- get_watchtower_session_detail: Get specific session details

=== USER PROFILE (from auth_db) ===
- get_user_profile: Get your account information

When responding:
- Be conversational and helpful
- If the user provides a form description or content (like questions in a list), use it to generate questions - copy the exact question text from their input
- ALWAYS use formId to update an existing form when provided - use update_form tool, not create_form
- Summarize key information for the user
- When creating items, confirm what was created
- Always use the correct userId when querying data

Context: userId=${userId}`,
    compaction_config: { compaction_instructions: "Quick summary of user request and actions taken." },
  })

  // === FORMS ===
  .fold({
    name: "create_form",
    description: "Create a new form with contextual questions based on user needs. IMPORTANT: If formId is provided in context, use update_form instead to edit the existing form! Pass userPrompt for contextual questions.",
    inputSchema: z.object({ 
      title: z.string(), 
      description: z.string().optional(),
      userPrompt: z.string().describe("The original user request - this is CRITICAL for generating relevant questions")
    }),
    async do(input) {
      // If formId exists in context, use update_form instead
      if (formId && currentForm) {
        const userPrompt = input.userPrompt || input.title;
        const questions = generateQuestionsFromPrompt(userPrompt);
        
        const authDb = getAuthDb();
        const existing = await authDb("forms").where("id", formId).where("userId", userId).first();
        if (existing) {
          await authDb("forms").where("id", formId).update({
            title: input.title,
            description: input.description || "",
            questions: JSON.stringify(questions),
            updatedAt: new Date()
          });
          
          return { status: "success", data: { id: formId, slug: existing.slug, title: input.title, questions, questionsCount: questions.length, type: "form", action: "updated" } };
        }
      }
      
      const userPrompt = input.userPrompt || input.title;
      const questions = generateQuestionsFromPrompt(userPrompt);
      
      const authDb = getAuthDb();
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
      
      return { status: "success", data: { ...result[0], questions, questionsCount: questions.length, type: "form", action: "created" } };
    },
  })

  .fold({
    name: "list_forms",
    description: "List all your forms",
    inputSchema: z.object({}),
    async do() {
      const authDb = getAuthDb();
      const forms = await authDb("forms").where("userId", userId).orderBy("createdAt", "desc").select("id", "title", "slug", "createdAt");
      return { status: "success", data: forms };
    },
  })

  .fold({
    name: "get_form",
    description: "Get form details by ID or slug",
    inputSchema: z.object({ formId: z.string().optional(), slug: z.string().optional() }),
    async do(input) {
      const authDb = getAuthDb();
      const form = await authDb("forms")
        .where("userId", userId)
        .where(input.formId ? "id" : "slug", input.formId || input.slug)
        .first();
      
      if (!form) return { status: "error", message: "Form not found" };
      
      form.questions = typeof form.questions === "string" ? JSON.parse(form.questions) : form.questions;
      return { status: "success", data: form };
    },
  })

  .fold({
    name: "update_form",
    description: "Update form title, description, or questions",
    inputSchema: z.object({ 
      formId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      questions: z.array(z.any()).optional()
    }),
    async do(input) {
      const authDb = getAuthDb();
      const existing = await authDb("forms").where("id", input.formId).where("userId", userId).first();
      if (!existing) return { status: "error", message: "Form not found" };
      
      const updateData = {};
      if (input.title) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.questions) updateData.questions = JSON.stringify(input.questions);
      
      await authDb("forms").where("id", input.formId).update(updateData);
      const updated = await authDb("forms").where("id", input.formId).first();
      updated.questions = typeof updated.questions === "string" ? JSON.parse(updated.questions) : updated.questions;
      
      return { status: "success", data: { ...updated, type: "form" } };
    },
  })

  .fold({
    name: "delete_form",
    description: "Delete a form",
    inputSchema: z.object({ formId: z.string() }),
    async do(input) {
      const authDb = getAuthDb();
      const form = await authDb("forms").where("id", input.formId).where("userId", userId).first();
      if (!form) return { status: "error", message: "Form not found" };
      
      await authDb("form_responses").where("formid", form.id).del();
      await authDb("forms").where("id", form.id).del();
      return { status: "success", data: { message: `Deleted: ${form.title}` } };
    },
  })

  .fold({
    name: "get_form_responses",
    description: "Get responses for a form",
    inputSchema: z.object({ formId: z.string() }),
    async do(input) {
      const authDb = getAuthDb();
      const form = await authDb("forms").where("id", input.formId).where("userId", userId).first();
      if (!form) return { status: "error", message: "Form not found" };
      
      const responses = await authDb("form_responses").where("formid", input.formId).orderBy("createdAt", "desc").select("*");
      for (const r of responses) {
        r.answers = typeof r.answers === "string" ? JSON.parse(r.answers) : r.answers;
      }
      
      return { status: "success", data: { form: { id: form.id, title: form.title }, responses } };
    },
  })

  // === PAYMENT LINKS ===
  .fold({
    name: "create_payment_link",
    description: "Create payment link for customers to pay",
    inputSchema: z.object({ name: z.string(), price: z.number(), description: z.string().optional(), currency: z.string().optional() }),
    async do(input) {
      const ripplifyDb = getRipplifyDb();
      const slug = `link-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const result = await ripplifyDb("payment_links").insert({
        userId,
        name: input.name,
        description: input.description || "",
        price: input.price,
        currency: input.currency || "KES",
        slug
      }).returning(["id", "slug", "name", "price"]);
      
      return { status: "success", data: { ...result[0], url: `/pay/${result[0].slug}`, type: "payment_link" } };
    },
  })

  .fold({
    name: "list_payment_links",
    description: "List all payment links",
    inputSchema: z.object({}),
    async do() {
      const ripplifyDb = getRipplifyDb();
      const links = await ripplifyDb("payment_links").where("userId", userId).orderBy("createdAt", "desc").select("id", "name", "price", "status", "clicks", "slug");
      return { status: "success", data: links };
    },
  })

  .fold({
    name: "get_payment_link",
    description: "Get payment link details",
    inputSchema: z.object({ linkId: z.string().optional(), slug: z.string().optional() }),
    async do(input) {
      const ripplifyDb = getRipplifyDb();
      const link = await ripplifyDb("payment_links")
        .where("userId", userId)
        .where(input.linkId ? "id" : "slug", input.linkId || input.slug)
        .first();
      
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
      const ripplifyDb = getRipplifyDb();
      const txs = await ripplifyDb("transactions")
        .where("userId", userId)
        .orderBy("createdAt", "desc")
        .limit(input.limit || 10)
        .select("id", "amount", "status", "buyerName", "createdAt");
      
      return { status: "success", data: txs };
    },
  })

  .fold({
    name: "get_transaction",
    description: "Get transaction details",
    inputSchema: z.object({ transactionId: z.string() }),
    async do(input) {
      const ripplifyDb = getRipplifyDb();
      const tx = await ripplifyDb("transactions").where("id", input.transactionId).where("userId", userId).first();
      return tx ? { status: "success", data: tx } : { status: "error", message: "Transaction not found" };
    },
  })

  // === WALLET ===
  .fold({
    name: "get_wallet",
    description: "Get wallet balance",
    inputSchema: z.object({}),
    async do() {
      const ripplifyDb = getRipplifyDb();
      let wallet = await ripplifyDb("wallets").where("userId", userId).first();
      
      if (!wallet) {
        wallet = (await ripplifyDb("wallets").insert({ userId, balance: 0, pendingBalance: 0, currency: "KES" }).returning("*"))[0];
      }
      
      return { status: "success", data: wallet };
    },
  })

  // === PAYOUTS ===
  .fold({
    name: "list_payouts",
    description: "List payout requests",
    inputSchema: z.object({}),
    async do() {
      const ripplifyDb = getRipplifyDb();
      const payouts = await ripplifyDb("payouts").where("userId", userId).orderBy("createdAt", "desc").select("*");
      return { status: "success", data: payouts };
    },
  })

  .fold({
    name: "create_payout",
    description: "Request a payout/withdrawal",
    inputSchema: z.object({ amount: z.number() }),
    async do(input) {
      const ripplifyDb = getRipplifyDb();
      const result = await ripplifyDb("payouts").insert({
        userId,
        amount: input.amount,
        status: "Pending"
      }).returning(["id", "amount", "status"]);
      
      return { status: "success", data: { ...result[0], message: "Payout requested", type: "payout" } };
    },
  })

  // === SHOPALIZE PRODUCTS ===
  .fold({
    name: "list_shopalize_products",
    description: "List all products in your Shopalize stores",
    inputSchema: z.object({ projectId: z.string().optional() }),
    async do(input) {
      const shopalizeDb = getShopalizeDb();
      
      let projectIds;
      if (input.projectId) {
        const project = await shopalizeDb("projects").where("id", parseInt(input.projectId)).where("userId", userId).first();
        if (!project) return { status: "error", message: "Project not found" };
        projectIds = [project.id];
      } else {
        const projects = await shopalizeDb("projects").where("userId", userId).select("id");
        projectIds = projects.map(p => p.id);
      }
      
      if (projectIds.length === 0) return { status: "success", data: [] };
      
      const products = await shopalizeDb("store_products").whereIn("projectId", projectIds).orderBy("createdAt", "desc").select("id", "name", "price", "isActive", "inventory", "createdAt");
      return { status: "success", data: products };
    },
  })

  .fold({
    name: "get_shopalize_product",
    description: "Get Shopalize product details",
    inputSchema: z.object({ productId: z.string() }),
    async do(input) {
      const shopalizeDb = getShopalizeDb();
      const product = await shopalizeDb("store_products").where("id", parseInt(input.productId)).first();
      
      if (!product) return { status: "error", message: "Product not found" };
      
      const project = await shopalizeDb("projects").where("id", product.projectId).where("userId", userId).first();
      if (!project) return { status: "error", message: "Not authorized" };
      
      product.images = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
      product.variants = product.variants ? (typeof product.variants === "string" ? JSON.parse(product.variants) : product.variants) : null;
      
      return { status: "success", data: product };
    },
  })

  .fold({
    name: "create_shopalize_product",
    description: "Add a new product to your Shopalize store",
    inputSchema: z.object({ 
      projectId: z.string().optional(),
      name: z.string(), 
      description: z.string().optional(),
      price: z.number(),
      currency: z.string().optional(),
      category: z.string().optional(),
      inventory: z.number().optional(),
      images: z.array(z.string()).optional()
    }),
    async do(input) {
      const shopalizeDb = getShopalizeDb();
      
      let project;
      if (input.projectId) {
        project = await shopalizeDb("projects").where("id", parseInt(input.projectId)).where("userId", userId).first();
      } else {
        project = await shopalizeDb("projects").where("userId", userId).orderBy("createdAt", "asc").first();
      }
      
      if (!project) {
        return { status: "error", message: "No store found. Create a store first in Shopalize." };
      }
      
      const result = await shopalizeDb("store_products").insert({
        projectId: project.id,
        name: input.name,
        description: input.description || "",
        price: input.price,
        currency: input.currency || "KES",
        category: input.category || null,
        inventory: input.inventory !== undefined ? input.inventory : -1,
        images: input.images ? JSON.stringify(input.images) : "[]"
      }).returning(["id", "name", "price", "isActive"]);
      
      return { status: "success", data: { ...result[0], type: "product" } };
    },
  })

  .fold({
    name: "update_shopalize_product",
    description: "Update a Shopalize product",
    inputSchema: z.object({ 
      productId: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      price: z.number().optional(),
      isActive: z.boolean().optional(),
      inventory: z.number().optional()
    }),
    async do(input) {
      const shopalizeDb = getShopalizeDb();
      const product = await shopalizeDb("store_products").where("id", parseInt(input.productId)).first();
      
      if (!product) return { status: "error", message: "Product not found" };
      
      const project = await shopalizeDb("projects").where("id", product.projectId).where("userId", userId).first();
      if (!project) return { status: "error", message: "Not authorized" };
      
      const updates = { updatedAt: shopalizeDb.fn.now() };
      if (input.name) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.price !== undefined) updates.price = input.price;
      if (input.isActive !== undefined) updates.isActive = input.isActive;
      if (input.inventory !== undefined) updates.inventory = input.inventory;
      
      await shopalizeDb("store_products").where("id", input.productId).update(updates);
      const updated = await shopalizeDb("store_products").where("id", input.productId).first();
      
      return { status: "success", data: updated };
    },
  })

  .fold({
    name: "delete_shopalize_product",
    description: "Delete a Shopalize product",
    inputSchema: z.object({ productId: z.string() }),
    async do(input) {
      const shopalizeDb = getShopalizeDb();
      const product = await shopalizeDb("store_products").where("id", parseInt(input.productId)).first();
      
      if (!product) return { status: "error", message: "Product not found" };
      
      const project = await shopalizeDb("projects").where("id", product.projectId).where("userId", userId).first();
      if (!project) return { status: "error", message: "Not authorized" };
      
      await shopalizeDb("store_products").where("id", input.productId).del();
      return { status: "success", data: { message: `Deleted: ${product.name}` } };
    },
  })

  // === SHOPALIZE ORDERS ===
  .fold({
    name: "list_shopalize_orders",
    description: "List orders from your Shopalize stores",
    inputSchema: z.object({ projectId: z.string().optional(), status: z.string().optional(), limit: z.number().optional() }),
    async do(input) {
      const shopalizeDb = getShopalizeDb();
      
      let projectIds;
      if (input.projectId) {
        const project = await shopalizeDb("projects").where("id", parseInt(input.projectId)).where("userId", userId).first();
        if (!project) return { status: "error", message: "Project not found" };
        projectIds = [project.id];
      } else {
        const projects = await shopalizeDb("projects").where("userId", userId).select("id");
        projectIds = projects.map(p => p.id);
      }
      
      if (projectIds.length === 0) return { status: "success", data: [] };
      
      let query = shopalizeDb("store_orders").whereIn("projectId", projectIds).orderBy("createdAt", "desc");
      if (input.status) query = query.where("status", input.status);
      if (input.limit) query = query.limit(input.limit);
      
      const orders = await query.select("id", "buyerName", "buyerEmail", "amount", "status", "createdAt");
      return { status: "success", data: orders };
    },
  })

  .fold({
    name: "get_shopalize_order",
    description: "Get Shopalize order details",
    inputSchema: z.object({ orderId: z.string() }),
    async do(input) {
      const shopalizeDb = getShopalizeDb();
      const order = await shopalizeDb("store_orders").where("id", parseInt(input.orderId)).first();
      
      if (!order) return { status: "error", message: "Order not found" };
      
      const project = await shopalizeDb("projects").where("id", order.projectId).where("userId", userId).first();
      if (!project) return { status: "error", message: "Not authorized" };
      
      order.itemsJson = order.itemsJson ? JSON.parse(order.itemsJson) : [];
      return { status: "success", data: order };
    },
  })

  .fold({
    name: "update_shopalize_order",
    description: "Update Shopalize order status",
    inputSchema: z.object({ orderId: z.string(), status: z.string().optional(), fulfillmentStatus: z.string().optional() }),
    async do(input) {
      const shopalizeDb = getShopalizeDb();
      const order = await shopalizeDb("store_orders").where("id", parseInt(input.orderId)).first();
      
      if (!order) return { status: "error", message: "Order not found" };
      
      const project = await shopalizeDb("projects").where("id", order.projectId).where("userId", userId).first();
      if (!project) return { status: "error", message: "Not authorized" };
      
      const updates = {};
      if (input.status) updates.status = input.status;
      if (input.fulfillmentStatus) updates.fulfillmentStatus = input.fulfillmentStatus;
      
      await shopalizeDb("store_orders").where("id", input.orderId).update(updates);
      const updated = await shopalizeDb("store_orders").where("id", input.orderId).first();
      
      return { status: "success", data: updated };
    },
  })

  // === SHOPALIZE CUSTOMERS ===
  .fold({
    name: "list_shopalize_customers",
    description: "List all customers from your Shopalize stores",
    inputSchema: z.object({}),
    async do() {
      const shopalizeDb = getShopalizeDb();
      const projects = await shopalizeDb("projects").where("userId", userId).select("id");
      const projectIds = projects.map(p => p.id);
      
      if (projectIds.length === 0) return { status: "success", data: [] };
      
      const orders = await shopalizeDb("store_orders")
        .whereIn("projectId", projectIds)
        .whereNotNull("buyerEmail")
        .where("buyerEmail", "!");
      
      const customerMap = {};
      for (const order of orders) {
        const key = order.buyerEmail;
        if (!customerMap[key]) {
          customerMap[key] = {
            id: key,
            name: order.buyerName || "Guest",
            email: order.buyerEmail,
            phone: order.buyerPhone || "",
            orders: 0,
            totalSpent: 0,
          };
        }
        customerMap[key].orders++;
        if (order.status !== "cancelled") {
          customerMap[key].totalSpent += parseFloat(order.amount || 0);
        }
      }
      
      const customers = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
      return { status: "success", data: customers };
    },
  })

  // === SHOPALIZE DASHBOARD ===
  .fold({
    name: "get_shopalize_dashboard",
    description: "Get Shopalize dashboard statistics",
    inputSchema: z.object({ projectId: z.string().optional() }),
    async do(input) {
      const shopalizeDb = getShopalizeDb();
      
      let projectIds;
      if (input.projectId) {
        const project = await shopalizeDb("projects").where("id", parseInt(input.projectId)).where("userId", userId).first();
        if (!project) return { status: "error", message: "Project not found" };
        projectIds = [project.id];
      } else {
        const projects = await shopalizeDb("projects").where("userId", userId).select("id");
        projectIds = projects.map(p => p.id);
      }
      
      if (projectIds.length === 0) {
        return { status: "success", data: { totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalCustomers: 0 } };
      }
      
      const totalProducts = await shopalizeDb("store_products").whereIn("projectId", projectIds).count("id as count").first();
      
      const orderStats = await shopalizeDb("store_orders")
        .whereIn("projectId", projectIds)
        .select(
          shopalizeDb.count("id as totalOrders").as("totalOrders"),
          shopalizeDb.sum("amount as totalRevenue").as("totalRevenue")
        )
        .whereNot("status", "cancelled")
        .first();
      
      const uniqueCustomers = await shopalizeDb("store_orders")
        .whereIn("projectId", projectIds)
        .whereNotNull("buyerEmail")
        .countDistinct("buyerEmail as count")
        .first();
      
      return { 
        status: "success", 
        data: {
          totalProducts: parseInt(totalProducts?.count || 0),
          totalOrders: parseInt(orderStats?.totalOrders || 0),
          totalRevenue: parseFloat(orderStats?.totalRevenue || 0),
          totalCustomers: parseInt(uniqueCustomers?.count || 0),
        }
      };
    },
  })

  // === WATCHTOWER ANALYTICS ===
  .fold({
    name: "get_watchtower_overview",
    description: "Get Watchtower analytics overview",
    inputSchema: z.object({}),
    async do() {
      const watchtowerDb = getWatchtowerDb();
      
      const stats = await watchtowerDb("insight_sessions")
        .where("userId", userId)
        .count("id as totalSessions")
        .sum("pageViews as totalPageViews")
        .avg("duration as avgDuration")
        .first();
      
      const rageClickCount = await watchtowerDb("insight_events")
        .whereIn("sessionId", function() {
          this.select("sessionId").from("insight_sessions").where("userId", userId);
        })
        .where("type", "rage_click")
        .count("id as count")
        .first();
      
      const deadClickCount = await watchtowerDb("insight_events")
        .whereIn("sessionId", function() {
          this.select("sessionId").from("insight_sessions").where("userId", userId);
        })
        .where("type", "dead_click")
        .count("id as count")
        .first();
      
      return {
        status: "success",
        data: {
          totalSessions: parseInt(stats.totalSessions) || 0,
          totalPageViews: parseInt(stats.totalPageViews) || 0,
          avgDuration: Math.round(parseFloat(stats.avgDuration) || 0),
          rageClicks: parseInt(rageClickCount?.count || 0),
          deadClicks: parseInt(deadClickCount?.count || 0),
        }
      };
    },
  })

  .fold({
    name: "get_watchtower_sessions",
    description: "List visitor sessions from Watchtower",
    inputSchema: z.object({ limit: z.number().optional(), offset: z.number().optional() }),
    async do(input) {
      const watchtowerDb = getWatchtowerDb();
      
      const sessions = await watchtowerDb("insight_sessions")
        .where("userId", userId)
        .orderBy("createdAt", "desc")
        .limit(input.limit || 20)
        .offset(input.offset || 0)
        .select("sessionId", "device", "browser", "country", "city", "pageViews", "duration", "createdAt");
      
      const total = await watchtowerDb("insight_sessions")
        .where("userId", userId)
        .count("id as count")
        .first();
      
      return { status: "success", data: { sessions, total: parseInt(total.count) || 0 } };
    },
  })

  .fold({
    name: "get_watchtower_session_detail",
    description: "Get details of a specific Watchtower session",
    inputSchema: z.object({ sessionId: z.string() }),
    async do(input) {
      const watchtowerDb = getWatchtowerDb();
      
      const session = await watchtowerDb("insight_sessions").where("sessionId", input.sessionId).where("userId", userId).first();
      if (!session) return { status: "error", message: "Session not found" };
      
      const events = await watchtowerDb("insight_events")
        .where("sessionId", input.sessionId)
        .orderBy("timestamp", "asc")
        .select("type", "target", "url", "timestamp");
      
      return { status: "success", data: { ...session, events } };
    },
  })

  // === USER PROFILE ===
  .fold({
    name: "get_user_profile",
    description: "Get your account profile information",
    inputSchema: z.object({}),
    async do() {
      const authDb = getAuthDb();
      const user = await authDb("users").where("id", userId).select("id", "email", "name", "phone", "createdAt", "isVerified", "referralCode", "referralPoints").first();
      
      if (!user) return { status: "error", message: "User not found" };
      
      return { status: "success", data: user };
    },
  })

  .build();

  return agent;
};

export const processUnifiedAgentRequest = async (userId, message, context = {}) => {
  const agent = createUnifiedAgent(userId, context);
  return agent.processRequest(message);
};

export default { createUnifiedAgent, processUnifiedAgentRequest };