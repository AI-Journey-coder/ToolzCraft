import React, { useState, useEffect } from "react";
import { ALL_TOOLS, CATEGORIES } from "../data";
import { Tool } from "../types";
import { 
  ShieldCheck, Eye, EyeOff, Search, Loader2, Sparkles, UserPlus, 
  Trash2, Plus, DollarSign, Users, Grid, Settings, Activity, CheckCircle,
  HelpCircle, Calendar, Tag, ShieldAlert, FileText, AlertCircle, Percent, Clock, ArrowUpRight, Lock, Check, Gift,
  ChevronDown, ChevronUp
} from "lucide-react";

interface AdminUser {
  email: string;
  tier: string;
  source: string;
  joined: string;
  validityExpiry?: string;       // e.g. "2026-12-31" or "Lifetime"
  specialExceptions?: string[];   // list of toolIds bypass Allowed
}

interface AdminPlan {
  id: string;
  name: string;
  price: string;
  active: boolean;
  limitations: string;
  discountPercent?: number;       // Discount applied to displayed price
}

interface CouponCode {
  code: string;
  discountPercent: number;
  active: boolean;
}

interface SpecialCondition {
  id: string;
  toolId: string;
  conditionType: string; // "Weekend Pass" | "Alpha Test Bypasser" | "Revenue Offset Grant" | "IP Node Exception"
  targetGroup: "Everyone" | "Non-Logged Guests" | "Free Logged-In Members" | "Specific Email List";
  active: boolean;
}

interface AdminViewProps {
  user: { email?: string; isPremium: boolean } | null;
  onSelectTool: (toolId: string) => void;
}

