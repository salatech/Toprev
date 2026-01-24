"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TastingCard } from "@/components/TastingCard";
import { NarratorCard } from "@/components/NarratorCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Flame, GitPullRequest } from "lucide-react";

// Loading messages for Roast mode
const roastLoadingMessages = [
  "Swirling the logic...",
  "Checking indentation notes...",
  "Aerating the syntax...",
  "Judging your variable names...",
  "Finding the spaghetti...",
];

// Loading messages for Narrator mode
const narratorLoadingMessages = [
  "Reading the diff...",
  "Analyzing impact...",
  "Summarizing changes...",
  "Drafting release notes...",
  "Formatting markdown...",
];

interface TastingNote {
  title: string;
  diagnosis: string;
  fix: string;
  level: string;
  score: number;
}

interface PRDescription {
  title: string;
  summary: string;
  type: "feat" | "fix" | "chore" | "refactor" | "docs" | "style" | "test" | "perf";
  changes: string[];
  impact: string;
  testing: string;
}

interface ApiError {
  message: string;
  status?: number;
  details?: Array<{ field: string; message: string }>;
}

type AppMode = "roast" | "narrate";

export default function Home() {
  const [mode, setMode] = useState<AppMode>("roast");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [tastingNote, setTastingNote] = useState<TastingNote | null>(null);
  const [prDescription, setPrDescription] = useState<PRDescription | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const { toast } = useToast();

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    setTastingNote(null);
    setPrDescription(null);
    setError(null);
    // Optional: Clear code or keep it? Keeping it is usually better UX.
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast({
        title: "Empty Input",
        description: mode === "roast" ? "Please paste some code to decant." : "Please paste a diff or code to narrate.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTastingNote(null);
    setPrDescription(null);
    setError(null);

    const messages = mode === "roast" ? roastLoadingMessages : narratorLoadingMessages;

    // Cycle through loading messages
    const messageInterval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % messages.length);
    }, 800);

    try {
      const endpoint = mode === "roast" ? "/api/decant" : "/api/narrate";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }

        const apiError: ApiError = {
          message: errorData.error || "Failed to process request",
          status: response.status,
          details: errorData.details,
        };

        if (response.status === 429) {
          apiError.message = "Rate limit exceeded. Please wait a minute.";
        }

        setError(apiError);
        toast({
          title: "Processing Failed",
          description: apiError.message,
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();

      if (mode === "roast") {
        setTastingNote(data);
      } else {
        setPrDescription(data);
      }

      setError(null);
    } catch (error) {
      console.error("Error processing request:", error);

      const apiError: ApiError = {
        message: error instanceof Error
          ? error.message
          : "Failed to connect. Please check your internet connection.",
      };

      setError(apiError);
      toast({
        title: "Request Failed",
        description: apiError.message,
        variant: "destructive",
      });
    } finally {
      clearInterval(messageInterval);
      setLoading(false);
      setLoadingMessageIndex(0);
    }
  };

  return (
    <div className="h-screen md:h-screen min-h-screen bg-zinc-950 flex flex-col overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center flex-shrink-0 py-2 md:py-4 relative z-10"
      >
        <p className="font-mono text-xl text-zinc-400">
          TopRev - <span className={mode === "roast" ? "text-amber-500" : "text-indigo-400"}>
            {mode === "roast" ? "Code Review by Top 0.1% Engineer" : "AI-Powered Pull Request Narrator"}
          </span>
        </p>
      </motion.div>

      <div className="flex justify-center pb-2">
        <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleModeChange("roast")}
            className={`gap-2 font-mono text-xs ${mode === "roast" ? "bg-amber-900/30 text-amber-500" : "text-zinc-500 hover:text-amber-500/70 hover:bg-zinc-800"}`}
          >
            <Flame className="w-3 h-3" /> Code Roast
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleModeChange("narrate")}
            className={`gap-2 font-mono text-xs ${mode === "narrate" ? "bg-indigo-900/30 text-indigo-400" : "text-zinc-500 hover:text-indigo-400/70 hover:bg-zinc-800"}`}
          >
            <GitPullRequest className="w-3 h-3" /> PR Narrator
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-y-auto md:overflow-hidden">
        {/* Left Side - Input */}
        <div className="flex flex-col min-h-[300px] md:h-full md:max-h-full overflow-hidden">
          <div className="flex-1 flex flex-col space-y-4 md:overflow-hidden">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={mode === "roast"
                ? "Paste your code here... The analysis will check for errors, memory leaks, scalability issues, and anti-patterns."
                : "Paste your raw code or `git diff` here to generate a professional Pull Request description."
              }
              className={`flex-1 min-h-[200px] md:min-h-0 md:overflow-y-auto border-zinc-800 bg-zinc-900/50 font-mono text-sm text-zinc-100 placeholder:text-zinc-500 focus:ring-1 resize-none ${mode === "roast" ? "focus:border-amber-500 focus:ring-amber-500" : "focus:border-indigo-500 focus:ring-indigo-500"
                }`}
              disabled={loading}
            />
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className={`font-mono transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-white disabled:opacity-50 ${mode === "roast"
                  ? "bg-amber-600 hover:bg-amber-700 hover:shadow-amber-600/30"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-600/30"
                }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">{mode === "roast" ? "🍷" : "⚡"}</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={loadingMessageIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {(mode === "roast" ? roastLoadingMessages : narratorLoadingMessages)[loadingMessageIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              ) : (
                mode === "roast" ? "Decant Code" : "Narrate PR"
              )}
            </Button>
          </div>
        </div>

        {/* Right Side - Output */}
        <div className="flex flex-col min-h-[300px] md:h-full overflow-hidden">
          {loading && !tastingNote && !prDescription && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <Skeleton className="h-full w-full" />
            </motion.div>
          )}

          <AnimatePresence>
            {error && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full flex flex-col items-center justify-center p-8"
              >
                <div className="w-full max-w-2xl space-y-4">
                  <div className="border border-red-900/50 bg-red-950/20 rounded-lg p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="text-red-500 text-2xl">⚠️</div>
                      <div className="flex-1 space-y-2">
                        <h3 className="font-mono text-lg font-semibold text-red-400">
                          Error
                        </h3>
                        <p className="font-mono text-sm text-red-300 leading-relaxed">
                          {error.message}
                        </p>
                        {error.status && (
                          <p className="font-mono text-xs text-red-400/70">
                            Status Code: {error.status}
                          </p>
                        )}
                        {error.details && error.details.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="font-mono text-xs font-semibold text-red-400 uppercase">
                              Details:
                            </p>
                            <ul className="space-y-1">
                              {error.details.map((detail, index) => (
                                <li
                                  key={index}
                                  className="font-mono text-xs text-red-300/80 pl-4"
                                >
                                  <span className="text-red-400">
                                    {detail.field}:
                                  </span>{" "}
                                  {detail.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setError(null);
                      setTastingNote(null);
                      setPrDescription(null);
                    }}
                    className="w-full bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 font-mono"
                  >
                    Dismiss
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Code Roast Output */}
            {mode === "roast" && tastingNote && !loading && !error && (
              <div className="h-full overflow-y-auto">
                <TastingCard tastingNote={tastingNote} />
              </div>
            )}

            {/* PR Narrator Output */}
            {mode === "narrate" && prDescription && !loading && !error && (
              <div className="h-full overflow-y-auto">
                <NarratorCard description={prDescription} />
              </div>
            )}
          </AnimatePresence>

          {!loading && !tastingNote && !prDescription && !error && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 font-mono text-sm space-y-2 px-8 text-center">
              <p className="text-zinc-500">
                {mode === "roast" ? "Code review will appear here" : "PR description will appear here"}
              </p>
              <p className="text-zinc-700 text-xs">
                {mode === "roast"
                  ? 'Paste your code on the left and click "Decant Code" to get a brutal technical analysis'
                  : 'Paste your diff on the left and click "Narrate PR" to generate a professional description'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
