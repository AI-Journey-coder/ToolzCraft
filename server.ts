import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

// Initialize Gemini client lazily
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI tools will fall back to simulation.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Initialize Firebase Firestore on Server Side using Firebase Admin SDK for Secure Bypassed Operations
  const appletConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  let useFirestore = false;
  let db: any = null;

  if (fs.existsSync(appletConfigPath)) {
    try {
      const serverFirebaseConfig = JSON.parse(fs.readFileSync(appletConfigPath, "utf8"));
      const apiKey = process.env.VITE_FIREBASE_API_KEY || serverFirebaseConfig.apiKey;
      if (apiKey && apiKey !== "" && !apiKey.includes("DummyKey") && !apiKey.includes("DummyKeyForCompilation")) {
        try {
          admin.initializeApp({
            projectId: process.env.VITE_FIREBASE_PROJECT_ID || serverFirebaseConfig.projectId
          });
          const dbId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || serverFirebaseConfig.firestoreDatabaseId;
          db = (admin as any).firestore(dbId || undefined);
          useFirestore = true;

          // Fast verification check of Admin functionality bypassing security rules
          db.collection("settings").doc("global_config").get().then((docSnapshot: any) => {
            console.log("Firebase Firestore (Admin SDK) successfully verified and operating securely on Database ID:", dbId);
          }).catch((err: any) => {
            const errMsg = err.message || String(err);
            if (errMsg.includes("permission-denied") || errMsg.includes("PERMISSION_DENIED") || errMsg.includes("not been used") || errMsg.includes("disabled")) {
              useFirestore = false;
              console.error("\n==========================================================================================");
              console.error("⚠️   FIREBASE COMPLIANCE NOTICE: Cloud Firestore API is currently disabled/inactive.");
              console.error("    Project Identifier: " + serverFirebaseConfig.projectId);
              console.error("    The server has safely fell back to using local JSON and CSV states.");
              console.error("    To unlock full persistence please enable Firestore API in the console.");
              console.error("==========================================================================================\n");
            } else {
              console.log("Firestore Admin SDK test completed:", errMsg);
            }
          });
        } catch (initErr: any) {
          console.warn("Firebase Admin SDK failed to initialize. Falling back to local offline engines. Details:", initErr.message || initErr);
          useFirestore = false;
        }
      }
    } catch (err) {
      console.warn("Backend server failed to initialize Firebase Firestore:", err);
    }
  }

  const csvFilePath = path.join(process.cwd(), "feedback.csv");

  // Initial CSV Setup if not exists
  if (!fs.existsSync(csvFilePath)) {
    fs.writeFileSync(
      csvFilePath,
      "id,toolId,toolName,rating,comments,email,name,timestamp\n",
      "utf8"
    );
  }

  // Escape standard CSV field
  function escapeCSV(text: string): string {
    if (!text) return '""';
    const escaped = text.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  // --- API ROUTES ---

  // GET feedback
  app.get("/api/feedback", async (req, res) => {
    try {
      if (useFirestore) {
        try {
          const snapshot = await db.collection("feedback").get();
          const list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
          return res.json({ success: true, list });
        } catch (e: any) {
          console.warn("Firestore feedback read error, falling back to CSV:", e.message || e);
        }
      }

      if (!fs.existsSync(csvFilePath)) {
        return res.json({ success: true, list: [] });
      }
      const data = fs.readFileSync(csvFilePath, "utf8");
      const lines = data.split("\n").filter((l) => l.trim() !== "");
      if (lines.length <= 1) {
        return res.json({ success: true, list: [] });
      }

      const list = [];
      const headers = ["id", "toolId", "toolName", "rating", "comments", "email", "name", "timestamp"];
      
      for (let i = 1; i < lines.length; i++) {
        // Simple regex parser to split on commas not inside quotes
        const parts = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        if (parts.length >= 8) {
          const clean = (str: string) => {
            let s = str ? str.trim() : "";
            if (s.startsWith('"') && s.endsWith('"')) {
              s = s.slice(1, -1);
            }
            return s.replace(/""/g, '"');
          };
          
          list.push({
            id: clean(parts[0]),
            toolId: clean(parts[1]),
            toolName: clean(parts[2]),
            rating: parseInt(clean(parts[3])) || 5,
            comments: clean(parts[4]),
            email: clean(parts[5]),
            name: clean(parts[6]),
            timestamp: clean(parts[7]),
          });
        }
      }

      res.json({ success: true, list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST feedback to CSV and Firestore if active
  app.post("/api/feedback", async (req, res) => {
    try {
      const { toolId, toolName, rating, comments, email, name, timestamp } = req.body;
      const id = "fb_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

      const newLine = [
        escapeCSV(id),
        escapeCSV(toolId),
        escapeCSV(toolName),
        escapeCSV(String(rating || 5)),
        escapeCSV(comments || ""),
        escapeCSV(email || ""),
        escapeCSV(name || ""),
        escapeCSV(timestamp || new Date().toISOString()),
      ].join(",");

      try {
        fs.appendFileSync(csvFilePath, newLine + "\n", "utf8");
      } catch (err) {
        console.warn("Failed recording locally:", err);
      }

      if (useFirestore) {
        try {
          await db.collection("feedback").doc(id).set({
            id,
            toolId: toolId || "",
            toolName: toolName || "",
            rating: parseInt(rating) || 5,
            comments: comments || "",
            email: email || "",
            name: name || "",
            timestamp: timestamp || new Date().toISOString()
          });
        } catch (e: any) {
          console.warn("Firestore feedback write error:", e.message || e);
        }
      }

      res.json({ success: true, message: "Feedback recorded in local CSV file successfully!" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Paths for persisting admin configurations
  const toolsConfigPath = path.join(process.cwd(), "tools_config_persisted.json");
  const subscriptionsConfigPath = path.join(process.cwd(), "subscriptions_config_persisted.json");

  // Helper to read and write admin tools
  function getToolsConfig() {
    try {
      if (fs.existsSync(toolsConfigPath)) {
        return JSON.parse(fs.readFileSync(toolsConfigPath, "utf8"));
      }
    } catch (e) {
      console.warn("Failed reading tools_config_persisted.json", e);
    }
    return { hiddenToolIds: [] };
  }

  function getSubscriptionsConfig() {
    try {
      if (fs.existsSync(subscriptionsConfigPath)) {
        return JSON.parse(fs.readFileSync(subscriptionsConfigPath, "utf8"));
      }
    } catch (e) {
      console.warn("Failed reading subscriptions_config_persisted.json", e);
    }
    return {
      users: [
        { email: "new.ai.journey@gmail.com", tier: "Premium", source: "Admin Rule (Default)", joined: "2026-06-17T00:00:00.000Z" }
      ],
      plans: [
        { id: "free", name: "Basic Free Tier", price: "$0 / mo", active: true, limitations: "Limited access to API tools and data processing offsets" },
        { id: "standard", name: "Standard Plan", price: "$9.99 / mo", active: true, limitations: "Full standard tools access, custom formats export models" },
        { id: "pro", name: "Pro Master Dev", price: "$19.99 / mo", active: true, limitations: "All 150+ developer tools unlocked, premium high-fidelity Gemini OCR extraction" }
      ]
    };
  }

  // Admin middleware check
  function checkAdminAuth(req: any, res: any, next: any) {
    const adminEmail = req.body.adminEmail || req.query.adminEmail || req.headers["x-admin-email"];
    if (!adminEmail || String(adminEmail).toLowerCase() !== "new.ai.journey@gmail.com") {
      return res.status(403).json({ success: false, error: "Access Denied: Highly secured administrative resource path" });
    }
    next();
  }

  // GET complete admin configurations
  app.get("/api/admin/config", async (req, res) => {
    try {
      // Allow general list query for the user-facing side to filter tools, but secure subscription details in admin section itself
      const adminEmail = req.query.adminEmail || req.headers["x-admin-email"];
      const isSecuredRequest = adminEmail && String(adminEmail).toLowerCase() === "new.ai.journey@gmail.com";
      
      let hiddenToolIds: string[] = [];
      let users = [];
      let plans = [];

      if (useFirestore) {
        try {
          const toolsDoc = await db.collection("settings").doc("global_config").get();
          if (toolsDoc.exists) {
            hiddenToolIds = toolsDoc.data().hiddenToolIds || [];
          } else {
            hiddenToolIds = getToolsConfig().hiddenToolIds || [];
            await db.collection("settings").doc("global_config").set({ hiddenToolIds });
          }

          if (isSecuredRequest) {
            const subsCollection = await db.collection("subscribers").get();
            if (!subsCollection.empty) {
              users = subsCollection.docs.map((d: any) => ({ email: d.id, ...d.data() }));
            } else {
              const defaultSubs = getSubscriptionsConfig();
              users = defaultSubs.users || [];
              for (const u of users) {
                if (u.email) {
                  await db.collection("subscribers").doc(u.email.toLowerCase()).set({
                    tier: u.tier || "Free Tier",
                    source: u.source || "Default",
                    joined: u.joined || new Date().toISOString(),
                    validityExpiry: u.validityExpiry || "Lifetime",
                    specialExceptions: u.specialExceptions || []
                  });
                }
              }
            }

            const plansCollection = await db.collection("plans").get();
            if (!plansCollection.empty) {
              plans = plansCollection.docs.map((d: any) => ({ id: d.id, ...d.data() }));
            } else {
              const defaultSubs = getSubscriptionsConfig();
              plans = defaultSubs.plans || [];
              for (const p of plans) {
                if (p.id) {
                  await db.collection("plans").doc(p.id).set({
                    name: p.name,
                    price: p.price,
                    active: p.active !== undefined ? p.active : true,
                    limitations: p.limitations || ""
                  });
                }
              }
            }
          }
        } catch (err: any) {
          console.error("Firestore loading failure, falling back to JSON states:", err);
          const tools = getToolsConfig();
          const subs = getSubscriptionsConfig();
          hiddenToolIds = tools.hiddenToolIds || [];
          users = subs.users || [];
          plans = subs.plans || [];
        }
      } else {
        const tools = getToolsConfig();
        const subs = getSubscriptionsConfig();
        hiddenToolIds = tools.hiddenToolIds || [];
        users = subs.users || [];
        plans = subs.plans || [];
      }

      if (isSecuredRequest) {
        res.json({
          success: true,
          hiddenToolIds,
          users: users.map(u => ({ ...u, email: u.email || "" })),
          plans,
          firestoreStatus: {
            active: useFirestore,
            projectId: "toolzcraft-062534",
            activationUrl: "https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=toolzcraft-062026"
          }
        });
      } else {
        res.json({
          success: true,
          hiddenToolIds
        });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST update tools configuration
  app.post("/api/admin/tools-config", checkAdminAuth, async (req, res) => {
    try {
      const { hiddenToolIds } = req.body;
      if (!Array.isArray(hiddenToolIds)) {
        return res.status(400).json({ success: false, error: "hiddenToolIds must be an array" });
      }

      try {
        fs.writeFileSync(toolsConfigPath, JSON.stringify({ hiddenToolIds }, null, 2), "utf8");
      } catch (err) {
        console.warn("Failed recording locally:", err);
      }

      if (useFirestore) {
        try {
          await db.collection("settings").doc("global_config").set({ hiddenToolIds });
        } catch (e: any) {
          console.warn("Firestore error saving settings config:", e.message || e);
        }
      }

      res.json({ success: true, message: "Tools visibility states saved successfully!", hiddenToolIds });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST update subscriptions configuration
  app.post("/api/admin/subscriptions-config", checkAdminAuth, async (req, res) => {
    try {
      const { users, plans } = req.body;
      const config = getSubscriptionsConfig();

      if (users && Array.isArray(users)) {
        config.users = users;
        if (useFirestore) {
          try {
            for (const u of users) {
              if (u.email) {
                await db.collection("subscribers").doc(u.email.toLowerCase()).set({
                  tier: u.tier || "Free Tier",
                  source: u.source || "Default",
                  joined: u.joined || new Date().toISOString(),
                  validityExpiry: u.validityExpiry || "Lifetime",
                  specialExceptions: u.specialExceptions || []
                });
              }
            }
          } catch (e: any) {
            console.warn("Firestore error seeding users config:", e.message || e);
          }
        }
      }
      if (plans && Array.isArray(plans)) {
        config.plans = plans;
        if (useFirestore) {
          try {
            for (const p of plans) {
              if (p.id) {
                await db.collection("plans").doc(p.id).set({
                  name: p.name,
                  price: p.price,
                  active: p.active !== undefined ? p.active : true,
                  limitations: p.limitations || ""
                });
              }
            }
          } catch (e: any) {
            console.warn("Firestore error seeding plans config:", e.message || e);
          }
        }
      }

      try {
        fs.writeFileSync(subscriptionsConfigPath, JSON.stringify(config, null, 2), "utf8");
      } catch (err) {
        console.warn("Failed saving JSON plans fallback:", err);
      }

      res.json({ success: true, message: "Subscription configurations updated successfully!", users: config.users, plans: config.plans });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST run custom simulation / processing using Gemini
  app.post("/api/tool/run", async (req, res) => {
    try {
      const { toolId, toolName, inputs } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback mock mode in case the API key is not yet set by the user (provides excellent user design and avoids site crash)
        return res.json({
          success: true,
          isMock: true,
          output: `[SIMULATED DEVELOPER RUNNER]
Tool: ${toolName}
Inputs Analyzed:
${JSON.stringify(inputs, null, 2)}

This tool relies on live Gemini intelligence to translate, parse, or evaluate complex structured files or database schemas. To activate actual API transactions, please specify a valid 'GEMINI_API_KEY' inside the Secrets configuration panel in the AI Studio sidebar!

Here is a demo output reflecting correct structural patterns:
=========================================
Generated representation of input entries:
1. Target mapped successfully to runtime elements.
2. Verified schema layout against ISO standards.
3. Successfully parsed all elements (0 errors; 1 warnings).

Data payload sample response:
{
  "status": "COMPLETED",
  "source_tool": "${toolId}",
  "records_affected": 1,
  "formatted_data": "Successfully formatted structure"
}`
        });
      }

      const client = getGeminiClient();
      
      const isOcrTool = [
        "receipt-ocr-scan",
        "invoice-ocr-scan",
        "bank-statement",
        "gst-invoice-extractor",
        "expense-categorizer",
        "receipt-excel",
        "invoice-excel",
        "ocr-table"
      ].includes(toolId) || 
      (toolId && typeof toolId === "string" && toolId.includes("ocr")) || 
      (toolName && typeof toolName === "string" && (
        toolName.toLowerCase().includes("ocr") || 
        toolName.toLowerCase().includes("receipt") || 
        toolName.toLowerCase().includes("invoice")
      ));

      let prompt = "";
      if (isOcrTool) {
        let toolSpecificity = "";
        if (toolId === "invoice-ocr-scan" || toolId === "invoice-excel") {
          toolSpecificity = `
This is an INVOICE. Invoices are fundamentally different from simple retail receipts because they represent business-to-business credit sales. Key parameters to isolate are:
- "billingFrom": Full supplier corporate identity, address, contact numbers, and legal registration.
- "billingTo": Complete customer corporate identity or department, delivery address.
- "dueDate": Period terms, payment timeline or target final date.
- "poNumber": Reference to original purchases (Purchase Order #).
- "paymentTerms": e.g., Net 30, COD, Net 15.
Ensure these parameters are populated in the JSON output.`;
        } else if (toolId === "bank-statement") {
          toolSpecificity = `
This is a BANK STATEMENT. Bank statements trace transaction flow ledgers. Key parameters to extract are:
- "accountNumber": The unique account ID number printed.
- "openingBalance": Baseline ledger starting value.
- "closingBalance": Baseline ledger ending value.
- "items": Map individual ledger transaction rows as items here. Set "qty" to 1, "price" to the transaction amount, and "name" to the description of the transaction (e.g. Deposit, Withdrawal to Merchant, ATM fee, interest pay rate).`;
        } else if (toolId === "gst-invoice-extractor") {
          toolSpecificity = `
This is a GST-COMPLIANT INVOICE. You must parse specific Goods and Services Tax (GST/VAT) data allocations:
- "cgst": Central GST amount (number).
- "sgst": State GST amount (number).
- "igst": Integrated GST amount (number).
- "gstNo": Legal GSTIN identification number of the supplier.
- "tradeName": Legal corporate or trade division registry name.
- "items": For each item, capture the HSN/SAC code if printed in its description or name.`;
        } else if (toolId === "expense-categorizer") {
          toolSpecificity = `
This is an EXPENSE TAX CATEGORIZER. Your focus is standard legal accounting classifications:
- "expenseCategory": Classify into an IRS Schedule C category (such as Advertising, Car & Truck expenses, Office Expense, Rent, Software, Travel, Meals 50%, or Utilities).
- "scheduleCCategory": Tax schedule category name.
- "auditRisk": Qualitative risk assessment: "Low", "Medium", or "High" depending on personal/business overlap and IRS standard rules.
- "deductibleRate": e.g. "100%", "50%", "0%" as per standard US tax rules.`;
        } else if (toolId === "receipt-excel" || toolId === "invoice-excel" || toolId === "ocr-table") {
          toolSpecificity = `
This tool is for SPREADSHEET (Excel/Markdown table) serialization. Pay special attention to organizing columns perfectly. Every item row must contain clean, parsed values fit for direct CSV conversion without redundant headers.`;
        }

        prompt = `You are an elite cognitive OCR document parsing engine specializing in financial, legal, and operational documents.
We are running the tool: "${toolName}" (ID: "${toolId}").
The input file or text context contains the scanned content or text details.
Your objective is to perform a high-fidelity audit of this document, and output a structured JSON response containing:
1. "detailedAnalysis": A highly comprehensive text report in Markdown. This must replicate and transcribe ALL details captured textually: the complete merchant/issuer identity, invoice meta details, dates, complete billing addresses (Billing From and Billing To), full transaction/invoice tables, taxes, totals, item descriptions, and tax structures. Be extremely accurate, thorough, and formatted beautifully in Markdown with bold titles, clean lists, and table structures. REPLICATE details 100% textually.
2. "structuredData": A clean JSON object mapping the parsed details for visual reconstruction:
   - "merchant": Elegant name of the issuer/merchant.
   - "invoiceNo": Document serial number, reference ID, receipt ID, or invoice number.
   - "date": Date of billing or transaction.
   - "gstNo": GST, VAT, or legal tax ID of the merchant/vendor.
   - "expenseCategory": Standard expense classification (e.g. Office Supplies, Travel, Software & SaaS, Utilities, Food & Beverage).
   - "paymentMethod": Paid via/payment form (e.g., Visa, Mastercard, Cash, PayPal, Amex, Apple Pay).
   - "taxRate": Tax rate (percentage e.g. "8%", "18%").
   - "subtotal": Sub-total value before taxes (number).
   - "tax": Identified or calculated tax amount (number).
   - "total": Final total amount paid (number).
   - "billingFrom": The complete billing address/details of the seller (merchant address, contact info, tel, email) exactly as captured.
   - "billingTo": The customer name, address, department, or "bill to" info if found in the document.
   - "items": Array of items. Each item must be: { "name": "Item Name", "qty": number, "price": number }. Ensure qty and price are numbers, and match the document.

   // Specialized extra fields for advanced OCR tools:
   - "dueDate": Due date of invoice (string, optional)
   - "poNumber": Purchase order number (string, optional)
   - "paymentTerms": Net 30, COD, etc. (string, optional)
   - "accountNumber": Bank account number (string, optional)
   - "openingBalance": Bank opening balance (number, optional)
   - "closingBalance": Bank closing balance (number, optional)
   - "cgst": Central GST (number, optional)
   - "sgst": State GST (number, optional)
   - "igst": Integrated GST (number, optional)
   - "tradeName": Legal/Trade registered corporate name (string, optional)
   - "scheduleCCategory": IRS Schedule C Tax Line (string, optional)
   - "auditRisk": "Low" | "Medium" | "High" (string, optional)
   - "deductibleRate": "100%", "50%", "0%" (string, optional)

Specific Tool Requirements: ${toolSpecificity}

You MUST return a single valid JSON object adhering strictly to this schema:
{
  "detailedAnalysis": "your complete 100% textual markdown report with escaped quotes...",
  "structuredData": {
    "merchant": "...",
    "invoiceNo": "...",
    "date": "...",
    "gstNo": "...",
    "expenseCategory": "...",
    "paymentMethod": "...",
    "taxRate": "...",
    "subtotal": 0.0,
    "tax": 0.0,
    "total": 0.0,
    "billingFrom": "...",
    "billingTo": "...",
    "items": [
      { "name": "...", "qty": 1, "price": 0.0 }
    ],
    "dueDate": "...",
    "poNumber": "...",
    "paymentTerms": "...",
    "accountNumber": "...",
    "openingBalance": 0.0,
    "closingBalance": 0.0,
    "cgst": 0.0,
    "sgst": 0.0,
    "igst": 0.0,
    "tradeName": "...",
    "scheduleCCategory": "...",
    "auditRisk": "...",
    "deductibleRate": "..."
  }
}

Do NOT write any preamble (like "Here is the JSON" or backticks unless returning valid JSON in backticks). Ensure the output is valid JSON.`;
      } else if (toolId === "pdf-to-word" || toolId === "word-to-pdf") {
        prompt = `You are an elite high-fidelity document conversion engine specializing in preserving 100% text and identical layouts.
We are running the tool: "${toolName}" (ID: "${toolId}").
The user has uploaded a file or pasted the text of a document:
${JSON.stringify(inputs, null, 2)}

Your main directive is to extract and read ALL text present in the document. Do NOT skip any words, numbers, figures, tables, footers, headers, or lines. Reconstruct the document exactly:
- Match the headers, sections, bullet points, font styles (bold, uppercase), tables, lists, and footers.
- Retain 100% of all sentences and textual content with 100% layout fidelity.
- If there are tables, draw them using markdown table blocks.
- If the document is an image/scanned document, read the visual data with extreme precision.

Provide the final converted result in a structured format directly. Do not start with any introduction or chat preamble, just output the compiled clean, fully transcribed and reconstructed text content.`;
      } else if (toolId === "barcode-gen" || toolId === "qr-code-gen") {
        prompt = `You are an expert barcode and QR code reader/convertor utility engine.
We are running the tool: "${toolName}" (ID: "${toolId}").
The inputs specified:
${JSON.stringify(inputs, null, 2)}

Please analyze the uploaded image or specification details.
1. Identify the TYPE of the code (e.g. QR-Code, EAN-13, Code-128, Code-39, UPC-A, PDF417, Data-Matrix).
2. Read the accurate encoded text/digits sequence inside the code.
3. List the detailed technical characteristics (symbology, character-set capacity, checksum calculation check).
4. Provide immediate conversions of this same content into OTHER types of codes layout schemas (e.g. if the input is EAN-13, convert its representation to Code-128, Code-39, and QR-Code format, explain how they map, and draw ASCII representations of the bars/matrix grid!)

Output the summary report directly with clear, highly structured headings and clean comparative grids.`;
      } else {
        prompt = `You are a universal developer, high-fidelity language translator, and system modernization utility backend sandbox.
We are running the virtual tool: "${toolName}" (ID: "${toolId}").
The user has passed the following form inputs or text content:
${JSON.stringify(inputs, null, 2)}

Execute the logical core of this tool with absolute software engineering precision:
- If this is a Programming Language Code Converter (e.g. Code & Language Converter category: py-to-js, js-to-py, java-to-py, etc.), perform a thorough, clean, and idiomatic translation of the input code from the source language to the target language. Align logic structures, preserve variable names, functions, and proper standard syntax models (like using async/await when suitable, typing, docstrings or comments). Include clean line comments explaining key translation choices.
- If this is a Test or Skeleton Code Generator (e.g. Test & Skeleton Code Generator category: jest-gen, pytest-gen, dockerfile-gen, github-actions-gen, readme-gen, json-mock-gen, html5-boilerplate), compile a highly professional, ready-to-run, and clean template boilerplate or skeleton program. Populate it with realistic examples and standard layouts. Avoid leaving TODO placeholders, instead implement high-fidelity and fully valid logical blocks!
- If this is a Database DDL converter (e.g., Oracle to PostgreSQL), convert the inputted schema script with correct syntax, high-contrast, clean casing, and output comments explaining the changes.
- If it is a Contact Duplicate Finder or Contact cleaner, parse the contacts and demonstrate duplicate list sorting.
- If it is a Chat analyzer, analyze message counts, frequency, and output statistics tables or leaderboards.
- If it is a Schema comparison or compare utility, analyze the keys and outputs side-by-side.
- If it is a modern COBOL parser, show tabular memory divisions and data item structure maps out of the copybook.
- Otherwise, execute the task correctly based on its utility definition.

Format the output beautifully and directly using Markdown so that the client can render it in a clean, professional preformatted viewport. Use markdown code boxes with accurate language identifiers (e.g., \`\`\`javascript, \`\`\`python, \`\`\`dockerfile, \`\`\`yaml, \`\`\`json, \`\`\`html) where code blocks are represented, and combine them with brief, professional explanatory headings of the architecture or refactored structure. Avoid any conversational chat preamble words like 'Sure, here is the result'; just jump straight into the formatted output, generated test suites, or translated conversion.`;
      }

      let contentPayload: any = prompt;

      if (inputs && typeof inputs === "object" && inputs.fileDataUrl) {
        const fileDataUrl = inputs.fileDataUrl as string;
        const matches = fileDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          
          contentPayload = {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              },
              {
                text: `${prompt}\n\nIMPORTANT: The user has uploaded and attached an actual file/image above for this API request. Use your multi-modal vision capabilities to read, analyze, and OCR the text contents of this document/image directly! The data is provided as high-quality inline data above. Extrapolate all lines, goods, services, sub-totals, tax amounts, merchant names, address, and dates directly from the file content itself instead of using any simulated structure. Thank you!`
              }
            ]
          };
        }
      }

      // Call Gemini with automatic retry & fallback for transient service demand spikes or temporary 503s
      let response;
      const modelsToTry = [
        "gemini-3.5-flash", 
        "gemini-flash-latest", 
        "gemini-3.1-flash-lite",
        "gemini-flash-latest"
      ];
      let modelUsed = modelsToTry[0];
      const maxRetries = modelsToTry.length;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const currentModel = modelsToTry[attempt - 1] || modelsToTry[0];
        try {
          response = await client.models.generateContent({
            model: currentModel,
            contents: contentPayload,
          });
          modelUsed = currentModel;
          break; // successfully received a response, exit the retry loop
        } catch (err: any) {
          const errMsg = err.message || String(err);
          const isTransient = 
            errMsg.toLowerCase().includes("503") ||
            errMsg.toLowerCase().includes("unavailable") ||
            errMsg.toLowerCase().includes("high demand") ||
            errMsg.toLowerCase().includes("overloaded") ||
            errMsg.toLowerCase().includes("rate limit") ||
            errMsg.toLowerCase().includes("rate-limits") ||
            errMsg.toLowerCase().includes("quota") ||
            errMsg.toLowerCase().includes("limit") ||
            errMsg.toLowerCase().includes("429") ||
            errMsg.toLowerCase().includes("status: 429") ||
            errMsg.toLowerCase().includes("temporary");
          
          if (isTransient && attempt < maxRetries) {
            const nextModel = modelsToTry[attempt] || modelsToTry[0];
            const delay = attempt * 1200;
            // Print status updates of the self-healing retry pipeline as standard logs
            console.log(`[INFO] Service load dynamic shift for "${currentModel}" (Attempt ${attempt}/${maxRetries}). Retrying with "${nextModel}" in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            throw err; // throw exception if non-transient or exhausted all retries
          }
        }
      }

      res.json({
        success: true,
        isMock: false,
        output: (response && response.text) || "No response received from GenAI model."
      });
    } catch (err: any) {
      console.log("[INFO] Gemini service connection status:", err.message || String(err));
      
      let errorMsg = err.message || String(err);
      
      // Check if the error message contains a JSON block and parse the clear user-facing error message
      if (typeof errorMsg === "string") {
        try {
          const jsonStart = errorMsg.indexOf("{");
          if (jsonStart !== -1) {
            const potentialJson = errorMsg.substring(jsonStart);
            const parsed = JSON.parse(potentialJson);
            if (parsed && parsed.error && parsed.error.message) {
              errorMsg = parsed.error.message;
            } else if (parsed && parsed.message) {
              errorMsg = parsed.message;
            }
          }
        } catch (e) {
          // Not a JSON string or parsing failed, preserve original
        }
      }

      // Friendly fallback translation for 503/UNAVAILABLE or heavy demand spikes
      const lowerMsg = errorMsg.toLowerCase();
      if (
        lowerMsg.includes("503") || 
        lowerMsg.includes("unavailable") || 
        lowerMsg.includes("high demand") || 
        lowerMsg.includes("service unavailable") ||
        lowerMsg.includes("overloaded") ||
        lowerMsg.includes("quota") ||
        lowerMsg.includes("limit") ||
        lowerMsg.includes("429")
      ) {
        errorMsg = "The developer API free-tier has reached its transient quota limit (~20 requests per minute). Please wait a few seconds and try clicking 'Run AI' again, or consider adding your own API key in the Settings menu (top-right) if this continues!";
      }
      
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // Fallback for unmatched API routes to prevent HTML/Vite SPA serving for API pathways
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      error: `API endpoint not found: ${req.method} ${req.originalUrl}`
    });
  });

  // --- VITE MIDDLEWARE OR STATIC SERVING ---

  if (process.env.NODE_ENV !== "production") {
    console.log("Running in DEVELOPMENT mode. Mounting Vite dev middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in PRODUCTION mode. Serving pre-built static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started and listening to port ${PORT} at host 0.0.0.0`);
  });
}

startServer();
