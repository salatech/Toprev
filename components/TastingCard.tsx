"use client";

import { motion } from "framer-motion";
import { Download, Wand2, ArrowLeft, ArrowRightLeft, Copy, Check } from "lucide-react";
import { useRef, useState } from "react";
import type { ReactElement } from "react";
import { toPng } from "html-to-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/CodeEditor";

// Simple markdown formatter
const formatMarkdown = (text: string) => {
  if (!text) return text;

  // Split by lines to handle code blocks
  const lines = text.split('\n');
  const formatted: ReactElement[] = [];

  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  lines.forEach((line, index) => {
    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        formatted.push(
          <pre key={`code-${index}`} className="bg-zinc-900/50 p-3 rounded-md my-2 overflow-x-auto border border-zinc-800">
            <code className="font-mono text-xs text-zinc-300">
              {codeBlockContent.join('\n')}
            </code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Handle inline code and bold text
    let processedLine = line;
    const codeParts: (string | ReactElement)[] = [];
    let keyCounter = 0;

    // Process inline code first
    const codeMatches = Array.from(processedLine.matchAll(/`([^`]+)`/g));
    if (codeMatches.length > 0) {
      let lastIndex = 0;
      codeMatches.forEach((match) => {
        if (match.index !== undefined) {
          if (match.index > lastIndex) {
            codeParts.push(processedLine.substring(lastIndex, match.index));
          }
          codeParts.push(
            <code key={`inline-code-${keyCounter++}`} className="bg-zinc-900/50 px-1.5 py-0.5 rounded text-amber-400 font-mono text-xs border border-zinc-800">
              {match[1]}
            </code>
          );
          lastIndex = match.index + match[0].length;
        }
      });
      if (lastIndex < processedLine.length) {
        codeParts.push(processedLine.substring(lastIndex));
      }
    } else {
      codeParts.push(processedLine);
    }

    // Handle bold text
    const finalParts: (string | ReactElement)[] = [];
    codeParts.forEach((part, partIndex) => {
      if (typeof part === 'string') {
        const boldMatches = Array.from(part.matchAll(/\*\*([^*]+)\*\*/g));
        if (boldMatches.length > 0) {
          let partLastIndex = 0;
          let boldKeyCounter = 0;
          boldMatches.forEach((boldMatch) => {
            if (boldMatch.index !== undefined) {
              if (boldMatch.index > partLastIndex) {
                finalParts.push(part.substring(partLastIndex, boldMatch.index));
              }
              finalParts.push(
                <strong key={`bold-${partIndex}-${boldKeyCounter++}`} className="text-amber-400 font-semibold">
                  {boldMatch[1]}
                </strong>
              );
              partLastIndex = boldMatch.index + boldMatch[0].length;
            }
          });
          if (partLastIndex < part.length) {
            finalParts.push(part.substring(partLastIndex));
          }
        } else {
          finalParts.push(part);
        }
      } else {
        finalParts.push(part);
      }
    });

    if (finalParts.length > 0 || processedLine.trim() === '') {
      formatted.push(
        <p key={`line-${index}`} className="mb-2 last:mb-0">
          {finalParts.length > 0 ? finalParts : '\u00A0'}
        </p>
      );
    }
  });

  // Handle any remaining code block
  if (inCodeBlock && codeBlockContent.length > 0) {
    formatted.push(
      <pre key="code-final" className="bg-zinc-900/50 p-3 rounded-md my-2 overflow-x-auto border border-zinc-800">
        <code className="font-mono text-xs text-zinc-300">
          {codeBlockContent.join('\n')}
        </code>
      </pre>
    );
  }

  return formatted.length > 0 ? formatted : <p>{text}</p>;
};

interface TastingNote {
  title: string;
  diagnosis: string;
  fix: string;
  refactoredCode?: string;
  language?: string;
  level: string;
  score: number;
}

interface TastingCardProps {
  tastingNote: TastingNote;
  originalCode?: string;
}

export function TastingCard({ tastingNote, originalCode }: TastingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fixContainerRef = useRef<HTMLDivElement>(null);
  const cardContentRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<'analysis' | 'diff'>('analysis');
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current || !cardContentRef.current) return;

    // Store original styles
    const originalCardOverflow = cardRef.current.style.overflow;
    const originalCardHeight = cardRef.current.style.height;
    const originalContentOverflow = cardContentRef.current.style.overflow;

    // Also handle fix container if in analysis mode
    const originalFixMaxHeight = fixContainerRef.current?.style.maxHeight;
    const originalFixOverflow = fixContainerRef.current?.style.overflow;

    try {
      // Temporarily remove constraints to show full content
      cardRef.current.style.overflow = "visible";
      cardRef.current.style.height = "auto";
      cardContentRef.current.style.overflow = "visible";

      if (fixContainerRef.current) {
        fixContainerRef.current.style.maxHeight = "none";
        fixContainerRef.current.style.overflow = "visible";
      }

      // Add Watermark Footer
      const watermark = document.createElement('div');
      watermark.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 1px solid rgba(120, 53, 15, 0.3); margin-top: 20px;">
          <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #f59e0b;">toprev.space</span>
          <span style="font-family: monospace; font-size: 12px; color: #71717a;">Code Review by Top 0.1% Engineer</span>
        </div>
      `;
      cardContentRef.current.appendChild(watermark);

      // Wait for layout to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3, // Higher resolution
        backgroundColor: "#09090b",
        style: {
          transform: "scale(1)",
        },
      });

      const link = document.createElement("a");
      link.download = `toprev-roast-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      // Remove watermark
      cardContentRef.current.removeChild(watermark);

    } catch (error) {
      console.error("Failed to download image:", error);
    } finally {
      // Restore original styles
      if (cardRef.current) {
        cardRef.current.style.overflow = originalCardOverflow;
        cardRef.current.style.height = originalCardHeight;
      }
      if (cardContentRef.current) {
        cardContentRef.current.style.overflow = originalContentOverflow;
      }

      if (fixContainerRef.current) {
        fixContainerRef.current.style.maxHeight = originalFixMaxHeight || '';
        fixContainerRef.current.style.overflow = originalFixOverflow || '';
        fixContainerRef.current.style.maxHeight = originalFixMaxHeight || '';
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-600/20 text-green-400 border-green-600";
    if (score >= 60) return "bg-yellow-600/20 text-yellow-400 border-yellow-600";
    if (score >= 40) return "bg-orange-600/20 text-orange-400 border-orange-600";
    return "bg-red-600/20 text-red-400 border-red-600";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full"
    >
      <Card
        ref={cardRef}
        className="relative border-amber-900/50 bg-zinc-950/95 backdrop-blur-sm h-full flex flex-col overflow-hidden"
      >
        <CardHeader className="space-y-4 border-b border-amber-900/30 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <CardTitle className="font-mono text-xl text-amber-500">
                {tastingNote.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-900/30 text-amber-400 border-amber-700/50 font-mono text-xs">
                  {tastingNote.level}
                </Badge>
                {tastingNote.refactoredCode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 text-xs font-mono gap-1 ${viewMode === 'diff' ? 'bg-amber-900/50 text-amber-400' : 'text-zinc-500 hover:text-amber-400'}`}
                    onClick={() => setViewMode(viewMode === 'analysis' ? 'diff' : 'analysis')}
                  >
                    {viewMode === 'analysis' ? (
                      <>
                        <Wand2 className="w-3 h-3" /> Fix It For Me
                      </>
                    ) : (
                      <>
                        <ArrowLeft className="w-3 h-3" /> Back to Analysis
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-1">
                <Button
                  onClick={() => {
                    const text = `My code just got roasted by TopRev. Scored ${tastingNote.score}/100.\n\n"${tastingNote.title}"\n\n💀 Fix yours at:`;
                    const url = "https://toprev.space";
                    window.open(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                      "_blank"
                    );
                  }}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                  title="Share on Twitter"
                >
                  <svg
                    className="h-4 w-4 fill-current"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zl-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                  title="Download Image"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <Badge
                className={`${getScoreColor(
                  tastingNote.score
                )} border font-mono text-lg font-bold`}
              >
                {tastingNote.score}/100
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent ref={cardContentRef} className="pt-4 flex-1 overflow-y-auto min-h-0">
          {viewMode === 'analysis' ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-amber-500 mb-2 font-mono uppercase">Technical Assessment:</p>
                <div className="font-mono text-sm leading-relaxed text-zinc-300">
                  {formatMarkdown(tastingNote.diagnosis)}
                </div>
              </div>
              <div className="border-t border-amber-900/30 pt-4">
                <p className="text-xs font-semibold text-amber-500 mb-2 font-mono uppercase">Fix:</p>
                <div ref={fixContainerRef} className="max-h-[400px] overflow-y-auto pr-2">
                  <div className="font-mono text-sm text-zinc-400 break-words">
                    {formatMarkdown(tastingNote.fix)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full gap-4">
              <div className="flex-1 flex flex-col min-h-0">
                <p className="text-xs font-semibold text-red-400 mb-2 font-mono uppercase flex items-center gap-2">
                  Original Code
                </p>
                <div className="flex-1 border border-zinc-800 rounded-md overflow-hidden bg-zinc-950/50 overflow-y-auto">
                  <CodeEditor
                    value={originalCode || ""}
                    onChange={() => { }}
                    disabled={true}
                    language={tastingNote.language}
                    className="h-full border-none bg-transparent opacity-80"
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-green-400 font-mono uppercase flex items-center gap-2">
                    Refactored Code
                  </p>
                  {tastingNote.refactoredCode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-zinc-500 hover:text-green-400 hover:bg-green-900/10"
                      onClick={() => {
                        navigator.clipboard.writeText(tastingNote.refactoredCode || "");
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      title="Copy Code"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  )}
                </div>
                <div className="flex-1 border border-green-900/30 rounded-md overflow-hidden bg-green-950/10 overflow-y-auto">
                  <CodeEditor
                    value={tastingNote.refactoredCode || ""}
                    onChange={() => { }}
                    disabled={true}
                    language={tastingNote.language}
                    className="h-full border-none bg-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>

      </Card>
    </motion.div>
  );
}