export default function AdminView({ user, onSelectTool }: AdminViewProps) {
  const isAdmin = user && user.email && user.email.toLowerCase() === "new.ai.journey@gmail.com";

  // State Management Tabs
  const [activeTab, setActiveTab] = React.useState<"projection-calculator" | "user-controls" | "special-conditions" | "tools-switcher" | "plans-discounts">("projection-calculator");

  // Core Backend State Arrays
  const [hiddenToolIds, setHiddenToolIds] = useState<string[]>([]);
  const [persistedUsers, setPersistedUsers] = useState<AdminUser[]>([]);
  const [persistedPlans, setPersistedPlans] = useState<AdminPlan[]>([]);
  const [coupons, setCoupons] = useState<CouponCode[]>([
    { code: "PROMO30", discountPercent: 30, active: true },
    { code: "SUMMER50", discountPercent: 50, active: true },
    { code: "OFFER15", discountPercent: 15, active: false }
  ]);
  const [specialConditions, setSpecialConditions] = useState<SpecialCondition[]>([
    { id: "cond-1", toolId: "contact-duplicate-finder", conditionType: "Weekend Pass", targetGroup: "Non-Logged Guests", active: true },
    { id: "cond-2", toolId: "receipt-ocr", conditionType: "Alpha Test Bypasser", targetGroup: "Free Logged-In Members", active: false }
  ]);

  // Loading and Notification feedback
  const [loading, setLoading] = useState<boolean>(true);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tools Visibility tab states
  const [toolQuery, setToolQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // User Management tab states
  const [newEmail, setNewEmail] = useState("");
  const [newTier, setNewTier] = useState("Premium");
  const [userQuery, setUserQuery] = useState("");

  // Plan Discounts input states
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState<number>(20);

  // Special conditions input state
  const [selectedExceptionTool, setSelectedExceptionTool] = useState(ALL_TOOLS[0]?.id || "");
  const [exceptionType, setExceptionType] = useState("Weekend Pass");
  const [exceptionGroup, setExceptionGroup] = useState<"Everyone" | "Non-Logged Guests" | "Free Logged-In Members" | "Specific Email List">("Non-Logged Guests");

  // Cost & Revenue Simulator slider variables
  const [monthlyMAU, setMonthlyMAU] = useState<number>(15000); // 15k users
  const [conversionRate, setConversionRate] = useState<number>(2.5); // 2.5% premium
  const [dailyQuotaFree, setDailyQuotaFree] = useState<number>(5); // limited queries
  const [runsPerMonthFree, setRunsPerMonthFree] = useState<number>(30); // avg actual uses
  const [runsPerMonthPremium, setRunsPerMonthPremium] = useState<number>(120); // avg premium uses
  const [costPerThousandAPIs, setCostPerThousandAPIs] = useState<number>(0.15); // $0.15 per 1,000 Gemini Flash API requests
  const [adsPageviews, setAdsPageviews] = useState<number>(15); // pageviews per free user/mo
  const [adsPageRPM, setAdsPageRPM] = useState<number>(4.50); // $4.50 RPM
  const [adsCTR, setAdsCTR] = useState<number>(1.2); // 1.2% CTR
  const [adsCPC, setAdsCPC] = useState<number>(0.25); // $0.25 average CPC click cost
  const [subscriptionPrice, setSubscriptionPrice] = useState<number>(9.99); // standard monthly sub cost

  // Load from API on mount
  const [firestoreStatus, setFirestoreStatus] = useState<{ active: boolean; projectId: string; activationUrl: string } | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      // Seamlessly redirect back to home page and trigger standard login modal popup
      window.location.hash = "#/";
      window.dispatchEvent(new CustomEvent("open-auth-modal"));
      return;
    }

    async function loadConfig() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/config?adminEmail=${encodeURIComponent(user?.email || "")}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setHiddenToolIds(data.hiddenToolIds || []);
            if (data.firestoreStatus) {
              setFirestoreStatus(data.firestoreStatus);
            }
            
            // Re-map with expiration fields if missing
            const loadedUsers = (data.users || []).map((u: any) => ({
              ...u,
              validityExpiry: u.validityExpiry || "Lifetime",
              specialExceptions: u.specialExceptions || []
            }));
            setPersistedUsers(loadedUsers);

            const loadedPlans = (data.plans || []).map((p: any) => ({
              ...p,
              discountPercent: p.discountPercent || 0
            }));
            setPersistedPlans(loadedPlans);
          }
        } else {
          // Fallback static load
          const savedHidden = localStorage.getItem("admin_hidden_tools");
          if (savedHidden) setHiddenToolIds(JSON.parse(savedHidden));
          
          const rawUsers = localStorage.getItem("admin_users_extended");
          if (rawUsers) {
            setPersistedUsers(JSON.parse(rawUsers));
          } else {
            setPersistedUsers([
              { email: "new.ai.journey@gmail.com", tier: "Premium", source: "Master System Override", joined: new Date().toISOString(), validityExpiry: "Lifetime", specialExceptions: [] },
              { email: "sandbox.dev@test.com", tier: "Premium", source: "Auth Portal Demo", joined: new Date().toISOString(), validityExpiry: "2026-10-31", specialExceptions: [] },
              { email: "free.tester@visitor.com", tier: "Free Tier", source: "Guest Simulator", joined: new Date().toISOString(), validityExpiry: "2026-07-28", specialExceptions: ["receipt-ocr"] }
            ]);
          }
        }
      } catch (err: any) {
        console.error("Failed loading admin metadata rules:", err);
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, [user, isAdmin]);

  // Safe checks
  if (!isAdmin) {
    return null;
  }

  // --- TAB SAVING HELPER ---
  const saveAllToBackend = async (updatedUsers?: AdminUser[], updatedPlans?: AdminPlan[]) => {
    try {
      setSavingConfig(true);
      setSuccessMsg(null);
      setErrorMsg(null);

      // Save hidden tool state first
      await fetch("/api/admin/tools-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: user?.email,
          hiddenToolIds
        })
      });

      // Save subscribers & plans next
      const res = await fetch("/api/admin/subscriptions-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: user?.email,
          users: updatedUsers || persistedUsers,
          plans: updatedPlans || persistedPlans
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSuccessMsg("Pristine system parameters and config state written to server successfully!");
          localStorage.setItem("admin_hidden_tools", JSON.stringify(hiddenToolIds));
          localStorage.setItem("admin_users_extended", JSON.stringify(updatedUsers || persistedUsers));
          
          // Save premium maps local propagation
          const premiumMap: Record<string, boolean> = {};
          (updatedUsers || persistedUsers).forEach(u => {
            if (u.tier === "Premium" || u.tier === "Pro") {
              premiumMap[u.email.toLowerCase()] = true;
            }
          });
          localStorage.setItem("admin_premium_users", JSON.stringify(premiumMap));
          setTimeout(() => setSuccessMsg(null), 4000);
        } else {
          setErrorMsg(data.error || "Failed saving changes.");
        }
      } else {
        setErrorMsg("Failed synchronizing configurations back to database filesystem nodes.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Network write failure.");
    } finally {
      setSavingConfig(false);
    }
  };

  // --- ACTIONS: USER MANAGEMENT ---
  const handleAddUser = () => {
    if (!newEmail || !newEmail.includes("@")) {
      setErrorMsg("Please enter a valid developer or subscriber email.");
      return;
    }
    const exists = persistedUsers.some(u => u.email.toLowerCase() === newEmail.trim().toLowerCase());
    if (exists) {
      setErrorMsg("This user profile record is already registered.");
      return;
    }

    const created: AdminUser = {
      email: newEmail.trim().toLowerCase(),
      tier: newTier,
      source: "Manual Admin Promo",
      joined: new Date().toISOString().split("T")[0],
      validityExpiry: "Lifetime",
      specialExceptions: []
    };

    const nextArr = [created, ...persistedUsers];
    setPersistedUsers(nextArr);
    setNewEmail("");
    saveAllToBackend(nextArr, persistedPlans);
  };

  const handleRemoveUser = (email: string) => {
    if (email.toLowerCase() === "new.ai.journey@gmail.com") {
      setErrorMsg("Security Guard: Primary admin console root cannot be deleted.");
      return;
    }
    const nextArr = persistedUsers.filter(u => u.email.toLowerCase() !== email.toLowerCase());
    setPersistedUsers(nextArr);
    saveAllToBackend(nextArr, persistedPlans);
  };

  const handleExtendValidity = (email: string, days: number | "Lifetime") => {
    const nextArr = persistedUsers.map(u => {
      if (u.email.toLowerCase() !== email.toLowerCase()) return u;

      let newExpiry = "";
      if (days === "Lifetime") {
        newExpiry = "Lifetime";
      } else {
        const baseDate = u.validityExpiry && u.validityExpiry !== "Lifetime" 
          ? new Date(u.validityExpiry) 
          : new Date();
        baseDate.setDate(baseDate.getDate() + days);
        newExpiry = baseDate.toISOString().split("T")[0];
      }

      return {
        ...u,
        validityExpiry: newExpiry
      };
    });

    setPersistedUsers(nextArr);
    saveAllToBackend(nextArr, persistedPlans);
  };

  // --- ACTIONS: DISCOUNTS & PLANS ---
  const handleTogglePlan = (planId: string) => {
    const nextPlans = persistedPlans.map(p => {
      if (p.id !== planId) return p;
      return { ...p, active: !p.active };
    });
    setPersistedPlans(nextPlans);
    saveAllToBackend(persistedUsers, nextPlans);
  };

  const handlePlanDiscountChange = (planId: string, disc: number) => {
    const nextPlans = persistedPlans.map(p => {
      if (p.id !== planId) return p;
      return { ...p, discountPercent: disc };
    });
    setPersistedPlans(nextPlans);
  };

  const handleAddCoupon = () => {
    if (!newCouponCode) return;
    const codeUpper = newCouponCode.trim().toUpperCase();
    if (coupons.some(c => c.code === codeUpper)) {
      setErrorMsg("Coupon already exists.");
      return;
    }
    setCoupons([...coupons, { code: codeUpper, discountPercent: newCouponDiscount, active: true }]);
    setNewCouponCode("");
    setSuccessMsg(`Discount code ${codeUpper} created successfully!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleToggleCoupon = (code: string) => {
    setCoupons(coupons.map(c => c.code === code ? { ...c, active: !c.active } : c));
  };

  const handleDeleteCoupon = (code: string) => {
    setCoupons(coupons.filter(c => c.code !== code));
  };

  // --- ACTIONS: SPECIAL CONDITIONS ---
  const handleAddSpecialCondition = () => {
    const addedRule: SpecialCondition = {
      id: "cond-" + Date.now(),
      toolId: selectedExceptionTool,
      conditionType: exceptionType,
      targetGroup: exceptionGroup,
      active: true
    };
    setSpecialConditions([addedRule, ...specialConditions]);
    setSuccessMsg(`Special Condition Rule for "${selectedExceptionTool}" queued & active!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleToggleSpecialCondition = (id: string) => {
    setSpecialConditions(specialConditions.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  const handleDeleteSpecialCondition = (id: string) => {
    setSpecialConditions(specialConditions.filter(c => c.id !== id));
  };

  // --- METRIC SIMULATION FORMULAS ---
  const countFreeUsers = Math.round(monthlyMAU * (1 - (conversionRate / 100)));
  const countPremiumUsers = Math.round(monthlyMAU * (conversionRate / 100));

  // Costs
  const costPerQuery = costPerThousandAPIs / 1000;
  const monthlyAPQueriesFree = countFreeUsers * runsPerMonthFree;
  const monthlyAPQueriesPremium = countPremiumUsers * runsPerMonthPremium;
  
  const costFreeAPI = monthlyAPQueriesFree * costPerQuery;
  const costPremiumAPI = monthlyAPQueriesPremium * costPerQuery;
  const fixedOverhead = 25.00; // Database + hosting base offsets
  const totalOperatingCosts = costFreeAPI + costPremiumAPI + fixedOverhead;

  // Revenue Streams
  // AdSense Earnings
  // 1. Impression RPM revenue
  const adsImpressionRev = countFreeUsers * (adsPageviews * (adsPageRPM / 1000));
  // 2. Click CTR/CPC revenue
  const totalClks = countFreeUsers * adsPageviews * (adsCTR / 100);
  const adsClickRev = totalClks * adsCPC;
  const adsMonthlyRevTotal = adsImpressionRev + adsClickRev;

  // Subscription Earnings 
  const subMonthlyRevTotal = countPremiumUsers * subscriptionPrice;

  // Total Performance Indicators
  const grossMonthlyRevenue = adsMonthlyRevTotal + subMonthlyRevTotal;
  const netProfitMonthly = grossMonthlyRevenue - totalOperatingCosts;
  const netProfitMargin = grossMonthlyRevenue > 0 ? (netProfitMonthly / grossMonthlyRevenue) * 100 : 0;

  // Individual unit analysis
  const adsRevenuePerFreeUser = adsPageviews * (adsPageRPM / 1000) + (adsPageviews * (adsCTR / 100) * adsCPC);
  const apiCostPerFreeUser = runsPerMonthFree * costPerQuery;
  const isFreeTierProfitable = adsRevenuePerFreeUser > apiCostPerFreeUser;

  // Filter tools for standard table
  const filteredTools = ALL_TOOLS.filter((t) => {
    const matchesQuery = t.name.toLowerCase().includes(toolQuery.toLowerCase()) || 
                         t.description.toLowerCase().includes(toolQuery.toLowerCase()) ||
                         t.id.toLowerCase().includes(toolQuery.toLowerCase());
    const matchesCat = selectedCat === "all" || t.category === selectedCat;
    return matchesQuery && matchesCat;
  });

  return (
    <div id="full-admin-portal" className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-8 animate-fade-in font-sans w-full flex-1">
      
      {/* Welcome Title Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-md">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest bg-emerald-500 text-slate-900 px-2 py-0.5 rounded font-mono">
              Administrative Command Board
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ToolzCraft sovereign Controller</h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Active developer node for <strong className="text-[#207886]">new.ai.journey@gmail.com</strong>. Complete programmatic control over subscription validity levels, coupon discounts multipliers, special tools exemptions, and AdSense profit configurations.
          </p>
        </div>

        <div className="flex gap-3 text-xs z-10 shrink-0">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-center min-w-[85px]">
            <span className="block text-emerald-400 font-mono font-bold text-lg leading-none">
              ${grossMonthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
            </span>
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider font-mono">Est Revenue</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-center min-w-[85px]">
            <span className="block text-rose-400 font-mono font-bold text-lg leading-none">
              ${totalOperatingCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
            </span>
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider font-mono">Est Costs</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-center min-w-[85px]">
            <span className={`block font-mono font-bold text-lg leading-none ${netProfitMonthly >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
              ${netProfitMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
            </span>
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider font-mono">Est profits</span>
          </div>
        </div>

        {/* Abstract design elements */}
        <div className="absolute right-0 top-0 bottom-0 opacity-15 overflow-hidden pointer-events-none select-none">
          <div className="w-96 h-96 rounded-full bg-[#207886] blur-3xl -mr-16 -mt-16" />
        </div>
      </div>

      {/* Success / Error alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2.5 shadow-3xs font-medium animate-fade-in relative z-20">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/25 border border-red-500/25 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2.5 shadow-3xs font-semibold animate-fade-in relative z-20">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* FIRESTORE API ACTIVATION ALERT BANNER */}
      {firestoreStatus && !firestoreStatus.active && (
        <div className="bg-[#fffdf7] dark:bg-amber-950/15 border border-amber-300 dark:border-amber-900/40 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in relative z-20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono tracking-wider font-bold text-amber-800 bg-amber-200/50 px-2 py-0.5 rounded uppercase">
                Database Sync Pending
              </span>
              <span className="text-[10px] font-semibold text-amber-700 animate-pulse font-mono">
                ⚠️ API INACTIVE
              </span>
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              Cloud database connection requires Google Cloud Firestore API activation. The app is running smoothly on local <code className="bg-amber-100 dark:bg-amber-950 px-1 py-0.5 rounded font-mono font-bold text-[10px]/none">JSON / CSV fallback engines</code> in the meantime. Click below to enable instantly in your console:
            </p>
          </div>
          <div className="shrink-0">
            <a 
              href={firestoreStatus.activationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold font-mono transition-all uppercase shadow-xs gap-1.5"
            >
              Enable Firestore API ↗
            </a>
          </div>
        </div>
      )}

      {/* CUSTOM STRATEGIC INSIGHT BANNER */}
      <div className="bg-emerald-50 text-emerald-900 border border-emerald-200/50 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[9px] font-mono tracking-wider font-bold text-emerald-700 bg-emerald-200/50 px-2 py-0.5 rounded uppercase">
            Active System Strategy recommendation
          </span>
          <p className="text-xs text-emerald-800 leading-relaxed font-semibold">
            {isFreeTierProfitable ? (
              <span>🟢 Free-Tier remains highly sustainable. Each guest brings <strong className="font-bold">${adsRevenuePerFreeUser.toFixed(3)}</strong> in AdSense while consuming only <strong className="font-bold">${apiCostPerFreeUser.toFixed(3)}</strong> on API request loops. Keep free daily use capping at {dailyQuotaFree} per active visitor!</span>
            ) : (
              <span>⚠️ Free Tier is running negative margins. Average AdSense CPM/Impressions yields <strong className="font-bold">${adsRevenuePerFreeUser.toFixed(3)}</strong>, failing to offset API demand costs (<strong className="font-bold">${apiCostPerFreeUser.toFixed(3)}</strong>). Correct this instantly by adjusting the pricing sliders, increasing page ad RPM, or reducing free daily quotas to 3 uses!</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold font-mono text-emerald-700">{netProfitMargin.toFixed(1)}%</span>
          <span className="text-[10px] text-emerald-700 font-mono tracking-tight font-black uppercase">Net Margin</span>
        </div>
      </div>

      {/* Nav Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-gray-150 dark:border-gray-800 pb-px">
        <button
          onClick={() => setActiveTab("projection-calculator")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all border-b-2 rounded-t-lg cursor-pointer ${
            activeTab === "projection-calculator"
              ? "border-[#207886] text-[#207886] bg-slate-50 dark:bg-slate-900/60"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-600" />
          📊 API Cost & AdSense Simulator
        </button>
        <button
          onClick={() => setActiveTab("user-controls")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all border-b-2 rounded-t-lg cursor-pointer ${
            activeTab === "user-controls"
              ? "border-[#207886] text-[#207886] bg-slate-50 dark:bg-slate-900/60"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Users className="w-4 h-4 text-amber-500" />
          👥 Subscribers & Validity Extension
        </button>
        <button
          onClick={() => setActiveTab("special-conditions")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all border-b-2 rounded-t-lg cursor-pointer ${
            activeTab === "special-conditions"
              ? "border-[#207886] text-[#207886] bg-slate-50 dark:bg-slate-900/60"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-red-550" />
          🔒 Overrides & Special Conditions
        </button>
        <button
          onClick={() => setActiveTab("plans-discounts")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all border-b-2 rounded-t-lg cursor-pointer ${
            activeTab === "plans-discounts"
              ? "border-[#207886] text-[#207886] bg-slate-50 dark:bg-slate-900/60"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Percent className="w-4 h-4 text-indigo-500" />
          🏷️ Plans & Coupon Discounts Engine
        </button>
        <button
          onClick={() => setActiveTab("tools-switcher")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all border-b-2 rounded-t-lg cursor-pointer ${
            activeTab === "tools-switcher"
              ? "border-[#207886] text-[#207886] bg-slate-50 dark:bg-slate-900/60"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Grid className="w-4 h-4 text-[#207886]" />
          🛠️ UI Tools Visibility Switcher
        </button>
      </div>

      {/* TAB SHELL CONTAINER */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-850 rounded-2xl p-5 md:p-8 shadow-sm">
        
        {/* --- TAB 1: FINANCES & ADSENSE SIMULATOR --- */}
        {activeTab === "projection-calculator" && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-gray-150 pb-4">
              <h2 className="text-base font-black text-gray-900">Interactive pricing, API Costs & Google AdSense Revenue Engine</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Tweak live parameters to simulate platform overheads. Our algorithm models free user thresholds, CPM values, CTR, CPC clicks, and output conversion metrics instantly to give you solid advice on appropriate pricing tags.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sliders panel */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Traffic Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-extrabold text-[#207886] font-mono">1. User Traffic & conversion matrix</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-500">Scale Metrics</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-gray-700">Monthly Active Users (MAU)</span>
                        <strong className="text-slate-900 font-mono">{monthlyMAU.toLocaleString()}</strong>
                      </div>
                      <input
                        type="range"
                        min="1000"
                        max="100000"
                        step="1000"
                        value={monthlyMAU}
                        onChange={(e) => setMonthlyMAU(Number(e.target.value))}
                        className="w-full accent-[#207886]"
                      />
                      <span className="text-[10px] text-gray-400 block font-mono">Volume of target interactive users</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-gray-700">Free to Premium conversion</span>
                        <strong className="text-slate-900 font-mono">{conversionRate.toFixed(1)}%</strong>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="10.0"
                        step="0.1"
                        value={conversionRate}
                        onChange={(e) => setConversionRate(Number(e.target.value))}
                        className="w-full accent-[#207886]"
                      />
                      <span className="text-[10px] text-gray-400 block font-mono">Conversion rate target of active MAUs</span>
                    </div>
                  </div>
                </div>

                {/* API Request Costs Details */}
                <div className="space-y-4">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-rose-500 font-mono block">2. API Request Cost Multipliers</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-gray-700">Free Queries / user / Month</span>
                        <strong className="text-rose-600 font-mono">{runsPerMonthFree} runs</strong>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="150"
                        step="5"
                        value={runsPerMonthFree}
                        onChange={(e) => setRunsPerMonthFree(Number(e.target.value))}
                        className="w-full accent-rose-500"
                      />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-gray-700">Pro Queries / user / Month</span>
                        <strong className="text-rose-600 font-mono">{runsPerMonthPremium} runs</strong>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="500"
                        step="10"
                        value={runsPerMonthPremium}
                        onChange={(e) => setRunsPerMonthPremium(Number(e.target.value))}
                        className="w-full accent-rose-500"
                      />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-gray-700">API Cost / 1k queries</span>
                        <strong className="text-rose-600 font-mono">${costPerThousandAPIs.toFixed(3)}</strong>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="1.50"
                        step="0.05"
                        value={costPerThousandAPIs}
                        onChange={(e) => setCostPerThousandAPIs(Number(e.target.value))}
                        className="w-full accent-rose-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Google AdSense Details */}
                <div className="space-y-4">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-amber-500 font-mono block">3. Google AdSense Monetization variables</span>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-2 col-span-1">
                      <label className="block text-[11px] font-bold text-gray-700">Free pageviews / month</label>
                      <input
                        type="number"
                        value={adsPageviews}
                        onChange={(e) => setAdsPageviews(Math.max(1, Number(e.target.value)))}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded font-mono font-bold"
                      />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-2 col-span-1">
                      <label className="block text-[11px] font-bold text-gray-700">Page NPM CPM Revenue</label>
                      <input
                        type="number"
                        step="0.1"
                        value={adsPageRPM}
                        onChange={(e) => setAdsPageRPM(Math.max(0, Number(e.target.value)))}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded font-mono font-bold"
                      />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-2 col-span-1">
                      <label className="block text-[11px] font-bold text-gray-700">Click CTR Ratio (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={adsCTR}
                        onChange={(e) => setAdsCTR(Math.max(0, Number(e.target.value)))}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded font-mono font-bold"
                      />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-2 col-span-1">
                      <label className="block text-[11px] font-bold text-gray-700">Average CPC click cost</label>
                      <input
                        type="number"
                        step="0.05"
                        value={adsCPC}
                        onChange={(e) => setAdsCPC(Math.max(0, Number(e.target.value)))}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Subscriptions Setters */}
                <div className="space-y-4">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-indigo-500 font-mono block">4. Subscriptions price tags</span>
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-gray-700">Set Monthly Premium Plan Price</span>
                      <strong className="text-indigo-600 font-mono text-base font-black">${subscriptionPrice} / mo</strong>
                    </div>
                    <input
                      type="range"
                      min="2.99"
                      max="49.99"
                      step="1.00"
                      value={subscriptionPrice}
                      onChange={(e) => setSubscriptionPrice(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                    <p className="text-[10px] text-gray-400 font-mono">Tones active subscriber pricing targets to optimize lifetime value indexes</p>
                  </div>
                </div>

              </div>

              {/* Financial Dashboard Column */}
              <div className="lg:col-span-4 bg-slate-550/10 p-5 rounded-2xl border border-slate-200 space-y-6 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-gray-500 font-mono">Financial Output Matrix</h3>
                    <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                  </div>

                  {/* Summary grid */}
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400 block font-mono uppercase text-[10px]">Segment Traffic</span>
                      <div className="text-right">
                        <p className="text-[11px] text-gray-700">Free Members: <strong>{countFreeUsers.toLocaleString()}</strong></p>
                        <p className="text-[11px] text-gray-700">Pro Members: <strong>{countPremiumUsers.toLocaleString()}</strong></p>
                      </div>
                    </div>

                    <div className="border-t border-slate-200/50 pt-2 flex justify-between">
                      <span className="text-gray-400 font-mono uppercase text-[10px] block">monthly ads revenue</span>
                      <strong className="text-emerald-600 font-mono">${adsMonthlyRevTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400 font-mono uppercase text-[10px] block">monthly subs revenue</span>
                      <strong className="text-emerald-600 font-mono">${subMonthlyRevTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                    </div>

                    <div className="flex justify-between font-extrabold text-sm border-t border-slate-200/50 pt-2.5">
                      <span className="text-gray-600 font-mono uppercase text-[10px] block">Gross Platform Revenue</span>
                      <strong className="text-slate-900 font-mono text-base">${grossMonthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                    </div>

                    <div className="border-t border-slate-200/50 pt-2 flex justify-between">
                      <span className="text-gray-400 font-mono uppercase text-[10px] block">API Request Costs</span>
                      <strong className="text-rose-500 font-mono">${(costFreeAPI + costPremiumAPI).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                    </div>

                    <div className="flex justify-between text-rose-500">
                      <span className="text-gray-450 font-mono uppercase text-[10px] block">Hosting Base Offset</span>
                      <strong className="font-mono">${fixedOverhead.toFixed(2)}</strong>
                    </div>

                    <div className="flex justify-between font-extrabold border-t border-slate-200/50 pt-2 text-rose-600">
                      <span className="font-mono uppercase text-[10px] block">Total Operating Costs</span>
                      <strong className="font-mono text-sm">${totalOperatingCosts.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                    </div>
                  </div>

                  {/* Net Profit Big Box */}
                  <div className="p-4 bg-emerald-50 border border-emerald-250 rounded-xl text-center shadow-xs">
                    <span className="text-[10px] text-emerald-600 font-mono font-bold uppercase tracking-widest block">Net projected monthly profit</span>
                    <p className={`text-2xl font-black font-mono leading-none mt-2 ${netProfitMonthly >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                      ${netProfitMonthly.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-emerald-500 font-mono mt-1 block">
                      Markup Yield: {netProfitMargin.toFixed(1)}% margins
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="block border-t border-slate-200 pt-3 text-[10px] font-mono text-gray-400">DEMO METRIC SIMULATIONS</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMonthlyMAU(25000);
                      setConversionRate(3.0);
                      setCostPerThousandAPIs(0.12);
                      setAdsPageRPM(6.50);
                      setSubscriptionPrice(12.00);
                      setSuccessMsg("Optimized High-Volume Strategy applied below!");
                    }}
                    className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold font-mono hover:bg-slate-800 transition cursor-pointer select-none text-center"
                  >
                    Load High-Traffic Demo Model
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* --- TAB 2: MEMBERS & VALIDITY EXTENSION --- */}
        {activeTab === "user-controls" && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-gray-150 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-base font-black text-gray-900">Registered Members Premium Validity Controls</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Promote users manually, review registration logs, and grant temporal credentials offsets (Validity days duration addition) natively.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs rounded-full font-mono font-extrabold border border-amber-250">
                Premium Counts: {persistedUsers.filter(u => u.tier === "Premium" || u.tier === "Pro").length}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Creator Block */}
              <div className="lg:col-span-4 bg-slate-50 p-5 rounded-2xl border border-gray-150 space-y-4">
                <h3 className="text-xs uppercase tracking-widest font-black text-[#207886] font-mono">Add manual Promo override</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-650 mb-1">Subscriber email address</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="customer.dev@gmail.com"
                      className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-[#207886] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-650 mb-1">Assigned subscription tier</label>
                    <select
                      value={newTier}
                      onChange={(e) => setNewTier(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded text-gray-800 font-bold"
                    >
                      <option value="Premium">Premium Standard</option>
                      <option value="Pro">Pro Master Elite</option>
                      <option value="Free Tier">Basic Free Tier</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddUser}
                    className="w-full py-2 bg-[#207886] hover:bg-[#1a5f6a] text-white rounded-xl text-xs font-bold font-mono transition mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Register Promotional Account
                  </button>
                </div>
              </div>

              {/* Members List Table scrollable */}
              <div className="lg:col-span-8 space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search master accounts database..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:outline-none"
                  />
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                </div>

                <div className="border border-gray-150 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-150 text-gray-500 font-mono uppercase text-[9px] font-bold select-none border-b border-gray-150">
                      <tr>
                        <th className="p-3">User Profile / Email</th>
                        <th className="p-3">Credentials Level</th>
                        <th className="p-3">Validity status / expiration</th>
                        <th className="p-3 text-center text-rose-500">Actions / extensions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {persistedUsers.filter(u => !userQuery || u.email.toLowerCase().includes(userQuery.toLowerCase())).map((u) => {
                        const isExpired = u.validityExpiry && u.validityExpiry !== "Lifetime" && new Date(u.validityExpiry) < new Date();
                        const isPrimary = u.email.toLowerCase() === "new.ai.journey@gmail.com";
                        return (
                          <tr key={u.email} className="hover:bg-slate-50/50">
                            <td className="p-3 min-w-[170px]">
                              <p className="font-extrabold text-slate-800 font-mono truncate">{u.email}</p>
                              <span className="text-[10px] text-gray-400 font-mono block">Joined: {u.joined}</span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-black uppercase text-center ${
                                u.tier === "Pro" || u.tier === "Premium"
                                  ? "bg-amber-50 text-amber-700 border border-amber-250"
                                  : "bg-slate-50 text-gray-500 border border-slate-200"
                              }`}>
                                {u.tier}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`p-1 rounded font-mono font-bold text-[10px] ${
                                isExpired 
                                  ? "bg-rose-50 text-rose-600 block text-center animate-pulse" 
                                  : u.validityExpiry === "Lifetime" 
                                  ? "bg-emerald-50 text-emerald-600" 
                                  : "text-slate-700"
                              }`}>
                                {u.validityExpiry === "Lifetime" ? "Infinite Lifetime 🌌" : u.validityExpiry || "Never"}
                                {isExpired && " (EXPIRED)"}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  title="Add 30 Days premium validity"
                                  onClick={() => handleExtendValidity(u.email, 30)}
                                  className="px-2 py-1 bg-white hover:bg-[#207886]/10 text-[#207886] border border-gray-250 rounded font-mono font-bold text-[9px] cursor-pointer"
                                >
                                  +30d
                                </button>
                                <button
                                  type="button"
                                  title="Add 180 Days premium validity"
                                  onClick={() => handleExtendValidity(u.email, 180)}
                                  className="px-2 py-1 bg-white hover:bg-[#207886]/10 text-[#207886] border border-gray-250 rounded font-mono font-bold text-[9px] cursor-pointer"
                                >
                                  +6mo
                                </button>
                                <button
                                  type="button"
                                  title="Grant Infinite Lifetime credentials bypass"
                                  onClick={() => handleExtendValidity(u.email, "Lifetime")}
                                  className="px-2 py-1 bg-[#207886] hover:bg-[#1a5f6a] text-white rounded font-mono font-bold text-[9px] cursor-pointer"
                                >
                                  Lifetime
                                </button>
                                {!isPrimary && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveUser(u.email)}
                                    className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* --- TAB 3: RULES & CONDITIONS BYPASS --- */}
        {activeTab === "special-conditions" && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-gray-150 pb-4">
              <h2 className="text-base font-black text-gray-901">Bypass Overrides & Tool Special Access Conditions</h2>
              <p className="text-xs text-gray-500 mt-1">
                Configure special rules that override basic tier exclusions under temporal conditions. For instance, allow guest users or standard levels unique access to high-tier tools during testing blocks or premium marketing segments.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Creator */}
              <div className="lg:col-span-4 bg-slate-50 p-5 rounded-2xl border border-gray-150 space-y-4">
                <span className="text-xs font-black uppercase text-[#207886] font-mono block">Declare Overrides exception</span>
                
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-650 mb-1">Target Sandbox Tool</label>
                    <select
                      value={selectedExceptionTool}
                      onChange={(e) => setSelectedExceptionTool(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded font-mono text-gray-700"
                    >
                      {ALL_TOOLS.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-650 mb-1">Condition Class</label>
                    <select
                      value={exceptionType}
                      onChange={(e) => setExceptionType(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded font-bold text-gray-700"
                    >
                      <option value="Weekend Pass">Weekend Free Pass (0% Ad Offset)</option>
                      <option value="Alpha Test Bypasser">Alpha Test Bypasser (Temporary unlock)</option>
                      <option value="Revenue Offset Grant">AdSense Revenue Offset (CPC trigger)</option>
                      <option value="IP Node Exception">Developer Local Testing Override</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-650 mb-1">Target User Cluster</label>
                    <select
                      value={exceptionGroup}
                      onChange={(e) => setExceptionGroup(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded text-gray-700 font-medium"
                    >
                      <option value="Everyone">Everyone (Total Public Public Access)</option>
                      <option value="Non-Logged Guests">Guests / Non-Logged-In Users only</option>
                      <option value="Free Logged-In Members">Free Logged-In Members only</option>
                      <option value="Specific Email List">Authorized test account email lists</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSpecialCondition}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-mono transition"
                  >
                    Add Special Overriding Rule
                  </button>
                </div>
              </div>

              {/* Current Exceptions List */}
              <div className="lg:col-span-8 space-y-4">
                <span className="text-xs font-mono font-extrabold text-gray-500 uppercase block">Active Override Rules Index</span>
                
                <div className="space-y-3">
                  {specialConditions.map((rule) => {
                    const mappedTool = ALL_TOOLS.find(t => t.id === rule.toolId);
                    return (
                      <div key={rule.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition ${
                        rule.active 
                          ? "bg-indigo-50/50 border-indigo-200" 
                          : "bg-slate-50/40 border-gray-205 opacity-60"
                      }`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800 text-xs font-mono">{mappedTool?.name || rule.toolId}</span>
                            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded font-mono text-[9px] uppercase font-black">
                              {rule.conditionType}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Bypass scope applied to: <strong>{rule.targetGroup}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSpecialCondition(rule.id)}
                            className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-wide font-extrabold cursor-pointer transition select-none ${
                              rule.active 
                                ? "bg-emerald-100 text-emerald-850 border border-emerald-300"
                                : "bg-gray-150 text-gray-500"
                            }`}
                          >
                            {rule.active ? "● BYPASS ACTIVE" : "○ RULES DISABLED"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSpecialCondition(rule.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded transition duration-200 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {specialConditions.length === 0 && (
                    <div className="p-8 text-center bg-gray-50 border border-gray-150 rounded-xl text-gray-400 font-mono text-xs">
                      No special bypassing parameters are registered.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* --- TAB 4: MALFUNCTIONING TOOLS VISIBILITY SWITCHER --- */}
        {activeTab === "tools-switcher" && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-gray-150 pb-4">
              <h2 className="text-sm font-bold text-gray-901 flex items-center gap-2 leading-none">
                <Grid className="w-4.5 h-4.5 text-[#207886]" />
                Direct UI Tools Visibility Switcher
              </h2>
              <p className="text-[11px] text-gray-550 dark:text-gray-450 mt-1 leading-relaxed">
                If any tool or utility component displays malfunctioning output, toggle its mode state to "Hidden" instantly. This excludes the element live from sitemaps, dashboards, category pages, and navigational components.
              </p>
            </div>

            {/* Selector Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Filter tool by keyword..."
                  value={toolQuery}
                  onChange={(e) => setToolQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 focus:ring-1 focus:ring-[#207886] outline-none font-medium font-mono"
                />
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              </div>
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 font-semibold font-mono"
              >
                <option value="all">All Category Modules</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Bulk Actions Interface */}
            <div className="bg-slate-50 dark:bg-gray-850 p-4 rounded-xl border border-gray-150 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">Bulk Configuration Controls</h4>
                <p className="text-[10px] text-gray-550 dark:text-gray-400 mt-0.5">Quickly toggle multiple tools simultaneously to streamline maintenance operations.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* All Tools Actions */}
                <div className="flex bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = ALL_TOOLS.map(t => t.id);
                      setHiddenToolIds(allIds);
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                  >
                    Hide All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHiddenToolIds([]);
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 rounded transition cursor-pointer"
                  >
                    Show All
                  </button>
                </div>

                {/* Category-Specific Actions */}
                <div className="flex bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const targetIds = selectedCat === "all" 
                        ? ALL_TOOLS.map(t => t.id)
                        : ALL_TOOLS.filter(t => t.category === selectedCat).map(t => t.id);
                      setHiddenToolIds(prev => Array.from(new Set([...prev, ...targetIds])));
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                  >
                    Hide {selectedCat === "all" ? "All Categories" : "Category"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const targetIds = selectedCat === "all"
                        ? ALL_TOOLS.map(t => t.id)
                        : ALL_TOOLS.filter(t => t.category === selectedCat).map(t => t.id);
                      setHiddenToolIds(prev => prev.filter(id => !targetIds.includes(id)));
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 rounded transition cursor-pointer"
                  >
                    Show {selectedCat === "all" ? "All Categories" : "Category"}
                  </button>
                </div>
              </div>
            </div>

            {/* Categorized Tools List (Accordion-style) */}
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
              {CATEGORIES.filter(cat => selectedCat === "all" || cat.id === selectedCat).map(cat => {
                const catTools = ALL_TOOLS.filter(t => t.category === cat.id).filter(t => {
                  const matchesQuery = !toolQuery || 
                                       t.name.toLowerCase().includes(toolQuery.toLowerCase()) || 
                                       t.description.toLowerCase().includes(toolQuery.toLowerCase()) ||
                                       t.id.toLowerCase().includes(toolQuery.toLowerCase());
                  return matchesQuery;
                });

                if (catTools.length === 0) return null;

                const isExpanded = expandedCategories[cat.id] !== false;
                const hiddenCountInCat = catTools.filter(t => hiddenToolIds.includes(t.id)).length;

                return (
                  <div key={cat.id} className="border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-xs">
                    {/* Category Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 dark:bg-gray-850 border-b border-gray-150 dark:border-gray-800 gap-3">
                      {/* Title & Chevron expand/collapse toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedCategories(prev => ({
                            ...prev,
                            [cat.id]: isExpanded ? false : true
                          }));
                        }}
                        className="flex items-center gap-2.5 text-left font-bold text-xs text-gray-800 dark:text-gray-200 hover:text-[#207886] transition cursor-pointer flex-1 group"
                      >
                        <div className="p-1 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 transition group-hover:border-[#207886]">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[#207886]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-[#207886] dark:text-[#20a3b8] uppercase tracking-wider text-[11px] leading-tight flex items-center gap-2">
                            {cat.title}
                            <span className="px-1.5 py-0.5 bg-[#207886]/10 text-[#207886] dark:text-[#20a3b8] text-[9px] font-mono rounded font-normal normal-case">
                              {catTools.length} tools
                            </span>
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-455 font-normal mt-0.5 leading-none">
                            {hiddenCountInCat === 0 ? "All tools visible to clients" : `${hiddenCountInCat} of ${catTools.length} tools hidden`}
                          </p>
                        </div>
                      </button>

                      {/* Right: Category Level buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const targetIds = catTools.map(t => t.id);
                            setHiddenToolIds(prev => Array.from(new Set([...prev, ...targetIds])));
                          }}
                          className="px-2.5 py-1 text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded border border-rose-150 dark:border-rose-900/40 transition cursor-pointer uppercase tracking-wider font-mono"
                        >
                          Hide Cat
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const targetIds = catTools.map(t => t.id);
                            setHiddenToolIds(prev => prev.filter(id => !targetIds.includes(id)));
                          }}
                          className="px-2.5 py-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 rounded border border-emerald-200 dark:border-emerald-900/40 transition cursor-pointer uppercase tracking-wider font-mono"
                        >
                          Show Cat
                        </button>
                      </div>
                    </div>

                    {/* Tools Nested List */}
                    {isExpanded && (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {catTools.map(t => {
                          const isHidden = hiddenToolIds.includes(t.id);
                          return (
                            <div 
                              key={t.id}
                              className={`p-3 flex items-center justify-between gap-4 text-xs transition-colors ${
                                isHidden ? "bg-rose-50/20 dark:bg-rose-950/10" : "bg-white dark:bg-gray-900"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-800 dark:text-gray-200" title={t.name}>
                                    {t.name}
                                  </span>
                                  {isHidden && (
                                    <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[8.5px] font-extrabold font-mono rounded uppercase tracking-wider">
                                      Hidden
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-450 dark:text-gray-400 truncate mt-0.5">
                                  {t.description}
                                </p>
                                <span className="text-[9px] font-mono text-gray-400/80 block mt-0.5">ID: {t.id}</span>
                              </div>

                              <div className="shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextHidden = hiddenToolIds.includes(t.id)
                                      ? hiddenToolIds.filter(id => id !== t.id)
                                      : [...hiddenToolIds, t.id];
                                    setHiddenToolIds(nextHidden);
                                  }}
                                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold font-mono tracking-wider cursor-pointer transition select-none flex items-center gap-1.5 mx-auto ${
                                    isHidden
                                      ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-250 hover:bg-emerald-100"
                                  }`}
                                >
                                  {isHidden ? (
                                    <>
                                      <EyeOff className="w-3 h-3" />
                                      HIDDEN
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3 h-3" />
                                      ACTIVE
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              disabled={savingConfig}
              onClick={() => saveAllToBackend()}
              className="w-full py-2.5 bg-[#207886] hover:bg-[#1a5f6a] text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs select-none"
            >
              {savingConfig ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Synchronizing Tools States...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save Tool Visibility Overrides State
                </>
              )}
            </button>
          </div>
        )}

        {/* --- TAB 5: PLANS & COUPONS ENGINE --- */}
        {activeTab === "plans-discounts" && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-gray-150 pb-4">
              <h2 className="text-base font-black text-gray-901">Subscription plans pricing & discount Coupons</h2>
              <p className="text-xs text-gray-500 mt-1">
                Configure standard monthly plan rates, adjust active plan inclusions shown in subscription grids, block/allow discount coupons and generate custom promotional entries natively.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Plans Editor */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-mono font-extrabold text-gray-500 uppercase block">Active price models</span>
                
                {persistedPlans.map((plan) => (
                  <div key={plan.id} className="p-4 bg-slate-50 rounded-xl border border-gray-200 text-xs space-y-3.5">
                    <div className="flex items-center justify-between border-b pb-1.5">
                      <span className="font-mono text-[10.5px] uppercase font-extrabold text-[#207886]">Plan: {plan.name} ({plan.id})</span>
                      <button
                        type="button"
                        onClick={() => handleTogglePlan(plan.id)}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          plan.active 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-250" 
                            : "bg-gray-150 text-gray-500"
                        }`}
                      >
                        {plan.active ? "Active" : "Archived"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Standard display price</label>
                        <input
                          type="text"
                          value={plan.price}
                          onChange={(e) => {
                            const next = persistedPlans.map(p => p.id === plan.id ? { ...p, price: e.target.value } : p);
                            setPersistedPlans(next);
                          }}
                          className="w-full px-2 py-1 bg-white border border-gray-205 rounded font-mono font-extrabold"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mb-1">
                          <span>Apply direct discount</span>
                          <strong className="text-indigo-600 font-mono text-[11px]">{plan.discountPercent || 0}% OFF</strong>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="90"
                          step="5"
                          value={plan.discountPercent || 0}
                          onChange={(e) => handlePlanDiscountChange(plan.id, Number(e.target.value))}
                          className="w-full accent-indigo-500 mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Grid limits description alignment</label>
                      <input
                        type="text"
                        value={plan.limitations}
                        onChange={(e) => {
                          const next = persistedPlans.map(p => p.id === plan.id ? { ...p, limitations: e.target.value } : p);
                          setPersistedPlans(next);
                        }}
                        className="w-full px-2.5 py-1 bg-white border border-gray-205 rounded font-medium text-gray-650 text-[11px]"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => saveAllToBackend(persistedUsers, persistedPlans)}
                  className="w-full py-2 bg-slate-900 text-white font-mono text-xs font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Save Plans price tags Configurations
                </button>
              </div>

              {/* Coupons engine */}
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-mono font-extrabold text-[#207886] uppercase block">Promotional Coupons engine</span>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Promo Code</label>
                      <input
                        type="text"
                        value={newCouponCode}
                        onChange={(e) => setNewCouponCode(e.target.value)}
                        placeholder="SUMMER30"
                        className="w-full text-xs px-2.5 py-1 bg-white border rounded font-mono font-extrabold uppercase placeholder:normal-case h-8"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Discount %</label>
                      <input
                        type="number"
                        min="5"
                        max="95"
                        value={newCouponDiscount}
                        onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                        className="w-full text-xs px-2.5 py-1 bg-white border rounded font-mono font-extrabold h-8"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCoupon}
                    className="w-full py-1.5 bg-[#207886] hover:bg-[#1a5f6a] text-white text-xs font-bold font-mono rounded cursor-pointer"
                  >
                    Add Coupon
                  </button>
                </div>

                <div className="border border-gray-150 rounded-xl max-h-[220px] overflow-y-auto p-2 divide-y divide-gray-100">
                  {coupons.map((c) => (
                    <div key={c.code} className="flex justify-between items-center py-2 text-xs">
                      <div>
                        <span className="font-extrabold text-[#207886] font-mono text-xs">{c.code}</span>
                        <span className="text-[10px] font-bold text-indigo-500 font-mono ml-2">-{c.discountPercent}% OFF</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(c.code)}
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold ${
                            c.active ? "bg-emerald-50 text-emerald-600 border border-emerald-300" : "bg-gray-150 text-gray-500"
                          }`}
                        >
                          {c.active ? "Active" : "Disabled"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c.code)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
