"use client";

import { useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/CodeEditor";
import { TastingCard } from "@/components/TastingCard";
import { NarratorCard } from "@/components/NarratorCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Flame, GitPullRequest } from "lucide-react";

// Schemas matching backend
const tastingNoteSchema = z.object({
  title: z.string(),
  diagnosis: z.string(),
  fix: z.string(),
  refactoredCode: z.string().optional(),
  language: z.string().optional(),
  level: z.string(),
  score: z.number(),
});

const prDescriptionSchema = z.object({
  title: z.string(),
  summary: z.string(),
  type: z.enum(["feat", "fix", "chore", "refactor", "docs", "style", "test", "perf"]),
  changes: z.array(z.string()),
  impact: z.string(),
  testing: z.string(),
});

type AppMode = "roast" | "narrate";

export default function Home() {
  const [mode, setMode] = useState<AppMode>("roast");
  const [code, setCode] = useState("");
  const { toast } = useToast();

  const {
    object: tastingNote,
    submit: submitRoast,
    isLoading: isRoasting,
    error: roastError,
  } = useObject({
    api: "/api/decant",
    schema: tastingNoteSchema,
    onError: () => {
      toast({ title: "Error", description: "Failed to generate roast.", variant: "destructive" });
    }
  });

  const {
    object: prDescription,
    submit: submitNarrate,
    isLoading: isNarrating,
    error: narrateError,
  } = useObject({
    api: "/api/narrate",
    schema: prDescriptionSchema,
    onError: () => {
      toast({ title: "Error", description: "Failed to generate description.", variant: "destructive" });
    }
  });

  const loading = isRoasting || isNarrating;
  const error = roastError || narrateError;

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast({
        title: "Empty Input",
        description: "Please paste some code first.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "roast") {
      submitRoast({ code });
    } else {
      submitNarrate({ code });
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
            <div className={`flex-1 min-h-[200px] md:min-h-0 md:overflow-y-auto border rounded-md ${mode === "roast"
              ? "border-zinc-800 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500"
              : "border-zinc-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500"
              } bg-zinc-900/50 transition-colors duration-200`}>
              <CodeEditor
                value={code}
                onChange={setCode}
                mode={mode === "narrate" ? "diff" : "code"}
                placeholder={mode === "roast"
                  ? "Paste your code here, or drag & drop a file... The analysis will check for errors, memory leaks, scalability issues, and anti-patterns."
                  : "Paste your raw code or `git diff` here, or drag & drop a file to generate a professional Pull Request description."
                }
                disabled={loading}
                className="h-full border-none bg-transparent"
              />
            </div>
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
                  <span>{mode === "roast" ? "Roasting..." : "Narrating..."}</span>
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
              className="h-full flex items-center justify-center p-8"
            >
              <div className="text-zinc-500 font-mono animate-pulse">
                Thinking...
              </div>
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
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      if (mode === "roast") {
                        submitRoast(null);
                      } else {
                        submitNarrate(null);
                      }
                    }}
                    className="w-full bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 font-mono"
                  >
                    Dismiss
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Code Roast Output */}
            {mode === "roast" && tastingNote && (
              <div className="h-full overflow-y-auto">
                <TastingCard tastingNote={tastingNote as any} originalCode={code} />
              </div>
            )}

            {/* PR Narrator Output */}
            {mode === "narrate" && prDescription && (
              <div className="h-full overflow-y-auto">
                <NarratorCard description={prDescription as any} />
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
