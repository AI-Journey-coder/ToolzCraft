import React, { useState } from "react";
import { X, Crown, Check, Zap, Sparkles, AlertTriangle } from "lucide-react";

interface SubscriptionPaywallModalProps {
  onClose: () => void;
  onUpgradeComplete: () => void;
}

export default function SubscriptionPaywallModal({ onClose, onUpgradeComplete }: SubscriptionPaywallModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [upgrading, setUpgrading] = useState(false);

  const benefits = [
    "UNLIMITED API transactions (No daily caps)",
    "Tabular database schema-conversion mapped previewer",
    "10x faster execution queues (Priority thread allocation)",
    "Large document OCR support (up to 50MB per sheet)",
    "GDPR zero log compliance guarantees"
  ];

  const handleUpgrade = () => {
    setUpgrading(true);
    setTimeout(() => {
      onUpgradeComplete();
      setUpgrading(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-905 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden select-none p-6 md:p-8">
        
        {/* Top brand header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500" />
        
        {/* Close trigger button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider w-fit mb-4">
          <AlertTriangle className="w-3.5 h-3.5" />
          Execution Boundary Breached
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-gray-901 dark:text-white tracking-tight leading-tight">
            Maximum API Attempts Reached 
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
            You have consumed all <span className="text-amber-600 dark:text-amber-400 font-bold">3 free trial API queries</span>. To continue exploiting live PL/SQL translator feeds, document OCR grids, and schema modernizations, unlock our Professional Tier below.
          </p>
        </div>

        {/* Toggle Billing Selector */}
        <div className="flex items-center justify-center gap-3 bg-gray-50 dark:bg-gray-950 py-2.5 px-4 rounded-xl border border-gray-150 dark:border-gray-850 my-5">
          <span className={`text-[11px] font-bold ${billingCycle === "monthly" ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className="w-10 h-5 bg-emerald-600 rounded-full p-0.5 relative transition flex items-center"
          >
            <div className={`w-4 h-4 bg-white rounded-full transition absolute ${billingCycle === "yearly" ? "right-1" : "left-1"}`} />
          </button>
          <span className={`text-[11px] font-bold flex items-center gap-1 ${billingCycle === "yearly" ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
            Yearly Save 25%
          </span>
        </div>

        {/* Benefits lists */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-mono">Unlocking Premium Benefits:</h4>
          <ul className="space-y-2">
            {benefits.map((ben, k) => (
              <li key={k} className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-300 font-medium">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{ben}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Dynamic call to actions button representing plans */}
        <div className="pt-6 space-y-3">
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition transform hover:scale-101 active:scale-99 flex items-center justify-center gap-2 cursor-pointer"
          >
            {upgrading ? (
              <span>Activating Secure Vault...</span>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
                Unlock Professional Tier • {billingCycle === "monthly" ? "$19.99/mo" : "$14.99/mo"}
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-50 border border-gray-200 dark:bg-gray-850 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white font-semibold text-xs rounded-xl transition"
          >
            Cancel and Return
          </button>
        </div>

        {/* SSL Shield Compliance badge */}
        <div className="border-t border-gray-150 dark:border-gray-800 mt-5 pt-3 flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-mono uppercase">
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          Active SOC2 Standard Encryption Guard
        </div>

      </div>
    </div>
  );
}
