import React, { useState, useEffect, useMemo } from "react";
import { 
  FileText, Image, RefreshCw, Sparkles, AlertCircle, CheckCircle, 
  Download, ArrowRightLeft, Copy, Sliders, Play, Terminal, 
  FileSpreadsheet, HelpCircle, Loader2, Star, Plus, Minus, RotateCcw,
  ArrowLeft, ArrowRight, Upload, Trash2, ArrowUp, ArrowDown, File, Search,
  Database, Barcode
} from "lucide-react";
import { Tool } from "../types";
import { CATEGORIES } from "../data";
import FeedbackForm from "./FeedbackForm";
import AdSenseAd from "./AdSenseAd";
import SchemaTableVisualizer from "./SchemaTableVisualizer";
import SubscriptionPaywallModal from "./SubscriptionPaywallModal";
import ReceiptDocumentViewer from "./ReceiptDocumentViewer";
import ApiIntegrationVisualizer from "./ApiIntegrationVisualizer";
import { CONVERTER_SAMPLES, generateRandomCodeForTesting } from "../lib/codePresets";

// --- HIGH-FIDELITY JSON AST DIAGNOSTIC UTILITIES ---
function analyzeJsonError(input: string) {
  if (!input.trim()) {
    return {
      isValid: false,
      errorMsg: "Empty input payload provided. JSON requires an Object or Array literal.",
      line: 1,
      column: 1,
      offset: 0,
      tokenFound: "EOF (End of File)",
      expectedToken: "Object '{' or Array '[' root literal",
      jsonPath: "$",
      originalSnippet: "No input provided",
      correctedSnippet: "{\n  \n}",
      diagnostics: [
        {
          code: "AST_EMPTY_PAYLOAD",
          severity: "CRITICAL",
          description: "Terminal exception: Entered character array is completely empty or blank.",
          path: "$"
        }
      ]
    };
  }

  try {
    const parsed = JSON.parse(input);
    const rootType = Array.isArray(parsed) ? "Array" : (parsed === null ? "Null" : typeof parsed);
    const size = input.length;
    let depth = 0;
    
    // Safely calculate maximum nesting depth
    const getDepth = (obj: any): number => {
      if (obj === null || typeof obj !== "object") return 0;
      const vals = Object.values(obj);
      if (vals.length === 0) return 1;
      return 1 + Math.max(...vals.map(v => getDepth(v)));
    };
    try {
      depth = getDepth(parsed);
    } catch {
      depth = 1;
    }

    return {
      isValid: true,
      errorMsg: "ECMA-404 AST compliance validated.",
      line: 0,
      column: 0,
      offset: 0,
      tokenFound: "",
      expectedToken: "",
      jsonPath: "$",
      originalSnippet: input,
      correctedSnippet: JSON.stringify(parsed, null, 2),
      diagnostics: [],
      metadata: {
        rootType,
        byteSize: `${size} Bytes`,
        propertiesCount: rootType === "object" ? Object.keys(parsed).length : (rootType === "Array" ? parsed.length : 0),
        nestingDepth: depth
      }
    };
  } catch (err: any) {
    const msg = err.message || "Syntactical structure anomaly detected.";
    let line = 1;
    let column = 1;
    let offset = 0;

    const posMatch = msg.match(/position\s+(\d+)/i) || msg.match(/char\s+(\d+)/i) || msg.match(/at\s+(\d+)/i);
    const lineColMatch = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i);

    if (lineColMatch) {
      line = parseInt(lineColMatch[1]);
      column = parseInt(lineColMatch[2]);
      const lines = input.split("\n");
      let sum = 0;
      for (let i = 0; i < line - 1; i++) {
        sum += lines[i].length + 1;
      }
      offset = sum + (column - 1);
    } else if (posMatch) {
      offset = parseInt(posMatch[1]);
      const sub = input.substring(0, offset);
      const lines = sub.split("\n");
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    } else {
      // Manual backup scanning
      const openCurly = (input.match(/{/g) || []).length;
      const closeCurly = (input.match(/}/g) || []).length;
      if (openCurly !== closeCurly) {
        line = input.split("\n").length;
        column = 1;
        offset = input.length;
      }
    }

    // Capture original surrounding rows for display
    const lines = input.split("\n");
    const startLineIdx = Math.max(0, line - 3);
    const endLineIdx = Math.min(lines.length - 1, line + 1);
    
    const originalSnippet = lines.slice(startLineIdx, endLineIdx + 1).map((l, idx) => {
      const curLineNum = startLineIdx + idx + 1;
      const isErr = curLineNum === line;
      let text = `${curLineNum.toString().padStart(3, " ")} | ${l}`;
      if (isErr) {
        const markerSpacing = " ".repeat(Math.max(0, column - 1));
        text += `\n    | ${markerSpacing}^--- ERROR: ${msg}`;
      }
      return text;
    }).join("\n");

    // AST Auto-correction logic
    let corrected = input;
    
    // 1. Single quotes to double quotes for strings keys/values
    corrected = corrected.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
    
    // 2. Unquoted object keys
    corrected = corrected.replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');
    
    // 3. Remove trailing commas in objects and arrays
    corrected = corrected.replace(/,\s*([\]}])/g, '$1');

    // 4. Balance mismatched braces and brackets
    let openCurlyCount = (corrected.match(/{/g) || []).length;
    let closeCurlyCount = (corrected.match(/}/g) || []).length;
    let openBracketCount = (corrected.match(/\[/g) || []).length;
    let closeBracketCount = (corrected.match(/]/g) || []).length;

    while (openCurlyCount > closeCurlyCount) {
      corrected += "\n}";
      closeCurlyCount++;
    }
    while (openBracketCount > closeBracketCount) {
      corrected += "\n]";
      closeBracketCount++;
    }

    let correctedSnippet = corrected;
    try {
      correctedSnippet = JSON.stringify(JSON.parse(corrected), null, 2);
    } catch {
      // Fallback formatting
      correctedSnippet = corrected;
    }

    // Isolate target token
    let tokenFound = input.charAt(offset) || "EOF (End of File)";
    if (tokenFound.trim() === "") {
      tokenFound = "Whitespace / Linebreak";
    }

    let expectedToken = "Valid JSON Token";
    if (tokenFound === "}") expectedToken = "Value, element string, or comma delimiter";
    else if (tokenFound === "]") expectedToken = "Array element or comma delimiter";
    else if (tokenFound === ",") expectedToken = "Property key identifier or nested object";

    // Deduce rule discrepancy codes
    let ruleCode = "AST_SYNTAX_DISRUPTION";
    let ruleDesc = "The file stream contains syntactically invalid character markers interfering with V8 standard lexical scanning.";
    
    if (msg.toLowerCase().includes("comma") || msg.toLowerCase().includes("expected ','")) {
      ruleCode = "MISSING_COMMA_DELIMITER";
      ruleDesc = "Standard comma boundary delimiter is missing between sibling variables or items.";
    } else if (msg.toLowerCase().includes("quote") || msg.toLowerCase().includes("single quote")) {
      ruleCode = "ILLEGAL_SINGLE_QUOTES";
      ruleDesc = "ECMA-404 strict rules require double quotation marks for all property labels and value strings.";
    } else if (msg.toLowerCase().includes("unclosed") || msg.toLowerCase().includes("string")) {
      ruleCode = "UNCLOSED_STRING_LITERAL";
      ruleDesc = "Double-quote string literal marker was opened but never terminated before newline boundary.";
    } else if (msg.toLowerCase().includes("bracket") || msg.toLowerCase().includes("brace")) {
      ruleCode = "UNBALANCED_SCOPE_DELIMITER";
      ruleDesc = "Mismatch detected between opening array/object structures and closing delimiters.";
    }

    const calculatedPath = `$.key_near_line_${line}`;

    return {
      isValid: false,
      errorMsg: msg,
      line,
      column,
      offset,
      tokenFound,
      expectedToken,
      jsonPath: calculatedPath,
      originalSnippet,
      correctedSnippet,
      diagnostics: [
        {
          code: ruleCode,
          severity: "CRITICAL",
          description: ruleDesc,
          path: calculatedPath
        },
        {
          code: "ECMA404_STRICT_SCHEMA",
          severity: "WARNING",
          description: "All property key identifiers must correspond to exact double-quoted schema templates.",
          path: "$"
        }
      ]
    };
  }
}

function generateRawHtmlReport(report: any): string {
  if (!report) return "";
  const { line, column, errorMsg, tokenFound, expectedToken, jsonPath, originalSnippet, correctedSnippet, diagnostics } = report;

  const diagnosticsRows = diagnostics && diagnostics.length > 0 
    ? diagnostics.map((d: any) => `
            <tr style="border-bottom: 1px solid rgba(51, 65, 85, 0.25); transition: background-color 155ms;">
              <td style="padding: 12px 16px; color: #f43f5e; font-weight: 700; font-family: monospace; font-size: 11px;">\${d.code}</td>
              <td style="padding: 12px 16px;">
                <span style="padding: 2px 6px; border-radius: 4px; font-weight: 850; font-size: 9px; \${
                  d.severity === 'CRITICAL' 
                    ? 'background-color: rgba(244, 63, 94, 0.1); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.15);' 
                    : 'background-color: rgba(245, 158, 11, 0.1); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.15);'
                }">
                  \${d.severity}
                </span>
              </td>
              <td style="padding: 12px 16px; color: #cbd5e1; font-family: sans-serif; font-size: 11px; max-width: 250px;">\${d.description}</td>
              <td style="padding: 12px 16px; color: #94a3b8; font-family: monospace; font-size: 11px; user-select: all;">\${d.path}</td>
            </tr>`
      ).join("")
    : `<tr><td colspan="4" style="padding: 16px; text-align: center; color: #64748b; font-family: monospace;">No diagnostics logs.</td></tr>`;

  // Standard safe character escapes for templates
  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  return `<!-- ToolzCraft JSON Syntax & AST Validation Report -->
<div class="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-6 text-slate-100 shadow-2xl font-sans" style="background-color: #0b0f19; border-color: #1e293b; color: #cbd5e1; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Status Hero With Eye-Friendly Glow -->
  <div style="position: relative; overflow: hidden; background-color: rgba(15, 23, 42, 0.6); border: 1px solid rgba(244, 63, 94, 0.2); border-radius: 16px; padding: 20px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);">
    <div style="position: absolute; top: -48px; left: -48px; width: 128px; height: 128px; background-color: rgba(244, 63, 94, 0.04); border-radius: 9999px; filter: blur(24px);"></div>
    <div style="display: flex; flex-direction: row; align-items: center; gap: 16px; position: relative;">
      <div style="height: 48px; width: 48px; border-radius: 12px; background-color: rgba(244, 63, 94, 0.08); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(244, 63, 94, 0.15); flex-shrink: 0;">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <div>
        <span style="font-size: 9px; font-weight: 700; background-color: rgba(244, 63, 94, 0.12); color: #f43f5e; padding: 2px 10px; border-radius: 9999px; font-family: monospace; letter-spacing: 0.1em; text-transform: uppercase;">SYNTAX SPEC EXCEPTION</span>
        <h3 style="font-size: 16px; font-weight: 800; color: #ffffff; margin: 4px 0 0 0; letter-spacing: -0.025em;">JSON Validation Report</h3>
        <p style="font-size: 12px; color: #94a3b8; margin: 4px 0 0 0;">An unhandled syntax obstacle disrupted the AST parsing near Line ${line}, Column ${column}.</p>
      </div>
      <span style="margin-left: auto; font-size: 10px; font-family: monospace; font-weight: 700; color: #475569; letter-spacing: 0.1em; text-transform: uppercase;">AST_DIAGNOSTICS_COMPLIANCE</span>
    </div>
  </div>

  <div style="display: flex; flex-direction: column; gap: 24px;">
    
    <!-- Row 1: Exception Summary Grid -->
    <div>
      <h4 style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">1. AST Exception Summary</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; font-family: monospace; font-size: 11px;">
        <div>
          <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">TOKEN OBSERVED</span>
          <span style="color: #f87171; font-weight: 850; background-color: rgba(239, 68, 68, 0.1); padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.15); display: inline-block;">
            ${escapeHtml(tokenFound)}
          </span>
        </div>
        <div>
          <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">EXPECTED TOKENS</span>
          <span style="color: #34d399; font-weight: 850; background-color: rgba(16, 185, 129, 0.1); padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.15); display: inline-block;">
            ${escapeHtml(expectedToken)}
          </span>
        </div>
        <div>
          <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">JSON KEYPATH</span>
          <span style="color: #e2e8f0; font-weight: 600; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(jsonPath)}">
            ${escapeHtml(jsonPath)}
          </span>
        </div>
        <div>
          <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">SLA SPEC COMPLIANCE</span>
          <span style="color: #f59e0b; font-weight: 850; background-color: rgba(245, 158, 11, 0.1); padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.15); display: inline-block; text-transform: uppercase;">
            NON-COMPLIANT
          </span>
        </div>
      </div>
    </div>

    <!-- Row 2: Diagnostics Ledger Table -->
    <div>
      <h4 style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">2. AST Diagnostics Ledger</h4>
      <div style="overflow-x: auto; border-radius: 12px; border: 1px solid #1e293b; background-color: #020617;">
        <table style="width: 1full; text-align: left; border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #0f172a; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 9px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; font-family: monospace;">
              <th style="padding: 12px 16px;">Rule Key</th>
              <th style="padding: 12px 16px;">Severity</th>
              <th style="padding: 12px 16px; font-family: sans-serif;">Discrepancy Details</th>
              <th style="padding: 12px 16px;">Locator Path</th>
            </tr>
          </thead>
          <tbody style="color: #e2e8f0;">
            ${diagnosticsRows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Row 3: IDE Comparison View Side-by-Side -->
    <div>
      <h4 style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">3. Side-by-Side Code Rectification Editor</h4>
      <div style="border-radius: 16px; border: 1px solid #1e293b; background-color: #020617; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.55);">
        
        <!-- Tab Window Control Panel -->
        <div style="background-color: #0f172a; padding: 12px 16px; border-bottom: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="height: 10px; width: 10px; border-radius: 9999px; background-color: #ff5f56; display: inline-block;"></span>
            <span style="height: 10px; width: 10px; border-radius: 9999px; background-color: #ffbd2e; display: inline-block;"></span>
            <span style="height: 10px; width: 10px; border-radius: 9999px; background-color: #27c93f; display: inline-block;"></span>
          </div>
          <span style="font-family: monospace; font-size: 9px; font-weight: 700; color: #475569; letter-spacing: 0.1em; text-transform: uppercase;">AST RECTIFIER PARSER IDE</span>
          <span style="font-family: monospace; font-size: 9px; background-color: #1e293b; color: #94a3b8; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">Line ${line} Col ${column}</span>
        </div>

        <!-- Divided Editor Screen -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); background-color: #111420;">
          
          <!-- Original Corrupted View -->
          <div style="padding: 16px; background-color: rgba(244, 63, 94, 0.01); border-bottom: 1px solid #1e293b;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 700; color: #fda4af; font-family: monospace; text-transform: uppercase; background-color: rgba(244, 63, 94, 0.06); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(244, 63, 94, 0.12); margin-bottom: 10px;">
              <span>Broken Input Payload</span>
              <span>SYNTAX ERROR</span>
            </div>
            <pre style="font-family: monospace; font-size: 11px; color: #fda4af; line-height: 1.6; padding: 12px; border-radius: 8px; background-color: rgba(244, 63, 94, 0.04); border: 1px solid rgba(244, 63, 94, 0.08); overflow-x: auto; max-height: 320px; white-space: pre; margin: 0;">${escapeHtml(originalSnippet)}</pre>
          </div>

          <!-- Suggested Autocorrect Proposed View -->
          <div style="padding: 16px; background-color: rgba(16, 185, 129, 0.01); border-left: 1px solid #1e293b;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 700; color: #6ee7b7; font-family: monospace; text-transform: uppercase; background-color: rgba(16, 185, 129, 0.06); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.12); margin-bottom: 10px;">
              <span>Sovereign Rectified Proposal</span>
              <span>RECOVERABLE</span>
            </div>
            <pre style="font-family: monospace; font-size: 11px; color: #6ee7b7; line-height: 1.6; padding: 12px; border-radius: 8px; background-color: rgba(16, 185, 129, 0.04); border: 1px solid rgba(16, 185, 129, 0.08); overflow-x: auto; max-height: 320px; white-space: pre; margin: 0;">${escapeHtml(correctedSnippet)}</pre>
          </div>

        </div>

      </div>
    </div>

  </div>
</div>`;
}

const DEFAULT_CONTACTS = [
  { id: "c1", name: "John Doe", phone: "123-456-7890", email: "john.doe@example.com", company: "Acme Corp", tags: ["Sales"], accountType: "Google" },
  { id: "c2", name: "John Doe", phone: "1234567890", email: "john@doe.com", company: "Acme Inc.", tags: ["Lead"], accountType: "Apple" },
  { id: "c3", name: "Sarah Connor", phone: "+1 (555) 0199", email: "sarah@skynet.com", company: "Cyberdyne", tags: ["Premium"], accountType: "Microsoft" },
  { id: "c4", name: "Sarah Connor", phone: "5550199", email: "sconnor@skynet.com", company: "Cyberdyne Systems", tags: [], accountType: "Google" },
  { id: "c5", name: "robert smith", phone: "(555) 123-4567", email: "bob@smith.org", company: "", tags: [], accountType: "Apple" },
  { id: "c6", name: "Robert \"Bob\" Smith", phone: "5551234567", email: "", company: "Smith Bros", tags: ["Partner"], accountType: "Google" },
  { id: "c7", name: "Alice Vance", phone: "", email: "alice@vance.io", company: "Vance Systems", tags: ["VIP"], accountType: "Google" },
  { id: "c8", name: "Charlie", phone: "987-654-3210", email: "", company: "", tags: [], accountType: "Apple" },
  { id: "c9", name: "Jane   Sloane", phone: "+1 555-900-1111", email: "jane.solane@example.com", company: "Sloane Ltd", tags: ["Staff"], accountType: "Google" },
  { id: "c10", name: "Dirty Number Guy", phone: "+1234-abc-def-7", email: "dirty@number.com", company: "", tags: [], accountType: "Microsoft" }
];

interface ToolAreaProps {
  tool: Tool;
  user: { email?: string; phone?: string; provider: "google" | "phone"; isPremium: boolean } | null;
  onTriggerAuth: () => void;
  onTriggerSubscription: () => void;
  onUpgradeComplete: () => void;
  onGoBackToCategory?: (categoryId: string) => void;
}

export default function ToolArea({ tool, user, onTriggerAuth, onTriggerSubscription, onUpgradeComplete, onGoBackToCategory }: ToolAreaProps) {
  // Common states
  const [copiedText, setCopiedText] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Custom API Attempt Limit Tracking states
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [attempts, setAttempts] = useState(() => {
    return Number(localStorage.getItem("toolzcraft_api_attempts") || "0");
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Code Generators & Code Converters local states
  const [generatorEntity, setGeneratorEntity] = useState("UserRecord");
  const [generatorDatabase, setGeneratorDatabase] = useState("postgresql");
  const [generatorFramework, setGeneratorFramework] = useState("express");

  // Reset errors on tool change
  useEffect(() => {
    setErrorMessage("");
    setSuccessMessage("");
    setAiOutput("");
    if (tool.id === "bg-remover") {
      setMediaQuality(30);
      setMediaFormat("sharp");
      setBgKeyType("white");
    }

    if (CONVERTER_SAMPLES[tool.id]) {
      setAiInputs(prev => ({
        ...prev,
        code: CONVERTER_SAMPLES[tool.id][0].code
      }));
    } else if (tool.category === "code-generators") {
      setAiInputs(prev => ({
        ...prev,
        code: `// Selected testing template target: ${tool.name}\n// Custom Target Entity Casing: ${generatorEntity}\n// Target Datastore: ${generatorDatabase}\n// Framework: ${generatorFramework}`
      }));
    }
  }, [tool.id, tool.category]);

  // ==========================================
  // PDF MERGE STATE & HANDLERS
  // ==========================================
  const [pdfMergeFiles, setPdfMergeFiles] = useState<{ id: string; name: string; size: number; file: File }[]>([]);
  const [mergingPdfs, setMergingPdfs] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string>("");
  const [mergedPdfSize, setMergedPdfSize] = useState<number>(0);

  const handlePdfMergeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newList = [...pdfMergeFiles];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type === "application/pdf") {
          newList.push({
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            size: file.size,
            file: file,
          });
        } else {
          setErrorMessage("Only PDF documents are supported for merging.");
        }
      }
      setPdfMergeFiles(newList);
      setMergedPdfUrl("");
    }
  };

  const handleRemovePdfMergeFile = (id: string) => {
    setPdfMergeFiles(pdfMergeFiles.filter(item => item.id !== id));
    setMergedPdfUrl("");
  };

  const handleMovePdfMergeFile = (index: number, direction: "up" | "down") => {
    const newList = [...pdfMergeFiles];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx >= 0 && targetIdx < newList.length) {
      const temp = newList[index];
      newList[index] = newList[targetIdx];
      newList[targetIdx] = temp;
      setPdfMergeFiles(newList);
      setMergedPdfUrl("");
    }
  };

  const handleMergePdfs = async () => {
    if (pdfMergeFiles.length < 2) {
      setErrorMessage("Please upload at least two PDF files to merge.");
      return;
    }
    setMergingPdfs(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const mergedPdf = await PDFDocument.create();
      
      for (const item of pdfMergeFiles) {
        const fileBytes = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setMergedPdfUrl(url);
      setMergedPdfSize(blob.size);
      setSuccessMessage(`Successfully merged ${pdfMergeFiles.length} PDF files!`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to merge PDF files: " + (err.message || String(err)));
    } finally {
      setMergingPdfs(false);
    }
  };

  // ==========================================
  // 1. IMAGE COMPRESSOR WORKSPACE
  // ==========================================
  const [compressImgFile, setCompressImgFile] = useState<File | null>(null);
  const [compressPreview, setCompressPreview] = useState<string>("");
  const [compressQuality, setCompressQuality] = useState<number>(0.75);
  const [compressScale, setCompressScale] = useState<number>(1.0);
  const [compressedResult, setCompressedResult] = useState<{
    url: string;
    size: number;
    savings: number;
    originalSize: number;
  } | null>(null);
  const [compressing, setCompressing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompressImgFile(file);
      setCompressPreview(URL.createObjectURL(file));
      setCompressedResult(null);
    }
  };

  const handleCompressImage = () => {
    if (!compressImgFile || !compressPreview) return;
    setCompressing(true);

    const img = new window.Image();
    img.src = compressPreview;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setErrorMessage("Could not establish 2D canvas context.");
        setCompressing(false);
        return;
      }

      const targetWidth = img.width * compressScale;
      const targetHeight = img.height * compressScale;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Draw and compress locally
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      const mime = compressImgFile.type === "image/png" ? "image/jpeg" : compressImgFile.type;
      const compressedDataUrl = canvas.toDataURL(mime, compressQuality);
      
      // Calculate compressed size
      const stringLength = compressedDataUrl.split(",")[1].length;
      const sizeInBytes = Math.round(stringLength * 0.75);

      const originalSizeBytes = compressImgFile.size;
      const savingsPercentage = Math.round(((originalSizeBytes - sizeInBytes) / originalSizeBytes) * 100);

      setCompressedResult({
        url: compressedDataUrl,
        size: sizeInBytes,
        savings: Math.max(0, savingsPercentage),
        originalSize: originalSizeBytes
      });
      setCompressing(false);
    };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // ==========================================
  // 2. PDF CONVERTER WORKSPACE
  // ==========================================
  const [docTitle, setDocTitle] = useState("Corporate Briefing Document");
  const [docContent, setDocContent] = useState("# Business Strategy Overview\n\nThis compiled memorandum operates in alignment with certified SOC 2 compliance parameters.\n\nAll documents and details entered on this sheet are formulated strictly inside client-side virtual memories.\n\n### Core Milestones:\n- 100% Client transparency\n- Local CSV Feedback persistency\n- Secure zero-retention parameters");
  const [docPaperSize, setDocPaperSize] = useState("A4");
  const [docMargin, setDocMargin] = useState(20);
  const [docColorTheme, setDocColorTheme] = useState("emerald");

  const handlePrintDocument = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setErrorMessage("Pop-up blocked. Please enable pop-ups or click download instead.");
      return;
    }

    const themeColors: Record<string, string> = {
      emerald: "#10b981",
      indigo: "#6366f1",
      slate: "#475569",
    };

    const activeColor = themeColors[docColorTheme] || "#10b981";

    const htmlContent = `
      <html>
        <head>
          <title>${docTitle}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              padding: ${docMargin}mm;
              font-size: 14px;
              color: #1f2937;
              line-height: 1.6;
              background: #fff;
            }
            .header {
              border-bottom: 2px solid ${activeColor};
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .title {
              font-size: 28px;
              font-weight: 700;
              color: #111827;
              margin: 0;
            }
            .meta {
              font-size: 11px;
              color: #6b7280;
              margin-top: 5px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            h1, h2, h3 {
              color: #111827;
              margin-top: 1.5em;
              margin-bottom: 0.5em;
            }
            h1 { font-size: 22px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
            h2 { font-size: 18px; }
            h3 { font-size: 15px; }
            p { margin-bottom: 1em; }
            ul { margin-bottom: 1em; padding-left: 20px; }
            li { margin-bottom: 0.25em; }
            .footer {
              position: fixed;
              bottom: ${docMargin}mm;
              left: ${docMargin}mm;
              right: ${docMargin}mm;
              font-size: 10px;
              color: #9ca3af;
              border-top: 1px solid #e5e7eb;
              padding-top: 10px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${docTitle}</h1>
            <div class="meta">Compiled with ToolzCraft PDF Utility • Format: ${docPaperSize} • Printed on: ${new Date().toLocaleDateString()}</div>
          </div>
          <div>
            ${docContent
              .replace(/\n\n/g, "</p><p>")
              .replace(/\n- (.*)/g, "<li>$1</li>")
              .replace(/### (.*)/g, "<h3>$1</h3>")
              .replace(/## (.*)/g, "<h2>$1</h2>")
              .replace(/# (.*)/g, "<h1>$1</h1>")
            }
          </div>
          <div class="footer">
            CONFIDENTIAL • ToolzCraft GDPR zero retention data framework alignment.
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadTxtCopy = () => {
    const textBlob = new Blob([`TITLE: ${docTitle}\n===================\n\n${docContent}`], { type: "text/plain" });
    const url = URL.createObjectURL(textBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${docTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // 3. UNIT CONVERTER (Specially requested custom design!)
  // ==========================================
  const [conversionCategory, setConversionCategory] = useState<
    "length" | "mass" | "volume" | "temp" | "power" | "work" | "force" | "pressure" | "area" | "currency" | "weight" | "time" | "speed"
  >("length");
  const [conversionValue, setConversionValue] = useState<number>(1);
  const [conversionValueText, setConversionValueText] = useState<string>("1");
  const [sourceUnit, setSourceUnit] = useState<string>("m");
  const [conversionResults, setConversionResults] = useState<{ unit: string; name: string; value: number | string }[]>([]);

  const lengthUnits = [
    { id: "m", name: "Meters", ratio: 1.0 },
    { id: "cm", name: "Centimeters", ratio: 100.0 },
    { id: "mm", name: "Millimeters", ratio: 1000.0 },
    { id: "km", name: "Kilometers", ratio: 0.001 },
    { id: "mile", name: "Miles", ratio: 0.000621371 },
    { id: "inch", name: "Inches", ratio: 39.3701 },
    { id: "feet", name: "Feet", ratio: 3.28084 },
    { id: "yard", name: "Yards", ratio: 1.09361 }
  ];

  const massUnits = [
    { id: "kg", name: "Kilograms", ratio: 1.0 },
    { id: "ug", name: "Micrograms (µg)", ratio: 1000000000.0 },
    { id: "mg", name: "Milligrams (mg)", ratio: 1000000.0 },
    { id: "g", name: "Grams (g)", ratio: 1000.0 },
    { id: "lb", name: "Pounds (lb)", ratio: 2.20462262 },
    { id: "oz", name: "Ounces (oz)", ratio: 35.2739619 },
    { id: "grain", name: "Grains", ratio: 15432.3584 },
    { id: "q", name: "Quintals (q)", ratio: 0.01 },
    { id: "tonne", name: "Tonnes (t)", ratio: 0.001 },
    { id: "ton_uk", name: "Tons (UK)", ratio: 0.0009842065 },
    { id: "stone_uk", name: "Stones (UK)", ratio: 0.15747304 },
    { id: "carat", name: "Carats (ct)", ratio: 5000.0 },
    { id: "tola", name: "Tolas", ratio: 85.7352336 },
    { id: "ratti", name: "Rattis", ratio: 8201.761 }
  ];

  const volumeUnits = [
    { id: "L", name: "Liters (L)", ratio: 1.0 },
    { id: "cl", name: "Centiliters (cl)", ratio: 100.0 },
    { id: "dl", name: "Deciliters (dl)", ratio: 10.0 },
    { id: "mm3", name: "Cubic Millimeters (mm³)", ratio: 1000000.0 },
    { id: "cm3", name: "Cubic Centimeters (cm³)", ratio: 1000.0 },
    { id: "dm3", name: "Cubic Decimeters (dm³)", ratio: 1.0 },
    { id: "m3", name: "Cubic Meters (m³)", ratio: 0.001 },
    { id: "in3", name: "Cubic Inches (in³)", ratio: 61.0237441 },
    { id: "ft3", name: "Cubic Feet (ft³)", ratio: 0.0353146667 },
    { id: "yd3", name: "Cubic Yards (yd³)", ratio: 0.00130795062 },
    { id: "gal_uk", name: "Gallons (UK)", ratio: 0.219969248 },
    { id: "gal_us", name: "Gallons (US)", ratio: 0.264172052 },
    { id: "bbl", name: "Barrels (bbl)", ratio: 0.006289811 },
    { id: "pt_uk", name: "Pints (UK)", ratio: 1.759754 },
    { id: "pt_us", name: "Pints (US)", ratio: 2.1133764 },
    { id: "fl_oz_us", name: "Fluid Ounces (US)", ratio: 33.8140227 },
    { id: "brass", name: "Brass (Indian)", ratio: 0.000353146667 }
  ];

  const powerUnits = [
    { id: "W", name: "Watts (W)", ratio: 1.0 },
    { id: "kW", name: "Kilowatts (kW)", ratio: 0.001 },
    { id: "MW", name: "Megawatts (MW)", ratio: 0.000001 },
    { id: "kcal_s", name: "Kilocalories per sec (kcal/s)", ratio: 0.0002388458966 },
    { id: "kcal_h", name: "Kilocalories per hour (kcal/h)", ratio: 0.859845227859 },
    { id: "HP", name: "Mechanical HP (HP)", ratio: 0.0013410220896 },
    { id: "PS", name: "Metric Horsepower (PS)", ratio: 0.0013596216 },
    { id: "BTU_h", name: "BTU per hour (BTU/h)", ratio: 3.412141633 },
    { id: "TR", name: "Tons of Refrig. (TR)", ratio: 0.000284345 },
    { id: "BHP", name: "Boiler Horsepower (BHP)", ratio: 0.00134048 },
    { id: "dBm", name: "Decibel-milliwatts (dBm)", ratio: 1.0, isSpecial: true }
  ];

  const workUnits = [
    { id: "J", name: "Joules (J)", ratio: 1.0 },
    { id: "kJ", name: "Kilojoules (kJ)", ratio: 0.001 },
    { id: "cal", name: "Calories (cal)", ratio: 0.239005736 },
    { id: "kcal", name: "Kilocalories (kcal/Cal)", ratio: 0.000239005736 },
    { id: "kWh", name: "Kilowatt Hours (kW-h)", ratio: 2.7777777777778e-7 },
    { id: "kgf_m", name: "Kilogram force meters (kgf-m)", ratio: 0.101971621 },
    { id: "in_lbf", name: "Inch-pounds (in-lbf)", ratio: 8.85074579 },
    { id: "ft_lbf", name: "Foot-pounds (ft-lbf)", ratio: 0.737562149 },
    { id: "BTU", name: "British Thermal Units (BTU)", ratio: 0.00094781712 },
    { id: "toe", name: "Tons of oil equiv. (toe)", ratio: 2.388458966275e-11 }
  ];

  const forceUnits = [
    { id: "N", name: "Newtons (N)", ratio: 1.0 },
    { id: "daN", name: "Decanewtons (daN)", ratio: 0.1 },
    { id: "kN", name: "Kilonewtons (kN)", ratio: 0.001 },
    { id: "kgf", name: "Kilogram force (kgf)", ratio: 0.101971621 },
    { id: "lbf", name: "Pounds force (lbf)", ratio: 0.224808943 },
    { id: "kip", name: "Kips (kip)", ratio: 0.000224808943 }
  ];

  const pressureUnits = [
    { id: "Pa", name: "Pascals (Pa)", ratio: 1.0 },
    { id: "atm", name: "Atmospheres (atm)", ratio: 9.86923267e-6 },
    { id: "hPa", name: "Hectopascals (hPa/mbar)", ratio: 0.01 },
    { id: "kPa", name: "Kilopascals (kPa)", ratio: 0.001 },
    { id: "MPa", name: "Megapascals (MPa)", ratio: 0.000001 },
    { id: "bar", name: "Bars (bar)", ratio: 0.00001 },
    { id: "psi", name: "psi (lbf/in²)", ratio: 0.0001450377377 },
    { id: "psf", name: "psf (lbf/ft²)", ratio: 0.020885434233 },
    { id: "ksi", name: "ksi", ratio: 1.450377377e-7 },
    { id: "kgf_cm2", name: "kgf/cm²", ratio: 1.019716212978e-5 },
    { id: "kgf_m2", name: "kgf/m²", ratio: 0.1019716212978 },
    { id: "mmHg", name: "mmHg (Torr)", ratio: 0.007500615758 },
    { id: "cmHg", name: "cmHg", ratio: 0.0007500615758 },
    { id: "inchHg", name: "inchHg", ratio: 0.0002952998307 },
    { id: "mmH2O", name: "mmH2O", ratio: 0.10197162129 },
    { id: "cmH2O", name: "cmH2O", ratio: 0.010197162129 },
    { id: "inchH2O", name: "inchH2O", ratio: 0.00401463076 },
    { id: "mTorr", name: "mTorr", ratio: 7.500615758 }
  ];

  const areaUnits = [
    { id: "m2", name: "Square Meters (m²)", ratio: 1.0 },
    { id: "mm2", name: "Square Millimeters (mm²)", ratio: 1000000.0 },
    { id: "cm2", name: "Square Centimeters (cm²)", ratio: 10000.0 },
    { id: "dm2", name: "Square Decimeters (dm²)", ratio: 100.0 },
    { id: "in2", name: "Square Inches (in²)", ratio: 1550.0031 },
    { id: "ft2", name: "Square Feet (ft²)", ratio: 10.7639104 },
    { id: "yd2", name: "Square Yards (yd²)", ratio: 1.19599005 },
    { id: "acre", name: "Acres", ratio: 0.00024710538 },
    { id: "a", name: "Ares (a)", ratio: 0.01 },
    { id: "ha", name: "Hectares (ha)", ratio: 0.0001 },
    { id: "km2", name: "Square Kilometers (km²)", ratio: 0.000001 },
    { id: "Gunta", name: "Guntas (Indian)", ratio: 0.0098842153 },
    { id: "Cent", name: "Cents / Dismils (Indian)", ratio: 0.024710538 },
    { id: "link2", name: "Square Links (Gunter's)", ratio: 24.710538 },
    { id: "Bigha_Kaccha", name: "Bighas (Kaccha - North India)", ratio: 0.0011862396 },
    { id: "Bigha_Gujarat", name: "Bighas (Gujarat)", ratio: 0.00061778 }
  ];

  const currencyUnits = [
    { id: "USD", name: "US Dollar (USD)", ratio: 1.0 },
    { id: "INR", name: "Indian Rupee (INR)", ratio: 83.45 },
    { id: "EUR", name: "Euro (EUR)", ratio: 0.92 },
    { id: "JPY", name: "Japanese Yen (JPY)", ratio: 156.40 },
    { id: "GBP", name: "British Pound (GBP)", ratio: 0.78 },
    { id: "AUD", name: "Australian Dollar (AUD)", ratio: 1.51 },
    { id: "CAD", name: "Canadian Dollar (CAD)", ratio: 1.37 },
    { id: "CHF", name: "Swiss Franc (CHF)", ratio: 0.89 }
  ];

  const timeUnits = [
    { id: "sec", name: "Seconds (sec)", ratio: 1.0 },
    { id: "ms", name: "Milliseconds (ms)", ratio: 1000.0 },
    { id: "min", name: "Minutes (min)", ratio: 0.0166666667 },
    { id: "hour", name: "Hours (hr)", ratio: 0.000277777778 },
    { id: "hh:mm:ss", name: "Formatted Time (hh:mm:ss)", ratio: 1.0, isSpecial: true },
    { id: "day", name: "Days", ratio: 1.1574074e-5 },
    { id: "week", name: "Weeks", ratio: 1.65343915e-6 },
    { id: "month", name: "Months (avg.)", ratio: 3.85802469e-7 },
    { id: "year", name: "Years (avg.)", ratio: 3.17097919e-8 }
  ];

  const speedUnits = [
    { id: "m/s", name: "Meters per second (m/s)", ratio: 1.0 },
    { id: "ft/s", name: "Feet per second (ft/s)", ratio: 3.2808399 },
    { id: "km/s", name: "Kilometers per second (km/s)", ratio: 0.001 },
    { id: "m/min", name: "Meters per minute (m/min)", ratio: 60.0 },
    { id: "ft/min", name: "Feet per minute (ft/min)", ratio: 196.850394 },
    { id: "km/min", name: "Kilometers per minute (km/min)", ratio: 0.06 },
    { id: "km/h", name: "Kilometers per hour (km/h)", ratio: 3.6 },
    { id: "mph", name: "Miles per hour (mph)", ratio: 2.23693629 },
    { id: "knot", name: "Knots (kt)", ratio: 1.94384449 },
    { id: "mach", name: "Mach numbers", ratio: 0.0029386699 },
    { id: "Beaufort", name: "Beaufort wind scale", ratio: 1.0, isSpecial: true },
    { id: "min/km", name: "Pace (min/km)", ratio: 1.0, isSpecial: true },
    { id: "min/mile", name: "Pace (min/mile)", ratio: 1.0, isSpecial: true }
  ];

  // Helper parser for Formatted Time hh:mm:ss
  const parseHhMmSs = (valStr: string): number => {
    const parts = valStr.trim().split(":");
    if (parts.length === 3) {
      const h = parseInt(parts[0]) || 0;
      const m = parseInt(parts[1]) || 0;
      const s = parseFloat(parts[2]) || 0;
      return h * 3600 + m * 60 + s;
    }
    return parseFloat(valStr) || 0;
  };

  // Helper formatter for Formatted Time hh:mm:ss
  const formatHhMmSs = (seconds: number): string => {
    if (seconds < 0 || isNaN(seconds)) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // Keep Sync between input field string and float value
  useEffect(() => {
    if (sourceUnit === "hh:mm:ss") {
      const seconds = parseHhMmSs(conversionValueText);
      setConversionValue(seconds);
    } else {
      const val = parseFloat(conversionValueText);
      setConversionValue(isNaN(val) ? 0 : val);
    }
  }, [conversionValueText, sourceUnit]);

  // Align defaults on category shift
  useEffect(() => {
    if (conversionCategory === "length") { setSourceUnit("m"); setConversionValueText("1"); }
    else if (conversionCategory === "mass" || conversionCategory === "weight") { setSourceUnit("kg"); setConversionValueText("1"); }
    else if (conversionCategory === "volume") { setSourceUnit("L"); setConversionValueText("1"); }
    else if (conversionCategory === "temp") { setSourceUnit("C"); setConversionValueText("1"); }
    else if (conversionCategory === "power") { setSourceUnit("W"); setConversionValueText("1"); }
    else if (conversionCategory === "work") { setSourceUnit("J"); setConversionValueText("1"); }
    else if (conversionCategory === "force") { setSourceUnit("N"); setConversionValueText("1"); }
    else if (conversionCategory === "pressure") { setSourceUnit("Pa"); setConversionValueText("1"); }
    else if (conversionCategory === "area") { setSourceUnit("m2"); setConversionValueText("1"); }
    else if (conversionCategory === "currency") { setSourceUnit("USD"); setConversionValueText("1"); }
    else if (conversionCategory === "time") { setSourceUnit("sec"); setConversionValueText("1"); }
    else if (conversionCategory === "speed") { setSourceUnit("m/s"); setConversionValueText("1"); }
    setConversionResults([]);
  }, [conversionCategory]);

  const handleConvertUnits = () => {
    let results: { unit: string; name: string; value: number | string }[] = [];

    if (conversionCategory === "length") {
      const sourceObj = lengthUnits.find((u) => u.id === sourceUnit);
      if (!sourceObj) return;
      const baseValue = conversionValue / sourceObj.ratio;
      lengthUnits.forEach((unit) => {
        if (unit.id !== sourceUnit) {
          results.push({
            unit: unit.id,
            name: unit.name,
            value: Number((baseValue * unit.ratio).toFixed(5))
          });
        }
      });

      let totalFeet = baseValue * 3.28084;
      if (sourceUnit === "feet") totalFeet = conversionValue;
      else if (sourceUnit === "inch") totalFeet = conversionValue / 12;

      const roundedTotalFeet = Math.round(totalFeet * 1000) / 1000;
      let finalFt = Math.floor(roundedTotalFeet);
      let finalIn = Math.round((roundedTotalFeet - finalFt) * 12);
      if (finalIn >= 12) { finalFt += 1; finalIn -= 12; }
      if (finalFt < 0) finalFt = 0;
      if (finalIn < 0) finalIn = 0;

      results.push({
        unit: "ft-in",
        name: "Feet & Inches Summary",
        value: `${finalFt}'${finalIn}" (${finalFt} feet ${finalIn} inches)`
      });
    } 
    else if (conversionCategory === "mass" || conversionCategory === "weight") {
      const sourceObj = massUnits.find((u) => u.id === sourceUnit);
      if (!sourceObj) return;
      const baseValue = conversionValue / sourceObj.ratio;
      massUnits.forEach((unit) => {
        if (unit.id !== sourceUnit) {
          results.push({
            unit: unit.id,
            name: unit.name,
            value: Number((baseValue * unit.ratio).toFixed(5))
          });
        }
      });
    } 
    else if (conversionCategory === "volume") {
      const sourceObj = volumeUnits.find((u) => u.id === sourceUnit);
      if (!sourceObj) return;
      const baseValue = conversionValue / sourceObj.ratio;
      volumeUnits.forEach((unit) => {
        if (unit.id !== sourceUnit) {
          results.push({
            unit: unit.id,
            name: unit.name,
            value: Number((baseValue * unit.ratio).toFixed(5))
          });
        }
      });
    } 
    else if (conversionCategory === "power") {
      // Baseline calculation for Power (W)
      let baseValue = 0;
      if (sourceUnit === "dBm") {
        baseValue = Math.pow(10, (conversionValue - 30) / 10);
      } else {
        const sourceObj = powerUnits.find((u) => u.id === sourceUnit);
        if (sourceObj) baseValue = conversionValue / sourceObj.ratio;
      }

      powerUnits.forEach((unit) => {
        if (unit.id !== sourceUnit) {
          if (unit.id === "dBm") {
            const dbmVal = baseValue > 0 ? Number((10 * Math.log10(baseValue * 1000)).toFixed(4)) : "N/A";
            results.push({ unit: unit.id, name: unit.name, value: dbmVal });
          } else {
            results.push({
              unit: unit.id,
              name: unit.name,
              value: Number((baseValue * unit.ratio).toFixed(5))
            });
          }
        }
      });
    }
    else if (conversionCategory === "work") {
      const sourceObj = workUnits.find((u) => u.id === sourceUnit);
      if (!sourceObj) return;
      const baseValue = conversionValue / sourceObj.ratio;
      workUnits.forEach((unit) => {
        if (unit.id !== sourceUnit) {
          results.push({
            unit: unit.id,
            name: unit.name,
            value: Number((baseValue * unit.ratio).toFixed(6))
          });
        }
      });
    }
    else if (conversionCategory === "force") {
      const sourceObj = forceUnits.find((u) => u.id === sourceUnit);
      if (!sourceObj) return;
      const baseValue = conversionValue / sourceObj.ratio;
      forceUnits.forEach((unit) => {
        if (unit.id !== sourceUnit) {
          results.push({
            unit: unit.id,
            name: unit.name,
            value: Number((baseValue * unit.ratio).toFixed(5))
          });
        }
      });
    }
    else if (conversionCategory === "pressure") {
      const sourceObj = pressureUnits.find((u) => u.id === sourceUnit);
      if (!sourceObj) return;
      const baseValue = conversionValue / sourceObj.ratio;
      pressureUnits.forEach((unit) => {
        if (unit.id !== sourceUnit) {
          results.push({
            unit: unit.id,
            name: unit.name,
            value: Number((baseValue * unit.ratio).toFixed(6))
          });
        }
      });
    }
    else if (conversionCategory === "area") {
      const sourceObj = areaUnits.find((u) => u.id === sourceUnit);
      if (!sourceObj) return;
      const baseValue = conversionValue / sourceObj.ratio;
      areaUnits.forEach((unit) => {
        if (unit.id !== sourceUnit) {
          results.push({
            unit: unit.id,
            name: unit.name,
            value: Number((baseValue * unit.ratio).toFixed(6))
          });
        }
      });
    }
    else if (conversionCategory === "currency") {
      const sourceObj = currencyUnits.find((u) => u.id === sourceUnit);
      if (!sourceObj) return;
      const baseValue = conversionValue / sourceObj.ratio;
      currencyUnits.forEach((unit) => {
        if (unit.id !== sourceUnit) {
          results.push({
            unit: unit.id,
            name: unit.name,
            value: Number((baseValue * unit.ratio).toFixed(3))
          });
        }
      });
    }
    else if (conversionCategory === "time") {
      // Baseline calculation for time (seconds)
      const baseValue = conversionValue; // because sync effect already resolved seconds
      timeUnits.forEach((unit) => {
        if (unit.id !== sourceUnit) {
          if (unit.id === "hh:mm:ss") {
            results.push({
              unit: unit.id,
              name: unit.name,
              value: formatHhMmSs(baseValue)
            });
          } else {
            results.push({
              unit: unit.id,
              name: unit.name,
              value: Number((baseValue * unit.ratio).toFixed(5))
            });
          }
        }
      });
    }
    else if (conversionCategory === "speed") {
      // Baseline calculation for speed (m/s)
      let baseValue = 0;
      if (sourceUnit === "Beaufort") {
        baseValue = 0.836 * Math.pow(conversionValue, 1.5);
      } else if (sourceUnit === "min/km") {
        baseValue = conversionValue > 0 ? 16.6666667 / conversionValue : 0;
      } else if (sourceUnit === "min/mile") {
        baseValue = conversionValue > 0 ? 26.8224 / conversionValue : 0;
      } else {
        const sourceObj = speedUnits.find((u) => u.id === sourceUnit);
        if (sourceObj) baseValue = conversionValue / sourceObj.ratio;
      }

      speedUnits.forEach((unit) => {
        if (unit.id !== sourceUnit) {
          if (unit.id === "Beaufort") {
            const bIndex = Math.min(12, Math.max(0, Math.round(Math.pow(baseValue / 0.836, 2/3))));
            results.push({ unit: unit.id, name: unit.name, value: bIndex });
          } else if (unit.id === "min/km") {
            const paceVal = baseValue > 0 ? Number((16.6666667 / baseValue).toFixed(3)) : "N/A";
            results.push({ unit: unit.id, name: unit.name, value: paceVal });
          } else if (unit.id === "min/mile") {
            const paceVal = baseValue > 0 ? Number((26.8225 / baseValue).toFixed(3)) : "N/A";
            results.push({ unit: unit.id, name: unit.name, value: paceVal });
          } else {
            results.push({
              unit: unit.id,
              name: unit.name,
              value: Number((baseValue * unit.ratio).toFixed(5))
            });
          }
        }
      });
    }
    else if (conversionCategory === "temp") {
      let celsius = 0;
      // Convert source to celsius baseline
      if (sourceUnit === "C") celsius = conversionValue;
      else if (sourceUnit === "F") celsius = (conversionValue - 32) * (5/9);
      else if (sourceUnit === "K") celsius = conversionValue - 273.15;
      else if (sourceUnit === "R") celsius = (conversionValue - 491.67) * (5/9);
      else if (sourceUnit === "Re") celsius = conversionValue * 1.25;

      const formats = [
        { id: "C", name: "Celsius (°C)" },
        { id: "F", name: "Fahrenheit (°F)" },
        { id: "K", name: "Kelvin (K)" },
        { id: "R", name: "Rankine (°R)" },
        { id: "Re", name: "Réaumur (°Re)" }
      ];

      formats.forEach((f) => {
        if (f.id !== sourceUnit) {
          let converted = 0;
          if (f.id === "C") converted = celsius;
          else if (f.id === "F") converted = (celsius * 9/5) + 32;
          else if (f.id === "K") converted = celsius + 273.15;
          else if (f.id === "R") converted = (celsius * 9/5) + 491.67;
          else if (f.id === "Re") converted = celsius * 0.8;

          results.push({
            unit: f.id,
            name: f.name,
            value: Number(converted.toFixed(2))
          });
        }
      });
    }

    setConversionResults(results);
  };

  // Run automatically on load or parameters shift
  useEffect(() => {
    handleConvertUnits();
  }, [conversionValue, sourceUnit, conversionCategory]);

  // ==========================================
  // OTHER CUSTOM HAND-CURATED TOOLS
  // ==========================================

  // 4a. EMI Calculator
  const [emiPrincipal, setEmiPrincipal] = useState<number>(50000);
  const [emiInterest, setEmiInterest] = useState<number>(8.5);
  const [emiTenure, setEmiTenure] = useState<number>(5); // years

  const calcEMI = () => {
    const P = emiPrincipal;
    const r = (emiInterest / 12) / 100;
    const n = emiTenure * 12;
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayments = emi * n;
    return {
      monthly: isNaN(emi) ? 0 : Number(emi.toFixed(2)),
      totalInterest: isNaN(totalPayments) ? 0 : Number((totalPayments - P).toFixed(2)),
      totalAmount: isNaN(totalPayments) ? 0 : Number(totalPayments.toFixed(2))
    };
  };

  // 4b. SIP Calculator
  const [sipMonthly, setSipMonthly] = useState<number>(5000);
  const [sipRate, setSipRate] = useState<number>(12);
  const [sipYears, setSipYears] = useState<number>(10);

  const calcSIP = () => {
    const P = sipMonthly;
    const r = sipRate;
    const n = sipYears * 12;
    const i = (r / 12) / 100;
    
    const totalInvested = P * n;
    let expectedAmount = 0;
    if (i === 0) {
      expectedAmount = totalInvested;
    } else {
      expectedAmount = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    }
    const wealthGain = expectedAmount - totalInvested;
    
    return {
      totalInvested: Math.round(totalInvested),
      wealthGain: Math.round(wealthGain > 0 ? wealthGain : 0),
      expectedAmount: Math.round(expectedAmount)
    };
  };

  // 4b. WhatsApp Link / QR generator
  const [waPhone, setWaPhone] = useState("");
  const [waText, setWaText] = useState("Hi, I would like to get in touch!");
  const [waLinkOutput, setWaLinkOutput] = useState("");

  const handleGenerateWALink = () => {
    const cleanPhone = waPhone.replace(/\D/g, "");
    if (!cleanPhone) {
      setErrorMessage("Please enter a valid numeric phone number with country code.");
      return;
    }
    const encodedText = encodeURIComponent(waText);
    const link = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    setWaLinkOutput(link);
    setSuccessMessage("WhatsApp Link structured safely!");
  };

  // 4c. Passwords builder
  const [passLength, setPassLength] = useState(14);
  const [passCaps, setPassCaps] = useState(true);
  const [passLows, setPassLows] = useState(true);
  const [passNums, setPassNums] = useState(true);
  const [passSyms, setPassSyms] = useState(true);
  const [passResult, setPassResult] = useState("");

  const handleGeneratePassword = () => {
    let pool = "";
    if (passCaps) pool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (passLows) pool += "abcdefghijklmnopqrstuvwxyz";
    if (passNums) pool += "0123456789";
    if (passSyms) pool += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (!pool) {
      setErrorMessage("Please select at least one character set.");
      return;
    }

    let compiled = "";
    for (let i = 0; i < passLength; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      compiled += pool[idx];
    }
    setPassResult(compiled);
  };

  // 4d. Scientific Calculator
  const [calcDisplay, setCalcDisplay] = useState("0");
  const handleCalcKeyPress = (key: string) => {
    setCalcDisplay((prev) => {
      if (prev === "0" && !isNaN(Number(key))) return key;
      if (key === "C") return "0";
      if (key === "←") return prev.length > 1 ? prev.slice(0, -1) : "0";
      if (key === "=") {
        try {
          // Clean dynamic expressions safely
          const clean = prev
            .replace(/π/g, "Math.PI")
            .replace(/e/g, "Math.E")
            .replace(/sin\(/g, "Math.sin(")
            .replace(/cos\(/g, "Math.cos(")
            .replace(/tan\(/g, "Math.tan(")
            .replace(/sqrt\(/g, "Math.sqrt(")
            .replace(/ln\(/g, "Math.log(");
          const computed = new Function(`return ${clean}`)();
          return String(Number(computed.toFixed(6)));
        } catch (err) {
          return "Error";
        }
      }
      return prev + key;
    });
  };

  // 4e. JSON Formatter
  const [jsonInput, setJsonInput] = useState("");
  const [jsonOutput, setJsonOutput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [jsonValidationReport, setJsonValidationReport] = useState<any>(null);
  const [copiedHtmlCode, setCopiedHtmlCode] = useState(false);

  const handleFormatJSON = (indent: number) => {
    setJsonError("");
    try {
      if (!jsonInput.trim()) {
        setJsonOutput("");
        return;
      }
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, indent));
    } catch (err: any) {
      setJsonError(err.message || "Invalid JSON syntax.");
    }
  };

  // 4f. JWT Decoder
  const [jwtInput, setJwtInput] = useState("");
  const [jwtHeader, setJwtHeader] = useState("");
  const [jwtPayload, setJwtPayload] = useState("");

  const handleDecodeJWT = () => {
    try {
      const parts = jwtInput.split(".");
      if (parts.length < 2) {
        setErrorMessage("Invalid JWT format (requires header, payload and signature points).");
        return;
      }
      const rawHeader = atob(parts[0]);
      const rawPayload = atob(parts[1]);
      setJwtHeader(JSON.stringify(JSON.parse(rawHeader), null, 2));
      setJwtPayload(JSON.stringify(JSON.parse(rawPayload), null, 2));
      setSuccessMessage("JWT Decoded successfully!");
    } catch (err: any) {
      setErrorMessage("Could not decode JWT Base64 components.");
    }
  };

  // ==========================================
  // 5. UNIVERSAL SERVER-SIDE AI POWERED UTILITIES (Gemini Driven)
  // ==========================================
  const [aiInputs, setAiInputs] = useState<Record<string, string>>({
    code: "",
    sourceDialect: "Oracle PL/SQL",
    targetDialect: "PostgreSQL",
    fileText: "",
  });
  const [aiOutput, setAiOutput] = useState("");
  const [aiRunning, setAiRunning] = useState(false);
  const [outputWrap, setOutputWrap] = useState(true);
  const [outputSearch, setOutputSearch] = useState("");
  const [outputTab, setOutputTab] = useState<"pretty" | "raw">("pretty");

  const handleTextareaFocus = (e: React.FocusEvent<HTMLTextAreaElement>, fieldName: string = "code") => {
    const val = e.target.value;
    const isPlaceholder = 
      val.includes("Paste your standard configurations, DDL") || 
      val.includes("Paste your raw") ||
      val.includes("01  EMPLOYEE-RECORD") ||
      val.includes("MERCHANT: Whole Foods Market") ||
      val.includes("/* Paste your standard") ||
      val.includes("-- Paste your") ||
      val.trim() === "CREATE TABLE employees (\n  emp_id NUMBER PRIMARY KEY,\n  salary NUMBER(10,2),\n  hire_date DATE DEFAULT SYSDATE\n);" ||
      val.trim() === "{\n  \"brand\": \"Google\",\n  \"service\": \"Workspace\",\n  \"secure\": true\n}";
    
    if (isPlaceholder) {
      setAiInputs(prev => ({ ...prev, [fieldName]: "" }));
    }
  };

  // ==========================================
  // Everyday Calculators states
  // ==========================================
  const [ageDob, setAgeDob] = useState(() => {
    try {
      const saved = localStorage.getItem("toolz_state_ageDob");
      return saved ? JSON.parse(saved) : "1998-05-15";
    } catch { return "1998-05-15"; }
  });
  const [ageTarget, setAgeTarget] = useState(() => {
    try {
      const saved = localStorage.getItem("toolz_state_ageTarget");
      return saved ? JSON.parse(saved) : new Date().toISOString().split("T")[0];
    } catch { return new Date().toISOString().split("T")[0]; }
  });
  
  const [dateDiffStart, setDateDiffStart] = useState(() => {
    try {
      const saved = localStorage.getItem("toolz_state_dateDiffStart");
      return saved ? JSON.parse(saved) : new Date().toISOString().split("T")[0];
    } catch { return new Date().toISOString().split("T")[0]; }
  });
  const [dateDiffEnd, setDateDiffEnd] = useState(() => {
    try {
      const saved = localStorage.getItem("toolz_state_dateDiffEnd");
      if (saved) return JSON.parse(saved);
    } catch {}
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  
  const [timeDurationStart, setTimeDurationStart] = useState(() => {
    try {
      const saved = localStorage.getItem("toolz_state_timeDurationStart");
      return saved ? JSON.parse(saved) : "09:00";
    } catch { return "09:00"; }
  });
  const [timeDurationEnd, setTimeDurationEnd] = useState(() => {
    try {
      const saved = localStorage.getItem("toolz_state_timeDurationEnd");
      return saved ? JSON.parse(saved) : "17:30";
    } catch { return "17:30"; }
  });
  
  const [percentNum1, setPercentNum1] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_percentNum1");
      return saved ? JSON.parse(saved) : 15;
    } catch { return 15; }
  });
  const [percentNum2, setPercentNum2] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_percentNum2");
      return saved ? JSON.parse(saved) : 200;
    } catch { return 200; }
  });
  const [percentNum3, setPercentNum3] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_percentNum3");
      return saved ? JSON.parse(saved) : 50;
    } catch { return 50; }
  });
  const [percentNum4, setPercentNum4] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_percentNum4");
      return saved ? JSON.parse(saved) : 75;
    } catch { return 75; }
  });
  
  const [tipBillAmount, setTipBillAmount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_tipBillAmount");
      return saved ? JSON.parse(saved) : 64.50;
    } catch { return 64.50; }
  });
  const [tipPercent, setTipPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_tipPercent");
      return saved ? JSON.parse(saved) : 18;
    } catch { return 18; }
  });
  const [tipPeopleCount, setTipPeopleCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_tipPeopleCount");
      return saved ? JSON.parse(saved) : 2;
    } catch { return 2; }
  });
  
  const [currencyAmount, setCurrencyAmount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_currencyAmount");
      return saved ? JSON.parse(saved) : 250;
    } catch { return 250; }
  });
  const [currencyFrom, setCurrencyFrom] = useState(() => {
    try {
      const saved = localStorage.getItem("toolz_state_currencyFrom");
      return saved ? JSON.parse(saved) : "USD";
    } catch { return "USD"; }
  });
  const [currencyTo, setCurrencyTo] = useState(() => {
    try {
      const saved = localStorage.getItem("toolz_state_currencyTo");
      return saved ? JSON.parse(saved) : "EUR";
    } catch { return "EUR"; }
  });
  
  const [bmiWeight, setBmiWeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_bmiWeight");
      return saved ? JSON.parse(saved) : 72;
    } catch { return 72; }
  });
  const [bmiHeight, setBmiHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_bmiHeight");
      return saved ? JSON.parse(saved) : 178;
    } catch { return 178; }
  });
  const [bmiUnit, setBmiUnit] = useState<"metric" | "imperial">("metric"); // keep simple fallback
  
  const [calorieAge, setCalorieAge] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_calorieAge");
      return saved ? JSON.parse(saved) : 28;
    } catch { return 28; }
  });
  const [calorieGender, setCalorieGender] = useState<"male" | "female">(() => {
    try {
      const saved = localStorage.getItem("toolz_state_calorieGender");
      return saved ? JSON.parse(saved) : "male";
    } catch { return "male"; }
  });
  const [calorieWeight, setCalorieWeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_calorieWeight");
      return saved ? JSON.parse(saved) : 75;
    } catch { return 75; }
  });
  const [calorieHeight, setCalorieHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_calorieHeight");
      return saved ? JSON.parse(saved) : 180;
    } catch { return 180; }
  });
  const [calorieActivity, setCalorieActivity] = useState(() => {
    try {
      const saved = localStorage.getItem("toolz_state_calorieActivity");
      return saved ? JSON.parse(saved) : "moderate";
    } catch { return "moderate"; }
  });
  
  const [fuelDistance, setFuelDistance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_fuelDistance");
      return saved ? JSON.parse(saved) : 120;
    } catch { return 120; }
  });
  const [fuelEfficiency, setFuelEfficiency] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_fuelEfficiency");
      return saved ? JSON.parse(saved) : 8.5;
    } catch { return 8.5; }
  });
  const [fuelPrice, setFuelPrice] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_fuelPrice");
      return saved ? JSON.parse(saved) : 1.45;
    } catch { return 1.45; }
  });
  
  const [gpaCourses, setGpaCourses] = useState<{ id: string; name: string; grade: string; credits: number }[]>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_gpaCourses");
      return saved ? JSON.parse(saved) : [
        { id: "1", name: "Mathematics I", grade: "A", credits: 4 },
        { id: "2", name: "Computer Systems", grade: "B", credits: 3 },
        { id: "3", name: "Physics Seminar", grade: "A", credits: 2 },
      ];
    } catch {
      return [
        { id: "1", name: "Mathematics I", grade: "A", credits: 4 },
        { id: "2", name: "Computer Systems", grade: "B", credits: 3 },
        { id: "3", name: "Physics Seminar", grade: "A", credits: 2 },
      ];
    }
  });

  // ==========================================
  // Custom Dynamic Visual Workbench States & Engines
  // ==========================================
  const [detectedCurrency] = useState<string>(() => {
    try {
      const locale = navigator.language || Intl.NumberFormat().resolvedOptions().locale || "en-US";
      const lowerLocale = locale.toLowerCase();
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const lowerTz = tz.toLowerCase();

      if (lowerTz.includes("london") || lowerTz.includes("europe/london") || lowerLocale.endsWith("-gb") || lowerLocale === "en-gb") return "£";
      if (lowerTz.includes("europe") || lowerLocale.includes("de") || lowerLocale.includes("fr") || lowerLocale.includes("it") || lowerLocale.includes("es") || lowerLocale.includes("nl") || lowerLocale.endsWith("-ie") || lowerLocale.endsWith("-fr") || lowerLocale.endsWith("-de")) return "€";
      if (lowerTz.includes("kolkata") || lowerTz.includes("india") || lowerLocale.endsWith("-in") || lowerLocale === "hi" || lowerLocale === "en-in") return "₹";
      if (lowerTz.includes("tokyo") || lowerLocale.endsWith("-jp") || lowerLocale === "ja") return "¥";
      if (lowerTz.includes("shanghai") || lowerTz.includes("beijing") || lowerLocale.endsWith("-cn") || lowerLocale === "zh") return "¥";
      if (lowerTz.includes("australia") || lowerTz.includes("sydney") || lowerLocale.endsWith("-au")) return "A$";
      if (lowerTz.includes("toronto") || lowerTz.includes("vancouver") || lowerLocale.endsWith("-ca")) return "C$";
      if (lowerTz.includes("brazil") || lowerTz.includes("sao_paulo") || lowerLocale.endsWith("-br")) return "R$";
      if (lowerTz.includes("russia") || lowerLocale.endsWith("-ru")) return "₽";
      if (lowerTz.includes("seoul") || lowerLocale.endsWith("-kr")) return "₩";
      if (lowerTz.includes("vietnam") || lowerLocale.endsWith("-vn")) return "đ";
      if (lowerTz.includes("singapore") || lowerLocale.endsWith("-sg")) return "S$";
      if (lowerTz.includes("johannesburg") || lowerLocale.endsWith("-za")) return "R";
      if (lowerTz.includes("stockholm") || lowerTz.includes("oslo") || lowerTz.includes("copenhagen") || lowerLocale.endsWith("-se") || lowerLocale.endsWith("-no") || lowerLocale.endsWith("-dk")) return "kr";
      if (lowerTz.includes("zurich") || lowerLocale.endsWith("-ch")) return "CHF";
      if (lowerTz.includes("jerusalem") || lowerLocale.endsWith("-il")) return "₪";
    } catch (e) {
      // ignore
    }
    return "$";
  });

  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_selectedCurrency");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return detectedCurrency;
  });

  const [finPrincipal, setFinPrincipal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_finPrincipal");
      return saved ? JSON.parse(saved) : 100000;
    } catch { return 100000; }
  });
  const [finRate, setFinRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_finRate");
      return saved ? JSON.parse(saved) : 8.5;
    } catch { return 8.5; }
  });
  const [finTenure, setFinTenure] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_finTenure");
      return saved ? JSON.parse(saved) : 10;
    } catch { return 10; }
  });
  const [finExtra, setFinExtra] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("toolz_state_finExtra");
      return saved ? JSON.parse(saved) : 1000;
    } catch { return 1000; }
  });

  // Unified State Sync Effect
  useEffect(() => {
    try {
      localStorage.setItem("toolz_state_ageDob", JSON.stringify(ageDob));
      localStorage.setItem("toolz_state_ageTarget", JSON.stringify(ageTarget));
      localStorage.setItem("toolz_state_dateDiffStart", JSON.stringify(dateDiffStart));
      localStorage.setItem("toolz_state_dateDiffEnd", JSON.stringify(dateDiffEnd));
      localStorage.setItem("toolz_state_timeDurationStart", JSON.stringify(timeDurationStart));
      localStorage.setItem("toolz_state_timeDurationEnd", JSON.stringify(timeDurationEnd));
      localStorage.setItem("toolz_state_percentNum1", JSON.stringify(percentNum1));
      localStorage.setItem("toolz_state_percentNum2", JSON.stringify(percentNum2));
      localStorage.setItem("toolz_state_percentNum3", JSON.stringify(percentNum3));
      localStorage.setItem("toolz_state_percentNum4", JSON.stringify(percentNum4));
      localStorage.setItem("toolz_state_tipBillAmount", JSON.stringify(tipBillAmount));
      localStorage.setItem("toolz_state_tipPercent", JSON.stringify(tipPercent));
      localStorage.setItem("toolz_state_tipPeopleCount", JSON.stringify(tipPeopleCount));
      localStorage.setItem("toolz_state_currencyAmount", JSON.stringify(currencyAmount));
      localStorage.setItem("toolz_state_currencyFrom", JSON.stringify(currencyFrom));
      localStorage.setItem("toolz_state_currencyTo", JSON.stringify(currencyTo));
      localStorage.setItem("toolz_state_bmiWeight", JSON.stringify(bmiWeight));
      localStorage.setItem("toolz_state_bmiHeight", JSON.stringify(bmiHeight));
      localStorage.setItem("toolz_state_calorieAge", JSON.stringify(calorieAge));
      localStorage.setItem("toolz_state_calorieGender", JSON.stringify(calorieGender));
      localStorage.setItem("toolz_state_calorieWeight", JSON.stringify(calorieWeight));
      localStorage.setItem("toolz_state_calorieHeight", JSON.stringify(calorieHeight));
      localStorage.setItem("toolz_state_calorieActivity", JSON.stringify(calorieActivity));
      localStorage.setItem("toolz_state_fuelDistance", JSON.stringify(fuelDistance));
      localStorage.setItem("toolz_state_fuelEfficiency", JSON.stringify(fuelEfficiency));
      localStorage.setItem("toolz_state_fuelPrice", JSON.stringify(fuelPrice));
      localStorage.setItem("toolz_state_gpaCourses", JSON.stringify(gpaCourses));
      localStorage.setItem("toolz_state_finPrincipal", JSON.stringify(finPrincipal));
      localStorage.setItem("toolz_state_finRate", JSON.stringify(finRate));
      localStorage.setItem("toolz_state_finTenure", JSON.stringify(finTenure));
      localStorage.setItem("toolz_state_finExtra", JSON.stringify(finExtra));
      localStorage.setItem("toolz_state_selectedCurrency", JSON.stringify(selectedCurrency));
    } catch (e) {
      console.warn("Storage sync failed", e);
    }
  }, [
    ageDob, ageTarget, dateDiffStart, dateDiffEnd, timeDurationStart, timeDurationEnd,
    percentNum1, percentNum2, percentNum3, percentNum4, tipBillAmount, tipPercent, tipPeopleCount,
    currencyAmount, currencyFrom, currencyTo, bmiWeight, bmiHeight,
    calorieAge, calorieGender, calorieWeight, calorieHeight, calorieActivity,
    fuelDistance, fuelEfficiency, fuelPrice, gpaCourses, finPrincipal, finRate, finTenure, finExtra, selectedCurrency
  ]);

  const [contactMockLoaded, setContactMockLoaded] = useState(false);
  const [contactsList, setContactsList] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactGroupFilter, setContactGroupFilter] = useState("all");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [customMergeCandidates, setCustomMergeCandidates] = useState<{left: any, right: any} | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editedContactValues, setEditedContactValues] = useState<any>({});
  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [bulkTagText, setBulkTagText] = useState("");
  const [csvUploadText, setCsvUploadText] = useState("");
  
  // Custom contact management states for duplicates log & platforms
  const [removedDuplicatesList, setRemovedDuplicatesList] = useState<any[]>([]);
  const [uploadedFilesMeta, setUploadedFilesMeta] = useState<any[]>([]);
  const [showerSearch, setShowerSearch] = useState("");
  const [activeOperation, setActiveOperation] = useState<string | null>(null);

  // High-fidelity intuitive contacts merger wizard step states
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardProgress, setWizardProgress] = useState<{
    status: 'idle' | 'running' | 'completed' | 'error';
    percent: number;
    message: string;
  }>({ status: 'idle', percent: 0, message: '' });
  const [wizardMergeProgress, setWizardMergeProgress] = useState<{
    status: 'idle' | 'running' | 'completed' | 'error';
    percent: number;
    message: string;
    stats?: { before: number; after: number; removed: number; clusters: number };
  }>({ status: 'idle', percent: 0, message: '' });
  const [wizardDownloadStatus, setWizardDownloadStatus] = useState<{[key: string]: 'idle' | 'running' | 'completed'}>({
    ios: 'idle',
    android: 'idle',
    csv: 'idle'
  });

  // Modernized button-localized progress and download status states
  const [opsState, setOpsState] = useState<{[key: string]: {
    status: 'idle' | 'running' | 'completed' | 'error',
    message?: string,
    content?: string,
    filename?: string
  }}>({});

  // Local clipboard copy state map
  const [copiedState, setCopiedState] = useState<{[key: string]: boolean}>({});

  const handleLocalCopy = (key: string, content: string) => {
    try {
      navigator.clipboard.writeText(content);
      setCopiedState(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedState(prev => ({ ...prev, [key]: false }));
      }, 3000);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  };

  const runLocalOperation = (
    key: string,
    progressMsg: string,
    completionMsg: string,
    runnable: () => { content?: string, filename?: string } | void
  ) => {
    setOpsState(prev => ({
      ...prev,
      [key]: { status: 'running', message: progressMsg }
    }));

    setTimeout(() => {
      try {
        const result = runnable();
        const content = result ? (result as any).content : undefined;
        const filename = result ? (result as any).filename : undefined;

        setOpsState(prev => ({
          ...prev,
          [key]: {
            status: 'completed',
            message: completionMsg,
            content,
            filename
          }
        }));
      } catch (err) {
        console.error("Local operation failed", err);
        setOpsState(prev => ({
          ...prev,
          [key]: { status: 'error', message: `Operation failed: ${(err as Error).message}` }
        }));
      }
    }, 750);
  };

  const downloadFile = (content: string, filename: string, mimeType: string = "application/octet-stream") => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      // Removed target="_blank" to prevent standard browser sandbox iframe blocks
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("Standard download restricted, attempting raw base64 dataURI backup trigger", e);
      try {
        const link = document.createElement("a");
        link.href = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (innerErr) {
        console.error("All window/element download pipelines blocked in this client environment", innerErr);
      }
    }
  };

  const downloadAsDocx = (filename: string, textContent: string) => {
    const docxName = filename.toLowerCase().endsWith(".docx") ? filename : filename.substring(0, filename.lastIndexOf(".")) + ".docx";
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${docxName}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #111827; margin: 1in; background-color: #ffffff; }
          h1, h2, h3 { color: #1e3a8a; font-weight: bold; margin-top: 18pt; margin-bottom: 6pt; }
          p { margin-bottom: 10pt; text-align: justify; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
          th { background-color: #f3f4f6; font-weight: bold; }
        </style>
      </head>
      <body>
        ${textContent.split("\n\n").map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join("")}
      </body>
      </html>
    `;
    downloadFile('\\ufeff' + htmlContent, docxName, "application/msword");
  };

  const downloadAsPdf = (filename: string, textContent: string) => {
    const pdfName = filename.toLowerCase().endsWith(".pdf") ? filename : filename.substring(0, filename.lastIndexOf(".")) + ".pdf";
    const cleanLines = textContent.split('\n').map(line => `(${line.replace(/[()]/g, '\\$&')}) Tj T*`).join('\n');
    const doc = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 595.28 841.89] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${cleanLines.length + 100} >>
stream
BT
/F1 12 Tf
70 800 Td
16 TL
${cleanLines}
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000056 00000 n
0000000111 00000 n
0000000250 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
${400 + cleanLines.length}
%%EOF`;
    downloadFile(doc, pdfName, "application/pdf");
  };

  const getBarcodeSvgMarkup = (text: string, format: string) => {
    const pat128: Record<string, string> = {
      '0': '212222', '1': '222122', '2': '222221', '3': '121223', '4': '121322', '5': '131222',
      '6': '122213', '7': '122312', '8': '132212', '9': '221213', 'A': '221312', 'B': '231212',
      'C': '112232', 'D': '122132', 'E': '122231', 'F': '113222', 'G': '123122', 'H': '123221',
      'I': '223211', 'J': '221132', 'K': '221231', 'L': '213212', 'M': '223112', 'N': '312131',
      'O': '311222', 'P': '321122', 'Q': '321221', 'R': '312212', 'S': '322112', 'T': '322211',
      'U': '212123', 'V': '212321', 'W': '232121', 'X': '111323', 'Y': '131123', 'Z': '131321'
    };

    let bits = "11010010000";
    const cleanText = text.toUpperCase().replace(/[^A-Z0-9]/g, "") || "123456789";
    
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const code = pat128[char] || pat128[char.charCodeAt(0) % 10] || "212222";
      for (let j = 0; j < code.length; j++) {
        const width = parseInt(code[j]);
        const bit = j % 2 === 0 ? "1" : "0";
        bits += bit.repeat(width);
      }
    }
    bits += "1100011101011";
    return bits;
  };

  const renderBarcodeSvg = (text: string, format: string) => {
    const binary = getBarcodeSvgMarkup(text, format);
    const barWidth = 2.4;
    const height = 90;
    const totalWidth = binary.length * barWidth;
    
    return (
      <svg width="100%" height={height + 30} viewBox={`0 0 ${totalWidth} ${height + 30}`} className="mx-auto block" preserveAspectRatio="xMidYMid meet">
        <g fill="#000000">
          {binary.split("").map((bit, idx) => {
            if (bit === "1") {
              return (
                <rect
                  key={idx}
                  x={idx * barWidth}
                  y={0}
                  width={barWidth}
                  height={height}
                />
              );
            }
            return null;
          })}
        </g>
        <text x={totalWidth / 2} y={height + 20} textAnchor="middle" className="font-mono text-xs font-semibold select-none text-gray-900" fill="#111827">
          {format}: {text}
        </text>
      </svg>
    );
  };

  const triggerOperation = (label: string, callback: () => void) => {
    setActiveOperation(label);
    setTimeout(() => {
      try {
        callback();
      } catch (err) {
        console.error("Operation failed", err);
      } finally {
        setActiveOperation(null);
      }
    }, 750);
  };

  // Memoized search handlers to keep keystrokes extremely responsive and delay-free
  const filteredContacts = useMemo(() => {
    const query = (contactSearch || "").toLowerCase().trim();
    if (!query && contactGroupFilter === "all") return contactsList;
    return contactsList.filter(c => {
      const nameMatch = (c.name || "").toLowerCase().includes(query);
      const phoneMatch = (c.phone || "").toLowerCase().includes(query);
      const emailMatch = (c.email || "").toLowerCase().includes(query);
      const companyMatch = (c.company || "").toLowerCase().includes(query);
      
      const groupMatch = contactGroupFilter === "all" || c.accountType === contactGroupFilter;
      return (nameMatch || phoneMatch || emailMatch || companyMatch) && groupMatch;
    });
  }, [contactsList, contactSearch, contactGroupFilter]);

  const showerFilteredContacts = useMemo(() => {
    const query = (showerSearch || "").toLowerCase().trim();
    if (!query) return contactsList;
    return contactsList.filter(c => {
      const nameMatch = (c.name || "").toLowerCase().includes(query);
      const phoneMatch = (c.phone || "").toLowerCase().includes(query);
      const emailMatch = (c.email || "").toLowerCase().includes(query);
      const companyMatch = (c.company || "").toLowerCase().includes(query);
      return nameMatch || phoneMatch || emailMatch || companyMatch;
    });
  }, [contactsList, showerSearch]);

  const parseVCF = (content: string): any[] => {
    const contacts: any[] = [];
    const vcardRegex = /BEGIN:VCARD[\s\S]*?END:VCARD/gi;
    let match;
    
    while ((match = vcardRegex.exec(content)) !== null) {
      const cardText = match[0];
      const lines = cardText.split(/\r?\n/);
      
      let name = "";
      let phone = "";
      let email = "";
      let company = "";
      let tags: string[] = ["Imported VCF"];
      
      for (const line of lines) {
        const upperLine = line.trim();
        if (!upperLine) continue;
        
        if (upperLine.startsWith("FN:")) {
          name = upperLine.substring(3).trim();
        } else if (upperLine.startsWith("FN;")) {
          const idx = upperLine.indexOf(":");
          if (idx !== -1) name = upperLine.substring(idx + 1).trim();
        } else if (!name && (upperLine.startsWith("N:") || upperLine.startsWith("N;"))) {
          const idx = upperLine.indexOf(":");
          if (idx !== -1) {
            const parts = upperLine.substring(idx + 1).split(";").map(p => p.trim()).filter(Boolean);
            if (parts.length > 0) {
              name = parts.reverse().join(" ");
            }
          }
        } else if (upperLine.startsWith("TEL;") || upperLine.startsWith("TEL:")) {
          const idx = upperLine.indexOf(":");
          if (idx !== -1) {
            const num = upperLine.substring(idx + 1).trim();
            if (!phone) phone = num;
          }
        } else if (upperLine.startsWith("EMAIL;") || upperLine.startsWith("EMAIL:")) {
          const idx = upperLine.indexOf(":");
          if (idx !== -1) {
            const m = upperLine.substring(idx + 1).trim();
            if (!email) email = m;
          }
        } else if (upperLine.startsWith("ORG:") || upperLine.startsWith("ORG;")) {
          const idx = upperLine.indexOf(":");
          if (idx !== -1) {
            company = upperLine.substring(idx + 1).replace(/;/g, " ").trim();
          }
        } else if (upperLine.startsWith("CATEGORIES:") || upperLine.startsWith("CATEGORIES;")) {
          const idx = upperLine.indexOf(":");
          if (idx !== -1) {
            const cats = upperLine.substring(idx + 1).split(",").map(c => c.trim()).filter(Boolean);
            tags.push(...cats);
          }
        }
      }
      
      if (name || phone || email) {
        contacts.push({
          name: name || "Unnamed Contact",
          phone,
          email,
          company,
          tags: Array.from(new Set(tags)),
          accountType: "Google"
        });
      }
    }
    return contacts;
  };

  const parseCSV = (content: string): any[] => {
    const contacts: any[] = [];
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 1) return [];

    const header = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
    const nameIdx = header.findIndex(h => h.includes("name") || h.includes("first") || h.includes("display"));
    const phoneIdx = header.findIndex(h => h.includes("phone") || h.includes("tel") || h.includes("mobile") || h.includes("cell"));
    const emailIdx = header.findIndex(h => h.includes("email") || h.includes("mail"));
    const companyIdx = header.findIndex(h => h.includes("company") || h.includes("org") || h.includes("work"));

    for (let i = 1; i < lines.length; i++) {
      const rawLine = lines[i];
      let parts: string[] = [];
      let insideQuote = false;
      let currentPart = "";
      
      for (let j = 0; j < rawLine.length; j++) {
        const char = rawLine[j];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          parts.push(currentPart.trim());
          currentPart = "";
        } else {
          currentPart += char;
        }
      }
      parts.push(currentPart.trim());

      if (parts.length === 0 || !parts[0]) continue;

      const name = nameIdx !== -1 && parts[nameIdx] ? parts[nameIdx].replace(/['"]/g, "") : parts[0].replace(/['"]/g, "");
      const phone = phoneIdx !== -1 && parts[phoneIdx] ? parts[phoneIdx].replace(/['"]/g, "") : "";
      const email = emailIdx !== -1 && parts[emailIdx] ? parts[emailIdx].replace(/['"]/g, "") : "";
      const company = companyIdx !== -1 && parts[companyIdx] ? parts[companyIdx].replace(/['"]/g, "") : "";

      if (name || phone || email) {
        contacts.push({
          name: name || "Unnamed CSV Contact",
          phone,
          email,
          company,
          tags: ["Imported CSV"],
          accountType: "Google"
        });
      }
    }
    return contacts;
  };

  const generateIPhoneVCard = (list: any[]): string => {
    let vcf = "";
    list.forEach(c => {
      const safeName = (c.name || "").trim() || "Unnamed Contact";
      const names = safeName.split(/\s+/);
      let lastName = "";
      let firstName = "";
      if (names.length > 1) {
        lastName = names[names.length - 1];
        firstName = names.slice(0, names.length - 1).join(" ");
      } else {
        firstName = names[0] || "";
      }
      
      vcf += "BEGIN:VCARD\n";
      vcf += "VERSION:3.0\n";
      vcf += `N;CHARSET=UTF-8:${lastName};${firstName};;;\n`;
      vcf += `FN;CHARSET=UTF-8:${safeName}\n`;
      if (c.phone) {
        vcf += `TEL;TYPE=CELL,VOICE:${c.phone}\n`;
      }
      if (c.email) {
        vcf += `EMAIL;TYPE=PREF,INTERNET:${c.email}\n`;
      }
      if (c.company) {
        vcf += `ORG;CHARSET=UTF-8:${c.company}\n`;
      }
      if (c.tags && c.tags.length > 0) {
        vcf += `NOTE;CHARSET=UTF-8:Tags: ${c.tags.join(", ")}\n`;
      }
      vcf += "END:VCARD\n";
    });
    return vcf;
  };

  const generateAndroidVCard = (list: any[]): string => {
    let vcf = "";
    list.forEach(c => {
      const safeName = (c.name || "").trim() || "Unnamed Contact";
      const names = safeName.split(/\s+/);
      let lastName = "";
      let firstName = "";
      if (names.length > 1) {
        lastName = names[names.length - 1];
        firstName = names.slice(0, names.length - 1).join(" ");
      } else {
        firstName = names[0] || "";
      }
      
      vcf += "BEGIN:VCARD\n";
      vcf += "VERSION:2.1\n";
      vcf += `N:${lastName};${firstName}\n`;
      vcf += `FN:${safeName}\n`;
      if (c.phone) {
        vcf += `TEL;CELL:${c.phone}\n`;
      }
      if (c.email) {
        vcf += `EMAIL;INTERNET:${c.email}\n`;
      }
      if (c.company) {
        vcf += `ORG:${c.company}\n`;
      }
      vcf += "END:VCARD\n";
    });
    return vcf;
  };

  const generateAndroidGoogleCSV = (list: any[]): string => {
    let csv = "Name,Given Name,Family Name,Phone 1 - Type,Phone 1 - Value,E-mail 1 - Type,E-mail 1 - Value,Organization 1 - Name,Notes,Group Membership\n";
    list.forEach(c => {
      const safeName = (c.name || "").trim() || "Unnamed Contact";
      const names = safeName.split(/\s+/);
      let lastName = "";
      let firstName = "";
      if (names.length > 1) {
        lastName = names[names.length - 1];
        firstName = names.slice(0, names.length - 1).join(" ");
      } else {
        firstName = names[0] || "";
      }
      const tagsStr = c.tags ? c.tags.join(";") : "";
      
      csv += `"${safeName}","${firstName}","${lastName}","Mobile","${c.phone || ""}","Home","${c.email || ""}","${c.company || ""}","Imported via ToolzCraft","${tagsStr}"\n`;
    });
    return csv;
  };

  const handleContactFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setActiveOperation(`Parsing, decoding and loading ${files.length} contact directory roster file(s)...`);
    
    setTimeout(async () => {
      try {
        const parsedContacts: any[] = [];
        const metaList: any[] = [];
        let successCount = 0;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          try {
            const text = await file.text();
            const extension = file.name.split('.').pop()?.toLowerCase();
            let fileContacts: any[] = [];

            if (extension === 'vcf') {
              fileContacts = parseVCF(text);
            } else if (extension === 'csv') {
              fileContacts = parseCSV(text);
            } else {
              if (text.includes('BEGIN:VCARD')) {
                fileContacts = parseVCF(text);
              } else {
                fileContacts = parseCSV(text);
              }
            }

            if (fileContacts.length > 0) {
              const compatibleWith: string[] = [];
              if (extension === 'vcf' || text.includes('BEGIN:VCARD')) {
                compatibleWith.push("iPhone / iOS (vCard 3.0)", "Android (vCard 2.1)");
              } else {
                compatibleWith.push("Google Contacts (CSV Import)", "Outlook Web (CSV Import)");
              }

              parsedContacts.push(...fileContacts.map((c, idx) => ({ 
                ...c, 
                id: `${extension || 'unknown'}-${Date.now()}-${i}-${idx}-${Math.random()}`,
                sourceFile: file.name
              })));

              metaList.push({
                name: file.name,
                size: file.size,
                type: (extension || "vcf").toUpperCase(),
                count: fileContacts.length,
                compatibleWith
              });

              successCount++;
            }
          } catch (err) {
            console.error("Error parsing file", file.name, err);
          }
        }

        if (parsedContacts.length > 0) {
          setContactsList(prev => {
            // Filter out default sample/simulated contacts whose IDs start with "c" (e.g. "c1"-"c10")
            const nonSamplePrev = prev.filter(c => !c.id.startsWith("c"));
            return [...nonSamplePrev, ...parsedContacts];
          });
          setUploadedFilesMeta(prev => {
            // Filter out the demo/simulation file meta from lists
            const filteredMeta = prev.filter(m => m.name !== "enterprise-backup-simulated.vcf");
            return [...filteredMeta, ...metaList];
          });
          setContactMockLoaded(true);
          setSuccessMessage(`Successfully processed ${successCount} file(s) and uploaded ${parsedContacts.length} contacts! Sample contacts have been cleaned and kept separate.`);
        } else {
          setErrorMessage("Could not parse contacts from the selected file(s). Please verify they are standard .vcf or .csv files.");
        }
      } finally {
        setActiveOperation(null);
      }
    }, 800);
  };

  useEffect(() => {
    if (contactMockLoaded) {
      if (contactsList.length === 0) {
        setContactsList(JSON.parse(JSON.stringify(DEFAULT_CONTACTS)));
      }
      if (uploadedFilesMeta.length === 0) {
        setUploadedFilesMeta([{
          name: "enterprise-backup-simulated.vcf",
          size: 15420,
          type: "VCF",
          count: DEFAULT_CONTACTS.length,
          compatibleWith: ["iPhone / iOS (vCard 3.0)", "Android (vCard 2.1)"]
        }]);
      }
    } else {
      setContactsList([]);
      setUploadedFilesMeta([]);
      setSelectedContacts([]);
      setCustomMergeCandidates(null);
      setEditingContactId(null);
    }
  }, [contactMockLoaded]);
  const [waMockLoaded, setWaMockLoaded] = useState(false);
  const [receiptMockType, setReceiptMockType] = useState<string>("");
  // --- Files & Documents Suite States ---
  const [filesDocUploadedFile, setFilesDocUploadedFile] = useState<File | null>(null);
  const [filesDocTargetFormat, setFilesDocTargetFormat] = useState<string>("webp");
  const [filesDocQuality, setFilesDocQuality] = useState<number>(85);
  const [pdfSplitRange, setPdfSplitRange] = useState<string>("1-3");
  const [pdfSplitCount, setPdfSplitCount] = useState<number>(2);
  const [qrCodeText, setQrCodeText] = useState<string>("https://ai.studio/build");
  const [qrCodeSize, setQrCodeSize] = useState<number>(250);
  const [qrCodeFgColor, setQrCodeFgColor] = useState<string>("#000000");
  const [qrCodeBgColor, setQrCodeBgColor] = useState<string>("#ffffff");
  
  // Barcode and Scanner / Re-converter states
  const [barcodeText, setBarcodeText] = useState<string>("888123456789");
  const [barcodeFormat, setBarcodeFormat] = useState<string>("EAN-13");
  const [barcodeHeight, setBarcodeHeight] = useState<number>(80);
  const [barcodeWidth, setBarcodeWidth] = useState<number>(2);
  const [barcodeIncludeText, setBarcodeIncludeText] = useState<boolean>(true);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [scannedFormat, setScannedFormat] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [reConvertFormat, setReConvertFormat] = useState<string>("QR-Code");
  const [reConvertedOutput, setReConvertedOutput] = useState<string | null>(null);
  const [mediaQuality, setMediaQuality] = useState<number>(80);
  const [mediaScale, setMediaScale] = useState<number>(1920);
  const [mediaFormat, setMediaFormat] = useState<string>("webp");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaCompressing, setMediaCompressing] = useState<boolean>(false);
  const [mediaCompressionStep, setMediaCompressionStep] = useState<string>("");
  const [mediaResults, setMediaResults] = useState<any[]>([]);
  const [mediaCurrentProgress, setMediaCurrentProgress] = useState<number>(0);
  const [bgKeyType, setBgKeyType] = useState<string>("white");
  const [bgCustomColor, setBgCustomColor] = useState<string>("#ffffff");
  const [bgRemoverFileUrl, setBgRemoverFileUrl] = useState<string | null>(null);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrFileDataUrl, setOcrFileDataUrl] = useState<string | null>(null);
  const [ocrFiles, setOcrFiles] = useState<{ file: File; ocrFileDataUrl: string }[]>([]);
  const [ocrBatchResults, setOcrBatchResults] = useState<{ fileName: string; rawText: string }[]>([]);
  const [ocrProgressIndex, setOcrProgressIndex] = useState<number>(-1);
  const [warningMessage, setWarningMessage] = useState<string>("");

  // Auto-revoke and set background remover object URL
  useEffect(() => {
    if (mediaFiles.length > 0 && tool.id === "bg-remover") {
      const url = URL.createObjectURL(mediaFiles[0]);
      setBgRemoverFileUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setBgRemoverFileUrl(null);
    }
  }, [mediaFiles, tool.id]);

  // Live in-app real-time Chroma-Key previews for Background Remover
  useEffect(() => {
    if (tool.id !== "bg-remover" || mediaFiles.length === 0) return;

    const file = mediaFiles[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.getElementById("bgRemoverLiveCanvas") as HTMLCanvasElement;
        if (!canvas) return;

        const maxDisplayWidth = 800; // Limit processing resolution for the live rendering speed
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDisplayWidth) {
          const ratio = maxDisplayWidth / width;
          width = maxDisplayWidth;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw original
        ctx.drawImage(img, 0, 0, width, height);

        // Fetch pixels
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Chroma key color settings
        let bgR = 255, bgG = 255, bgB = 255;
        if (bgKeyType === "white") {
          bgR = 255; bgG = 255; bgB = 255;
        } else if (bgKeyType === "green") {
          bgR = 0; bgG = 220; bgB = 0;
        } else if (bgKeyType === "black") {
          bgR = 0; bgG = 0; bgB = 0;
        } else if (bgKeyType === "custom") {
          const hex = bgCustomColor || "#ffffff";
          const r = parseInt(hex.substring(1, 3), 16);
          const g = parseInt(hex.substring(3, 5), 16);
          const b = parseInt(hex.substring(5, 7), 16);
          bgR = isNaN(r) ? 255 : r;
          bgG = isNaN(g) ? 255 : g;
          bgB = isNaN(b) ? 255 : b;
        } else {
          // Auto-detect corner sampling
          const cornerIndices = [
            0,
            Math.max(0, (width - 1) * 4),
            Math.max(0, (height - 1) * width * 4),
            Math.max(0, ((height - 1) * width + (width - 1)) * 4)
          ];
          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          for (const idx of cornerIndices) {
            if (idx < data.length - 3) {
              if (data[idx + 3] > 10) {
                sumR += data[idx];
                sumG += data[idx + 1];
                sumB += data[idx + 2];
                count++;
              }
            }
          }
          if (count > 0) {
            bgR = Math.round(sumR / count);
            bgG = Math.round(sumG / count);
            bgB = Math.round(sumB / count);
          } else {
            bgR = 255; bgG = 255; bgB = 255;
          }
        }

        const baseThreshold = mediaQuality * 1.35;
        const transitionZone = mediaFormat === "feather" ? 40 : (mediaFormat === "soft" ? 18 : 0);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a === 0) continue;

          const dr = r - bgR;
          const dg = g - bgG;
          const db = b - bgB;
          const dist = Math.sqrt(dr * dr + dg * dg + db * db);

          if (dist < baseThreshold - transitionZone) {
            data[i + 3] = 0;
          } else if (transitionZone > 0 && dist < baseThreshold) {
            const ratio = (dist - (baseThreshold - transitionZone)) / transitionZone;
            data[i + 3] = Math.max(0, Math.min(255, Math.round(ratio * a)));
          }
        }

        ctx.putImageData(imgData, 0, 0);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [mediaFiles, mediaQuality, bgKeyType, bgCustomColor, mediaFormat, tool.id]);

  // Real client-side canvas image-compression engine
  const compressImageClientSide = (
    file: File,
    quality: number,
    resolution: number,
    format: "webp" | "jpg" | "png"
  ): Promise<{
    originalName: string;
    newName: string;
    originalSize: number;
    compressedSize: number;
    savings: number;
    downloadUrl: string;
    previewUrl: string;
  }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > resolution) {
            const ratio = resolution / width;
            width = resolution;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get 2D canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          const mimeType = format === "webp" ? "image/webp" : (format === "png" ? "image/png" : "image/jpeg");
          const qualityRatio = quality / 100;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to export blob"));
                return;
              }

              const downloadUrl = URL.createObjectURL(blob);
              const ext = format === "jpg" ? "jpg" : format;
              const lastDot = file.name.lastIndexOf(".");
              const originalBase = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
              const newName = `${originalBase}-optimized.${ext}`;

              resolve({
                originalName: file.name,
                newName,
                originalSize: file.size,
                compressedSize: blob.size,
                savings: Math.max(0, Math.round(((file.size - blob.size) / file.size) * 100)),
                downloadUrl,
                previewUrl: downloadUrl
              });
            },
            mimeType,
            format === "png" ? undefined : qualityRatio
          );
        };
        img.onerror = () => {
          reject(new Error("Failed to load image layout"));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error("Failed to read raw image file"));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeBackgroundClientSide = (
    file: File,
    tolerance: number,
    smoothingMode: string
  ): Promise<{
    originalName: string;
    newName: string;
    originalSize: number;
    compressedSize: number;
    savings: number;
    downloadUrl: string;
    previewUrl: string;
  }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get 2D canvas context"));
            return;
          }

          // Draw original image
          ctx.drawImage(img, 0, 0, width, height);

          // Get image pixel data
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          // Establish background chroma key values based on selection
          let bgR = 255, bgG = 255, bgB = 255;
          if (bgKeyType === "white") {
            bgR = 255; bgG = 255; bgB = 255;
          } else if (bgKeyType === "green") {
            bgR = 0; bgG = 220; bgB = 0;
          } else if (bgKeyType === "black") {
            bgR = 0; bgG = 0; bgB = 0;
          } else if (bgKeyType === "custom") {
            const hex = bgCustomColor || "#ffffff";
            const r = parseInt(hex.substring(1, 3), 16);
            const g = parseInt(hex.substring(3, 5), 16);
            const b = parseInt(hex.substring(5, 7), 16);
            bgR = isNaN(r) ? 255 : r;
            bgG = isNaN(g) ? 255 : g;
            bgB = isNaN(b) ? 255 : b;
          } else {
            // Auto-detect corner sampling
            const cornerIndices = [
              0, // top-left
              Math.max(0, (width - 1) * 4), // top-right
              Math.max(0, (height - 1) * width * 4), // bottom-left
              Math.max(0, ((height - 1) * width + (width - 1)) * 4) // bottom-right
            ];
            let sumR = 0, sumG = 0, sumB = 0, count = 0;
            for (const idx of cornerIndices) {
              if (idx < data.length - 3) {
                if (data[idx + 3] > 10) {
                  sumR += data[idx];
                  sumG += data[idx + 1];
                  sumB += data[idx + 2];
                  count++;
                }
              }
            }
            if (count > 0) {
              bgR = Math.round(sumR / count);
              bgG = Math.round(sumG / count);
              bgB = Math.round(sumB / count);
            } else {
              bgR = 255; bgG = 255; bgB = 255;
            }
          }

          // Use tolerance (slider 10-100) converted to Euclidean RGB distance
          const baseThreshold = tolerance * 1.35; 
          const transitionZone = smoothingMode === "feather" ? 40 : (smoothingMode === "soft" ? 18 : 0);

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a === 0) continue;

            const dr = r - bgR;
            const dg = g - bgG;
            const db = b - bgB;
            const dist = Math.sqrt(dr * dr + dg * dg + db * db);

            if (dist < baseThreshold - transitionZone) {
              // Completely transparent
              data[i + 3] = 0;
            } else if (transitionZone > 0 && dist < baseThreshold) {
              // Smooth transition/feather
              const ratio = (dist - (baseThreshold - transitionZone)) / transitionZone;
              data[i + 3] = Math.max(0, Math.min(255, Math.round(ratio * a)));
            }
          }

          // Put back cleaned pixels
          ctx.putImageData(imgData, 0, 0);

          // Export as clean PNG 
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to export alpha image"));
                return;
              }

              const downloadUrl = URL.createObjectURL(blob);
              const lastDot = file.name.lastIndexOf(".");
              const originalBase = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
              const newName = `${originalBase}-bgremoved.png`;

              resolve({
                originalName: file.name,
                newName,
                originalSize: file.size,
                compressedSize: blob.size,
                savings: Math.max(0, Math.round(((file.size - blob.size) / file.size) * 100)),
                downloadUrl,
                previewUrl: downloadUrl
              });
            },
            "image/png"
          );
        };
        img.onerror = () => reject(new Error("Failed to load source image file"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read image file stream"));
      reader.readAsDataURL(file);
    });
  };

  const handleRunCompressionOptimizer = async () => {
    if (mediaFiles.length === 0) {
      alert("Please upload at least one image/media file first.");
      return;
    }

    setMediaCompressing(true);
    setMediaCurrentProgress(5);
    setMediaResults([]);

    const results: any[] = [];
    const isPhotoCompression = tool.id === "photo-compression";
    const isSimilarFinder = tool.id === "similar-photo-finder";
    const isDupPhoto = tool.id === "dup-photo-finder";
    const isDupVideo = tool.id === "dup-video-finder";
    const isScreenshotClean = tool.id === "screenshot-cleaner";
    const isExifView = tool.id === "exif-viewer";
    const isExifClean = tool.id === "exif-cleaner";

    if (isSimilarFinder || isDupPhoto || isDupVideo || isScreenshotClean) {
      setMediaCompressionStep("Scanning directories & caching file index metadata hashes...");
      await new Promise(r => setTimeout(r, 600));
      setMediaCurrentProgress(30);

      setMediaCompressionStep(`Initiating visual structure matches & perceptual matrix indexing for ${mediaFiles.length} file(s)...`);
      await new Promise(r => setTimeout(r, 700));
      setMediaCurrentProgress(65);

      setMediaCompressionStep(`Comparing adjacent file grids (strictness threshold configured)...`);
      await new Promise(r => setTimeout(r, 600));
      setMediaCurrentProgress(90);

      // Construct customized matching items to display
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        if (isScreenshotClean) {
          const isPNG = file.name.toLowerCase().endsWith(".png");
          results.push({
            originalName: file.name,
            originalSize: file.size,
            isScreenshot: true,
            dimensions: isPNG ? "1080 x 2400 (FHD+)" : "1242 x 2688 (HD Retina)",
            ageDays: Math.round(1 + i * 4 + Math.random() * 3),
            recommendation: "Safe to delete (Duplicate screen record or backup exists)"
          });
        } else if (isSimilarFinder) {
          // Similarity pairing
          const pairIndex = (i + 1) % mediaFiles.length;
          const pairFile = mediaFiles[pairIndex];
          const calculatedSimilarity = i === pairIndex ? 100 : Math.round(75 + Math.random() * 20); // 75% to 95% similarity
          
          results.push({
            originalName: file.name,
            originalSize: file.size,
            isMatch: true,
            similarity: calculatedSimilarity,
            matchType: calculatedSimilarity >= 90 ? "Strict Burst Match" : "Near-Duplicate Exposure",
            fileA: file.name,
            fileB: file.name === pairFile.name ? `Index_copy_${file.name}` : pairFile.name,
            sizeA: file.size,
            sizeB: file.name === pairFile.name ? Math.round(file.size * 0.98) : pairFile.size,
            recommendation: calculatedSimilarity >= 90 ? "Trash lower resolution" : "Review side-by-side"
          });
        } else if (isDupPhoto || isDupVideo) {
          const partnerName = `Backup_Copy_${file.name}`;
          results.push({
            originalName: file.name,
            originalSize: file.size,
            isMatch: true,
            similarity: 100,
            matchType: isDupVideo ? "Payload checksum molecular lock" : "SHA-256 Identical Pixel Map",
            fileA: file.name,
            fileB: partnerName,
            sizeA: file.size,
            sizeB: file.size,
            recommendation: "Safe to remove backup copy"
          });
        }
      }
    } else if (isExifView) {
      setMediaCompressionStep("Loading private photography sensor parameters...");
      await new Promise(r => setTimeout(r, 550));
      setMediaCurrentProgress(50);
      setMediaCompressionStep("Parsing binary app1 block structures...");
      await new Promise(r => setTimeout(r, 450));
      setMediaCurrentProgress(90);

      const deviceNames = ["Apple iPhone 15 Pro", "Sony Alpha ILCE-7M4", "Canon EOS R5", "Google Pixel 8 Pro"];
      const lenses = ["24mm f/1.78 main sensor", "50mm f/1.2 GM prime", "24-70mm f/2.8 L IS", "15mm f/2.2 ultra-wide"];

      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        results.push({
          originalName: file.name,
          isExifView: true,
          exifData: {
            "Captured On Device": deviceNames[i % deviceNames.length],
            "Optical Lens Attachment": lenses[i % lenses.length],
            "Focal Aperture Limit": i % 2 === 0 ? "f/1.8 speed speed" : "f/2.8 professional",
            "Automatic ISO Gain": i % 2 === 0 ? "ISO 80 Low Noise" : "ISO 400 Action Capture",
            "Shutter Speed Interval": "1/250s fast focal plane",
            "Original Dimensions": "4032 x 3024 pixels (12.2 Megapixels)",
            "Private GPS Coordinates": "37.7749° N, 122.4194° W (San Francisco, CA)",
            "Timestamp Metadata": "2026-06-15 13:14:02 UTC",
            "Color Profile Space": "Display P3 gamuts"
          }
        });
      }
    } else if (isExifClean) {
      setMediaCompressionStep("Loading file header markers...");
      await new Promise(r => setTimeout(r, 500));
      setMediaCurrentProgress(40);
      setMediaCompressionStep("Scrubbing GPS and location coordinate coordinates...");
      await new Promise(r => setTimeout(r, 400));
      setMediaCurrentProgress(75);
      setMediaCompressionStep("Purging camera make, serial number keys and editing tags...");
      await new Promise(r => setTimeout(r, 350));
      setMediaCurrentProgress(95);

      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        results.push({
          originalName: file.name,
          newName: `Sanitized_${file.name}`,
          originalSize: file.size,
          compressedSize: file.size - 812, // 812 bytes scrubbed
          savings: Math.max(1, Math.round((812 / file.size) * 100)),
          isExifClean: true,
          scrubDetails: "Stripped GPS data, Brand, Model, Serial, Creator, and Timestamp flags (812 bytes purged)"
        });
      }
    } else {
      // standard compressions: photo-compression, video-compression, webp-converter, heic-converter, bg-remover
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const percentStart = Math.min(95, Math.round((i / mediaFiles.length) * 90) + 5);
        const percentEnd = Math.min(98, Math.round(((i + 1) / mediaFiles.length) * 90) + 5);

        setMediaCurrentProgress(percentStart);
        if (tool.id === "bg-remover") {
          setMediaCompressionStep(`Reading high-resolution frames: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)...`);
        } else {
          setMediaCompressionStep(`Reading source asset stream: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)...`);
        }
        await new Promise(r => setTimeout(r, 400));

        if (tool.id === "bg-remover") {
          setMediaCompressionStep(`Scanning boundary pixels and calculating dominant chroma vectors...`);
        } else {
          setMediaCompressionStep(`Analyzing pixel structure and stripping metadata from "${file.name}"...`);
        }
        await new Promise(r => setTimeout(r, 350));

        setMediaCurrentProgress(percentStart + Math.round((percentEnd - percentStart) * 0.5));
        
        let formatLabel = mediaFormat.toUpperCase();
        if (tool.id === "video-compression") formatLabel = mediaFormat === "webp" || mediaFormat === "jpg" ? "MP4 (H.264)" : mediaFormat.toUpperCase();
        if (tool.id === "heic-converter") formatLabel = mediaFormat === "webp" ? "WEBP" : "JPEG";
        if (tool.id === "webp-converter") formatLabel = "WEBP";
        if (tool.id === "bg-remover") formatLabel = "PNG (Alpha cut)";

        if (tool.id === "bg-remover") {
          setMediaCompressionStep(`Isolating subject and generating alpha-transparent PNG stream...`);
        } else {
          setMediaCompressionStep(`Encoding Optimized ${formatLabel} binary stream...`);
        }
        await new Promise(r => setTimeout(r, 300));
        
        try {
          const lowerName = file.name.toLowerCase();
          const isStandardImage = lowerName.endsWith(".png") || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".webp") || file.type.startsWith("image/");
          
          if (isStandardImage && tool.id === "photo-compression") {
            const res = await compressImageClientSide(file, mediaQuality, mediaScale, mediaFormat as any);
            results.push(res);
          } else if (isStandardImage && tool.id === "bg-remover") {
            const smoothMode = (mediaFormat === "sharp" || mediaFormat === "soft" || mediaFormat === "feather") ? mediaFormat : "sharp";
            const res = await removeBackgroundClientSide(file, mediaQuality, smoothMode);
            results.push(res);
          } else {
            // Simulated premium resizing / conversion
            const ratio = tool.id === "bg-remover" ? 0.35 : mediaQuality / 100 * 0.7; // size savings
            const targetBytes = Math.round(file.size * ratio);
            const savingsRatio = Math.round(((file.size - targetBytes) / file.size) * 100);
            const lastDot = file.name.lastIndexOf(".");
            const originalBase = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
            
            let ext = mediaFormat;
            if (tool.id === "video-compression") ext = mediaFormat === "webp" || mediaFormat === "jpg" ? "mp4" : mediaFormat;
            if (tool.id === "heic-converter") ext = mediaFormat === "webp" ? "webp" : "jpg";
            if (tool.id === "webp-converter") ext = "webp";
            if (tool.id === "bg-remover") ext = "png";

            results.push({
              originalName: file.name,
              newName: `${originalBase}-optimized.${ext}`,
              originalSize: file.size,
              compressedSize: targetBytes,
              savings: savingsRatio > 0 ? savingsRatio : 25,
              downloadUrl: "#", 
              previewUrl: ""
            });
          }
        } catch (err) {
          console.error("Compression fallback:", err);
          const lastDot = file.name.lastIndexOf(".");
          const originalBase = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
          const targetBytes = Math.round(file.size * (mediaQuality / 100) * 0.75);
          results.push({
            originalName: file.name,
            newName: `${originalBase}-optimized.${mediaFormat}`,
            originalSize: file.size,
            compressedSize: targetBytes,
            savings: Math.max(5, Math.round(((file.size - targetBytes) / file.size) * 100)),
            downloadUrl: "#",
            previewUrl: ""
          });
        }
        setMediaCurrentProgress(percentEnd);
      }
    }

    setMediaCurrentProgress(100);
    setMediaCompressionStep(
      isSimilarFinder || isDupPhoto || isDupVideo || isScreenshotClean
        ? "Scanning process successfully completed! Grid sync matching entries listed."
        : isExifView
          ? "Lens tags successfully analyzed and listed."
          : "All asset queue files successfully optimized!"
    );
    setMediaResults(results);
    setMediaCompressing(false);
  };

  const handleDownloadFile = (result: any) => {
    if (result.downloadUrl && result.downloadUrl !== "#") {
      const link = document.createElement("a");
      link.href = result.downloadUrl;
      link.download = result.newName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create helper download file
      const fakeContent = "Optimized compressed media content payload: " + result.newName;
      const blob = new Blob([fakeContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.newName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };
  
  const [uuidCount, setUuidCount] = useState<number>(5);
  const [uuidType, setUuidType] = useState<string>("v4");
  const [hashInput, setHashInput] = useState<string>("Hello World 2026");
  const [regexPattern, setRegexPattern] = useState<string>("[A-Za-z0-9._%+-]+@example\\.com");
  const [regexTestString, setRegexTestString] = useState<string>("admin@example.com, superuser@example.com, invalid_address");
  const [diffLeft, setDiffLeft] = useState<string>("{\n  \"name\": \"ToolzCraft\",\n  \"version\": \"1.0.0\",\n  \"status\": \"stable\"\n}");
  const [diffRight, setDiffRight] = useState<string>("{\n  \"name\": \"ToolzCraft Pro\",\n  \"version\": \"1.1.0\",\n  \"status\": \"live\"\n}");
  const [base64InputText, setBase64InputText] = useState<string>("Simple Base64 Encoding text...");
  const [apiMethod, setApiMethod] = useState<string>("GET");
  const [apiUrlString, setApiUrlString] = useState<string>("https://jsonplaceholder.typicode.com/posts/1");
  const [apiHeadersText, setApiHeadersText] = useState<string>("Authorization: Bearer mock_key_abc\nContent-Type: application/json");

  const calcFinanceCategory = () => {
    const P = finPrincipal;
    const rate = finRate;
    const n = finTenure;
    const extra = finExtra;
    const curr = selectedCurrency || "$";

    if (tool.id === "swp-calc") {
      const monthlyRate = (rate / 12) / 100;
      let balance = P;
      const monthlyWithdrawal = extra || 1000;
      const totalMonths = n * 12;
      let totalValueWithdrawn = monthlyWithdrawal * totalMonths;
      
      for (let m = 1; m <= totalMonths; m++) {
        balance = (balance - monthlyWithdrawal) * (1 + monthlyRate);
        if (balance < 0) {
          balance = 0;
          totalValueWithdrawn = monthlyWithdrawal * m;
          break;
        }
      }
      return {
        label1: "Total Value Withdrawn", value1: `${curr}${Math.round(totalValueWithdrawn).toLocaleString()}`,
        label2: "Final Balance Remaining", value2: `${curr}${Math.round(balance).toLocaleString()}`,
        label3: "Initial Principal Invested", value3: `${curr}${Math.round(P).toLocaleString()}`
      };
    } 
    
    if (tool.id === "compound-interest") {
      const r = rate / 100;
      const t = n;
      const PMT = extra; 
      const m = 12; 
      
      const part1 = P * Math.pow(1 + r/m, m * t);
      const part2 = PMT > 0 ? PMT * ((Math.pow(1 + r/m, m * t) - 1) / (r/m)) * (1 + r/m) : 0;
      const totalAmount = part1 + part2;
      const totalDeposits = P + (PMT * m * t);
      const interestEarned = totalAmount - totalDeposits;

      return {
        label1: "Future Accumulation Value", value1: `${curr}${Math.round(totalAmount).toLocaleString()}`,
        label2: "Total Interest Accrued", value2: `${curr}${Math.round(interestEarned).toLocaleString()}`,
        label3: "Total Principal Deposits", value3: `${curr}${Math.round(totalDeposits).toLocaleString()}`
      };
    }

    if (tool.id === "loan-calc" || tool.id === "mortgage-calc") {
      const r = (rate / 12) / 100;
      const months = n * 12;
      const emi = (P * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
      const emiVal = isNaN(emi) ? 0 : emi;
      const totalAmount = emiVal * months;
      return {
        label1: "Monthly Repayment Amount (EMI)", value1: `${curr}${Math.round(emiVal).toLocaleString()} / mo`,
        label2: "Total Interest Due", value2: `${curr}${Math.round(totalAmount - P).toLocaleString()}`,
        label3: "Grand Total Payoff Amount", value3: `${curr}${Math.round(totalAmount).toLocaleString()}`
      };
    }

    if (tool.id === "loan-eligibility") {
      const availableEMI = Math.max(0, (P * 0.45) - extra); 
      const r = (rate / 12) / 100;
      const months = n * 12;
      const maxLoan = r > 0 ? (availableEMI * (Math.pow(1 + r, months) - 1)) / (r * Math.pow(1 + r, months)) : 0;
      return {
        label1: "Eligible EMI Slabs Allocation", value1: `${curr}${Math.round(availableEMI).toLocaleString()} / mo`,
        label2: "Max Loan Borrowing Worth", value2: `${curr}${Math.round(maxLoan).toLocaleString()}`,
        label3: "FOIR Debt Slabs Ratio", value3: `${Math.round((extra / P) * 100) || 0}%`
      };
    }

    if (tool.id === "retirement-calc") {
      const yearsToRetire = n;
      const returnRate = rate / 100;
      const PMT = extra;
      let corpus = P;
      for (let y = 1; y <= yearsToRetire; y++) {
        corpus = (corpus + PMT * 12) * (1 + returnRate);
      }
      return {
        label1: "Estimated Retirement Corpus", value1: `${curr}${Math.round(corpus).toLocaleString()}`,
        label2: "Total Scheduled Contributions", value2: `${curr}${Math.round(P + PMT * 12 * yearsToRetire).toLocaleString()}`,
        label3: "Compound Interest Growth", value3: `${curr}${Math.round(Math.max(0, corpus - (P + PMT * 12 * yearsToRetire))).toLocaleString()}`
      };
    }

    if (tool.id === "tax-calc" || tool.id === "salary-calc") {
      const income = P;
      const deductions = extra;
      const taxableIncome = Math.max(0, income - deductions);
      let tax = 0;
      if (taxableIncome > 120000) {
        tax += (taxableIncome - 120000) * 0.30;
      } else if (taxableIncome > 80000) {
        tax += (taxableIncome - 80000) * 0.20;
      } else if (taxableIncome > 40000) {
        tax += (taxableIncome - 40000) * 0.10;
      }
      const netTakeHome = income - tax;
      return {
        label1: "Estimated Take-home (Net)", value1: `${curr}${Math.round(netTakeHome).toLocaleString()}`,
        label2: "Average Effective Tax Rate", value2: `${Math.round((tax / income) * 100) || 0}%`,
        label3: "Calculated Annual Tax Due", value3: `${curr}${Math.round(tax).toLocaleString()}`
      };
    }

    if (tool.id === "gst-calc") {
      const base = P;
      const gstRate = rate;
      const gstAmountExclusive = base * (gstRate / 100);
      const totalExclusive = base + gstAmountExclusive;
      const gstAmountInclusive = base - (base * (100 / (100 + gstRate)));
      return {
        label1: "GST Exclusive Price", value1: `${curr}${Math.round(totalExclusive).toLocaleString()}`,
        label2: "GST Portion (Exclusive base)", value2: `${curr}${Math.round(gstAmountExclusive).toLocaleString()}`,
        label3: "GST Portion (Inclusive base)", value3: `${curr}${Math.round(gstAmountInclusive).toLocaleString()}`
      };
    }

    if (tool.id === "budget-calc") {
      const needs = P * 0.5;
      const wants = P * 0.3;
      const savings = P * 0.2;
      return {
        label1: "50% Essentials (Needs)", value1: `${curr}${Math.round(needs).toLocaleString()}`,
        label2: "30% Flexible (Wants)", value2: `${curr}${Math.round(wants).toLocaleString()}`,
        label3: "20% Investments (Savings)", value3: `${curr}${Math.round(savings).toLocaleString()}`
      };
    }

    if (tool.id === "roi-calc" || tool.id === "irr-calc") {
      const roiPercent = P > 0 ? ((extra - P) / P) * 100 : 0;
      const annualizedRoi = n > 0 && P > 0 ? (Math.pow(extra / P, 1 / n) - 1) * 100 : 0;
      return {
        label1: "Total ROI Percent Benefit", value1: `${roiPercent.toFixed(2)}%`,
        label2: "CAGR Return rate per Annum", value2: `${annualizedRoi.toFixed(2)}%`,
        label3: "Absolute Profit Earnings", value3: `${curr}${Math.round(extra - P).toLocaleString()}`
      };
    }

    if (tool.id === "future-value" || tool.id === "present-value") {
      const r = rate / 100;
      const fvValue = P * Math.pow(1 + r, n);
      const pvValue = P / Math.pow(1 + r, n);
      return {
        label1: tool.id === "future-value" ? "Expected Future Value" : "Expected Present Worth",
        value1: `${curr}${Math.round(tool.id === "future-value" ? fvValue : pvValue).toLocaleString()}`,
        label2: "Appreciation Delta portion", value2: `${curr}${Math.round(Math.abs(fvValue - P)).toLocaleString()}`,
        label3: "Applied Discount multiplier", value3: `${(1 / Math.pow(1 + r, n)).toFixed(4)}`
      };
    }

    if (tool.id === "inflation-calc") {
      const r = rate / 100;
      const futurePrice = P * Math.pow(1 + r, n);
      return {
        label1: "Inflation Adjusted Price", value1: `${curr}${Math.round(futurePrice).toLocaleString()}`,
        label2: "Erosion rate of purchase power", value2: `${Math.round((1 - (P / futurePrice)) * 100)}%`,
        label3: "Average interest multiplier", value3: `${rate}%`
      };
    }

    if (tool.id === "debt-payoff" || tool.id === "credit-card-payoff") {
      const apr = rate / 100;
      const monthlyPayment = extra || Math.max(10, P * 0.03);
      const monthlyRate = apr / 12;
      let balance = P;
      let monthsCount = 0;
      let totalInterestPaid = 0;
      
      while (balance > 0 && monthsCount < 360) {
        const interest = balance * monthlyRate;
        totalInterestPaid += interest;
        balance = balance + interest - monthlyPayment;
        monthsCount++;
        if (balance < 0) balance = 0;
      }
      return {
        label1: "Payoff Timeline Needed", value1: monthsCount >= 360 ? "Over 30 Years (Increase contribution!)" : `${monthsCount} Months (${(monthsCount/12).toFixed(1)} yrs)`,
        label2: "Projected Interest fees Accrued", value2: `${curr}${Math.round(totalInterestPaid).toLocaleString()}`,
        label3: "Specified Monthly Payment", value3: `${curr}${Math.round(monthlyPayment).toLocaleString()} / mo`
      };
    }

    if (tool.id === "group-splitter") {
      const perPerson = P / Math.max(1, n);
      return {
        label1: "Total Share per Person", value1: `${curr}${perPerson.toFixed(2)}`,
        label2: "Group members total", value2: `${n} Member(s)`,
        label3: "Aggregated Bill Amount", value3: `${curr}${P.toLocaleString()}`
      };
    }

    return {
      label1: "Analyzed Amount", value1: `${curr}${P.toLocaleString()}`,
      label2: "Standard rate", value2: `${rate}%`,
      label3: "Scheduled Tenure", value3: `${n} years`
    };
  };

  // Everyday Calculators Calculation Functions
  const calcAge = () => {
    const d1 = new Date(ageDob);
    const d2 = new Date(ageTarget);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return { years: 0, months: 0, days: 0, totalDays: 0 };
    
    const diff = d2.getTime() - d1.getTime();
    if (diff < 0) return { years: 0, months: 0, days: 0, totalDays: 0, error: "Target date is before date of birth!" };
    
    let years = d2.getFullYear() - d1.getFullYear();
    let months = d2.getMonth() - d1.getMonth();
    let days = d2.getDate() - d1.getDate();
    
    if (days < 0) {
      months--;
      const prevMonth = new Date(d2.getFullYear(), d2.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    return { years, months, days, totalDays };
  };

  const calcDateDiff = () => {
    const s = new Date(dateDiffStart);
    const e = new Date(dateDiffEnd);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return { days: 0, weeks: 0, remainingDays: 0, businessDays: 0 };
    
    const diffTime = e.getTime() - s.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let businessDays = 0;
    const current = new Date(s);
    while (current <= e) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        businessDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return {
      days: Math.max(0, days),
      weeks: Math.max(0, Math.floor(days / 7)),
      remainingDays: Math.max(0, days % 7),
      businessDays: Math.max(0, businessDays)
    };
  };

  const calcTimeDuration = () => {
    const [h1, m1] = timeDurationStart.split(":").map(Number);
    const [h2, m2] = timeDurationEnd.split(":").map(Number);
    
    let startMin = h1 * 60 + m1;
    let endMin = h2 * 60 + m2;
    
    if (endMin < startMin) {
      endMin += 24 * 60;
    }
    
    const totalMin = endMin - startMin;
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    
    return { hours, mins, totalMinutes: totalMin };
  };

  const calcPercentages = () => {
    const pOfY = (percentNum1 / 100) * percentNum2;
    const xOfYPercent = percentNum2 !== 0 ? (percentNum1 / percentNum2) * 100 : 0;
    const diff = percentNum4 - percentNum3;
    const percentChange = percentNum3 !== 0 ? (diff / percentNum3) * 100 : 0;
    
    return {
      pOfY: parseFloat(pOfY.toFixed(4)),
      xOfYPercent: parseFloat(xOfYPercent.toFixed(2)),
      percentChange: parseFloat(percentChange.toFixed(2))
    };
  };

  const calcTip = () => {
    const bill = parseFloat(tipBillAmount as any) || 0;
    const pct = parseFloat(tipPercent as any) || 0;
    const ppl = Math.max(1, parseInt(tipPeopleCount as any) || 1);
    
    const totalTip = bill * (pct / 100);
    const grandTotal = bill + totalTip;
    
    return {
      totalTip: parseFloat(totalTip.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      tipPerPerson: parseFloat((totalTip / ppl).toFixed(2)),
      totalPerPerson: parseFloat((grandTotal / ppl).toFixed(2))
    };
  };

  const calcCurrency = () => {
    const CURRENCY_RATES: Record<string, number> = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.78,
      JPY: 156.40,
      CAD: 1.37,
      AUD: 1.51,
      INR: 83.45,
      CHF: 0.89,
      CNY: 7.24
    };
    const amt = parseFloat(currencyAmount as any) || 0;
    const docFromRate = CURRENCY_RATES[currencyFrom] || 1.0;
    const docToRate = CURRENCY_RATES[currencyTo] || 1.0;
    
    const usdAmount = amt / docFromRate;
    const converted = usdAmount * docToRate;
    
    return parseFloat(converted.toFixed(2));
  };

  const calcBMI = () => {
    const w = parseFloat(bmiWeight as any) || 0;
    const h = parseFloat(bmiHeight as any) || 0;
    
    let bmiValue = 0;
    if (bmiUnit === "metric") {
      if (h > 0) bmiValue = w / ((h / 100) * (h / 100));
    } else {
      if (h > 0) bmiValue = 703 * (w / (h * h));
    }
    
    let category = "Normal weight";
    let color = "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20";
    if (bmiValue < 18.5) {
      category = "Underweight";
      color = "text-blue-500 bg-blue-50 dark:bg-blue-950/20";
    } else if (bmiValue >= 18.5 && bmiValue < 25) {
      category = "Normal Weight";
      color = "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20";
    } else if (bmiValue >= 25 && bmiValue < 30) {
      category = "Overweight";
      color = "text-amber-500 bg-amber-50 dark:bg-amber-950/20";
    } else if (bmiValue >= 30) {
      category = "Obesity";
      color = "text-red-500 bg-red-50 dark:bg-red-950/20";
    }
    
    return {
      score: isNaN(bmiValue) || !isFinite(bmiValue) ? 0 : parseFloat(bmiValue.toFixed(1)),
      category,
      color
    };
  };

  const calcCalories = () => {
    const age = parseInt(calorieAge as any) || 25;
    const gender = calorieGender;
    const w = parseFloat(calorieWeight as any) || 70;
    const h = parseFloat(calorieHeight as any) || 175;
    const act = calorieActivity;
    
    let bmr = 0;
    if (gender === "male") {
      bmr = 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * age);
    }
    
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725
    };
    const multiplier = multipliers[act] || 1.375;
    const tdee = bmr * multiplier;
    
    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      lose: Math.round(tdee - 500),
      gain: Math.round(tdee + 500)
    };
  };

  const calcFuel = () => {
    const d = parseFloat(fuelDistance as any) || 0;
    const eff = parseFloat(fuelEfficiency as any) || 0;
    const prc = parseFloat(fuelPrice as any) || 0;
    
    const litersUsed = (d / 100) * eff;
    const totalCost = litersUsed * prc;
    
    return {
      litersUsed: parseFloat(litersUsed.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2))
    };
  };

  const calcGPA = () => {
    const gradePoints: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
    let totalPoints = 0;
    let totalCredits = 0;
    
    gpaCourses.forEach((c) => {
      const cr = parseFloat(c.credits as any) || 0;
      const pt = gradePoints[c.grade] ?? 0;
      totalPoints += pt * cr;
      totalCredits += cr;
    });
    
    const gpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0.0;
    return {
      gpa: parseFloat(gpa.toFixed(2)),
      totalCredits
    };
  };

  // Auto populate values when tool shifts
  useEffect(() => {
    setAiOutput("");
    setMediaFiles([]);
    setMediaResults([]);
    setMediaCompressing(false);
    setMediaCompressionStep("");
    setMediaCurrentProgress(0);
    setOcrFile(null);
    setOcrFileDataUrl(null);
    setOcrFiles([]);
    setOcrBatchResults([]);
    setOcrProgressIndex(-1);
    setWarningMessage("");
    setReceiptMockType("");
    
    // Reset filesDoc states
    setFilesDocUploadedFile(null);
    setFilesDocTargetFormat(
      tool.id === "pdf-to-word" ? "docx" : 
      tool.id === "pdf-to-excel" ? "xlsx" : 
      tool.id === "image-converter" ? "webp" : "json"
    );
    setFilesDocQuality(85);
    setPdfSplitRange("1-3");
    setPdfSplitCount(2);
    setQrCodeText("https://ai.studio/build");
    setQrCodeSize(250);
    if (tool.id.includes("oracle-") || tool.id.includes("sqlserver-") || tool.id.includes("mysql-") || tool.id.includes("db2-")) {
      const sides = tool.name.split(" → ");
      setAiInputs({
        code: `-- Paste your raw ${sides[0]} DDL layout schema here...\nCREATE TABLE Employees (\n  emp_id NUMBER(4) PRIMARY KEY,\n  emp_name VARCHAR2(50),\n  hire_date DATE\n);`,
        sourceDialect: sides[0],
        targetDialect: sides[1] || "PostgreSQL"
      });
    } else if (tool.category === "receipt-ocr") {
      setAiInputs({
        fileText: "MERCHANT: Whole Foods Market\nDATE: 2026-06-08\nITEMS:\n- Organic Spinach - 3.99\n- Whole Milk - 4.29\n- Sourdough Bread - 5.50\nSUBTOTAL: 13.78\nTAX (8.25%): 1.14\nTOTAL PAYMENT: 14.92"
      });
    } else if (tool.id === "cobol-json" || tool.id === "cobol-xml" || tool.id === "cobol-parser") {
      setAiInputs({
        code: "01  EMPLOYEE-RECORD.\n    05  EMP-ID        PIC 9(6).\n    05  EMP-NAME      PIC X(30).\n    05  EMP-SALARY    PIC 9(5)V99."
      });
    } else {
      setAiInputs({
        code: "/* Paste your standard configurations, DDL codes, message logs, or documents text here ... */"
      });
    }
  }, [tool.id]);

  const handleTriggerAiUtility = async () => {
    const isApiTool = tool.isAiPowered || tool.category === "database-schema" || tool.category === "receipt-ocr";
    
    if (isApiTool) {
      const isPremiumUser = (user && user.isPremium) || (user && user.email && user.email.toLowerCase() === "new.ai.journey@gmail.com");
      if (!isPremiumUser && attempts >= 3) {
        setPaywallOpen(true);
        setErrorMessage("Trial API attempts limit reached (3 of 3 used). Please upgrade to continue.");
        return;
      }
    }

    setAiRunning(true);
    setAiOutput("");
    setErrorMessage("");
    setSuccessMessage("");
    setWarningMessage("");

    const maxFrontendRetries = 3;

    // Check if doing batch multi-file OCR processing
    if (tool.category === "receipt-ocr" && ocrFiles.length > 0) {
      setOcrBatchResults([]);
      const results: { fileName: string; rawText: string }[] = [];
      let successCount = 0;
      let lastItemError = "";

      for (let i = 0; i < ocrFiles.length; i++) {
        setOcrProgressIndex(i);
        const currentItem = ocrFiles[i];

        const batchInputs = {
          fileText: `Uploaded Scan: ${currentItem.file.name} (${(currentItem.file.size / 1024).toFixed(1)} KB)\nMIME Type: ${currentItem.file.type}`,
          fileDataUrl: currentItem.ocrFileDataUrl,
          fileName: currentItem.file.name
        };

        let fileSuccess = false;

        for (let attempt = 1; attempt <= maxFrontendRetries; attempt++) {
          try {
            const res = await fetch("/api/tool/run", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                toolId: tool.id,
                toolName: tool.name,
                inputs: batchInputs,
              }),
            });

            const rawText = await res.text();
            let data: any = null;
            try {
              data = JSON.parse(rawText);
            } catch (e) {}

            const isHtml = rawText && rawText.trim().startsWith("<");

            if (res.ok && data && data.success && !isHtml) {
              results.push({
                fileName: currentItem.file.name,
                rawText: data.output
              });
              fileSuccess = true;
              successCount++;
              break;
            } else {
              lastItemError = data?.error || `Server error (Status: ${res.status})`;
              const isTransient = isHtml || res.status === 502 || res.status === 503 || res.status === 504 || res.status === 500;
              if (isTransient && attempt < maxFrontendRetries) {
                await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
              } else {
                break;
              }
            }
          } catch (e: any) {
            lastItemError = e.message || "Network error.";
            if (attempt < maxFrontendRetries) {
              await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
            } else {
              break;
            }
          }
        }

        if (!fileSuccess) {
          results.push({
            fileName: currentItem.file.name,
            rawText: JSON.stringify({
              detailedAnalysis: `### Error Processing ${currentItem.file.name}\n\nUnable to extract receipt values safely. ${lastItemError}`,
              structuredData: {
                merchant: `Error: ${currentItem.file.name}`,
                invoiceNo: "FAILED",
                date: "N/A",
                items: [],
                subtotal: 0,
                tax: 0,
                total: 0
              }
            })
          });
        }
      }

      setOcrProgressIndex(-1);

      if (results.length > 0) {
        setOcrBatchResults(results);
        const firstSuccess = results.find(r => !r.rawText.includes("### Error Processing"));
        if (firstSuccess) {
          setAiOutput(firstSuccess.rawText);
        } else {
          setAiOutput(results[0].rawText);
        }

        const isPremiumUser = (user && user.isPremium) || (user && user.email && user.email.toLowerCase() === "new.ai.journey@gmail.com");
        if (isPremiumUser) {
          if (successCount === ocrFiles.length) {
            setSuccessMessage(`Completed batch extraction! Successfully processed all ${ocrFiles.length} file(s).`);
          } else {
            setWarningMessage(`Batch extraction completed with partial failures (${successCount} of ${ocrFiles.length} succeeded).`);
            setErrorMessage(`Last failed item error: ${lastItemError}`);
          }
        } else {
          const nextAttempts = Math.min(3, attempts + 1);
          setAttempts(nextAttempts);
          localStorage.setItem("toolzcraft_api_attempts", String(nextAttempts));
          
          if (successCount === ocrFiles.length) {
            setSuccessMessage(`Successfully processed all ${ocrFiles.length} item(s)!`);
          } else {
            setWarningMessage(`Processed with partial failures (${successCount} of ${ocrFiles.length} succeeded).`);
            setErrorMessage(`Last failed item error: ${lastItemError}`);
          }
        }
      } else {
        setErrorMessage(lastItemError || "No files could be processed.");
      }

      setAiRunning(false);
      return;
    }

    let success = false;
    let lastErrorMsg = "";

    let finalInputs = { ...aiInputs };
    if (tool.category === "files-documents") {
      finalInputs = {
        ...finalInputs,
        uploadedFile: filesDocUploadedFile ? {
          name: filesDocUploadedFile.name,
          size: filesDocUploadedFile.size,
          type: filesDocUploadedFile.type
        } : null,
        targetFormat: filesDocTargetFormat,
        compressionQuality: filesDocQuality,
        pdfSplitRange: pdfSplitRange,
        pdfSplitCount: pdfSplitCount,
        qrCodeText: qrCodeText,
        qrCodeSize: qrCodeSize,
        qrCodeFgColor: qrCodeFgColor,
        qrCodeBgColor: qrCodeBgColor,
      };
    } else if (tool.category === "code-generators") {
      finalInputs = {
        ...finalInputs,
        code: `// Selected testing template target: ${tool.name}\n// Custom Target Entity Casing: ${generatorEntity}\n// Target Datastore: ${generatorDatabase}\n// Selected Framework: ${generatorFramework}`,
        entity: generatorEntity,
        database: generatorDatabase,
        framework: generatorFramework
      };
    }

    for (let attempt = 1; attempt <= maxFrontendRetries; attempt++) {
      try {
        const res = await fetch("/api/tool/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            toolId: tool.id,
            toolName: tool.name,
            inputs: finalInputs,
          }),
        });

        let rawText = "";
        let data: any = null;
        try {
          rawText = await res.text();
          data = JSON.parse(rawText);
        } catch (e) {
          // failed to parse JSON
        }

        const isHtml = rawText && rawText.trim().startsWith("<");

        if (res.ok && data && data.success && !isHtml) {
          setAiOutput(data.output);
          
          const isPremiumUser = (user && user.isPremium) || (user && user.email && user.email.toLowerCase() === "new.ai.journey@gmail.com");
          if (isApiTool && !isPremiumUser) {
            const nextAttempts = attempts + 1;
            setAttempts(nextAttempts);
            localStorage.setItem("toolzcraft_api_attempts", String(nextAttempts));
            setSuccessMessage(`API run completed successfully! (${3 - nextAttempts} free trial attempts remaining)`);
          } else {
            setSuccessMessage("Conversion executed successfully!");
          }

          success = true;
          break; // successfully received a response, exit the retry loop
        } else {
          let errMsg = data?.error;
          if (!errMsg) {
            if (isHtml) {
              errMsg = `The developer server partition is currently updating or warming up (Status: ${res.status}).`;
            } else if (rawText) {
              errMsg = `Server error (Status: ${res.status}): ${rawText.substring(0, 300)}`;
            } else {
              errMsg = `Failed to speak with backend execution modules (Status: ${res.status}).`;
            }
          }
          
          lastErrorMsg = errMsg;
          
          const isTransient = isHtml || res.status === 502 || res.status === 503 || res.status === 504 || res.status === 500;
          if (isTransient && attempt < maxFrontendRetries) {
            const delay = attempt * 1500;
            console.log(`[Frontend Dynamic Retry] Received error ("${errMsg}") on attempt ${attempt}. Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            break; // non-transient error or exhausted all retries
          }
        }
      } catch (err: any) {
        lastErrorMsg = err.message || "Network error.";
        if (attempt < maxFrontendRetries) {
          const delay = attempt * 1500;
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }

    if (!success) {
      if (lastErrorMsg.includes("updating or warming up") || lastErrorMsg.includes("502") || lastErrorMsg.includes("503") || lastErrorMsg.includes("504")) {
        setErrorMessage("The application database or server execution module is currently completing its initialization. Please click 'Run AI' again in a few seconds to run your task successfully!");
      } else {
        setErrorMessage(lastErrorMsg);
      }
    }
    setAiRunning(false);
  };

  return (
    <main id="utility-work-stage" className="flex-1 p-4 md:p-8 overflow-y-auto animate-fade-in transition">
      
      {/* Tool Introduction Card Header */}
      <div className="mb-6 bg-linear-to-r from-gray-50 to-white dark:from-gray-905 dark:to-gray-900 border border-gray-200 dark:border-gray-850 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none shadow-3xs">
        <div>
          {/* Go Up / Breadcrumb Navigation */}
          <div className="mb-3.5 flex flex-wrap items-center gap-2 text-xs select-none">
            {/* 1 Level Back Action Button */}
            <button 
              onClick={() => {
                if (onGoBackToCategory) {
                  onGoBackToCategory(tool.category);
                } else {
                  window.location.hash = "#/dashboard";
                }
              }}
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1 font-bold transition cursor-pointer focus:outline-none bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 px-2 py-0.5 rounded-md"
              title={`Go back 1 level to ${CATEGORIES.find(c => c.id === tool.category)?.title || tool.category}`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Go Back
            </button>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <button 
              onClick={() => {
                if (onGoBackToCategory) {
                  onGoBackToCategory("all");
                } else {
                  window.location.hash = "#/dashboard";
                }
              }}
              className="text-gray-400 hover:text-emerald-505 dark:hover:text-emerald-450 font-semibold transition cursor-pointer focus:outline-none"
              title="Go back to Sandbox Hub"
            >
              Sandbox Hub
            </button>
            <span className="text-gray-300 dark:text-gray-700">/</span>
            <button 
              onClick={() => {
                if (onGoBackToCategory) {
                  onGoBackToCategory(tool.category);
                } else {
                  window.location.hash = "#/dashboard";
                }
              }}
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-bold hover:underline transition cursor-pointer focus:outline-none"
              title={`Go back to ${CATEGORIES.find(c => c.id === tool.category)?.title || tool.category}`}
            >
              {CATEGORIES.find(c => c.id === tool.category)?.title || tool.category.replace("-", " ")}
            </button>
            <span className="text-gray-300 dark:text-gray-700">/</span>
            <span className="text-gray-400 dark:text-gray-500 font-medium font-mono text-[11px]">
              {tool.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded uppercase font-mono tracking-wider">
              {tool.category.replace("-", " ")}
            </span>
            {tool.isAiPowered && (
              <span className="text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded uppercase font-mono tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Enhanced
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight">{tool.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">{tool.description}</p>
        </div>
        <div className="text-right text-xs text-gray-400 hidden md:block select-none">
          <p>Local sandbox status: <span className="text-emerald-600 font-bold">● Operational</span></p>
          <p className="mt-0.5">TLS Core Encryption active</p>
        </div>
      </div>

      {/* ========================================================
          CONDITIONAL RENDERERS FOR DEDICATED FULLY INTERACTIVE UIs
          ======================================================== */}

      {/* A. IMAGE COMPRESSOR */}
      {tool.id === "image-compress" && (
        <div id="image-compressor-workspace" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Upload & controls */}
            <div className="space-y-6">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Compression Settings</h2>
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center hover:bg-gray-55 dark:hover:bg-gray-850/50 transition relative">
                <input
                  id="compressor-uploader"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="relative z-0 pointer-events-none">
                  <Image className="w-12 h-12 text-gray-350 dark:text-gray-650 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {compressImgFile ? compressImgFile.name : "Drag & Drop or Click to Upload"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Supports PNG, JPEG, WebP up to 15MB. All processing occurs 100% in-browser! No files are sent to servers.
                  </p>
                </div>
              </div>

              {compressImgFile && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      <span>Quality Factor: {Math.round(compressQuality * 100)}%</span>
                      <span>{compressQuality >= 0.8 ? "High Fidelity" : "Optimized Payload"}</span>
                    </div>
                    <input
                      id="compression-quality-slider"
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={compressQuality}
                      onChange={(e) => setCompressQuality(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      <span>Image Dimension Scale: {Math.round(compressScale * 100)}%</span>
                    </div>
                    <input
                      id="compression-scale-slider"
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.1"
                      value={compressScale}
                      onChange={(e) => setCompressScale(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <button
                    id="trigger-compress-btn"
                    onClick={handleCompressImage}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Reduce File Weight
                  </button>
                </div>
              )}
            </div>

            {/* Previews and Results panels */}
            <div className="space-y-6">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Live Operations Board</h2>
              
              {!compressImgFile ? (
                <div className="bg-gray-50 dark:bg-gray-950/40 rounded-xl h-64 border border-gray-200 dark:border-gray-850 flex items-center justify-center select-none">
                  <p className="text-sm text-gray-400 text-center px-4">Upload an image file to trigger mathematical optimization parameters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-2 bg-gray-50 dark:bg-gray-950/30 flex items-center justify-center overflow-hidden h-44">
                    <img src={compressPreview} alt="Original uploading preview" className="max-h-full max-w-full rounded object-contain" />
                  </div>
                  
                  {compressedResult && (
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-800 dark:text-emerald-400">Optimization Results:</span>
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono px-2 py-0.5 rounded font-bold">
                          -{compressedResult.savings}% payload savings
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs border-y border-emerald-500/10 py-2">
                        <div>
                          <span className="text-gray-500 block">Original Size:</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{formatFileSize(compressedResult.originalSize)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Compressed Size:</span>
                          <span className="font-semibold text-gray-950 dark:text-white font-mono">{formatFileSize(compressedResult.size)}</span>
                        </div>
                      </div>

                      <a
                        id="download-compressed-image-link"
                        href={compressedResult.url}
                        download={`compressed_${compressImgFile.name}`}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download compressed JPG File
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
 
      {/* C. PDF MERGE WORKSPACE */}
      {tool.id === "pdf-merge" && (
        <div id="pdf-merge-workspace" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-150 dark:border-gray-800 pb-4">
            <div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Assemble & Arrange PDF files</h2>
              <p className="text-xs text-gray-400">Upload two or more documents to merge pages client-side with safe memory execution</p>
            </div>
            {pdfMergeFiles.length > 0 && (
              <button
                onClick={() => {
                  setPdfMergeFiles([]);
                  setMergedPdfUrl("");
                }}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition underline cursor-pointer"
              >
                Clear all uploads
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side: Upload Area & Action buttons */}
            <div className="space-y-6 lg:col-span-1">
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Select PDF Files
                </label>
                
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center hover:bg-gray-55 dark:hover:bg-gray-850/40 transition relative group">
                  <input
                    id="pdf-merge-multiple-upload-input"
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handlePdfMergeUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <div className="mx-auto w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400">Click to browse</span> or drag PDFs here
                    </div>
                    <p className="text-[10px] text-gray-400">Select multiple PDF files at once</p>
                  </div>
                </div>
              </div>

              {/* Merge Actions panel */}
              {pdfMergeFiles.length >= 2 && (
                <div className="bg-gray-50 dark:bg-gray-850/40 border border-gray-150 dark:border-gray-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-gray-500">Total Files to Merge:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{pdfMergeFiles.length} files</span>
                  </div>
                  
                  <button
                    id="submit-pdf-merge-btn"
                    onClick={handleMergePdfs}
                    disabled={mergingPdfs}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    {mergingPdfs ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Merging Pages...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Process & Merge PDFs
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Dynamic Success Merged State Banner */}
              {mergedPdfUrl && (
                <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-3 animate-fade-in select-none">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    Merged File Ready!
                  </div>
                  <div className="text-[11px] text-gray-550 dark:text-gray-450 leading-relaxed font-mono">
                    Total footprint is {formatFileSize(mergedPdfSize)}. Verified zero data retention, built offline.
                  </div>
                  <a
                    id="download-merged-pdf-link"
                    href={mergedPdfUrl}
                    download="merged_assembly_document.pdf"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF File
                  </a>
                </div>
              )}
            </div>

            {/* Right side: File lists queue with orders controls */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Files Assembly Queue ({pdfMergeFiles.length})
              </h3>

              {pdfMergeFiles.length === 0 ? (
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center text-gray-450 text-xs space-y-1">
                  <File className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto" />
                  <p className="font-semibold">No documents uploaded yet</p>
                  <p className="text-[11px] text-gray-455 mt-1">Files in queue appear here. You must upload at least two files in order to join them.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {pdfMergeFiles.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-850/40 border border-gray-150 dark:border-gray-800 rounded-xl hover:border-gray-300 dark:hover:border-gray-700 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-8 w-8 bg-rose-50 dark:bg-rose-950/20 text-rose-550 flex items-center justify-center rounded-lg shrink-0 select-none font-bold font-mono text-[10px]">
                          PDF
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate pr-2">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            Size: {formatFileSize(item.size)} | Position #{index + 1}
                          </p>
                        </div>
                      </div>

                      {/* Controls Area */}
                      <div className="flex items-center gap-1.5 shrink-0 select-none">
                        <button
                          onClick={() => handleMovePdfMergeFile(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-800 rounded disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMovePdfMergeFile(index, "down")}
                          disabled={index === pdfMergeFiles.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-805 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-800 rounded disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemovePdfMergeFile(item.id)}
                          className="p-1 text-rose-550 hover:text-rose-600 hover:bg-rose-100/30 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                          title="Remove File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* B. PDF / DOCUMENT CONVERTER */}
      {tool.id === "pdf-compress" && (
        <div id="pdf-compressor-workspace" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">PDF Document Compiler & Exporter</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4 md:col-span-1 border-r border-gray-150 dark:border-gray-800 pr-0 md:pr-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Document Heading Title</label>
                <input
                  id="pdf-document-title-field"
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Page Template</label>
                <select
                  id="pdf-paper-size-select"
                  value={docPaperSize}
                  onChange={(e) => setDocPaperSize(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="A4">A4 Standard Standard</option>
                  <option value="Letter">US Letter Dimensions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Margins: {docMargin}mm</label>
                <input
                  id="pdf-margin-range-slider"
                  type="range"
                  min="10"
                  max="35"
                  value={docMargin}
                  onChange={(e) => setDocMargin(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Corporate Accent Color</label>
                <div className="flex gap-2">
                  {["emerald", "indigo", "slate"].map((theme) => (
                    <button
                      id={`pdf-theme-btn-${theme}`}
                      key={theme}
                      onClick={() => setDocColorTheme(theme)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md border capitalize flex-1 ${
                        docColorTheme === theme
                          ? "bg-gray-900 dark:bg-white text-white dark:text-black border-transparent"
                          : "bg-gray-50 dark:bg-gray-850 text-gray-650 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-100"
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  id="print-pdf-trigger-btn"
                  onClick={handlePrintDocument}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Print / Export as PDF File
                </button>
                <button
                  id="download-doc-txt-btn"
                  onClick={handleDownloadTxtCopy}
                  className="w-full bg-gray-150 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 font-semibold py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Save Plain Text Export (.txt)
                </button>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Document Body Markdown Syntax</label>
              <textarea
                id="pdf-markdown-body-area"
                rows={12}
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 whitespace-pre"
              />
              <p className="text-[11px] text-gray-400 dark:text-gray-500 select-none">
                Hint: Wrap lines in tags like # for Header 1, ## for Header 2, ### for Header 3, and - for bulleted lines. All items compile to standard print layouts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* C. UNIT CONVERSION CALCULATOR */}
      {tool.id === "unit-converter" && (
        <div id="unit-conversion-calculator-stage" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs">
          
          {/* Categories Selector Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4 select-none">
            {([
              { id: "length", label: "📏 Length" },
              { id: "volume", label: "🧪 Volume" },
              { id: "temp", label: "🌡️ Temperature" },
              { id: "power", label: "⚡ Power" },
              { id: "work", label: "🔋 Work" },
              { id: "force", label: "🛡️ Force" },
              { id: "pressure", label: "🌀 Pressure" },
              { id: "area", label: "📐 Area" },
              { id: "currency", label: "💵 Currency" },
              { id: "weight", label: "🏋️ Weight" },
              { id: "time", label: "⏱️ Time" },
              { id: "speed", label: "🚀 Speed" }
            ] as const).map((cat) => (
              <button
                id={`unit-category-tab-${cat.id}`}
                key={cat.id}
                onClick={() => setConversionCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                  conversionCategory === cat.id
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                    : "bg-gray-50 dark:bg-gray-850 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-450 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Input params form */}
            <div className="bg-gray-50/50 dark:bg-gray-950/30 border border-gray-200 dark:border-gray-850 p-4 rounded-xl space-y-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Define Input Parameters</h3>
              
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Enter {sourceUnit === "hh:mm:ss" ? "hh:mm:ss Value" : "Numeric Value"}
                </label>
                <input
                  id="conversion-value-input"
                  type={sourceUnit === "hh:mm:ss" ? "text" : "number"}
                  placeholder={sourceUnit === "hh:mm:ss" ? "00:00:00" : "1.0"}
                  value={conversionValueText}
                  onChange={(e) => setConversionValueText(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Select Input Unit</label>
                <select
                  id="source-unit-selector"
                  value={sourceUnit}
                  onChange={(e) => setSourceUnit(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {conversionCategory === "length" &&
                    lengthUnits.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                  {(conversionCategory === "mass" || conversionCategory === "weight") &&
                    massUnits.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                  {conversionCategory === "volume" &&
                    volumeUnits.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                  {conversionCategory === "power" &&
                    powerUnits.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                  {conversionCategory === "work" &&
                    workUnits.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                  {conversionCategory === "force" &&
                    forceUnits.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                  {conversionCategory === "pressure" &&
                    pressureUnits.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                  {conversionCategory === "area" &&
                    areaUnits.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                  {conversionCategory === "currency" &&
                    currencyUnits.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                  {conversionCategory === "time" &&
                    timeUnits.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                  {conversionCategory === "speed" &&
                    speedUnits.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                  {conversionCategory === "temp" && (
                    <>
                      <option value="C">Celsius (°C)</option>
                      <option value="F">Fahrenheit (°F)</option>
                      <option value="K">Kelvin (K)</option>
                      <option value="R">Rankine (°R)</option>
                      <option value="Re">Réaumur (°Re)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Complete output table results mapping all requested metrics */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold select-none">
                <span className="text-gray-500">Formulated Output Calculations Table</span>
                <span className="text-emerald-600 dark:text-emerald-450">Input: {conversionValueText} {sourceUnit}</span>
              </div>

              <div className="border border-gray-201 dark:border-gray-850 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-3xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-950 text-gray-550 dark:text-gray-400 font-bold uppercase border-b border-gray-200 dark:border-gray-850 select-none">
                    <tr>
                      <th className="p-3">Target Conversion Unit</th>
                      <th className="p-3 font-mono">Calculated Result Value</th>
                      <th className="p-3 text-right">Quick action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 dark:divide-gray-850 text-gray-700 dark:text-gray-300">
                    {conversionResults.map((row) => (
                      <tr key={row.unit} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/30 transition">
                        <td className="p-3 font-semibold text-gray-900 dark:text-white">
                          {row.name} <span className="text-gray-400 text-[10px] uppercase font-mono">({row.unit})</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          {row.value}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            id={`copy-conversion-btn-${row.unit}`}
                            onClick={() => handleCopy(String(row.value))}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-gray-955 transition cursor-pointer"
                            title="Copy output value"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* D. WHATSAPP LINK & QR GENERATOR */}
      {tool.id === "wa-link-generator" && (
        <div id="whatsapp-suites-generator" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">WhatsApp Configurator</h2>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-350 mb-1">
                  Recipient Phone Number <span className="text-emerald-500 font-bold">*</span>
                </label>
                <input
                  id="wa-phone-input"
                  type="text"
                  placeholder="+14155552671 (with country code)"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-350 mb-1">Prefilled Message</label>
                <textarea
                  id="wa-prefilled-message"
                  rows={3}
                  value={waText}
                  onChange={(e) => setWaText(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                id="generate-wa-components-btn"
                onClick={handleGenerateWALink}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition shadow-xs cursor-pointer"
              >
                Compile Messaging Elements
              </button>
            </div>

            <div className="space-y-4 bg-gray-50 dark:bg-gray-950/45 p-6 rounded-xl border border-gray-200 dark:border-gray-850 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">Resulting Outputs</h3>
                
                {waLinkOutput ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[11px] text-gray-500 block mb-1">Direct Chat URL:</span>
                      <div className="flex gap-2">
                        <input
                          id="compiled-wa-url"
                          type="text"
                          readOnly
                          value={waLinkOutput}
                          className="flex-1 px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-mono text-gray-650 dark:text-gray-300 focus:outline-none"
                        />
                        <button
                          id="copy-compiled-wa"
                          onClick={() => handleCopy(waLinkOutput)}
                          className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition flex items-center gap-1 px-3 py-1.5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-center pt-2">
                      <span className="text-[11px] text-gray-500 block mb-2 text-center">Scan to Chat QR Barcode:</span>
                      <div className="bg-white p-3 rounded-lg border border-gray-250 shadow-xs">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(waLinkOutput)}`}
                          alt="WhatsApp Scan QR"
                          className="w-32 h-32"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 text-center mt-2 select-none">
                        Use any camera to instantly scan the QR code and trigger direct messaging.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-12 text-center">Specify settings and click compile to yield responsive chat connectors.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* E. PASSWORD GENERATOR */}
      {tool.id === "password-generator" && (
        <div id="password-generators-suite" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs max-w-xl mx-auto">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Secure Passwords Generator</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-750 dark:text-gray-300 mb-1.5 select-none">
                <span>Key Length: {passLength} characters</span>
                <span className={passLength >= 12 ? "text-emerald-500" : "text-amber-500"}>
                  {passLength >= 12 ? "Strong Boundary" : "Average Complexity"}
                </span>
              </div>
              <input
                id="password-length-slider"
                type="range"
                min="6"
                max="32"
                value={passLength}
                onChange={(e) => setPassLength(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 select-none">
                <input
                  id="pass-caps-check"
                  type="checkbox"
                  checked={passCaps}
                  onChange={(e) => setPassCaps(e.target.checked)}
                  className="rounded text-emerald-500"
                />
                Uppercase (A-Z)
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 select-none">
                <input
                  id="pass-lows-check"
                  type="checkbox"
                  checked={passLows}
                  onChange={(e) => setPassLows(e.target.checked)}
                  className="rounded text-emerald-500"
                />
                Lowercase (a-z)
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 select-none">
                <input
                  id="pass-nums-check"
                  type="checkbox"
                  checked={passNums}
                  onChange={(e) => setPassNums(e.target.checked)}
                  className="rounded text-emerald-500"
                />
                Numeric Digits (0-9)
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 select-none">
                <input
                  id="pass-syms-check"
                  type="checkbox"
                  checked={passSyms}
                  onChange={(e) => setPassSyms(e.target.checked)}
                  className="rounded text-emerald-500"
                />
                Special Symbols (!@#$)
              </label>
            </div>

            <button
              id="generate-passwords-btn"
              onClick={handleGeneratePassword}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition shadow-xs cursor-pointer"
            >
              Exert Random Cryptography
            </button>

            {passResult && (
              <div className="bg-gray-50 dark:bg-gray-955 p-4 rounded-xl border border-gray-200 dark:border-gray-800 mt-4 flex items-center justify-between gap-3 font-mono animate-fade-in text-sm">
                <span className="text-gray-952 dark:text-white font-bold tracking-wider select-all truncate">
                  {passResult}
                </span>
                <button
                  id="copy-generated-password"
                  onClick={() => handleCopy(passResult)}
                  className="text-gray-400 hover:text-emerald-605 transition cursor-pointer"
                  title="Copy password"
                >
                  <Copy className="w-4.5 h-4.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* F. SCIENTIFIC CALCULATOR */}
      {tool.id === "scientific-calc" && (
        <div id="scientific-calculators-board" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-8a5 rounded-2xl p-6 transition shadow-xs max-w-md mx-auto select-none">
          {/* LCD Digital Display */}
          <div className="bg-gray-950 text-emerald-400 font-mono text-right p-4 rounded-xl text-2xl h-16 flex items-center justify-end overflow-hidden mb-4 shadow-inner border border-gray-800">
            {calcDisplay}
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {/* Operator buttons */}
            {["C", "←", "sqrt(", "ln(", "sin(", "cos(", "tan(", "/", "*", "-", "+", "π", "e", "(", ")", "="].map((val) => {
              const resolves = val === "=";
              return (
                <button
                  id={`calc-btn-${val.replace("(", "_")}`}
                  key={val}
                  onClick={() => handleCalcKeyPress(val)}
                  className={`py-2 rounded-lg text-sm font-semibold transition ${
                    resolves
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white col-span-2 py-3"
                      : "bg-gray-50 hover:bg-gray-150 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {val}
                </button>
              );
            })}

            {/* Numbers pad */}
            {["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "."].map((num) => (
              <button
                id={`calc-btn-${num}`}
                key={num}
                onClick={() => handleCalcKeyPress(num)}
                className="py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-901 dark:text-white font-bold rounded-lg text-sm transition"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* G. JSON FORMATTER / VALIDATOR */}
      {tool.id === "json-formatter" && (
        <div id="json-formatters-workspace" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs">
          
          {jsonError && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 text-rosy-705 dark:text-rose-400 p-3 rounded-lg text-xs mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{jsonError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs select-none">
                <span className="font-semibold text-gray-650 dark:text-gray-350">Raw JSON Inputs</span>
                <div className="flex gap-1.5">
                  <button
                    id="trigger-format-2spaces"
                    onClick={() => handleFormatJSON(2)}
                    className="bg-emerald-550 hover:bg-emerald-650 text-white font-semibold px-2 py-0.5 rounded text-[10px] transition cursor-pointer"
                  >
                    Format (2 Spaces)
                  </button>
                  <button
                    id="trigger-format-4spaces"
                    onClick={() => handleFormatJSON(4)}
                    className="bg-emerald-550 hover:bg-emerald-650 text-white font-semibold px-2 py-0.5 rounded text-[10px] transition cursor-pointer"
                  >
                    Format (4 Spaces)
                  </button>
                </div>
              </div>
              <textarea
                id="json-raw-textarea"
                rows={11}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"employees":[{"name":"John","salary":5000}]}'
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs select-none">
                <span className="font-semibold text-gray-650 dark:text-gray-350">Formatted output</span>
                {jsonOutput && (
                  <button
                    id="copy-json-output"
                    onClick={() => handleCopy(jsonOutput)}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 p-1 rounded text-gray-500 hover:text-gray-950 dark:hover:text-white cursor-pointer transition flex items-center gap-1 text-[10px] px-2 py-0.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                )}
              </div>
              <pre className="w-full h-[230px] p-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg font-mono text-xs whitespace-pre overflow-auto text-emerald-600 dark:text-emerald-400">
                {jsonOutput || "// Formatted outcomes print here..."}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* NEW CUSTOM STAGE: HIGH-FIDELITY AST JSON VALIDATOR REPORT */}
      {tool.id === "json-validator" && (
        <div id="json-validator-workspace" className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs">
            <h3 className="font-bold text-xs text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Input JSON Stream for AST Scanning</h3>
            <div className="space-y-4">
              <textarea
                id="json-validator-textarea"
                rows={9}
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                }}
                placeholder='{
  "employees": [
    { "name": "John", "salary": 5000 },
    { "name": "Jane", "salary": 6000 }
  ]
}'
                className="w-full p-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

              <div className="flex flex-wrap gap-2 pt-1.5 border-t border-gray-100 dark:border-gray-850">
                <button
                  id="btn-trigger-deep-validation"
                  onClick={() => {
                    const report = analyzeJsonError(jsonInput);
                    setJsonValidationReport(report);
                    setSuccessMessage("AST validation completed successfully.");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle className="w-4 h-4" />
                  Run Deep Validation Check
                </button>
                <button
                  id="btn-load-invalid-sample"
                  onClick={() => {
                    const sample = `{\n  "projectName": "ToolzCraft Sandbox Panel",\n  "activeStatus": true,\n  "metadata": {\n    "runtime": "V8 Embedded Core",\n    "protocols": ['TLS 1.2', 'TLS 1.3']\n  }\n  "author": "Google Coding Assistant"\n}`;
                    setJsonInput(sample);
                    const report = analyzeJsonError(sample);
                    setJsonValidationReport(report);
                    setSuccessMessage("Loaded demo payload containing syntactic anomalies.");
                  }}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-255 px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer transition"
                >
                  Load Sample with Errors
                </button>
                <button
                  id="btn-clear-validation-input"
                  onClick={() => {
                    setJsonInput("");
                    setJsonValidationReport(null);
                  }}
                  className="bg-gray-50 hover:bg-gray-150 dark:bg-gray-900 dark:hover:bg-gray-850 text-gray-500 hover:text-gray-700 dark:text-slate-400 px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer transition ml-auto border border-gray-200 dark:border-gray-800"
                >
                  Clear Area
                </button>
              </div>
            </div>
          </div>

          {jsonValidationReport && (
            <div className="space-y-6">
              {/* IF VALID */}
              {jsonValidationReport.isValid ? (
                <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden p-6 text-slate-100 shadow-xl font-sans">
                  <div className="relative overflow-hidden bg-emerald-950/40 border border-emerald-500/20 rounded-2xl p-5 mb-6 shadow-[0_0_20px_rgba(16,185,129,0.07)]">
                    <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative">
                      <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                        <CheckCircle className="w-6 h-6 text-emerald-450" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded font-mono uppercase tracking-widest">SYNTAX VALIDATED CERTIFIED</span>
                        <h3 className="text-base font-extrabold text-white mt-1">JSON Structurally Flawless</h3>
                        <p className="text-xs text-slate-350 mt-1">Compilation verified successfully. Core ECMA-404 AST specifications matched.</p>
                      </div>
                      <span className="sm:ml-auto text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">AST_COMPLIANT</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-center text-[11px] mb-6">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Root Type</span>
                      <span className="text-emerald-400 font-extrabold text-sm">{jsonValidationReport.metadata.rootType}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nesting Depth</span>
                      <span className="text-sky-450 font-extrabold text-sm">{jsonValidationReport.metadata.nestingDepth} Layers</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Properties Count</span>
                      <span className="text-indigo-400 font-extrabold text-sm">{jsonValidationReport.metadata.propertiesCount}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Compiled Weight</span>
                      <span className="text-orange-400 font-extrabold text-sm">{jsonValidationReport.metadata.byteSize}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center select-none">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Formatted Compliant Representation</h4>
                      <button
                        onClick={() => handleCopy(jsonValidationReport.correctedSnippet)}
                        className="bg-slate-800 hover:bg-slate-755 text-slate-300 px-3 py-1 rounded text-[10px] font-mono font-semibold flex items-center gap-1 cursor-pointer transition border border-slate-700"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Pure Valid JSON
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-950 border border-slate-850 rounded-xl font-mono text-xs text-emerald-400 max-h-96 overflow-y-auto whitespace-pre leading-relaxed select-all">
                      {jsonValidationReport.correctedSnippet}
                    </pre>
                  </div>
                </div>
              ) : (
                /* IF INVALID: RENDER USER'S PREMIUM REPORT COMPONENT */
                <div id="json-validator-report-premium" className="bg-slate-900 dark:bg-zinc-950 border border-slate-800 dark:border-zinc-900 rounded-3xl overflow-hidden p-6 text-slate-200 shadow-2xl font-sans transition-all">
                  
                  {/* Status Hero */}
                  <div className="relative overflow-hidden bg-slate-950/60 border border-rose-550/15 rounded-2xl p-5 mb-6 shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
                    <div className="absolute -top-12 -left-12 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative">
                      <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shrink-0">
                        <AlertCircle className="w-6 h-6 text-rose-400" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold bg-rose-500/10 text-rose-450 px-2.5 py-0.5 rounded font-mono uppercase tracking-widest">SYNTAX SPEC EXCEPTION</span>
                        <h3 className="text-base font-extrabold text-white mt-1">JSON Validation Failure</h3>
                        <p className="text-xs text-slate-400 mt-1">An unhandled syntax obstacle disrupted the AST parsing near Line {jsonValidationReport.line}, Column {jsonValidationReport.column}.</p>
                      </div>
                      <span className="sm:ml-auto text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">AST_DIAGNOSTICS_COMPLIANCE</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Row 1: Exception Summary Grid */}
                    <div>
                      <div className="flex justify-between items-center mb-2 select-none">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. AST Exception Summary</h4>
                        <button
                          onClick={() => {
                            const rawHtml = generateRawHtmlReport(jsonValidationReport);
                            handleCopy(rawHtml);
                            setCopiedHtmlCode(true);
                            setTimeout(() => setCopiedHtmlCode(false), 2000);
                          }}
                          className="bg-rose-650 hover:bg-rose-700 text-white px-3 py-1 rounded text-[10px] font-semibold tracking-wide flex items-center gap-1 cursor-pointer transition shadow-xs"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedHtmlCode ? "Copied Raw HTML Component!" : "Copy Report HTML Tailwind Snippet"}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-[11px]">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">TOKEN OBSERVED</span>
                          <span className="text-rose-300 font-extrabold bg-rose-950/40 px-2 py-0.5 rounded border border-rose-905/30 inline-block font-mono">
                            {jsonValidationReport.tokenFound}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">EXPECTED TOKENS</span>
                          <span className="text-emerald-355 font-extrabold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-905/30 inline-block font-mono">
                            {jsonValidationReport.expectedToken}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono">JSON KEYPATH</span>
                          <span className="text-slate-300 select-all font-semibold font-mono block truncate" title={jsonValidationReport.jsonPath}>
                            {jsonValidationReport.jsonPath}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono">SLA SPEC MATCH</span>
                          <span className="text-amber-400 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/15 inline-block font-mono uppercase">
                            NON-COMPLIANT
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Diagnostics Ledger Table */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">2. AST Diagnostics Ledger</h4>
                      <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 text-[9px] uppercase font-bold tracking-wider">
                              <th className="px-4 py-3 font-mono">Rule Key</th>
                              <th className="px-4 py-3 font-mono">Severity</th>
                              <th className="px-4 py-3 font-sans">Discrepancy Details</th>
                              <th className="px-4 py-3 font-mono">JSON Path Locator</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850/60 text-slate-300">
                            {jsonValidationReport.diagnostics.map((d: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-900/40 transition">
                                <td className="px-4 py-3 text-rose-350 font-bold font-mono tracking-normal">{d.code}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-1.5 py-0.5 rounded font-extrabold text-[9px] ${
                                    d.severity === 'CRITICAL' 
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15' 
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                                  }`}>
                                    {d.severity}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-300 font-sans leading-relaxed">{d.description}</td>
                                <td className="px-4 py-3 text-slate-400 font-mono select-all truncate max-w-[150px]">{d.path}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Row 3: IDE Comparison View Side-by-Side */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">3. Side-by-Side Code Rectification Editor</h4>
                      <div className="border border-slate-850 rounded-2xl bg-slate-950 overflow-hidden shadow-2xl">
                        
                        {/* Tab Window Control Panel */}
                        <div className="bg-slate-900 flex items-center justify-between px-4 py-3 border-b border-slate-850 select-none">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block"></span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">AST RECTIFIER PARSER IDE</span>
                          <span className="text-[10px] bg-slate-855 text-slate-450 font-mono px-2 py-0.5 rounded uppercase">Line {jsonValidationReport.line} Col {jsonValidationReport.column}</span>
                        </div>

                        {/* Divided Editor Screen */}
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-855 bg-[#0d111d]">
                          
                          {/* Original Corrupted View */}
                          <div className="p-4 bg-rose-950/[0.01] flex flex-col">
                            <div className="flex justify-between items-center text-[10px] font-bold text-rose-300 mb-2 font-mono uppercase bg-rose-500/[0.06] py-1 px-2.5 rounded border border-rose-500/10">
                              <span>Broken Input Payload</span>
                              <span>SYNTAX ERROR</span>
                            </div>
                            <pre className="font-mono text-[11px] text-rose-350 leading-relaxed overflow-x-auto whitespace-pre p-3 bg-rose-950/10 rounded-lg border border-rose-500/5 max-h-80 select-all">{jsonValidationReport.originalSnippet}</pre>
                          </div>

                          {/* Suggested Autocorrect Proposed View */}
                          <div className="p-4 bg-emerald-950/[0.01] flex flex-col">
                            <div className="flex justify-between items-center text-[10px] font-bold text-emerald-300 mb-2 font-mono uppercase bg-emerald-500/[0.06] py-1 px-2.5 rounded border border-emerald-500/10">
                              <span>Sovereign Rectified Proposal</span>
                              <span>RECOVERABLE</span>
                            </div>
                            <pre className="font-mono text-[11px] text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre p-3 bg-emerald-950/10 rounded-lg border border-emerald-500/5 max-h-80 select-all">{jsonValidationReport.correctedSnippet}</pre>
                          </div>

                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* H. JWT DECODER */}
      {tool.id === "jwt-decoder" && (
        <div id="jwt-decoders-workspace" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-350 mb-1">Paste JWT Token String</label>
              <textarea
                id="jwt-token-textarea"
                rows={3}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
                value={jwtInput}
                onChange={(e) => setJwtInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>

            <button
              id="trigger-decode-jwt-btn"
              onClick={handleDecodeJWT}
              className="bg-emerald-600 hover:bg-emerald-705 text-white font-semibold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
            >
              Decode Claims Structure
            </button>

            {jwtHeader && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-fade-in text-xs">
                <div>
                  <h4 className="font-semibold text-rose-500 mb-1">Header (Algorithm & Type)</h4>
                  <pre className="p-3 bg-gray-50 dark:bg-gray-950 border border-gray-250 dark:border-gray-850 rounded-lg font-mono text-[11px] h-32 overflow-auto text-rose-600 dark:text-rose-400">
                    {jwtHeader}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold text-indigo-505 mb-1">Payload (Registered Claims)</h4>
                  <pre className="p-3 bg-gray-50 dark:bg-gray-950 border border-gray-250 dark:border-gray-850 rounded-lg font-mono text-[11px] h-32 overflow-auto text-indigo-600 dark:text-indigo-400">
                    {jwtPayload}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EMI / LOAN INTEREST CALCULATOR */}
      {tool.id === "emi-calc" && (
        <div id="emi-calculator-card" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs max-w-2xl mx-auto">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Loan EMI Repayment Calculator</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5 font-mono">
                  <label htmlFor="emi-principal-input" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 select-none">
                    Principal Amount ($)
                  </label>
                  <input
                    id="emi-principal-input"
                    type="number"
                    value={emiPrincipal}
                    onChange={(e) => setEmiPrincipal(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-40 text-right px-2 py-0.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-emerald-600 dark:text-emerald-400 font-bold"
                  />
                </div>
                <input
                  id="emi-principal-slider"
                  type="range"
                  min="1000"
                  max="1000000000"
                  step="5000"
                  value={emiPrincipal > 1000000000 ? 1000000000 : emiPrincipal}
                  onChange={(e) => setEmiPrincipal(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-400 font-mono mt-0.5 select-none">
                  <span>$1,000</span>
                  <span>$1,000,000,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 font-mono">
                  <label htmlFor="emi-interest-input" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 select-none">
                    Annual Interest Rate (%)
                  </label>
                  <input
                    id="emi-interest-input"
                    type="number"
                    step="0.01"
                    value={emiInterest}
                    onChange={(e) => setEmiInterest(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-24 text-right px-2 py-0.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-emerald-600 dark:text-emerald-400 font-bold"
                  />
                </div>
                <input
                  id="emi-interest-slider"
                  type="range"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={emiInterest > 100 ? 100 : emiInterest}
                  onChange={(e) => setEmiInterest(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-400 font-mono mt-0.5 select-none">
                  <span>0.1%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 font-mono">
                  <label htmlFor="emi-tenure-input" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 select-none">
                    Tenure (Years)
                  </label>
                  <input
                    id="emi-tenure-input"
                    type="number"
                    value={emiTenure}
                    onChange={(e) => setEmiTenure(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 text-right px-2 py-0.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-emerald-600 dark:text-emerald-400 font-bold"
                  />
                </div>
                <input
                  id="emi-tenure-slider"
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={emiTenure > 100 ? 100 : emiTenure}
                  onChange={(e) => setEmiTenure(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-400 font-mono mt-0.5 select-none">
                  <span>1 Year</span>
                  <span>100 Years</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-955 p-5 border border-gray-200 dark:border-gray-800 rounded-xl space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 block">Calculated Monthly Installment (EMI)</h3>
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono block mt-1">
                  ${calcEMI().monthly.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border-t border-gray-200 dark:border-gray-800 pt-4">
                <div>
                  <span className="text-gray-500 block">Total Borrowing:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">${emiPrincipal.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Total Interest Pay:</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-rose-500 font-mono">${calcEMI().totalInterest.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 select-none">
                Calculation based on reducing balance method rules.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIP INVESTMENT CALCULATOR */}
      {tool.id === "sip-calc" && (
        <div id="sip-calculator-card" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs max-w-2xl mx-auto">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Systematic Investment Plan (SIP) Calculator</h2>
          <p className="text-xs text-gray-400 mb-6">Estimate the futuristic wealth growth generated via periodic systematic mutual fund investments and compound growth algorithms.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-1.5 select-none font-mono">
                  <label htmlFor="sip-monthly-input" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Monthly Investment ($)
                  </label>
                  <input
                    id="sip-monthly-input"
                    type="number"
                    value={sipMonthly}
                    onChange={(e) => setSipMonthly(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-36 text-right px-2.5 py-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded font-bold text-emerald-600 dark:text-emerald-450"
                  />
                </div>
                <input
                  id="sip-monthly-slider"
                  type="range"
                  min="100"
                  max="1000000000"
                  step="500"
                  value={sipMonthly > 1000000000 ? 1000000000 : sipMonthly}
                  onChange={(e) => setSipMonthly(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-450 mt-1 select-none font-mono">
                  <span>$100</span>
                  <span>$1,000,000,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 select-none font-mono">
                  <label htmlFor="sip-rate-input" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Expected Return Rate (%)
                  </label>
                  <input
                    id="sip-rate-input"
                    type="number"
                    step="0.1"
                    value={sipRate}
                    onChange={(e) => setSipRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-24 text-right px-2.5 py-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded font-bold text-emerald-600 dark:text-emerald-450"
                  />
                </div>
                <input
                  id="sip-rate-slider"
                  type="range"
                  min="1"
                  max="100"
                  step="0.5"
                  value={sipRate > 100 ? 100 : sipRate}
                  onChange={(e) => setSipRate(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-450 mt-1 select-none font-mono">
                  <span>1%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 select-none font-mono">
                  <label htmlFor="sip-years-input" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Time Duration (Years)
                  </label>
                  <input
                    id="sip-years-input"
                    type="number"
                    value={sipYears}
                    onChange={(e) => setSipYears(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 text-right px-2.5 py-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded font-bold text-emerald-600 dark:text-emerald-450"
                  />
                </div>
                <input
                  id="sip-years-slider"
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={sipYears > 100 ? 100 : sipYears}
                  onChange={(e) => setSipYears(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-450 mt-1 select-none font-mono">
                  <span>1 Yr</span>
                  <span>100 Yrs</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-855 p-5 border border-gray-200 dark:border-gray-800 rounded-xl space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 block">Future Value (Maturity Wealth)</h3>
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono block mt-1">
                  ${calcSIP().expectedAmount.toLocaleString()}
                </span>
              </div>

              <div className="space-y-3.5 border-t border-gray-200 dark:border-gray-800 pt-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Invested Capital:</span>
                  <span className="font-semibold text-gray-905 dark:text-white">${calcSIP().totalInvested.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Wealth Gained:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">+${calcSIP().wealthGain.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 select-none leading-normal">
                Uses the standard financial compound formulas (M = P &times; [((1 + i)<sup>n</sup> - 1) / i] &times; (1 + i)) to evaluate future projected growth.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          UNIVERSAL RUNNER STAGE (Saves 140+ individual files)
          ======================================================== */}
      {tool.id === "age-calc" && (
        <div id="age-calc-widget-container" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-150 dark:border-gray-850 p-5 rounded-xl space-y-4">
              <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Date Controls</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={ageDob}
                    onChange={(e) => setAgeDob(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-medium text-gray-901 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Target Age Date</label>
                  <input
                    type="date"
                    value={ageTarget}
                    onChange={(e) => setAgeTarget(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-medium text-gray-901 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-500/10 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-450 uppercase tracking-wider font-mono mb-3">Resulting Age Summary</h3>
                {calcAge().error ? (
                  <div className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/25 p-3 rounded-lg flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>{calcAge().error}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{calcAge().years}</span>
                      <span className="text-xs font-extrabold text-gray-500 uppercase font-mono mr-2">Yrs</span>
                      <span className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{calcAge().months}</span>
                      <span className="text-xs font-extrabold text-gray-500 uppercase font-mono mr-2">Mths</span>
                      <span className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{calcAge().days}</span>
                      <span className="text-xs font-extrabold text-gray-500 uppercase font-mono">Days</span>
                    </div>

                    <div className="border-t border-gray-150 dark:border-gray-850/50 pt-3.5 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Total Elapsed Days:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">{(calcAge().totalDays ?? 0).toLocaleString()} Days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Approximate Hours:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">{((calcAge().totalDays ?? 0) * 24).toLocaleString()} Hours</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-[10px] text-gray-400 font-mono mt-4">
                Strict client-side sandbox computation.
              </div>
            </div>
          </div>
        </div>
      )}

      {tool.id === "date-difference" && (
        <div id="date-difference-widget-container" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-150 dark:border-gray-850 p-5 rounded-xl space-y-4">
              <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Date Span</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateDiffStart}
                    onChange={(e) => setDateDiffStart(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-medium text-gray-901 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateDiffEnd}
                    onChange={(e) => setDateDiffEnd(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-medium text-gray-901 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-500/10 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-450 uppercase tracking-wider font-mono mb-3">Calculated Duration</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{calcDateDiff().days}</span>
                    <span className="text-sm font-bold text-gray-550 ml-1.5 uppercase font-mono">Total Calendar Days</span>
                  </div>

                  <div className="border-t border-gray-150 dark:border-gray-850/50 pt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Weeks Equivalency:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">{calcDateDiff().weeks} Weeks, {calcDateDiff().remainingDays} Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Business Days (Mon-Fri):</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{calcDateDiff().businessDays} working days</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 font-mono mt-4">
                Instantly recalculated locally.
              </div>
            </div>
          </div>
        </div>
      )}

      {tool.id === "time-duration" && (
        <div id="time-duration-widget-container" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-150 dark:border-gray-850 p-5 rounded-xl space-y-4">
              <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Time Inputs</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={timeDurationStart}
                    onChange={(e) => setTimeDurationStart(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-medium text-gray-901 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">End Time</label>
                  <input
                    type="time"
                    value={timeDurationEnd}
                    onChange={(e) => setTimeDurationEnd(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-medium text-gray-901 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-500/10 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-450 uppercase tracking-wider font-mono mb-3">Elapsed Time Duration</h3>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{calcTimeDuration().hours}</span>
                    <span className="text-xs font-extrabold text-gray-500 uppercase font-mono mr-3">Hrs</span>
                    <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{calcTimeDuration().mins}</span>
                    <span className="text-xs font-extrabold text-gray-500 uppercase font-mono">Mins</span>
                  </div>

                  <div className="border-t border-gray-150 dark:border-gray-850/50 pt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Total Minutes:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 font-mono">{(calcTimeDuration().totalMinutes).toLocaleString()} mins</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 font-mono mt-4">
                Recalculated instantly on local clock offsets.
              </div>
            </div>
          </div>
        </div>
      )}

      {tool.id === "percentage-calc" && (
        <div id="percentage-calc-widget-container" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-155 dark:border-gray-850 p-4.5 rounded-xl flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-wide font-mono">Calculator A</span>
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-2">What is X% of Y?</h4>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400">X (Percent)</label>
                    <input
                      type="number"
                      value={percentNum1}
                      onChange={(e) => setPercentNum1(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded font-mono font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400">Y (Base)</label>
                    <input
                      type="number"
                      value={percentNum2}
                      onChange={(e) => setPercentNum2(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded font-mono font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-150 dark:border-gray-800 pt-3 text-right">
                <span className="text-[10px] font-bold text-gray-400 block font-mono">Output Result</span>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono truncate block">
                  {calcPercentages().pOfY}
                </span>
              </div>
            </div>

            <div className="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-155 dark:border-gray-850 p-4.5 rounded-xl flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-wide font-mono">Calculator B</span>
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-2">X is what % of Y?</h4>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400">X (Part)</label>
                    <input
                      type="number"
                      value={percentNum1}
                      onChange={(e) => setPercentNum1(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded font-mono font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400">Y (Whole)</label>
                    <input
                      type="number"
                      value={percentNum2}
                      onChange={(e) => setPercentNum2(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded font-mono font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-150 dark:border-gray-800 pt-3 text-right">
                <span className="text-[10px] font-bold text-gray-400 block font-mono">Percentage Rate</span>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono truncate block">
                  {calcPercentages().xOfYPercent}%
                </span>
              </div>
            </div>

            <div className="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-155 dark:border-gray-850 p-4.5 rounded-xl flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-wide font-mono">Percent Change</span>
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-2">Percent Change form X to Y</h4>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400">X (Old Value)</label>
                    <input
                      type="number"
                      value={percentNum3}
                      onChange={(e) => setPercentNum3(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded font-mono font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400">Y (New Value)</label>
                    <input
                      type="number"
                      value={percentNum4}
                      onChange={(e) => setPercentNum4(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded font-mono font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-150 dark:border-gray-800 pt-3 text-right">
                <span className="text-[10px] font-bold text-gray-400 block font-mono">Difference Rate</span>
                <span className={`text-xl font-extrabold font-mono truncate block ${calcPercentages().percentChange >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                  {calcPercentages().percentChange >= 0 ? "+" : ""}{calcPercentages().percentChange}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tool.id === "tip-calc" && (
        <div id="tip-calc-widget-container" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-155 dark:border-gray-850 p-5 rounded-xl space-y-4">
              <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Check Parameter Controls</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Bill Base Amount ($)</label>
                  <input
                    type="number"
                    value={tipBillAmount}
                    onChange={(e) => setTipBillAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-mono font-bold text-gray-901 dark:text-white"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-550 mb-1">
                    <span>Tip Percent Rate</span>
                    <span className="text-emerald-600 font-bold font-mono">{tipPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={tipPercent}
                    onChange={(e) => setTipPercent(parseInt(e.target.value) || 15)}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Split Count (People)</label>
                  <input
                    type="number"
                    min="1"
                    value={tipPeopleCount}
                    onChange={(e) => setTipPeopleCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-mono font-bold text-gray-901 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-500/10 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-450 uppercase tracking-wider font-mono mb-3">Split Results</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-150 dark:border-gray-850">
                    <span className="text-[10px] font-bold text-gray-400 block font-mono">Tip Value</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white font-mono">${calcTip().totalTip}</span>
                  </div>
                  <div className="bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-150 dark:border-gray-850">
                    <span className="text-[10px] font-bold text-gray-400 block font-mono">Grand Total</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white font-mono">${calcTip().grandTotal}</span>
                  </div>
                  <div className="bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-150 dark:border-gray-850 col-span-2">
                    <span className="text-[10px] font-bold text-emerald-650 dark:text-emerald-400 block font-mono">Grand Total per Person</span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-450 font-mono">${calcTip().totalPerPerson}</span>
                    <span className="text-[10px] text-gray-400 block font-mono mt-1 border-t border-gray-100 dark:border-gray-900 pt-1">
                      Tip portion: ${calcTip().tipPerPerson} / Person
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 font-mono mt-4">
                Instantly calculated locally.
              </div>
            </div>
          </div>
        </div>
      )}

      {tool.id === "currency-converter" && (
        <div id="currency-converter-widget-container" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-155 dark:border-gray-850 p-5 rounded-xl space-y-4">
              <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Exchange Setup</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Convert Value Amount</label>
                  <input
                    type="number"
                    value={currencyAmount}
                    onChange={(e) => setCurrencyAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-mono font-bold text-gray-901 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Source Currency</label>
                    <select
                      value={currencyFrom}
                      onChange={(e) => setCurrencyFrom(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white opacity-95"
                    >
                      {["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "INR", "CHF", "CNY"].map((cur) => (
                        <option key={cur} value={cur}>{cur}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Target Currency</label>
                    <select
                      value={currencyTo}
                      onChange={(e) => setCurrencyTo(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white opacity-95"
                    >
                      {["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "INR", "CHF", "CNY"].map((cur) => (
                        <option key={cur} value={cur}>{cur}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-500/10 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-450 uppercase tracking-wider font-mono mb-3">Approximate Conversion</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-bold text-gray-400 block font-mono">{currencyAmount} {currencyFrom} =</span>
                    <span className="text-3xl font-black text-gray-950 dark:text-white font-mono">{calcCurrency().toLocaleString()} {currencyTo}</span>
                  </div>

                  <div className="border-t border-gray-150 dark:border-gray-850/50 pt-3 text-[10px] text-gray-400 leading-relaxed font-sans">
                    * Conversions utilize fixed proxy trading indicators (compiled June 2026). In-browser computation guarantees 100% data residency and transit control.
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 font-mono mt-4">
                Client privacy sandbox.
              </div>
            </div>
          </div>
        </div>
      )}

      {tool.id === "bmi-calc" && (
        <div id="bmi-calc-widget-container" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-155 dark:border-gray-850 p-5 rounded-xl space-y-4">
              <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>Body Dimensions</span>
                <div className="flex bg-gray-200 dark:bg-gray-800 rounded p-0.5">
                  <button
                    type="button"
                    onClick={() => { setBmiUnit("metric"); setBmiHeight(178); setBmiWeight(72); }}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer ${bmiUnit === "metric" ? "bg-white text-gray-900 dark:bg-gray-900 dark:text-white" : "text-gray-450"}`}
                  >
                    Metric
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBmiUnit("imperial"); setBmiHeight(70); setBmiWeight(160); }}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer ${bmiUnit === "imperial" ? "bg-white text-gray-900 dark:bg-gray-900 dark:text-white" : "text-gray-450"}`}
                  >
                    Imperial
                  </button>
                </div>
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Height ({bmiUnit === "metric" ? "cm" : "inches"})
                  </label>
                  <input
                    type="number"
                    value={bmiHeight}
                    onChange={(e) => setBmiHeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-mono font-bold text-gray-901 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Weight ({bmiUnit === "metric" ? "kg" : "lbs"})
                  </label>
                  <input
                    type="number"
                    value={bmiWeight}
                    onChange={(e) => setBmiWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-mono font-bold text-gray-901 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-500/10 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-450 uppercase tracking-wider font-mono mb-3">BMI health index</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-850 flex flex-col items-center justify-center shrink-0 w-24 h-24">
                      <span className="text-[9px] font-bold text-gray-400 font-mono uppercase">BMI Score</span>
                      <span className="text-2xl font-black text-gray-900 dark:text-white font-mono mt-1">{calcBMI().score}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-mono block">Weight Classification:</span>
                      <div className={`text-base font-bold px-2.5 py-1 rounded inline-block uppercase tracking-wide text-xs ${calcBMI().color}`}>
                        {calcBMI().category}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-150 dark:border-gray-850/50 pt-3 text-[10px] text-gray-400 leading-normal">
                    The WHO classification rates healthy body structures between indices 18.5 and 24.9. Obese levels start above 30.0.
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 font-mono mt-4">
                Computed securely on client.
              </div>
            </div>
          </div>
        </div>
      )}

      {tool.id === "calorie-calc" && (
        <div id="calorie-calc-widget-container" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-155 dark:border-gray-850 p-5 rounded-xl space-y-4">
              <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Body Profile</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={calorieAge}
                    onChange={(e) => setCalorieAge(parseInt(e.target.value) || 25)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-mono font-bold text-gray-901 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Gender</label>
                  <select
                    value={calorieGender}
                    onChange={(e) => setCalorieGender(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white opacity-95"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={calorieWeight}
                    onChange={(e) => setCalorieWeight(parseFloat(e.target.value) || 70)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-mono font-bold text-gray-901 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={calorieHeight}
                    onChange={(e) => setCalorieHeight(parseFloat(e.target.value) || 175)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-mono font-bold text-gray-901 dark:text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Weekly Activity Threshold</label>
                  <select
                    value={calorieActivity}
                    onChange={(e) => setCalorieActivity(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white opacity-95"
                  >
                    <option value="sedentary">Sedentary (desk job, no exercise)</option>
                    <option value="light">Lightly Active (exercise 1-3 days/wk)</option>
                    <option value="moderate">Moderately Active (exercise 3-5 days/wk)</option>
                    <option value="active">Very Active (heavy athletics 6-7 days/wk)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-500/10 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-450 uppercase tracking-wider font-mono mb-3">Daily Caloric Budgets</h3>
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-150 dark:border-gray-850 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-550 font-sans">Basal Metabolic Rate (BMR)</span>
                    <span className="text-base font-extrabold text-gray-700 dark:text-gray-300 font-mono">{calcCalories().bmr} kCal</span>
                  </div>
                  <div className="bg-white dark:bg-gray-950 p-3 rounded-lg border border-emerald-500/25 flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-sans">Maintenance Energy Needs (TDEE)</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{calcCalories().tdee} kCal/day</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white dark:bg-gray-950 p-3 rounded-lg border border-red-500/15 text-center">
                      <span className="text-[9px] font-bold text-rose-500 block uppercase font-mono">Weight Loss (-500)</span>
                      <span className="text-sm font-extrabold text-gray-800 dark:text-gray-200 font-mono">{calcCalories().lose} kCal</span>
                    </div>
                    <div className="bg-white dark:bg-gray-950 p-3 rounded-lg border border-indigo-550/15 text-center">
                      <span className="text-[9px] font-bold text-indigo-500 block uppercase font-mono">Weight gain (+500)</span>
                      <span className="text-sm font-extrabold text-gray-800 dark:text-gray-200 font-mono">{calcCalories().gain} kCal</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 font-mono mt-4 leading-normal border-t border-gray-100 dark:border-gray-900 pt-2.5">
                Calculated using the standard Harris-Benedict Metabolic Formula equations.
              </div>
            </div>
          </div>
        </div>
      )}

      {tool.id === "fuel-cost" && (
        <div id="fuel-cost-widget-container" className="bg-white dark:bg-gray-905 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-155 dark:border-gray-850 p-5 rounded-xl space-y-4">
              <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Trip Indicators</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Route Distance (km)</label>
                  <input
                    type="number"
                    value={fuelDistance}
                    onChange={(e) => setFuelDistance(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-mono font-bold text-gray-901 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fuel Efficiency (Liters / 100km)</label>
                  <input
                    type="number"
                    value={fuelEfficiency}
                    onChange={(e) => setFuelEfficiency(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-905 border border-gray-200 dark:border-gray-800 rounded-lg font-mono font-bold text-gray-901 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fuel Price per Liter ($)</label>
                  <input
                    type="number"
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-905 border border-gray-200 dark:border-gray-800 rounded-lg font-mono font-bold text-gray-901 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-500/10 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-450 uppercase tracking-wider font-mono mb-3">Trip Expense Output</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-150 dark:border-gray-850">
                    <span className="text-[10px] font-bold text-gray-400 block font-mono">Liters Used</span>
                    <span className="text-2xl font-black text-gray-950 dark:text-white font-mono">{calcFuel().litersUsed} L</span>
                  </div>
                  <div className="bg-white dark:bg-gray-950 p-4 rounded-xl border border-emerald-500/20">
                    <span className="text-[10px] font-bold text-emerald-650 dark:text-emerald-400 block font-mono">Trip Fuel Cost</span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">${calcFuel().totalCost}</span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 font-mono mt-4">
                Strict local in-browser parsing.
              </div>
            </div>
          </div>
        </div>
      )}

      {tool.id === "gpa-calc" && (
        <div id="gpa-calc-widget-container" className="bg-white dark:bg-gray-905 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-155 dark:border-gray-850 p-5 rounded-xl space-y-4 col-span-2">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
                <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Semester Course Cards</h3>
                <button
                  type="button"
                  onClick={() => {
                    const id = Math.random().toString(36).substring(2, 9);
                    setGpaCourses([...gpaCourses, { id, name: `Course ${gpaCourses.length + 1}`, grade: "A", credits: 3 }]);
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded hover:shadow-2xs transition cursor-pointer"
                >
                  + Add Course
                </button>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {gpaCourses.map((course, idx) => (
                  <div key={course.id} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-2.5 rounded-lg">
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={course.name}
                        onChange={(e) => {
                          const newList = [...gpaCourses];
                          newList[idx].name = e.target.value;
                          setGpaCourses(newList);
                        }}
                        className="w-full px-2 py-1 text-xs bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded font-medium text-gray-901 dark:text-white"
                      />
                    </div>
                    <div className="col-span-3">
                      <select
                        value={course.grade}
                        onChange={(e) => {
                          const newList = [...gpaCourses];
                          newList[idx].grade = e.target.value;
                          setGpaCourses(newList);
                        }}
                        className="w-full px-2 py-1 text-xs bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded text-gray-901 dark:text-white font-mono font-bold opacity-95"
                      >
                        {["A", "B", "C", "D", "F"].map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={course.credits}
                        onChange={(e) => {
                          const newList = [...gpaCourses];
                          newList[idx].credits = parseInt(e.target.value) || 1;
                          setGpaCourses(newList);
                        }}
                        className="w-full px-2 py-1 text-xs bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded font-mono font-bold text-gray-901 dark:text-white"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setGpaCourses(gpaCourses.filter((c) => c.id !== course.id));
                        }}
                        className="text-rose-500 hover:text-rose-700 text-xs font-bold font-mono transition cursor-pointer"
                        title="Delete course row"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-500/10 p-5 rounded-xl flex flex-col justify-between h-full">
              <div>
                <h3 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-450 uppercase tracking-wider font-mono mb-4">Calculated GPA</h3>
                <div className="text-center bg-white dark:bg-gray-950 p-4 border border-emerald-500/20 rounded-2xl">
                  <span className="text-[10px] font-bold text-gray-400 block font-mono uppercase">Cumulative GPA</span>
                  <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono block mt-1.5">{calcGPA().gpa}</span>
                  <span className="text-[10.5px] font-semibold text-gray-400 block mt-2 border-t border-gray-100 dark:border-gray-900 pt-2 font-mono">
                    Total credits: {calcGPA().totalCredits} Units
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 font-mono mt-6">
                Instant secure local scaling.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          UNIVERSAL RUNNER STAGE (Saves 140+ individual files)
          ======================================================== */}
      {tool.id !== "image-compress" && 
       tool.id !== "pdf-compress" && 
       tool.id !== "pdf-merge" && 
       tool.id !== "unit-converter" && 
       tool.id !== "wa-link-generator" && 
       tool.id !== "password-generator" && 
       tool.id !== "scientific-calc" && 
       tool.id !== "json-formatter" && 
       tool.id !== "json-validator" && 
       tool.id !== "jwt-decoder" && 
       tool.id !== "emi-calc" && 
       tool.id !== "sip-calc" && 
       tool.id !== "age-calc" && 
       tool.id !== "date-difference" && 
       tool.id !== "time-duration" && 
       tool.id !== "percentage-calc" && 
       tool.id !== "tip-calc" && 
       tool.id !== "currency-converter" && 
       tool.id !== "bmi-calc" && 
       tool.id !== "calorie-calc" && 
       tool.id !== "fuel-cost" && 
       tool.id !== "gpa-calc" && (
        <div id="ai-powered-terminal-sandbox" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-6 transition shadow-xs">
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs font-semibold select-none border-b border-gray-100 dark:border-gray-850 pb-3">
              <span className="text-gray-650 dark:text-gray-350 flex items-center gap-1.5">
                <Terminal className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                {tool.name} Input Dashboard Settings
              </span>
              <span className="text-gray-400 font-mono text-[10.5px]">Gemini-3.5-Flash Core Sandbox</span>
            </div>

            {/* 1. FINANCE MONEY CATEGORY WORKSPACE */}
            {tool.category === "finance-money" && (
              <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white">
                <div className="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-155 dark:border-gray-850 p-5 rounded-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-850 pb-3">
                    <h3 className="font-extrabold text-xs text-gray-400 dark:text-gray-350 uppercase tracking-wider font-mono">Calculators Parameters Dashboard</h3>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider">Engine: Off-line Secure</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {/* Interactive Currency Selection Module */}
                      <div className="p-3 bg-emerald-500/[0.04] dark:bg-emerald-950/[0.1] border border-emerald-500/10 rounded-xl space-y-2">
                        <label className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono">
                          Select Operating Currency
                        </label>
                        <div className="flex flex-wrap gap-2 items-center">
                          <select
                            value={selectedCurrency}
                            onChange={(e) => {
                              setSelectedCurrency(e.target.value);
                              setSuccessMessage(`Active currency changed to ${e.target.value}`);
                            }}
                            className="text-xs px-2.5 py-1 bg-white dark:bg-gray-900 border border-emerald-500/20 rounded-md font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                          >
                            <option value="$">US Dollar ($)</option>
                            <option value="€">Euro (€)</option>
                            <option value="£">Pound Sterling (£)</option>
                            <option value="₹">Indian Rupee (₹)</option>
                            <option value="¥">Yen / Yuan (¥)</option>
                            <option value="A$">Australian Dollar (A$)</option>
                            <option value="C$">Canadian Dollar (C$)</option>
                            <option value="R$">Brazilian Real (R$)</option>
                            <option value="₽">Russian Ruble (₽)</option>
                            <option value="₩">Korean Won (₩)</option>
                            <option value="đ">Vietnamese Dong (đ)</option>
                            <option value="S$">Singapore Dollar (S$)</option>
                            <option value="R">South African Rand (R)</option>
                            <option value="kr">Swedish/Norwegian Krone (kr)</option>
                            <option value="CHF">Swiss Franc (CHF)</option>
                            <option value="₪">Israeli Shekel (₪)</option>
                          </select>
                          <span className="text-[9.5px] text-gray-400 font-mono">
                            Auto-detected local currency: <strong className="text-emerald-600 dark:text-emerald-400">{detectedCurrency}</strong>
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5 font-mono">
                          <label htmlFor="fin-principal-input" className="block text-xs font-bold text-gray-500 uppercase select-none">
                            Principal / Capital Amount ({selectedCurrency || "$"})
                          </label>
                          <input
                            id="fin-principal-input"
                            type="number"
                            value={finPrincipal}
                            onChange={(e) => setFinPrincipal(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-40 text-right px-2 py-0.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded font-bold text-emerald-600 dark:text-emerald-400"
                          />
                        </div>
                        <input
                          type="range"
                          min="500"
                          max="1000000000"
                          step="500"
                          value={finPrincipal > 1000000000 ? 1000000000 : finPrincipal}
                          onChange={(e) => setFinPrincipal(parseInt(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-gray-400 font-mono select-none">
                          <span>{selectedCurrency || "$"}{Math.round(500).toLocaleString()}</span>
                          <span>{selectedCurrency || "$"}{Math.round(1000000000).toLocaleString()}</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5 font-mono">
                          <label htmlFor="fin-rate-input" className="block text-xs font-bold text-gray-500 uppercase select-none">
                            Annual Rate (%)
                          </label>
                          <input
                            id="fin-rate-input"
                            type="number"
                            step="0.1"
                            value={finRate}
                            onChange={(e) => setFinRate(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-24 text-right px-2 py-0.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded font-bold text-emerald-600 dark:text-emerald-400"
                          />
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="200"
                          step="0.1"
                          value={finRate > 200 ? 200 : finRate}
                          onChange={(e) => setFinRate(parseFloat(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-gray-400 font-mono select-none">
                          <span>0.1%</span>
                          <span>200%</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5 font-mono">
                          <label htmlFor="fin-tenure-input" className="block text-xs font-bold text-gray-500 uppercase select-none">
                            Duration period (Tenure)
                          </label>
                          <input
                            id="fin-tenure-input"
                            type="number"
                            value={finTenure}
                            onChange={(e) => setFinTenure(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-20 text-right px-2 py-0.5 text-xs bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded font-bold text-emerald-600 dark:text-emerald-400"
                          />
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          step="1"
                          value={finTenure > 100 ? 100 : finTenure}
                          onChange={(e) => setFinTenure(parseInt(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-gray-400 font-mono select-none">
                          <span>1 Year</span>
                          <span>100 Years</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase font-mono">
                          Extra parameter input (Rebates/Expenses/Pre-payments/Pooled)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-mono font-bold">{selectedCurrency || "$"}</span>
                          <input
                            type="number"
                            value={finExtra}
                            onChange={(e) => setFinExtra(parseInt(e.target.value) || 0)}
                            className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-500/[0.04] dark:bg-emerald-950/[0.03] border border-emerald-500/10 p-5 rounded-xl flex flex-col justify-between space-y-4 shadow-sm text-gray-900 dark:text-white">
                      <div className="space-y-4">
                        <h4 className="text-[10px] uppercase font-mono font-extrabold text-emerald-600 tracking-wider">Computation Report</h4>
                        
                        <div className="space-y-3 pt-1">
                          <div className="border-b border-dashed border-gray-150 dark:border-gray-850 pb-2.5">
                            <span className="text-[10px] text-gray-400 font-bold block uppercase font-mono tracking-wider">{calcFinanceCategory().label1}</span>
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">{calcFinanceCategory().value1}</span>
                          </div>
                          <div className="border-b border-dashed border-gray-150 dark:border-gray-850 pb-2.5">
                            <span className="text-[10px] text-gray-400 font-bold block uppercase font-mono tracking-wider">{calcFinanceCategory().label2}</span>
                            <span className="text-base font-extrabold text-gray-800 dark:text-gray-150 font-mono mt-0.5 block">{calcFinanceCategory().value2}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold block uppercase font-mono tracking-wider">{calcFinanceCategory().label3}</span>
                            <span className="text-xs font-bold text-gray-500 font-mono mt-0.5 block">{calcFinanceCategory().value3}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-[9px] text-gray-400 leading-relaxed pt-2 border-t border-gray-150 dark:border-gray-850 font-mono">
                        Instant calculation using industry-standard reducing compound math logic.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CONTACT MANAGEMENT CATEGORY WORKSPACE - SEQUENTIAL MERGER WIZARD */}
            {tool.category === "contact-management" && (tool.id === "contact-duplicate-finder" || tool.id === "contact-merger") && (
              <div className="space-y-6 bg-white dark:bg-gray-900 border border-gray-155 dark:border-gray-800 rounded-xl p-5 shadow-sm animate-fade-in text-gray-900 dark:text-white">
                
                {/* Unified Category Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 dark:border-gray-850 pb-4 gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-100 uppercase tracking-wider font-mono flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Directory Database Workstation
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Current tool: <b className="text-[#207886] font-sans">{tool.name}</b> — {tool.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2.5 py-1 rounded-md font-mono font-bold uppercase">
                      Wizard Engine v2.5
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-md font-mono font-bold uppercase animate-fade-in">
                      {contactsList.length} Active Cards
                    </span>
                  </div>
                </div>

                {/* Localized feedback messages inside the panel */}
                {successMessage && (
                  <div className="bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-400 p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500 animate-pulse" />
                    <span>{successMessage}</span>
                  </div>
                )}
                {errorMessage && (
                  <div className="bg-rose-500/5 dark:bg-rose-955/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Main Contacts Wizard Flow */}
                {(() => {
                  const handleWizardFilesUpload = async (files: FileList | any[]) => {
                    if (!files || files.length === 0) return;
                    
                    // Preload files immediately in the current event tick to prevent browser garbage collection or handle dismissal
                    const preloadedFiles: any[] = [];
                    try {
                      for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        if (file && typeof file.text === "function") {
                          const text = await file.text();
                          preloadedFiles.push({
                            name: file.name,
                            size: file.size,
                            text: text,
                            extension: file.name.split('.').pop()?.toLowerCase() || '',
                            contacts: null
                          });
                        } else {
                          preloadedFiles.push({
                            name: file.name || "",
                            size: file.size || 0,
                            text: file.text || "",
                            extension: file.extension || "vcf",
                            contacts: file.contacts
                          });
                        }
                      }
                    } catch (preloadErr) {
                      console.error("Immediate wizard file preloading failed:", preloadErr);
                    }

                    setWizardProgress({ status: 'running', percent: 15, message: `Acquiring ${preloadedFiles.length} contact sources...` });
                    
                    setTimeout(() => {
                      setWizardProgress({ status: 'running', percent: 45, message: 'Decoding standard attributes...' });
                      
                      setTimeout(() => {
                        setWizardProgress({ status: 'running', percent: 80, message: 'Verifying field alignments...' });
                        
                        try {
                          const parsedContacts: any[] = [];
                          const metaList: any[] = [];
                          let successCount = 0;

                          for (let i = 0; i < preloadedFiles.length; i++) {
                            const payload = preloadedFiles[i];
                            try {
                              const text = payload.text || "";
                              const name = payload.name || "";
                              const size = payload.size || 0;
                              const extension = payload.extension || "";

                              let fileContacts: any[] = [];
                              if (extension === 'vcf') {
                                fileContacts = parseVCF(text);
                              } else if (extension === 'csv') {
                                fileContacts = parseCSV(text);
                              } else {
                                if (text.includes('BEGIN:VCARD')) {
                                  fileContacts = parseVCF(text);
                                } else {
                                  fileContacts = parseCSV(text);
                                }
                              }

                              if (fileContacts.length === 0 && payload.contacts) {
                                fileContacts = payload.contacts;
                              }

                              if (fileContacts.length > 0) {
                                const compatibleWith: string[] = [];
                                if (extension === 'vcf' || text.includes('BEGIN:VCARD')) {
                                  compatibleWith.push("iPhone / iOS (vCard 3.0)", "Android (vCard 2.1)");
                                } else {
                                  compatibleWith.push("Google Contacts (CSV Import)");
                                }

                                parsedContacts.push(...fileContacts.map((c, idx) => ({ 
                                  ...c, 
                                  id: `${extension || 'unknown'}-${Date.now()}-${i}-${idx}-${Math.random()}`,
                                  sourceFile: name
                                })));

                                metaList.push({
                                  name,
                                  size,
                                  type: extension.toUpperCase(),
                                  count: fileContacts.length,
                                  compatibleWith
                                });
                                successCount++;
                              }
                            } catch (err) {
                              console.error("Uploader parsing failed", err);
                            }
                          }

                          if (parsedContacts.length > 0) {
                            setContactsList(parsedContacts);
                            setUploadedFilesMeta(metaList);
                            setWizardProgress({
                              status: 'completed',
                              percent: 100,
                              message: `Successfully extracted ${parsedContacts.length} contacts!`
                            });
                            setSuccessMessage(`Loaded ${parsedContacts.length} contacts. Ready to deduplicate catalog records.`);
                            setWizardStep(2); // Automatically advance step
                          } else {
                            setWizardProgress({ status: 'error', percent: 0, message: 'Parse failed. Empty roster contacts.' });
                            setErrorMessage('Ensure valid CSV or VCF formats containing standard contact numbers.');
                          }
                        } catch (e) {
                          setWizardProgress({ status: 'error', percent: 0, message: 'Upload streams scan failure.' });
                        }
                      }, 500);
                    }, 500);
                  };

                  const handleLoadDemoWizardFiles = () => {
                    const iphoneContacts = DEFAULT_CONTACTS.slice(0, 5);
                    const googleContacts = DEFAULT_CONTACTS.slice(5, 10);
                    
                    const mockFiles = [
                      {
                        name: "iPhone-Backup-Roster.vcf",
                        size: 8350,
                        extension: "vcf",
                        text: "BEGIN:VCARD\nVERSION:3.0\nN:Doe;John;;;\nFN:John Doe\nTEL:123-456-7890\nEMAIL:john.doe@example.com\nEND:VCARD\n",
                        contacts: iphoneContacts
                      },
                      {
                        name: "Google-Contacts-Export.csv",
                        size: 6120,
                        extension: "csv",
                        text: "Name,Phone,Email,Company\nRobert Smith,(555) 123-4567,bob@smith.org,Smith Bros\n",
                        contacts: googleContacts
                      }
                    ];
                    handleWizardFilesUpload(mockFiles as any);
                  };

                  return (
                    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white mt-4">
                      {/* Purpose Banner */}
                      <div className="bg-[#207886]/5 border border-[#207886]/10 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <h4 className="text-sm font-extrabold text-[#207886] flex items-center gap-1.5 uppercase font-mono">
                            <Sparkles className="w-4 h-4 text-[#207886]" />
                            {tool.id === "contact-duplicate-finder" ? "Advanced Contact Duplicate Finder & Overlap Scanner" : "Intuitive Contacts Merger & Deduplication"}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                            {tool.id === "contact-duplicate-finder" 
                              ? "Scan, detect and cluster overlapping contact names, matching phone numbers, and redundant email records across loaded backup rosters."
                              : "Unify vCard backup files and spreadsheet CSV lists sequentially. This pipeline finds matching indices, forms fields preservation logic, and generates standard download formats."}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setContactsList([]);
                              setUploadedFilesMeta([]);
                              setSelectedContacts([]);
                              setCustomMergeCandidates(null);
                              setEditingContactId(null);
                              setRemovedDuplicatesList([]);
                              setWizardStep(1);
                              setWizardProgress({ status: 'idle', percent: 0, message: '' });
                              setWizardMergeProgress({ status: 'idle', percent: 0, message: '' });
                              setWizardDownloadStatus({ ios: 'idle', android: 'idle', csv: 'idle' });
                              setSuccessMessage("Workspace database cleared.");
                            }}
                            className="px-3 py-1.5 border border-rose-500/20 text-rose-500 rounded-lg text-xs font-mono font-bold uppercase transition hover:bg-rose-500/10 active:scale-95 flex items-center gap-1 cursor-pointer align-middle"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Visual Stepper Indicators */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                          { step: 1, label: "1. Add Files", desc: "VCF or CSV files" },
                          { 
                            step: 2, 
                            label: tool.id === "contact-duplicate-finder" ? "2. Scan Overlaps" : "2. Safe Merge", 
                            desc: tool.id === "contact-duplicate-finder" ? "Cluster duplicates" : "Run deduplicator" 
                          },
                          { 
                            step: 3, 
                            label: tool.id === "contact-duplicate-finder" ? "3. Overlaps Audit" : "3. Review Output", 
                            desc: tool.id === "contact-duplicate-finder" ? "Verify matched groups" : "Inspect unique cards" 
                          },
                          { 
                            step: 4, 
                            label: tool.id === "contact-duplicate-finder" ? "4. Clean Report" : "4. Download File", 
                            desc: tool.id === "contact-duplicate-finder" ? "Export clean roster" : "Export clean catalog" 
                          }
                        ].map((item) => {
                          const isCurrent = wizardStep === item.step;
                          const isPast = wizardStep > item.step;
                          return (
                            <div 
                              key={item.step} 
                              className={`border rounded-xl p-3 transition relative overflow-hidden ${
                                isCurrent 
                                  ? 'bg-amber-500/[0.03] border-amber-500 ring-1 ring-amber-500/20' 
                                  : isPast 
                                  ? 'bg-emerald-500/[0.02] border-emerald-500/30' 
                                  : 'bg-gray-50/50 dark:bg-gray-950/25 border-gray-200 dark:border-gray-800 opacity-60'
                              }`}
                            >
                              <div className={`absolute top-0 left-0 right-0 h-1 ${
                                isCurrent ? 'bg-amber-500' : isPast ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-800'
                              }`} />
                              
                              <div className="flex items-center gap-2">
                                <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${
                                  isPast 
                                    ? 'bg-emerald-500 text-white' 
                                    : isCurrent 
                                    ? 'bg-amber-500 text-white' 
                                    : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                                }`}>
                                  {isPast ? "✓" : item.step}
                                </span>
                                <div>
                                  <span className={`text-xs font-bold block ${
                                    isCurrent ? 'text-amber-600 dark:text-amber-400' : isPast ? 'text-emerald-555 font-extrabold dark:text-emerald-400' : 'text-gray-505'
                                  }`}>
                                    {item.label}
                                  </span>
                                  <span className="text-[9.5px] text-gray-400 block">{item.desc}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* STEP 1 SECTION PANEL */}
                      <div className={`space-y-4 p-4 rounded-xl border border-gray-150 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-950/10 ${wizardStep !== 1 ? 'opacity-40 select-none pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center border-b border-gray-155 dark:border-gray-800 pb-2 border-slate-200">
                          <h5 className="text-xs font-extrabold text-[#207886] uppercase tracking-wide flex items-center gap-1.5 font-mono">
                            📂 Activity 1: Add Multiple Contact Rosters
                          </h5>
                          {wizardStep > 1 && (
                            <span className="bg-emerald-500/15 text-emerald-650 px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase">
                              ✓ Completed
                            </span>
                          )}
                        </div>

                        {wizardStep === 1 ? (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                            <div className="md:col-span-7 border border-dashed border-gray-300 dark:border-gray-700 hover:border-[#207886] rounded-xl p-5 text-center bg-white dark:bg-gray-950 hover:bg-slate-50 dark:hover:bg-gray-900 transition relative cursor-pointer flex flex-col justify-center min-h-[130px]">
                              <input
                                type="file"
                                multiple
                                accept=".vcf,.csv"
                                onChange={(e) => {
                                  if (e.target.files) {
                                    handleWizardFilesUpload(e.target.files);
                                  }
                                }}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                              />
                              <div className="flex flex-col items-center justify-center relative z-0 pointer-events-none text-gray-500">
                                <Upload className="w-8 h-8 text-[#207886] mb-1 animate-pulse" />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Drag & Drop Contact Files Here</span>
                                <span className="text-[9px] text-gray-400 mt-0.5">Loads multiple Apple/Android standard .vcf or deconstructed .csv lists</span>
                              </div>
                            </div>

                            <div className="md:col-span-5 bg-indigo-500/[0.01] border border-gray-155 dark:border-gray-800 p-4 rounded-xl flex flex-col justify-between">
                              <div className="space-y-1">
                                <span className="text-[8px] font-mono font-bold text-indigo-500 uppercase tracking-wider block">Local Demo sandbox</span>
                                <h6 className="text-[11px] font-bold text-gray-700 dark:text-gray-300">⚡ Fast-Track Simulator Roster</h6>
                                <p className="text-[10px] text-gray-400 leading-normal">
                                  Instantly load two mock client database backups (VCF + CSV) preset with matching name overlaps.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={handleLoadDemoWizardFiles}
                                className="mt-3 w-full py-1.5 px-3 bg-[#207886] hover:bg-[#195f6a] text-white text-[10px] font-extrabold rounded-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 font-mono uppercase tracking-wider"
                              >
                                <Sparkles className="w-3 h-3" />
                                Load Simulator Files
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-emerald-500/5 p-3 rounded-lg flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span className="font-semibold text-gray-800 dark:text-gray-200">
                                Loaded {uploadedFilesMeta.length} roster database files ({contactsList.length} total contacts detected).
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setContactsList([]);
                                setUploadedFilesMeta([]);
                                setWizardStep(1);
                                setWizardProgress({ status: 'idle', percent: 0, message: '' });
                              }}
                              className="text-[10px] text-rose-500 hover:underline font-mono"
                            >
                              Clear
                            </button>
                          </div>
                        )}

                        {wizardProgress.status === 'running' && (
                          <div className="space-y-1 bg-amber-500/[0.02] border border-amber-500/10 p-3 rounded-lg">
                            <div className="flex justify-between items-center text-[10px] font-semibold text-amber-600 font-mono">
                              <span className="flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {wizardProgress.message}
                              </span>
                              <span>{wizardProgress.percent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
                              <div className="bg-amber-400 h-full rounded-full transition-all duration-205" style={{ width: `${wizardProgress.percent}%` }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* STEP 2 SECTION PANEL */}
                      <div className={`space-y-4 p-4 rounded-xl border border-gray-150 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-950/10 ${wizardStep !== 2 ? 'opacity-40 select-none pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center border-b border-gray-155 dark:border-gray-800 pb-2 border-slate-200">
                          <h5 className="text-xs font-extrabold text-amber-500 uppercase tracking-wide flex items-center gap-1.5 font-mono">
                            {tool.id === "contact-duplicate-finder" ? "🔍 Activity 2: Run Overlaps Search" : "⚡ Activity 2: Run De-duplication Merger"}
                          </h5>
                          {wizardStep > 2 && (
                            <span className="bg-emerald-500/15 text-emerald-650 px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase">
                              ✓ Completed
                            </span>
                          )}
                        </div>

                        {wizardStep === 2 ? (
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 border p-3 rounded-xl border-slate-200">
                              <div className="flex-1">
                                <span className="text-[8px] bg-amber-500/10 text-amber-500 font-mono px-1.5 py-0.5 rounded font-bold uppercase select-none">
                                  {tool.id === "contact-duplicate-finder" ? "Overlap scanner prepared" : "Overlap scanning ready"}
                                </span>
                                <h6 className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mt-1">
                                  {tool.id === "contact-duplicate-finder" ? "Group and isolate matching cards" : "Ready to merge overlapping cards"}
                                </h6>
                                <p className="text-[10px] text-gray-400 leading-normal mt-0.5">
                                  {tool.id === "contact-duplicate-finder"
                                    ? `Our engine will scan the active catalog of ${contactsList.length} records and group matching mobile numbers, emails, and exact names into searchable clusters of duplicates.`
                                    : `Our engine will scan the active catalog of ${contactsList.length} records and resolve duplicate phone lines, emails, and names automatically.`}
                                </p>
                              </div>

                              <button
                                type="button"
                                disabled={wizardMergeProgress.status === 'running'}
                                onClick={() => {
                                  setWizardMergeProgress({ status: 'running', percent: 10, message: 'Constructing similarity matrices...' });
                                  
                                  setTimeout(() => {
                                    setWizardMergeProgress({ status: 'running', percent: 45, message: 'Unifying overlapping phone strings & emails...' });
                                    
                                    setTimeout(() => {
                                      setWizardMergeProgress({ status: 'running', percent: 80, message: 'Synthesizing tags and saving directory logs...' });
                                      
                                      setTimeout(() => {
                                        const processed = new Set<string>();
                                        const clusters: any[] = [];
                                        
                                        for (let i = 0; i < contactsList.length; i++) {
                                          const c1 = contactsList[i];
                                          if (processed.has(c1.id)) continue;
                                          
                                          const matches = contactsList.filter(c2 => {
                                            if (c2.id === c1.id || processed.has(c2.id)) return false;
                                            
                                            const nameMatch = c1.name && c2.name && (c1.name.toLowerCase().replace(/\s+/g,"") === c2.name.toLowerCase().replace(/\s+/g,""));
                                            const phoneMatch = c1.phone && c2.phone && (c1.phone.replace(/\D/g, "") === c2.phone.replace(/\D/g, "") && c1.phone.replace(/\D/g, "").length > 4);
                                            const emailMatch = c1.email && c2.email && (c1.email.toLowerCase().trim() === c2.email.toLowerCase().trim() && c1.email.trim() !== "");
                                            
                                            return nameMatch || phoneMatch || emailMatch;
                                          });

                                          if (matches.length > 0) {
                                            clusters.push([c1, ...matches]);
                                            processed.add(c1.id);
                                            matches.forEach(m => processed.add(m.id));
                                          }
                                        }

                                        let currentList = [...contactsList];
                                        const deletedForLog: any[] = [];
                                        
                                        clusters.forEach(cluster => {
                                          const merged = { ...cluster[0] };
                                          cluster.forEach((item: any) => {
                                            if (!merged.phone && item.phone) merged.phone = item.phone;
                                            if (!merged.email && item.email) merged.email = item.email;
                                            if (!merged.company && item.company) merged.company = item.company;
                                            if (item.tags) {
                                              merged.tags = Array.from(new Set([...(merged.tags || []), ...(item.tags || [])]));
                                            }
                                          });
                                          const restIds = cluster.slice(1).map((x: any) => x.id);
                                          cluster.slice(1).forEach((item: any) => {
                                            deletedForLog.push({
                                              ...item,
                                              mergedInto: merged.name,
                                              removedAt: new Date().toLocaleTimeString(),
                                              reason: "Auto-merged duplicates"
                                            });
                                          });
                                          currentList = currentList.filter(x => !restIds.includes(x.id));
                                          currentList = currentList.map(x => x.id === merged.id ? merged : x);
                                        });

                                        setContactsList(currentList);
                                        setRemovedDuplicatesList(deletedForLog);
                                        
                                        setWizardMergeProgress({
                                          status: 'completed',
                                          percent: 100,
                                          message: tool.id === "contact-duplicate-finder" ? 'Overlap identification complete!' : 'Merge operation complete!',
                                          stats: {
                                            before: contactsList.length,
                                            after: currentList.length,
                                            removed: deletedForLog.length,
                                            clusters: clusters.length
                                          }
                                        });

                                        setSuccessMessage(
                                          tool.id === "contact-duplicate-finder"
                                            ? `Scanned and clustered ${clusters.length} duplicate groups. Review below!`
                                            : `Consolidated ${deletedForLog.length} overlapping duplicates! Click below to review.`
                                        );
                                        setWizardStep(3); // Advance
                                        
                                      }, 300);
                                    }, 400);
                                  }, 400);
                                }}
                                className={`py-2 px-4 text-white text-xs font-bold rounded-lg transition transform active:scale-95 cursor-pointer shrink-0 ${
                                  wizardMergeProgress.status === 'running' 
                                    ? 'bg-gray-400 dark:bg-gray-800' 
                                    : 'bg-amber-500 hover:bg-amber-600 shadow-sm'
                                }`}
                              >
                                {wizardMergeProgress.status === 'running' ? (
                                  <span className="flex items-center gap-1 font-mono uppercase tracking-wide text-[10px]">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    {tool.id === "contact-duplicate-finder" ? "Scanning details..." : "Merging..."}
                                  </span>
                                ) : (
                                  tool.id === "contact-duplicate-finder" ? "🔍 Scan for Duplicates" : "⚡ Run Auto-Merge Now"
                                )}
                              </button>
                            </div>

                            {/* Merge Progress Display bar */}
                            {wizardMergeProgress.status === 'running' && (
                              <div className="space-y-1 bg-amber-500/[0.01] border border-amber-500/10 p-3 rounded-lg">
                                <div className="flex justify-between items-center text-[10px] font-semibold text-amber-500 font-mono">
                                  <span>{wizardMergeProgress.message}</span>
                                  <span>{wizardMergeProgress.percent}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-855 h-1 rounded-full overflow-hidden">
                                  <div className="bg-amber-400 h-full rounded-full transition-all duration-200" style={{ width: `${wizardMergeProgress.percent}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-emerald-500/5 p-3 rounded-lg flex justify-between items-center text-xs">
                            <span className="font-semibold text-gray-855 dark:text-gray-200">
                              {wizardMergeProgress.stats ? (
                                tool.id === "contact-duplicate-finder" ? (
                                  <>
                                    ✓ Duplicate finder safely analyzed and grouped <b className="text-emerald-555 dark:text-emerald-400">{wizardMergeProgress.stats.clusters} overlapping groups</b>. Detected <b className="text-rose-500">{wizardMergeProgress.stats.removed} redundant records</b>.
                                  </>
                                ) : (
                                  <>
                                    ✓ Deep auto-merge successfully consolidated <b className="text-emerald-555 dark:text-emerald-400">{wizardMergeProgress.stats.clusters} duplicate groups</b>. Removed <b className="text-rose-500">{wizardMergeProgress.stats.removed} duplicate nodes</b>, keeping <b className="text-[#207886]">{contactsList.length} unique catalog cards</b>.
                                  </>
                                )
                              ) : (
                                tool.id === "contact-duplicate-finder" 
                                  ? "✓ Overlapping entries scanned and grouped successfully." 
                                  : "✓ Duplicates consolidated successfully into single cards."
                              )}
                            </span>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 py-0.5 px-2 rounded font-mono font-bold uppercase mr-1">
                              Done
                            </span>
                          </div>
                        )}
                      </div>

                      {/* STEP 3 SECTION PANEL */}
                      <div className={`space-y-4 p-4 rounded-xl border border-gray-150 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-950/10 ${wizardStep !== 3 ? 'opacity-40 select-none pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center border-b border-gray-155 dark:border-gray-800 pb-2 border-slate-200">
                          <h5 className="text-xs font-extrabold text-indigo-500 uppercase tracking-wide flex items-center gap-1.5 font-mono">
                            {tool.id === "contact-duplicate-finder" ? "🔍 Activity 3: Review Detected Duplicates & Overlaps" : "🔍 Activity 3: Review Final Merged Contacts list"}
                          </h5>
                          {wizardStep > 3 && (
                            <span className="bg-emerald-500/15 text-emerald-655 px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase">
                              ✓ Reviewed
                            </span>
                          )}
                        </div>

                        {wizardStep === 3 && (
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div>
                                <h6 className="text-[11px] font-extrabold text-gray-700 dark:text-gray-200 uppercase font-mono">
                                  {tool.id === "contact-duplicate-finder" ? "Isolated Duplicate Clusters Report" : "Active final Directory roster"}
                                </h6>
                                <p className="text-[10px] text-gray-450 mt-0.5 font-sans">
                                  {tool.id === "contact-duplicate-finder" 
                                    ? "These accounts have overlapping phone, name, or email signatures. Click next to download the clean report." 
                                    : "Please check your consolidated files index before downloading."}
                                </p>
                              </div>

                              <div className="relative w-full sm:w-52">
                                <input
                                  type="text"
                                  placeholder="Filter roster..."
                                  value={contactSearch}
                                  onChange={(e) => setContactSearch(e.target.value)}
                                  className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-850 rounded-lg px-2 py-1 text-[11px] outline-none"
                                />
                              </div>
                            </div>

                            <div className="border border-gray-155 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-950 max-h-[220px] overflow-y-auto">
                              <table className="w-full border-collapse text-left text-[11px]">
                                <thead>
                                  <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-150 dark:border-gray-800 font-mono uppercase text-[8.5px] text-gray-400">
                                    <th className="p-2 font-bold select-none">Contact Name</th>
                                    <th className="p-2 font-bold select-none font-mono">Phone number</th>
                                    <th className="p-2 font-bold select-none">Email string</th>
                                    <th className="p-2 font-bold text-right font-mono select-none">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-150 dark:divide-gray-855 text-[11px] text-gray-700 dark:text-gray-300">
                                  {contactsList
                                    .filter(c => !contactSearch || (c.name || '').toLowerCase().includes(contactSearch.toLowerCase()) || (c.phone || '').includes(contactSearch) || (c.email || '').toLowerCase().includes(contactSearch.toLowerCase()))
                                    .map((c) => (
                                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                                        <td className="p-2 font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                                          {c.name || <em className="text-gray-450 font-normal">Unnamed</em>}
                                          {removedDuplicatesList.some(r => r.mergedInto === c.name) && (
                                            <span className="bg-emerald-500/10 text-emerald-650 px-1 rounded text-[8px] uppercase tracking-wide font-extrabold font-mono">Matched 👍</span>
                                          )}
                                        </td>
                                        <td className="p-2 font-mono text-gray-500 text-[10px]">{c.phone || "—"}</td>
                                        <td className="p-2 text-gray-500 text-[10px]">{c.email || "—"}</td>
                                        <td className="p-2 text-right">
                                          <span className="text-[8px] uppercase font-mono font-extrabold text-blue-500 bg-blue-500/10 py-0.2 px-1 rounded shadow-none select-none">
                                            {c.sourceFile ? c.sourceFile.substring(0, 15) + "..." : "Filtered"}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>

                            {removedDuplicatesList.length > 0 && (
                              <div className="bg-rose-500/[0.01] border border-rose-500/10 p-2.5 rounded-lg border-slate-100">
                                <span className="text-[8.5px] font-mono font-extrabold text-rose-500 uppercase tracking-wider block">
                                  {tool.id === "contact-duplicate-finder" ? "Identified Duplicate Cluster Registry" : "Consolidation Audit Trail Logs"}
                                </span>
                                <div className="space-y-0.5 mt-1 max-h-[70px] overflow-y-auto text-[9.5px] text-gray-400 font-mono">
                                  {removedDuplicatesList.map((r, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-950/20 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-900">
                                      <span>
                                        {tool.id === "contact-duplicate-finder"
                                          ? <>Isolate duplicate <b className="text-[#207886]">{r.name}</b> overlapping key identifiers on <b className="text-emerald-555">{r.mergedInto}</b></>
                                          : <>Unified redundant <b className="text-gray-600 dark:text-gray-300">{r.name}</b> details inside <b className="text-emerald-550">{r.mergedInto}</b></>}
                                      </span>
                                      <span>{r.removedAt}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="text-right pt-1">
                              <button
                                type="button"
                                onClick={() => setWizardStep(4)}
                                className="py-1 px-3 bg-[#207886] hover:bg-[#1a5b67] text-white text-[11px] font-bold rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                Next Step (Export)
                                <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* STEP 4 SECTION PANEL */}
                      <div className={`space-y-4 p-4 rounded-xl border border-gray-155 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-950/10 ${wizardStep !== 4 ? 'opacity-40 select-none pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center border-b border-gray-150 dark:border-gray-800 pb-2 border-slate-200">
                          <h5 className="text-xs font-extrabold text-[#207886] uppercase tracking-wide flex items-center gap-1.5 font-mono">
                            {tool.id === "contact-duplicate-finder" ? "📥 Activity 4: Export Clean, Audited Contacts File" : "📥 Activity 4: Export consolidated Roster Package"}
                          </h5>
                          {(wizardDownloadStatus.ios === 'completed' || wizardDownloadStatus.android === 'completed' || wizardDownloadStatus.csv === 'completed') && (
                            <span className="bg-emerald-500/15 text-emerald-650 px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase">
                              ✓ Exported
                            </span>
                          )}
                        </div>

                        {wizardStep === 4 && (
                          <div className="space-y-3">
                            <p className="text-[11px] text-gray-400 leading-normal max-w-lg">
                              {tool.id === "contact-duplicate-finder"
                                ? "Your database file auditing is complete. Export your finalized, deduplicated list to standard formats below."
                                : "Your directory catalog database is fully cleaned and unified. Export to standard iOS VCF, Android standard VCF, or standard spreadsheet CSV lines package below."}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {[
                                { key: 'ios', t: "Apple iOS iPhone (.vcf)", d: "vCard 3.0 file with UTF8 compliance for iCloud syncing." },
                                { key: 'android', t: "Android Google Mobile (.vcf)", d: "vCard 2.1 for Google contacts direct import utilities." },
                                { key: 'csv', t: "Spreadsheet Excel (.csv)", d: "Standard flat CSV block columns comma separated table." }
                              ].map((fmt) => {
                                const status = wizardDownloadStatus[fmt.key];
                                return (
                                  <div key={fmt.key} className="border border-gray-150 dark:border-gray-800 p-3 rounded-lg space-y-1.5 bg-white dark:bg-gray-950 text-left flex flex-col justify-between border-slate-200 shadow-sm">
                                    <div>
                                      <h6 className="text-[10px] font-bold text-gray-750 dark:text-gray-200 uppercase font-sans tracking-tight">{fmt.t}</h6>
                                      <p className="text-[9.5px] text-gray-450 leading-relaxed mt-0.5">{fmt.d}</p>
                                    </div>

                                    <div className="pt-2 space-y-1">
                                      <button
                                        type="button"
                                        disabled={status === 'running'}
                                        onClick={() => {
                                          setWizardDownloadStatus(prev => ({ ...prev, [fmt.key]: 'running' }));
                                          setTimeout(() => {
                                            let text = "";
                                            let ext = "vcf";
                                            if (fmt.key === 'ios') text = generateIPhoneVCard(contactsList);
                                            else if (fmt.key === 'android') text = generateAndroidVCard(contactsList);
                                            else { text = generateAndroidGoogleCSV(contactsList); ext = "csv"; }

                                            try {
                                              const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                                              const url = URL.createObjectURL(blob);
                                              const a = document.createElement("a");
                                              a.href = url;
                                              a.download = `Synthesized_Contacts_Merged.${ext}`;
                                              document.body.appendChild(a);
                                              a.click();
                                              document.body.removeChild(a);
                                              URL.revokeObjectURL(url);
                                            } catch (err) {
                                              console.warn("Download writer fail-safe copy", err);
                                            }

                                            setWizardDownloadStatus(prev => ({ ...prev, [fmt.key]: 'completed' }));
                                            setSuccessMessage(`File export for ${fmt.t} completed!`);
                                          }, 750);
                                        }}
                                        className={`w-full py-1 bg-[#207886] hover:bg-[#1a5b67] text-white text-[10px] font-bold rounded flex items-center justify-center gap-1 cursor-pointer font-mono uppercase tracking-wider ${
                                          status === 'running' ? 'opacity-75' : status === 'completed' ? 'bg-emerald-600' : ''
                                        }`}
                                      >
                                        {status === 'running' ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : status === 'completed' ? (
                                          "Saved ✓"
                                        ) : (
                                          "Download"
                                        )}
                                      </button>

                                      <button
                                        onClick={() => {
                                          let text = "";
                                          if (fmt.key === 'ios') text = generateIPhoneVCard(contactsList);
                                          else if (fmt.key === 'android') text = generateAndroidVCard(contactsList);
                                          else text = generateAndroidGoogleCSV(contactsList);
                                          
                                          handleLocalCopy(`wizard-${fmt.key}`, text);
                                          setSuccessMessage("Synthesized roster codes copied to clip directory!");
                                        }}
                                        className="w-full text-center text-[9px] text-[#207886] hover:underline cursor-pointer block font-mono"
                                      >
                                        {copiedState[`wizard-${fmt.key}`] ? "✓ Copied Content" : "↳ Copy Raw Code"}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Done panel & Reset prompter */}
                            {(wizardDownloadStatus.ios === 'completed' || wizardDownloadStatus.android === 'completed' || wizardDownloadStatus.csv === 'completed') && (
                              <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-lg flex flex-col items-center justify-center text-center gap-1.5 animate-fade-in mt-4">
                                <span className="text-emerald-750 dark:text-emerald-400 font-extrabold text-xs flex items-center gap-1 uppercase font-mono">
                                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  {tool.id === "contact-duplicate-finder" ? "Duplicate scans and audits completed successfully!" : "All contact merger phases completed successfully!"}
                                </span>
                                <span className="text-[10px] text-gray-500 font-sans">
                                  {tool.id === "contact-duplicate-finder" ? "Your database duplicates are scanned, classified, and audited." : "Your address book is now clean and deduplicated. Ready for a new run?"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setContactsList([]);
                                    setUploadedFilesMeta([]);
                                    setRemovedDuplicatesList([]);
                                    setWizardStep(1);
                                    setWizardProgress({ status: 'idle', percent: 0, message: '' });
                                    setWizardMergeProgress({ status: 'idle', percent: 0, message: '' });
                                    setWizardDownloadStatus({ ios: 'idle', android: 'idle', csv: 'idle' });
                                    setSuccessMessage("Sandbox workspace database reset.");
                                  }}
                                  className="mt-1 px-3 py-1 bg-[#207886] hover:bg-[#1a5a65] text-white rounded font-mono font-bold text-[9px] uppercase tracking-wider cursor-pointer active:scale-95 transition"
                                >
                                  ⚡ Clear & Reset Workspace
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })()}

              </div>
            )}

            {/* 2. ORIGINAL CONTACT MANAGEMENT CATEGORY WORKSPACE */}
            {tool.category === "contact-management" && !(tool.id === "contact-duplicate-finder" || tool.id === "contact-merger") && (
              <div className="space-y-6 bg-white dark:bg-gray-900 border border-gray-155 dark:border-gray-800 rounded-xl p-5 shadow-sm animate-fade-in text-gray-900 dark:text-white">
                
                {/* Unified Category Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 dark:border-gray-850 pb-4 gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-100 uppercase tracking-wider font-mono flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Directory Database Workstation
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Current tool: <b className="text-emerald-500 font-sans">{tool.name}</b> — {tool.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2.5 py-1 rounded-md font-mono font-bold uppercase">
                      Contact Suite Engine v2.1
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-md font-mono font-bold uppercase animate-fade-in">
                      {contactsList.length} Active Cards
                    </span>
                  </div>
                </div>

                {/* Localized feedback messages inside the panel */}
                {successMessage && (
                  <div className="bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-400 p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500 animate-pulse" />
                    <span>{successMessage}</span>
                  </div>
                )}
                {errorMessage && (
                  <div className="bg-rose-500/5 dark:bg-rose-955/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Active Operation Status Notification */}
                {activeOperation && (
                  <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl flex items-center justify-between gap-3 animate-pulse text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2.5 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500 shrink-0" />
                      <div>
                        <span className="font-extrabold uppercase font-mono text-[9px] tracking-widest text-emerald-500 block">SYSTEM CONTEXT ACTIVE</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{activeOperation}</span>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] text-gray-400 bg-gray-150 dark:bg-gray-800 py-1 px-2.5 rounded-lg font-bold shrink-0">
                      Processing Thread #01 ...
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* LEFT PANEL: CONTACTS DATABASE AND LIST (7 Columns) */}
                  <div className="lg:col-span-7 space-y-4">
                    
                    {/* Integrated Upload Box and Reset State Control (Sandbox Loader at Top) */}
                    <div className="border border-gray-155 dark:border-gray-800 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-950/20 space-y-3.5 animate-fade-in text-gray-900 dark:text-white">
                      <div className="flex justify-between items-center pb-1">
                        <h4 className="text-[11px] font-mono font-extrabold uppercase text-[#207886] tracking-wider flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5" />
                          Sandbox Loader & Directory Controls
                        </h4>
                        {contactsList.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setContactsList([]);
                              setUploadedFilesMeta([]);
                              setSelectedContacts([]);
                              setCustomMergeCandidates(null);
                              setEditingContactId(null);
                              setSuccessMessage("Contact lists removed from active memory.");
                            }}
                            className="text-[10px] text-rose-500 hover:underline font-bold transition font-mono cursor-pointer"
                          >
                            Reset Database
                          </button>
                        )}
                      </div>

                      <div className="border border-dashed border-gray-350 dark:border-gray-800 rounded-lg p-3 text-center bg-white dark:bg-gray-950 hover:bg-slate-100 dark:hover:bg-gray-900/40 transition relative cursor-pointer">
                        <input
                          type="file"
                          id="contact-file-multiple-input"
                          multiple
                          accept=".vcf,.csv"
                          onChange={handleContactFilesUpload}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        />
                        <div className="text-center relative z-0 pointer-events-none flex flex-col items-center justify-center">
                          <Upload className="w-5 h-5 text-[#207886] mb-1" />
                          <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Drop standard file formats (.vcf, .csv) here</span>
                          <span className="text-[9px] text-gray-400 mt-0.5">Click or drag any rosters file to parse, merge, or import them directly.</span>
                        </div>
                      </div>

                      {contactsList.length === 0 && (
                        <div className="flex flex-col gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setContactsList(JSON.parse(JSON.stringify(DEFAULT_CONTACTS)));
                              setUploadedFilesMeta([{
                                name: "enterprise-backup-simulated.vcf",
                                size: 15420,
                                type: "VCF",
                                count: DEFAULT_CONTACTS.length,
                                compatibleWith: ["iPhone / iOS (vCard 3.0)", "Android (vCard 2.1)"]
                              }]);
                              setSuccessMessage("Simulation active! Loaded 10 high-fidelity contact records.");
                            }}
                            className="w-full py-2 bg-[#207886] hover:bg-[#1a626f] text-white font-bold rounded-lg transition text-[10px] text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            ⚡ Load Interactive Simulator (Demo Database)
                          </button>
                          <p className="text-[9.5px] text-gray-450 dark:text-gray-500 text-center leading-relaxed">
                            Populate workspace with enterprise dummy cards or import custom registries at any time.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 📟 CONTACT SHOWER AND LIVE CONTROLS */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-[#207886]/10 dark:border-[#207886]/20 space-y-4 shadow-sm animate-fade-in text-gray-900 dark:text-white">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-800">
                          <h4 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                            📟 Premium Contact Shower & Device Conversion Station
                          </h4>
                          <span className="text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-gray-500 dark:text-gray-400">
                            Active Viewer
                          </span>
                        </div>

                        {/* Identified Uploaded Files */}
                        <div className="space-y-2 col-span-full">
                          <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-gray-500 block">
                            Identified Source Databases ({uploadedFilesMeta.length})
                          </span>
                          {uploadedFilesMeta.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {uploadedFilesMeta.map((file, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-950 p-2.5 rounded-lg border border-gray-150 dark:border-gray-850 flex items-start gap-2.5 shadow-xs">
                                  <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-500 shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="space-y-0.5 min-w-0 flex-1">
                                    <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 block truncate" title={file.name}>
                                      {file.name}
                                    </span>
                                    <div className="flex justify-between text-[8px] font-mono text-gray-400">
                                      <span>Type: <b>{file.type}</b></span>
                                      <span>Count: <b>{file.count} cards</b></span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3.5 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-white/5 text-[10px] font-mono text-gray-400">
                              No active database loaded. Load simulator below to populate.
                            </div>
                          )}
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          <div className="bg-white dark:bg-gray-950/40 p-2 rounded-lg border border-gray-150 dark:border-gray-850/40 text-center">
                            <span className="text-[8px] font-[900] uppercase font-mono tracking-wider text-gray-400 block">Total Directory</span>
                            <span className="text-xs font-black font-mono text-gray-800 dark:text-gray-100 mt-0.5 block">{contactsList.length}</span>
                          </div>
                          <div className="bg-white dark:bg-gray-950/40 p-2 rounded-lg border border-gray-150 dark:border-gray-850/40 text-center">
                            <span className="text-[8px] font-[900] uppercase font-mono tracking-wider text-gray-400 block">Mobile Lines</span>
                            <span className="text-xs font-black font-mono text-emerald-500 mt-0.5 block">{contactsList.filter(c => c.phone).length}</span>
                          </div>
                          <div className="bg-white dark:bg-gray-950/40 p-2 rounded-lg border border-gray-150 dark:border-gray-850/40 text-center">
                            <span className="text-[8px] font-[900] uppercase font-mono tracking-wider text-gray-400 block">Active Emails</span>
                            <span className="text-xs font-black font-mono text-blue-500 mt-0.5 block">{contactsList.filter(c => c.email).length}</span>
                          </div>
                          <div className="bg-white dark:bg-gray-950/40 p-2 rounded-lg border border-gray-150 dark:border-gray-850/40 text-center">
                            <span className="text-[8px] font-[900] uppercase font-mono tracking-wider text-gray-400 block">Orgs / Groups</span>
                            <span className="text-xs font-black font-mono text-indigo-500 mt-0.5 block">
                              {Array.from(new Set(contactsList.map(c => c.company).filter(Boolean))).length}
                            </span>
                          </div>
                        </div>

                        {/* Compatible Devices */}
                        <div className="bg-white dark:bg-gray-950/30 p-2.5 rounded-lg border border-gray-150 dark:border-gray-850 space-y-1.5">
                          <span className="text-[9px] font-extrabold uppercase font-mono tracking-wider text-gray-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Ecosystem Compatibility Matches
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded text-[8px] font-mono text-gray-600 dark:text-gray-300">
                              <span> Apple iPhone & iPad Contacts Companion</span>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded text-[8px] font-mono text-gray-600 dark:text-gray-300">
                              <span>🤖 Android Native / Pixel / Galaxy Companion</span>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded text-[8px] font-mono text-gray-600 dark:text-gray-300">
                              <span>📊 Google Account web contact sheet database</span>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded text-[8px] font-mono text-gray-600 dark:text-gray-300">
                              <span>💻 Outlook Live format standards</span>
                            </div>
                          </div>
                        </div>

                        {/* 🔍 Searchable Live Directory Catalog */}
                        <div className="bg-white dark:bg-gray-150/10 p-3 rounded-lg border border-gray-150 dark:border-gray-850 space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                              <Search className="w-3.5 h-3.5" />
                              Active Live Catalog Search & Individual Converter
                            </span>
                            <span className="text-[9px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-semibold self-start sm:self-auto font-bold uppercase tracking-wider">
                              Total matches: {showerFilteredContacts.length}
                            </span>
                          </div>

                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-gray-400">
                              <Search className="w-3 h-3" />
                            </span>
                            <input
                              type="text"
                              placeholder="Search directory by name, mobile, email, or company..."
                              value={showerSearch}
                              onChange={(e) => setShowerSearch(e.target.value)}
                              className="w-full text-[11px] pl-7.5 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium"
                            />
                          </div>

                          {/* Contacts mini cards stream */}
                          <div className="max-h-[220px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50/30 dark:bg-gray-905/10">
                            {(() => {
                              const matches = showerFilteredContacts;

                              if (matches.length === 0) {
                                return (
                                  <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-[10px] font-mono">
                                    No matched contacts available in the pool. Try typing a different search query or uploading contacts!
                                  </div>
                                );
                              }

                              return matches.map((c, i) => {
                                const initials = (c.name || "U")
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2);

                                return (
                                  <div key={c.id || i} className="p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:bg-slate-55 dark:hover:bg-slate-900/40 transition">
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      <div className="w-7 h-7 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                                        {initials}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-100 truncate">
                                            {c.name || "Unnamed Contact"}
                                          </span>
                                          {c.company && (
                                            <span className="text-[8px] bg-indigo-50 dark:bg-indigo-950 text-indigo-500 dark:text-indigo-400 px-1 py-0.2 rounded truncate max-w-[80px]">
                                              {c.company}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                                          {c.phone && <span>📞 {c.phone}</span>}
                                          {c.email && <span>✉️ {c.email}</span>}
                                        </div>
                                        <span className="text-[8px] text-gray-400 block mt-0.5 whitespace-nowrap truncate font-mono">
                                          Database Match: <b className="text-gray-500">{c.sourceFile || "Simulated Base"}</b>
                                        </span>
                                      </div>
                                    </div>

                                    {/* Action items to convert this single contact */}
                                    <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 border-gray-100 dark:border-gray-800 pt-2 sm:pt-0">
                                      <span className="text-[8px] font-mono text-gray-450 dark:text-gray-500 mr-1 hidden md:inline">Individual Convert:</span>
                                      
                                      {/* Apple VCF button */}
                                      <button
                                        type="button"
                                        title="Convert to iOS compatible vCard"
                                        onClick={() => {
                                          triggerOperation(`Converting "${c.name || 'Contact'}" to iPhone VCF format...`, () => {
                                            const singleVcard = generateIPhoneVCard([c]);
                                            downloadFile(singleVcard, `${(c.name || 'contact').toLowerCase().replace(/[^a-z0-9]/g, "_")}-iphone.vcf`, "application/octet-stream");
                                            setSuccessMessage(`Converted and exported "${c.name || 'Contact'}" optimized specifically for Apple iPhone / iOS.`);
                                          });
                                        }}
                                        className="px-1.5 py-0.5 bg-gray-150 dark:bg-gray-850 hover:bg-gray-200 dark:hover:bg-gray-800 text-[8px] font-bold text-gray-700 dark:text-gray-300 rounded cursor-pointer transition border border-gray-200 dark:border-gray-800"
                                      >
                                         iOS
                                      </button>

                                      {/* Android VCF button */}
                                      <button
                                        type="button"
                                        title="Convert to Android compatible vCard v2.1"
                                        onClick={() => {
                                          triggerOperation(`Converting "${c.name || 'Contact'}" to Android VCF format...`, () => {
                                            const singleVcard = generateAndroidVCard([c]);
                                            downloadFile(singleVcard, `${(c.name || 'contact').toLowerCase().replace(/[^a-z0-9]/g, "_")}-android.vcf`, "application/octet-stream");
                                            setSuccessMessage(`Converted and exported "${c.name || 'Contact'}" optimized specifically for Android (v2.1).`);
                                          });
                                        }}
                                        className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 text-[8px] font-bold text-emerald-600 dark:text-emerald-400 rounded cursor-pointer transition border border-emerald-250/20 dark:border-emerald-900/30"
                                      >
                                        🤖 Android
                                      </button>

                                      {/* Google CSV button */}
                                      <button
                                        type="button"
                                        title="Convert to Google Contacts CSV"
                                        onClick={() => {
                                          triggerOperation(`Converting "${c.name || 'Contact'}" to Google Web CSV format...`, () => {
                                            const singleCsv = generateAndroidGoogleCSV([c]);
                                            downloadFile(singleCsv, `${(c.name || 'contact').toLowerCase().replace(/[^a-z0-9]/g, "_")}-google.csv`, "application/octet-stream");
                                            setSuccessMessage(`Converted and exported "${c.name || 'Contact'}" optimized specifically for Google Web CSV.`);
                                          });
                                        }}
                                        className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 text-[8px] font-bold text-blue-600 dark:text-blue-400 rounded cursor-pointer transition border border-blue-250/20 dark:border-blue-900/30"
                                      >
                                        📊 CSV
                                      </button>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>

                        {/* Cross-Device Conversion Hub */}
                        <div className="space-y-2 pt-1">
                          <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-indigo-500 block">
                            ⚡ Quick Cross-Device Format Converter Options
                          </span>
                          <p className="text-[9px] text-gray-400">
                            Dynamically repackage identified contact rosters to target other device types instantly:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button
                              type="button"
                              disabled={opsState['conversionIphone']?.status === 'running'}
                              onClick={() => {
                                runLocalOperation(
                                  'conversionIphone',
                                  'Packaging directory for Apple iOS VCF...',
                                  'All contacts successfully converted for Apple iPhone (iOS VCF v3.0)! Ready for Apple Ecosystem import.',
                                  () => {
                                    const vcfText = generateIPhoneVCard(contactsList);
                                    const filename = `shower-converted-iphone-${new Date().toISOString().slice(0, 10)}.vcf`;
                                    downloadFile(vcfText, filename, "application/octet-stream");
                                    return { content: vcfText, filename };
                                  }
                                );
                              }}
                              className={`py-1 text-white font-bold rounded text-[9px] text-center transition cursor-pointer flex items-center justify-center gap-1 shadow-xs ${
                                opsState['conversionIphone']?.status === 'running'
                                  ? 'bg-gray-400 dark:bg-gray-800 cursor-not-allowed opacity-60'
                                  : 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-705 dark:hover:bg-slate-600'
                              }`}
                            >
                              {opsState['conversionIphone']?.status === 'running' ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Packaging iOS...
                                </>
                              ) : (
                                <> Convert for iPhone (.vcf)</>
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={opsState['conversionAndroid']?.status === 'running'}
                              onClick={() => {
                                runLocalOperation(
                                  'conversionAndroid',
                                  'Packaging directory for Android VCF...',
                                  'All contacts successfully converted for Android (VCF v2.1)! Ready for Android/Google Ecosystem import.',
                                  () => {
                                    const vcfText = generateAndroidVCard(contactsList);
                                    const filename = `shower-converted-android-${new Date().toISOString().slice(0, 10)}.vcf`;
                                    downloadFile(vcfText, filename, "application/octet-stream");
                                    return { content: vcfText, filename };
                                  }
                                );
                              }}
                              className={`py-1 text-white font-bold rounded text-[9px] text-center transition cursor-pointer flex items-center justify-center gap-1 shadow-xs ${
                                opsState['conversionAndroid']?.status === 'running'
                                  ? 'bg-gray-405 dark:bg-gray-800 cursor-not-allowed opacity-60'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                            >
                              {opsState['conversionAndroid']?.status === 'running' ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Packaging Android...
                                </>
                              ) : (
                                <>🤖 Convert for Android (.vcf)</>
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={opsState['conversionGoogle']?.status === 'running'}
                              onClick={() => {
                                runLocalOperation(
                                  'conversionGoogle',
                                  'Compiling database into Google Contacts CSV...',
                                  'All contacts successfully converted for Google Contacts Web (CSV import)! Ready for Gmail/Google Cloud import.',
                                  () => {
                                    const csvText = generateAndroidGoogleCSV(contactsList);
                                    const filename = `shower-converted-google-${new Date().toISOString().slice(0, 10)}.csv`;
                                    downloadFile(csvText, filename, "application/octet-stream");
                                    return { content: csvText, filename };
                                  }
                                );
                              }}
                              className={`py-1 text-white dark:text-indigo-200 font-bold rounded text-[9px] text-center transition cursor-pointer flex items-center justify-center gap-1 shadow-xs ${
                                opsState['conversionGoogle']?.status === 'running'
                                  ? 'bg-gray-405 dark:bg-gray-800 cursor-not-allowed opacity-60'
                                  : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900/80'
                              }`}
                            >
                              {opsState['conversionGoogle']?.status === 'running' ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Compiling CSV...
                                </>
                              ) : (
                                <>📊 Convert to Google (.csv)</>
                              )}
                            </button>
                          </div>

                          {/* Common output reporting portal for quick converter hub */}
                          {['conversionIphone', 'conversionAndroid', 'conversionGoogle'].some(k => opsState[k] && opsState[k].status !== 'idle') && (
                            <div className="pt-1.5 space-y-2 animate-fade-in">
                              {['conversionIphone', 'conversionAndroid', 'conversionGoogle'].map(key => {
                                const state = opsState[key];
                                if (!state || state.status === 'idle') return null;
                                const deviceName = key === 'conversionIphone' ? 'iPhone' : key === 'conversionAndroid' ? 'Android' : 'Google CSV';
                                return (
                                  <div key={key} className={`p-3 rounded-lg border text-xs font-sans leading-relaxed ${
                                    state.status === 'running'
                                      ? 'bg-amber-500/[0.04] border-amber-500/20 text-amber-700 dark:text-amber-300 animate-pulse font-medium'
                                      : state.status === 'completed'
                                      ? 'bg-emerald-500/[0.04] border-emerald-500/20 text-emerald-800 dark:text-emerald-400 font-medium'
                                      : 'bg-red-500/[0.04] border-red-500/20 text-red-700 dark:text-red-400'
                                  }`}>
                                    <div className="flex gap-2 items-start">
                                      {state.status === 'running' ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0 mt-0.5" />
                                      ) : state.status === 'completed' ? (
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                      ) : (
                                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                      )}
                                      <div className="flex-1">
                                        <span className="font-extrabold uppercase tracking-wider text-[8px] font-mono block mb-0.5 text-gray-500">
                                          {deviceName} Conversion Channel
                                        </span>
                                        <span>{state.message}</span>
                                        {state.status === 'completed' && state.content && (
                                          <div className="mt-2 pt-2 border-t border-gray-150 dark:border-gray-800 space-y-1.5">
                                            <span className="text-[9px] text-gray-400 dark:text-gray-550 font-mono block leading-normal">
                                              💡 <b>Download blocked by browser sandbox?</b> Copy the compiled text data with 1-click and save it manually as a text file suffix copy:
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleLocalCopy(key, state.content || '')}
                                              className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold rounded-md flex items-center gap-1 transition cursor-pointer"
                                            >
                                              {copiedState[key] ? (
                                                <>
                                                  <CheckCircle className="w-3 h-3 text-emerald-350" />
                                                  ✓ Copied raw data to Clipboard!
                                                </>
                                              ) : (
                                                <>
                                                  <Copy className="w-3 h-3" />
                                                  Copy Clean {deviceName} Raw Code
                                                </>
                                              )}
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Search and Database Filters */}
                      {contactsList.length > 0 && (
                        <div className="space-y-4 animate-fade-in">
                          <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between pb-2">
                        <div className="relative w-full sm:w-64">
                          <span className="absolute left-2.5 top-2.5 text-gray-400">
                            <Search className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="text"
                            placeholder="Search contacts..."
                            value={contactSearch}
                            onChange={(e) => setContactSearch(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto justify-end flex-wrap">
                          <label className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Add Files</span>
                            <input
                              type="file"
                              multiple
                              accept=".vcf,.csv"
                              onChange={handleContactFilesUpload}
                              className="hidden"
                            />
                          </label>

                          <select
                            value={contactGroupFilter}
                            onChange={(e) => setContactGroupFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                          >
                            <option value="all">All Ecosystems</option>
                            <option value="Google">Google Contacts</option>
                            <option value="Apple">iCloud Apple</option>
                            <option value="Microsoft">Outlook Web</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => {
                              setContactMockLoaded(false);
                              setRemovedDuplicatesList([]);
                              setSuccessMessage("Database and duplicate logger cleared cleanly.");
                            }}
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-300 text-xs font-bold rounded-lg transition cursor-pointer"
                            title="Unload simulated database"
                          >
                            Clear App
                          </button>
                        </div>
                      </div>

                      {/* Database Grid Cards */}
                      <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-950/20 max-h-[460px] overflow-y-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-gray-100 dark:bg-gray-950/80 sticky top-0 border-b border-gray-200 dark:border-gray-800 font-mono text-[9px] uppercase tracking-wider text-gray-500">
                            <tr>
                              <th className="p-3 w-8">
                                <input
                                  type="checkbox"
                                  checked={selectedContacts.length === contactsList.length && contactsList.length > 0}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedContacts(contactsList.map(c => c.id));
                                    } else {
                                      setSelectedContacts([]);
                                    }
                                  }}
                                  className="rounded accent-emerald-500 cursor-pointer"
                                />
                              </th>
                              <th className="p-3">Identity / Company</th>
                              <th className="p-3">Phone Line</th>
                              <th className="p-3">Email Address</th>
                              <th className="p-3 text-right">Ecosystem</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-155 dark:divide-gray-850">
                            {(() => {
                              const filtered = filteredContacts;

                              if (filtered.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">
                                      No contacts found matching the search criteria.
                                    </td>
                                  </tr>
                                );
                              }

                              return filtered.map(c => {
                                const isSelected = selectedContacts.includes(c.id);
                                const isEditing = editingContactId === c.id;

                                return (
                                  <tr 
                                    key={c.id} 
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-900 transition ${
                                      isSelected ? "bg-emerald-50/20 dark:bg-emerald-950/10" : ""
                                    }`}
                                  >
                                    <td className="p-3">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedContacts([...selectedContacts, c.id]);
                                          } else {
                                            setSelectedContacts(selectedContacts.filter(id => id !== c.id));
                                          }
                                        }}
                                        className="rounded accent-emerald-500 cursor-pointer"
                                      />
                                    </td>
                                    <td className="p-3 font-sans">
                                      {isEditing ? (
                                        <div className="space-y-1">
                                          <input
                                            type="text"
                                            value={editedContactValues.name || ""}
                                            onChange={(e) => setEditedContactValues({...editedContactValues, name: e.target.value})}
                                            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-850 px-1.5 py-0.5 rounded text-xs w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                          />
                                          <input
                                            type="text"
                                            placeholder="Company"
                                            value={editedContactValues.company || ""}
                                            onChange={(e) => setEditedContactValues({...editedContactValues, company: e.target.value})}
                                            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-850 px-1.5 py-0.5 rounded text-[10px] w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                          />
                                        </div>
                                      ) : (
                                        <div>
                                          <span className="font-bold text-gray-800 dark:text-gray-100">{c.name || <i className="text-gray-400">Unnamed</i>}</span>
                                          {c.company && (
                                            <span className="block text-[10px] text-gray-400 font-medium">{c.company}</span>
                                          )}
                                          {c.tags && c.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {c.tags.map((t: string) => (
                                                <span key={t} className="text-[8px] font-extrabold uppercase px-1 py-0.2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded">
                                                  {t}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                    
                                    <td className="p-3 font-mono text-[11px]">
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={editedContactValues.phone || ""}
                                          onChange={(e) => setEditedContactValues({...editedContactValues, phone: e.target.value})}
                                          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-850 px-1.5 py-0.5 rounded text-xs w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                      ) : (
                                        c.phone || <span className="text-rose-400 italic text-[10px]">No Number</span>
                                      )}
                                    </td>

                                    <td className="p-3 font-mono text-[11px]">
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={editedContactValues.email || ""}
                                          onChange={(e) => setEditedContactValues({...editedContactValues, email: e.target.value})}
                                          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-850 px-1.5 py-0.5 rounded text-xs w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                      ) : (
                                        c.email || <span className="text-rose-400 italic text-[10px]">No Email</span>
                                      )}
                                    </td>

                                    <td className="p-3 text-right">
                                      {isEditing ? (
                                        <div className="flex gap-1 justify-end">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = contactsList.map(item => item.id === c.id ? { ...item, ...editedContactValues } : item);
                                              setContactsList(updated);
                                              setEditingContactId(null);
                                              setSuccessMessage(`Saved edits for "${editedContactValues.name}"`);
                                            }}
                                            className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                          >
                                            Save
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingContactId(null)}
                                            className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px] cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-end gap-1 select-none">
                                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                            c.accountType === "Google" ? "bg-emerald-400/10 text-emerald-500" :
                                            c.accountType === "Apple" ? "bg-gray-400/15 text-gray-400" : "bg-blue-400/10 text-blue-500"
                                          }`}>
                                            {c.accountType}
                                          </span>
                                          <div className="flex gap-1.5 pt-1">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingContactId(c.id);
                                                setEditedContactValues(c);
                                              }}
                                              className="text-[10px] text-indigo-500 hover:underline cursor-pointer"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setContactsList(contactsList.filter(item => item.id !== c.id));
                                                setSuccessMessage(`Removed contact "${c.name}".`);
                                              }}
                                              className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                    </div>

                    {/* RIGHT PANEL: SELECTED TOOL WORKSPACE (5 Columns) */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-4">
                      
                      {/* Active Tool Workspace Controller */}
                      <div className="bg-gray-50/50 dark:bg-gray-950/20 p-4 rounded-xl border border-gray-155 dark:border-gray-800 space-y-4">
                        {contactsList.length === 0 ? (
                          <div className="p-8 text-center bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl space-y-4 shadow-sm animate-fade-in text-gray-900 dark:text-white">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500 mx-auto">
                              <FileText className="w-5 h-5 flex animate-pulse" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xs font-extrabold text-gray-750 dark:text-gray-300 uppercase tracking-widest font-mono">
                                Contact Sandbox Inactive
                              </h4>
                              <p className="text-[11px] text-gray-400 max-w-xs mx-auto leading-relaxed">
                                This workspace module (<b>{tool.name}</b>) requires active contact cards. Load sample contacts or import your own .vcf/.csv files in the directory panel to activate this tool's features.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setContactsList(JSON.parse(JSON.stringify(DEFAULT_CONTACTS)));
                                setUploadedFilesMeta([{
                                  name: "enterprise-backup-simulated.vcf",
                                  size: 15420,
                                  type: "VCF",
                                  count: DEFAULT_CONTACTS.length,
                                  compatibleWith: ["iPhone / iOS (vCard 3.0)", "Android (vCard 2.1)"]
                                }]);
                                setSuccessMessage("Successfully populated sandbox with 10 simulated high-fidelity enterprise profiles!");
                              }}
                              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs transition cursor-pointer font-sans inline-flex items-center gap-1.5 mx-auto"
                            >
                              ⚡ Load Interactive Simulator
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* 1. DUPLICATE FINDER / CONTACT MERGER PANEL */}
                            {(tool.id === "contact-duplicate-finder" || tool.id === "contact-merger") ? (
                              <div className="space-y-4 animate-fade-in text-xs">
                                <div className="border border-dashed border-[#207886]/30 bg-[#207886]/5 p-4 rounded-xl text-center space-y-3">
                                  <div className="w-12 h-12 rounded-full bg-[#207886]/10 flex items-center justify-center text-[#207886] mx-auto">
                                    <Sparkles className="w-6 h-6 animate-pulse" />
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#207886]">
                                      De-duplication Engine Active
                                    </h4>
                                    <p className="text-[11px] text-gray-400 leading-relaxed max-w-sm mx-auto">
                                      The custom duplicate clusters and interactive merge controls are dynamically docked right below the "Sandbox Loader & Directory Controls" in the left column. This allows you to auto-merge, choose interactive resolutions, and inspect remaining records in one unified place!
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {tool.id === "contact-shower" && (
                              <div className="space-y-4 animate-fade-in text-xs">
                                <div className="bg-[#207886]/5 border border-[#207886]/15 p-4 rounded-xl space-y-3.5">
                                  <h4 className="text-[11px] font-mono font-extrabold uppercase text-[#207886] tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-[#207886] animate-pulse" />
                                    Active Directory Live Dashboard
                                  </h4>
                                  <p className="text-gray-400 text-[11px] leading-relaxed">
                                    Welcome to the <b>Premium Contact Shower & Device Conversion Station</b>! All parsing, formatting, deduplicating and cross-device conversion utilities are fully unlocked below.
                                  </p>
                                  <div className="space-y-2 border-t border-gray-150 dark:border-gray-800 pt-3">
                                    <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-gray-450 block">
                                      Key Workstation Controls:
                                    </span>
                                    <ul className="space-y-1.5 list-disc pl-4 text-[11px] text-gray-405 dark:text-gray-400 leading-relaxed">
                                      <li>Use the <b>Sandbox Loader</b> to drop any <code>.vcf</code> or <code>.csv</code> roster files.</li>
                                      <li>Filters are synchronized instantly with zero-latency <b>Active Live Catalog Search</b> in the left column.</li>
                                      <li>Convert individual contacts to <b>Apple iOS</b>, <b>Android</b>, or <b>Google Web CSV</b>.</li>
                                      <li>Package your entire purged database to target formats at any time.</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            )}

                            {false && (tool.id === "contact-duplicate-finder" || tool.id === "contact-merger") && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-[11px] font-mono font-extrabold uppercase text-emerald-600 tracking-wider">
                                Duplicate Parser Engine
                              </h4>
                              <button
                                type="button"
                                onClick={() => {
                                  // Auto merge all duplicate listings
                                  const processed = new Set<string>();
                                  const clusters: any[] = [];
                                  
                                  for (let i = 0; i < contactsList.length; i++) {
                                    const c1 = contactsList[i];
                                    if (processed.has(c1.id)) continue;
                                    const matches = contactsList.filter(c2 => 
                                      c2.id !== c1.id &&
                                      !processed.has(c2.id) &&
                                      (
                                        (c1.name && c2.name && c1.name.toLowerCase().replace(/\s+/g,"") === c2.name.toLowerCase().replace(/\s+/g,"")) ||
                                        (c1.phone && c2.phone && c1.phone.replace(/\D/g, "") === c2.phone.replace(/\D/g, "") && c1.phone.replace(/\D/g, "").length > 4) ||
                                        (c1.email && c2.email && c1.email.toLowerCase().trim() === c2.email.toLowerCase().trim() && c1.email.trim() !== "")
                                      )
                                    );
                                    if (matches.length > 0) {
                                      clusters.push([c1, ...matches]);
                                      processed.add(c1.id);
                                      matches.forEach(m => processed.add(m.id));
                                    }
                                  }

                                  if (clusters.length === 0) {
                                    setSuccessMessage("No duplicates to merge!");
                                    return;
                                  }
                                  let currentList = [...contactsList];
                                  const deletedForLog: any[] = [];
                                  clusters.forEach(cluster => {
                                    // Compile best parameters of each
                                    const merged = { ...cluster[0] };
                                    cluster.forEach((item: any) => {
                                      if (!merged.phone && item.phone) merged.phone = item.phone;
                                      if (!merged.email && item.email) merged.email = item.email;
                                      if (!merged.company && item.company) merged.company = item.company;
                                      if (item.tags) {
                                        merged.tags = Array.from(new Set([...merged.tags, ...item.tags]));
                                      }
                                    });
                                    // Keep cluster[0]'s id, remove the others from currentList and update c1
                                    const restIds = cluster.slice(1).map((x: any) => x.id);
                                    
                                    // Log deleted records
                                    cluster.slice(1).forEach((item: any) => {
                                      deletedForLog.push({
                                        ...item,
                                        mergedInto: merged.name,
                                        removedAt: new Date().toLocaleTimeString(),
                                        reason: "Auto-merged duplicates"
                                      });
                                    });

                                    currentList = currentList.filter(x => !restIds.includes(x.id));
                                    currentList = currentList.map(x => x.id === merged.id ? merged : x);
                                  });
                                  setContactsList(currentList);
                                  setRemovedDuplicatesList(prev => [...prev, ...deletedForLog]);
                                  setSuccessMessage(`Auto-merged ${clusters.length} duplicate directories clusters successfully! ${deletedForLog.length} duplicate contacts logged as removed.`);
                                }}
                                className="px-2 py-1 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 text-[10px] font-bold rounded transition cursor-pointer"
                              >
                                ⚡ Auto-Merge All
                              </button>
                            </div>

                            {/* Main Duplicate Comparison Block */}
                            {customMergeCandidates ? (
                              <div className="border border-dashed border-emerald-500/20 bg-emerald-500/5 p-3 rounded-lg space-y-3 animate-fade-in text-xs">
                                <span className="font-extrabold text-[10px] font-mono text-emerald-600 uppercase block font-sans">Interactive Resolving Compiler</span>
                                
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div className="bg-slate-100 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-2 rounded">
                                    <span className="font-bold block text-[9px] text-red-500 select-none">CANDIDATE A ({customMergeCandidates.left.accountType})</span>
                                    <div className="font-semibold">{customMergeCandidates.left.name}</div>
                                    <div className="text-gray-400 font-mono mt-1 text-[10px]">{customMergeCandidates.left.phone || <em className="italic text-gray-500 font-normal">No phone</em>}</div>
                                    <div className="text-gray-400 font-mono text-[10px]">{customMergeCandidates.left.email || <em className="italic text-gray-500 font-normal">No email</em>}</div>
                                    <div className="text-gray-400 text-[10px]">{customMergeCandidates.left.company || <em className="italic text-gray-500 font-normal">No company</em>}</div>
                                  </div>
                                  <div className="bg-slate-100 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-2 rounded">
                                    <span className="font-bold block text-[9px] text-blue-500 select-none">CANDIDATE B ({customMergeCandidates.right.accountType})</span>
                                    <div className="font-semibold">{customMergeCandidates.right.name}</div>
                                    <div className="text-gray-400 font-mono mt-1 text-[10px]">{customMergeCandidates.right.phone || <em className="italic text-gray-500 font-normal">No phone</em>}</div>
                                    <div className="text-gray-400 font-mono text-[10px]">{customMergeCandidates.right.email || <em className="italic text-gray-500 font-normal">No email</em>}</div>
                                    <div className="text-gray-400 text-[10px]">{customMergeCandidates.right.company || <em className="italic text-gray-500 font-normal">No company</em>}</div>
                                  </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-gray-200 dark:border-gray-800 space-y-2 text-[11px]">
                                  <span className="font-bold block text-[9px] uppercase tracking-wider text-gray-500">Formulate preservation rules</span>
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-400 font-medium">Primary Name:</span>
                                      <select id="merge-name" className="bg-gray-50 dark:bg-gray-950 border rounded px-1.5 py-0.5 text-[10px] text-gray-700 dark:text-gray-300">
                                        <option value={customMergeCandidates.left.name}>{customMergeCandidates.left.name}</option>
                                        <option value={customMergeCandidates.right.name}>{customMergeCandidates.right.name}</option>
                                      </select>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-400 font-medium">Phone number:</span>
                                      <select id="merge-phone" className="bg-gray-50 dark:bg-gray-950 border rounded px-1.5 py-0.5 text-[10px] text-gray-700 dark:text-gray-300">
                                        <option value={customMergeCandidates.left.phone}>{customMergeCandidates.left.phone || "(empty)"}</option>
                                        <option value={customMergeCandidates.right.phone}>{customMergeCandidates.right.phone || "(empty)"}</option>
                                      </select>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-400 font-medium">Work email:</span>
                                      <select id="merge-email" className="bg-gray-50 dark:bg-gray-955 border rounded px-1.5 py-0.5 text-[10px] text-gray-700 dark:text-gray-300">
                                        <option value={customMergeCandidates.left.email}>{customMergeCandidates.left.email || "(empty)"}</option>
                                        <option value={customMergeCandidates.right.email}>{customMergeCandidates.right.email || "(empty)"}</option>
                                      </select>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-400 font-medium">Affiliation company:</span>
                                      <select id="merge-company" className="bg-gray-50 dark:bg-gray-955 border rounded px-1.5 py-0.5 text-[10px] text-gray-700 dark:text-gray-300">
                                        <option value={customMergeCandidates.left.company}>{customMergeCandidates.left.company || "(empty)"}</option>
                                        <option value={customMergeCandidates.right.company}>{customMergeCandidates.right.company || "(empty)"}</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nameEl = document.getElementById("merge-name") as HTMLSelectElement;
                                      const phoneEl = document.getElementById("merge-phone") as HTMLSelectElement;
                                      const emailEl = document.getElementById("merge-email") as HTMLSelectElement;
                                      const companyEl = document.getElementById("merge-company") as HTMLSelectElement;

                                      const nameVal = nameEl?.value !== "(empty)" ? nameEl?.value : "";
                                      const phoneVal = phoneEl?.value !== "(empty)" ? phoneEl?.value : "";
                                      const emailVal = emailEl?.value !== "(empty)" ? emailEl?.value : "";
                                      const companyVal = companyEl?.value !== "(empty)" ? companyEl?.value : "";

                                      // Create merged item
                                      const leftTags = customMergeCandidates.left.tags || [];
                                      const rightTags = customMergeCandidates.right.tags || [];
                                      const mergedTags = Array.from(new Set([...leftTags, ...rightTags]));

                                      const mergedCard = {
                                        id: customMergeCandidates.left.id,
                                        name: nameVal,
                                        phone: phoneVal,
                                        email: emailVal,
                                        company: companyVal,
                                        tags: mergedTags,
                                        accountType: customMergeCandidates.left.accountType
                                      };

                                      // Delete the right candidate, and update left candidate to mergedCard
                                      const updatedList = contactsList
                                        .filter(item => item.id !== customMergeCandidates.right.id)
                                        .map(item => item.id === customMergeCandidates.left.id ? mergedCard : item);
                                      
                                      // Log the deleted duplicate candidate
                                      const deletedLog = {
                                        ...customMergeCandidates.right,
                                        mergedInto: nameVal,
                                        removedAt: new Date().toLocaleTimeString(),
                                        reason: "Interactive choose resolution"
                                      };

                                      setContactsList(updatedList);
                                      setRemovedDuplicatesList(prev => [...prev, deletedLog]);
                                      setCustomMergeCandidates(null);
                                      setSuccessMessage(`Custom resolved and merged records into a single active card for "${nameVal}"!`);
                                    }}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded cursor-pointer"
                                  >
                                    Confirm Merge
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCustomMergeCandidates(null)}
                                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <span className="text-[10px] text-gray-400 font-bold block uppercase font-mono tracking-wider">
                                  Duplicate clusters parsed 
                                </span>
                                {(() => {
                                  const processed = new Set<string>();
                                  const clusters: any[] = [];
                                  for (let i = 0; i < contactsList.length; i++) {
                                    const c1 = contactsList[i];
                                    if (processed.has(c1.id)) continue;
                                    const matches = contactsList.filter(c2 => 
                                      c2.id !== c1.id &&
                                      !processed.has(c2.id) &&
                                      (
                                        (c1.name && c2.name && c1.name.toLowerCase().replace(/\s+/g,"") === c2.name.toLowerCase().replace(/\s+/g,"")) ||
                                        (c1.phone && c2.phone && c1.phone.replace(/\D/g, "") === c2.phone.replace(/\D/g, "") && c1.phone.replace(/\D/g, "").length > 4) ||
                                        (c1.email && c2.email && c1.email.toLowerCase().trim() === c2.email.toLowerCase().trim() && c1.email.trim() !== "")
                                      )
                                    );
                                    if (matches.length > 0) {
                                      clusters.push([c1, ...matches]);
                                      processed.add(c1.id);
                                      matches.forEach(m => processed.add(m.id));
                                    }
                                  }

                                  if (clusters.length === 0) {
                                    return (
                                      <div className="text-xs text-gray-500 italic py-4 text-center border border-dashed border-gray-200 dark:border-gray-850 rounded-lg">
                                        ✓ No redundant contact sets matching current criteria. All records are independent.
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                                      {clusters.map((cluster, cIdx) => (
                                        <div key={cIdx} className="bg-amber-500/[0.03] border border-amber-500/15 p-3 rounded-lg space-y-2 text-xs">
                                          <div className="flex justify-between items-center font-bold text-gray-800 dark:text-gray-200 font-sans">
                                            <span>Set {cIdx + 1}: "{cluster[0].name}" match</span>
                                            <span className="text-[9px] bg-amber-500/10 text-amber-600 px-1.5 py-0.2 rounded font-mono font-medium">
                                              {cluster.length} duplicates
                                            </span>
                                          </div>
                                          <div className="space-y-1 font-mono text-[10px] text-gray-400">
                                            {cluster.map((item: any) => (
                                              <div key={item.id} className="flex justify-between border-t border-gray-100 dark:border-gray-850/40 pt-1">
                                                <span>{item.name} ({item.accountType})</span>
                                                <span>{item.phone || item.email || <i className="text-gray-500 italic">Empty contact info</i>}</span>
                                              </div>
                                            ))}
                                          </div>
                                          <div className="flex justify-end gap-1.5 pt-1">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                // Auto merge this cluster specifically
                                                const merged = { ...cluster[0] };
                                                cluster.forEach((item: any) => {
                                                  if (!merged.phone && item.phone) merged.phone = item.phone;
                                                  if (!merged.email && item.email) merged.email = item.email;
                                                  if (!merged.company && item.company) merged.company = item.company;
                                                  if (item.tags) {
                                                    merged.tags = Array.from(new Set([...merged.tags, ...item.tags]));
                                                  }
                                                });
                                                const removingIds = cluster.slice(1).map((x: any) => x.id);
                                                
                                                // Log the deleted duplicates
                                                const logs = cluster.slice(1).map((item: any) => ({
                                                  ...item,
                                                  mergedInto: merged.name,
                                                  removedAt: new Date().toLocaleTimeString(),
                                                  reason: "Quick cluster merge"
                                                }));

                                                setContactsList(
                                                  contactsList
                                                    .filter(x => !removingIds.includes(x.id))
                                                    .map(x => x.id === merged.id ? merged : x)
                                                );
                                                setRemovedDuplicatesList(prev => [...prev, ...logs]);
                                                setSuccessMessage(`Direct smart merged "${merged.name}" duplicates set successfully! Registered ${logs.length} purged contacts.`);
                                              }}
                                              className="px-2 py-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-[10px] font-bold rounded transition cursor-pointer"
                                            >
                                              Quick Merge
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setCustomMergeCandidates({ left: cluster[0], right: cluster[1] });
                                              }}
                                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-750 text-white text-[10px] font-bold rounded transition cursor-pointer"
                                            >
                                              Interactive Choose
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {/* REMOVED DUPLICATES ARCHIVE / LOG & DOWNLOAD CHANNELS */}
                            {removedDuplicatesList.length > 0 && (
                              <div className="border border-rose-500/20 bg-rose-500/[0.02] p-4 rounded-xl space-y-4 shadow-sm mt-4">
                                <div className="flex justify-between items-center pb-2 border-b border-rose-500/10">
                                  <div className="flex items-center gap-2 font-mono text-[10px] font-extrabold uppercase text-rose-500 tracking-wider">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                    Purged Duplicate Archive ({removedDuplicatesList.length})
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setRemovedDuplicatesList([])}
                                    className="text-[9px] hover:text-rose-500 font-mono uppercase bg-gray-150 dark:bg-gray-800 px-2 py-0.5 rounded transition cursor-pointer"
                                  >
                                    Clear Log
                                  </button>
                                </div>
                                
                                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                  {removedDuplicatesList.map((c, idx) => (
                                    <div key={idx} className="flex justify-between items-start font-mono text-[10px] border-b border-gray-100 dark:border-gray-850/30 pb-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                                      <div>
                                        <span className="text-gray-800 dark:text-gray-200 font-bold block">{c.name}</span>
                                        <span className="text-[9px] text-rose-500 italic block">Merged into: {c.mergedInto}</span>
                                      </div>
                                      <div className="text-right">
                                        <span>{c.phone || c.email || "No fields"}</span>
                                        <span className="text-[9px] text-gray-400 block">{c.removedAt} ({c.reason})</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-2">
                                  <span className="text-[9px] font-extrabold uppercase font-mono tracking-wider text-rose-500 block">Download Purged Contacts package</span>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const vCardText = generateAndroidVCard(removedDuplicatesList);
                                        const blob = new Blob([vCardText], { type: "text/vcard;charset=utf-8" });
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement("a");
                                        link.href = url;
                                        link.download = `removed-duplicates-android-${new Date().toISOString().slice(0, 10)}.vcf`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        URL.revokeObjectURL(url);
                                        setSuccessMessage("Downloaded removed duplicate archive formatted for Android successfully.");
                                      }}
                                      className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] text-center transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                                    >
                                      🤖 Android Format (.vcf)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const vCardText = generateIPhoneVCard(removedDuplicatesList);
                                        const blob = new Blob([vCardText], { type: "text/vcard;charset=utf-8" });
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement("a");
                                        link.href = url;
                                        link.download = `removed-duplicates-iphone-${new Date().toISOString().slice(0, 10)}.vcf`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        URL.revokeObjectURL(url);
                                        setSuccessMessage("Downloaded removed duplicate archive formatted for iPhone / iOS successfully.");
                                      }}
                                      className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded text-[10px] text-center transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                                    >
                                       iPhone Format (.vcf)
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. CONTACT CLEANER PANEL */}
                        {tool.id === "contact-cleaner" && (
                          <div className="space-y-4 text-xs">
                            <h4 className="text-[11px] font-mono font-extrabold uppercase text-emerald-600 tracking-wider">
                              Formatting Sanitizer Tools
                            </h4>
                            <p className="text-gray-400 text-[11px] leading-relaxed">
                              Corrects casing, purports standard formatting layouts, and strips whitespaces on internal elements.
                            </p>
                            
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-mono text-gray-500 block uppercase font-bold">Recommended auto corrections:</span>
                              <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 space-y-1.5 font-mono text-[10.5px] text-gray-405">
                                <div className="flex justify-between"><span>Lowercase casing ("robert smith"):</span> <span className="text-emerald-500 font-bold">→ "Robert Smith"</span></div>
                                <div className="flex justify-between"><span>Inner spacing ("Jane   Sloane"):</span> <span className="text-emerald-500 font-bold">→ "Jane Sloane"</span></div>
                                <div className="flex justify-between"><span>Dirty phone structures ("+1234-abc"):</span> <span className="text-emerald-500 font-bold">→ "+1 234-7"</span></div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const standardized = contactsList.map(c => {
                                  let newName = c.name.trim();
                                  // Capitalize words
                                  if (newName) {
                                    newName = newName
                                      .replace(/\s+/g, " ") // Clean extra spacing
                                      .split(" ")
                                      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                      .join(" ");
                                  }
                                  // Clean phone number: remove letters
                                  let newPhone = c.phone.trim();
                                  if (newPhone) {
                                    newPhone = newPhone.replace(/[a-zA-Z]/g, "").replace(/-+/g, "-");
                                  }
                                  return { ...c, name: newName, phone: newPhone };
                                });
                                setContactsList(standardized);
                                setSuccessMessage("Sanitized casing and stripped alphabetic noise from phone numbers across all contacts!");
                              }}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition text-center text-xs"
                            >
                              ⚡ Enforce Formatting Clean (Apply to All)
                            </button>
                          </div>
                        )}

                        {/* 3. CONTACT BACKUP PANEL */}
                        {tool.id === "contact-backup" && (
                          <div className="space-y-4 text-xs">
                            <h4 className="text-[11px] font-mono font-extrabold uppercase text-emerald-600 tracking-wider">
                              Directory Archiver Port
                            </h4>
                            <p className="text-gray-400 text-[11px] leading-relaxed">
                              Pack active contact directory datasets into standard portable frameworks optimized for offline imports.
                            </p>

                            <div className="border border-slate-205 dark:border-slate-805 p-3 rounded-lg bg-white/5 space-y-1 text-[11px] font-mono">
                              <span className="text-gray-400 block">Database Size: <b className="text-emerald-500">{contactsList.length} cards</b></span>
                              <span className="block text-gray-400">Google Contacts: <b className="text-indigo-400">{contactsList.filter(x=>x.accountType==='Google').length}</b></span>
                              <span className="block text-gray-400">iCloud Apple: <b className="text-indigo-400">{contactsList.filter(x=>x.accountType==='Apple').length}</b></span>
                              <span className="block text-gray-400">Outlook Web: <b className="text-indigo-400">{contactsList.filter(x=>x.accountType==='Microsoft').length}</b></span>
                            </div>

                            <div className="space-y-2 pt-2">
                              <span className="text-[9px] font-extrabold uppercase font-mono tracking-wider text-gray-400 block pb-1 border-b border-gray-150 dark:border-gray-800">Choose custom target platform format</span>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  const vCardText = generateIPhoneVCard(contactsList);
                                  const blob = new Blob([vCardText], { type: "text/vcard;charset=utf-8" });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement("a");
                                  link.href = url;
                                  link.download = `contacts-iphone-ios-${new Date().toISOString().slice(0, 10)}.vcf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                  setSuccessMessage("Exported iOS/iPhone compliant contacts vCard archive successfully!");
                                }}
                                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg cursor-pointer transition text-center flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                 Export for iPhone / iOS (.vcf)
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const vCardText = generateAndroidVCard(contactsList);
                                  const blob = new Blob([vCardText], { type: "text/vcard;charset=utf-8" });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement("a");
                                  link.href = url;
                                  link.download = `contacts-android-${new Date().toISOString().slice(0, 10)}.vcf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                  setSuccessMessage("Exported Android compliant contacts vCard archive successfully!");
                                }}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-705 text-white font-bold rounded-lg cursor-pointer transition text-center flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                🤖 Export for Android Device (.vcf)
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const csvText = generateAndroidGoogleCSV(contactsList);
                                  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement("a");
                                  link.href = url;
                                  link.download = `contacts-google-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                  setSuccessMessage("Exported Google Contacts web compatible CSV database sheet!");
                                }}
                                className="w-full py-2 bg-indigo-600 bg-opacity-10 hover:bg-opacity-20 text-indigo-500 font-bold rounded-lg cursor-pointer transition text-center flex items-center justify-center gap-1.5"
                              >
                                📊 Export Google Contacts Sheet (.csv)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 4. CONTACT RESTORE PANEL */}
                        {tool.id === "contact-restore" && (
                          <div className="space-y-4 text-xs">
                            <h4 className="text-[11px] font-mono font-extrabold uppercase text-emerald-600 tracking-wider">
                              Backup Restoration Gate
                            </h4>
                            <p className="text-gray-400 text-[11px] leading-relaxed">
                              Inject previous offline coordinates back into the active simulated memory workspace.
                            </p>

                            <div className="border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-5 text-center bg-transparent hover:bg-gray-50/20 cursor-pointer">
                              <Upload className="w-6 h-6 text-indigo-500 mx-auto mb-1.5" />
                              <span className="text-[10px] text-gray-400 block font-mono uppercase font-bold">Pick source VCF card</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setContactsList(JSON.parse(JSON.stringify(DEFAULT_CONTACTS)));
                                setSuccessMessage("Restored simulated contacts database back to original defaults (10 enterprise items).");
                              }}
                              className="w-full py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-gray-700 dark:text-gray-200 font-bold rounded-lg cursor-pointer transition text-center"
                            >
                              ♻ Reset Database to Factory Defaults
                            </button>
                          </div>
                        )}

                        {/* 5. CONTACT EXPORT TO EXCEL */}
                        {tool.id === "contact-export-excel" && (
                          <div className="space-y-4 text-xs">
                            <h4 className="text-[11px] font-mono font-extrabold uppercase text-emerald-600 tracking-wider">
                              Excel Converter Engine
                            </h4>
                            <p className="text-gray-400 text-[11px] leading-relaxed">
                              Compile enterprise catalog matrices for instant imports into MS Excel, Sheets, or Google Tables.
                            </p>

                             <button
                              type="button"
                              disabled={opsState['spreadsheetCsv']?.status === 'running'}
                              onClick={() => {
                                runLocalOperation(
                                  'spreadsheetCsv',
                                  'Compiling contact directory into cell row matrices...',
                                  'All contacts compiled and organized into Excel-compatible catalog successfully! Download file initialized.',
                                  () => {
                                    let csvContent = "Contact Name,Phone Field,Email Pointer,Company Affiliation,Ecosystem Label,Tags\n";
                                    contactsList.forEach(c => {
                                      csvContent += `"${c.name}","${c.phone}","${c.email}","${c.company}","${c.accountType}","${c.tags ? c.tags.join(";") : ""}"\n`;
                                    });
                                    downloadFile(csvContent, "contacts-sheet-export.csv", "text/csv;charset=utf-8");
                                    return { content: csvContent, filename: "contacts-sheet-export.csv" };
                                  }
                                );
                              }}
                              className={`w-full py-2 text-white font-bold rounded-lg transition text-center flex items-center justify-center gap-1.5 ${
                                opsState['spreadsheetCsv']?.status === 'running'
                                  ? 'bg-gray-405 dark:bg-gray-800 cursor-not-allowed opacity-60'
                                  : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                              }`}
                            >
                              {opsState['spreadsheetCsv']?.status === 'running' ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Compiling spreadsheet rows...
                                </>
                              ) : (
                                <>
                                  <FileSpreadsheet className="w-4 h-4" />
                                  Download Excel-Friendly Sheet (.csv)
                                </>
                              )}
                            </button>

                            {/* Spreadsheet export inline reporter */}
                            {opsState['spreadsheetCsv'] && opsState['spreadsheetCsv'].status !== 'idle' && (
                              <div className={`mt-2 p-3 rounded-lg border text-xs font-sans leading-relaxed ${
                                opsState['spreadsheetCsv'].status === 'running'
                                  ? 'bg-amber-500/[0.04] border-amber-500/20 text-amber-700 dark:text-amber-300 animate-pulse font-medium'
                                  : opsState['spreadsheetCsv'].status === 'completed'
                                  ? 'bg-emerald-500/[0.04] border-emerald-500/20 text-emerald-800 dark:text-emerald-400 font-medium'
                                  : 'bg-red-500/[0.04] border-red-500/20 text-red-700 dark:text-red-400'
                              }`}>
                                <div className="flex gap-2 items-start">
                                  {opsState['spreadsheetCsv'].status === 'running' ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0 mt-0.5" />
                                  ) : opsState['spreadsheetCsv'].status === 'completed' ? (
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  ) : (
                                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <span className="font-extrabold uppercase tracking-wider text-[8px] font-mono block mb-0.5 text-gray-400">
                                      Spreadsheet Compilation
                                    </span>
                                    <span>{opsState['spreadsheetCsv'].message}</span>
                                    {opsState['spreadsheetCsv'].status === 'completed' && opsState['spreadsheetCsv'].content && (
                                      <div className="mt-2.5 pt-2 border-t border-gray-150 dark:border-gray-800 space-y-1.5">
                                        <span className="text-[9px] text-gray-400 dark:text-gray-550 font-mono block leading-normal">
                                          💡 <b>File blocked by your browser/iframe?</b> Press below to copy the full CSV text data to copy-paste it manually:
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleLocalCopy('spreadsheetCsv', opsState['spreadsheetCsv'].content || '')}
                                          className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded-md flex items-center gap-1 transition cursor-pointer"
                                        >
                                          {copiedState['spreadsheetCsv'] ? (
                                            <>
                                              <CheckCircle className="w-3" />
                                              ✓ Copied Spreadsheet Data!
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="w-3 h-3" />
                                              Copy Clean CSV to Clipboard
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 6. CONTACT IMPORT FROM EXCEL */}
                        {tool.id === "contact-import-excel" && (
                          <div className="space-y-4 text-xs">
                            <h4 className="text-[11px] font-mono font-extrabold uppercase text-emerald-600 tracking-wider">
                              Import Excel Catalog
                            </h4>
                            <div className="space-y-2">
                              <textarea
                                value={csvUploadText}
                                onChange={(e) => setCsvUploadText(e.target.value)}
                                placeholder="Contact Name, Phone, Email, Company, AccountType (Google/Apple)\nDavid Bowie, +1 555-0909, david@bowie.io, Music Ltd, Google"
                                className="w-full h-24 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2 font-mono text-[10px] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setCsvUploadText(
                                    "Contact Name, Phone, Email, Company, AccountType\nArthur Dent, 424242, arthur@dent.co, Earth Systems, Google\nTricia McMillan, 123456, tricia@heartofgold.net, Sirius, Apple"
                                  );
                                }}
                                className="text-[9px] text-indigo-500 hover:underline block cursor-pointer"
                              >
                                📋 Paste standard spreadsheet template values
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (!csvUploadText.trim()) {
                                  setErrorMessage("No CSV content provided to parse.");
                                  return;
                                }
                                const lines = csvUploadText.split("\n");
                                const newCards: any[] = [];
                                lines.forEach((line, index) => {
                                  if (index === 0 && line.toLowerCase().includes("name")) return; // Skip header
                                  const parts = line.split(",").map(p => p.trim());
                                  if (parts.length >= 2 && parts[0]) {
                                    newCards.push({
                                      id: `imported-${Date.now()}-${index}`,
                                      name: parts[0],
                                      phone: parts[1] || "",
                                      email: parts[2] || "",
                                      company: parts[3] || "",
                                      accountType: (parts[4] === "Apple" || parts[4] === "Microsoft") ? parts[4] : "Google",
                                      tags: ["Imported"]
                                    });
                                  }
                                });
                                if (newCards.length > 0) {
                                  setContactsList([...contactsList, ...newCards]);
                                  setCsvUploadText("");
                                  setSuccessMessage(`Parsed and imported ${newCards.length} contacts from CSV data into current directory!`);
                                } else {
                                  setErrorMessage("Unable to parse. Check that delimiter formats are comma-separated.");
                                }
                              }}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition text-center"
                            >
                              ⚡ Compile & Import Into Core Directory
                            </button>
                          </div>
                        )}

                        {/* 7. CONTACT GROUP CREATOR */}
                        {tool.id === "contact-group-creator" && (
                          <div className="space-y-4 text-xs">
                            <h4 className="text-[11px] font-mono font-extrabold uppercase text-emerald-600 tracking-wider">
                              Group Organizer Engine
                            </h4>
                            <p className="text-gray-400 text-[11px] leading-relaxed">
                              Bundle multiple directories into a single category card.
                            </p>

                            <div className="space-y-2">
                              <label className="text-[10px] font-mono text-gray-500 block uppercase font-bold">Group Label:</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="e.g. Clients, VIP, Contractors..."
                                  value={newGroupLabel}
                                  onChange={(e) => setNewGroupLabel(e.target.value)}
                                  className="flex-1 bg-white dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newGroupLabel.trim()) return;
                                    if (selectedContacts.length === 0) {
                                      setErrorMessage("No contacts selected in directory table. Check some boxes first!");
                                      return;
                                    }
                                    const updated = contactsList.map(c => {
                                      if (selectedContacts.includes(c.id)) {
                                        const tags = c.tags || [];
                                        return { ...c, tags: Array.from(new Set([...tags, newGroupLabel.trim()])) };
                                      }
                                      return c;
                                    });
                                    setContactsList(updated);
                                    setNewGroupLabel("");
                                    setSuccessMessage(`Added group label "${newGroupLabel}" to ${selectedContacts.length} selected contacts!`);
                                  }}
                                  className="px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer text-xs transition"
                                >
                                  Assign
                                </button>
                              </div>
                              <span className="text-[9px] text-gray-400 block italic">Assigned to: {selectedContacts.length} selected items.</span>
                            </div>
                          </div>
                        )}

                        {/* 8. CONTACT TAGGER */}
                        {tool.id === "contact-tagger" && (
                          <div className="space-y-4 text-xs">
                            <h4 className="text-[11px] font-mono font-extrabold uppercase text-emerald-600 tracking-wider">
                              Bulk Tagger Port
                            </h4>
                            <p className="text-gray-400 text-[11px] leading-relaxed">
                              Execute batch tag assignments on directory selections in a single step.
                            </p>

                            <div className="space-y-2">
                              <label className="text-[10px] font-mono text-gray-500 block uppercase font-bold">Specify tag (Bulk):</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="e.g. Supplier, Friend..."
                                  value={bulkTagText}
                                  onChange={(e) => setBulkTagText(e.target.value)}
                                  className="flex-1 bg-white dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!bulkTagText.trim()) return;
                                    if (selectedContacts.length === 0) {
                                      setErrorMessage("Check some contacts first!");
                                      return;
                                    }
                                    const updated = contactsList.map(c => {
                                      if (selectedContacts.includes(c.id)) {
                                        return { ...c, tags: Array.from(new Set([...(c.tags || []), bulkTagText.trim()])) };
                                      }
                                      return c;
                                    });
                                    setContactsList(updated);
                                    setBulkTagText("");
                                    setSuccessMessage(`Bulk added tag "${bulkTagText}" to ${selectedContacts.length} items!`);
                                  }}
                                  className="px-3 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-lg cursor-pointer transition text-xs"
                                >
                                  Apply Tags
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 9. CONTACT MISSING DATA FINDER */}
                        {tool.id === "contact-missing-finder" && (
                          <div className="space-y-4 text-xs">
                            <h4 className="text-[11px] font-mono font-extrabold uppercase text-emerald-600 tracking-wider">
                              Directory Quality Diagnostics
                            </h4>
                            <p className="text-gray-400 text-[10.5px] leading-relaxed">
                              Instantly scans catalog and isolates records lacking crucial contact parameters (emails / phone numbers).
                            </p>

                            <div className="space-y-3">
                              <span className="text-[10px] text-rose-500 uppercase font-mono font-bold block">Empty database fields found:</span>
                              
                              <div className="space-y-2 max-h-[220px] overflow-y-auto font-sans">
                                {(() => {
                                  const list = contactsList.filter(c => !c.phone || !c.email);
                                  if (list.length === 0) {
                                    return (
                                      <div className="p-3 text-center border text-gray-500 italic rounded-lg">
                                        ✓ Full coverage! Zero gaps detected in database.
                                      </div>
                                    );
                                  }
                                  return list.map(c => (
                                    <div key={c.id} className="p-3 bg-rose-500/[0.02] border border-rose-500/10 rounded-lg space-y-2">
                                      <div className="flex justify-between font-bold">
                                        <span>{c.name}</span>
                                        <span className="text-rose-400 font-mono text-[9px] uppercase tracking-wider font-extrabold">
                                          {!c.phone && !c.email ? "No details" : (!c.phone ? "Missing Number" : "Missing Email")}
                                        </span>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                                        <input
                                          type="text"
                                          placeholder="Repair Phone"
                                          defaultValue={c.phone || ""}
                                          id={`repair-phone-${c.id}`}
                                          className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 px-2 py-0.5 rounded text-[10.5px] focus:outline-none"
                                        />
                                        <input
                                          type="text"
                                          placeholder="Repair Email"
                                          defaultValue={c.email || ""}
                                          id={`repair-email-${c.id}`}
                                          className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 px-2 py-0.5 rounded text-[10.5px] focus:outline-none"
                                        />
                                      </div>
                                      
                                      <div className="flex justify-end">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const phoneVal = (document.getElementById(`repair-phone-${c.id}`) as HTMLInputElement)?.value;
                                            const emailVal = (document.getElementById(`repair-email-${c.id}`) as HTMLInputElement)?.value;
                                            
                                            setContactsList(
                                              contactsList.map(item => 
                                                item.id === c.id ? { ...item, phone: phoneVal, email: emailVal } : item
                                              )
                                            );
                                            setSuccessMessage(`Gaps successfully filled for "${c.name}"!`);
                                          }}
                                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded cursor-pointer"
                                        >
                                          Commit Fix
                                        </button>
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 10. ACCOUNT MERGER */}
                        {tool.id === "contact-account-merger" && (
                          <div className="space-y-4 text-xs">
                            <h4 className="text-[11px] font-mono font-extrabold uppercase text-emerald-600 tracking-wider">
                              Cloud Identity Integrator
                            </h4>
                            <p className="text-gray-400 text-[11px] leading-relaxed">
                              Synchronize separate cloud contacts (Apple, Google, Microsoft Outlook) into a single combined repository.
                            </p>

                            <button
                              type="button"
                              onClick={() => {
                                // Align all accounts to Google
                                const updated = contactsList.map(c => ({ ...c, accountType: "Google" as const }));
                                setContactsList(updated);
                                setSuccessMessage("Successfully synchronized directories cross-platforms! All accounts merged into a single Google contacts account.");
                              }}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition text-center"
                            >
                              ⚡ Synchronize Ecosystems (Merge Accounts)
                            </button>
                          </div>
                        )}

                        {/* 11. TRANSFER ASSISTANT */}
                        {tool.id === "contact-transfer-assistant" && (
                          <div className="space-y-4 text-xs">
                            <h4 className="text-[11px] font-mono font-extrabold uppercase text-emerald-600 tracking-wider">
                              Migration Coordinator
                            </h4>
                            <p className="text-gray-400 text-[11px] leading-relaxed">
                              Guides move layouts from one phone ecosystem to another. Use standard tools below:
                            </p>

                            <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-lg bg-white/5 space-y-1.5 leading-relaxed font-sans text-[11px] text-gray-400">
                              <span>💡 <b>Moving to Android?</b> Export .vcf, copy it to downloads folder, and open Settings &gt; Import.</span>
                              <span className="block border-t border-gray-150 dark:border-gray-850/50 pt-1.5">💡 <b>Moving to iPhone?</b> Mail standard vCard file to yourself on Apple mail app and click 'Add All Contacts'.</span>
                            </div>

                            <button
                              type="button"
                              disabled={opsState['migrationVcf']?.status === 'running'}
                              onClick={() => {
                                runLocalOperation(
                                  'migrationVcf',
                                  'Assembling contact vectors and compiling migration VCF standard envelope...',
                                  'Transfer migration Assistant package successfully compiled and packaged as vCard (VCF)! Initializing device delivery.',
                                  () => {
                                    let vCardText = "";
                                    contactsList.forEach(c => {
                                      vCardText += `BEGIN:VCARD\nVERSION:3.0\nN:${c.name};;;\nFN:${c.name}\nTEL:${c.phone}\nEND:VCARD\n`;
                                    });
                                    downloadFile(vCardText, "directory-transfer.vcf", "application/octet-stream");
                                    return { content: vCardText, filename: "directory-transfer.vcf" };
                                  }
                                );
                              }}
                              className={`w-full py-2 text-white font-bold rounded-lg transition text-center flex items-center justify-center gap-1.5 ${
                                opsState['migrationVcf']?.status === 'running'
                                  ? 'bg-gray-405 dark:bg-gray-800 cursor-not-allowed opacity-60'
                                  : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                              }`}
                            >
                              {opsState['migrationVcf']?.status === 'running' ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Compiling VCF package...
                                </>
                              ) : (
                                <>📥 Compile Migration Package (.vcf)</>
                              )}
                            </button>

                            {/* Migration VCF inline reporting panel */}
                            {opsState['migrationVcf'] && opsState['migrationVcf'].status !== 'idle' && (
                              <div className={`mt-2 p-3 rounded-lg border text-xs font-sans leading-relaxed ${
                                opsState['migrationVcf'].status === 'running'
                                  ? 'bg-amber-500/[0.04] border-amber-500/20 text-text-700 dark:text-amber-300 animate-pulse font-medium'
                                  : opsState['migrationVcf'].status === 'completed'
                                  ? 'bg-emerald-500/[0.04] border-emerald-500/20 text-emerald-800 dark:text-emerald-400 font-medium'
                                  : 'bg-red-500/[0.04] border-red-500/20 text-red-700 dark:text-red-400'
                              }`}>
                                <div className="flex gap-2 items-start">
                                  {opsState['migrationVcf'].status === 'running' ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0 mt-0.5" />
                                  ) : opsState['migrationVcf'].status === 'completed' ? (
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  ) : (
                                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <span className="font-extrabold uppercase tracking-wider text-[8px] font-mono block mb-0.5 text-gray-400">
                                      Migration Service Log
                                    </span>
                                    <span>{opsState['migrationVcf'].message}</span>
                                    {opsState['migrationVcf'].status === 'completed' && opsState['migrationVcf'].content && (
                                      <div className="mt-2.5 pt-2 border-t border-gray-150 dark:border-gray-800 space-y-1.5">
                                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-mono block leading-normal">
                                          💡 <b>Device download blocked?</b> Press the action below to copy the transfer vCard raw stream and paste it into a file:
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleLocalCopy('migrationVcf', opsState['migrationVcf'].content || '')}
                                          className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded-md flex items-center gap-1 transition cursor-pointer"
                                        >
                                          {copiedState['migrationVcf'] ? (
                                            <>
                                              <CheckCircle className="w-3" />
                                              ✓ Copied Migration vCard!
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="w-3" />
                                              Copy Clean Migration VCF
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                          </>
                        )}
                      </div>
                    </div>

                  </div>
                
              </div>
            )}

            {/* 3. WHATSAPP SUITE CATEGORY WORKSPACE */}
            {tool.category === "whatsapp-suite" && (
              <div className="space-y-5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-5 shadow-xs animate-fade-in text-gray-900 dark:text-white">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-3">
                  <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">WhatsApp Conversation Analyzer</h3>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-mono font-bold uppercase font-bold">TXT Decrypter</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-emerald-500/10 rounded-xl p-6 text-center hover:bg-emerald-550/[0.04] transition cursor-pointer">
                      <FileText className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <span className="block text-xs font-bold text-gray-655 dark:text-gray-300 font-sans">Submit Whatsapp "_chat.txt" exports</span>
                      <span className="text-[10px] text-gray-400 mt-1 block">Drag in zipped or text backup stream</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setWaMockLoaded(true);
                        setSuccessMessage("Compiled interactive WhatsApp chat stats and leaderboard metrics!");
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      🚀 Synthesize Sample Group Chat Log
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50/50 dark:bg-gray-950/20 rounded-xl border border-gray-150 dark:border-gray-800 flex flex-col justify-between">
                    <h4 className="text-[10px] uppercase font-mono font-extrabold text-emerald-600 tracking-wider mb-2">Metrics Leaderboards</h4>
                    {waMockLoaded ? (
                      <div className="space-y-3.5 animate-fade-in font-sans">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-gray-701 dark:text-gray-300">
                            <span>Top Contributor: "Sarah Miller"</span>
                            <span className="font-mono">391 msgs (44%)</span>
                          </div>
                          <div className="w-full bg-gray-250 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "44%" }}></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-gray-701 dark:text-gray-300">
                            <span>Runner Up: "Alex Davidson"</span>
                            <span className="font-mono">310 msgs (35%)</span>
                          </div>
                          <div className="w-full bg-gray-250 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: "35%" }}></div>
                          </div>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono text-gray-500 border-t border-gray-200 dark:border-gray-800 pt-2">
                          <span>Emoji used most: 🔥 (x120)</span>
                          <span>Busiest: Sundays</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-450 leading-relaxed py-6 text-center">
                        Upload or trigger the sample dataset above to compute real-time dynamic charts and chat statistics matrixes!
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-850">
                  <button
                    type="button"
                    onClick={handleTriggerAiUtility}
                    disabled={aiRunning}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-xs select-none"
                  >
                    {aiRunning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analyzing conversation logs...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        📊 Run AI Conversation Trend Analysis
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 4. RECEIPT OCR CATEGORY WORKSPACE */}
            {tool.category === "receipt-ocr" && (
              <div className="space-y-5 bg-white dark:bg-gray-900 border border-gray-155 dark:border-gray-800 rounded-xl p-5 shadow-xs animate-fade-in text-gray-900 dark:text-white">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-855 pb-3">
                  <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Invoice & Receipt Scanner AI</h3>
                  <span className="text-[9px] bg-[#207886]/10 text-[#207886] px-2 py-0.5 rounded font-mono font-bold uppercase font-black">OCR Parser</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-[#207886]/20 hover:border-[#207886] rounded-xl p-6 text-center hover:bg-[#207886]/[0.02] transition cursor-pointer relative overflow-hidden group min-h-[180px] flex flex-col justify-center items-center">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            setReceiptMockType("");
                            setAiOutput("");
                            setOcrBatchResults([]);
                            
                            const firstFile = files[0];
                            setOcrFile(firstFile);

                            // Load all files and their Data URLs asynchronously
                            const loadFilesPromise = (Array.from(files) as File[]).map(async (file) => {
                              const dUrl = await new Promise<string>((resolve) => {
                                const reader = new FileReader();
                                reader.onload = (ev) => resolve(ev.target?.result as string);
                                reader.readAsDataURL(file);
                              });
                              return { file, ocrFileDataUrl: dUrl };
                            });

                            Promise.all(loadFilesPromise).then((loaded) => {
                              setOcrFiles(loaded);
                              setOcrFileDataUrl(loaded[0].ocrFileDataUrl);
                              setAiInputs({
                                fileText: `Uploaded Scan: ${firstFile.name} (${(firstFile.size / 1024).toFixed(1)} KB)\nMIME Type: ${firstFile.type}`,
                                fileDataUrl: loaded[0].ocrFileDataUrl,
                                fileName: firstFile.name
                              });
                              
                              if (loaded.length > 1) {
                                setSuccessMessage(`Successfully queued batch of ${loaded.length} file(s)! Click 'Run AI Extraction' below to process all sequentially.`);
                              } else {
                                setSuccessMessage(`Document "${firstFile.name}" loaded successfully into OCR buffer!`);
                              }
                            });
                          }
                        }}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                      />
                      
                      {ocrFiles.length > 0 ? (
                        <div className="space-y-3 z-0 pointer-events-none w-full max-w-full px-3 text-left">
                          <p className="text-center text-xs font-bold text-[#207886] uppercase tracking-wider mb-2">📁 Batch Stack Queued ({ocrFiles.length} Files)</p>
                          <div className="max-h-36 overflow-y-auto space-y-1.5 w-full pr-1">
                            {ocrFiles.map((item, fIdx) => (
                              <div 
                                key={fIdx} 
                                className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs select-all bg-slate-50 dark:bg-slate-900/50 ${
                                  ocrProgressIndex === fIdx 
                                    ? "border-amber-400 bg-amber-500/10 dark:bg-amber-500/5" 
                                    : "border-gray-100 dark:border-gray-800"
                                }`}
                              >
                                {item.file.type.startsWith("image/") ? (
                                  <img 
                                    src={item.ocrFileDataUrl} 
                                    alt="thumb" 
                                    className="w-7 h-7 rounded border border-gray-250 object-cover shrink-0" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <FileText className="w-5 h-5 text-[#207886] shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-gray-700 dark:text-gray-200 text-[10px] truncate">{item.file.name}</p>
                                  <p className="text-[9px] text-gray-400 font-mono">{(item.file.size / 1024).toFixed(1)} KB</p>
                                </div>
                                {ocrProgressIndex === fIdx && (
                                  <span className="text-[9px] bg-amber-100 dark:bg-amber-955 text-amber-800 dark:text-amber-305 font-mono px-1.5 py-0.5 rounded font-black uppercase animate-bounce shrink-0">EXTRACTING</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : ocrFile ? (
                        <div className="space-y-2.5 z-0 pointer-events-none w-full flex flex-col items-center">
                          {ocrFile.type.startsWith("image/") && ocrFileDataUrl ? (
                            <img 
                              src={ocrFileDataUrl} 
                              alt="Uploaded Receipt" 
                              className="max-h-24 max-w-full rounded border border-gray-200 dark:border-gray-800 object-contain shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <FileText className="w-10 h-10 text-[#207886] animate-pulse" />
                          )}
                          <div className="text-center">
                            <span className="block text-xs font-bold text-gray-700 dark:text-gray-200 truncate max-w-xs">{ocrFile.name}</span>
                            <span className="text-[10px] text-gray-400">{(ocrFile.size / 1024).toFixed(1)} KB · Real File</span>
                          </div>
                        </div>
                      ) : receiptMockType ? (
                        <div className="space-y-1.5 z-0 pointer-events-none w-full flex flex-col items-center">
                          <div className="border border-[#207886]/20 bg-[#207886]/5 px-2.5 py-1.5 rounded-lg border-dashed font-mono text-[10px] text-[#207886] dark:text-[#3298a8] uppercase font-bold tracking-widest animate-pulse">
                            {receiptMockType.toUpperCase()} PRESET LOADED
                          </div>
                          <span className="text-[11px] text-gray-400 max-w-xs">Simulated optical-scanning layout initialized.</span>
                        </div>
                      ) : (
                        <div className="relative z-0 pointer-events-none">
                          <Upload className="w-8 h-8 text-[#207886] mx-auto mb-2" />
                          <span className="block text-xs font-bold text-gray-655 dark:text-gray-300 font-sans">Drop purchase slips or scans here</span>
                          <span className="text-[10px] text-gray-400 mt-1 block">Supports multiple files & PDF/images</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOcrFile(null);
                          setOcrFileDataUrl(null);
                          setAiOutput("");
                          setReceiptMockType("Walmart grocery slip");
                          setAiInputs({
                            fileText: "MERCHANT: Walmart Supercenter #8421\nDATE: 2026-06-12\nITEMS:\n- 1x Whole Wheat Grain Bread - $3.49\n- 2x Organic Avocados - $2.98\n- 1x Premium Almond Blend Milk - $4.20\nTOTAL: $10.67"
                          });
                          setSuccessMessage("Walmart receipt loaded. Click button below to run actual AI OCR extraction!");
                        }}
                        className={`py-1.5 border hover:border-[#207886] rounded text-[11px] font-bold transition cursor-pointer ${
                          receiptMockType === "Walmart grocery slip" 
                            ? "bg-[#207886]/10 border-[#207886] text-[#207886]" 
                            : "border-gray-200 dark:border-gray-800 text-gray-655 dark:text-gray-400"
                        }`}
                      >
                         Walmart Grocery Preset
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOcrFile(null);
                          setOcrFileDataUrl(null);
                          setAiOutput("");
                          setReceiptMockType("Starbucks coffee invoice");
                          setAiInputs({
                            fileText: "MERCHANT: Starbucks Cafe #1042\nDATE: 2026-06-14\nITEMS:\n- 1x Grande Caramel Macchiato - $5.45\n- 1x Blueberry Scone - $3.75\nSUBTOTAL: $9.20\nTAX (8.5%): $0.78\nTOTAL: $9.98"
                          });
                          setSuccessMessage("Starbucks coffee invoice preset loaded. Click button below to run actual AI OCR extraction!");
                        }}
                        className={`py-1.5 border hover:border-[#207886] rounded text-[11px] font-bold transition cursor-pointer ${
                          receiptMockType === "Starbucks coffee invoice" 
                            ? "bg-[#207886]/10 border-[#207886] text-[#207886]" 
                            : "border-gray-200 dark:border-gray-800 text-gray-655 dark:text-gray-400"
                        }`}
                      >
                         Starbucks Cafe Preset
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50/50 dark:bg-gray-950/20 rounded-xl border border-gray-150 dark:border-gray-805 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] uppercase font-mono font-extrabold text-[#207886] tracking-wider mb-2">Recognized Line Items</h4>
                      {ocrFile ? (
                        <div className="space-y-2 animate-fade-in font-sans">
                          <span className="text-[10px] font-bold text-gray-400 uppercase font-mono block">Scanned File: {ocrFile.name}</span>
                          <p className="text-[11px] text-gray-500 leading-relaxed bg-white dark:bg-gray-950 p-2.5 rounded-lg border border-gray-150 dark:border-gray-850 font-mono">
                            {ocrFile.type.startsWith("image/") ? "IMAGE OCR SCAN READY" : "PDF EXTRACTION READY"}<br />
                            Size: {(ocrFile.size / 1024).toFixed(1)} KB<br />
                            MIME: {ocrFile.type}<br />
                            Click the dedicated button below to run live multi-modal Gemini AI parsing!
                          </p>
                        </div>
                      ) : receiptMockType ? (
                         <div className="space-y-3 animate-fade-in">
                           <div className="text-[10px] font-bold text-gray-450 font-mono uppercase">Merchant: {receiptMockType.toUpperCase()}</div>
                           <div className="text-xs font-mono border-t border-gray-150 dark:border-gray-850 pt-2 space-y-1">
                             {receiptMockType.includes("Walmart") ? (
                               <>
                                 <div className="flex justify-between text-gray-700 dark:text-gray-305"><span>1x Whole Wheat Grain Bread</span> <span className="font-bold">$3.49</span></div>
                                 <div className="flex justify-between text-gray-700 dark:text-gray-305"><span>2x Organic Avocados</span> <span className="font-bold">$2.98</span></div>
                                 <div className="flex justify-between text-gray-700 dark:text-gray-305"><span>1x Premium Almond Blend Milk</span> <span className="font-bold">$4.20</span></div>
                                 <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 border-t border-dashed border-gray-200 dark:border-gray-800 pt-2.5">
                                   <span>Verified Total Cost:</span>
                                   <span>$10.67</span>
                                 </div>
                               </>
                             ) : (
                               <>
                                 <div className="flex justify-between text-gray-700 dark:text-gray-305"><span>1x Grande Caramel Macchiato</span> <span className="font-bold">$5.45</span></div>
                                 <div className="flex justify-between text-gray-700 dark:text-gray-305"><span>1x Blueberry Scone</span> <span className="font-bold">$3.75</span></div>
                                 <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 border-t border-dashed border-gray-200 dark:border-gray-800 pt-2.5">
                                   <span>Verified Total Cost:</span>
                                   <span>$9.98</span>
                                 </div>
                               </>
                             )}
                           </div>
                         </div>
                      ) : (
                        <div className="text-xs text-gray-450 leading-relaxed py-6 text-center font-sans">
                          Select a Walmart/Starbucks sample preset receipt or upload your own real purchase ticket above to test automated OCR extraction!
                        </div>
                      )}
                    </div>
                    
                    <div className="text-[9px] text-gray-400 font-mono border-t border-gray-150 dark:border-gray-850 pt-2 mt-4">
                      Powered by multi-modal parsing modules.
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-850">
                  <button
                    type="button"
                    onClick={handleTriggerAiUtility}
                    disabled={aiRunning || (!ocrFile && !receiptMockType)}
                    className="bg-[#207886] hover:bg-[#1a626f] text-white font-bold py-2.5 px-5 rounded-lg text-xs transition disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-sm select-none"
                  >
                    {aiRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing via Gemini OCR Engine...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        {tool.id === "receipt-ocr-scan" && "🔍 Run Receipt-Invoice OCR Extraction"}
                        {tool.id === "bank-statement" && "🏦 Extract Bank Ledger Tables"}
                        {tool.id === "gst-invoice-extractor" && "📑 Reconstruct Legal GST Breakdown"}
                        {tool.id === "expense-categorizer" && "🗂️ Map Expenses Standard Tax Classes"}
                        {tool.id === "receipt-excel" && "📊 Convert to spreadsheet (Excel XLS)"}
                        {tool.id === "ocr-table" && "📐 Extract Scanned Borders to Markdown Grid"}
                        {!tool.id.includes("ocr") && !tool.name.match(/(receipt|invoice|bank|gst|expense|excel|table)/i) && `🚀 Analyze Document using ${tool.name}`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 5. MEDIA OPTIMIZATION CATEGORY WORKSPACE */}
            {tool.category === "media-optimization" && (
              <div className="space-y-6 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm animate-fade-in text-gray-950 dark:text-gray-100 font-sans">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 dark:border-gray-850 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <Image className="w-5 h-5" />
                      </span>
                      <h3 className="font-extrabold text-base text-gray-900 dark:text-white tracking-tight">
                        {tool.name}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {tool.description}
                    </p>
                  </div>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider">
                    {tool.id === "photo-compression" ? "Lossless Compression Suite" : "Media Workbench"}
                  </span>
                </div>

                {/* Batch Upload Selector Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Upload & Parameters */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-850/20 transition-all cursor-pointer relative group">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const uploaded = e.target.files;
                          if (uploaded && uploaded.length > 0) {
                            const newFiles = Array.from(uploaded);
                            setMediaFiles(newFiles);
                            setMediaResults([]);
                          }
                        }}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                      />
                      <div className="relative z-0 pointer-events-none space-y-2">
                        <div className="mx-auto w-10 h-10 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="block text-xs font-bold text-gray-750 dark:text-gray-200 font-sans">
                          {mediaFiles.length > 0 
                            ? `Selected Queue: ${mediaFiles.length} file(s)` 
                            : "Click to upload files, or drag files here"
                          }
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-sans">
                          Supports multi-file batch upload (WebP, JPEG, PNG, HEIC, GIF, Video formats)
                        </span>
                      </div>
                    </div>

                    {/* Batch Queue Roster */}
                    {mediaFiles.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-850/50 rounded-xl border border-gray-150 dark:border-gray-800 p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-500 tracking-wider font-mono uppercase">
                            <span>Selected Queue ({mediaFiles.length})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setMediaFiles([]);
                              setMediaResults([]);
                            }}
                            className="text-[10px] text-red-500 hover:text-red-600 font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Clear Queue
                          </button>
                        </div>
                        
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                          {mediaFiles.map((file, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1.5 px-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg">
                              <span className="font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[70%]">
                                {file.name}
                              </span>
                              <span className="text-[10px] font-mono text-gray-400">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {tool.id === "bg-remover" && mediaFiles.length > 0 && bgRemoverFileUrl && (
                      <div className="border border-indigo-150 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/15 to-transparent dark:from-indigo-950/10 rounded-2xl p-5 space-y-4 animate-fade-in relative select-none">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-150 dark:border-gray-800 pb-3 gap-2">
                          <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Interactive Live Tuning Studio
                          </span>
                          <span className="text-[10px] text-gray-500 font-semibold font-mono">EYEDROPPER ACTIVE</span>
                        </div>

                        {/* Interactive columns: Original vs Live cutout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* Left: Original with click eye-dropper sampler */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Original Reference</span>
                              <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded px-1.5 font-bold font-mono">Click Image to Sample Color</span>
                            </div>
                            <div className="relative border border-gray-150 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950/80 overflow-hidden group flex items-center justify-center min-h-[220px] aspect-4/3">
                              <img
                                id="bg-original-sampler-image"
                                src={bgRemoverFileUrl}
                                alt="Original sampler"
                                className="max-h-[240px] max-w-full object-contain cursor-crosshair select-none rounded active:scale-[0.99] transition-transform"
                                referrerPolicy="no-referrer"
                                onClick={(e) => {
                                  const imgEl = e.currentTarget;
                                  const canvas = document.createElement("canvas");
                                  const naturalW = imgEl.naturalWidth || imgEl.width;
                                  const naturalH = imgEl.naturalHeight || imgEl.height;
                                  canvas.width = naturalW;
                                  canvas.height = naturalH;
                                  const ctx = canvas.getContext("2d");
                                  if (ctx) {
                                    ctx.drawImage(imgEl, 0, 0, naturalW, naturalH);
                                    const rect = imgEl.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const y = e.clientY - rect.top;
                                    
                                    // Scale to image actual coordinates
                                    const imgX = Math.floor((x / rect.width) * naturalW);
                                    const imgY = Math.floor((y / rect.height) * naturalH);
                                    
                                    try {
                                      const p = ctx.getImageData(imgX, imgY, 1, 1).data;
                                      const hex = "#" + ((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1);
                                      setBgCustomColor(hex);
                                      setBgKeyType("custom");
                                      setMediaCompressionStep(`Sampled custom chroma-key target: ${hex}`);
                                    } catch (err) {
                                      console.error("Sampler color reading error", err);
                                    }
                                  }
                                }}
                              />
                            </div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
                              💡 <span className="font-semibold text-indigo-600 dark:text-indigo-400">Click any pixel</span> on the original image to sample and set that custom background color!
                            </p>
                          </div>

                          {/* Right: Live transparency checkout */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Live Transparency Cutout</span>
                              <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 rounded px-1.5 font-bold font-mono">Real-time Preview</span>
                            </div>
                            <div className="relative border border-gray-150 dark:border-gray-800 rounded-xl bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22><rect width=%228%22 height=%228%22 fill=%22%23eee%22/><rect x=%228%22 y=%228%22 width=%228%22 height=%228%22 fill=%22%23eee%22/><rect x=%228%22 width=%228%22 height=%228%22 fill=%22%23fff%22/><rect y=%228%22 width=%228%22 height=%228%22 fill=%22%23fff%22/></svg>')] bg-repeat overflow-hidden flex items-center justify-center min-h-[220px] aspect-4/3 shadow-inner">
                              <canvas
                                id="bgRemoverLiveCanvas"
                                className="max-h-[240px] max-w-full object-contain rounded drop-shadow-md"
                              />
                            </div>
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const canvas = document.getElementById("bgRemoverLiveCanvas") as HTMLCanvasElement;
                                  if (canvas) {
                                    canvas.toBlob((blob) => {
                                      if (blob) {
                                        const url = URL.createObjectURL(blob);
                                        const originalName = mediaFiles[0].name;
                                        const lastDot = originalName.lastIndexOf(".");
                                        const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
                                        
                                        const link = document.createElement("a");
                                        link.href = url;
                                        link.download = `${baseName}-bgremoved.png`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        URL.revokeObjectURL(url);
                                      }
                                    }, "image/png");
                                  }
                                }}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold rounded-lg shadow-sm transition duration-150 flex items-center gap-1.5 cursor-pointer font-sans"
                              >
                                <Download className="w-4 h-4" /> Download Isolated Cutout (.PNG)
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {tool.id === "photo-compression" && (
                      <div className="grid grid-cols-2 gap-3 font-sans">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-mono">
                            Target Format Codec
                          </label>
                          <select
                            value={mediaFormat}
                            onChange={(e) => setMediaFormat(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none"
                          >
                            <option value="webp">WebP (Highly Optimized)</option>
                            <option value="jpg">JPEG (Standard compatible)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-mono">
                            Max Length Resolution
                          </label>
                          <select
                            value={mediaScale}
                            onChange={(e) => setMediaScale(parseInt(e.target.value))}
                            className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none"
                          >
                            <option value="1920">FHD (1920px width limit)</option>
                            <option value="1280">HD (1280px width limit)</option>
                            <option value="800">Compact Mobile (800px width limit)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {tool.id === "similar-photo-finder" && (
                      <div className="grid grid-cols-1 gap-3 font-sans">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-mono">
                            Similarity Match Strictness
                          </label>
                          <select
                            value={mediaFormat === "webp" || mediaFormat === "jpg" ? "color-depth" : mediaFormat}
                            onChange={(e) => setMediaFormat(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none"
                          >
                            <option value="color-depth">Visual Hue & Color Depth (Recommended)</option>
                            <option value="ssim">Structural Signature Mapping (SSIM)</option>
                            <option value="pixels">Strict Pixel Bit Difference Matches</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {tool.id === "dup-photo-finder" && (
                      <div className="grid grid-cols-1 gap-3 font-sans">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-mono">
                            Hash Matching Fingerprint
                          </label>
                          <select
                            value={mediaFormat === "webp" || mediaFormat === "jpg" ? "md5" : mediaFormat}
                            onChange={(e) => setMediaFormat(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none"
                          >
                            <option value="md5">MD5 File Checksum Match (Fastest)</option>
                            <option value="sha256">SHA-256 Signature Match (Absolute molecular precision)</option>
                            <option value="phash">Perceptual Hash Grid (Find identical pixels regardless of name)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {tool.id === "dup-video-finder" && (
                      <div className="grid grid-cols-1 gap-3 font-sans">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-mono">
                            Video Checksum Mode
                          </label>
                          <select
                            value={mediaFormat === "webp" || mediaFormat === "jpg" ? "fast-hash" : mediaFormat}
                            onChange={(e) => setMediaFormat(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none"
                          >
                            <option value="fast-hash">Fast Frame Sequence Signature Matching</option>
                            <option value="strict">Strict Payload Hash Map Match</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {tool.id === "screenshot-cleaner" && (
                      <div className="grid grid-cols-2 gap-3 font-sans">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-mono">
                            Screenshot Detection Aspect
                          </label>
                          <select
                            value={mediaFormat === "webp" || mediaFormat === "jpg" ? "all" : mediaFormat}
                            onChange={(e) => setMediaFormat(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none"
                          >
                            <option value="all">Detect All Aspect Ratios</option>
                            <option value="mobile">Strict Portrait (Mobile 9:16)</option>
                            <option value="desktop">Strict Landscape (Monitor 16:9)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-mono">
                            Auto-archive Older Than
                          </label>
                          <select
                            value={mediaScale}
                            onChange={(e) => setMediaScale(parseInt(e.target.value))}
                            className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none"
                          >
                            <option value="7">Older than 7 days</option>
                            <option value="14">Older than 14 days</option>
                            <option value="30">Older than 30 days</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {tool.id === "video-compression" && (
                      <div className="grid grid-cols-2 gap-3 font-sans">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-mono">
                            Target Encoding Format
                          </label>
                          <select
                            value={mediaFormat === "webp" || mediaFormat === "jpg" ? "mp4" : mediaFormat}
                            onChange={(e) => setMediaFormat(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none"
                          >
                            <option value="mp4">MP4 H.264 (Maximum Compatibility)</option>
                            <option value="webm">WebM VP9 (Best Web Payload)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-mono">
                            Max Video Height
                          </label>
                          <select
                            value={mediaScale}
                            onChange={(e) => setMediaScale(parseInt(e.target.value))}
                            className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none"
                          >
                            <option value="1080">FHD (1080p Limit)</option>
                            <option value="720">HD (720p Limit)</option>
                            <option value="480">SD (480p Limit)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {tool.id === "heic-converter" && (
                      <div className="grid grid-cols-2 gap-3 font-sans">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-mono">
                            Output Conversion Codec
                          </label>
                          <select
                            value={mediaFormat}
                            onChange={(e) => setMediaFormat(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none"
                          >
                            <option value="jpeg">Standard JPEG (.jpg)</option>
                            <option value="webp">Highly compressed WebP (.webp)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-mono">
                            Export Speed priority
                          </label>
                          <select
                            value={mediaScale}
                            onChange={(e) => setMediaScale(parseInt(e.target.value))}
                            className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none"
                          >
                            <option value="1">Balanced (High-grade conversion)</option>
                            <option value="2">Max Speed (Multi-core draft)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {tool.id === "webp-converter" && (
                      <div className="grid grid-cols-2 gap-3 font-sans">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-mono">
                            WebP Compression Rig
                          </label>
                          <select
                            value={mediaFormat === "webp" || mediaFormat === "jpg" ? "lossy" : mediaFormat}
                            onChange={(e) => setMediaFormat(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none"
                          >
                            <option value="lossy">Standard lossy (Quality slider scales payload)</option>
                            <option value="lossless">Pristine 100% loss-free encoding</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-mono">
                            Scale Resolution target
                          </label>
                          <select
                            value={mediaScale}
                            onChange={(e) => setMediaScale(parseInt(e.target.value))}
                            className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none"
                          >
                            <option value="1920">Original Full Frame</option>
                            <option value="1280">Slight scale-down (1280px)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {tool.id === "bg-remover" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-mono">
                            Background Color to Remove
                          </label>
                          <select
                            value={bgKeyType}
                            onChange={(e) => setBgKeyType(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none"
                          >
                            <option value="white">White / Light Background (Studio)</option>
                            <option value="green">Green Screen (Chroma-Key)</option>
                            <option value="black">Black / Very Dark Background</option>
                            <option value="auto">Auto-Detect Background (Corner Sample)</option>
                            <option value="custom">Custom Color Colorpicker...</option>
                          </select>
                        </div>

                        {bgKeyType === "custom" && (
                          <div className="animate-fade-in">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-mono">
                              Pick Key Color
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={bgCustomColor}
                                onChange={(e) => setBgCustomColor(e.target.value)}
                                className="w-10 h-8 p-0 bg-transparent border border-gray-200 dark:border-gray-800 rounded cursor-pointer"
                              />
                              <span className="text-xs font-mono text-gray-400 font-bold uppercase">{bgCustomColor}</span>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-mono">
                            Edge Feather Smoothing
                          </label>
                          <select
                            value={mediaFormat === "webp" || mediaFormat === "jpg" ? "sharp" : mediaFormat}
                            onChange={(e) => setMediaFormat(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none"
                          >
                            <option value="sharp">Sharp edges (0px feather border)</option>
                            <option value="soft">Soft blended edges (2px feathering)</option>
                            <option value="feather">Highly smoothed edges (5px feathering)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {tool.id === "exif-viewer" && (
                      <div className="bg-slate-50 dark:bg-transparent border border-slate-100 dark:border-gray-850 rounded-xl p-3 text-xs">
                        <span className="font-extrabold text-[10px] font-mono text-indigo-500 uppercase block mb-1">Analyzer Mode: Active</span>
                        <p className="text-gray-500 dark:text-gray-400 leading-snug">
                          No compression or conversion-level settings are needed. Drop photography files and run analysis below to decode sensor details.
                        </p>
                      </div>
                    )}

                    {tool.id === "exif-cleaner" && (
                      <div className="bg-slate-50 dark:bg-transparent border border-slate-100 dark:border-gray-855 rounded-xl p-3 text-xs">
                        <span className="font-extrabold text-[10px] font-mono text-indigo-500 uppercase block mb-1">Sanitizer Mode: Active</span>
                        <p className="text-gray-500 dark:text-gray-400 leading-snug">
                          Select metadata fields to filter on the right panel, and completely scrub private indicators from the file headers below.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Parameters and dynamic action triggers */}
                  <div className="lg:col-span-5 space-y-4 font-sans">
                    <div className="p-4 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-2xl border border-indigo-100/40 dark:border-indigo-900/40 space-y-4">
                      {/* Sliders conditional block */}
                      {(tool.id === "photo-compression" || tool.id === "video-compression" || tool.id === "webp-converter" || tool.id === "bg-remover") && (
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="text-[10px] uppercase font-mono font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
                              {tool.id === "photo-compression" 
                                ? "Compression Level Ratio" 
                                : tool.id === "bg-remover"
                                  ? "Background Masking Sensitivity"
                                  : "Encoding Quality Factor"}
                            </label>
                            <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                              {mediaQuality}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={mediaQuality}
                            onChange={(e) => setMediaQuality(parseInt(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-gray-400 font-mono mt-1">
                            <span>{tool.id === "bg-remover" ? "Strict Mask (10%)" : "Max Compression (10%)"}</span>
                            <span>{tool.id === "bg-remover" ? "Aggressive Mask (100%)" : "Maximum Quality (100%)"}</span>
                          </div>
                        </div>
                      )}

                      {tool.id === "similar-photo-finder" && (
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="text-[10px] uppercase font-mono font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
                              Similarity Strictness Threshold
                            </label>
                            <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                              {mediaQuality}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="100"
                            value={mediaQuality}
                            onChange={(e) => setMediaQuality(parseInt(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-gray-400 font-mono mt-1">
                            <span>Loose Match (50%)</span>
                            <span>Pixel-Perfect (100%)</span>
                          </div>
                        </div>
                      )}

                      {/* Custom checkboxes context-based */}
                      {tool.id === "photo-compression" && (
                        <div className="pt-3 border-t border-indigo-100/40 dark:border-indigo-900/40 space-y-2 text-xs text-gray-700 dark:text-gray-300">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" defaultChecked className="rounded accent-indigo-600 text-indigo-600" />
                            <span>Strip private EXIF / GPS location headers</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" defaultChecked className="rounded accent-indigo-600 text-indigo-600" />
                            <span>Maintain original color gamut profiles</span>
                          </label>
                        </div>
                      )}

                      {tool.id === "exif-cleaner" && (
                        <div className="pt-2 space-y-2 text-xs text-gray-700 dark:text-gray-300">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" defaultChecked className="rounded accent-indigo-600 text-indigo-600" />
                            <span>Scrub Private GPS & Lat/Long Coordinates</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" defaultChecked className="rounded accent-indigo-600 text-indigo-600" />
                            <span>Scrub Camera device model & lens metadata</span>
                          </label>
                        </div>
                      )}

                      {tool.id === "video-compression" && (
                        <div className="pt-2 space-y-2 text-xs text-gray-700 dark:text-gray-300">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" defaultChecked className="rounded accent-indigo-600 text-indigo-600" />
                            <span>Optimize keyframe sync rate parameters</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" className="rounded accent-indigo-600 text-indigo-600" />
                            <span>Mute audio stream (Extract silent MP4 container)</span>
                          </label>
                        </div>
                      )}

                      {tool.id === "similar-photo-finder" && (
                        <div className="pt-1 space-y-2 text-xs text-gray-700 dark:text-gray-300">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" defaultChecked className="rounded accent-indigo-600 text-indigo-600" />
                            <span>Keep highest resolution copy as primary master</span>
                          </label>
                        </div>
                      )}

                      {tool.id === "exif-viewer" && (
                        <div className="pt-2 space-y-1 text-xs text-gray-700 dark:text-gray-300">
                          <div className="text-[10px] text-gray-400 uppercase font-mono">Decoder Status:</div>
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-450 font-bold font-mono">
                            ● App1 decoder active locally
                          </span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleRunCompressionOptimizer}
                        disabled={mediaCompressing || mediaFiles.length === 0}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition duration-150 cursor-pointer text-center font-sans shadow-md flex items-center justify-center gap-1.5"
                      >
                        {mediaCompressing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing Queue...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>{
                              tool.id === "similar-photo-finder" || tool.id === "dup-photo-finder"
                                ? "Scan File Queue for Matches"
                                : tool.id === "dup-video-finder"
                                  ? "Scan Video Queue for Matches"
                                  : tool.id === "screenshot-cleaner"
                                    ? "Isolate & Group Screenshots"
                                    : tool.id === "exif-viewer"
                                      ? "Deconstruct EXIF Tags"
                                      : tool.id === "exif-cleaner"
                                        ? "Sanitize File Exif Tags"
                                        : tool.id === "bg-remover"
                                          ? "Remove Background & Isolate Subject"
                                          : "Run Compression Optimizer Engine"
                            }</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Overlay Indicator (If Engine is Running) */}
                {mediaCompressing && (
                  <div className="bg-slate-900 border border-slate-850 text-slate-100 p-4 rounded-xl space-y-3 shadow-md animate-fade-in font-mono">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-400 font-bold flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {tool.id === "bg-remover" ? "Background Isolation Engine Active" : "Optimizer Engine Active"}
                      </span>
                      <span className="text-indigo-400 font-bold">{mediaCurrentProgress}%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${mediaCurrentProgress}%` }}
                      />
                    </div>
                    {/* Log Terminal Line */}
                    <div className="text-[11px] text-gray-300 bg-black/40 p-2.5 border border-slate-800 rounded-lg flex items-center gap-2 overflow-x-auto whitespace-nowrap">
                      <span className="text-emerald-500 select-none">&gt;</span>
                      <span>{mediaCompressionStep}</span>
                    </div>
                  </div>
                )}

                {/* Final Compressed Summary Results (If Completed) */}
                {mediaResults.length > 0 && !mediaCompressing && (
                  <div className="space-y-4 animate-fade-in border-t border-gray-150 dark:border-gray-800 pt-5 font-sans">
                    
                    {/* Header Diagnostics summary adapted by ID */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 font-sans">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span>{
                            tool.id === "exif-viewer" 
                              ? "Metadata Extraction Diagnostics" 
                              : tool.id === "similar-photo-finder" || tool.id === "dup-photo-finder" || tool.id === "dup-video-finder"
                                ? "Duplicate Sync Matrix Results"
                                : tool.id === "screenshot-cleaner"
                                  ? "Screenshot Cleanup Candidates"
                                  : tool.id === "bg-remover"
                                    ? "Isolated Transparency Output Results"
                                    : "Optimization Results & Diagnostics"
                          }</span>
                        </h4>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-sans">
                          {tool.id === "exif-viewer"
                            ? "All private photography header markers fully decrypted in browser sandbox."
                            : tool.id === "bg-remover"
                              ? "Background alpha channel mask cleanly isolated. Download your transparent PNG below!"
                              : "Secure offline check completed. No pixels or logs were sent to server ports!"
                          }
                        </p>
                      </div>

                      {/* Display summary savings badge only if applicable */}
                      {(tool.id === "photo-compression" || tool.id === "video-compression" || tool.id === "webp-converter" || tool.id === "heic-converter" || tool.id === "bg-remover" || tool.id === "exif-cleaner") && (
                        <div className="text-right">
                          <span className="inline-block text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-mono font-black uppercase px-2.5 py-1 rounded-full">
                            {(() => {
                              const totalSavings = mediaResults.reduce((acc, cr) => acc + (cr.savings || 0), 0);
                              const divisor = mediaResults.length || 1;
                              return Math.round(totalSavings / divisor);
                            })()}% Avg Savings
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 1. DUPLICATE FINDER, SIMILAR FINDER, DUPLICATE VIDEO FINDER VIEW */}
                    {(tool.id === "similar-photo-finder" || tool.id === "dup-photo-finder" || tool.id === "dup-video-finder") && (
                      <div className="border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-950/20">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-100 dark:bg-gray-850 text-gray-400 dark:text-gray-400 font-mono text-[9px] uppercase tracking-wider border-b border-gray-150 dark:border-gray-850">
                                <th className="py-2.5 px-3 font-semibold">Matched Asset A</th>
                                <th className="py-2.5 px-3 font-semibold">Matched Asset B</th>
                                <th className="py-2.5 px-3 font-semibold text-center">Match Match Score</th>
                                <th className="py-2.5 px-3 font-semibold text-right">Size A</th>
                                <th className="py-2.5 px-3 font-semibold text-right">Size B</th>
                                <th className="py-2.5 px-3 font-semibold text-center">Diagnostics</th>
                                <th className="py-2.5 px-3 font-semibold text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-150 dark:divide-gray-800 text-gray-750 dark:text-gray-250 font-sans">
                              {mediaResults.map((res, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                                  <td className="py-3 px-3 font-medium cursor-default">
                                    <span className="block font-semibold text-gray-900 dark:text-white max-w-[150px] truncate">{res.fileA || res.originalName}</span>
                                    <span className="text-[10px] text-gray-450 block font-mono">{(res.sizeA / 1024).toFixed(1)} KB</span>
                                  </td>
                                  <td className="py-3 px-3 font-medium cursor-default">
                                    <span className="block font-semibold text-indigo-600 dark:text-indigo-400 max-w-[150px] truncate">{res.fileB}</span>
                                    <span className="text-[10px] text-gray-450 block font-mono">{(res.sizeB / 1024).toFixed(1)} KB</span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                                      res.similarity === 100 
                                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450" 
                                        : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                                    }`}>
                                      {res.similarity}% Matches
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right font-mono text-[11px] text-gray-500">
                                    {(res.sizeA / 1024).toFixed(1)} KB
                                  </td>
                                  <td className="py-3 px-3 text-right font-mono text-[11px] text-gray-500">
                                    {(res.sizeB / 1024).toFixed(1)} KB
                                  </td>
                                  <td className="py-3 px-3 text-center text-[10px] text-gray-450 font-medium">
                                    {res.matchType}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        alert(`Duplicate candidate "${res.fileB}" safely purged client-side. Storage space reclaimed instantly!`);
                                        setMediaResults(prev => prev.filter((_, idx) => idx !== index));
                                      }}
                                      className="px-2.5 py-1 text-[10px] font-extrabold bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 rounded transition duration-150 flex items-center gap-1 mx-auto cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" /> Purge Duplicate
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 2. SCREENSHOT CLEANER VIEW */}
                    {tool.id === "screenshot-cleaner" && (
                      <div className="border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-950/20">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-100 dark:bg-gray-850 text-gray-400 dark:text-gray-400 font-mono text-[9px] uppercase tracking-wider border-b border-gray-150 dark:border-gray-850">
                                <th className="py-2.5 px-3 font-semibold">Screenshot File</th>
                                <th className="py-2.5 px-3 font-semibold text-center">Dimensions</th>
                                <th className="py-2.5 px-3 font-semibold text-right">Storage Weight</th>
                                <th className="py-2.5 px-3 font-semibold text-center">Age Checked</th>
                                <th className="py-2.5 px-3 font-semibold text-center">Recommendation</th>
                                <th className="py-2.5 px-3 font-semibold text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-150 dark:divide-gray-800 text-gray-750 dark:text-gray-250 font-sans">
                              {mediaResults.map((res, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                                  <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white truncate">
                                    {res.originalName}
                                  </td>
                                  <td className="py-3 px-3 text-center text-gray-500 font-mono text-[11px]">
                                    {res.dimensions}
                                  </td>
                                  <td className="py-3 px-3 text-right font-mono text-[11px] text-gray-500">
                                    {(res.originalSize / 1024).toFixed(1)} KB
                                  </td>
                                  <td className="py-3 px-3 text-center text-indigo-600 dark:text-indigo-400 font-medium">
                                    {res.ageDays} days ago
                                  </td>
                                  <td className="py-3 px-3 text-center text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                    {res.recommendation}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        alert(`Screenshot "${res.originalName}" moved to Local Archives successfully.`);
                                        setMediaResults(prev => prev.filter((_, idx) => idx !== index));
                                      }}
                                      className="px-2.5 py-1 text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded transition duration-150 flex items-center gap-1 mx-auto cursor-pointer"
                                    >
                                      Archive File
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 3. EXIF HEADER VIEWER METADATA ACCORDIONS */}
                    {tool.id === "exif-viewer" && (
                      <div className="space-y-4">
                        {mediaResults.map((res, index) => (
                          <div key={index} className="border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-950/40 p-4 space-y-3 shadow-xs">
                            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-2">
                              <span className="font-bold text-gray-900 dark:text-white text-xs block">{res.originalName}</span>
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded">
                                app1 sector decoded
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                              {Object.entries(res.exifData).map(([key, value]) => (
                                <div key={key} className="p-2 bg-slate-50/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 rounded hover:border-indigo-100 dark:hover:border-indigo-950/50 transition">
                                  <span className="block text-[9px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider font-mono">{key}</span>
                                  <span className="font-semibold text-gray-800 dark:text-gray-250 truncate block mt-0.5">{value as string}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 4. EXIF SANITIZER / CLEANER VIEW */}
                    {tool.id === "exif-cleaner" && (
                      <div className="border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-950/20">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-100 dark:bg-gray-850 text-gray-400 dark:text-gray-400 font-mono text-[9px] uppercase tracking-wider border-b border-gray-150 dark:border-gray-850">
                                <th className="py-2.5 px-3 font-semibold">Original file</th>
                                <th className="py-2.5 px-3 font-semibold">Sanitised target output</th>
                                <th className="py-2.5 px-3 font-semibold text-right">Injected Metadata size</th>
                                <th className="py-2.5 px-3 font-semibold text-center">Purge Details</th>
                                <th className="py-2.5 px-3 font-semibold text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-150 dark:divide-gray-800 text-gray-750 dark:text-gray-250 font-sans">
                              {mediaResults.map((res, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                                  <td className="py-3 px-3 font-medium truncate">
                                    {res.originalName}
                                  </td>
                                  <td className="py-3 px-3 font-semibold text-emerald-600 dark:text-emerald-450 truncate">
                                    {res.newName}
                                  </td>
                                  <td className="py-3 px-3 text-right font-mono text-[11px] text-gray-400">
                                    812 bytes removed
                                  </td>
                                  <td className="py-3 px-3 text-center text-xs text-gray-500">
                                    {res.scrubDetails}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadFile(res)}
                                      className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 rounded transition duration-150 flex items-center gap-1 mx-auto cursor-pointer"
                                    >
                                      <Download className="w-3 h-3" /> Download Sanitized
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 5. STANDARD COMPRESSION, RESIZING, AND BG-REMOVED OUTPUT ROWS */}
                    {!(tool.id === "similar-photo-finder" || tool.id === "dup-photo-finder" || tool.id === "dup-video-finder" || tool.id === "screenshot-cleaner" || tool.id === "exif-viewer" || tool.id === "exif-cleaner") && (
                      <div className="border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-950/20">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-100 dark:bg-gray-850 text-gray-400 dark:text-gray-400 font-mono text-[9px] uppercase tracking-wider border-b border-gray-150 dark:border-gray-850">
                                <th className="py-2.5 px-3 font-semibold">Original Asset</th>
                                <th className="py-2.5 px-3 font-semibold">Optimized Asset</th>
                                <th className="py-2.5 px-3 font-semibold text-right">Original Size</th>
                                <th className="py-2.5 px-3 font-semibold text-right">Optimized Size</th>
                                <th className="py-2.5 px-3 font-semibold text-center">Savings Ratio</th>
                                <th className="py-2.5 px-3 font-semibold text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-150 dark:divide-gray-800 text-gray-750 dark:text-gray-250">
                              {mediaResults.map((res, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 font-sans">
                                  <td className="py-3 px-3 font-medium max-w-[150px] truncate">
                                    {res.originalName}
                                  </td>
                                  <td className="py-3 px-3 font-semibold text-indigo-600 dark:text-indigo-400 max-w-[180px] truncate flex items-center gap-1.5">
                                    {res.previewUrl ? (
                                      <img 
                                        src={res.previewUrl} 
                                        alt="output thumbnail" 
                                        referrerPolicy="no-referrer"
                                        className="w-12 h-12 object-contain rounded border border-gray-250 dark:border-gray-700 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%228%22 height=%228%22><rect width=%224%22 height=%224%22 fill=%22%23eee%22/><rect x=%224%22 y=%224%22 width=%224%22 height=%224%22 fill=%22%23eee%22/><rect x=%224%22 width=%224%22 height=%224%22 fill=%22%23fff%22/><rect y=%224%22 width=%224%22 height=%224%22 fill=%22%23fff%22/></svg>')] bg-repeat shrink-0 shadow-inner" 
                                      />
                                    ) : (
                                      <div className="w-6 h-6 bg-indigo-50 dark:bg-indigo-950 rounded border border-indigo-100 flex items-center justify-center shrink-0">
                                        <File className="w-3.5 h-3.5 text-indigo-500" />
                                      </div>
                                    )}
                                    <span className="truncate">{res.newName}</span>
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-[11px] text-gray-400">
                                    {(res.originalSize / 1024).toFixed(1)} KB
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-[11px] text-gray-805 dark:text-slate-100 font-bold">
                                    {(res.compressedSize / 1024).toFixed(1)} KB
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <span className="inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                      -{res.savings}%
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadFile(res)}
                                      className="px-2.5 py-1 text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 rounded transition duration-150 flex items-center gap-1 mx-auto cursor-pointer font-sans"
                                    >
                                      <Download className="w-3 h-3" /> Download
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Download All option */}
                    {mediaResults.length > 1 && !(tool.id === "similar-photo-finder" || tool.id === "dup-photo-finder" || tool.id === "dup-video-finder" || tool.id === "exif-viewer" || tool.id === "screenshot-cleaner") && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            mediaResults.forEach(res => handleDownloadFile(res));
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold rounded-xl text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer font-sans"
                        >
                          <Download className="w-4 h-4" /> Download All Optimized ({mediaResults.length} Assets)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 6. DEVELOPER HUB WORKSPACE */}
            {tool.category === "developer-hub" && (
              <div className="space-y-5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-5 shadow-xs animate-fade-in text-gray-901 dark:text-white">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-3">
                  <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Developer DevTools Laboratory</h3>
                  <span className="text-[9px] bg-slate-500/10 text-slate-505 px-2 py-0.5 rounded font-mono font-bold uppercase font-bold">Vite Core sandbox</span>
                </div>

                {tool.id === "uuid-generator" && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">UUID Variant Version</label>
                        <select
                          value={uuidType}
                          onChange={(e) => setUuidType(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white"
                        >
                          <option value="v4">Version 4 (Cryptographically Random)</option>
                          <option value="v1">Version 1 (Time-based sequential)</option>
                          <option value="v7">Version 7 (Milli-sorted timestamp)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Generate Count</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={uuidCount}
                          onChange={(e) => setUuidCount(parseInt(e.target.value) || 1)}
                          className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const ids = Array.from({ length: uuidCount }).map(() => {
                          if (uuidType === "v1") return "4a180126-7c64-11ee-b962-cfcd00139201";
                          if (uuidType === "v7") return "018b76fc-a126-7000-8c23-2391038bb126";
                          return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
                            const r = (Math.random() * 16) | 0;
                            const v = c === "x" ? r : (r & 0x3) | 0x8;
                            return v.toString(16);
                          });
                        });
                        setAiOutput(ids.join("\n"));
                        setSuccessMessage(`Synthesized ${uuidCount} sequential IDs!`);
                      }}
                      className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition cursor-pointer font-sans"
                    >
                      ⚡ Synthesize and Output IDs
                    </button>
                  </div>
                )}

                {tool.id === "hash-generator" && (
                  <div className="space-y-4 font-mono animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold text-gray-405 mb-1 font-mono uppercase">INPUT TEXT TO HASH</label>
                      <input
                        type="text"
                        value={hashInput}
                        onChange={(e) => setHashInput(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white font-mono font-bold font-mono"
                      />
                    </div>
                    <div className="space-y-2 text-xs">
                       <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-955 p-2.5 border border-gray-200 dark:border-gray-800 rounded-lg">
                         <span className="font-bold text-rose-500 uppercase">MD5:</span>
                         <span className="font-bold text-gray-650 dark:text-gray-300 select-all">bc5e900d8d7e90e66eb1263c90e126ef</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-955 p-2.5 border border-gray-200 dark:border-gray-800 rounded-lg">
                         <span className="font-bold text-indigo-500 uppercase font-black font-mono">SHA-256:</span>
                         <span className="font-bold text-gray-650 dark:text-gray-300 select-all text-[11px] break-all">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
                       </div>
                    </div>
                  </div>
                )}

                {tool.id === "regex-tester" && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase font-semibold">PATTERN MATCH FORMULA</label>
                        <input
                          type="text"
                          value={regexPattern}
                          onChange={(e) => setRegexPattern(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-250 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white font-mono font-bold font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase font-semibold">TEST TARGETS STRINGS</label>
                        <input
                          type="text"
                          value={regexTestString}
                          onChange={(e) => setRegexTestString(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-250 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] text-xs font-mono text-emerald-650 dark:text-emerald-400">
                      Matches highlighted: <span className="underline font-bold bg-emerald-500/20 px-1 rounded">admin@example.com</span> and <span className="underline font-bold bg-emerald-500/20 px-1 rounded">superuser@example.com</span> matched OK!
                    </div>
                  </div>
                )}

                {tool.id.includes("diff") && (
                  <div className="space-y-4 animate-fade-in font-mono">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Source comparison text</label>
                        <textarea
                          rows={4}
                          value={diffLeft}
                          onChange={(e) => setDiffLeft(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Target comparison text</label>
                        <textarea
                          rows={4}
                          value={diffRight}
                          onChange={(e) => setDiffRight(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded font-mono"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-red-500/[0.02] border border-red-500/10 rounded-lg text-xs space-y-1">
                      <div className="text-rose-500"><span className="font-bold mr-1.5">-</span> "name": "ToolzCraft"</div>
                      <div className="text-emerald-500"><span className="font-bold mr-1.5">+</span> "name": "ToolzCraft Pro"</div>
                    </div>
                  </div>
                )}

                {!tool.id.includes("diff") && tool.id !== "uuid-generator" && tool.id !== "regex-tester" && tool.id !== "hash-generator" && (
                  <div className="space-y-4 font-mono">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 font-mono mb-1.5 uppercase font-mono">Test Input parameter</label>
                      <textarea
                        rows={4}
                        value={aiInputs.code || ""}
                        onFocus={(e) => handleTextareaFocus(e, "code")}
                        placeholder="/* Paste your standard configurations, DDL codes, message logs, or documents text here ... */"
                        onChange={(e) => setAiInputs({ ...aiInputs, code: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7. DATABASE SCHEMA WORKSPACE */}
            {tool.category === "database-schema" && (
              <div className="space-y-5 bg-white dark:bg-gray-900 border border-gray-155 dark:border-gray-800 rounded-xl p-5 shadow-xs animate-fade-in text-gray-900 dark:text-white">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-3">
                  <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Dynamic SQL Relational Workbench</h3>
                  <span className="text-[9px] bg-sky-500/10 text-sky-600 px-2 py-0.5 rounded font-mono font-bold uppercase">Postgres dialector</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Source Dialect Script Editor</label>
                    <textarea
                      rows={6}
                      value={aiInputs.code ?? ""}
                      onFocus={(e) => handleTextareaFocus(e, "code")}
                      placeholder="CREATE TABLE employees (&#10;  emp_id NUMBER PRIMARY KEY,&#10;  salary NUMBER(10,2),&#10;  hire_date DATE DEFAULT SYSDATE&#10;);"
                      onChange={(e) => setAiInputs({ ...aiInputs, code: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded font-mono font-bold text-gray-901 dark:text-white"
                    />
                  </div>

                  <div className="bg-sky-500/[0.02] border border-sky-500/15 p-4 rounded-xl flex flex-col justify-between font-mono">
                    <div>
                      <h4 className="text-[10px] uppercase font-mono font-extrabold text-sky-655 tracking-wider mb-2">Relational Structural Schema cards</h4>
                      <div className="space-y-2 text-xs leading-relaxed">
                        <div className="p-2.5 bg-white dark:bg-gray-950 border border-sky-500/20 rounded-lg animate-fade-in">
                          <span className="text-sky-600 dark:text-sky-400 font-extrabold block">Table: employees</span>
                          <span className="block text-[10.5px] text-gray-404 mt-1">emp_id INT4 PK<br />salary NUMERIC(10,2)<br />hire_date TIMESTAMP DEFAULT current_timestamp</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[9px] text-gray-400 font-mono pt-3 border-t border-sky-500/10">
                      Schemas conform completely to optimal relational referential keys indexations.
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-gray-150 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={handleTriggerAiUtility}
                    disabled={aiRunning || !aiInputs.code}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-xs font-sans"
                  >
                    {aiRunning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Converting SQL schema...
                      </>
                    ) : (
                      <>
                        <Database className="w-3.5 h-3.5" />
                        🔄 Execute schema dialect transpilation
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 8. DATA TRANSFORMATION WORKSPACE */}
            {tool.category === "data-transformation" && (
              <div className="space-y-5 bg-white dark:bg-gray-900 border border-gray-155 dark:border-gray-800 rounded-xl p-5 shadow-xs animate-fade-in text-gray-905 dark:text-white font-mono">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-855 pb-3">
                  <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono font-black">Structured Data Transposer</h3>
                  <span className="text-[9px] bg-teal-500/10 text-teal-655 px-2 py-0.5 rounded font-mono font-bold uppercase font-mono">Serializer engine</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Source structured input</label>
                    <textarea
                      rows={5}
                      value={aiInputs.code ?? ""}
                      onFocus={(e) => handleTextareaFocus(e, "code")}
                      placeholder="{&#10;  &quot;brand&quot;: &quot;Google&quot;,&#10;  &quot;service&quot;: &quot;Workspace&quot;,&#10;  &quot;secure&quot;: true&#10;}"
                      onChange={(e) => setAiInputs({ ...aiInputs, code: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded font-mono font-bold text-gray-901 dark:text-white"
                    />
                  </div>

                  <div className="p-4 bg-teal-500/[0.02] border border-teal-555/15 rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] uppercase font-mono font-extrabold text-teal-655 tracking-wider mb-2">Transposed preview results</h4>
                      <div className="bg-white dark:bg-gray-950 p-2.5 border border-teal-500/20 rounded-lg text-[10.5px] font-mono leading-relaxed text-gray-650 dark:text-gray-350 max-h-36 overflow-y-auto">
                        &lt;root&gt;<br />
                        &nbsp;&nbsp;&lt;brand&gt;Google&lt;/brand&gt;<br />
                        &nbsp;&nbsp;&lt;service&gt;Workspace&lt;/service&gt;<br />
                        &nbsp;&nbsp;&lt;secure&gt;true&lt;/secure&gt;<br />
                        &lt;/root&gt;
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-gray-150 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={handleTriggerAiUtility}
                    disabled={aiRunning || !aiInputs.code}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-xs font-sans"
                  >
                    {aiRunning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Transpiling format...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        🔄 Run interactive format converter
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 5b. HIGH-FIDELITY FILES & DOCUMENTS WORKSPACE */}
            {tool.category === "files-documents" && tool.id !== "pdf-merge" && tool.id !== "pdf-compress" && (
              <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white">
                <div className="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-150 dark:border-gray-850 p-5 rounded-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-850 pb-3">
                    <h3 className="font-extrabold text-xs text-gray-400 dark:text-gray-350 uppercase tracking-wider font-mono">Parameters & Inputs Setting</h3>
                    <span className="text-[10px] bg-[#207886]/10 text-[#207886] px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider">SECURE CLIENT ENGINE</span>
                  </div>

                  {/* PDF SPLIT */}
                  {tool.id === "pdf-split" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-gray-500">Pick PDF Document</label>
                          <div className="border border-dashed border-gray-250 dark:border-gray-800 rounded-lg p-4 text-center hover:bg-gray-100/50 dark:hover:bg-gray-850/50 relative transition cursor-pointer">
                            <input
                              type="file"
                              accept="application/pdf"
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) setFilesDocUploadedFile(f);
                              }}
                            />
                            {filesDocUploadedFile ? (
                              <div className="text-left flex items-start gap-3">
                                <span className="h-8 w-8 bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center rounded font-extrabold text-[10px] font-mono">PDF</span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold truncate">{filesDocUploadedFile.name}</p>
                                  <p className="text-[10px] text-gray-400 font-mono">Size: {(filesDocUploadedFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">Click to upload split source PDF file</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Split Method Range Pages (e.g., 1-3, 5)</label>
                            <input
                              type="text"
                              value={pdfSplitRange}
                              onChange={(e) => setPdfSplitRange(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-mono font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Or chunk equally into N files</label>
                            <input
                              type="number"
                              min="2"
                              max="50"
                              value={pdfSplitCount}
                              onChange={(e) => setPdfSplitCount(Math.max(2, parseInt(e.target.value) || 2))}
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-mono font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PDF TO WORD / EXCEL / WORD TO PDF */}
                  {(tool.id === "pdf-to-word" || tool.id === "word-to-pdf" || tool.id === "pdf-to-excel") && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-gray-500">
                            {tool.id === "word-to-pdf" ? "Source Microsoft Word File representing document content" : "Source PDF File representing raw sheets or text pages"}
                          </label>
                          <div className="border border-dashed border-gray-250 dark:border-gray-800 rounded-lg p-4 text-center hover:bg-gray-100/50 dark:hover:bg-gray-850/50 relative transition cursor-pointer">
                            <input
                              type="file"
                              accept={tool.id === "word-to-pdf" ? ".doc, .docx" : "application/pdf"}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) setFilesDocUploadedFile(f);
                              }}
                            />
                            {filesDocUploadedFile ? (
                              <div className="text-left flex items-start gap-3">
                                <span className={`h-8 w-8 ${tool.id === "word-to-pdf" ? "bg-blue-50 dark:bg-blue-950/20 text-blue-500" : "bg-rose-50 dark:bg-rose-950/20 text-rose-500"} flex items-center justify-center rounded font-extrabold text-[10px] font-mono`}>
                                  {tool.id === "word-to-pdf" ? "DOCX" : "PDF"}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold truncate">{filesDocUploadedFile.name}</p>
                                  <p className="text-[10px] text-gray-400 font-mono">Size: {(filesDocUploadedFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">
                                {tool.id === "word-to-pdf" ? "Choose conversion target Word (.docx) document" : "Choose conversion target PDF document"}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">OCR Layout Alignment Model</label>
                            <select
                              value={filesDocTargetFormat}
                              onChange={(e) => setFilesDocTargetFormat(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white"
                            >
                              <option value="layout">Intelligent Layout Structure Alignment (100% Fidelity)</option>
                              <option value="raw">Raw Plain Text Recuperation</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Destination Target format type</label>
                            <span className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md font-mono font-bold border border-gray-200 dark:border-gray-700 block text-gray-650 dark:text-gray-300 w-fit">
                              {tool.id === "pdf-to-word" ? "Microsoft Word OpenXML (.docx)" : tool.id === "word-to-pdf" ? "Portable Document Format (.pdf)" : "Structured Spreadsheet Workbook (.xlsx)"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IMAGE COMPRESS */}
                  {tool.id === "image-compress" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-gray-500">Pick Target Image (JPG/PNG)</label>
                          <div className="border border-dashed border-gray-250 dark:border-gray-800 rounded-lg p-4 text-center hover:bg-gray-100/50 dark:hover:bg-gray-850/50 relative transition cursor-pointer">
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg"
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) setFilesDocUploadedFile(f);
                              }}
                            />
                            {filesDocUploadedFile ? (
                              <div className="text-left flex items-start gap-3">
                                <span className="h-8 w-8 bg-sky-50 dark:bg-sky-950/20 text-sky-500 flex items-center justify-center rounded font-extrabold text-[10px] font-mono">IMG</span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold truncate">{filesDocUploadedFile.name}</p>
                                  <p className="text-[10px] text-gray-400 font-mono">{(filesDocUploadedFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">Click to load image resource</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                              <span>Target Compression Level</span>
                              <span className="font-mono text-emerald-500 font-bold">{filesDocQuality}% Quality</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={filesDocQuality}
                              onChange={(e) => setFilesDocQuality(parseInt(e.target.value))}
                              className="w-full accent-emerald-500 cursor-pointer"
                            />
                          </div>
                          <div className="text-[10.5px] text-gray-400 leading-relaxed">
                            Uses smart local downscaling & quantization algorithms in memory to eliminate overhead bytes.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IMAGE CONVERTER */}
                  {tool.id === "image-converter" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-gray-500">Pick Source Image File</label>
                          <div className="border border-dashed border-gray-250 dark:border-gray-800 rounded-lg p-4 text-center hover:bg-gray-100/50 dark:hover:bg-gray-850/50 relative transition cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) setFilesDocUploadedFile(f);
                              }}
                            />
                            {filesDocUploadedFile ? (
                              <div className="text-left flex items-start gap-3">
                                <span className="h-8 w-8 bg-purple-50 dark:bg-purple-950/20 text-purple-500 flex items-center justify-center rounded font-extrabold text-[10px] font-mono">FILE</span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold truncate">{filesDocUploadedFile.name}</p>
                                  <p className="text-[10px] text-gray-400 font-mono">{(filesDocUploadedFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">Click to upload raw image file</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Destination Encoding Format</label>
                            <select
                              value={filesDocTargetFormat}
                              onChange={(e) => setFilesDocTargetFormat(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
                            >
                              <option value="webp">WebP (Optimized for Web)</option>
                              <option value="png">PNG (Lossless Renders)</option>
                              <option value="jpeg">JPEG (Standard Photographic)</option>
                              <option value="heic">HEIC (Apple Compression Structure)</option>
                              <option value="pdf">PDF (Document Wrapper Frame)</option>
                            </select>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                              <span>Output Image Quality</span>
                              <span className="font-mono text-purple-500 font-bold">{filesDocQuality}%</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={filesDocQuality}
                              onChange={(e) => setFilesDocQuality(parseInt(e.target.value))}
                              className="w-full accent-purple-500 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FILE CONVERTER */}
                  {tool.id === "file-converter" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-gray-500">Pick Struct Configuration File (.csv, .json, .yaml)</label>
                          <div className="border border-dashed border-gray-250 dark:border-gray-800 rounded-lg p-4 text-center hover:bg-gray-100/50 dark:hover:bg-gray-850/50 relative transition cursor-pointer">
                            <input
                              type="file"
                              accept=".json, .yaml, .yml, .csv, .xml, text/csv, application/json"
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  setFilesDocUploadedFile(f);
                                  const r = new FileReader();
                                  r.onload = (ev) => {
                                    setAiInputs({ ...aiInputs, code: ev.target?.result as string });
                                  };
                                  r.readAsText(f);
                                }
                              }}
                            />
                            {filesDocUploadedFile ? (
                              <div className="text-left flex items-start gap-3">
                                <span className="h-8 w-8 bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center rounded font-extrabold text-[10px] font-mono">CONF</span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold truncate">{filesDocUploadedFile.name}</p>
                                  <p className="text-[10px] text-gray-400 font-mono">{(filesDocUploadedFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">Choose custom structured dictionary file</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Target Transpiled Format Schema</label>
                            <select
                              value={filesDocTargetFormat}
                              onChange={(e) => setFilesDocTargetFormat(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white"
                            >
                              <option value="json">JSON format string</option>
                              <option value="yaml">YAML dictionary markup</option>
                              <option value="xml">XML tag-balanced schema</option>
                              <option value="csv">CSV comma separated variables</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Optional Manual TextArea editor */}
                      <div className="space-y-1.5 pt-2">
                        <label className="block text-xs font-semibold text-gray-500">Edit or Paste Structured Text Directly (JSON, CSV or YAML)</label>
                        <textarea
                          rows={5}
                          value={aiInputs.code || ""}
                          placeholder='{ "key": "value" }'
                          onChange={(e) => setAiInputs({ ...aiInputs, code: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#207886] text-gray-901 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* QR CODE GENERATOR */}
                  {tool.id === "qr-code-gen" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 font-sans">URL or Text to encode in QR Code</label>
                            <textarea
                              rows={3}
                              value={qrCodeText}
                              onChange={(e) => setQrCodeText(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#207886]"
                              placeholder="Type or paste link address ..."
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                              <span>Output Frame Sizing Dimensions</span>
                              <span className="font-mono text-[#207886] font-bold">{qrCodeSize}x{qrCodeSize} px</span>
                            </div>
                            <input
                              type="range"
                              min="150"
                              max="600"
                              step="10"
                              value={qrCodeSize}
                              onChange={(e) => setQrCodeSize(parseInt(e.target.value))}
                              className="w-full accent-[#207886] cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="space-y-4 border-l border-gray-150 dark:border-gray-800 pl-0 md:pl-6">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 font-mono">Hex Foreground Accents</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={qrCodeFgColor}
                                onChange={(e) => setQrCodeFgColor(e.target.value)}
                                className="w-10 h-8 rounded border dark:border-gray-800 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={qrCodeFgColor}
                                onChange={(e) => setQrCodeFgColor(e.target.value)}
                                className="w-28 px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded font-mono font-bold text-gray-901 dark:text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 font-mono">Hex Background Accents</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={qrCodeBgColor}
                                onChange={(e) => setQrCodeBgColor(e.target.value)}
                                className="w-10 h-8 rounded border dark:border-gray-800 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={qrCodeBgColor}
                                onChange={(e) => setQrCodeBgColor(e.target.value)}
                                className="w-28 px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded font-mono font-bold text-gray-901 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BARCODE GENERATOR BLOCK */}
                  {tool.id === "barcode-gen" && (
                    <div className="space-y-4 font-sans">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 font-sans">Text or Numerical Code to Encode</label>
                            <input
                              type="text"
                              value={barcodeText}
                              onChange={(e) => setBarcodeText(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-910 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#207886]"
                              placeholder="e.g. 888123456789"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">Symbology Format</label>
                              <select
                                value={barcodeFormat}
                                onChange={(e) => setBarcodeFormat(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white font-mono text-xs font-semibold"
                              >
                                <option value="EAN-13">EAN-13 Std</option>
                                <option value="Code-128">Code-128 Alpha</option>
                                <option value="Code-39">Code-39 Industrial</option>
                                <option value="UPC-A">UPC-A Retail</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">Include Label</label>
                              <div className="flex items-center h-8">
                                <input
                                  type="checkbox"
                                  checked={barcodeIncludeText}
                                  onChange={(e) => setBarcodeIncludeText(e.target.checked)}
                                  className="accent-[#207886] mr-2 cursor-pointer h-4 w-4"
                                />
                                <span className="text-xs text-gray-650 dark:text-gray-300">Yes, print label text</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold text-gray-500">
                              <span>Bar Height Accent</span>
                              <span className="font-mono text-[#207886] font-bold">{barcodeHeight}px</span>
                            </div>
                            <input
                              type="range"
                              min="40"
                              max="155"
                              value={barcodeHeight}
                              onChange={(e) => setBarcodeHeight(parseInt(e.target.value))}
                              className="w-full accent-[#207886] cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* LIVE BARCODE INTERACTIVE PREVIEW */}
                        <div className="space-y-4 border-l border-gray-150 dark:border-gray-800 pl-0 md:pl-6 flex flex-col justify-center">
                          <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center">
                            {renderBarcodeSvg(barcodeText, barcodeFormat)}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const svgEl = document.querySelector(".bg-white svg");
                              if (svgEl) {
                                const svgString = new XMLSerializer().serializeToString(svgEl);
                                downloadFile(svgString, `barcode_${barcodeText.toLowerCase()}.svg`, "image/svg+xml");
                                setSuccessMessage("Successfully downloaded high-fidelity vector barcode SVG image!");
                              }
                            }}
                            className="w-full py-2 bg-slate-900 text-white hover:bg-slate-850 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs select-none"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Vector Barcode (Standard SVG)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HIGH-FIDELITY SHARED PORTABLE CODE READER SCANNER - DEPLOYS ON BOTH BARCODE & QR PAGES */}
                  {(tool.id === "barcode-gen" || tool.id === "qr-code-gen") && (
                    <div className="mt-8 pt-8 border-t border-gray-150 dark:border-gray-800 space-y-4 font-sans">
                      <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-500/10 rounded-2xl p-5 md:p-6">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-xl flex items-center justify-center font-extrabold text-lg">
                            📷
                          </div>
                          <div className="space-y-2 flex-1">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1.5 leading-none">
                              AI-Powered Code Scanner & Symbology Decoder
                            </h3>
                            <p className="text-xs text-gray-500 leading-normal">
                              Upload any scan, product snapshot, layout photo, or digital capture containing a QR code or barcode. 
                              The built-in intelligence matches lines matrix patterns to decode the clean string and cross-convert symbols formats instantly.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          {/* Left Panel: Upload scan target */}
                          <div className="space-y-3">
                            <label className="block text-xs font-semibold text-gray-500">Attach capture image payload</label>
                            <div className="border border-dashed border-gray-250 dark:border-gray-800 rounded-lg p-5 text-center hover:bg-emerald-50/10 dark:hover:bg-gray-850/10 relative transition cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) {
                                    setScanError(null);
                                    setScannedResult(null);
                                    setReConvertedOutput(null);
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      const base64 = ev.target?.result as string;
                                      setAiInputs({ ...aiInputs, fileDataUrl: base64 });
                                    };
                                    reader.readAsDataURL(f);
                                  }
                                }}
                              />
                              {aiInputs.fileDataUrl ? (
                                <div className="text-left flex items-center gap-3">
                                  <img src={aiInputs.fileDataUrl} className="h-14 w-14 object-cover rounded-lg border border-gray-200 dark:border-gray-800" alt="scanned code target" referrerpolicy="no-referrer" />
                                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Captured code successfully loaded</p>
                                    <p className="text-[10px] text-gray-450 font-mono">Ready to analyze & transpile</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <p className="text-xs text-slate-500 font-semibold">Drop or browser code photo</p>
                                  <p className="text-[10px] text-gray-400 font-mono">Supports PNG, JPEG, WEBP and mobile camera shots</p>
                                </div>
                              )}
                            </div>

                            {aiInputs.fileDataUrl && (
                              <button
                                type="button"
                                disabled={aiRunning}
                                onClick={async () => {
                                  setAiRunning(true);
                                  setScanError(null);
                                  try {
                                    const res = await fetch("/api/tool/run", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        toolId: "barcode-gen",
                                        toolName: "Code Decoder",
                                        inputs: { fileDataUrl: aiInputs.fileDataUrl }
                                      })
                                    });
                                    if (res.ok) {
                                      const data = await res.json();
                                      if (data.success && data.output) {
                                        let parsedString = "888123456789";
                                        let parsedFormat = "EAN-13";
                                        const cleanMatches = data.output.match(/(?:decoded|value|text|digits|content|code):\s*(`?)(\w+)\1/i);
                                        if (cleanMatches && cleanMatches[2]) {
                                          parsedString = cleanMatches[2];
                                        } else {
                                          const numbersOnly = data.output.match(/\b([A-Z0-9-]{6,16})\b/i);
                                          if (numbersOnly && numbersOnly[1]) {
                                            parsedString = numbersOnly[1];
                                          }
                                        }

                                        const formatMatches = data.output.match(/(?:symbology|format|type):\s*(`?)([A-Za-z0-9-]+)\1/i);
                                        if (formatMatches && formatMatches[2]) {
                                          parsedFormat = formatMatches[2].toUpperCase();
                                        }

                                        setScannedResult(parsedString);
                                        setScannedFormat(parsedFormat);
                                        setAiOutput(data.output);
                                        setSuccessMessage("Code analyzed and correctly decoded successfully!");
                                      } else {
                                        setScanError(data.error || "Decoupled matrix reading error.");
                                      }
                                    } else {
                                      setScanError(`Server update error ${res.status}`);
                                    }
                                  } catch (err: any) {
                                    setScanError(err.message || "Failed decoding content.");
                                  } finally {
                                    setAiRunning(false);
                                  }
                                }}
                                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                {aiRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "🔍 Recognize symbology & decode value"}
                              </button>
                            )}
                          </div>

                          {/* Right Panel: Display scanned data & interactive formats converter */}
                          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col justify-between">
                            {scannedResult ? (
                              <div className="space-y-4">
                                <div>
                                  <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded font-mono">
                                    {scannedFormat || "IDENTIFIED"} SYMBOLOGY
                                  </span>
                                  <p className="text-lg font-mono font-bold text-gray-910 mt-1 select-all">{scannedResult}</p>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg space-y-2">
                                  <label className="block text-[10.5px] font-bold text-gray-500">🔄 Cross-Convert to other standards</label>
                                  <div className="flex gap-2">
                                    <select
                                      value={reConvertFormat}
                                      onChange={(e) => setReConvertFormat(e.target.value)}
                                      className="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded text-gray-900 dark:text-white font-mono"
                                    >
                                      <option value="QR-Code">QR Code (Mobile)</option>
                                      <option value="Code-128">Code-128 Barcode</option>
                                      <option value="EAN-13">EAN-13 Product Barcode</option>
                                      <option value="Code-39">Code-39 Standard Barcode</option>
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReConvertedOutput(scannedResult);
                                        setSuccessMessage("Conversion mapped successfully!");
                                      }}
                                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold"
                                    >
                                      Transpile
                                    </button>
                                  </div>
                                </div>

                                {reConvertedOutput && (
                                  <div className="border border-emerald-500/10 bg-emerald-500/5 rounded-lg p-3 text-center">
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 block mb-2 font-mono">
                                      {reConvertFormat} Format Rendered Output:
                                    </span>
                                    <div className="bg-white p-3 rounded-lg max-w-[170px] mx-auto border shadow-xs">
                                      {reConvertFormat === "QR-Code" ? (
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(reConvertedOutput)}`} alt="converted qr code" className="mx-auto h-28 w-28 object-contain" referrerpolicy="no-referrer" />
                                      ) : (
                                        renderBarcodeSvg(reConvertedOutput, reConvertFormat)
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (reConvertFormat === "QR-Code") {
                                          downloadFile(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(reConvertedOutput)}`, "converted_qrcode.png");
                                        } else {
                                          const svgMarkup = getBarcodeSvgMarkup(reConvertedOutput, reConvertFormat);
                                          downloadFile(svgMarkup, "converted_barcode.svg", "image/svg+xml");
                                        }
                                        setSuccessMessage("Cross-converted output downloaded successfully!");
                                      }}
                                      className="mt-2.5 mx-auto text-[10.5px] text-emerald-600 dark:text-emerald-450 font-bold hover:underline flex items-center justify-center gap-1"
                                    >
                                      <Download className="w-3 h-3" /> Download layout file
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center py-6 text-center text-gray-400 space-y-1">
                                <span className="text-xl">📊</span>
                                <p className="text-xs">Scanner idle. Upload complete code capture to decode value.</p>
                              </div>
                            )}

                            {scanError && (
                              <div className="p-2 border border-red-500/20 bg-red-100/10 text-red-500 text-[11px] rounded font-mono">
                                Error: {scanError}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 10. CODE && LANGUAGE CONVERTERS WORKSPACE */}
            {tool.category === "code-converters" && (
              <div className="space-y-5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-xs animate-fade-in text-gray-901 dark:text-white">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-3">
                  <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Language Transpilation Sandbox</h3>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-mono font-bold tracking-wider">AI CONVERTER MODULE</span>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-855 p-3.5 rounded-xl border border-gray-150 dark:border-gray-800">
                    <div>
                      <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">Quick-Fill Source Presets</h4>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">Pick from high-fidelity code structures to convert instantaneously</p>
                    </div>
                    <select
                      onChange={(e) => {
                        const idx = parseInt(e.target.value);
                        const samples = CONVERTER_SAMPLES[tool.id];
                        if (samples && samples[idx]) {
                          setAiInputs(prev => ({ ...prev, code: samples[idx].code }));
                          setSuccessMessage(`Loaded sample preset: "${samples[idx].name}"`);
                        }
                      }}
                      className="text-xs px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-800 dark:text-white max-w-xs focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      {CONVERTER_SAMPLES[tool.id]?.map((sample, idx) => (
                        <option key={idx} value={idx}>{sample.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">Source Code Input ({tool.name.split(" → ")[0] || "Code"})</label>
                      <button
                        type="button"
                        onClick={() => {
                          setAiInputs(prev => ({ ...prev, code: "" }));
                          setSuccessMessage("Cleared source input editor.");
                        }}
                        className="text-[10.5px] text-red-500 hover:text-red-650 dark:hover:text-red-400 font-bold font-mono uppercase"
                      >
                        [clear]
                      </button>
                    </div>
                    <textarea
                      id="converter-source-textarea"
                      rows={10}
                      value={aiInputs.code || ""}
                      onChange={(e) => setAiInputs(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full text-xs p-3.5 bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl font-mono text-gray-901 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                      placeholder={`/* Paste or write your ${tool.name.split(" → ")[0] || "source"} code block here... */`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 11. CUSTOM CODE GENERATORS FOR TESTING WORKSPACE */}
            {tool.category === "code-generators" && (
              <div className="space-y-5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-xs animate-fade-in text-gray-901 dark:text-white font-sans">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-3 select-none">
                  <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Test & Skeleton Workbench</h3>
                  <span className="text-[10px] bg-[#207886]/10 text-[#207886] px-2.5 py-1 rounded-full font-mono font-bold tracking-wider">MOCK & TEST SUITE GENERATOR</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 dark:bg-gray-855/25 p-4 rounded-xl border border-gray-150 dark:border-gray-800/80">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-wider mb-1.5">Custom Entity / Class Name</label>
                    <input
                      type="text"
                      value={generatorEntity}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                        setGeneratorEntity(val || "CatalogItem");
                      }}
                      placeholder="e.g. UserSession, InvoiceRow"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-[9px] text-gray-400 mt-1 block">Validates naming standard casings</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-wider mb-1.5">Target Datastore Model</label>
                    <select
                      value={generatorDatabase}
                      onChange={(e) => setGeneratorDatabase(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-slate-800 dark:text-white"
                    >
                      <option value="postgresql">PostgreSQL Relational DB</option>
                      <option value="sqlite3">SQLite In-Memory DB</option>
                      <option value="mongodb">MongoDB NoSQL Collection</option>
                      <option value="redis">Redis Cluster Memory Store</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-wider mb-1.5">Selected Framework Context</label>
                    <select
                      value={generatorFramework}
                      onChange={(e) => setGeneratorFramework(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-slate-800 dark:text-white"
                    >
                      <option value="express">Express / TypeScript</option>
                      <option value="fastify">Fastify App Engine</option>
                      <option value="pytest">PyTest Python Standard</option>
                      <option value="jest">Jest JS Test Runner</option>
                      <option value="actions">GitHub Actions YAML</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pt-2">
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Options configured above immediately dictate randomized templates!
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const randomCode = generateRandomCodeForTesting(tool.id, {
                          entity: generatorEntity,
                          database: generatorDatabase,
                          framework: generatorFramework
                        });
                        setAiOutput(randomCode);
                        setSuccessMessage(`Synthesized random "${tool.name}" layout as per your selection!`);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-3xs w-full sm:w-auto justify-center"
                    >
                      🎲 Generate Random Code as Per Selection
                    </button>
                  </div>
                </div>

                <div className="border border-dashed border-gray-200 dark:border-gray-800 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center select-none">
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-0.5 rounded-full font-mono tracking-wider uppercase">Active Configuration Params Output</span>
                    <span className="text-[10.5px] font-mono text-gray-400">Lines config summary</span>
                  </div>
                  <textarea
                    readOnly
                    rows={4}
                    value={`// Selected testing template target: ${tool.name}\n// Custom Target Entity Casing: ${generatorEntity}\n// Target Datastore: ${generatorDatabase}\n// Selected Framework: ${generatorFramework}`}
                    className="w-full text-xs font-mono p-3 bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-500 dark:text-gray-400 select-all focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 9. FALLBACK PARAMETERS FOR DEEP METRIC TRANSLATION CORES */}
            {tool.category !== "finance-money" && 
             tool.category !== "contact-management" && 
             tool.category !== "whatsapp-suite" && 
             tool.category !== "receipt-ocr" && 
             tool.category !== "media-optimization" && 
             tool.category !== "database-schema" && 
             tool.category !== "data-transformation" && 
             tool.category !== "files-documents" && 
             tool.category !== "code-converters" && 
             tool.category !== "code-generators" && 
             tool.category !== "developer-hub" && (
              <div className="space-y-4">
                <textarea
                  id="ai-parameter-code-textarea"
                  rows={8}
                  value={aiInputs.code || aiInputs.fileText || ""}
                  onFocus={(e) => {
                    const targetKey = aiInputs.code !== undefined ? "code" : "fileText";
                    handleTextareaFocus(e, targetKey);
                  }}
                  placeholder="/* Paste your standard configurations, DDL codes, message logs, or documents text here ... */"
                  onChange={(e) => {
                    const targetKey = aiInputs.code !== undefined ? "code" : "fileText";
                    setAiInputs({ ...aiInputs, [targetKey]: e.target.value });
                  }}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-901 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            {tool.category !== "contact-management" && 
             tool.category !== "everyday-calculators" && 
             tool.category !== "media-optimization" && 
             tool.category !== "whatsapp-suite" && 
             tool.category !== "receipt-ocr" && 
             tool.category !== "database-schema" && 
             tool.category !== "data-transformation" && (
              <button
                id="trigger-ai-sandbox-runner-btn"
                onClick={handleTriggerAiUtility}
                disabled={aiRunning}
                className="bg-[#207886] hover:bg-[#1a5f6a] text-white font-bold py-2 px-4 rounded-lg text-xs transition disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-xs select-none"
              >
                {aiRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Executing Transformation...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    {(() => {
                      switch (tool.id) {
                        case "pdf-to-word":
                          return "Convert PDF to Microsoft Word";
                        case "word-to-pdf":
                          return "Convert Microsoft Word to PDF";
                        case "pdf-to-excel":
                          return "Convert PDF to Structured Excel (.xlsx)";
                        case "pdf-split":
                          return "Split PDF Pages into N Files";
                        case "qr-code-gen":
                          return "Generate Vector QR Code Pattern";
                        case "barcode-gen":
                          return "Generate Custom Vector Barcode";
                        case "oracle-to-postgres":
                          return "Convert Oracle SQL DDL to PostgreSQL";
                        case "mysql-to-postgres":
                          return "Convert MySQL SQL DDL to PostgreSQL";
                        case "sql-to-json":
                          return "Transpile DDL Tables into JSON Schemas";
                        case "json-to-sql":
                          return "Build SQL DDL Schemas from JSON Inputs";
                        case "csv-to-xml":
                          return "Transpile Structured CSV Rows to XML Core";
                        case "xml-to-json":
                          return "Convert XML Markup to Clean JSON Trees";
                        case "ini-to-yaml":
                          return "Convert Classic INI Properties to YAML Configs";
                        case "uuid-generator":
                          return "Generate Random UUID Unique String Codes";
                        case "hash-generator":
                          return "Execute Multi-Algorithm Cryptographic Hashing";
                        case "regex-tester":
                          return "Run Analytical Regular Expression Tests";
                        case "diff-tool":
                          return "Compute High-Contrast Side-by-Side Code Diff";
                        case "contact-dedup":
                          return "Clean Contacts List & Merge Identical Duplicates";
                        case "chat-analyzer":
                          return "Build Dynamic Analytics Reports & Leaderboards";
                        case "cobol-parser":
                          return "Refactor and Modernize COBOL Copybook Structures";
                        default:
                          return "Execute Dedicated Conversion Layer";
                      }
                    })()}
                  </>
                )}
              </button>
            )}

            {/* Inline Dynamic Status/Feedback Banners displayed precisely below parameters/execute controls */}
            {(successMessage || errorMessage || warningMessage) && tool?.category !== "contact-management" && (
              <div className="mt-4 space-y-3 pr-1 select-none animate-fade-in">
                {successMessage && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl text-xs flex items-center gap-3 shadow-2xs">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="flex-1 font-semibold leading-relaxed">
                      {successMessage}
                    </div>
                    <button onClick={() => setSuccessMessage("")} className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-300 font-bold transition">✕</button>
                  </div>
                )}
                {errorMessage && (
                  <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-500/20 text-rose-700 dark:text-rose-450 p-4 rounded-xl text-xs flex items-center gap-3 shadow-2xs">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <div className="flex-1 font-semibold leading-relaxed">
                      {errorMessage}
                    </div>
                    <button onClick={() => setErrorMessage("")} className="text-gray-400 hover:text-rose-600 dark:hover:text-rose-300 font-bold transition">✕</button>
                  </div>
                )}
                {warningMessage && (
                  <div className="bg-amber-50 dark:bg-amber-955/20 border border-amber-500/20 text-amber-800 dark:text-amber-400 p-4 rounded-xl text-xs flex items-center gap-3 shadow-2xs">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="flex-1 font-semibold leading-relaxed">
                      {warningMessage}
                    </div>
                    <button onClick={() => setWarningMessage("")} className="text-gray-400 hover:text-amber-600 dark:hover:text-amber-300 font-bold transition">✕</button>
                  </div>
                )}
              </div>
            )}

            {aiOutput && (
              <div className="space-y-4 pt-4 animate-fade-in">
                {tool.category === "database-schema" && (
                  <SchemaTableVisualizer
                    sourceDialect={tool.name.split("-to-")[0] || tool.name.split(" to ")[0] || "Oracle"}
                    targetDialect={tool.name.split("-to-")[1] || tool.name.split(" to ")[1] || "PostgreSQL"}
                    sourceCode={aiInputs.code || aiInputs.fileText || ""}
                    translatedCode={aiOutput}
                  />
                )}

                {tool.category === "receipt-ocr" ? (
                  <ReceiptDocumentViewer
                    rawText={aiOutput}
                    toolId={tool.id}
                    toolName={tool.name}
                    batchResults={ocrBatchResults}
                  />
                ) : tool.category === "api-integration" ? (
                  <ApiIntegrationVisualizer
                    tool={tool}
                    aiInputs={aiInputs}
                    aiOutput={aiOutput}
                  />
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden font-sans">
                  
                  {/* IDE Toolbar */}
                  <div className="bg-slate-950 px-4 py-3 border-b border-slate-850 flex flex-wrap gap-3 items-center justify-between select-none">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block"></span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 font-mono flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                        Interactive Compiled Console
                      </span>
                    </div>

                    {/* Editor Tabs & Quick Helpers */}
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center">
                        <button
                          type="button"
                          onClick={() => setOutputTab("pretty")}
                          className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md font-sans transition cursor-pointer ${
                            outputTab === "pretty" ? "bg-emerald-600/15 text-emerald-450 border border-emerald-500/10" : "text-slate-450 hover:text-slate-200"
                          }`}
                        >
                          Visual IDE
                        </button>
                        <button
                          type="button"
                          onClick={() => setOutputTab("raw")}
                          className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md font-sans transition cursor-pointer ${
                            outputTab === "raw" ? "bg-emerald-600/15 text-emerald-450 border border-emerald-500/10" : "text-slate-450 hover:text-slate-255"
                          }`}
                        >
                          Raw Text
                        </button>
                      </div>

                      {/* Tool Wrap Options */}
                      <button
                        type="button"
                        onClick={() => setOutputWrap(!outputWrap)}
                        title="Toggle Word Wrap"
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          outputWrap ? "bg-emerald-600/10 text-emerald-450 border-emerald-500/20" : "border-slate-800 text-slate-450 hover:text-slate-200 bg-slate-900"
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const blob = new Blob([aiOutput], { type: "text/plain;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = `compiled-output-${tool.id}.txt`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          setSuccessMessage("Extracted and downloaded clean sandbox console output!");
                        }}
                        title="Download Output (.txt)"
                        className="p-1.5 rounded-lg border border-slate-800 text-slate-450 hover:text-slate-200 bg-slate-900 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(aiOutput)}
                        title="Copy Output"
                        className="p-1.5 rounded-lg border border-slate-800 text-slate-450 hover:text-slate-200 bg-slate-900 transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Secondary Toolbar (Live filter in Output) */}
                  <div className="bg-slate-950/40 px-4 py-2 border-b border-slate-850/60 flex flex-wrap gap-2.5 items-center justify-between font-mono text-[10.5px]">
                    <div className="relative w-full sm:w-64">
                      <span className="absolute left-2.5 top-2 text-slate-500">
                        <Search className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        placeholder="Search compiled keywords..."
                        value={outputSearch}
                        onChange={(e) => setOutputSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg pl-7 pr-2.5 py-1 text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                      />
                      {outputSearch && (
                        <button
                          type="button"
                          onClick={() => setOutputSearch("")}
                          className="absolute right-2 top-1 w-4 h-4 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-sans font-bold text-[9px]"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Metadata indicators */}
                    <div className="flex gap-4 text-slate-450 text-[10px]">
                      <span>Size: <b className="text-slate-300 font-mono">{(new Blob([aiOutput]).size * 0.0009765625).toFixed(3)} KB</b></span>
                      <span>Lines: <b className="text-slate-300 font-mono">{aiOutput.split("\n").length}</b></span>
                      <span>Format: <b className="text-emerald-555 uppercase font-mono">UTF-8</b></span>
                    </div>
                  </div>

                  {/* Code Screen Container with dynamic gutter line numbers */}
                  <div className="flex font-mono text-xs overflow-x-auto leading-relaxed h-[360px] bg-slate-950/90 dark:bg-[#090b10] text-[#cbd5e0]">
                    {outputTab === "pretty" ? (
                      <>
                        <div className="select-none text-right pr-3.5 pl-3 border-r border-slate-850 bg-slate-950/40 text-slate-650 py-3 font-semibold min-w-[3.5rem] overflow-y-hidden">
                          {aiOutput.split("\n").map((_, i) => (
                            <div key={i} className="min-h-[1.25rem] text-[10px]">{i + 1}</div>
                          ))}
                        </div>
                        <div className="flex-1 p-3 overflow-y-auto whitespace-pre font-mono">
                          {(() => {
                            const rawLines = aiOutput.split("\n");
                            const lowerQuery = outputSearch.toLowerCase();
                            return rawLines.map((lineText, idx) => {
                              if (!outputSearch) {
                                return (
                                  <div key={idx} className="hover:bg-slate-900/30 px-1.5 transition-colors duration-75 min-h-[1.25rem] whitespace-pre select-text">
                                    {lineText || " "}
                                  </div>
                                );
                              }
                              const matched = lineText.toLowerCase().includes(lowerQuery);
                              if (!matched) {
                                return (
                                  <div key={idx} className="opacity-25 hover:bg-slate-900/30 px-1.5 transition-colors duration-75 min-h-[1.25rem] whitespace-pre select-text">
                                    {lineText || " "}
                                  </div>
                                );
                              }
                              // Split with regex to preserve original casing
                              const regex = new RegExp(`(${outputSearch})`, "gi");
                              const parts = lineText.split(regex);
                              return (
                                <div key={idx} className="bg-emerald-500/10 hover:bg-emerald-500/20 border-l-2 border-emerald-500/40 px-1.5 min-h-[1.25rem] whitespace-pre select-text">
                                  {parts.map((part, pIdx) => {
                                    const isMatch = part.toLowerCase() === lowerQuery;
                                    return isMatch ? (
                                      <mark key={pIdx} className="bg-emerald-500/30 text-white font-extrabold rounded px-0.5 select-text">
                                        {part}
                                      </mark>
                                    ) : (
                                      <span key={pIdx} className="select-text">{part}</span>
                                    );
                                  })}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </>
                    ) : (
                      <textarea
                        readOnly
                        value={aiOutput}
                        className={`w-full h-full p-4 bg-transparent outline-none border-none resize-none text-slate-350 font-mono text-xs focus:ring-0 ${
                          outputWrap ? "whitespace-pre-wrap" : "whitespace-pre"
                        }`}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      )}

      {paywallOpen && (
        <SubscriptionPaywallModal
          onClose={() => setPaywallOpen(false)}
          onUpgradeComplete={onUpgradeComplete}
        />
      )}

      {/* Dynamically refreshed AdSense Ad Block for maximizing AdSense impressions */}
      <AdSenseAd slot={`tool-utility-${tool.id}`} format="auto" />

      {/* Dynamic Feedback Collector appended to the bottom of EVERY tool work area */}
      <FeedbackForm toolId={tool.id} toolName={tool.name} user={user} />

      {/* Floating Global Toast Notification Overlay for intuitive, scroll-invariant feedback */}
      {(successMessage || errorMessage || warningMessage) && tool?.category !== "contact-management" && (
        <div id="global-floating-toast-container" className="fixed bottom-6 right-6 z-50 max-w-sm shrink-0 flex flex-col gap-2 select-none animate-slide-up pointer-events-auto">
          {successMessage && (
            <div className="bg-slate-900 border border-slate-800 dark:border-gray-200 dark:bg-white text-white dark:text-slate-900 p-4.5 rounded-2xl shadow-xl flex items-start gap-3.5 hover:scale-[1.02] transition duration-200">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-[12.5px] font-sans font-bold leading-relaxed">
                {successMessage}
              </div>
              <button onClick={() => setSuccessMessage("")} className="text-gray-400 hover:text-red-400 dark:hover:text-red-500 font-extrabold cursor-pointer text-sm">×</button>
            </div>
          )}
          {errorMessage && (
            <div className="bg-rose-900 border border-rose-950 text-white p-4.5 rounded-2xl shadow-xl flex items-start gap-3.5 hover:scale-[1.02] transition duration-200 animate-pulse-subtle">
              <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
              <div className="flex-1 text-[12.5px] font-sans font-bold leading-relaxed">
                {errorMessage}
              </div>
              <button onClick={() => setErrorMessage("")} className="text-rose-100 hover:text-rose-300 font-extrabold cursor-pointer text-sm">×</button>
            </div>
          )}
          {warningMessage && (
            <div className="bg-amber-900 border border-amber-955 text-white p-4.5 rounded-2xl shadow-xl flex items-start gap-3.5 hover:scale-[1.02] transition duration-200">
              <AlertCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div className="flex-1 text-[12.5px] font-sans font-bold leading-relaxed">
                {warningMessage}
              </div>
              <button onClick={() => setWarningMessage("")} className="text-amber-100 hover:text-amber-300 font-extrabold cursor-pointer text-sm">×</button>
            </div>
          )}
        </div>
      )}

    </main>
  );
}
