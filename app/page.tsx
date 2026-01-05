"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TastingCard } from "@/components/TastingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const loadingMessages = [
  "Swirling the logic...",
  "Checking indentation notes...",
  "Aerating the syntax...",
];

interface TastingNote {
  title: string;
  diagnosis: string;
  fix: string;
  level: string;
  score: number;
}

interface ApiError {
  message: string;
  status?: number;
  details?: Array<{ field: string; message: string }>;
}

export default function Home() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [tastingNote, setTastingNote] = useState<TastingNote | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const { toast } = useToast();

  const handleDecant = async () => {
    if (!code.trim()) {
      toast({
        title: "Empty Code",
        description: "Please paste some code to decant.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTastingNote(null);
    setError(null);

    // Cycle through loading messages
    const messageInterval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 800);

    try {
      const response = await fetch("/api/decant", {
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
          // If response is not JSON, create a generic error
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }

        const apiError: ApiError = {
          message: errorData.error || "Failed to analyze code",
          status: response.status,
          details: errorData.details,
        };

        // Handle specific error types
        if (response.status === 429) {
          apiError.message = "Rate limit exceeded. Please wait a minute before trying again.";
        } else if (response.status === 413) {
          apiError.message = "Code is too large. Maximum size is 100KB. Please reduce the size and try again.";
        } else if (response.status === 503) {
          apiError.message = "Service temporarily unavailable. Please try again later.";
        } else if (response.status === 400 && errorData.details) {
          // Validation errors
          apiError.message = "Validation failed";
        }

        setError(apiError);
        toast({
          title: "Decanting Failed",
          description: apiError.message,
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      setTastingNote(data);
      setError(null);
    } catch (error) {
      console.error("Error decanting code:", error);
      
      const apiError: ApiError = {
        message: error instanceof Error 
          ? error.message 
          : "Failed to analyze your code. Please check your connection and try again.",
      };

      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        apiError.message = "Network error. Please check your connection and try again.";
      } else if (error instanceof Error && error.message.includes("timeout")) {
        apiError.message = "Request timed out. The code analysis is taking too long. Please try again.";
      }

      setError(apiError);
      toast({
        title: "Decanting Failed",
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
        className="text-center flex-shrink-0 py-2 md:py-4"
      >
        <p className="font-mono text-xl text-zinc-400">
          TopRev - Code Review by Top 0.1% Engineer
        </p>
      </motion.div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-y-auto md:overflow-hidden">
        {/* Left Side - Input */}
        <div className="flex flex-col min-h-[300px] md:h-full md:max-h-full overflow-hidden">
          <div className="flex-1 flex flex-col space-y-4 md:overflow-hidden">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here... The analysis will check for errors, memory leaks, scalability issues, and anti-patterns."
              className="flex-1 min-h-[200px] md:min-h-0 md:overflow-y-auto border-zinc-800 bg-zinc-900/50 font-mono text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500 resize-none"
              disabled={loading}
            />
            <Button
              onClick={handleDecant}
              disabled={loading}
              className="bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 font-mono transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-amber-600/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">🍷</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={loadingMessageIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {loadingMessages[loadingMessageIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              ) : (
                "Decant Code"
              )}
            </Button>
          </div>
        </div>

        {/* Right Side - Output */}
        <div className="flex flex-col min-h-[300px] md:h-full overflow-hidden">
          {loading && !tastingNote && !error && (
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
                    }}
                    className="w-full bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 font-mono"
                  >
                    Dismiss
                  </Button>
                </div>
              </motion.div>
            )}

            {tastingNote && !loading && !error && (
              <div className="h-full overflow-y-auto">
                <TastingCard tastingNote={tastingNote} />
              </div>
            )}
          </AnimatePresence>

          {!loading && !tastingNote && !error && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 font-mono text-sm space-y-2 px-8 text-center">
              <p className="text-zinc-500">Code review will appear here</p>
              <p className="text-zinc-700 text-xs">Paste your code on the left and click "Decant Code" to get a brutal technical analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
