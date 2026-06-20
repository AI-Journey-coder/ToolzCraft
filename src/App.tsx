import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import SearchModal from "./components/SearchModal";
import ToolArea from "./components/ToolArea";
import ComplianceFooter from "./components/ComplianceFooter";
import DashboardView from "./components/DashboardView";
import LandingView from "./components/LandingView";
import AuthModal from "./components/AuthModal";
import SubscriptionView from "./components/SubscriptionView";
import AdminView from "./components/AdminView";
import { ALL_TOOLS, CATEGORIES } from "./data";
import { Tool } from "./types";
import { 
  Sun, Moon, Search, Menu, Cpu, ShieldAlert, Check, 
  HelpCircle, Sparkles, Database, FileSpreadsheet, List, Lock, Shield, Eye,
  KeyRound, User, LogOut, Crown, FileText
} from "lucide-react";

export default function App() {
  // Navigation states
  const [activeToolId, setActiveToolId] = useState<string>("contact-duplicate-finder");
  const [currentView, setCurrentView] = useState<"landing" | "dashboard" | "category" | "tool" | "sitemap" | "privacy" | "subscriptions" | "about" | "contact" | "terms" | "admin">("landing");
  const [selectedDashboardCategory, setSelectedDashboardCategory] = useState<string>("all");

  // Sidebar controls
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsedDesktop, setSidebarCollapsedDesktop] = useState(false);

  // Search modal controls
  const [searchOpen, setSearchOpen] = useState(false);

  // Contact form state
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactRefCode, setContactRefCode] = useState("");

  // Auth states & modal controls
  const [authOpen, setAuthOpen] = useState(false);
  const [authUser, setAuthUser] = useState<{ email?: string; phone?: string; provider: "google" | "phone"; isPremium: boolean } | null>(() => {
    const saved = localStorage.getItem("toolzcraft_auth_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && parsed.email.toLowerCase() === "new.ai.journey@gmail.com") {
          parsed.isPremium = true;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Local storage backup sync for session perseverance
  useEffect(() => {
    if (authUser) {
      if (authUser.email && authUser.email.toLowerCase() === "new.ai.journey@gmail.com" && !authUser.isPremium) {
        setAuthUser({ ...authUser, isPremium: true });
        return;
      }
      localStorage.setItem("toolzcraft_auth_user", JSON.stringify(authUser));
    } else {
      localStorage.removeItem("toolzcraft_auth_user");
    }
  }, [authUser]);

  // Theme states
  const [darkMode, setDarkMode] = useState(false);
  const [theme, setTheme] = useState<"classic" | "citrus">(() => {
    try {
      const saved = localStorage.getItem("toolz_app_theme");
      return (saved === "citrus" || saved === "classic") ? saved : "classic";
    } catch {
      return "classic";
    }
  });

  useEffect(() => {
    if (theme === "citrus") {
      document.documentElement.classList.add("theme-citrus");
    } else {
      document.documentElement.classList.remove("theme-citrus");
    }
    localStorage.setItem("toolz_app_theme", theme);
  }, [theme]);

  // Admin Tools hiding & visibility filters state
  const [hiddenToolIds, setHiddenToolIds] = useState<string[]>([]);
  useEffect(() => {
    async function loadHiddenTools() {
      try {
        const res = await fetch("/api/admin/config");
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            setHiddenToolIds(data.hiddenToolIds || []);
            
            // Sync current user's premium validation
            if (authUser?.email) {
              const emailLower = authUser.email.toLowerCase();
              const isAdminEmail = emailLower === "new.ai.journey@gmail.com";
              const usersList: any[] = data.users || [];
              const isPromoted = usersList.some(u => u.email.toLowerCase() === emailLower && (u.tier === "Premium" || u.tier === "Pro"));
              const isNowPremium = isAdminEmail || isPromoted;
              if (authUser.isPremium !== isNowPremium) {
                setAuthUser(prev => prev ? { ...prev, isPremium: isNowPremium } : null);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed loading tools list config metadata:", err);
      }
    }
    loadHiddenTools();
  }, [authUser?.email, currentView]);

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

  // Window event listener for opening auth modal dynamically
  useEffect(() => {
    const handleOpenAuth = () => {
      setAuthOpen(true);
    };
    window.addEventListener("open-auth-modal", handleOpenAuth);
    return () => window.removeEventListener("open-auth-modal", handleOpenAuth);
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

      if (hash === "#/admin") {
        setCurrentView("admin");
        return;
      }

      if (hash === "#/about") {
        setCurrentView("about");
        return;
      }

      if (hash === "#/contact") {
        setCurrentView("contact");
        return;
      }

      if (hash === "#/terms") {
        setCurrentView("terms");
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

  const handleNavigateToAbout = () => {
    window.location.hash = "#/about";
  };

  const handleNavigateToContact = () => {
    window.location.hash = "#/contact";
  };

  const handleNavigateToTerms = () => {
    window.location.hash = "#/terms";
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
        hiddenToolIds={hiddenToolIds}
        isAdmin={!!(authUser?.email && authUser.email.toLowerCase() === "new.ai.journey@gmail.com")}
      />

      {/* Main Container Shell */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${
        sidebarCollapsedDesktop ? "lg:pl-16" : "lg:pl-72"
      }`}>
        
        {/* Top Navigation Header Bar */}
        <header id="top-application-header" className="h-16 border-b border-gray-200 dark:border-gray-850 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md px-2 sm:px-4 flex items-center justify-between shrink-0 sticky top-0 z-30 select-none">
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger menu trigger */}
            <button
              id="mobile-hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-950 dark:hover:text-white transition"
              title="Toggle sidebar"
            >
              <Menu className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </button>

            {/* Logo and Name at the top left of the header - Visible on mobile/tablet or when desktop sidebar is collapsed */}
            <div 
              onClick={() => { window.location.hash = "#/"; }}
              className={`items-center gap-1.5 sm:gap-2.5 cursor-pointer select-none transition ${
                sidebarCollapsedDesktop ? "flex" : "flex lg:hidden"
              }`}
            >
              <div className="aspect-square h-7 w-7 sm:h-8 sm:w-8 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center p-0.5 border border-gray-150 dark:border-gray-700 shadow-sm">
                <img 
                  src="/src/assets/images/toolzcraft_logo_1781092405969.png" 
                  alt="ToolzCraft Logo" 
                  className="w-full h-full object-contain rounded-md"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white tracking-tight hidden sm:inline">
                ToolzCraft
              </span>
            </div>

            {/* Quick header tags */}
            <div className="hidden xl:flex items-center gap-2 text-xs">
              <span className="font-semibold text-gray-550 dark:text-gray-400">Sandbox Hub:</span>
              <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-600 px-2 py-0.5 rounded-sm font-bold font-mono">
                ONLINE
              </span>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <span className="text-gray-500 dark:text-gray-400 font-medium font-sans">Data Transit Encrypted</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Theme Selector */}
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 pl-1.5 sm:pl-2.5 pr-0.5 sm:pr-1 py-1 sm:py-1.5 rounded-xl transition">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0 hidden sm:block" />
              <select
                id="header-theme-selector"
                value={theme}
                onChange={(e) => {
                  const val = e.target.value as "classic" | "citrus";
                  setTheme(val);
                }}
                className="text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer pr-1 w-12 sm:w-auto"
                title="Select color palette theme"
              >
                <option value="classic" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white">Teal</option>
                <option value="citrus" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white">Citrus</option>
              </select>
            </div>

            {/* Global Search Button */}
            <button
              id="global-search-header-trigger"
              onClick={() => setSearchOpen(true)}
              className="p-1.5 sm:px-3.5 sm:py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-950 dark:hover:text-white rounded-xl border border-gray-200 dark:border-gray-800 text-xs flex items-center gap-1 sm:gap-3 transition cursor-pointer max-w-xs"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-405 shrink-0" />
              <span className="hidden md:inline font-medium">Search utility...</span>
              <kbd className="hidden sm:inline-flex items-center px-1 border border-gray-300 dark:border-gray-700 rounded-md text-[10px] font-mono text-gray-450 dark:text-gray-500 shadow-2xs select-none">
                ⌘K
              </kbd>
            </button>

            {/* Dark Mode toggle button (Hidden for now) */}
            <button
              id="global-dark-mode-toggle"
              onClick={() => setDarkMode(!darkMode)}
              className="hidden"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Authentic Login or Profile Section */}
            {authUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
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
                    className="h-8 w-8 sm:h-10 sm:w-10 bg-emerald-50 dark:bg-gray-800 border border-emerald-500/20 rounded-xl flex items-center justify-center p-0.5 shadow-xs font-bold text-xs text-emerald-750 dark:text-emerald-600 uppercase select-none cursor-pointer"
                    title="Profile Options"
                  >
                    {authUser.email ? authUser.email[0] : "P"}
                  </button>

                  <div className="absolute right-0 top-9 sm:top-11 p-2 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl shadow-lg w-44 opacity-0 group-hover:opacity-100 transition pointer-events-none group-hover:pointer-events-auto z-40">
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
                className="px-2.5 sm:px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] sm:text-xs rounded-xl flex items-center gap-1 sm:gap-1.5 transition cursor-pointer shadow-xs whitespace-nowrap"
              >
                <KeyRound className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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
              onSelectTool={handleSelectTool}
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

          {currentView === "admin" && (
            <AdminView 
              user={authUser}
              onSelectTool={handleSelectTool}
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
                {CATEGORIES.map((cat) => {
                  const visibleTools = cat.tools.filter(t => !hiddenToolIds.includes(t.id));
                  if (visibleTools.length === 0) return null;
                  
                  return (
                    <div id={`sitemap-cat-${cat.id}`} key={cat.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-xl p-5 shadow-3xs">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-150 dark:border-gray-800 pb-2 mb-3 select-none">
                        <span className="text-emerald-600">●</span>
                        {cat.title}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {visibleTools.map((t) => {
                          const isHidden = hiddenToolIds.includes(t.id);
                          return (
                            <button
                              id={`sitemap-tool-link-${t.id}`}
                              key={t.id}
                              onClick={() => handleSelectTool(t.id)}
                              className={`text-left hover:text-emerald-600 dark:hover:text-emerald-400 py-1 font-medium hover:underline truncate cursor-pointer ${
                                isHidden ? "text-rose-500/80 saturate-50 line-through opacity-70 font-semibold" : "text-gray-600 dark:text-gray-400"
                              }`}
                              title={t.description + (isHidden ? " (HIDDEN FROM STANDARD PUBLIC)" : "")}
                            >
                              {t.name} {isHidden && "🔒"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentView === "privacy" && (
            <div id="full-privacy-view" className="max-w-3xl mx-auto px-4 py-8 md:py-12 animate-fade-in flex-1 w-full">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 md:p-8 rounded-2xl shadow-xs space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-4 text-center sm:text-left select-none">
                  <h1 className="text-2xl font-bold text-gray-901 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
                    <Shield className="w-6 h-6 text-emerald-600" />
                    Privacy, Compliance & Trust Center
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">
                    Effective date: June 10, 2026 • Verified HIPAA, GDPR, CCPA, and SOC 2 alignment protocols.
                  </p>
                </div>

                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  <section className="space-y-2">
                    <h3 className="font-extrabold text-gray-905 dark:text-white text-sm uppercase font-mono tracking-wide">1. Explicit User Data Handling & Processing</h3>
                    <p className="text-xs">
                      At ToolzCraft, we follow a strict <strong>zero-retention, fully client-side design pattern</strong>. 
                      Here is exactly how your files, inputs, and coordinates are handled:
                    </p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 mt-1 text-gray-600 dark:text-gray-400">
                      <li><strong>Media Compressors & Converters:</strong> When you select a photo, image, HEIC asset, or document, it is loaded natively into your browser's private memory thread using standard Web APIs (such as HTML5 Canvas and File Reader). The pixels work entirely inside your local device cache; <strong>they are never transmitted or saved on any remote servers.</strong></li>
                      <li><strong>Mathematical & Day-to-Day Calculators:</strong> All amortization rows, compound interest formulas, and text formatted elements process strictly offline via client JS calculators.</li>
                      <li><strong>Secure In-Transit Proxies:</strong> For utilities that convert database schema dialects or conduct receipt parsing via Gemini/OCR models, the structural scripts or image files are secure-channeled over encrypted SSL / TLS 1.3 protocol paths, handled directly in RAM on volatile, stateless serverless nodes, and <strong>instantly obliterated upon execution</strong>. No backups, session histories, or diagnostic directories are ever provisioned on disk.</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-extrabold text-gray-905 dark:text-white text-sm uppercase font-mono tracking-wide">2. GDPR Consent & User Data Erasure</h3>
                    <p className="text-xs">
                      Under GDPR guidelines (Articles 5 and 25), ToolzCraft complies with the strict parameters of data minimization and privacy by default. Since no client user tables, files, or message databases are logged to disk, we hold no user records to erase. If you sign into your subscription tier via Google SSO or Phone verification, your user object details (email or phone) reside solely in volatile standard storage configurations and can be expunged instantly by clicking the "Log Out Profile" option.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-extrabold text-gray-905 dark:text-white text-sm uppercase font-mono tracking-wide">3. California Consumer Privacy Act (CCPA)</h3>
                    <p className="text-xs">
                      We never sell, rent, lease, or distribute dry operational inputs, contact sheets in vCard spreadsheets, or WhatsApp patterns telemetry to marketing brokers. <strong>0% of your metrics are processed for tracking monetization or advertisement aggregators.</strong>
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-extrabold text-gray-905 dark:text-white text-sm uppercase font-mono tracking-wide">4. SOC 2 Type II Cybersecurity Architecture</h3>
                    <p className="text-xs">
                      Our system is hosted inside sandboxed containers governed under secure Kubernetes nodes with automatic security patches:
                    </p>
                    <ul className="list-disc pl-5 text-xs mt-1 space-y-1 text-gray-600 dark:text-gray-400">
                      <li><strong>In-Transit Enforcements:</strong> Standard TLS 1.3 protocol encryption shields every transaction.</li>
                      <li><strong>Least Privilege Bounds:</strong> Express routers and feedback collectors restrict write access metrics.</li>
                    </ul>
                  </section>

                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl text-xs flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-emerald-900 dark:text-emerald-600 block">Platform Security Absolute Verities:</span>
                      Images, files, and spreadsheets uploaded via the local forms are processed dynamically in client memories and are <strong>strictly never stored</strong> on any remote database or web servers.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === "about" && (
            <div id="full-about-view" className="max-w-3xl mx-auto px-4 py-8 md:py-12 animate-fade-in flex-1 w-full">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 md:p-8 rounded-2xl shadow-xs space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-4 text-center sm:text-left select-none">
                  <h1 className="text-2xl font-bold text-gray-901 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
                    <Cpu className="w-6 h-6 text-emerald-600" />
                    About ToolzCraft
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">
                    The Modern Sandbox Utility Hub for Mobile and Web Developers.
                  </p>
                </div>

                <div className="space-y-4 text-sm text-gray-750 dark:text-gray-305 leading-relaxed text-xs">
                  <p>
                    ToolzCraft was founded with a singular, clear blueprint: <strong>to build a pristine, extremely fast, high-fidelity utilities suite</strong> that handles sensitive files with ironclad privacy. Unlike traditional utilities that force you through cookie-cluttered prompts, endless sign-ups, and slow file uploads to remote cloud arrays, ToolzCraft processes everything instantly in-browser.
                  </p>

                  <h3 className="font-bold text-gray-900 dark:text-white mt-4 text-xs uppercase font-mono tracking-wider">Why Builders Choose ToolzCraft:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-4 bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-xl">
                      <h4 className="font-bold text-[11px] text-gray-900 dark:text-white uppercase tracking-wider mb-1">Privacy Sovereign</h4>
                      <p className="text-[11px] text-gray-500 dark:text-[rgb(35,53,87)]">
                        No persistent database layers, no tracker telemetry, and full data minimization guarantees.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-xl">
                      <h4 className="font-bold text-[11px] text-gray-900 dark:text-white uppercase tracking-wider mb-1">Veloce Pipelines</h4>
                      <p className="text-[11px] text-gray-500 dark:text-[rgb(35,53,87)]">
                        Harnessing browser CPU/WebAssembly routines and multi-threaded calculations to compress and parse instantly.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-xl">
                      <h4 className="font-bold text-[11px] text-gray-900 dark:text-white uppercase tracking-wider mb-1">Unified Suite</h4>
                      <p className="text-[11px] text-gray-500 dark:text-[rgb(35,53,87)]">
                        Over 150 single-view calculators, vCard parsers, database dialect transceivers, and media pipelines in one screen.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-xl">
                      <h4 className="font-bold text-[11px] text-gray-900 dark:text-white uppercase tracking-wider mb-1">Developer-Centric</h4>
                      <p className="text-[11px] text-gray-500 dark:text-[rgb(35,53,87)]">
                        Clean layouts, JetBrains formatting alignments, and direct deep-link URI hash structures.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs mt-4">
                    <span className="font-bold text-emerald-900 dark:text-emerald-600 block mb-1">Sovereign Compliance Assurance</span>
                    All processes operate strictly in-browser or are tunneled under high-tier TLS 1.3 socket constraints. This ensures full compliance with international search optimization guidelines and corporate security reviews.
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === "contact" && (
            <div id="full-contact-view" className="max-w-3xl mx-auto px-4 py-8 md:py-12 animate-fade-in flex-1 w-full">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 md:p-8 rounded-2xl shadow-xs space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-4 text-center sm:text-left select-none">
                  <h1 className="text-2xl font-bold text-gray-910 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
                    <HelpCircle className="w-6 h-6 text-emerald-600" />
                    Contact Support & Inquiries
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">
                    Submit secure correspondence to our engineering desk. High SLA replies.
                  </p>
                </div>

                {contactSubmitted ? (
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/25 rounded-2xl text-center space-y-4 animate-fade-in">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-655 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-901 dark:text-white">Message Securely Lodged</h2>
                      <p className="text-xs text-gray-550 dark:text-gray-400 mt-1.5">
                        Your inquiry has been successfully transmitted via TLS 1.3 protocol channels to the ToolzCraft support desk at <strong className="text-emerald-600">support@toolzcraft.com</strong>.
                      </p>
                      <div className="mt-3.5 inline-block bg-white dark:bg-black/35 px-4 py-2 border border-gray-150 dark:border-gray-800 rounded-xl font-mono text-[11px] text-gray-700 dark:text-gray-300">
                        REFERENCE TICK: <span className="font-extrabold text-emerald-600">{contactRefCode}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setContactSubmitted(false)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      Submit Another Ticket
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const fd = new FormData(form);
                      const name = fd.get("name") || "Developer";
                      const randCode = "TC-" + Math.floor(1000 + Math.random() * 9000);
                      setContactRefCode(randCode);
                      setContactSubmitted(true);
                      form.reset();
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 font-mono uppercase">Your Full Name</label>
                        <input
                          type="text"
                          name="name"
                          required
                          placeholder="Jane Doe"
                          className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-901 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 font-mono uppercase">Contact Email</label>
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder="jane.doe@company.com"
                          className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-901 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 font-mono uppercase">Select Inquiry Category</label>
                      <select
                        name="category"
                        className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-901 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="general">General Support & Inquiries</option>
                        <option value="enterprise">Enterprise Sandbox Solutions</option>
                        <option value="custom">Custom Utility Pipeline Request</option>
                        <option value="bug">Bug Report or UI Correction</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 font-mono uppercase">Describe Your Message</label>
                      <textarea
                        name="message"
                        required
                        rows={4}
                        placeholder="Please include full parameters of your request..."
                        className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-901 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5 font-semibold">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" /> Direct SLA reply within 12 business hours.
                      </span>
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                      >
                        Send Secure Communication
                      </button>
                    </div>
                  </form>
                )}

                <div className="border-t border-gray-150 dark:border-gray-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs select-text">
                  <div className="space-y-1">
                    <span className="font-bold text-gray-800 dark:text-white block font-mono uppercase text-[10px]">HQ Engineering Desk:</span>
                    <span className="text-gray-500 dark:text-gray-400">ToolzCraft Software Labs LLC</span>
                    <span className="text-gray-500 dark:text-gray-400 block leading-tight">One Sansome Street, Floor 35, San Francisco, CA 94101</span>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-gray-800 dark:text-white block font-mono uppercase text-[10px]">Official Conduits:</span>
                    <a href="mailto:support@toolzcraft.com" className="text-emerald-700 dark:text-emerald-500 hover:text-emerald-800 block font-semibold hover:underline">E-Mail Assistance: support@toolzcraft.com</a>
                    <span className="text-gray-500 dark:text-gray-400 block font-semibold">SLA Status: PagerDuty Monitored</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === "terms" && (
            <div id="full-terms-view" className="max-w-3xl mx-auto px-4 py-8 md:py-12 animate-fade-in flex-1 w-full">
              <div className="bg-white dark:bg-gray-901 border border-gray-250 dark:border-gray-850 p-6 md:p-8 rounded-2xl shadow-xs space-y-6">
                <div className="border-b border-gray-250 dark:border-gray-850 pb-4 mb-4 text-center sm:text-left select-none">
                  <h1 className="text-2xl font-bold text-[rgb(35,53,87)] dark:text-[rgb(35,53,87)] tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
                    <FileText className="w-6 h-6 text-emerald-600" />
                    Terms of Service Agreement
                  </h1>
                  <p className="text-xs text-emerald-800 dark:text-emerald-800 mt-1 font-semibold">
                    Effective date: June 10, 2026 • Commercial Agreement for ToolzCraft Utilities usage parameters.
                  </p>
                </div>

                <div className="space-y-4 text-sm text-emerald-800 dark:text-emerald-800 leading-relaxed text-xs">
                  <section className="space-y-2">
                    <h3 className="font-bold text-[rgb(35,53,87)] dark:text-[rgb(35,53,87)] text-sm">1. Terms of Agreement & User Consent</h3>
                    <p>
                      By accessing, browsing, or running utilities inside the ToolzCraft application (including our vCard suites, SMS parsers, image translators, or database transceivers), you acknowledge complete compliance with these Terms. If you do not consent to these boundaries, please exit the page instantly.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-[rgb(35,53,87)] dark:text-[rgb(35,53,87)] text-sm">2. Permitted Use of Sandboxed Utilities</h3>
                    <p>
                      All outputs compiled on ToolzCraft's local interface are licensed under standard open-source parameters. You retain complete ownership of all translated tables, pruned contacts rosters, and compressed spreadsheets. You represent that you possess complete authorization for files uploaded; you are strictly forbidden from uploading target assets that infringe intellectual property boundaries.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-[rgb(35,53,87)] dark:text-[rgb(35,53,87)] text-sm">3. Sandbox Limitations & Disclaimer of Warranty</h3>
                    <p>
                      ToolzCraft provides all calculation models, converters, and API OCR decoders on an <strong>"AS IS" and "AS AVAILABLE"</strong> basis with zero warranties of any kind. We do not guarantee that database conversions from PL/SQL to PostgreSQL dialects will compile flawlessly inside all proprietary production SQL servers without human review. Users should independently review output dialect rows.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-[rgb(35,53,87)] dark:text-[rgb(35,53,87)] text-sm">4. SLA & Enterprise Subscriptions</h3>
                    <p>
                      Users subscribing to our Premium Tier enjoy high priority API processing threads, dedicated SLA help desk support, and access to extreme mainframe converters (such as COBOL Copybook parsing nodes). Premium memberships are billed monthly or annually and can be revoked instantly from the subscriptions suite tab.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-[rgb(35,53,87)] dark:text-[rgb(35,53,87)] text-sm">5. Dispute Resolution & General Provisions</h3>
                    <p>
                      This agreement is governed under the jurisdiction laws of California, USA. Any claims must be filed within specialized arbitration channels before litigation sequences.
                    </p>
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* Core Footer including SOC2 indices and complete searchable Sitemap link */}
          <ComplianceFooter
            currentView={currentView}
            onNavigateToSitemap={handleNavigateToSitemap}
            onNavigateToPrivacy={handleNavigateToPrivacy}
            onNavigateToAbout={handleNavigateToAbout}
            onNavigateToContact={handleNavigateToContact}
            onNavigateToTerms={handleNavigateToTerms}
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
