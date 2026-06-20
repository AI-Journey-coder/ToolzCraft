import React, { useState, useEffect } from "react";
import { Shield, Lock, Eye, AlertCircle, FileText } from "lucide-react";

interface ComplianceFooterProps {
  onNavigateToSitemap: () => void;
  onNavigateToPrivacy: () => void;
  onNavigateToAbout: () => void;
  onNavigateToContact: () => void;
  onNavigateToTerms: () => void;
  currentView?: string;
}

export default function ComplianceFooter({ 
  onNavigateToSitemap, 
  onNavigateToPrivacy, 
  onNavigateToAbout,
  onNavigateToContact,
  onNavigateToTerms,
  currentView = "tool" 
}: ComplianceFooterProps) {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already agreed to cookie consent
    const consent = localStorage.getItem("omnitool-cookie-consent");
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAcceptConsent = () => {
    localStorage.setItem("omnitool-cookie-consent", "granted");
    setShowConsent(false);
  };

  return (
    <>
      {/* Cookie / Data Consent Notice Toast */}
      {showConsent && (
        <div id="consent-banner" className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-white dark:bg-gray-900 border border-emerald-500/30 shadow-2xl p-4 rounded-xl z-50 animate-bounce-short">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                GDPR & CCPA Data Consent Notice
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                We use cookies and local registers to optimize tool caching and record feedback responses. All source operations (media compression, unit conversions, and document parsing) occur entirely in-browser or are fully encrypted in transit. No confidential images, files, or sensitive payloads are stored on our servers.
              </p>
              <div className="flex justify-end gap-2 mt-3 block">
                <button
                  id="privacy-details-btn"
                  onClick={onNavigateToPrivacy}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-600 dark:hover:text-emerald-300 px-2 py-1 cursor-pointer"
                >
                  Read Policy
                </button>
                <button
                  id="consent-accept-btn"
                  onClick={handleAcceptConsent}
                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-650 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  I Consent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Corporate Compliance Core Footer */}
      <footer id="compliance-footer" className="bg-white dark:bg-gray-900 border-t border-gray-150 dark:border-gray-850 shrink-0 select-none text-[11px] text-gray-500 dark:text-gray-400">
        <div className="max-w-7xl mx-auto px-4 py-3">
          
          {/* Heavy 3-column compliance highlights ONLY shown on non-tool pages */}
          {currentView !== "tool" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-center md:text-left border-b border-gray-150 dark:border-gray-850 pb-4">
              <div className="flex flex-col items-center md:items-start gap-1 pb-2 md:pb-0">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-600">
                  <Lock className="w-4 h-4" />
                  <h4 className="font-bold text-gray-900 dark:text-white">GDPR & CCPA Aligned</h4>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Autonomy prioritized: we never track or aggregate sensitive customer payloads.
                </p>
              </div>
              <div className="flex flex-col items-center md:items-start gap-1 pb-2 md:pb-0">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-600">
                  <Eye className="w-4 h-4" />
                  <h4 className="font-bold text-gray-900 dark:text-white">Zero Cloud Retention</h4>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Your files process locally or via heavily fortified single-transaction in-transit bounds.
                </p>
              </div>
              <div className="flex flex-col items-center md:items-start gap-1">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-600">
                  <Shield className="w-4 h-4" />
                  <h4 className="font-bold text-gray-900 dark:text-white">SOC 2 Type II Safeguards</h4>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">
                  Inbound routing configurations map strict containerization and telemetry-free parameters.
                </p>
              </div>
            </div>
          )}

          {/* Compact visual highlights for Tool workspace view */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
              <span className="font-bold text-gray-800 dark:text-white">ToolzCraft Utilities</span>
              <span className="text-gray-350 dark:text-gray-700">|</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-600 font-medium">
                <Lock className="w-3.5 h-3.5" /> GDPR & SOC2 Compliant
              </span>
              <span className="text-gray-350 dark:text-gray-700">•</span>
              <span className="text-emerald-600 dark:text-emerald-600 font-medium font-sans">Zero Cloud Storage</span>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-3 gap-y-1 font-semibold text-[11px]">
              <button
                id="footer-about-btn"
                onClick={onNavigateToAbout}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition hover:underline cursor-pointer"
              >
                About Us
              </button>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <button
                id="footer-contact-btn"
                onClick={onNavigateToContact}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition hover:underline cursor-pointer"
              >
                Contact Us
              </button>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <button
                id="footer-terms-btn"
                onClick={onNavigateToTerms}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition hover:underline cursor-pointer"
              >
                Terms of Service
              </button>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <button
                id="footer-privacy-btn"
                onClick={onNavigateToPrivacy}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition hover:underline cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <button
                id="footer-sitemap-btn"
                onClick={onNavigateToSitemap}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition hover:underline cursor-pointer"
              >
                Sitemap
              </button>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}
