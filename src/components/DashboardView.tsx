import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { 
  Plus, Minus, ArrowUpRight, Sparkles, Filter, ChevronDown, ChevronUp, AlertCircle, Search, HelpCircle
} from "lucide-react";
import { CATEGORIES, ALL_TOOLS } from "../data";
import { Category, Tool } from "../types";
import AdSenseAd from "./AdSenseAd";

interface DashboardViewProps {
  onSelectTool: (toolId: string) => void;
  onNavigateToPrivacy: () => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export default function DashboardView({ 
  onSelectTool, 
  onNavigateToPrivacy,
  selectedCategory = "all",
  onSelectCategory
}: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Keep track of which categories are expanded on the Hub
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>(() => {
    // Expand the selectedCategory by default, or the first three categories as default
    const initial: Record<string, boolean> = {};
    CATEGORIES.forEach((cat, index) => {
      initial[cat.id] = index < 3; // default first 3 categories open for a lively start
    });
    return initial;
  });

  // If selected category prop changes, auto-expand it and ensure it's visible
  useEffect(() => {
    if (selectedCategory && selectedCategory !== "all") {
      setExpandedCats(prev => ({
        ...prev,
        [selectedCategory]: true
      }));
    }
  }, [selectedCategory]);

  const toggleCategory = (catId: string) => {
    setExpandedCats((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const expandAll = () => {
    const updated: Record<string, boolean> = {};
    CATEGORIES.forEach((cat) => {
      updated[cat.id] = true;
    });
    setExpandedCats(updated);
  };

  const collapseAll = () => {
    const updated: Record<string, boolean> = {};
    CATEGORIES.forEach((cat) => {
      updated[cat.id] = false;
    });
    setExpandedCats(updated);
  };

  // Local indicators to check dynamic admin visibility parameters
  const getHiddenToolIds = (): string[] => {
    try {
      const saved = localStorage.getItem("admin_hidden_tools");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const checkIsAdmin = (): boolean => {
    try {
      const saved = localStorage.getItem("toolzcraft_auth_user");
      if (!saved) return false;
      const usr = JSON.parse(saved);
      return !!(usr && usr.email && usr.email.toLowerCase() === "new.ai.journey@gmail.com");
    } catch {
      return false;
    }
  };

  const hiddenIds = getHiddenToolIds();
  const isAdmin = checkIsAdmin();

  const displayedTools = ALL_TOOLS.filter(t => !hiddenIds.includes(t.id));
  const totalToolsCount = displayedTools.length;

  // Filter categories based on search term or selected filter
  const filteredCategories = CATEGORIES.map((cat) => {
    const matchedTools = cat.tools.filter((t) => {
      // Exclude hidden tools strictly
      if (hiddenIds.includes(t.id)) {
        return false;
      }
      const matchesSearch = 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    return {
      ...cat,
      tools: matchedTools
    };
  }).filter((cat) => {
    // Must contain tools matching search
    if (cat.tools.length === 0) return false;
    // If filtering by a single category
    if (selectedCategory !== "all" && cat.id !== selectedCategory) return false;
    return true;
  });

  // If a filter is active and search is typed, we auto-expand the matched categories
  useEffect(() => {
    if (searchTerm.trim() !== "") {
      const updated: Record<string, boolean> = {};
      CATEGORIES.forEach((cat) => {
        updated[cat.id] = true;
      });
      setExpandedCats(updated);
    }
  }, [searchTerm]);

  return (
    <div id="hub-landing-workspace" className="max-w-7xl mx-auto px-4 py-6 md:py-10 flex-1 space-y-6 animate-fade-in">
      
      {/* Search & Header Control Area */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 p-4.5 rounded-2xl shadow-3xs">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            ToolzCraft Sandbox Hub
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Explore {totalToolsCount} secure developer utility sandboxes directly in your browser.</p>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Quick-filter / Search */}
          <div className="relative flex-1 sm:w-64 min-w-[180px]">
            <input
              id="hub-search-field"
              type="text"
              placeholder="Search tools directly..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 pr-10 py-1.5 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-450 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-3xs"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
          </div>

          {/* Category Dropdown Filter */}
          <select
            id="hub-category-dropdown"
            value={selectedCategory}
            onChange={(e) => {
              if (onSelectCategory) {
                onSelectCategory(e.target.value);
              }
            }}
            className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-350 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">⚡ All Suitest Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.title}</option>
            ))}
          </select>

          {/* Expand/Collapse All Buttons (only if no category has been filtered) */}
          {selectedCategory === "all" && (
            <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shrink-0">
              <button
                onClick={expandAll}
                className="px-2.5 py-2 text-[10px] bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-850 text-gray-600 dark:text-gray-300 font-bold border-r border-gray-200 dark:border-gray-800 transition cursor-pointer"
                title="Expand all categories"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-2 text-[10px] bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-850 text-gray-600 dark:text-gray-300 font-bold transition cursor-pointer"
                title="Collapse all categories"
              >
                Collapse All
              </button>
            </div>
          )}

          {selectedCategory !== "all" && (
            <button
              onClick={() => onSelectCategory && onSelectCategory("all")}
              className="text-[11px] px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 border border-emerald-500/10 text-emerald-700 dark:text-emerald-600 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Icons.RotateCcw className="w-3.5 h-3.5" />
              Reset Hub
            </button>
          )}
        </div>
      </div>

      {/* Main Expandable Categories Stack */}
      <div className="space-y-4">
        {filteredCategories.map((cat) => {
          const IconComponent = (Icons as any)[cat.icon] || HelpCircle;
          const isExpanded = !!expandedCats[cat.id];

          return (
            <div 
              id={`hub-expandable-card-${cat.id}`}
              key={cat.id} 
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl overflow-hidden shadow-3xs transition-all duration-350"
            >
              {/* Category Header Bar (Interactive trigger) */}
              <div 
                onClick={() => toggleCategory(cat.id)}
                className="p-4 md:p-5 flex items-center justify-between cursor-pointer bg-gray-50/50 hover:bg-gray-50 dark:bg-gray-900/60 dark:hover:bg-gray-900 transition-colors border-b border-gray-100 dark:border-gray-850/50"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-600 rounded-xl border border-emerald-500/10 shrink-0">
                    <IconComponent className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm md:text-base text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                      {cat.title}
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        {cat.tools.length} Tools
                      </span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-xl">
                      {cat.tools.map((t) => t.name).join(" • ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 font-mono hidden sm:inline">
                    {isExpanded ? "Click to COLLAPSE" : "Click to EXPAND"}
                  </span>
                  <div className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 transition-transform">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Collapsible Content Section containing actual execution tool tiles */}
              {isExpanded && (
                <div className="p-4 md:p-6 bg-white dark:bg-gray-905/40 border-t border-gray-100 dark:border-gray-850/20 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.tools.map((t) => {
                      const isHidden = hiddenIds.includes(t.id);
                      return (
                        <div
                          id={`hub-expanded-tool-tile-${t.id}`}
                          key={t.id}
                          onClick={() => onSelectTool(t.id)}
                          className={`group p-5 rounded-2xl transition duration-300 cursor-pointer flex flex-col justify-between h-36 relative shadow-3xs ${
                            isHidden
                              ? "bg-rose-50/15 dark:bg-rose-950/10 border border-rose-350/30 hover:border-rose-500/50 opacity-70 grayscale hover:grayscale-0 hover:opacity-100"
                              : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 hover:border-emerald-500/20 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/5"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className={`font-extrabold text-sm transition truncate ${
                                isHidden ? "text-rose-650 dark:text-rose-400" : "text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-600"
                              }`}>
                                {t.name}
                              </span>
                              {isHidden ? (
                                <Icons.Lock className="w-3.5 h-3.5 text-rose-500" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 text-gray-350 opacity-0 group-hover:opacity-100 group-hover:text-emerald-500 transition shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-550 mt-2 leading-relaxed line-clamp-2 font-medium">
                              {t.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 pt-2">
                            {isHidden && (
                              <span className="text-[8px] font-black bg-rose-100 dark:bg-rose-955/65 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                                Hidden from Public
                              </span>
                            )}
                            {(t.isAiPowered || t.category === "database-schema" || t.category === "receipt-ocr") ? (
                              <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" />
                                Calls API
                              </span>
                            ) : null}
                            <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-600 px-1.5 py-0.5 rounded font-mono uppercase ml-auto">
                              0% Retention
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty Search matches panel */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No matching categories found in current filter mode.</p>
            <p className="text-xs text-gray-400 mt-1">Try resetting the dropdown menu or searching with another keyword.</p>
          </div>
        )}
      </div>

      {/* AdSense slot on the base of hub list view */}
      <AdSenseAd slot="998188173" format="rectangle" />
      
    </div>
  );
}
