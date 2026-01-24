import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Rate limiting store (in-memory)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = {
    maxRequests: 10,
    windowMs: 60 * 1000,
};

const requestSchema = z.object({
    code: z.string().min(10).max(50000),
    context: z.string().optional(),
});

const responseSchema = z.object({
    title: z.string(),
    summary: z.string(),
    type: z.enum(["feat", "fix", "chore", "refactor", "docs", "style", "test", "perf"]),
    changes: z.array(z.string()),
    impact: z.string(),
    testing: z.string(),
});

function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    return ((forwarded?.split(",")[0]?.trim() || realIP || "unknown") as string);
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
        return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 };
    }
    if (record.count >= RATE_LIMIT.maxRequests) {
        return { allowed: false, remaining: 0 };
    }
    record.count++;
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - record.count };
}

export async function POST(request: NextRequest) {
    const clientIP = getClientIP(request);

    try {
        const rateLimit = checkRateLimit(clientIP);
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        const body = await request.json();
        const validation = requestSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const { code, context } = validation.data;
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" },
        });

        const systemPrompt = `You are an expert Tech Lead and Technical Writer.
Your task is to analyze code changes (git diff or source code) and generate a **production-ready Pull Request Description**.

Tone: Professional, Clear, Concise.

OUTPUT FORMAT (JSON):
{
  "title": "Conventional Commit Title (e.g., feat: add user auth)",
  "summary": "High-level executive summary of what this PR does.",
  "type": "feat" | "fix" | "chore" | "refactor" | "docs" | "style" | "test" | "perf",
  "changes": ["List of specific changes (files, logic, UI)"],
  "impact": "Analysis of potential risks, breaking changes, or performance impact.",
  "testing": "Steps to manually verify the changes."
}

Use "feat" for new features, "fix" for bugs, "chore" for maintenance, "refactor" for code cleanup.
`;

        const userPrompt = `${systemPrompt}\n\nContext: ${context || "None"}\n\nCode/Diff:\n\`\`\`\n${code}\n\`\`\``;

        const result = await model.generateContent(userPrompt);
        const responseText = result.response.text();

        // Cleanup and parse
        let cleanedText = responseText.trim();
        if (cleanedText.startsWith("```json")) {
            cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (cleanedText.startsWith("```")) {
            cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        const parsed = JSON.parse(cleanedText);
        const validated = responseSchema.parse(parsed);

        return NextResponse.json(validated);

    } catch (error) {
        console.error("Narrator Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
