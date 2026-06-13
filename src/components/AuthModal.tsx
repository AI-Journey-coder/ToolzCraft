import React, { useState } from "react";
import { X, Mail, Phone, Moon, KeyRound, Sparkles, Check, ArrowRight } from "lucide-react";

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

  // Send validation code
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setOtpSentError("Please enter a valid phone number (at least 8 digits)");
      return;
    }
    setOtpSentError("");
    setIsSendingCode(true);
    setTimeout(() => {
      setIsSendingCode(false);
      setAuthMode("phone_otp");
    }, 900);
  };

  // Verify code
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6 || isNaN(Number(otpCode))) {
      setOtpSentError("OTP must be a 6-digit numeric security code.");
      return;
    }
    // Success phone registration!
    onLoginSuccess({
      phone: phoneNumber.trim(),
      provider: "phone",
      isPremium: false, // Default is free tier
    });
    onClose();
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
      isPremium: false, // Default is free tier
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden p-6">
        
        {/* Absolute header backgrounds */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-indigo-600" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-950 dark:hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LOGO */}
        <div className="flex items-center gap-2 mb-6">
          <div className="aspect-square h-8 w-8 bg-emerald-50 dark:bg-gray-800 rounded-lg flex items-center justify-center p-0.5 border border-emerald-500/20 shadow-xs">
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">T</span>
          </div>
          <span className="font-extrabold text-base text-gray-900 dark:text-white tracking-tight">
            ToolzCraft Auth Gate
          </span>
        </div>

        {authMode === "choose" && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Secure Identity Verification</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Sign in to sync your sandboxes, preserve history logs and gain API access credits.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => setAuthMode("google_sim")}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-gray-55 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold text-xs transition cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.53 5.53 0 0 1 8.41 13c0-3.048 2.483-5.518 5.58-5.518c1.378 0 2.633.494 3.61 1.306l3.125-3.122C18.841 3.99 16.516 3 13.99 3C8.47 3 4 7.47 4 13s4.47 10 9.99 10c5.3 0 9.682-3.834 9.682-10c0-.62-.069-1.214-.232-1.715H12.24Z"
                  />
                </svg>
                Continue with Google Authenticator
              </button>

              <button
                onClick={() => setAuthMode("phone_number")}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition cursor-pointer shadow-sm"
              >
                <Phone className="w-4 h-4 shrink-0" />
                Sign In with Mobile Phone No
              </button>
            </div>

            <div className="border-t border-gray-150 dark:border-gray-800 pt-4 text-[10px] text-gray-400 dark:text-gray-500 text-center flex items-center justify-center gap-1.5 select-none uppercase font-mono">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Fully Integrated Sandbox Environment
            </div>
          </div>
        )}

        {authMode === "google_sim" && (
          <form onSubmit={handleGoogleSuccess} className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Google SSO Workspace</h3>
              <p className="text-xs text-gray-400">Authenticate through your official Google GSuite credential.</p>
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
                className="flex-1 py-2 px-3 border border-gray-250 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-xl text-xs font-semibold transition"
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
              <p className="text-xs text-gray-400">Receive a 6-digit numeric authorization OTP on your SMS terminal.</p>
            </div>

            {otpSentError && <p className="text-xs text-rose-500 font-semibold">{otpSentError}</p>}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Mobile Number</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 019-2834"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("choose");
                  setOtpSentError("");
                }}
                className="flex-1 py-2 px-3 border border-gray-250 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-xl text-xs font-semibold transition"
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

            {otpSentError && <p className="text-xs text-rose-500 font-semibold">{otpSentError}</p>}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">6-Digit SMS Code</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-center font-mono tracking-widest text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              
              {/* Prominent Sandbox Simulation Banner */}
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-500/10 rounded-xl space-y-1 select-none text-left">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  Safe Sandbox Simulation Active
                </div>
                <p className="text-[10px] text-amber-700/90 dark:text-amber-400/80 leading-normal">
                  To prevent SMS delivery charges and verification delays in the trial workspace, no real mobile message is sent. Enter <code className="font-mono bg-amber-100/60 dark:bg-amber-950/40 px-1 py-0.5 rounded font-bold text-amber-900 dark:text-amber-300">123456</code> (or any 6 digits) above to authenticate instantly.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("phone_number");
                  setOtpSentError("");
                }}
                className="flex-1 py-2 px-3 border border-gray-250 dark:border-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
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

      </div>
    </div>
  );
}
