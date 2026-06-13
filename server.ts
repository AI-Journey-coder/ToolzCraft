import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  app.get("/api/feedback", (req, res) => {
    try {
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
        const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
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

  // POST feedback to CSV
  app.post("/api/feedback", (req, res) => {
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

      fs.appendFileSync(csvFilePath, newLine + "\n", "utf8");
      res.json({ success: true, message: "Feedback recorded in local CSV file successfully!" });
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
      
      const prompt = `You are a universal developer and system modernization utility backend sandbox.
We are running the virtual tool: "${toolName}" (ID: "${toolId}").
The user has passed the following form inputs or text content:
${JSON.stringify(inputs, null, 2)}

Execute the logical core of this tool. 
- If this is a Database DDL converter (e.g., Oracle to PostgreSQL), convert the inputted schema script with correct syntax, high-contrast, clean casing, and output comments explaining the changes.
- If it is a Contact Duplicate Finder or Contact cleaner, parse the contacts and demonstrate duplicate list sorting.
- If it is a Chat analyzer, analyze message counts, frequency, and output statistics tables or leaderboards.
- If it is a Schema comparison or compare utility, analyze the keys and outputs side-by-side.
- If it is a modern COBOL parser, show tabular memory divisions and data item structure maps out of the copybook.
- If it is a receipt or invoice OCR parser, extract the merchant details, date lines, tax percentages, and full line item listings in a tabular format.
- Otherwise, execute the task correctly based on its utility definition.

Format the output beautifully and directly using Markdown so that the client can render it in a clean, professional preformatted viewport. Do NOT wrap it in a markdown code box of another markdown code block unless helpful - make the headers readable, the text informative, and include realistic results, reports, conversion lists, or tables as requested. Avoid any preamble words like 'Sure, here is the result'; just jump straight into the formatted output, utility report, or translated conversion.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({
        success: true,
        isMock: false,
        output: response.text || "No response received from GenAI model."
      });
    } catch (err: any) {
      console.error("Gemini invocation error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
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
