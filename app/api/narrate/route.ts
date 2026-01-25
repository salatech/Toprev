import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Octokit } from "octokit";

// Rate limiting (simplified for brevity, share logic in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = { maxRequests: 10, windowMs: 60 * 1000 };

const requestSchema = z.object({
    code: z.string().min(10).max(50000),
    context: z.string().optional(),
});

const prDescriptionSchema = z.object({
    title: z.string().describe("Conventional commit title"),
    summary: z.string().describe("Executive summary of changes"),
    type: z.enum(["feat", "fix", "chore", "refactor", "docs", "style", "test", "perf"]).describe("Type of change"),
    changes: z.array(z.string()).describe("List of specific changes"),
    impact: z.string().describe("Analysis of risk and impact"),
    testing: z.string().describe("Steps to verify the changes"),
});

function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    return ((forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown") as string);
}

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
        return true;
    }
    if (record.count >= RATE_LIMIT.maxRequests) return false;
    record.count++;
    return true;
}

export async function POST(request: NextRequest) {
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    try {
        const body = await request.json();
        let { code, context } = requestSchema.parse(body);

        // Check if input is a GitHub PR URL
        if (code.startsWith("https://github.com/") && code.includes("/pull/")) {
            try {
                const urlParts = code.split("/");
                const owner = urlParts[3];
                const repo = urlParts[4];
                const pullNumber = parseInt(urlParts[6]);

                if (owner && repo && pullNumber) {
                    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
                    const { data: files } = await octokit.rest.pulls.listFiles({
                        owner,
                        repo,
                        pull_number: pullNumber,
                    });

                    let prContent = `GitHub PR: ${owner}/${repo} #${pullNumber}\n\n`;
                    for (const file of files) {
                        if (file.status === "removed") continue;
                        prContent += `File: ${file.filename} (${file.status})\n\`\`\`${file.filename.split('.').pop()}\n${file.patch || "No patch available"}\n\`\`\`\n\n`;
                    }

                    code = prContent.slice(0, 48000);
                    if (prContent.length > 48000) code += "\n... (truncated)";
                }
            } catch (err) {
                console.error("Failed to fetch GitHub PR:", err);
            }
        }

        console.log("Narrate: Body parsed");

        if (!process.env.API_KEY) {
            console.error("Narrate: Missing API_KEY");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const google = createGoogleGenerativeAI({
            apiKey: process.env.API_KEY,
        });

        console.log("Narrate: Provider created");

        const result = streamObject({
            model: google("gemini-2.5-flash-preview-09-2025"),
            schema: prDescriptionSchema,
            prompt: `You are an expert Tech Lead.
Analyze the code/diff and generate a professional PR description.

Context: ${context || "None"}

Code:
\`\`\`
${code}
\`\`\`
`,
            onFinish: ({ usage, object, error }) => {
                if (error) {
                    console.error("Narrate: Stream error", error);
                } else {
                    console.log("Narrate: Stream finished", usage);
                }
            }
        });

        console.log("Narrate: Stream object created, returning response");

        return result.toTextStreamResponse();

    } catch (error) {
        console.error("Narrate Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
