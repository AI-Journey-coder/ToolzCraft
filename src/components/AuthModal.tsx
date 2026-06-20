import React, { useState, useEffect } from "react";
import { X, Mail, Phone, Moon, KeyRound, Sparkles, Check, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { auth, googleProvider, isFirebaseConfigured } from "../lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup, ConfirmationResult } from "firebase/auth";

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (userInfo: { email?: string; phone?: string; provider: "google" | "phone"; isPremium: boolean }) => void;
}

export default function AuthModal({ onClose, onLoginSuccess }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<"choose" | "google_sim" | "phone_number" | "phone_otp">("choose");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSentError, setOtpSentError] = useState("");
  const [simulatedGoogleEmail, setSimulatedGoogleEmail] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [firebaseActive, setFirebaseActive] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    setFirebaseActive(isFirebaseConfigured());
  }, []);

  // Real Google Sign-In popup or fallback simulator trigger
  const handleGoogleSignIn = async () => {
    setOtpSentError("");
    if (isFirebaseConfigured() && firebaseActive) {
      setIsSendingCode(true);
      try {
        const result = await signInWithPopup(auth, googleProvider);
        onLoginSuccess({
          email: result.user?.email || "developer@toolzcraft.io",
          provider: "google",
          isPremium: result.user?.email?.toLowerCase() === "new.ai.journey@gmail.com",
        });
        onClose();
      } catch (err: any) {
        console.error("Google Authenticator failed:", err);
        if (err.code !== "auth/popup-closed-by-user") {
          setOtpSentError(`Google Sign-In failed: ${err.message || err}`);
        }
      } finally {
        setIsSendingCode(false);
      }
    } else {
      // Fallback simulation mode
      setAuthMode("google_sim");
    }
  };

  // Send calibration code
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setOtpSentError("Please enter a valid phone number component (e.g. +1 or +55 or +91 format with digits)");
      return;
    }
    setOtpSentError("");
    setIsSendingCode(true);

    const trimmedPhone = phoneNumber.trim();

    if (isFirebaseConfigured() && firebaseActive) {
      try {
        // Safeguard: Freshly recreate the RecaptchaVerifier on every trigger
        // to avoid binding with stale DOM components from previous modals/sessions.
        try {
          if ((window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier.clear?.();
          }
        } catch (e) {
          // ignore cleanup failures
        }
        (window as any).recaptchaVerifier = null;

        const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {
            // recaptcha solved automatically
          },
          "expired-callback": () => {
            setOtpSentError("reCAPTCHA validation expired. Please retry code dispatch.");
          }
        });
        (window as any).recaptchaVerifier = verifier;

        const result = await signInWithPhoneNumber(auth, trimmedPhone, verifier);
        setConfirmationResult(result);
        setAuthMode("phone_otp");
      } catch (err: any) {
        console.error("Firebase SMS trigger error:", err);
        const fbMessage = err?.message || String(err);
        let errorMsg = `Firebase Phone Auth Error: ${fbMessage}`;
        if (err?.code === "auth/operation-not-allowed" || fbMessage.includes("operation-not-allowed")) {
          errorMsg = `Firebase Phone Auth Policy Block (auth/operation-not-allowed): ${fbMessage}. This error typically highlights that while Phone authentication is enabled, the specific cellular carrier/region you are testing in is blocked by the regional safety policy, or our server domains are not registered under your reCAPTCHA whitelisted domains.`;
        } else if (fbMessage.toLowerCase().includes("captcha")) {
          errorMsg = `reCAPTCHA verification failed: ${fbMessage}. Please check domain whitelisting or try again.`;
        }
        setOtpSentError(errorMsg);
      } finally {
        setIsSendingCode(false);
      }
    } else {
      // Safe simulator fallback state
      setTimeout(() => {
        setIsSendingCode(false);
        setAuthMode("phone_otp");
      }, 900);
    }
  };

  // Verify verification code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6 || isNaN(Number(otpCode))) {
      setOtpSentError("OTP must be a 6-digit numeric security code.");
      return;
    }
    setOtpSentError("");
    setIsSendingCode(true);

    if (isFirebaseConfigured() && firebaseActive && confirmationResult) {
      try {
        const result = await confirmationResult.confirm(otpCode);
        onLoginSuccess({
          phone: result.user?.phoneNumber || phoneNumber.trim(),
          provider: "phone",
          isPremium: false,
        });
        onClose();
      } catch (err: any) {
        console.error("Firebase verification error:", err);
        setOtpSentError(`Invalid security code: ${err.message || err}`);
      } finally {
        setIsSendingCode(false);
      }
    } else {
      // Sandbox verify fallback logic
      setIsSendingCode(false);
      onLoginSuccess({
        phone: phoneNumber.trim(),
        provider: "phone",
        isPremium: false,
      });
      onClose();
    }
  };

  const handleGoogleSuccess = (e: React.FormEvent) => {
    e.preventDefault();
    const email = simulatedGoogleEmail.trim() || "developer@toolzcraft.io";
    if (!email.includes("@")) {
      setOtpSentError("Please enter a valid Google GSuite or Gmail account");
      return;
    }
    onLoginSuccess({
      email,
      provider: "google",
      isPremium: email.toLowerCase() === "new.ai.journey@gmail.com",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden p-6">
        
        {/* Recaptcha Container for Phone Verification (Invisible) */}
        <div id="recaptcha-container"></div>

        {/* Dynamic Theme Banner indicating configured authentication level */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-indigo-600" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-950 dark:hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LOGO */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="aspect-square h-8 w-8 bg-emerald-50 dark:bg-gray-850 rounded-lg flex items-center justify-center p-0.5 border border-emerald-500/20 shadow-xs">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">T</span>
            </div>
            <span className="font-extrabold text-base text-gray-900 dark:text-white tracking-tight">
              ToolzCraft Gate
            </span>
          </div>
          
          {/* Status Badge - Interactive Toggle to enable simulation bypass */}
          <button
            type="button"
            onClick={() => {
              setFirebaseActive(prev => !prev);
              setOtpSentError("");
            }}
            title="Click to toggle between production Firebase validation and simulation bypass"
            className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wide transition-all hover:scale-105 active:scale-95 ${
              firebaseActive 
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-500/15" 
                : "bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-500/10"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${firebaseActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            {firebaseActive ? "PRODUCTION ON" : "SIMULATION BYPASS Active"}
          </button>
        </div>

        {authMode === "choose" && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Secure Identity Verification</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-normal">
                Sign in to sync your sandboxes, preserve history logs and gain API access credits.
              </p>
            </div>

            {/* Error view */}
            {otpSentError && (
              <div className="space-y-3 text-left">
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/10 rounded-xl flex gap-2.5 items-start text-xs text-rose-700 dark:text-rose-400 leading-relaxed shadow-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div className="space-y-1">
                    <p className="font-bold">Authorization Blocked</p>
                    <p className="text-[11px] opacity-90">{otpSentError}</p>
                  </div>
                </div>

                {(otpSentError.includes("invalid-continue-uri") || otpSentError.includes("unauthorized-domain") || otpSentError.includes("auth-domain") || otpSentError.includes("unauthorized")) && (
                  <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/10 border border-indigo-250/50 dark:border-indigo-950/40 rounded-xl text-xs text-indigo-900 dark:text-indigo-300 space-y-2.5 animate-fade-in text-left">
                    <div className="font-bold flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-indigo-800 dark:text-indigo-400 uppercase">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
                      Troubleshoot Guide: Sandbox & Whitelist
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      Firebase fails with <code className="bg-indigo-100 dark:bg-indigo-950 px-1 py-0.5 rounded font-mono font-bold">invalid-continue-uri</code> or <code className="bg-indigo-100 dark:bg-indigo-950 px-1 py-0.5 rounded font-mono font-bold">unauthorized-domain</code> when Google Sign-In is triggered inside an iframe sandbox or if authorized domains are misconfigured.
                    </p>
                    <div className="space-y-1.5 pl-2 border-l border-indigo-300 text-left">
                      <p className="text-[11px] font-medium text-indigo-950 dark:text-indigo-200 font-mono text-[10px]">👉 HOW TO CORRECT THIS:</p>
                      <ul className="list-disc pl-4 text-[10px] space-y-1 leading-snug opacity-90">
                        <li><strong>Authorized Domains Checklist:</strong> Ensure <code className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[9px] break-all">ais-pre-5zoshiqwkfk45t7gtipgp4-953123904239.asia-southeast1.run.app</code> and <code className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[9px] break-all">ais-dev-5zoshiqwkfk45t7gtipgp4-953123904239.asia-southeast1.run.app</code> (and any custom domain) are added to Authorized Domains in your Firebase Console. <strong>Do NOT remove them.</strong></li>
                        <li><strong>Open in New Tab:</strong> In the top right header, click <strong>"Open in New Tab"</strong> to escape iframe constraints. Popups will then connect instantly!</li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSentError("");
                        setAuthMode("google_sim");
                      }}
                      className="w-full text-center py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-mono font-bold text-[10px] tracking-wider uppercase transition cursor-pointer shadow-xs"
                    >
                      Bypass & Run Simulated Google SSO ➔
                    </button>
                  </div>
                )}

                {(otpSentError.includes("operation-not-allowed") || otpSentError.includes("SMS unable to be sent") || otpSentError.includes("Phone Auth Error") || otpSentError.includes("Phone Authentication is currently disabled")) && (
                   <div className="p-4 bg-amber-50/70 dark:bg-amber-950/15 border border-amber-300/60 dark:border-amber-900/40 rounded-xl text-xs text-amber-900 dark:text-amber-300 space-y-3 animate-fade-in text-left relative z-10 shadow-sm">
                    <div className="font-bold flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-amber-800 dark:text-amber-400 uppercase">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                      Vital Checklist: Phone Auth Troubleshoot
                    </div>
                    
                    <p className="text-[11px] leading-relaxed opacity-90">
                      Since you have already enabled the <strong>Phone Sign-in Provider</strong>, the <code className="bg-amber-100/80 dark:bg-amber-950 px-1 py-0.5 rounded font-mono font-bold text-[10px]">auth/operation-not-allowed</code> error indicates one of the following security barriers is active:
                    </p>

                    <div className="space-y-2.5 text-[11px] leading-relaxed pl-2.5 border-l-2 border-amber-450 dark:border-amber-800">
                      <div>
                        <p className="font-bold text-amber-950 dark:text-amber-200 font-mono text-[10px]">1️⃣ SMS REGISTERED REGION POLICY (Most Common)</p>
                        <p className="text-[10.5px] opacity-85 mt-0.5 font-sans">
                          Firebase restricts SMS delivery to prevent traffic pumps or carrier charge fraud. 
                          <span className="block mt-1 font-medium bg-amber-100/45 dark:bg-amber-900/10 p-1.5 rounded">
                            👉 Open {"Firebase Console > Build > Authentication > Settings tab > User actions > SMS Region Policy"}, search your country, check the box, and save.
                          </span>
                        </p>
                      </div>

                      <div>
                        <p className="font-bold text-amber-950 dark:text-amber-200 font-mono text-[10px]">2️⃣ RECAPTCHA WHITING DOMAINS</p>
                        <p className="text-[10.5px] opacity-85 mt-0.5 font-sans">
                          The reCAPTCHA token must recognize our preview sandbox's server domain name.
                          <span className="block mt-1 font-medium bg-amber-100/45 dark:bg-amber-900/10 p-1.5 rounded">
                            👉 Open {"Settings > Authorized domains"} and verify these two URLs are listed exactly:
                            <code className="block mt-1 text-[10px] font-mono select-all bg-amber-150/55 dark:bg-amber-950 px-1.5 py-0.5 rounded font-bold">ais-dev-5zoshiqwkfk45t7gtipgp4-953123904239.asia-southeast1.run.app</code>
                            <code className="block mt-0.5 text-[10px] font-mono select-all bg-amber-150/55 dark:bg-amber-950 px-1.5 py-0.5 rounded font-bold">ais-pre-5zoshiqwkfk45t7gtipgp4-953123904239.asia-southeast1.run.app</code>
                          </span>
                        </p>
                      </div>

                      <div>
                        <p className="font-bold text-amber-950 dark:text-amber-200 font-mono text-[10px]">3️⃣ USE A VENDOR TESTING PHONE NO (Recommended)</p>
                        <p className="text-[10.5px] opacity-85 mt-0.5 font-sans">
                          Adding static numbers lets you test auth flows instantly with ZERO delay and zero SMS quota costs.
                          <span className="block mt-1 font-medium bg-amber-100/45 dark:bg-amber-900/10 p-1.5 rounded">
                            👉 Open {"Sign-in method > Phone > Phone numbers for testing (optional)"}. Register <code className="bg-amber-150/70 dark:bg-amber-950 px-1 rounded font-mono font-bold">+1 650-555-1234</code> with Verification Code <code className="bg-amber-150/70 dark:bg-amber-950 px-1 rounded font-mono font-bold">123456</code> to log in instantly.
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-1.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSentError("");
                          setFirebaseActive(false);
                          setAuthMode("phone_number");
                        }}
                        className="flex-1 text-center py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-mono font-bold text-[10px] tracking-wider uppercase transition cursor-pointer shadow-xs"
                      >
                        Run Local Simulator Bypass &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                onClick={handleGoogleSignIn}
                disabled={isSendingCode}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-gray-55 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold text-xs transition cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.53 5.53 0 0 1 8.41 13c0-3.048 2.483-5.518 5.58-5.518c1.378 0 2.633.494 3.61 1.306l3.125-3.122C18.841 3.99 16.516 3 13.99 3C8.47 3 4 7.47 4 13s4.47 10 9.99 10c5.3 0 9.682-3.834 9.682-10c0-.62-.069-1.214-.232-1.715H12.24Z"
                  />
                </svg>
                {isSendingCode ? "Authenticating..." : firebaseActive ? "Continue with Google" : "Continue with Google Demo"}
              </button>

              <button
                onClick={() => {
                  setOtpSentError("");
                  setAuthMode("phone_number");
                }}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition cursor-pointer shadow-sm"
              >
                <Phone className="w-4 h-4 shrink-0" />
                Sign In with Mobile Phone No
              </button>
            </div>

            {/* Explanatory notice to avoid eyestrain & facilitate production deploy */}
            <div className="p-3 bg-gray-50 dark:bg-gray-850/50 border border-gray-150 dark:border-gray-850 rounded-xl text-[11px] text-gray-500 dark:text-gray-400 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-gray-800 dark:text-gray-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                Production Deployment Advisory
              </div>
              <p className="leading-snug">
                For complete activation under your own domain/IP, configure your Firebase console project parameters inside the settings block. Real SMS logs and live Google redirects will instantly trigger.
              </p>
            </div>

            <div className="border-t border-gray-150 dark:border-gray-800 pt-4 text-[10px] text-gray-400 dark:text-gray-500 text-center flex items-center justify-center gap-1.5 uppercase font-mono">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Fully Integrated Sandbox Environment
            </div>
          </div>
        )}

        {authMode === "google_sim" && (
          <form onSubmit={handleGoogleSuccess} className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Google SSO Workspace</h3>
              <p className="text-xs text-gray-400">Authenticate through your simulated Google or GSuite sandbox credential.</p>
            </div>

            {otpSentError && <p className="text-xs text-rose-500 font-semibold">{otpSentError}</p>}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Google Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={simulatedGoogleEmail}
                  onChange={(e) => setSimulatedGoogleEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("choose");
                  setOtpSentError("");
                }}
                className="flex-1 py-2 px-3 border border-gray-250 dark:border-gray-800 text-gray-550 hover:text-gray-900 dark:hover:text-white rounded-xl text-xs font-semibold transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1"
              >
                Instant Access <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {authMode === "phone_number" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Phone No Authorization</h3>
              <p className="text-xs text-gray-400">
                {firebaseActive 
                  ? "A secure reCAPTCHA check will run, sending a live 6-digit verification code to your SMS terminal."
                  : "Receive a 6-digit numeric simulation code on your virtual SMS gateway."
                }
              </p>
            </div>

            {otpSentError && (
              <div className="space-y-3 text-left">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/10 rounded-xl text-xs text-rose-700 dark:text-rose-400 leading-normal shadow-xs">
                  {otpSentError}
                </div>
                {otpSentError.includes("Phone Authentication is currently disabled") && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSentError("");
                      setFirebaseActive(false);
                    }}
                    className="w-full text-center py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-mono font-bold text-[10px] tracking-wider uppercase transition cursor-pointer shadow-xs"
                  >
                    Bypass & Run Phone Simulator ➔
                  </button>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Mobile Number (Must include +Country Code)</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              <span className="text-[10px] text-gray-400 block pt-0.5">Please specify country digits first, e.g. +91, +1, or +44.</span>
            </div>

            <div className="flex items-center gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("choose");
                  setOtpSentError("");
                }}
                className="flex-1 py-2 px-3 border border-gray-250 dark:border-gray-800 text-gray-550 hover:text-gray-900 dark:hover:text-white rounded-xl text-xs font-semibold transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSendingCode}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSendingCode ? "Sending..." : "Send Verification OTP"}
              </button>
            </div>
          </form>
        )}

        {authMode === "phone_otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Verify SMS OTP Token</h3>
              <p className="text-xs text-gray-400">
                Enter the secret 6-digit verification code sent to <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-emerald-600 font-bold font-mono">{phoneNumber}</code>
              </p>
            </div>

            {otpSentError && (
              <div className="space-y-3 text-left">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/10 rounded-xl text-xs text-rose-700 dark:text-rose-400 leading-normal shadow-xs">
                  {otpSentError}
                </div>
                {otpSentError.includes("Phone Authentication is currently disabled") && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSentError("");
                      setFirebaseActive(false);
                    }}
                    className="w-full text-center py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-mono font-bold text-[10px] tracking-wider uppercase transition cursor-pointer shadow-xs"
                  >
                    Bypass & Run Phone Simulator ➔
                  </button>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">6-Digit SMS Code</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder={firebaseActive ? "******" : "123456"}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-center font-mono tracking-widest text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              
              {/* Prominent Sandbox Simulation Banner */}
              {!firebaseActive && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-500/10 rounded-xl space-y-1 text-left">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    Safe Sandbox Simulation Active
                  </div>
                  <p className="text-[10px] text-amber-700/90 dark:text-amber-400/80 leading-normal">
                    To prevent SMS delivery charges and verification delays in the trial workspace, no real mobile message is sent. Enter <code className="font-mono bg-amber-100/60 dark:bg-amber-950/40 px-1 py-0.5 rounded font-bold text-amber-900 dark:text-amber-300">123456</code> (or any 6 digits) above to authenticate instantly.
                  </p>
                </div>
              )}

              {firebaseActive && (
                <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/10 rounded-xl space-y-1 text-left">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Live Production SMS Link Connected
                  </div>
                  <p className="text-[10px] text-emerald-700/90 dark:text-emerald-450 leading-normal">
                    Check your mobile terminal immediately. An SMS containing the OTP code has been transmitted. Standard message rates apply.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("phone_number");
                  setOtpSentError("");
                }}
                className="flex-1 py-2 px-3 border border-gray-250 dark:border-gray-800 text-gray-550 hover:text-gray-900 dark:hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Re-enter No
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                Verify & Log In
              </button>
            </div>
          </form>
        )}

        {/* reCAPTCHA mounting node for secure SMS verification - kept in layout tree so we avoid display: none rendering failures */}
        <div id="recaptcha-container" className="opacity-0 absolute pointer-events-none h-0 w-0 overflow-hidden"></div>

      </div>
    </div>
  );
}
