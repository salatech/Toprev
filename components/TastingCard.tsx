"use client";

import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { useRef } from "react";
import type { ReactElement } from "react";
import { toPng } from "html-to-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  level: string;
  score: number;
}

interface TastingCardProps {
  tastingNote: TastingNote;
}

export function TastingCard({ tastingNote }: TastingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fixContainerRef = useRef<HTMLDivElement>(null);
  const cardContentRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current || !fixContainerRef.current || !cardContentRef.current) return;

    // Store original styles
    const originalCardOverflow = cardRef.current.style.overflow;
    const originalCardHeight = cardRef.current.style.height;
    const originalContentOverflow = cardContentRef.current.style.overflow;
    const originalFixMaxHeight = fixContainerRef.current.style.maxHeight;
    const originalFixOverflow = fixContainerRef.current.style.overflow;

    try {
      // Temporarily remove constraints to show full content
      cardRef.current.style.overflow = "visible";
      cardRef.current.style.height = "auto";
      cardContentRef.current.style.overflow = "visible";
      fixContainerRef.current.style.maxHeight = "none";
      fixContainerRef.current.style.overflow = "visible";

      // Wait for layout to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#09090b",
        style: {
          transform: "scale(1)",
        },
      });

      const link = document.createElement("a");
      link.download = `tasting-note-${tastingNote.title.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to download image:", error);
    } finally {
      // Restore original styles
      cardRef.current.style.overflow = originalCardOverflow;
      cardRef.current.style.height = originalCardHeight;
      cardContentRef.current.style.overflow = originalContentOverflow;
      fixContainerRef.current.style.maxHeight = originalFixMaxHeight;
      fixContainerRef.current.style.overflow = originalFixOverflow;
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
      className="w-full"
    >
      <Card
        ref={cardRef}
        className="relative border-amber-900/50 bg-zinc-950/95 backdrop-blur-sm h-full flex flex-col overflow-hidden"
      >
        <CardHeader className="space-y-4 border-b border-amber-900/30 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <CardTitle className="font-mono text-xl text-amber-500">
                {tastingNote.title}
              </CardTitle>
              <Badge className="bg-amber-900/30 text-amber-400 border-amber-700/50 font-mono text-xs">
                {tastingNote.level}
              </Badge>
            </div>
            <Badge
              className={`${getScoreColor(
                tastingNote.score
              )} border font-mono text-lg font-bold`}
            >
              {tastingNote.score}/100
            </Badge>
          </div>
        </CardHeader>
        <CardContent ref={cardContentRef} className="pt-4 flex-1 overflow-y-auto">
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
        </CardContent>
        <div className="absolute right-4 top-4">
          <Button
            onClick={handleDownload}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
            title="Share / Save Image"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

