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
import "prismjs/themes/prism-tomorrow.css"; // Dark theme

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    mode?: "code" | "diff"; // Suggestion for syntax highlighting preference
}

export function CodeEditor({
    value,
    onChange,
    placeholder,
    disabled,
    className,
    mode = "code",
}: CodeEditorProps) {
    const highlightCode = (code: string) => {
        if (mode === "diff") {
            // Try to handle diff highlighting if possible, fallback to plain text or general code
            // Prism diff requires extra setup usually, treating as generalized code for robustness fallback
            // but we imported prism-diff so let's try it.
            try {
                return highlight(code, languages.diff || languages.bash, "diff");
            } catch (e) {
                return highlight(code, languages.js, "javascript"); // Fallback
            }
        }

        return highlight(code, languages.js, "javascript");
    };

    return (
        <div
            className={`relative font-mono text-sm border rounded-md overflow-hidden bg-zinc-950 ${disabled ? "opacity-50 cursor-not-allowed" : ""
                } ${className}`}
            style={{
                // Custom scrollbar styling could go here or in global css
            }}
        >
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
