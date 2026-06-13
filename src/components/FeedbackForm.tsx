import React, { useState, useEffect } from "react";
import { Star, Send, CheckCircle, Database, AlertCircle, FileSpreadsheet } from "lucide-react";
import { FeedbackSubmission } from "../types";

interface FeedbackFormProps {
  toolId: string;
  toolName: string;
}

export default function FeedbackForm({ toolId, toolName }: FeedbackFormProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comments, setComments] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Storage dataset state
  const [localList, setLocalList] = useState<FeedbackSubmission[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch feedback history from CSV
  const fetchFeedbackHistory = async () => {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.list)) {
          setLocalList(data.list);
        }
      }
    } catch (err) {
      console.error("Failed to load historical feedbacks:", err);
    }
  };

  useEffect(() => {
    // Refresh history when toolId shifts or accordion unfolds
    fetchFeedbackHistory();
  }, [toolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    const payload = {
      toolId,
      toolName,
      rating,
      comments: comments.trim(),
      email: email.trim(),
      name: name.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSubmitted(true);
          setComments("");
          setEmail("");
          setName("");
          setRating(5);
          // Refetch to include parent
          setTimeout(() => {
            fetchFeedbackHistory();
          }, 300);
          // Reset success state after general durations
          setTimeout(() => setSubmitted(false), 3505);
        } else {
          setErrorMsg(data.error || "Failed to record CSV dataset.");
        }
      } else {
        setErrorMsg("Failed to connect to fullstack Express service.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network exception.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id={`feedback-form-container-${toolId}`} className="mt-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 transition shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 dark:border-gray-800 pb-4 mb-4 select-none">
        <div>
          <h3 className="font-bold text-base text-gray-900 dark:text-gray-105 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            Rate the {toolName} Utility
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Collect local reviews. Feedback is saved on the live Node container inside a structured <code className="font-semibold text-emerald-600 dark:text-emerald-400">feedback.csv</code> spreadsheet.
          </p>
        </div>
        <button
          id="toggle-csv-history-btn"
          type="button"
          onClick={() => {
            setShowHistory(!showHistory);
            fetchFeedbackHistory();
          }}
          className="text-xs font-semibold text-emerald-650 hover:text-emerald-700 dark:text-emerald-450 dark:hover:text-emerald-350 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-500/10 hover:border-emerald-550 flex items-center gap-1.5 shrink-0 transition"
        >
          <FileSpreadsheet className="w-4 h-4" />
          {showHistory ? "Close Local Logs" : `Review CSV Dataset (${localList.length})`}
        </button>
      </div>

      {submitted ? (
        <div id="feedback-success-banner" className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/25 rounded-xl p-4 text-center animate-fade-in">
          <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-450 mx-auto mb-2" />
          <h4 className="font-semibold text-sm text-emerald-905 dark:text-emerald-400">Feedback Appended!</h4>
          <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-1">
            Row successfully written to <code className="bg-white/50 dark:bg-black/35 px-1.5 py-0.5 rounded">feedback.csv</code>. Your response is persisted!
          </p>
        </div>
      ) : (
        <form id="submission-feedback-form" onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 text-rose-700 dark:text-rose-405 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Rating controller */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Your Experience:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  id={`rating-star-btn-${star}`}
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= (hoverRating ?? rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-300 dark:text-gray-755 fill-transparent"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-650 dark:text-gray-350 mb-1">
                Your Name <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
              </label>
              <input
                id="feedback-name-field"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-650 dark:text-gray-350 mb-1">
                Your Email <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
              </label>
              <input
                id="feedback-email-field"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-650 dark:text-gray-350 mb-1">
              Comments or Suggested Improvements
            </label>
            <textarea
              id="feedback-comments-field"
              rows={3}
              required
              placeholder="What did you think of this tool? Are there other target capabilities or conversions you need?"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              id="submit-feedback-btn"
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 font-semibold text-xs text-white px-4 py-2 rounded-lg transition disabled:opacity-45 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {submitting ? "Writing..." : "Submit Feedback"}
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Accordion List to display recorded feedbacks */}
      {showHistory && (
        <div id="csv-history-viewer" className="mt-6 border-t border-gray-150 dark:border-gray-800 pt-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              Dynamic Spreadsheet Output: <span className="font-mono bg-gray-100 dark:bg-gray-850 px-1 py-0.2 rounded text-emerald-600 dark:text-emerald-450">/feedback.csv</span>
            </span>
            <span className="text-gray-450">{localList.length} total entries</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-850 rounded-xl p-2 bg-gray-50/50 dark:bg-gray-950/30">
            {localList.length === 0 ? (
              <p className="text-center text-xs text-gray-450 py-4 font-semibold">
                No local feedbacks logged yet. Give some stars to record your session!
              </p>
            ) : (
              /* Iterate CSV inputs */
              localList.map((item, index) => (
                <div
                  id={`csv-feedback-row-${index}`}
                  key={index}
                  className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-850 p-2.5 rounded-lg text-xs"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-850/50 pb-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {item.name || "Anonymous User"}
                      </span>
                      {item.email && (
                        <span className="text-gray-400 text-[10px]">({item.email})</span>
                      )}
                    </div>
                    <div className="flex items-center text-amber-500 shrink-0">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                    <span className="font-medium bg-emerald-50 dark:bg-emerald-950/35 px-1 rounded text-emerald-600 dark:text-emerald-440">
                      {item.toolName}
                    </span>
                    <span>
                      {new Date(item.timestamp).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mt-1 font-sans italic">
                    "{item.comments}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
