"use client";

import React from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-diff";
import "prismjs/components/prism-python";
import "prismjs/themes/prism-tomorrow.css"; // Dark theme

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    mode?: "code" | "diff"; // Suggestion for syntax highlighting preference
    language?: string;
}

export function CodeEditor({
    value,
    onChange,
    placeholder,
    disabled,
    className,
    mode = "code",
    language,
}: CodeEditorProps) {
    const highlightCode = (code: string) => {
        if (mode === "diff") {
            try {
                return highlight(code, languages.diff || languages.bash, "diff");
            } catch (e) {
                return highlight(code, languages.js, "javascript"); // Fallback
            }
        }

        if (language) {
            const langMap: Record<string, any> = {
                "javascript": languages.js,
                "typescript": languages.ts || languages.js,
                "js": languages.js,
                "ts": languages.ts || languages.js,
                "css": languages.css,
                "json": languages.json,
                "python": languages.python,
                "bash": languages.bash,
                "markdown": languages.markdown,
                // Add more as needed
            };
            const prismLang = langMap[language.toLowerCase()];
            if (prismLang) {
                return highlight(code, prismLang, language);
            }
        }

        return highlight(code, languages.js, "javascript");
    };

    const [isDragging, setIsDragging] = React.useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result && typeof event.target.result === 'string') {
                    onChange(event.target.result);
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <div
            className={`relative font-mono text-sm border rounded-md bg-zinc-950 flex flex-col ${disabled ? "opacity-50 cursor-not-allowed" : ""
                } ${isDragging ? "border-indigo-500 bg-indigo-950/20" : ""} ${className}`}
            style={{
                // Custom scrollbar styling could go here or in global css
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Editor Chrome / Tab Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 bg-zinc-900/40 rounded-t-md flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 mr-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                    <div className="text-xs text-zinc-500 font-medium font-sans">
                        {gameModeDisplay(mode, language)}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto relative">
                <Editor
                    value={value}
                    onValueChange={onChange}
                    highlight={highlightCode}
                    padding={16}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="min-h-[200px] font-mono"
                    textareaClassName="focus:outline-none"
                    style={{
                        fontFamily: '"Geist Mono", monospace',
                        fontSize: 14,
                        backgroundColor: "transparent",
                        minHeight: "100%",
                    }}
                />
            </div>
            <style jsx global>{`
        /* Overriding Prism tomorrow theme background to match our app */
        code[class*="language-"],
        pre[class*="language-"] {
          text-shadow: none !important;
          background: transparent !important;
        }
        
        /* Placeholder styling hack for react-simple-code-editor */
        textarea::placeholder {
          color: #71717a !important; /* zinc-500 */
          opacity: 1;
        }
      `}</style>
        </div>
    );
}

// Helper for title
function gameModeDisplay(mode: string, language?: string) {
    if (mode === 'diff') return 'changes.diff';
    const lang = language?.toLowerCase() || 'text';
    const ext = lang === 'javascript' ? 'js' :
        lang === 'typescript' ? 'ts' :
            lang === 'python' ? 'py' :
                lang === 'markdown' ? 'md' :
                    'txt';
    return `untitled.${ext}`;
}
