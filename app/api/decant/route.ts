import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Rate limiting store (in-memory, consider Redis for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
};

// Request validation schema
const requestSchema = z.object({
  code: z
    .string()
    .min(10, "Code must be at least 10 characters")
    .max(50000, "Code must not exceed 50,000 characters"),
  persona: z.enum(["principal", "vc", "security", "clean"]).optional().default("principal"),
});

// Response schema for streamObject
const tastingNoteSchema = z.object({
  title: z.string().describe("A sarcastic, technical title for the code"),
  diagnosis: z.string().describe("Technical explanation of what is wrong or right"),
  fix: z.string().describe("Actionable improvement description"),
  refactoredCode: z.string().describe("The refactored code block"),
  language: z.string().describe("The programming language (e.g. javascript, python)"),
  level: z.string().describe("Estimated skill level of the author"),
  score: z.number().describe("Code quality rating from 0 to 100"),
});

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return (
    (forwarded?.split(",")[0]?.trim() || realIP || "unknown") as string
  );
}

// Rate limiting middleware
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

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT.windowMs);

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  try {
    // Rate limiting
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, persona } = validationResult.data;

    const google = createGoogleGenerativeAI({
      apiKey: process.env.API_KEY,
    });

    let systemPrompt = "";
    switch (persona) {
      case "vc":
        systemPrompt = `You are a **Venture Capitalist / Founder**.
Tone: Buzzword-heavy, obsessed with scale, AI, and valuation. 
Task: Analyze if this code is "investible" or "scalable". Ignore low-level details, focus on "The Vision".
Critique lack of AI, blockchain, or viral loops.`;
        break;
      case "security":
        systemPrompt = `You are a **Paranoid Security Researcher**.
Tone: Alarming, suspicious, serious.
Task: Audit this code ONLY for security vulnerabilities (XSS, Injection, PII leaks).
Assume everything is a potential exploit vector.`;
        break;
      case "clean":
        systemPrompt = `You are a **Clean Code Zealot**.
Tone: Nitpicky, pedantic, obsessed with formatting and naming.
Task: Analyze variable names, indentation, function length, and adherence to SOLID principles.`;
        break;
      case "principal":
      default:
        systemPrompt = `You are a **Top 1% Principal Software Engineer**.
Tone: Blunt, brutally honest, sarcastic, technically precise.
Task: Analyze the provided code for complexity, security, and scalability.`;
        break;
    }

    // Stream the object
    const result = streamObject({
      model: google("gemini-2.5-flash-preview-09-2025"),
      schema: tastingNoteSchema,
      prompt: `${systemPrompt}

Code to Review:
\`\`\`
${code}
\`\`\`

Generate a JSON object with:
- title: Sarcastic/Thematic title
- diagnosis: Analysis based on your persona (2-3 sentences)
- fix: Actionable improvement description
- refactoredCode: The fixed version of the code (just the code)
- language: The programming language detected (lowercase slug)
- level: Estimated skill level
- score: 0-100 rating
`,
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error("Error decanting code:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}