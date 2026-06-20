import React, { useState, useEffect, useRef } from "react";
import { Search, X, Slash, Cpu, Sparkles, CornerDownLeft } from "lucide-react";
import { Tool } from "../types";
import { ALL_TOOLS } from "../data";

interface SearchModalProps {
  onClose: () => void;
  onSelectTool: (toolId: string) => void;
}

export default function SearchModal({ onClose, onSelectTool }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Tool[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus search input on open
    inputRef.current?.focus();

    // Prevent background scrolling
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        onSelectTool(results[selectedIndex].id);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [results, selectedIndex, onClose, onSelectTool]);

  // Click outside handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  useEffect(() => {
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
    const activePool = ALL_TOOLS.filter(t => !hiddenIds.includes(t.id));

    if (!query) {
      setResults(activePool.slice(0, 10)); // Default recommend top 10 tools
      return;
    }

    const filtered = activePool.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query.toLowerCase()) ||
        tool.category.toLowerCase().includes(query.toLowerCase()) ||
        tool.description.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);

  // Translate category string to human readable label
  const getCategoryLabel = (catId: string) => {
    const titles: Record<string, string> = {
      "finance-money": "Finance & Money",
      "everyday-calculators": "Everyday Calculators",
      "contact-management": "Contact Suite",
      "whatsapp-suite": "WhatsApp Suite",
      "files-documents": "Files & Documents",
      "receipt-ocr": "Receipt & OCR",
      "media-optimization": "Media Hub",
      "developer-hub": "Developer Hub",
      "ai-utilities": "AI Utilities",
      "mobile-utilities": "Mobile Utilities",
      "database-schema": "Database Migrations",
      "data-transformation": "Data Transforms",
      "api-integration": "API Integrations",
      "enterprise-modernization": "Enterprise Legacy",
    };
    return titles[catId] || catId;
  };

  return (
    <div
      id="search-backdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-[10vh] px-4 z-50 animate-fade-in"
    >
      <div
        id="search-modal-container"
        ref={modalRef}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[75vh] overflow-hidden transform scale-98 hover:scale-100 transition-all duration-150"
      >
        {/* Search Header Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            id="modal-search-field"
            ref={inputRef}
            type="text"
            placeholder="Search across 150+ developer tools (e.g. ebcidic, compressor, pdf)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-gray-905 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 text-md"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 border border-gray-200 dark:border-gray-850 rounded-md text-[10px] font-mono text-gray-400 dark:text-gray-500 shadow-xs shrink-0 select-none">
            ESC
          </kbd>
          <button
            id="close-search-modal-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-650 dark:hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Stream Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-550 tracking-wider uppercase px-2 py-1 select-none">
            {query ? `Found ${results.length} total utilities` : "Recommended Top Utilities"}
          </p>

          {results.map((tool, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                id={`search-result-${tool.id}`}
                key={tool.id}
                onClick={() => {
                  onSelectTool(tool.id);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`
                  flex items-center justify-between p-3 rounded-xl cursor-pointer text-left transition duration-100
                  ${
                    isSelected
                      ? "bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white"
                      : "bg-transparent text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-850"
                  }
                `}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {tool.isAiPowered ? <Sparkles className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{tool.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-mono ${
                          isSelected
                            ? "border-white/30 bg-white/10 text-white"
                            : "border-gray-250 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-850 dark:text-gray-400"
                        }`}
                      >
                        {getCategoryLabel(tool.category)}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-0.5 truncate ${
                        isSelected ? "text-emerald-50" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {tool.description}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex items-center gap-1.5 text-xs text-white/90 font-semibold shrink-0">
                    <span>Run</span>
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {results.length === 0 && (
            <div className="text-center py-12">
              <Cpu className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto animate-bounce mb-3" />
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-350">
                No tools cataloged for "{query}"
              </p>
              <p className="text-xs text-none text-gray-450 dark:text-gray-500 mt-1 max-w-xs mx-auto">
                Try searching broad terms like "pdf", "conver", "excel", "sql", "calculate", or "modern".
              </p>
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="bg-gray-50 dark:bg-gray-950 px-4 py-2.5 border-t border-gray-200 dark:border-gray-800 shrink-0 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 px-1 rounded shadow-3xs">↑↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 px-1 rounded shadow-3xs">Enter</kbd> to open
            </span>
          </div>
          <div>
            <span>Press <kbd className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 px-1 rounded shadow-3xs">ESC</kbd> to cancel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
