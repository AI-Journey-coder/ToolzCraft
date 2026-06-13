import React, { useState } from "react";
import { Check, Sparkles, Zap, Flame, Crown, Library, ShieldCheck, Cpu } from "lucide-react";
import { ALL_TOOLS } from "../data";

interface SubscriptionViewProps {
  currentTier: "Free" | "Premium";
  onUpgradeComplete: () => void;
}

export default function SubscriptionView({ currentTier, onUpgradeComplete }: SubscriptionViewProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const premiumTools = ALL_TOOLS.filter(t => t.isAiPowered || t.category === "database-schema" || t.category === "receipt-ocr");

  const plans = [
    {
      id: "free",
      name: "Starter Sandbox",
      subtitle: "Ideal for basic debugging & local conversions",
      price: "0",
      icon: <Cpu className="w-5 h-5 text-gray-500" />,
      features: [
        "Up to 3 API execution attempts per day",
        "Unlimited client-only utilities (Offline compressors)",
        "Standard local CSV backup limits",
        "Community forum support",
      ],
      buttonText: "Active Tier No-Charge",
      actionClass: "border-gray-200 dark:border-gray-800 text-gray-500 bg-gray-50 dark:bg-gray-850 cursor-not-allowed",
      isPremium: false,
    },
    {
      id: "premium",
      name: "Professional Suite",
      subtitle: "For enterprise migrators & expert engineers",
      price: billingCycle === "monthly" ? "19.99" : "14.99",
      icon: <Crown className="w-5 h-5 text-amber-500 animate-bounce" />,
      features: [
        "UNLIMITED high-quality API transactions",
        "Full schema-conversion mapping table visualizer",
        "Priority dedicated queue (10x faster execution)",
        "Extended PDF OCR file boundaries (up to 50MB)",
        "24/7 dedicated engineering support",
        "SOC2 privacy data erasure protocols activated",
      ],
      buttonText: currentTier === "Premium" ? "Currently Subscribed" : "Upgrade to Pro Tier",
      actionClass: currentTier === "Premium" 
        ? "bg-amber-600 hover:bg-amber-700 text-white cursor-not-allowed" 
        : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md transform hover:scale-102 active:scale-98 transition",
      isPremium: true,
    }
  ];

  const handleUpgrade = (isPremium: boolean) => {
    if (isPremium && currentTier !== "Premium") {
      setUpgradeSuccess(true);
      setTimeout(() => {
        onUpgradeComplete();
        setUpgradeSuccess(false);
      }, 1500);
    }
  };

  return (
    <div id="subscription-viewport" className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto animate-fade-in select-none">
      
      {/* Visual Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-955/30 border border-amber-500/20 rounded-full text-[11px] font-bold text-amber-700 dark:text-amber-400 font-mono tracking-wider">
          <Crown className="w-3.5 h-3.5" />
          CHOOSE MAXIMUM PERFORMANCE SUITE
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-901 dark:text-white leading-none">
          Accelerate Your Workflows <br />
          with Infinite Sandbox Access
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Scale beyond barriers. Standard plan offers up to 3 API executions daily. Upgrade to Professional today.
        </p>
      </div>

      {/* Success alert */}
      {upgradeSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl text-sm font-semibold flex items-center gap-3 justify-center animate-bounce">
          <Zap className="w-5 h-5 text-amber-500 animate-spin" />
          System Updated: You are now a Professional subscriber! Unlimited APIs activated.
        </div>
      )}

      {/* Toggle billing cycle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-xs font-semibold ${billingCycle === "monthly" ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
          Monthly Billing
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
          className="w-12 h-6 bg-emerald-600 rounded-full p-0.5 relative transition flex items-center justify-start"
        >
          <div className={`w-5 h-5 bg-white rounded-full transition absolute ${billingCycle === "yearly" ? "right-1" : "left-1"}`} />
        </button>
        <span className={`text-xs font-semibold flex items-center gap-1 ${billingCycle === "yearly" ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
          Yearly Billing
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
            SAVE 25%
          </span>
        </span>
      </div>

      {/* Price Grid */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {plans.map((p) => {
          const isSelected = p.isPremium && currentTier === "Premium";
          return (
            <div
              id={`billing-plan-card-${p.id}`}
              key={p.id}
              className={`bg-white dark:bg-gray-905 border-2 rounded-3xl p-6 relative flex flex-col justify-between transition-all shadow-xs ${
                isSelected 
                  ? "border-amber-500 dark:border-amber-400 shadow-amber-500/5"
                  : p.isPremium
                    ? "border-indigo-600 dark:border-indigo-500/50 shadow-indigo-500/5"
                    : "border-gray-150 dark:border-gray-850"
              }`}
            >
              {p.isPremium && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 dark:bg-indigo-500 text-white font-extrabold text-[10px] uppercase font-mono tracking-wider px-3 py-1 rounded-full shadow-xs">
                  MOST POPULAR CHOICES
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">{p.name}</h3>
                    <p className="text-xs text-gray-400 max-w-[220px]">{p.subtitle}</p>
                  </div>
                  <div className="p-2.5 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-150 dark:border-gray-800">
                    {p.icon}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-3xl md:text-5xl font-black text-gray-901 dark:text-white tracking-tight">
                    ${p.price}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">/ user / mo</span>
                  {billingCycle === "yearly" && p.isPremium && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Billed yearly (${Number(p.price) * 12}/yr)</p>
                  )}
                </div>

                <div className="border-t border-gray-150 dark:border-gray-800 my-4" />

                <ul className="space-y-2.5 pt-1">
                  {p.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300">
                      <div className="p-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <button
                  id={`action-plan-${p.id}`}
                  onClick={() => handleUpgrade(p.isPremium)}
                  disabled={p.id === "free" || currentTier === "Premium"}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs ${p.actionClass}`}
                >
                  {p.buttonText}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Covered premium tools */}
      <div className="bg-white dark:bg-gray-905 border border-gray-150 dark:border-gray-850 rounded-3xl p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-2 select-none pb-2 border-b border-gray-100 dark:border-gray-850">
          <Library className="w-5 h-5 text-emerald-500" />
          <h2 className="font-bold text-base text-gray-900 dark:text-white">API-Driven Premium Tools Catalog ({premiumTools.length} tools)</h2>
        </div>
        <p className="text-xs text-gray-500 max-w-xl">
          The following conversion matrices utilize cloud services and Gemini-powered logic grids, and are fully unlocked for UNLIMITED processing under the Professional Tier.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {premiumTools.map((t) => (
            <div
              id={`sub-catalog-tool-${t.id}`}
              key={t.id}
              className="p-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800/80 rounded-xl flex flex-col justify-between hover:bg-emerald-50/20 dark:hover:bg-emerald-955/5 transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-gray-900 dark:text-white truncate pr-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">{t.name}</span>
                  <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/40 px-1 py-0.2 rounded font-mono uppercase">API</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-normal truncate">{t.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
