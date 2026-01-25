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

    return (
        <div
            className={`relative font-mono text-sm border rounded-md overflow-auto bg-zinc-950 ${disabled ? "opacity-50 cursor-not-allowed" : ""
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
