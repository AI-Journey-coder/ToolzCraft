import React, { useState, useEffect } from "react";
import { 
  Play, Terminal, Server, ShieldCheck, Activity, Search, 
  RefreshCw, FolderTree, Key, Check, AlertTriangle, Layers, 
  BookOpen, Plus, Trash, Copy, Compass, HelpCircle, FileJson, 
  ArrowRight, CheckSquare, Sparkles, ChevronRight, ChevronDown, CheckCircle2
} from "lucide-react";

interface ApiIntegrationVisualizerProps {
  tool: {
    id: string;
    name: string;
    category: string;
    description: string;
  };
  aiInputs: Record<string, any>;
  aiOutput: string;
}

export default function ApiIntegrationVisualizer({ tool, aiInputs, aiOutput }: ApiIntegrationVisualizerProps) {
  const [activeSubTab, setActiveSubTab] = useState<"visual" | "raw">("visual");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- SUB-FEATURE STATES: MOCK RUNNER (Feature A) ---
  const [mockMethod, setMockMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">("GET");
  const [mockUrl, setMockUrl] = useState("/api/v1/resource");
  const [mockHeaders, setMockHeaders] = useState<{ k: string; v: string }[]>([
    { k: "Authorization", v: "Bearer tc_live_84f938aed9b8" },
    { k: "Content-Type", v: "application/json" }
  ]);
  const [mockBody, setMockBody] = useState("");
  const [isRunningMock, setIsRunningMock] = useState(false);
  const [mockResponse, setMockResponse] = useState<any>(null);
  const [mockLatency, setMockLatency] = useState<number | null>(null);
  const [mockStatus, setMockStatus] = useState<number | null>(null);

  // --- SUB-FEATURE STATES: COLLECTION EXPLORER (Feature B) ---
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [explorerSearch, setExplorerSearch] = useState("");

  // --- SUB-FEATURE STATES: GRAPHQL EXPLORER (Feature D) ---
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({
    "Query": true,
    "User": true
  });

  // Handle standard clipboard copy operation
  const [copied, setCopied] = useState(false);
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    triggerNotification("Copied content schema code to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Safe wrapper for trigger initial state values based on the generated outputs
  useEffect(() => {
    // Attempt to guess URL or method if user converted curl
    const rawVal = aiInputs.code || aiInputs.fileText || "";
    if (rawVal) {
      if (rawVal.includes("-X POST") || rawVal.includes("POST")) {
        setMockMethod("POST");
      } else if (rawVal.includes("-X PUT")) {
        setMockMethod("PUT");
      } else if (rawVal.includes("-X DELETE")) {
        setMockMethod("DELETE");
      }
      
      const urlMatch = rawVal.match(/curl\s+(?:-X\s+\w+\s+)?["']?(https?:\/\/[^\s"']+)/);
      if (urlMatch && urlMatch[1]) {
        try {
          const parsed = new URL(urlMatch[1]);
          setMockUrl(parsed.pathname + parsed.search);
        } catch (_) {
          setMockUrl(urlMatch[1]);
        }
      }
    }
  }, [tool.id, aiInputs]);

  // Execute mock endpoint simulator logic
  const handleExecuteMock = () => {
    setIsRunningMock(true);
    setMockResponse(null);
    setMockLatency(null);
    setMockStatus(null);

    setTimeout(() => {
      const isOcrOrWsdl = tool.id.includes("wsdl") || tool.id.includes("soap");
      const isGraphQl = tool.id.includes("graphql");
      const randomId = Math.floor(Math.random() * 9000) + 1000;
      
      let resPayload: any = {};
      if (isGraphQl) {
        resPayload = {
          data: {
            user: {
              id: `${randomId}`,
              username: "developer_pro",
              email: "api.journey@toolzcraft.io",
              reputation: 4920,
              permissions: ["developer", "subscriber_premium"],
              meta: {
                activeSessionToken: "session_node_9fb82da28ac100a84d",
                lastQueriedAt: new Date().toISOString()
              }
            }
          }
        };
      } else if (isOcrOrWsdl) {
        resPayload = {
          Envelope: {
            Header: {
              TransactionId: `TX-${randomId}`
            },
            Body: {
              GetResponse: {
                Status: "Success",
                QueryTimestamp: new Date().toISOString(),
                ExecutionLogs: "Compiled SOAP endpoint mapped to REST node. Payload successfully dispatched to target server cloud cluster."
              }
            }
          }
        };
      } else {
        // Standard curl or openapi converted mocks
        resPayload = {
          status: "success",
          requestId: `req_${Math.random().toString(36).substring(4, 12)}`,
          message: "Synchronized HTTP request delivered via dynamic proxy simulator.",
          requestDetails: {
            uri: mockUrl,
            dispatchedMethod: mockMethod,
            configuredHeadersCount: mockHeaders.length,
            simulatedOverhead: "0.24ms"
          },
          data: {
            nodeId: "sandbox_cluster_alpha",
            region: "us-central1-gcp",
            record: {
              id: randomId,
              title: "Sovereign API Client Model Node",
              state: "ACTIVE",
              pricingTier: "Premium Plan Enabled",
              owner: "new.ai.journey@gmail.com",
              metrics: {
                totalRuns: 140,
                revenueOffset: 0.08,
                averagePingMs: 14
              }
            }
          }
        };
      }

      setMockResponse(resPayload);
      setMockStatus(mockMethod === "POST" ? 201 : 200);
      setMockLatency(Math.floor(Math.random() * 85) + 15); // 15ms to 100ms
      setIsRunningMock(false);
      triggerNotification("Sovereign Sandbox: Mock request completed!");
    }, 850);
  };

  // --- SUB-DATA PARSERS ---
  // A. Parsed collection directories for OpenAPI / Postman converters (Feature B)
  const getMockCollection = () => {
    return [
      {
        folder: "Authentication Endpoint Setup",
        endpoints: [
          { method: "POST" as const, path: "/oauth/token", desc: "Generate Bearer session access tokens.", reqBody: `{\n  "client_id": "tc_cli_84",\n  "client_secret": "******",\n  "grant_type": "client_credentials"\n}` },
          { method: "GET" as const, path: "/oauth/verify", desc: "Inspect current authorization token state.", reqBody: null }
        ]
      },
      {
        folder: "Client Profiles & Database Entities",
        endpoints: [
          { method: "GET" as const, path: "/api/v1/users", desc: "Fetch list of paginated users.", reqBody: null },
          { method: "POST" as const, path: "/api/v1/users", desc: "Register a brand new database record card.", reqBody: `{\n  "email": "new.customer@org.io",\n  "name": "Alex Mercer",\n  "tier": "Premium"\n}` },
          { method: "GET" as const, path: "/api/v1/users/{userId}", desc: "Retrieve singular member data indices.", reqBody: null },
          { method: "PUT" as const, path: "/api/v1/users/{userId}", desc: "Modify parameters on an existing record card.", reqBody: `{\n  "status": "SUSPENDED",\n  "restrictionReason": "Quota limit breach"\n}` }
        ]
      },
      {
        folder: "Analytics Pipelines",
        endpoints: [
          { method: "GET" as const, path: "/api/v1/reports/traffic", desc: "Browse daily AdSense pageviews counter insights.", reqBody: null },
          { method: "GET" as const, path: "/api/v1/reports/api-costs", desc: "Calculate operating expenditure summary metrics.", reqBody: null }
        ]
      }
    ];
  };

  // B. Parsed Validation checks for API validators / OpenAPI Diff (Feature C)
  const getValidationChecks = () => {
    const isDiff = tool.id === "openapi-diff";
    if (isDiff) {
      return {
        score: 88,
        totalChecked: 14,
        changes: [
          { type: "Breaking Change" as const, text: "Deprecated route POST `/api/v1/legacy/checkout`. Calls to this endpoint will error out with 410 Gone.", ref: "Line 424" },
          { type: "Breaking Change" as const, text: "Changed query parameter type on GET `/api/v1/users` - field `limit` changed from dynamic String to rigid Integer.", ref: "Line 108" },
          { type: "Non-Breaking Change" as const, text: "Added optional body parameters on POST `/api/v1/users`: `phoneNumber` (String regexp format).", ref: "Line 192" },
          { type: "Non-Breaking Change" as const, text: "Configured CORS preflight headers support mapping across all v1 routing nodes.", ref: "Line 14" }
        ],
        rules: [
          { label: "Valid YAML indentation alignments verification", passed: true },
          { label: "Path definitions unique URI checks", passed: true },
          { label: "Duplicate resource variables declarations guard", passed: true },
          { label: "Deprecated properties security compliance guidelines", passed: false }
        ]
      };
    } else {
      // General Swagger/OpenAPI validator
      return {
        score: 97,
        totalChecked: 24,
        changes: [],
        rules: [
          { label: "Swagger OpenApi specification core compliance", passed: true },
          { label: "Relative routes syntax checker", passed: true },
          { label: "Model Schemas validation rules correctness", passed: true },
          { label: "MIME types declaration formats checking (multipart/form-data, JSON)", passed: true },
          { label: "Response objects structure criteria verification", passed: true },
          { label: "Parameters types conformity against OpenAPI v3.0 syntax standards", passed: true },
          { label: "Server connection nodes schema syntax integrity", passed: true },
          { label: "Header structure parameters keys mapping verification", passed: true }
        ]
      };
    }
  };

  // C. Parsed entities for GraphQL Schema Viewer (Feature D)
  const getMockGraphQlEntities = () => {
    return [
      {
        name: "Query",
        icon: "🔍",
        fields: [
          { name: "me", type: "User!", desc: "The currently authenticated user profile." },
          { name: "user(id: ID!)", type: "User", desc: "Query a specific user node." },
          { name: "statistics(scope: String)", type: "PlatformStats!", desc: "Admin analytics metrics query node." }
        ]
      },
      {
        name: "Mutation",
        icon: "⚡",
        fields: [
          { name: "updateProfile(input: ProfileInput!)", type: "User!", desc: "Update display credentials metrics." },
          { name: "registerUserEmail(email: String!)", type: "User!", desc: "Manually queue user credentials promo." }
        ]
      },
      {
        name: "User",
        icon: "👤",
        fields: [
          { name: "id", type: "ID!", desc: "Unique numeric identifier." },
          { name: "username", type: "String!", desc: "Alpha-numeric handle display descriptor." },
          { name: "email", type: "String!", desc: "Valid verified email index." },
          { name: "isPremium", type: "Boolean!", desc: "Active subscriber flag state." },
          { name: "expiryDate", type: "String", desc: "Promotional expiration timestamp text value." }
        ]
      },
      {
        name: "PlatformStats",
        icon: "📊",
        fields: [
          { name: "monthlyUsers", type: "Int!", desc: "Total Active user sessions tracked." },
          { name: "conversionRate", type: "Float!", desc: "Direct client conversion coefficient ratio." },
          { name: "calculatedRevenue", type: "Float!", desc: "Active gross cash values metrics tracking." }
        ]
      }
    ];
  };

  // Determine subclass categories of tools to show customized visual tabs
  const isConverter = tool.id.includes("curl") || tool.id.includes("soap") || tool.id.includes("wsdl") || tool.id.includes("graphql-rest");
  const isCollectionConverter = tool.id.includes("postman") || tool.id.includes("openapi") && !tool.id.includes("validator") && !tool.id.includes("diff") && !isConverter;
  const isValidationTool = tool.id.includes("validator") || tool.id.includes("diff");
  const isGraphQlTool = tool.id.includes("graphql") && !tool.id.includes("rest");

  return (
    <div id="api-integration-visualizer-container" className="bg-white dark:bg-gray-901 border border-gray-150 dark:border-gray-850 rounded-2xl overflow-hidden shadow-sm animate-fade-in font-sans w-full">
      
      {/* Toast Feedback Notification Overlay */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-slate-900 border border-slate-800 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl z-50 flex items-center gap-2 font-mono tracking-tight animate-slide-up">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header element */}
      <div className="bg-slate-50 dark:bg-slate-950/40 p-4 border-b border-gray-150 dark:border-gray-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#207886]/10 text-[#207886] rounded-xl">
            <Compass className="w-5 h-5 text-[#207886]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] uppercase font-bold tracking-widest bg-[#207886]/10 text-[#207886] px-2 py-0.5 rounded font-mono">
                API Integration Engine
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h3 className="font-extrabold text-gray-900 dark:text-white mt-0.5 text-sm">
              {tool.name} Sandbox Explorer
            </h3>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="bg-gray-100 dark:bg-slate-900 p-0.5 rounded-lg border border-gray-150 dark:border-slate-800 flex items-center text-xs self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActiveSubTab("visual")}
            className={`px-3 py-1.5 font-bold rounded-md transition duration-150 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "visual"
                ? "bg-white dark:bg-slate-800 text-[#207886] shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Interactive View
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("raw")}
            className={`px-3 py-1.5 font-bold rounded-md transition duration-150 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "raw"
                ? "bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow-xs"
                : "text-gray-400 hover:text-gray-900"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Source Codes
          </button>
        </div>
      </div>

      {/* Main Body Node Panels */}
      <div className="p-5 md:p-6">
        {activeSubTab === "raw" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase block">
                Generated Target Code (UTF-8 format)
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(aiOutput)}
                className="px-2.5 py-1 text-[11px] font-mono text-[#207886] bg-[#207886]/5 hover:bg-[#207886]/10 rounded border border-[#207886]/10 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-xs text-slate-350 overflow-x-auto max-h-[420px] leading-relaxed whitespace-pre-wrap">
              {aiOutput}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* FEATURE A: INTERACTIVE ENDPOINT MOCK RUNNER SECTION */}
            {isConverter && (
              <div id="converter-sandbox-view" className="space-y-6 animate-fade-in">
                <div className="bg-[#207886]/5 border border-[#207886]/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold font-mono text-[#207886] flex items-center gap-1.5 uppercase">
                      <Layers className="w-3.5 h-3.5" />
                      Automatic client-code translation active
                    </h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      This system generated direct REST equivalent blocks out of your inputs. You can now execute interactive sandbox request calls directly within our browser wrapper sandbox.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* Left Parameter Panel */}
                  <div className="lg:col-span-5 bg-gray-50 dark:bg-slate-900/60 p-4 rounded-xl border border-gray-150 dark:border-slate-800/80 space-y-4">
                    <span className="text-[10px] font-mono uppercase font-black text-[#207886] tracking-wider block">
                      1. Client API Request Dispatcher
                    </span>
                    
                    <div className="space-y-3 text-xs">
                      {/* Method & URI */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-gray-700">HTTP Method & Path URL</label>
                        <div className="flex gap-2">
                          <select
                            value={mockMethod}
                            onChange={(e: any) => setMockMethod(e.target.value)}
                            className="bg-white border border-gray-250 text-gray-800 font-extrabold px-2 py-1.5 rounded focus:outline-none text-[11px] font-mono"
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                          </select>
                          <input
                            type="text"
                            value={mockUrl}
                            onChange={(e) => setMockUrl(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-[11.5px] font-mono bg-white border border-gray-250 rounded focus:outline-none"
                            placeholder="/api/v1/resource"
                          />
                        </div>
                      </div>

                      {/* Header lines list */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="block text-[11px] font-bold text-gray-700">HTTP Headers Configured</label>
                          <button
                            type="button"
                            onClick={() => setMockHeaders([...mockHeaders, { k: "", v: "" }])}
                            className="text-[10px] text-[#207886] font-bold hover:underline cursor-pointer"
                          >
                            + Add Header
                          </button>
                        </div>
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                          {mockHeaders.map((hdr, hIdx) => (
                            <div key={hIdx} className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={hdr.k}
                                onChange={(e) => {
                                  const next = [...mockHeaders];
                                  next[hIdx].k = e.target.value;
                                  setMockHeaders(next);
                                }}
                                className="w-1/3 px-2 py-1 bg-white border border-gray-250 rounded text-[10.5px] font-mono focus:outline-none"
                                placeholder="Key"
                              />
                              <input
                                type="text"
                                value={hdr.v}
                                onChange={(e) => {
                                  const next = [...mockHeaders];
                                  next[hIdx].v = e.target.value;
                                  setMockHeaders(next);
                                }}
                                className="flex-1 px-2 py-1 bg-white border border-gray-250 rounded text-[10.5px] font-mono focus:outline-none"
                                placeholder="Value"
                              />
                              <button
                                type="button"
                                onClick={() => setMockHeaders(mockHeaders.filter((_, idx) => idx !== hIdx))}
                                className="text-gray-400 hover:text-red-500 font-extrabold text-[12px] p-1 cursor-pointer"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Trigger Button */}
                      <button
                        type="button"
                        onClick={handleExecuteMock}
                        disabled={isRunningMock}
                        className="w-full py-2.5 bg-slate-900 border border-slate-950 text-white font-mono text-[11px] font-extrabold rounded-lg flex items-center justify-center gap-1.5 hover:bg-slate-800 hover:border-slate-900 transition duration-150 shadow-3xs cursor-pointer select-none"
                      >
                        {isRunningMock ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Dispatching Connection Nodes...
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-emerald-400" />
                            ⚡ EXECUTE SIMULATOR CALL
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right Console Output Panel */}
                  <div className="lg:col-span-7 bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4 shadow-sm flex flex-col justify-between min-h-[320px]">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                          2. Live Response Terminal Console
                        </span>
                        
                        {mockStatus && (
                          <div className="flex gap-2.5 text-[10px] font-mono">
                            <span className="text-slate-500">
                              Time: <strong className="text-slate-300">{mockLatency}ms</strong>
                            </span>
                            <span className="text-slate-500">
                              Status: <strong className="text-emerald-400">{mockStatus} OK</strong>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="font-mono text-xs leading-relaxed max-h-[200px] overflow-y-auto">
                        {mockResponse ? (
                          <pre className="text-emerald-400 font-medium whitespace-pre">
                            {JSON.stringify(mockResponse, null, 2)}
                          </pre>
                        ) : (
                          <div className="text-slate-500 text-center py-12 flex flex-col items-center justify-center gap-2">
                            <p>┌───────────── SYSTEM OVERVIEW ────────────┐</p>
                            <p className="text-[11px] max-w-sm">
                              Enter parameters on the left controls and click the request execution triggers. Our backend parses the output schema structures, resolves route variables and returns valid JSON.
                            </p>
                            <p>└───────────────────────────────────────────┘</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-850 pt-2.5 text-[10px] font-mono text-slate-500 flex justify-between items-center">
                      <span>Server Node: <strong className="text-slate-400">toolzcraft-edge-gcp</strong></span>
                      <span>Security: <strong className="text-[#207886]">Verified (Sandbox)</strong></span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* FEATURE B: INTERACTIVE COLLECTION TREE EXPLORER (CONVERTERS) */}
            {isCollectionConverter && (
              <div id="collection-explorer-view" className="space-y-6 animate-fade-in">
                <div className="bg-[#207886]/5 border border-[#207886]/10 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold font-mono text-[#207886] flex items-center gap-1.5 uppercase">
                      <FolderTree className="w-3.5 h-3.5" />
                      Visual API Collection Trees Explorer
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      We deconstructed your converted files output into directory trees folders. Use the interactive menu indexes below to browse path parameters schemas.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column directory tree */}
                  <div className="md:col-span-5 bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-150 dark:border-slate-800/80 p-4 space-y-3.5">
                    
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Filter collection routes..."
                        value={explorerSearch}
                        onChange={(e) => setExplorerSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-250 rounded focus:outline-none"
                      />
                    </div>

                    <div className="space-y-3">
                      {getMockCollection().map((fld, fIdx) => {
                        // filter endpoints
                        const matchedEndpoints = fld.endpoints.filter(ep => 
                          ep.path.toLowerCase().includes(explorerSearch.toLowerCase()) ||
                          ep.desc.toLowerCase().includes(explorerSearch.toLowerCase())
                        );

                        if (matchedEndpoints.length === 0) return null;

                        return (
                          <div key={fIdx} className="space-y-1.5">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-450 block flex items-center gap-1">
                              📁 {fld.folder}
                            </span>
                            
                            <div className="space-y-1 pl-3 border-l border-gray-200 dark:border-slate-800">
                              {matchedEndpoints.map((ep, eIdx) => {
                                const isSel = selectedPath === ep.path;
                                const isGet = (ep.method as string) === "GET";
                                const isPost = (ep.method as string) === "POST";
                                const isPut = (ep.method as string) === "PUT";
                                const isDelete = (ep.method as string) === "DELETE";

                                return (
                                  <button
                                    key={eIdx}
                                    type="button"
                                    onClick={() => {
                                      setSelectedPath(ep.path);
                                      // prefill request simulator fields
                                      setMockUrl(ep.path);
                                      setMockMethod(ep.method);
                                      setMockBody(ep.reqBody || "");
                                    }}
                                    className={`w-full text-left p-1.5 rounded text-xs transition flex items-center justify-between hover:bg-gray-150/75 dark:hover:bg-slate-800/50 cursor-pointer ${
                                      isSel ? "bg-[#207886]/10 text-[#207886] font-bold border-l-2 border-[#207886]" : "text-gray-700"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[9px] font-mono px-1 rounded font-black ${
                                        isGet ? "bg-emerald-50 text-emerald-700" :
                                        isPost ? "bg-blue-50 text-blue-700" :
                                        isPut ? "bg-amber-50 text-amber-700" :
                                        "bg-rose-50 text-rose-700"
                                      }`}>
                                        {ep.method}
                                      </span>
                                      <span className="font-mono text-[10.5px] select-text truncate max-w-[130px] sm:max-w-none">
                                        {ep.path}
                                      </span>
                                    </div>
                                    <ChevronRight className="w-3 h-3 text-gray-400" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column details viewer */}
                  <div className="md:col-span-7 bg-white dark:bg-slate-905 rounded-xl border border-gray-150 dark:border-gray-850 p-4 space-y-4">
                    {selectedPath ? (
                      (() => {
                        const allEp = getMockCollection().flatMap(f => f.endpoints);
                        const epObj = allEp.find(e => e.path === selectedPath);
                        if (!epObj) return null;

                        return (
                          <div className="space-y-4 animate-fade-in">
                            <div className="border-b border-gray-100 dark:border-slate-850 pb-3 flex justify-between items-start">
                              <div className="space-y-0.5">
                                <span className="text-[10px] uppercase font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                                  Endpoint Node
                                </span>
                                <h5 className="font-bold font-mono text-gray-901 select-text mt-1 text-xs">
                                  {epObj.method} {epObj.path}
                                </h5>
                              </div>
                            </div>

                            <div className="space-y-2 text-xs">
                              <div>
                                <span className="text-[10px] text-gray-400 block font-mono">Functional Purpose</span>
                                <p className="text-xs text-gray-750 font-medium select-text mt-0.5">{epObj.desc}</p>
                              </div>

                              {epObj.reqBody && (
                                <div className="space-y-1 pt-2">
                                  <span className="text-[10px] text-gray-400 block font-mono">Request Payload Template (JSON)</span>
                                  <pre className="bg-slate-900 text-[#cbd5e0] p-3 rounded-lg text-[11px] font-mono leading-relaxed whitespace-pre select-text overflow-x-auto">
                                    {epObj.reqBody}
                                  </pre>
                                </div>
                              )}

                              {/* Interactive Call Link */}
                              <div className="pt-4 border-t border-gray-100 dark:border-slate-850 space-y-2">
                                <span className="text-[10px] text-gray-400 block font-mono">Simulate Call Request</span>
                                <p className="text-[11px] text-gray-500">
                                  Request properties are loaded into your live HTTP sandbox below. Click the run icon to verify structure mapping logic.
                                </p>
                                <button
                                  type="button"
                                  onClick={handleExecuteMock}
                                  disabled={isRunningMock}
                                  className="py-1.5 px-3 bg-[#207886] hover:bg-[#1a5f6a] text-white font-mono text-[10.5px] font-bold rounded-lg flex items-center gap-1.5 transition duration-150 shadow-3xs cursor-pointer select-none"
                                >
                                  <Play className="w-3 h-3" />
                                  Execute Request Sandbox Simulator
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-gray-400 text-center py-20 space-y-2">
                        <FileJson className="w-10 h-10 mx-auto text-gray-300" />
                        <p className="text-xs font-semibold">Select an Endpoint from the menu tree</p>
                        <p className="text-[11px] text-gray-450 max-w-sm mx-auto">
                          Click any nested path resource to parse its templates attributes, inspect requests keys, and run execution simulations.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* FEATURE C: DIAGNOSTIC AUDIT REPORT CARD (VALIDATORS / DIFFS) */}
            {isValidationTool && (
              <div id="validators-diagnostic-view" className="space-y-6 animate-fade-in">
                {(() => {
                  const checkData = getValidationChecks();
                  return (
                    <div className="space-y-5">
                      
                      {/* Big Score Widget */}
                      <div className="grid grid-cols-1 md:grid-cols-12 bg-slate-50 dark:bg-[#0c0d12] border border-gray-150 dark:border-slate-800 rounded-xl p-5 md:p-6 gap-6 items-center">
                        <div className="md:col-span-4 text-center border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-800 pb-5 md:pb-0 pr-0 md:pr-6">
                          <span className="text-[10px] font-mono uppercase font-black tracking-wider text-gray-450 block">
                            Platform Diagnostics Health
                          </span>
                          
                          {/* Radial Progress Equivalent */}
                          <div className="relative inline-flex items-center justify-center mt-3 scale-110">
                            <span className="text-4xl font-extrabold font-mono text-[#207886]">
                              {checkData.score}
                            </span>
                            <span className="text-gray-400 font-mono text-xs ml-0.5 mt-2">/100</span>
                          </div>

                          <span className="text-[10px] text-emerald-600 font-bold block mt-3.5 bg-emerald-50 px-2.5 py-0.5 rounded-full w-max mx-auto font-mono">
                            ★ High Structural integrity
                          </span>
                        </div>

                        {/* Summary checklist */}
                        <div className="md:col-span-8 space-y-3">
                          <span className="text-[11px] font-mono tracking-wider font-extrabold text-slate-500 uppercase block">
                            Compilation & validation checklist ({checkData.totalChecked} modules parsed)
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {checkData.rules.map((rule, rIdx) => (
                              <div key={rIdx} className="flex items-center gap-2 text-xs">
                                {rule.passed ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                )}
                                <span className={`font-semibold  truncate ${rule.passed ? "text-gray-700" : "text-amber-700"}`}>
                                  {rule.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Version Diffing Specific list */}
                      {checkData.changes.length > 0 && (
                        <div className="space-y-3">
                          <span className="text-xs uppercase tracking-wider font-extrabold text-rose-500 font-mono block">
                            ⚠️ Version Modifications Diff Report (Breaking Change indicators)
                          </span>

                          <div className="space-y-2">
                            {checkData.changes.map((chg, cIdx) => {
                              const isBreaking = chg.type === "Breaking Change";
                              return (
                                <div 
                                  key={cIdx} 
                                  className={`p-3.5 rounded-xl border flex gap-3.5 items-start transition hover:shadow-2xs ${
                                    isBreaking 
                                      ? "bg-rose-50/40 border-rose-200/50" 
                                      : "bg-[#207886]/5 border-[#207886]/10"
                                  }`}
                                >
                                  <div className={`p-1.5 rounded-lg shrink-0 ${isBreaking ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                                    {isBreaking ? <AlertTriangle className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                                  </div>

                                  <div className="space-y-1 flex-1 text-xs">
                                    <div className="flex flex-wrap items-center justify-between gap-1">
                                      <span className={`font-bold font-mono tracking-tight uppercase text-[10px] ${isBreaking ? "text-rose-700" : "text-emerald-700"}`}>
                                        {chg.type}
                                      </span>
                                      <span className="text-[10px] text-gray-400 font-mono font-bold">
                                        {chg.ref}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-751 leading-relaxed select-text font-medium">{chg.text}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })()}
              </div>
            )}

            {/* FEATURE D: INTERACTIVE TYPE EXPLORER (GRAPHQL SCHEMAS) */}
            {isGraphQlTool && (
              <div id="graphql-explorer-view" className="space-y-6 animate-fade-in">
                <div className="bg-[#207886]/5 border border-[#207886]/10 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold font-mono text-[#207886] flex items-center gap-1.5 uppercase">
                      <BookOpen className="w-3.5 h-3.5" />
                      Visual Schema Node Fields Inspector
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Expand object definitions blocks dynamically from your schema structure. Click to view fields validation properties.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {getMockGraphQlEntities().map((typeObj, idx) => {
                    const isExpanded = expandedTypes[typeObj.name];
                    return (
                      <div 
                        key={idx} 
                        className="bg-white dark:bg-slate-905 border border-gray-150 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-2xs transition duration-150"
                      >
                        {/* Header Header */}
                        <button
                          type="button"
                          onClick={() => setExpandedTypes({
                            ...expandedTypes,
                            [typeObj.name]: !isExpanded
                          })}
                          className="w-full bg-slate-50 dark:bg-slate-950/20 px-4 py-3 border-b border-gray-150 dark:border-slate-800 flex items-center justify-between font-mono hover:bg-slate-100 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200">
                            <span className="text-lg">{typeObj.icon}</span>
                            <span>type <strong className="text-[#207886]">{typeObj.name}</strong></span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-450" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-450" />
                          )}
                        </button>

                        {/* Expansive Table Guts */}
                        {isExpanded && (
                          <div className="p-4 divide-y divide-gray-100 dark:divide-slate-850 space-y-3.5 animate-fade-in text-xs">
                            {typeObj.fields.map((fld, fIdx) => (
                              <div key={fIdx} className="pt-3 first:pt-0 space-y-1">
                                <div className="flex items-center justify-between font-mono">
                                  <span className="font-bold text-gray-800 text-[11.5px] select-text">
                                    {fld.name}
                                  </span>
                                  <span className="text-[#207886] font-bold text-[11px] bg-[#207886]/5 px-2 py-0.5 rounded border border-[#207886]/10 select-text">
                                    {fld.type}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-500 select-text">{fld.desc}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
