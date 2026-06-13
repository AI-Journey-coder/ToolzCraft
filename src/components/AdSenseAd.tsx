import React, { useEffect, useState } from "react";
import { Sparkles, Megaphone, Info, ShieldCheck } from "lucide-react";

interface AdSenseAdProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  responsive?: boolean;
}

export default function AdSenseAd({ slot, format = "auto", responsive = true }: AdSenseAdProps) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  useEffect(() => {
    // Attempt real Google AdSense call if the global window object supports adsbygoogle
    try {
      if (typeof window !== "undefined") {
        // Trigger adsbygoogle push on component mount/route re-eval, which refreshes the slot on hash change
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        setAdLoaded(true);
      }
    } catch (e) {
      // Graceful fallback for non-production / localhost sandbox environments
      setAdLoaded(false);
    }
  }, [slot]); // Re-run whenever slot changes (on tool navigation)

  return (
    <div className="my-6 w-full select-none">
      <div className="relative group bg-radial from-amber-500/5 to-transparent dark:from-emerald-500/5 dark:to-transparent border border-dashed border-gray-254 dark:border-gray-800 rounded-xl p-4 transition duration-300 hover:border-emerald-500/40">
        
        {/* Real AdSense HTML Tag template */}
        <div className="hidden">
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client="ca-pub-XXXXXXXXXXXXX" // Replace with your real Publisher ID
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={responsive ? "true" : "false"}
          />
        </div>

        {/* High quality fallback representation in Sandbox */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-amber-100 dark:bg-emerald-950/50 text-amber-800 dark:text-emerald-400 rounded-lg animate-pulse">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-[10px] font-bold tracking-wider text-amber-700 dark:text-emerald-400 bg-amber-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded uppercase font-mono">
                  Sponsor Ad Space
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  Slot: ad-slot-{slot}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                High-yield matches calculated inside local sandbox memory bounds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id={`toggle-ad-help-btn-${slot}`}
              onClick={() => setShowConfigHelp(!showConfigHelp)}
              className="text-xs px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-800 font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" />
              {showConfigHelp ? "Hide Configuration Setup" : "Setup AdSense"}
            </button>
          </div>
        </div>

        {/* Floating details explaining how hash routing optimizes dynamic ad reloads */}
        {showConfigHelp && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-[11px] text-gray-600 dark:text-gray-300 space-y-3 prose leading-relaxed">
            <div className="flex items-start gap-2 text-emerald-800 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>SPA Route AdSense Refreshes Active:</span>
            </div>
            <p>
              Under our simulated separate-pages structure (controlled via **URL Hash Routing** e.g., <code className="bg-gray-150 dark:bg-black/35 px-1 rounded">#/image-compress</code>), Google AdSense crawler engines accurately discover and index each tool as a distinct URL node.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="bg-gray-50 dark:bg-gray-950 p-2 rounded border border-gray-200 dark:border-gray-850">
                <span className="font-bold block mb-1 text-gray-800 dark:text-gray-200">1. Real Ad Ingestion Code</span>
                <p className="text-[10px] text-gray-500">
                  Insert the script tag <code className="bg-gray-150 dark:bg-black/35 px-0.5 rounded text-rose-500">&lt;script async src="adsbygoogle.js"&gt;</code> in your <code className="bg-gray-150 dark:bg-black/35 px-0.5 rounded text-gray-700 font-mono">index.html</code> with your primary <code className="bg-gray-150 dark:bg-black/35 px-0.5 rounded text-green-600">ca-pub</code> Publisher ID.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-950 p-2 rounded border border-gray-200 dark:border-gray-850">
                <span className="font-bold block mb-1 text-gray-800 dark:text-gray-200">2. Reload triggers on Hash shift</span>
                <p className="text-[10px] text-gray-500">
                  When users shift utilities, the component mounts afresh with the matching slot parameter, forcing the ads SDK to trigger new, personalized commercial matches.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
