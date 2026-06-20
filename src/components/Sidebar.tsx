import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { Category, Tool } from "../types";
import { CATEGORIES } from "../data";

interface SidebarProps {
  activeToolId: string;
  onSelectTool: (toolId: string) => void;
  isOpen: boolean;
  onToggleSidebar: () => void;
  isCollapsedDesktop: boolean;
  onToggleDesktopCollapse: () => void;
  hiddenToolIds?: string[];
  isAdmin?: boolean;
}

// Helper to look up Lucide icons dynamically
const getIconComponent = (iconName: string) => {
  const IconComponent = (Icons as any)[iconName];
  if (IconComponent) {
    return <IconComponent className="w-5 h-5 shrink-0" />;
  }
  return <Icons.File className="w-5 h-5 shrink-0" />;
};

export default function Sidebar({
  activeToolId,
  onSelectTool,
  isOpen,
  onToggleSidebar,
  isCollapsedDesktop,
  onToggleDesktopCollapse,
  hiddenToolIds = [],
  isAdmin = false,
}: SidebarProps) {
  // Find the category containing the active tool
  const activeCategoryId = CATEGORIES.find((cat) =>
    cat.tools.some((t) => t.id === activeToolId)
  )?.id || "";

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    return activeCategoryId ? { [activeCategoryId]: true } : {};
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Sync expanded categories to ONLY the active category when activeToolId changes
  useEffect(() => {
    const currentActiveCatId = CATEGORIES.find((cat) =>
      cat.tools.some((t) => t.id === activeToolId)
    )?.id;
    if (currentActiveCatId) {
      setExpandedCategories({ [currentActiveCatId]: true });
    }
  }, [activeToolId]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleSelectTool = (toolId: string) => {
    onSelectTool(toolId);
    // On mobile, auto-close sidebar when selection occurs
    if (window.innerWidth < 1024) {
      onToggleSidebar();
    }
  };

  // Safe subset based on Admin controls (deactivated/hidden tools filtered out from standard layout)
  const activeCategories = React.useMemo(() => {
    return CATEGORIES.map((cat) => {
      const visibleTools = cat.tools.filter(
        (t) => !hiddenToolIds.includes(t.id)
      );
      return {
        ...cat,
        tools: visibleTools,
      };
    }).filter((cat) => cat.tools.length > 0);
  }, [hiddenToolIds]);

  // Filter tools based on query
  const filteredCategories = React.useMemo(() => {
    return activeCategories.map((cat) => {
      const matchedTools = cat.tools.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return {
        ...cat,
        tools: matchedTools,
      };
    }).filter((cat) => cat.tools.length > 0);
  }, [activeCategories, searchQuery]);

  return (
    <>
      {/* Mobile Sidebar Overlay back-drop */}
      {isOpen && (
        <div
          id="mobile-sidebar-backdrop"
          onClick={onToggleSidebar}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Core Component CONTAINER */}
      <aside
        id="side-bar-navigation"
        className={`
          fixed top-0 bottom-0 left-0 bg-white dark:bg-gray-905 border-r border-gray-200 dark:border-gray-850 z-40 transition-all duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsedDesktop ? "lg:w-16" : "lg:w-72"}
          w-72 flex flex-col h-full text-gray-700 dark:text-gray-300
        `}
      >
        {/* Brand Header */}
        <div 
          onClick={() => { window.location.hash = "#/"; }}
          className="h-16 flex items-center justify-between px-4 border-b border-b-gray-200 dark:border-b-gray-850 shrink-0 cursor-pointer hover:bg-gray-55/85 dark:hover:bg-gray-850/80 transition"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="aspect-square h-10 w-10 shrink-0 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center p-0.5 border border-gray-150 dark:border-gray-700 shadow-sm">
              <img 
                src="/src/assets/images/toolzcraft_logo_1781092405969.png" 
                alt="ToolzCraft Logo" 
                className="w-full h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            {!isCollapsedDesktop && (
              <span className="font-extrabold text-base text-gray-900 dark:text-white tracking-tight truncate leading-none">
                ToolzCraft <span className="text-emerald-500 dark:text-emerald-600 text-[10px] block font-bold font-mono uppercase mt-0.5">Crafting Utilities</span>
              </span>
            )}
          </div>

          {/* Desktop Collapse Handle button */}
          <button
            id="desktop-collapse-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleDesktopCollapse();
            }}
            className="hidden lg:flex items-center justify-center p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-950 dark:hover:text-white transition"
            title={isCollapsedDesktop ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsedDesktop ? (
              <Icons.ChevronRight className="w-4 h-4" />
            ) : (
              <Icons.ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Mobile close button */}
          <button
            id="mobile-close-sidebar-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSidebar();
            }}
            className="lg:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-500 hover:text-gray-950 dark:hover:text-white transition"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Portal Shortcut Button */}
        <div className="p-3 border-b border-gray-150 dark:border-gray-850 shrink-0 space-y-2">
          {/* Main Landing Page Link */}
          <button
            id="sidebar-home-portal-btn"
            onClick={() => {
              window.location.hash = "#/";
              if (window.innerWidth < 1024) {
                onToggleSidebar();
              }
            }}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-lg border border-gray-200 dark:border-gray-850 transition cursor-pointer justify-center"
            title="Go to main Landing / Compliance Page"
          >
            <Icons.Home className="w-4 h-4 shrink-0 text-emerald-600" />
            {!isCollapsedDesktop && <span>Landing / Compliance</span>}
          </button>

          {/* Sandbox Hub Link */}
          <button
            id="sidebar-portal-btn"
            onClick={() => {
              window.location.hash = "#/dashboard";
              if (window.innerWidth < 1024) {
                onToggleSidebar();
              }
            }}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950 text-emerald-700 dark:text-emerald-600 font-extrabold text-xs rounded-lg border border-emerald-500/20 transition cursor-pointer justify-center"
            title="Launch the Expandable Sandbox Hub"
          >
            <Icons.LayoutDashboard className="w-4 h-4 shrink-0 text-emerald-600" />
            {!isCollapsedDesktop && <span>Explore Sandbox Hub</span>}
          </button>

          {/* Conditional Admin Override Link */}
          {isAdmin && (
            <button
              id="sidebar-admin-portal-link"
              onClick={() => {
                window.location.hash = "#/admin";
                if (window.innerWidth < 1024) {
                  onToggleSidebar();
                }
              }}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950 text-red-700 dark:text-red-400 font-extrabold text-xs rounded-lg border border-red-500/25 transition cursor-pointer justify-center animate-pulse"
              title="Sovereign Override panel"
            >
              <Icons.ShieldAlert className="w-4 h-4 shrink-0 text-red-650" />
              {!isCollapsedDesktop && <span>Admin Override Area</span>}
            </button>
          )}
        </div>

        {/* Categories and Tools scroll panel */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Quick-Filter Input (hidden if desktop sidebar collapsed) */}
          {(!isCollapsedDesktop || searchQuery) && (
            <div className="relative mb-2">
              <input
                id="sidebar-quick-filter"
                type="text"
                placeholder="Quick filter tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
              <Icons.Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
              {searchQuery && (
                <button
                  id="clear-sidebar-filter-btn"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2 w-5 h-5 text-gray-400 hover:text-gray-950 dark:hover:text-white"
                >
                  &times;
                </button>
              )}
            </div>
          )}

          {/* Collapsed desktop mini overview */}
          {isCollapsedDesktop && !searchQuery ? (
            <div className="flex flex-col items-center gap-4 py-4">
              {activeCategories.map((cat) => (
                <button
                  id={`collapsed-cat-icon-${cat.id}`}
                  key={cat.id}
                  onClick={onToggleDesktopCollapse}
                  className="p-2 bg-gray-50 dark:bg-gray-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-600 rounded-lg transition group relative"
                  title={cat.title}
                >
                  {getIconComponent(cat.icon)}
                  <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-50">
                    {cat.title} ({cat.tools.length} tasks)
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* Expanded Full-Scroll Categories */
            <div className="space-y-1">
              {filteredCategories.map((category) => {
                const isExpanded = !!expandedCategories[category.id];
                return (
                  <div id={`category-block-${category.id}`} key={category.id} className="border-b border-gray-100 dark:border-gray-850/50 pb-1.5 last:border-none">
                    {/* Category Title Trigger button */}
                    <button
                      id={`category-toggle-${category.id}`}
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-850/70 rounded-lg font-semibold text-xs text-gray-900 dark:text-emerald-600 transition-all text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-emerald-600 dark:text-emerald-600 shrink-0">
                          {getIconComponent(category.icon)}
                        </span>
                        <span>
                          {category.title}
                        </span>
                      </div>
                      <span className="text-gray-400 dark:text-gray-600 shrink-0">
                        {isExpanded ? (
                          <Icons.ChevronDown className="w-4 h-4" />
                        ) : (
                          <Icons.ChevronRight className="w-4 h-4" />
                        )}
                      </span>
                    </button>
 
                    {/* Tools sublist */}
                    {isExpanded && (
                      <div className="pl-3 pr-1 mt-1 space-y-0.5 border-l border-gray-150 dark:border-gray-800 ml-4.5 animate-fade-in">
                        {category.tools.map((tool) => {
                          const isActive = activeToolId === tool.id;
                          const isToolHidden = hiddenToolIds.includes(tool.id);
                          return (
                            <button
                              id={`tool-nav-${tool.id}`}
                              key={tool.id}
                              onClick={() => handleSelectTool(tool.id)}
                              className={`
                                w-full flex items-center justify-between py-1.5 px-2.5 rounded-md text-[11px] font-bold text-left transition
                                ${
                                  isActive
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-600 border-l-2 border-emerald-500 font-extrabold"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-650 dark:text-emerald-800 hover:text-emerald-600 dark:hover:text-emerald-300"
                                }
                                ${isToolHidden ? "opacity-50 text-rose-500/80 saturate-50 hover:text-rose-600" : ""}
                              `}
                              title={tool.description + (isToolHidden ? " (HIDDEN UTILITY)" : "")}
                            >
                              <span className="truncate pr-1 flex items-center gap-1">
                                {tool.name}
                                {isToolHidden && <span className="text-[9px] font-mono font-bold text-rose-500">(HIDDEN)</span>}
                              </span>
                              {(tool.isAiPowered || tool.category === "database-schema" || tool.category === "receipt-ocr") ? (
                                <span className="text-[8px] font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 px-1 rounded font-mono shrink-0 ml-1 uppercase" title="Calls Backend API Service">
                                  API
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredCategories.length === 0 && (
                <div className="text-center py-6">
                  <Icons.HelpCircle className="w-8 h-8 text-gray-400 mx-auto opacity-40 mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">No tools match your filter.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapsed Desktop handle visual placeholder */}
        {!isCollapsedDesktop && (
          <div className="p-3.5 border-t border-gray-200 dark:border-gray-850 shrink-0 bg-gray-50 dark:bg-gray-905 space-y-3 box-border">
            <div className="flex items-center gap-2">
              <Icons.Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase">
                GDPR & SOC2 Verified SSL
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
