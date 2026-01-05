"use client";

import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { useRef } from "react";
import { toPng } from "html-to-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
              <p className="text-xs font-semibold text-amber-500 mb-2 font-mono uppercase">Diagnosis:</p>
              <p className="font-mono text-sm leading-relaxed text-zinc-300">
                {tastingNote.diagnosis}
              </p>
            </div>
            <div className="border-t border-amber-900/30 pt-4">
              <p className="text-xs font-semibold text-amber-500 mb-2 font-mono uppercase">Fix:</p>
              <div ref={fixContainerRef} className="max-h-[400px] overflow-y-auto pr-2">
                <p className="font-mono text-sm text-zinc-400 whitespace-pre-wrap break-words">
                  {tastingNote.fix}
                </p>
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

