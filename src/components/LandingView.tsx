import React from "react";
import { 
  ShieldCheck, Lock, Eye, Database, Sparkles, ArrowRight, Activity, X 
} from "lucide-react";
import AdSenseAd from "./AdSenseAd";
import { CATEGORIES, ALL_TOOLS } from "../data";

interface LandingViewProps {
  onExploreHub: () => void;
  onNavigateToPrivacy: () => void;
  onSelectTool: (toolId: string) => void;
}

export default function LandingView({ onExploreHub, onNavigateToPrivacy, onSelectTool }: LandingViewProps) {
  const [hiddenToolIds, setHiddenToolIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_hidden_tools");
      if (saved) {
        setHiddenToolIds(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const visibleTools = ALL_TOOLS.filter(t => !hiddenToolIds.includes(t.id));
  const totalToolsCount = visibleTools.length;
  const totalCategoriesCount = CATEGORIES.length;
  const aiPoweredCount = visibleTools.filter((t) => t.isAiPowered).length;

  const [activeModal, setActiveModal] = React.useState<"tools" | "categories" | "ai" | null>(null);
  const [searchFilter, setSearchFilter] = React.useState("");

  return (
    <div id="landing-page-workspace" className="max-w-7xl mx-auto px-4 py-6 md:py-10 flex-1 space-y-8 animate-fade-in">
      
      {/* Banner / Strategic AdSense Provision on Header of Landing Page */}
      <AdSenseAd slot="998188172" format="horizontal" />

      {/* Hero Header Sector (The Big Div with Summary) */}
      <div className="bg-linear-to-r from-emerald-600 to-indigo-700 rounded-3xl p-6 md:p-12 text-white shadow-xl relative overflow-hidden text-center md:text-left">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-24 translate-x-12 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl space-y-6 mx-auto md:mx-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/15 cursor-pointer backdrop-blur-md rounded-full text-xs font-bold font-mono tracking-wider transition mx-auto md:mx-0">
            <img 
              src="/src/assets/images/toolzcraft_logo_1781092405969.png" 
              className="w-4 h-4 object-contain"
              referrerPolicy="no-referrer"
              alt="ToolzCraft Logo"
            />
            TOOLZCRAFT SECURE PORTAL
          </div>
          <h1 className="text-3xl md:text-6xl font-extrabold tracking-tight leading-none">
            Unified Utility Sandboxes, <br />
            <span className="text-amber-300">Fortified Platform Privacy</span>
          </h1>
          <p className="text-sm md:text-lg text-gray-100 max-w-3xl font-medium leading-relaxed">
            Welcome to the ultimate workspace of <strong className="text-white">{totalToolsCount} operational developer calculators</strong>, media optimization tools, database converters, and high-fidelity text compilers. Enjoy zero retention, secure in-browser sandboxing, and full global safety compliance.
          </p>
          
          {/* Large Exploration Call-to-Action to Launch the Hub */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
            <button
              onClick={onExploreHub}
              className="px-8 py-4 bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-sm md:text-base rounded-2xl flex items-center gap-2.5 transition duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg cursor-pointer w-full sm:w-auto justify-center"
            >
              🚀 Launch Sandbox Hub
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onNavigateToPrivacy}
              className="px-6 py-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm md:text-base rounded-2xl flex items-center gap-2.5 transition duration-300 hover:border-white/40 cursor-pointer w-full sm:w-auto justify-center"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-405" />
              Privacy Assurance Policy
            </button>
          </div>

          {/* Quick Metrics Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 text-left">
            <div 
              id="landing-stat-tools"
              onClick={() => {
                setActiveModal("tools");
                setSearchFilter("");
              }}
              className="bg-white/10 hover:bg-white/15 cursor-pointer backdrop-blur-md p-4 rounded-2xl border border-white/5 hover:border-amber-400/50 transition duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow group"
            >
              <span className="text-[11px] text-white/85 block uppercase tracking-wider font-bold transition group-hover:text-amber-200">Available Tools</span>
              <span className="text-3xl font-black font-mono text-amber-300 flex items-center gap-1">
                {totalToolsCount}+
                <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition duration-300 shrink-0 text-amber-300" />
              </span>
            </div>

            <div 
              id="landing-stat-categories"
              onClick={() => {
                setActiveModal("categories");
                setSearchFilter("");
              }}
              className="bg-white/10 hover:bg-white/15 cursor-pointer backdrop-blur-md p-4 rounded-2xl border border-white/5 hover:border-emerald-400/50 transition duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow group"
            >
              <span className="text-[11px] text-white/85 block uppercase tracking-wider font-bold transition group-hover:text-emerald-300">Categories</span>
              <span className="text-3xl font-black font-mono text-white flex items-center gap-1">
                {totalCategoriesCount}
                <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition duration-300 shrink-0 text-emerald-300" />
              </span>
            </div>

            <div 
              id="landing-stat-ai"
              onClick={() => {
                setActiveModal("ai");
                setSearchFilter("");
              }}
              className="bg-white/10 hover:bg-white/15 cursor-pointer backdrop-blur-md p-4 rounded-2xl border border-white/5 hover:border-indigo-400/50 transition duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow group"
            >
              <span className="text-[11px] text-white/85 block uppercase tracking-wider font-bold transition group-hover:text-indigo-200">AI Enhanced</span>
              <span className="text-3xl font-black font-mono text-indigo-200 flex items-center gap-1">
                {aiPoweredCount}
                <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition duration-300 shrink-0 text-indigo-200" />
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] text-white/85 block uppercase tracking-wider font-bold">Storage Retention</span>
              <span className="text-xl font-black font-mono text-emerald-300 uppercase tracking-tight">0% CLOUD</span>
            </div>
          </div>
        </div>
      </div>

      {/* CORE DATA PRIVACY ASSURANCE SECTION (Compliance Div) */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 p-6 md:p-8 rounded-3xl shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-150 dark:border-gray-850 pb-4 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-2xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Compliance & Privacy Autonomy Bounds</h2>
              <p className="text-xs text-gray-500 dark:text-gray-450 mt-0.5">Strict GDPR, CCPA, and SOC 2 Type II framework alignment rules.</p>
            </div>
          </div>
          <button
            id="landing-policy-trigger"
            onClick={onNavigateToPrivacy}
            className="text-xs px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Inspect Privacy Policy
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-gray-50 dark:bg-gray-950/40 rounded-2xl border border-gray-200 dark:border-gray-850 space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
              <Eye className="w-5 h-5 shrink-0" />
              <span>100% In-Browser Execution</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
              Calculators, image compressors, unit converters, and password generators execute right inside your browser memory cache. Sensitive image pixels are translated directly into client-side Canvas objects and are **strictly never recorded on server registries**.
            </p>
          </div>

          <div className="p-5 bg-gray-50 dark:bg-gray-950/40 rounded-2xl border border-gray-200 dark:border-gray-850 space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>GDPR Data Minimization</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
              We fully comply with GDPR Articles 5 and 25 (Data Protection by Design & Default). Since no profiles or document stores exist on our containers, we maintain a flawless zero-retention environment with zero database leak exposures.
            </p>
          </div>

          <div className="p-5 bg-gray-50 dark:bg-gray-950/40 rounded-2xl border border-gray-200 dark:border-gray-850 space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
              <Database className="w-5 h-5 shrink-0" />
              <span>SOC 2 Encryption & Transit</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
              For security-sensitive APIs (such as AI database converters or receipt parser nodes), payloads pass under heavily encrypted TLS 1.3 tunnels. Dynamic API outputs are purged instantly from transaction runtime memories.
            </p>
          </div>
        </div>
      </section>

      {/* AdSense slot on the base of landing view */}
      <AdSenseAd slot="998188173" format="rectangle" />

      {/* Dynamic Landing Page Analytics Modals */}
      {activeModal && (
        <div id="landing-metrics-modal-overlay" className="fixed inset-0 bg-black/70 backdrop-blur-xs z-55 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up select-text">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-150 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/30">
              <div>
                <h3 className="font-extrabold text-base text-[#0D5E69] dark:text-gray-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {activeModal === "tools" && `Operational Directory Catalog (${totalToolsCount})`}
                  {activeModal === "categories" && `Categorized Utility Suites (${totalCategoriesCount})`}
                  {activeModal === "ai" && `AI-Supercharged Sandboxes (${aiPoweredCount})`}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {activeModal === "tools" && "Deep-link directly into any tool with secure local execution."}
                  {activeModal === "categories" && "Sorted logically starting with contact & media configurations."}
                  {activeModal === "ai" && "Generative transformers operating stateless in RAM pipelines."}
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick search input for "tools" and "ai" modal */}
            {activeModal !== "categories" && (
              <div className="px-5 pt-4 pb-2 border-b border-gray-100 dark:border-gray-850">
                <input
                  type="text"
                  placeholder="Filter utilities dynamically..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-gray-55 dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Modal Scroll Container */}
            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                          {/* Directory Catalog ("tools") */}
              {activeModal === "tools" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALL_TOOLS.filter(t => !hiddenToolIds.includes(t.id)).filter(t => 
                    t.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                    t.description.toLowerCase().includes(searchFilter.toLowerCase())
                  ).map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelectTool(t.id);
                        setActiveModal(null);
                      }}
                      className="p-3 text-left bg-gray-55 hover:bg-emerald-50/40 dark:bg-gray-900/30 dark:hover:bg-emerald-950/20 border border-gray-200 dark:border-gray-850 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 rounded-xl transition cursor-pointer group"
                    >
                      <div className="font-bold text-xs text-gray-900 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-1.5 transition">
                        <span>{t.name}</span>
                        {t.isAiPowered && <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950/50 text-[9px] text-indigo-600 dark:text-indigo-400 rounded font-mono font-bold uppercase">AI</span>}
                      </div>
                      <p className="text-[11px] text-gray-550 dark:text-gray-400 mt-1 leading-normal line-clamp-2">
                        {t.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Categorized Utilities ("categories") */}
              {activeModal === "categories" && (
                <div className="space-y-6">
                  {CATEGORIES.map(cat => {
                    const availableTools = cat.tools.filter(t => !hiddenToolIds.includes(t.id));
                    if (availableTools.length === 0) return null;
                    return (
                      <div key={cat.id} className="space-y-2">
                        <h4 className="font-extrabold text-[11px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b border-gray-150 dark:border-gray-800 pb-1.5 flex items-center justify-between">
                          <span>{cat.title}</span>
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-505 dark:text-gray-400 rounded-full font-mono normal-case tracking-normal font-medium">{availableTools.length} available</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {availableTools.map(t => (
                            <button
                              key={t.id}
                              onClick={() => {
                                onSelectTool(t.id);
                                setActiveModal(null);
                              }}
                              className="p-2.5 text-left bg-gray-55 hover:bg-emerald-50/30 dark:bg-gray-900/10 dark:hover:bg-emerald-950/10 border border-gray-150 dark:border-gray-850 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 rounded-lg transition cursor-pointer group"
                            >
                              <span className="font-bold text-xs text-gray-900 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 block transition truncate">{t.name}</span>
                              <span className="text-[10px] text-gray-400 block truncate mt-0.5">{t.description}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* AI-Supercharged Specials ("ai") */}
              {activeModal === "ai" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALL_TOOLS.filter(t => !hiddenToolIds.includes(t.id)).filter(t => t.isAiPowered).filter(t => 
                    t.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                    t.description.toLowerCase().includes(searchFilter.toLowerCase())
                  ).map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelectTool(t.id);
                        setActiveModal(null);
                      }}
                      className="p-3 text-left bg-emerald-500/[0.03] hover:bg-emerald-500/[0.08] dark:bg-emerald-950/[0.05] dark:hover:bg-emerald-950/20 border border-emerald-500/10 dark:border-emerald-800/30 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 rounded-xl transition cursor-pointer group"
                    >
                      <div className="font-bold text-xs text-emerald-800 dark:text-emerald-400 group-hover:text-[#0D5E69] dark:group-hover:text-white flex items-center gap-1.5 transition">
                        <span>{t.name}</span>
                        <Sparkles className="w-3.5 h-3.5 text-[#0D5E69] dark:text-emerald-400" />
                      </div>
                      <p className="text-[11px] text-gray-550 dark:text-gray-400 mt-1.5 leading-normal line-clamp-2">
                        {t.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}

            </div>
            
            {/* Modal Footnote indicator */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-150 dark:border-gray-800 text-center">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">100% SECURE CLIENT-SIDE TRANSACTION PROTOCOLS COMPLIANT</span>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}
