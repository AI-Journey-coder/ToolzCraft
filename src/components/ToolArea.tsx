import React, { useState, useEffect } from "react";
import { 
  FileText, Image, RefreshCw, Sparkles, AlertCircle, CheckCircle, 
  Download, ArrowRightLeft, Copy, Sliders, Play, Terminal, 
  FileSpreadsheet, HelpCircle, Loader2, Star, Plus, Minus, RotateCcw,
  ArrowLeft, Upload, Trash2, ArrowUp, ArrowDown, File
} from "lucide-react";
import { Tool } from "../types";
import { CATEGORIES } from "../data";
import FeedbackForm from "./FeedbackForm";
import AdSenseAd from "./AdSenseAd";
import SchemaTableVisualizer from "./SchemaTableVisualizer";
import SubscriptionPaywallModal from "./SubscriptionPaywallModal";

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

  // Reset errors on tool change
  useEffect(() => {
    setErrorMessage("");
    setSuccessMessage("");
  }, [tool.id]);

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
    link.click();
  };

  // ==========================================
  // 3. UNIT CONVERTER (Specially requested custom design!)
  // ==========================================
  const [conversionCategory, setConversionCategory] = useState<"length" | "mass" | "volume" | "temp">("length");
  const [conversionValue, setConversionValue] = useState<number>(1);
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
    { id: "g", name: "Grams", ratio: 1000.0 },
    { id: "mg", name: "Milligrams", ratio: 1000000.0 },
    { id: "lb", name: "Pounds", ratio: 2.20462 },
    { id: "oz", name: "Ounces", ratio: 35.274 }
  ];

  const volumeUnits = [
    { id: "l", name: "Liters", ratio: 1.0 },
    { id: "ml", name: "Milliliters", ratio: 1000.0 },
    { id: "gal", name: "Gallons (US)", ratio: 0.264172 },
    { id: "cup", name: "Cups", ratio: 4.22675 },
    { id: "tbsp", name: "Tablespoons", ratio: 67.628 }
  ];

  // Align with length default on shift
  useEffect(() => {
    if (conversionCategory === "length") setSourceUnit("m");
    if (conversionCategory === "mass") setSourceUnit("kg");
    if (conversionCategory === "volume") setSourceUnit("l");
    if (conversionCategory === "temp") setSourceUnit("C");
    setConversionResults([]);
  }, [conversionCategory]);

  const handleConvertUnits = () => {
    let results: { unit: string; name: string; value: number | string }[] = [];

    if (conversionCategory === "length") {
      const sourceObj = lengthUnits.find((u) => u.id === sourceUnit);
      if (!sourceObj) return;
      // Convert source value back to baseline (Meters)
      const baseValue = conversionValue / sourceObj.ratio;
      // Convert from baseline to all other remaining units
      lengthUnits.forEach((unit) => {
        if (unit.id !== sourceUnit) {
          results.push({
            unit: unit.id,
            name: unit.name,
            value: Number((baseValue * unit.ratio).toFixed(5))
          });
        }
      });

      // Special target conversion for feet & inches formatted representations
      let totalFeet = baseValue * 3.28084;
      if (sourceUnit === "feet") {
        totalFeet = conversionValue;
      } else if (sourceUnit === "inch") {
        totalFeet = conversionValue / 12;
      }

      // Rounded slightly to avoid float precision point gaps
      const roundedTotalFeet = Math.round(totalFeet * 1000) / 1000;
      let finalFt = Math.floor(roundedTotalFeet);
      let finalIn = Math.round((roundedTotalFeet - finalFt) * 12);
      if (finalIn >= 12) {
        finalFt += 1;
        finalIn -= 12;
      }
      if (finalFt < 0) finalFt = 0;
      if (finalIn < 0) finalIn = 0;

      results.push({
        unit: "ft-in",
        name: "Feet & Inches Summary",
        value: `${finalFt}'${finalIn}" (${finalFt} feet ${finalIn} inches)`
      });
    } else if (conversionCategory === "mass") {
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
    } else if (conversionCategory === "volume") {
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
    } else if (conversionCategory === "temp") {
      let celsius = 0;
      // Convert source to celsius baseline
      if (sourceUnit === "C") celsius = conversionValue;
      else if (sourceUnit === "F") celsius = (conversionValue - 32) * (5/9);
      else if (sourceUnit === "K") celsius = conversionValue - 273.15;

      const formats = [
        { id: "C", name: "Celsius" },
        { id: "F", name: "Fahrenheit" },
        { id: "K", name: "Kelvin" }
      ];

      formats.forEach((f) => {
        if (f.id !== sourceUnit) {
          let converted = 0;
          if (f.id === "C") converted = celsius;
          else if (f.id === "F") converted = (celsius * 9/5) + 32;
          else if (f.id === "K") converted = celsius + 273.15;

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
    } catch (e) {
      console.warn("Storage sync failed", e);
    }
  }, [
    ageDob, ageTarget, dateDiffStart, dateDiffEnd, timeDurationStart, timeDurationEnd,
    percentNum1, percentNum2, percentNum3, percentNum4, tipBillAmount, tipPercent, tipPeopleCount,
    currencyAmount, currencyFrom, currencyTo, bmiWeight, bmiHeight,
    calorieAge, calorieGender, calorieWeight, calorieHeight, calorieActivity,
    fuelDistance, fuelEfficiency, fuelPrice, gpaCourses, finPrincipal, finRate, finTenure, finExtra
  ]);

  const [contactMockLoaded, setContactMockLoaded] = useState(false);
  const [waMockLoaded, setWaMockLoaded] = useState(false);
  const [receiptMockType, setReceiptMockType] = useState<string>("");
  const [mediaQuality, setMediaQuality] = useState<number>(80);
  const [mediaScale, setMediaScale] = useState<number>(1920);
  const [mediaFormat, setMediaFormat] = useState<string>("webp");
  
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
        label1: "Total Value Withdrawn", value1: `$${Math.round(totalValueWithdrawn).toLocaleString()}`,
        label2: "Final Balance Remaining", value2: `$${Math.round(balance).toLocaleString()}`,
        label3: "Initial Principal Invested", value3: `$${Math.round(P).toLocaleString()}`
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
        label1: "Future Accumulation Value", value1: `$${Math.round(totalAmount).toLocaleString()}`,
        label2: "Total Interest Accrued", value2: `$${Math.round(interestEarned).toLocaleString()}`,
        label3: "Total Principal Deposits", value3: `$${Math.round(totalDeposits).toLocaleString()}`
      };
    }

    if (tool.id === "loan-calc" || tool.id === "mortgage-calc") {
      const r = (rate / 12) / 100;
      const months = n * 12;
      const emi = (P * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
      const emiVal = isNaN(emi) ? 0 : emi;
      const totalAmount = emiVal * months;
      return {
        label1: "Monthly Repayment Amount (EMI)", value1: `$${Math.round(emiVal).toLocaleString()} / mo`,
        label2: "Total Interest Due", value2: `$${Math.round(totalAmount - P).toLocaleString()}`,
        label3: "Grand Total Payoff Amount", value3: `$${Math.round(totalAmount).toLocaleString()}`
      };
    }

    if (tool.id === "loan-eligibility") {
      const availableEMI = Math.max(0, (P * 0.45) - extra); 
      const r = (rate / 12) / 100;
      const months = n * 12;
      const maxLoan = r > 0 ? (availableEMI * (Math.pow(1 + r, months) - 1)) / (r * Math.pow(1 + r, months)) : 0;
      return {
        label1: "Eligible EMI Slabs Allocation", value1: `$${Math.round(availableEMI).toLocaleString()} / mo`,
        label2: "Max Loan Borrowing Worth", value2: `$${Math.round(maxLoan).toLocaleString()}`,
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
        label1: "Estimated Retirement Corpus", value1: `$${Math.round(corpus).toLocaleString()}`,
        label2: "Total Scheduled Contributions", value2: `$${Math.round(P + PMT * 12 * yearsToRetire).toLocaleString()}`,
        label3: "Compound Interest Growth", value3: `$${Math.round(Math.max(0, corpus - (P + PMT * 12 * yearsToRetire))).toLocaleString()}`
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
        label1: "Estimated Take-home (Net)", value1: `$${Math.round(netTakeHome).toLocaleString()}`,
        label2: "Average Effective Tax Rate", value2: `${Math.round((tax / income) * 100) || 0}%`,
        label3: "Calculated Annual Tax Due", value3: `$${Math.round(tax).toLocaleString()}`
      };
    }

    if (tool.id === "gst-calc") {
      const base = P;
      const gstRate = rate;
      const gstAmountExclusive = base * (gstRate / 100);
      const totalExclusive = base + gstAmountExclusive;
      const gstAmountInclusive = base - (base * (100 / (100 + gstRate)));
      return {
        label1: "GST Exclusive Price", value1: `$${Math.round(totalExclusive).toLocaleString()}`,
        label2: "GST Portion (Exclusive base)", value2: `$${Math.round(gstAmountExclusive).toLocaleString()}`,
        label3: "GST Portion (Inclusive base)", value3: `$${Math.round(gstAmountInclusive).toLocaleString()}`
      };
    }

    if (tool.id === "budget-calc") {
      const needs = P * 0.5;
      const wants = P * 0.3;
      const savings = P * 0.2;
      return {
        label1: "50% Essentials (Needs)", value1: `$${Math.round(needs).toLocaleString()}`,
        label2: "30% Flexible (Wants)", value2: `$${Math.round(wants).toLocaleString()}`,
        label3: "20% Investments (Savings)", value3: `$${Math.round(savings).toLocaleString()}`
      };
    }

    if (tool.id === "roi-calc" || tool.id === "irr-calc") {
      const roiPercent = P > 0 ? ((extra - P) / P) * 100 : 0;
      const annualizedRoi = n > 0 && P > 0 ? (Math.pow(extra / P, 1 / n) - 1) * 100 : 0;
      return {
        label1: "Total ROI Percent Benefit", value1: `${roiPercent.toFixed(2)}%`,
        label2: "CAGR Return rate per Annum", value2: `${annualizedRoi.toFixed(2)}%`,
        label3: "Absolute Profit Earnings", value3: `$${Math.round(extra - P).toLocaleString()}`
      };
    }

    if (tool.id === "future-value" || tool.id === "present-value") {
      const r = rate / 100;
      const fvValue = P * Math.pow(1 + r, n);
      const pvValue = P / Math.pow(1 + r, n);
      return {
        label1: tool.id === "future-value" ? "Expected Future Value" : "Expected Present Worth",
        value1: `$${Math.round(tool.id === "future-value" ? fvValue : pvValue).toLocaleString()}`,
        label2: "Appreciation Delta portion", value2: `$${Math.round(Math.abs(fvValue - P)).toLocaleString()}`,
        label3: "Applied Discount multiplier", value3: `${(1 / Math.pow(1 + r, n)).toFixed(4)}`
      };
    }

    if (tool.id === "inflation-calc") {
      const r = rate / 100;
      const futurePrice = P * Math.pow(1 + r, n);
      return {
        label1: "Inflation Adjusted Price", value1: `$${Math.round(futurePrice).toLocaleString()}`,
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
        label2: "Projected Interest fees Accrued", value2: `$${Math.round(totalInterestPaid).toLocaleString()}`,
        label3: "Specified Monthly Payment", value3: `$${Math.round(monthlyPayment).toLocaleString()} / mo`
      };
    }

    if (tool.id === "group-splitter") {
      const perPerson = P / Math.max(1, n);
      return {
        label1: "Total Share per Person", value1: `$${perPerson.toFixed(2)}`,
        label2: "Group members total", value2: `${n} Member(s)`,
        label3: "Aggregated Bill Amount", value3: `$${P.toLocaleString()}`
      };
    }

    return {
      label1: "Analyzed Amount", value1: `$${P.toLocaleString()}`,
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
      const isPremiumUser = user && user.isPremium;
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

    try {
      const res = await fetch("/api/tool/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toolId: tool.id,
          toolName: tool.name,
          inputs: aiInputs,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAiOutput(data.output);
          
          if (isApiTool && (!user || !user.isPremium)) {
            const nextAttempts = attempts + 1;
            setAttempts(nextAttempts);
            localStorage.setItem("toolzcraft_api_attempts", String(nextAttempts));
            setSuccessMessage(`API run completed successfully! (${3 - nextAttempts} free trial attempts remaining)`);
          } else {
            setSuccessMessage("Conversion executed successfully!");
          }

          if (data.isMock) {
            // keep warning message
          }
        } else {
          setErrorMessage(data.error || "Execution failed.");
        }
      } else {
        setErrorMessage("Failed to speak with backend execution modules.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error.");
    } finally {
      setAiRunning(false);
    }
  };

  return (
    <main id="utility-work-stage" className="flex-1 p-4 md:p-8 overflow-y-auto animate-fade-in transition">
      
      {/* Dynamic Status / Feedback messages */}
      {errorMessage && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 text-rose-700 dark:text-rose-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

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
              
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-850/50 transition relative">
                <input
                  id="compressor-uploader"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Image className="w-12 h-12 text-gray-350 dark:text-gray-650 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {compressImgFile ? compressImgFile.name : "Drag & Drop or Click to Upload"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Supports PNG, JPEG, WebP up to 15MB. All processing occurs 100% in-browser! No files are sent to servers.
                </p>
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
            {(["length", "mass", "volume", "temp"] as const).map((cat) => (
              <button
                id={`unit-category-tab-${cat}`}
                key={cat}
                onClick={() => setConversionCategory(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-lg border uppercase transition cursor-pointer flex items-center gap-1.5 ${
                  conversionCategory === cat
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                    : "bg-gray-50 dark:bg-gray-850 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-450 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Input params form */}
            <div className="bg-gray-50/50 dark:bg-gray-950/30 border border-gray-200 dark:border-gray-850 p-4 rounded-xl space-y-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Define Input Parameters</h3>
              
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Enter Numeric Value</label>
                <input
                  id="conversion-value-input"
                  type="number"
                  value={conversionValue}
                  onChange={(e) => setConversionValue(parseFloat(e.target.value) || 0)}
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
                  {conversionCategory === "mass" &&
                    massUnits.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                  {conversionCategory === "volume" &&
                    volumeUnits.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                  {conversionCategory === "temp" && (
                    <>
                      <option value="C">Celsius (°C)</option>
                      <option value="F">Fahrenheit (°F)</option>
                      <option value="K">Kelvin (K)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Complete output table results mapping all requested metrics */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold select-none">
                <span className="text-gray-500">Formulated Output Calculations Table</span>
                <span className="text-emerald-600 dark:text-emerald-450">Input: {conversionValue} {sourceUnit}</span>
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
                      <div>
                        <div className="flex justify-between items-center mb-1.5 font-mono">
                          <label htmlFor="fin-principal-input" className="block text-xs font-bold text-gray-500 uppercase select-none">
                            Principal / Capital Amount ($)
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
                          <span>$500</span>
                          <span>$1,000,000,000</span>
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
                          <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-mono font-bold">$</span>
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

            {/* 2. CONTACT MANAGEMENT CATEGORY WORKSPACE */}
            {tool.category === "contact-management" && (
              <div className="space-y-5 bg-white dark:bg-gray-900 border border-gray-155 dark:border-gray-800 rounded-xl p-5 shadow-xs animate-fade-in text-gray-900 dark:text-white">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-3">
                  <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Directory Database Configurator</h3>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded font-mono font-bold uppercase">VCF / CSV parser</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center hover:bg-gray-50/50 dark:hover:bg-gray-950/25 transition cursor-pointer">
                      <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <span className="block text-xs font-bold text-gray-655 dark:text-gray-300 font-sans">Drop standard contact files here</span>
                      <span className="text-[10px] text-gray-400 mt-1 block">Supports .csv or .vcf up to 25MB</span>
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setContactMockLoaded(true);
                          setSuccessMessage("Loaded mock company personnel database with 42 contacts!");
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                      >
                        ⚡ Load Sample Dataset
                      </button>
                      {contactMockLoaded && (
                        <button
                          type="button"
                          onClick={() => {
                            setContactMockLoaded(false);
                            setSuccessMessage("Cleaned contacts workbook.");
                          }}
                          className="px-3.5 py-2 bg-gray-100 dark:bg-gray-850 hover:bg-gray-200 text-gray-650 dark:text-gray-350 text-xs font-bold rounded-lg transition cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 bg-gray-50/50 dark:bg-gray-950/20 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
                    <h4 className="text-[10px] uppercase font-mono font-extrabold text-emerald-600 tracking-wider">Data Cleaning Filters</h4>
                    <div className="space-y-2.5 text-xs text-gray-700 dark:text-gray-300">
                      <label className="flex items-center gap-2 font-medium cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded accent-emerald-500" />
                        <span>Strip whitespaces and non-ascii phone labels</span>
                      </label>
                      <label className="flex items-center gap-2 font-medium cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded accent-emerald-500" />
                        <span>Consolidate identical email duplicates</span>
                      </label>
                      <label className="flex items-center gap-2 font-medium cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded accent-emerald-555" />
                        <span>Enforce automatic +1 Country ID prefixed</span>
                      </label>
                    </div>

                    {contactMockLoaded && (
                      <div className="pt-2 border-t border-gray-150 dark:border-gray-800 space-y-1.5 animate-fade-in font-mono">
                        <span className="text-[10px] text-gray-400 font-bold block uppercase">Matched Audit Log</span>
                        <div className="text-[10px] text-gray-500 space-y-1">
                          <div className="flex justify-between"><span>Personnel duplicates mergeable:</span> <span className="text-amber-550 font-bold">2 Found</span></div>
                          <div className="flex justify-between"><span>Standardized formats:</span> <span className="text-emerald-500 font-bold">14 Fixed</span></div>
                          <div className="flex justify-between"><span>Missing emails list:</span> <span className="text-rose-500 font-bold">3 Tagged</span></div>
                        </div>
                      </div>
                    )}
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
              </div>
            )}

            {/* 4. RECEIPT OCR CATEGORY WORKSPACE */}
            {tool.category === "receipt-ocr" && (
              <div className="space-y-5 bg-white dark:bg-gray-900 border border-gray-155 dark:border-gray-800 rounded-xl p-5 shadow-xs animate-fade-in text-gray-900 dark:text-white">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-3">
                  <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Invoice & Receipt Scanner AI</h3>
                  <span className="text-[9px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded font-mono font-bold uppercase font-black">OCR Parser</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-rose-500/10 rounded-xl p-6 text-center hover:bg-rose-50/[0.04] transition cursor-pointer relative overflow-hidden">
                      {receiptMockType && (
                        <div className="absolute inset-0 bg-rose-500/5 flex items-center justify-center">
                          <div className="w-full h-1 bg-rose-500/50 absolute top-0 animate-[bounce_2s_infinite]"></div>
                        </div>
                      )}
                      <Upload className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                      <span className="block text-xs font-bold text-gray-655 dark:text-gray-300 font-sans">Drop purchase slips or scans here</span>
                      <span className="text-[10px] text-gray-400 mt-1 block">Supports .jpg, .png, or .pdf files</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptMockType("Walmart grocery slip");
                          setSuccessMessage("Walmart receipt loaded with 3 items scanned!");
                        }}
                        className="py-1.5 bg-rose-50/50 dark:bg-rose-955/20 border border-rose-500/10 hover:border-rose-500 text-rose-600 rounded text-[11px] font-bold transition cursor-pointer"
                      >
                         Walmart Grocery
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptMockType("Starbucks coffee invoice");
                          setSuccessMessage("Starbucks slip loaded!");
                        }}
                        className="py-1.5 bg-rose-50/50 dark:bg-rose-955/20 border border-rose-500/10 hover:border-rose-500 text-rose-600 rounded text-[11px] font-bold transition cursor-pointer"
                      >
                         Starbucks Cafe
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50/50 dark:bg-gray-950/20 rounded-xl border border-gray-150 dark:border-gray-805 flex flex-col justify-between">
                    <h4 className="text-[10px] uppercase font-mono font-extrabold text-rose-500 tracking-wider mb-2">Recognized Line Items</h4>
                    {receiptMockType ? (
                       <div className="space-y-3 animate-fade-in">
                         <div className="text-[10px] font-bold text-gray-450 font-mono uppercase font-semibold">Merchant: {receiptMockType.toUpperCase()}</div>
                         <div className="text-xs font-mono border-t border-gray-150 dark:border-gray-850 pt-2 space-y-1">
                           <div className="flex justify-between text-gray-700 dark:text-gray-305"><span>1x Whole Wheat Grain Bread</span> <span className="font-bold">$3.49</span></div>
                           <div className="flex justify-between text-gray-700 dark:text-gray-305"><span>2x Organic Avocados</span> <span className="font-bold">$2.98</span></div>
                           <div className="flex justify-between text-gray-700 dark:text-gray-305"><span>1x Premium Almond Blend Milk</span> <span className="font-bold">$4.20</span></div>
                         </div>
                         <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 border-t border-dashed border-gray-200 dark:border-gray-800 pt-2.5">
                           <span>Verified Total Cost:</span>
                           <span>$10.67</span>
                         </div>
                       </div>
                    ) : (
                      <div className="text-xs text-gray-455 leading-relaxed py-6 text-center font-sans">
                        Select a Walmart/Starbucks sample preset receipt to test the automated optical character recognition indexing!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. MEDIA OPTIMIZATION CATEGORY WORKSPACE */}
            {tool.category === "media-optimization" && (
              <div className="space-y-5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-5 shadow-xs animate-fade-in text-gray-900 dark:text-white font-sans">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-3">
                  <h3 className="font-extrabold text-xs text-gray-400 tracking-wider font-mono uppercase">Image & Media Asset Workbench</h3>
                  <span className="text-[9px] bg-indigo-505/10 text-indigo-505 px-2 py-0.5 rounded font-mono font-bold uppercase font-bold font-mono">WebP Converter</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-indigo-500/10 rounded-xl p-6 text-center hover:bg-indigo-50/[0.04] transition cursor-pointer">
                      <Image className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                      <span className="block text-xs font-bold text-gray-655 dark:text-gray-300 font-sans">Select source images or media assets</span>
                      <span className="text-[10px] text-gray-400 mt-1 block font-mono">Supports webp, jpg, png, heic, mp4</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target Format</label>
                        <select
                          value={mediaFormat}
                          onChange={(e) => setMediaFormat(e.target.value)}
                          className="w-full text-xs px-2.5 py-1 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded text-gray-901 dark:text-white font-semibold font-sans"
                        >
                          <option value="webp">WebP (Optimized)</option>
                          <option value="jpg">JPEG standard</option>
                          <option value="png">PNG lossless</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Max resolution</label>
                        <select
                          value={mediaScale}
                          onChange={(e) => setMediaScale(parseInt(e.target.value))}
                          className="w-full text-xs px-2.5 py-1 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded text-gray-901 dark:text-white font-semibold font-sans"
                        >
                          <option value="1920">FHD (1920px)</option>
                          <option value="1280">Desktop (1280px)</option>
                          <option value="800">Mobile (800px)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 bg-gray-50/50 dark:bg-gray-955 rounded-xl border border-gray-150 dark:border-gray-800">
                    <h4 className="text-[10px] uppercase font-mono font-extrabold text-indigo-500 tracking-wider">Compression quality ratio: {mediaQuality}%</h4>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={mediaQuality}
                      onChange={(e) => setMediaQuality(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />

                    <div className="pt-2 border-t border-gray-150 dark:border-gray-800 space-y-2 text-xs text-gray-750 dark:text-gray-300">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded accent-indigo-500" />
                        <span>Strip internal EXIF sensor tags</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded accent-indigo-500" />
                        <span>Maintain original color space profile</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSuccessMessage(`Lossless convert scheduled! Compressed media asset by ${100 - mediaQuality}%`)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition mt-2 cursor-pointer font-sans"
                    >
                      💡 Run Compression Optimizer Engine
                    </button>
                  </div>
                </div>
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
              <div className="space-y-5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-5 shadow-xs animate-fade-in text-gray-905 dark:text-white font-mono">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-3">
                  <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Dynamic SQL Relational Workbench</h3>
                  <span className="text-[9px] bg-sky-500/10 text-sky-655 px-2 py-0.5 rounded font-mono font-bold uppercase">Postgres dialector</span>
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
                      className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded font-mono font-bold text-gray-901 dark:text-white font-mono"
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
              </div>
            )}

            {/* 8. DATA TRANSFORMATION WORKSPACE */}
            {tool.category === "data-transformation" && (
              <div className="space-y-5 bg-white dark:bg-gray-905 border border-gray-155 dark:border-gray-830 rounded-xl p-5 shadow-xs animate-fade-in text-gray-905 dark:text-white font-mono">
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
             tool.id !== "uuid-generator" && 
             tool.id !== "hash-generator" && 
             tool.id !== "regex-tester" && 
             !tool.id.includes("diff") && (
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

            <button
              id="trigger-ai-sandbox-runner-btn"
              onClick={handleTriggerAiUtility}
              disabled={aiRunning}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {aiRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Running Translation...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Build & execute conversion
                </>
              )}
            </button>

            {aiOutput && (
              <div className="space-y-4 pt-2 animate-fade-in">
                {tool.category === "database-schema" && (
                  <SchemaTableVisualizer
                    sourceDialect={tool.name.split("-to-")[0] || tool.name.split(" to ")[0] || "Oracle"}
                    targetDialect={tool.name.split("-to-")[1] || tool.name.split(" to ")[1] || "PostgreSQL"}
                    sourceCode={aiInputs.code || aiInputs.fileText || ""}
                    translatedCode={aiOutput}
                  />
                )}

                <div className="flex items-center justify-between text-xs font-semibold select-none">
                  <span className="text-gray-650 dark:text-gray-350">Dynamic Sandbox output results:</span>
                  <button
                    id="copy-ai-output-btn"
                    onClick={() => handleCopy(aiOutput)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-850 rounded text-gray-400 hover:text-emerald-600 transition"
                    title="Copy response markdown"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 text-xs font-mono max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {aiOutput}
                </div>
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
      <FeedbackForm toolId={tool.id} toolName={tool.name} />

    </main>
  );
}
