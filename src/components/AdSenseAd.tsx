import React, { useEffect, useState } from "react";
import { Sparkles, Megaphone, Info, ShieldCheck, Check, Settings, Copy } from "lucide-react";

interface AdSenseAdProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  responsive?: boolean;
}

export default function AdSenseAd({ slot, format = "auto", responsive = true }: AdSenseAdProps) {
  const [publisherId, setPublisherId] = useState(() => {
    try {
      const saved = localStorage.getItem("toolzcraft_adsense_pub_id");
      return saved || "ca-pub-7038600512011867";
    } catch {
      return "ca-pub-7038600512011867";
    }
  });

  const [inputPubId, setInputPubId] = useState(publisherId);
  const [isSaved, setIsSaved] = useState(false);
  const [showConfigHelp, setShowConfigHelp] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Dynamic Google AdSense Head Script Injector & refresher
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Find or create script tag
      const existingScript = document.getElementById("google-adsense-global-script");
      if (existingScript) {
        existingScript.remove();
      }

      // Append fresh script with updated client key
      const script = document.createElement("script");
      script.id = "google-adsense-global-script";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
      document.head.appendChild(script);

      // Trigger adsbygoogle push safely
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.warn("Local representation or ad blocker has deferred real AdSense elements matching publisher ID:", publisherId);
    }
  }, [publisherId, slot]); // Update matches on route slot transition or when publisher ID alters

  const handleSavePublisherId = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = inputPubId.trim();
    if (!cleanId.startsWith("ca-pub-")) {
      alert("Invalid Publisher ID Format. Ensure it starts with 'ca-pub-' (e.g. ca-pub-7038600512011867)");
      return;
    }

    try {
      localStorage.setItem("toolzcraft_adsense_pub_id", cleanId);
      setPublisherId(cleanId);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      console.error("Storage error:", err);
    }
  };

  const handleCopyCode = () => {
    const codeSnippet = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}" crossorigin="anonymous"></script>
<!-- AdSlot Header -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="${publisherId}"
     data-ad-slot="${slot}"
     data-ad-format="${format}"
     data-full-width-responsive="${responsive ? "true" : "false"}"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`;
    
    navigator.clipboard.writeText(codeSnippet);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="my-6 w-full select-none" id={`adsense-wrapper-container-${slot}`}>
      <div className="relative group bg-radial from-amber-500/5 to-transparent dark:from-emerald-500/5 dark:to-transparent border border-dashed border-gray-254 dark:border-gray-800 rounded-xl p-4 transition duration-300 hover:border-emerald-500/40">
        
        {/* Real AdSense HTML Tag template */}
        <div className="hidden">
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={publisherId}
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
              <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                <span className="text-[10px] font-bold tracking-wider text-amber-700 dark:text-emerald-400 bg-amber-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded uppercase font-mono">
                  Sponsor Ad Space
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  Slot: {slot}
                </span>
                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 rounded font-mono text-gray-500 font-semibold truncate hover:text-emerald-550 transition max-w-[150px]" title="Currently Active Publisher ID">
                  {publisherId}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Live premium ad matches rendered automatically on registered custom domains.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              id={`toggle-ad-help-btn-${slot}`}
              onClick={() => setShowConfigHelp(!showConfigHelp)}
              className="text-xs px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-800 font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              {showConfigHelp ? "Hide Configuration" : "Configure AdSense"}
            </button>
          </div>
        </div>

        {/* Floating details explaining how hash routing optimizes dynamic ad reloads */}
        {showConfigHelp && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-[11px] text-gray-600 dark:text-gray-300 space-y-3 prose leading-relaxed animate-fade-in text-left">
            
            {/* Dynamic Configuration Form */}
            <form onSubmit={handleSavePublisherId} className="bg-gray-50 dark:bg-gray-950/40 p-3 rounded-xl border border-gray-200 dark:border-gray-850 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-8 space-y-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 font-mono text-[10px]">YOUR GOOGLE ADSENSE PUBLISHER ID (ca-pub-xxx):</label>
                <input
                  type="text"
                  placeholder="e.g. ca-pub-7038600512011867"
                  value={inputPubId}
                  onChange={(e) => setInputPubId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white"
                />
              </div>
              <div className="sm:col-span-4 self-end flex gap-1.5 w-full">
                <button
                  type="submit"
                  className="flex-1 text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] tracking-wide uppercase transition cursor-pointer shadow-xs flex items-center justify-center gap-1"
                >
                  {isSaved ? <Check className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
                  {isSaved ? "Saved!" : "Apply ID"}
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 rounded-lg transition text-xs flex items-center justify-center"
                  title="Copy full HTML code integration snippet"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </form>

            <div className="flex items-start gap-2 text-emerald-800 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>SPA Route AdSense Refreshes Active:</span>
            </div>
            <p>
              Under our simulated separate-pages structure (controlled via **URL Hash Routing** e.g., <code className="bg-gray-150 dark:bg-black/35 px-1 rounded">#/image-compress</code>), Google AdSense crawler engines accurately discover and index each tool as a distinct URL node.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="bg-gray-50 dark:bg-gray-950 p-2.5 rounded border border-gray-200 dark:border-gray-850">
                <span className="font-bold block mb-1 text-gray-800 dark:text-gray-200">1. Real Ad Ingestion Code</span>
                <p className="text-[10px] text-gray-500 leading-normal">
                  The script injects <code className="bg-gray-150 dark:bg-black/35 px-0.5 rounded text-indigo-500">adsbygoogle.js</code> inside your document's head dynamically. On your live custom domain, verified publisher credentials trigger matching, high-yield commercial placements automatically.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-950 p-2.5 rounded border border-gray-200 dark:border-gray-850">
                <span className="font-bold block mb-1 text-gray-800 dark:text-gray-200">2. Reload triggers on Hash shift</span>
                <p className="text-[10px] text-gray-500 leading-normal">
                  When users shift utilities, the component mounts afresh with the matching slot parameter, forcing the ads SDK to trigger new, personalized commercial matches on the page.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
