"use client";

import { motion } from "framer-motion";
import { Copy, Check, Download, GitPullRequest } from "lucide-react";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PRDescription {
    title: string;
    summary: string;
    type: "feat" | "fix" | "chore" | "refactor" | "docs" | "style" | "test" | "perf";
    changes: string[];
    impact: string;
    testing: string;
}

interface NarratorCardProps {
    description: PRDescription;
}

const getTypeColor = (type: string) => {
    switch (type) {
        case "feat":
            return "bg-emerald-600/20 text-emerald-400 border-emerald-600";
        case "fix":
            return "bg-red-600/20 text-red-400 border-red-600";
        case "chore":
            return "bg-zinc-600/20 text-zinc-400 border-zinc-600";
        case "refactor":
            return "bg-blue-600/20 text-blue-400 border-blue-600";
        case "perf":
            return "bg-purple-600/20 text-purple-400 border-purple-600";
        default:
            return "bg-amber-600/20 text-amber-400 border-amber-600";
    }
};

export function NarratorCard({ description }: NarratorCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopy = () => {
        const markdown = `## ${description.title}

### Summary
${description.summary}

### Type
- [x] ${description.type}

### Changes
${description.changes.map(change => `- ${change}`).join('\n')}

### Impact
${description.impact}

### Testing
${description.testing}
`;

        navigator.clipboard.writeText(markdown);
        setCopied(true);
        toast({
            title: "Copied to clipboard",
            description: "PR description is ready to paste into GitHub/GitLab",
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = async () => {
        if (!cardRef.current || !contentRef.current) return;

        const originalOverflow = cardRef.current.style.overflow;
        const originalHeight = cardRef.current.style.height;
        const originalContentOverflow = contentRef.current.style.overflow;

        try {
            cardRef.current.style.overflow = "visible";
            cardRef.current.style.height = "auto";
            contentRef.current.style.overflow = "visible";

            await new Promise((resolve) => setTimeout(resolve, 100));

            const dataUrl = await toPng(cardRef.current, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: "#09090b",
            });

            const link = document.createElement("a");
            link.download = `pr-description-${description.title.replace(/\s+/g, "-").toLowerCase()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Failed to download image:", error);
            toast({
                title: "Download Failed",
                description: "Could not generate image.",
                variant: "destructive",
            });
        } finally {
            cardRef.current.style.overflow = originalOverflow;
            cardRef.current.style.height = originalHeight;
            contentRef.current.style.overflow = originalContentOverflow;
        }
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
                className="relative border-indigo-900/50 bg-zinc-950/95 backdrop-blur-sm h-full flex flex-col overflow-hidden shadow-xl shadow-indigo-900/10"
            >
                <CardHeader className="space-y-4 border-b border-indigo-900/30 pb-4 flex-shrink-0 bg-indigo-950/10">
                    <div className="flex items-start justify-between pr-16">
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <GitPullRequest className="w-5 h-5 text-indigo-400" />
                                <CardTitle className="font-sans text-xl text-indigo-100 font-medium">
                                    {description.title}
                                </CardTitle>
                            </div>
                            <Badge className={`${getTypeColor(description.type)} font-mono text-xs uppercase tracking-wider`}>
                                {description.type}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>

                <CardContent ref={contentRef} className="pt-6 flex-1 overflow-y-auto space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold text-indigo-300 mb-2 uppercase tracking-wide">Summary</h3>
                        <p className="text-zinc-300 leading-relaxed text-sm">{description.summary}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-indigo-300 mb-2 uppercase tracking-wide">Key Changes</h3>
                        <ul className="space-y-2">
                            {(description.changes || [])?.map((change, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                                    <span className="text-indigo-500 mt-1">•</span>
                                    <span>{change}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-zinc-900/30 p-4 rounded-lg border border-indigo-900/20">
                            <h3 className="text-sm font-semibold text-indigo-300 mb-2 uppercase tracking-wide">Impact</h3>
                            <p className="text-zinc-400 text-sm">{description.impact}</p>
                        </div>
                        <div className="bg-zinc-900/30 p-4 rounded-lg border border-indigo-900/20">
                            <h3 className="text-sm font-semibold text-indigo-300 mb-2 uppercase tracking-wide">Testing Steps</h3>
                            <p className="text-zinc-400 text-sm">{description.testing}</p>
                        </div>
                    </div>
                </CardContent>

                <div className="absolute right-4 top-4 flex gap-2">
                    <Button
                        onClick={() => {
                            const text = `Just generated a PR description for "${description.title}" using TopRev AI Narrator ⚡ #DeveloperTools`;
                            const url = "https://toprev.vercel.app";
                            window.open(
                                `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                                "_blank"
                            );
                        }}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors"
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
                        onClick={handleCopy}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors"
                        title="Copy Markdown"
                    >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                        onClick={handleDownload}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors"
                        title="Download Image"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
}
