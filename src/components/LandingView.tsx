import React from "react";
import { 
  ShieldCheck, Lock, Eye, Database, Sparkles, ArrowRight, Activity 
} from "lucide-react";
import AdSenseAd from "./AdSenseAd";
import { CATEGORIES, ALL_TOOLS } from "../data";

interface LandingViewProps {
  onExploreHub: () => void;
  onNavigateToPrivacy: () => void;
}

export default function LandingView({ onExploreHub, onNavigateToPrivacy }: LandingViewProps) {
  const totalToolsCount = ALL_TOOLS.length;
  const totalCategoriesCount = CATEGORIES.length;
  const aiPoweredCount = ALL_TOOLS.filter((t) => t.isAiPowered).length;

  return (
    <div id="landing-page-workspace" className="max-w-7xl mx-auto px-4 py-6 md:py-10 flex-1 space-y-8 select-none animate-fade-in">
      
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
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] text-gray-250 block uppercase tracking-wider font-bold">Available Tools</span>
              <span className="text-3xl font-black font-mono text-amber-300">{totalToolsCount}+</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] text-gray-250 block uppercase tracking-wider font-bold">Categories</span>
              <span className="text-3xl font-black font-mono text-white">{totalCategoriesCount}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] text-gray-250 block uppercase tracking-wider font-bold">AI Enhanced</span>
              <span className="text-3xl font-black font-mono text-indigo-300">{aiPoweredCount}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] text-gray-250 block uppercase tracking-wider font-bold">Storage Retention</span>
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
      
    </div>
  );
}
