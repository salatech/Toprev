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

export default function Home() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [tastingNote, setTastingNote] = useState<TastingNote | null>(null);
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
        const error = await response.json();
        let errorMsg = error.error || "Failed to analyze code";
        
        // Handle rate limiting
        if (response.status === 429) {
          errorMsg = "Too many requests. Please wait a minute before trying again.";
        } else if (response.status === 413) {
          errorMsg = "Code is too large. Please reduce the size and try again.";
        } else if (error.details && Array.isArray(error.details)) {
          // Show validation errors
          errorMsg = error.details.map((d: { message: string }) => d.message).join(", ");
        } else if (error.message && process.env.NODE_ENV === "development") {
          errorMsg = error.message;
        }
        
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setTastingNote(data);
    } catch (error) {
      console.error("Error decanting code:", error);
      toast({
        title: "Decanting Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to analyze your code. Please try again.",
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
          {loading && !tastingNote && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <Skeleton className="h-full w-full bg-zinc-900" />
            </motion.div>
          )}

          <AnimatePresence>
            {tastingNote && !loading && (
              <div className="h-full overflow-y-auto">
                <TastingCard tastingNote={tastingNote} />
              </div>
            )}
          </AnimatePresence>

          {!loading && !tastingNote && (
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
