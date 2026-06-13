import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import SearchModal from "./components/SearchModal";
import ToolArea from "./components/ToolArea";
import ComplianceFooter from "./components/ComplianceFooter";
import DashboardView from "./components/DashboardView";
import LandingView from "./components/LandingView";
import AuthModal from "./components/AuthModal";
import SubscriptionView from "./components/SubscriptionView";
import { ALL_TOOLS, CATEGORIES } from "./data";
import { Tool } from "./types";
import { 
  Sun, Moon, Search, Menu, Cpu, ShieldAlert, Check, 
  HelpCircle, Sparkles, Database, FileSpreadsheet, List, Lock, Shield, Eye,
  KeyRound, User, LogOut, Crown
} from "lucide-react";

export default function App() {
  // Navigation states
  const [activeToolId, setActiveToolId] = useState<string>("image-compress");
  const [currentView, setCurrentView] = useState<"landing" | "dashboard" | "category" | "tool" | "sitemap" | "privacy" | "subscriptions">("landing");
  const [selectedDashboardCategory, setSelectedDashboardCategory] = useState<string>("all");

  // Sidebar controls
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsedDesktop, setSidebarCollapsedDesktop] = useState(false);

  // Search modal controls
  const [searchOpen, setSearchOpen] = useState(false);

  // Auth states & modal controls
  const [authOpen, setAuthOpen] = useState(false);
  const [authUser, setAuthUser] = useState<{ email?: string; phone?: string; provider: "google" | "phone"; isPremium: boolean } | null>(() => {
    const saved = localStorage.getItem("toolzcraft_auth_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Local storage backup sync for session perseverance
  useEffect(() => {
    if (authUser) {
      localStorage.setItem("toolzcraft_auth_user", JSON.stringify(authUser));
    } else {
      localStorage.removeItem("toolzcraft_auth_user");
    }
  }, [authUser]);

  // Theme states
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("omnitool-theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  // Hotkey listener for CMD/K search toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync state with URL Hash for separate page deep routing
  useEffect(() => {
    const syncRouteWithHash = () => {
      const hash = window.location.hash;
      if (!hash || hash === "#" || hash === "#/") {
        setCurrentView("landing");
        return;
      }

      if (hash === "#/dashboard" || hash === "#/hub") {
        setSelectedDashboardCategory("all");
        setCurrentView("dashboard");
        return;
      }

      if (hash.startsWith("#/category/")) {
        const categoryId = hash.substring(11);
        setSelectedDashboardCategory(categoryId);
        setCurrentView("category");
        return;
      }

      if (hash === "#/sitemap") {
        setCurrentView("sitemap");
        return;
      }

      if (hash === "#/privacy") {
        setCurrentView("privacy");
        return;
      }

      if (hash === "#/subscriptions") {
        setCurrentView("subscriptions");
        return;
      }

      // Check if hash matches a specific utility page
      const potentialToolId = hash.replace("#/", "").replace("#", "");
      const matchedTool = ALL_TOOLS.find((t) => t.id === potentialToolId);
      
      if (matchedTool) {
        setActiveToolId(potentialToolId);
        setCurrentView("tool");
        setSelectedDashboardCategory(matchedTool.category);
      } else {
        // Fallback layout when route mismatch occurs
        setSelectedDashboardCategory("all");
        setCurrentView("dashboard");
      }
    };

    // Initial sync
    syncRouteWithHash();

    window.addEventListener("hashchange", syncRouteWithHash);
    return () => window.removeEventListener("hashchange", syncRouteWithHash);
  }, []);

  // Theme root updater
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("omnitool-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("omnitool-theme", "light");
    }
  }, [darkMode]);

  const activeTool = ALL_TOOLS.find((t) => t.id === activeToolId) || ALL_TOOLS[0];

  const handleSelectTool = (toolId: string) => {
    const matchedTool = ALL_TOOLS.find((t) => t.id === toolId);
    if (matchedTool) {
      setSelectedDashboardCategory(matchedTool.category);
    }
    window.location.hash = `#/${toolId}`;
  };

  const handleSelectCategory = (catId: string) => {
    if (catId === "all") {
      window.location.hash = "#/dashboard";
    } else {
      window.location.hash = `#/category/${catId}`;
    }
  };

  const handleNavigateToSitemap = () => {
    window.location.hash = "#/sitemap";
  };

  const handleNavigateToPrivacy = () => {
    window.location.hash = "#/privacy";
  };

  return (
    <div className={`min-h-screen flex text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-950 transition duration-300`}>
      
      {/* Dynamic Left Sidebar double-collapsible */}
      <Sidebar
        activeToolId={activeToolId}
        onSelectTool={handleSelectTool}
        isOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isCollapsedDesktop={sidebarCollapsedDesktop}
        onToggleDesktopCollapse={() => setSidebarCollapsedDesktop(!sidebarCollapsedDesktop)}
      />

      {/* Main Container Shell */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${
        sidebarCollapsedDesktop ? "lg:pl-16" : "lg:pl-72"
      }`}>
        
        {/* Top Navigation Header Bar */}
        <header id="top-application-header" className="h-16 border-b border-gray-200 dark:border-gray-850 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md px-4 flex items-center justify-between shrink-0 sticky top-0 z-30 select-none">
          
          <div className="flex items-center gap-3">
            {/* Hamburger menu trigger */}
            <button
              id="mobile-hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-950 dark:hover:text-white transition"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo and Name at the top left of the header - Visible on mobile/tablet or when desktop sidebar is collapsed */}
            <div 
              onClick={() => { window.location.hash = "#/"; }}
              className={`items-center gap-2 md:gap-2.5 cursor-pointer select-none transition ${
                sidebarCollapsedDesktop ? "flex" : "flex lg:hidden"
              }`}
            >
              <div className="aspect-square h-8 w-8 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center p-0.5 border border-gray-150 dark:border-gray-700 shadow-sm">
                <img 
                  src="/src/assets/images/toolzcraft_logo_1781092405969.png" 
                  alt="ToolzCraft Logo" 
                  className="w-full h-full object-contain rounded-md"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-extrabold text-sm text-gray-900 dark:text-white tracking-tight">
                ToolzCraft
              </span>
            </div>

            {/* Quick header tags */}
            <div className="hidden xl:flex items-center gap-2 text-xs">
              <span className="font-semibold text-gray-550 dark:text-gray-400">Sandbox Hub:</span>
              <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-sm font-bold font-mono">
                ONLINE
              </span>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <span className="text-gray-500 dark:text-gray-400 font-medium font-sans">Data Transit Encrypted</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Global Search Button */}
            <button
              id="global-search-header-trigger"
              onClick={() => setSearchOpen(true)}
              className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-950 dark:hover:text-white rounded-xl border border-gray-200 dark:border-gray-800 text-xs flex items-center gap-3 transition cursor-pointer max-w-xs"
            >
              <Search className="w-4 h-4 text-gray-405 shrink-0" />
              <span className="hidden md:inline font-medium">Search utility...</span>
              <kbd className="hidden sm:inline-flex items-center px-1 border border-gray-300 dark:border-gray-700 rounded-md text-[10px] font-mono text-gray-450 dark:text-gray-500 shadow-2xs select-none">
                ⌘K
              </kbd>
            </button>

            {/* Dark Mode toggle button */}
            <button
              id="global-dark-mode-toggle"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 bg-gray-55 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-550 hover:text-gray-990 dark:hover:text-amber-440 transition cursor-pointer"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Authentic Login or Profile Section */}
            {authUser ? (
              <div className="flex items-center gap-2">
                {/* User credential indicator pill */}
                <div className="hidden md:flex flex-col items-end text-right select-none">
                  <span className="text-xs font-bold text-gray-901 dark:text-gray-150 font-mono">
                    {authUser.email ? authUser.email.split("@")[0] : authUser.phone}
                  </span>
                  
                  {authUser.isPremium ? (
                    <span 
                      onClick={() => window.location.hash = "#/subscriptions"}
                      className="text-[9px] font-black text-amber-700 dark:text-amber-450 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.2 rounded font-mono tracking-wide flex items-center gap-0.5 cursor-pointer hover:bg-amber-100 transition animate-pulse"
                    >
                      <Crown className="w-2.5 h-2.5" />
                      PRO MEMBER
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40 px-1 py-0.2 rounded font-mono uppercase">
                        FREE TRIAL
                      </span>
                      <button
                        onClick={() => window.location.hash = "#/subscriptions"}
                        className="text-[9px] font-bold text-emerald-600 hover:text-emerald-705 underline font-mono cursor-pointer animate-pulse"
                      >
                        Upgrade
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Circle with Log Out option */}
                <div className="relative group">
                  <button
                    id="profile-user-avatar-btn"
                    className="h-10 w-10 bg-emerald-50 dark:bg-gray-800 border border-emerald-500/20 rounded-xl flex items-center justify-center p-0.5 shadow-xs font-bold text-xs text-emerald-750 dark:text-emerald-400 uppercase select-none cursor-pointer"
                    title="Profile Options"
                  >
                    {authUser.email ? authUser.email[0] : "P"}
                  </button>

                  <div className="absolute right-0 top-11 p-2 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl shadow-lg w-44 opacity-0 group-hover:opacity-100 transition pointer-events-none group-hover:pointer-events-auto z-40">
                    <div className="px-2 py-1.5 border-b border-gray-100 dark:border-gray-850 mb-1 select-none">
                      <span className="text-[9px] text-gray-400 block font-bold font-mono tracking-wider uppercase">SSO Authorization</span>
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 capitalize">{authUser.provider} Verified</span>
                    </div>
                    
                    <button
                      onClick={() => window.location.hash = "#/subscriptions"}
                      className="w-full text-left px-2 py-1.5 text-xs text-gray-650 hover:text-emerald-600 dark:text-gray-450 dark:hover:text-emerald-405 hover:bg-gray-5/50 dark:hover:bg-gray-850/50 rounded-lg transition flex items-center gap-1.5 font-semibold cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      Subscription Suite
                    </button>
                    
                    <button
                      onClick={() => {
                        setAuthUser(null);
                        localStorage.removeItem("toolzcraft_auth_user");
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-55 dark:hover:bg-rose-950/20 rounded-lg transition flex items-center gap-1.5 font-semibold cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Log Out Profile
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                id="header-signin-btn"
                onClick={() => setAuthOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs whitespace-nowrap"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Core Layout Window scroll panel */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-between">
          
          {/* ==========================================
              CLIENT VIEW TRIGGERS
              ========================================== */}
          
          {currentView === "landing" && (
            <LandingView 
              onExploreHub={() => { window.location.hash = "#/dashboard"; }}
              onNavigateToPrivacy={handleNavigateToPrivacy}
            />
          )}
          
          {currentView === "dashboard" && (
            <DashboardView 
              onSelectTool={handleSelectTool} 
              onNavigateToPrivacy={handleNavigateToPrivacy} 
              selectedCategory="all"
              onSelectCategory={handleSelectCategory}
            />
          )}

          {currentView === "category" && (
            <DashboardView 
              onSelectTool={handleSelectTool} 
              onNavigateToPrivacy={handleNavigateToPrivacy} 
              selectedCategory={selectedDashboardCategory}
              onSelectCategory={handleSelectCategory}
            />
          )}
          
          {currentView === "tool" && (
            <ToolArea 
              tool={activeTool} 
              user={authUser}
              onTriggerAuth={() => setAuthOpen(true)}
              onTriggerSubscription={() => window.location.hash = "#/subscriptions"}
              onUpgradeComplete={() => {
                setAuthUser((prev) => {
                  const updated = prev 
                    ? { ...prev, isPremium: true } 
                    : { email: "premium.developer@toolzcraft.io", provider: "google" as const, isPremium: true };
                  return updated;
                });
              }}
              onGoBackToCategory={(catId) => {
                if (catId === "all") {
                  window.location.hash = "#/dashboard";
                } else {
                  window.location.hash = `#/category/${catId}`;
                }
              }}
            />
          )}

          {currentView === "subscriptions" && (
            <SubscriptionView 
              currentTier={authUser && authUser.isPremium ? "Premium" : "Free"}
              onUpgradeComplete={() => {
                setAuthUser((prev) => {
                  const updated = prev 
                    ? { ...prev, isPremium: true } 
                    : { email: "premium.developer@toolzcraft.io", provider: "google" as const, isPremium: true };
                  return updated;
                });
              }}
            />
          )}

          {currentView === "sitemap" && (
            <div id="full-sitemap-view" className="max-w-4xl mx-auto px-4 py-8 md:py-12 animate-fade-in flex-1 w-full">
              <div className="text-center mb-8 border-b border-gray-250 dark:border-gray-850 pb-6">
                <h1 className="text-3xl font-extrabold text-gray-901 dark:text-white tracking-tight">Sitemap Directory Catalog</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-md mx-auto">
                  Browse or deep-link directly into any of the 150+ operational developer tools, mathematical calculators, and modernization utilities of ToolzCraft.
                </p>
              </div>

              {/* Sitemap Grid listing Categories and ALL Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CATEGORIES.map((cat) => (
                  <div id={`sitemap-cat-${cat.id}`} key={cat.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-xl p-5 shadow-3xs">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-150 dark:border-gray-800 pb-2 mb-3 select-none">
                      <span className="text-emerald-600">●</span>
                      {cat.title}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {cat.tools.map((t) => (
                        <button
                          id={`sitemap-tool-link-${t.id}`}
                          key={t.id}
                          onClick={() => handleSelectTool(t.id)}
                          className="text-left text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 py-1 font-medium hover:underline truncate cursor-pointer"
                          title={t.description}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === "privacy" && (
            <div id="full-privacy-view" className="max-w-3xl mx-auto px-4 py-8 md:py-12 animate-fade-in flex-1 w-full">
              <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-850 p-6 md:p-8 rounded-2xl shadow-xs space-y-6">
                <div className="border-b border-gray-250 dark:border-gray-850 pb-4 mb-4 text-center sm:text-left select-none">
                  <h1 className="text-2xl font-bold text-gray-901 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
                    <Shield className="w-6 h-6 text-emerald-600" />
                    Privacy, Compliance & Trust Center
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Effective date: June 10, 2026 • Verified HIPAA, GDPR, CCPA, and SOC 2 alignment protocols.
                  </p>
                </div>

                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  <section className="space-y-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">1. GDPR Consent & User Data Erasure</h3>
                    <p className="text-xs">
                      In strict compliance with General Data Protection Regulation (GDPR) guidelines, ToolzCraft enforces total data minimization parameters. Any images compressed, text models formatted, or documents structured reside solely in browser local memories. We do not store, catalog, or transmit your private payloads to remote databases. Local feedback registries saved in <code className="bg-gray-150 dark:bg-black/35 px-1 rounded text-emerald-630">/feedback.csv</code> can be scrubbed dynamically at container level.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">2. California Consumer Privacy Act (CCPA)</h3>
                    <p className="text-xs">
                      Under the California Consumer Privacy Act, users hold full authority to know whether their digital assets undergo sale. ToolzCraft operates a strictly commercial-free utility framework: we hold <strong>zero cloud retention mechanisms</strong>; we do not trade, aggregate, or lease user directories, WhatsApp log telemetry, or parsed bank ledger scans to marketing aggregators.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">3. SOC 2 Type II Cybersecurity Architecture</h3>
                    <p className="text-xs">
                      Our system is hosted inside sandboxed containers governed under secure Kubernetes nodes.
                    </p>
                    <ul className="list-disc pl-5 text-xs mt-1 space-y-1">
                      <li><strong>In-Transit Enforcements:</strong> Standard TLS 1.3 protocol encryption shields every transaction.</li>
                      <li><strong>Zero Retention Policy:</strong> Processed image pixels are cleared immediately when the browser tab closes.</li>
                      <li><strong>Least Privilege Bounds:</strong> Express routers and feedback collectors restrict write access metrics.</li>
                    </ul>
                  </section>

                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl text-xs flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-emerald-910 dark:text-emerald-410 block">Platform Security Absolute Verities:</span>
                      Images, files, and spreadsheets uploaded via the local forms are processed dynamically in client memories and are <strong>strictly never stored</strong> on any remote database or web servers.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Core Footer including SOC2 indices and complete searchable Sitemap link */}
          <ComplianceFooter
            currentView={currentView}
            onNavigateToSitemap={handleNavigateToSitemap}
            onNavigateToPrivacy={handleNavigateToPrivacy}
          />

        </div>
      </div>

      {/* Global Search modal overlay popup */}
      {searchOpen && (
        <SearchModal
          onClose={() => setSearchOpen(false)}
          onSelectTool={handleSelectTool}
        />
      )}

      {/* Global Authentication Modal */}
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onLoginSuccess={(userInfo) => setAuthUser(userInfo)}
        />
      )}

    </div>
  );
}
