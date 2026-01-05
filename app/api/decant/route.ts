import { GoogleGenerativeAI } from "@google/generative-ai";
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
// Note: We allow any code patterns since this is a code review tool.
// The AI will identify security issues, anti-patterns, and vulnerabilities.
const requestSchema = z.object({
  code: z
    .string()
    .min(10, "Code must be at least 10 characters")
    .max(50000, "Code must not exceed 50,000 characters"),
});

// Response validation schema
const responseSchema = z.object({
  title: z.string().min(1).max(300),
  diagnosis: z.string().min(1).max(3000),
  fix: z.string().min(1).max(2000), // Enforced 2000 character limit as per system prompt
  level: z.string().min(1).max(150),
  score: z.number().min(0).max(100).transform((val) => Math.round(val)), // Accept float, convert to int
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
  const startTime = Date.now();
  const clientIP = getClientIP(request);

  try {
    // Rate limiting
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": String(RATE_LIMIT.maxRequests),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // Check Content-Type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Invalid content type. Expected application/json" },
        { status: 400 }
      );
    }

    // Check Content-Length (prevent large payloads)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 100 * 1024) {
      // 100KB max
      return NextResponse.json(
        { error: "Request payload too large" },
        { status: 413 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate with Zod
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { code } = validationResult.data;

    // Check API key
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is not configured");
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    // Set timeout for AI request (30 seconds)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), 30000)
    );

    // Initialize AI model
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const systemPrompt = `You are a **Top 1% Principal Software Engineer** with deep expertise in computer science,
software engineering, architecture design, system design, performance optimization, and production-grade software.

You are blunt, brutally honest, and technically precise.
You consider bad code a personal insult.
You consider code that merely "works" without scalability, safety, or clarity to be unfinished.

However, your job is not just to judge — it is to TEACH.
When code is bad, you must explain WHY it is bad in a way a junior developer can understand,
without dumbing it down.

---

TASK:
Analyze the provided code for:
- Time & space complexity (Big O)
- Memory leaks
- Scalability bottlenecks
- Security vulnerabilities
- Architectural and design anti-patterns

---

OUTPUT FORMAT (STRICT):
Return a valid JSON object with EXACTLY these keys and no extra fields:

{
  "title": "",
  "diagnosis": "",
  "fix": "",
  "level": "",
  "score": 0
}

CRITICAL CONSTRAINT:
- The ENTIRE JSON output (when stringified) MUST NOT exceed 2100 characters total.
- Be concise in all fields. Prioritize clarity and essential information over verbosity.
- If your response would exceed 2000 characters, shorten all fields proportionally while maintaining the core message.

---

FIELD REQUIREMENTS:

"title":
- Short, sarcastic, and technical
- Examples:
  - "The O(n²) Disaster"
  - "Memory Leak Speedrun"
  - "Callback Hell Deluxe"
  - "The Race Condition Special"

"diagnosis":
- 2-3 sentences
- Explain technically WHY the code is good or bad
- Use precise engineering terms such as:
  Race Condition, Blocking I/O, Tight Coupling,
  Unbounded Memory Growth, Clean Separation of Concerns,
  Optimal Time Complexity, Proper Memoization

"fix":
- Suggest ONE specific, actionable improvement or refactor
- It MUST be beginner-friendly and explanatory
- Structure the explanation as:
  1. What is wrong
  2. Why it is a problem (performance, scalability, safety, or maintainability)
  3. How the fix solves the problem
- You MUST illustrate the fix using:
  - A short before/after code snippet OR
  - A clear conceptual example if code is not applicable
- Be concise - remember the entire JSON output must stay under 2000 characters total.

If the code is already excellent, suggest a minor optimization and explain why it matters.

"level":
- Estimate the author's skill level
- Examples:
  "Junior", "Mid-Level", "Senior", "Script Kiddie",
  "Actually Knows What They're Doing"

"score":
- Integer between 0 and 100
- Base the score on:
  correctness, performance, readability, scalability, and security

---

TONE RULES:
- You may be sarcastic, but never vague
- No insults without explanations
- If the code is good, acknowledge it — but still push for improvement

The goal:
The developer should feel roasted AND smarter.`;

    const prompt = `${systemPrompt}\n\nReview this code:\n\`\`\`\n${code}\n\`\`\``;

    // Make AI request with timeout
    const aiRequest = model.generateContent(prompt);
    const result = await Promise.race([aiRequest, timeoutPromise]) as Awaited<ReturnType<typeof model.generateContent>>;
    const response = result.response;
    const text = response.text();

    // Parse and validate AI response
    let tastingNote;
    try {
      // Clean the text - remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      
      const parsed = JSON.parse(cleanedText);
      
      // Check total JSON string length (must be <= 2100 characters)
      const jsonString = JSON.stringify(parsed);
      if (jsonString.length > 2100) {
        console.error("Response exceeds 2100 character limit:", jsonString.length);
        if (process.env.NODE_ENV === "development") {
          return NextResponse.json(
            { 
              error: "Response exceeds 2100 character limit",
              actualLength: jsonString.length,
              received: parsed
            },
            { status: 500 }
          );
        }
        return NextResponse.json(
          { error: "Invalid response from analysis service" },
          { status: 500 }
        );
      }
      
      const responseValidation = responseSchema.safeParse(parsed);
      
      if (!responseValidation.success) {
        console.error("Invalid AI response format:");
        console.error("Raw response:", text.substring(0, 500));
        console.error("Parsed:", JSON.stringify(parsed, null, 2));
        console.error("Validation errors:", responseValidation.error.issues);
        
        // In development, return more details
        if (process.env.NODE_ENV === "development") {
          return NextResponse.json(
            { 
              error: "Invalid response from analysis service",
              details: responseValidation.error.issues,
              received: parsed
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          { error: "Invalid response from analysis service" },
          { status: 500 }
        );
      }
      
      tastingNote = responseValidation.data;
    } catch (parseError) {
      // Try to extract JSON from response (AI might wrap it in markdown or add extra text)
      let cleanedText = text.trim();
      
      // Remove markdown code blocks
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      
      // Try to find JSON object
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Check total JSON string length (must be <= 2100 characters)
          const jsonString = JSON.stringify(parsed);
          if (jsonString.length > 2100) {
            console.error("Response exceeds 2100 character limit:", jsonString.length);
            throw new Error("Response exceeds 2100 character limit");
          }
          
          const responseValidation = responseSchema.safeParse(parsed);
          if (responseValidation.success) {
            tastingNote = responseValidation.data;
          } else {
            console.error("JSON extraction validation failed:", responseValidation.error.issues);
            console.error("Extracted JSON:", JSON.stringify(parsed, null, 2));
            throw new Error("Invalid response format after extraction");
          }
        } catch (extractError) {
          console.error("Failed to parse extracted JSON:", extractError);
          console.error("Raw text (first 1000 chars):", text.substring(0, 1000));
          throw new Error("Failed to parse response");
        }
      } else {
        console.error("No JSON found in response. Raw text (first 1000 chars):", text.substring(0, 1000));
        throw new Error("No valid JSON found in response");
      }
    }

    // Log request (without sensitive data)
    const duration = Date.now() - startTime;
    console.log(`[${clientIP}] Request completed in ${duration}ms`);

    return NextResponse.json(tastingNote, {
      headers: {
        "X-RateLimit-Limit": String(RATE_LIMIT.maxRequests),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${clientIP}] Error after ${duration}ms:`, error);

    // Don't leak sensitive information
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Only log full error in development
    if (process.env.NODE_ENV === "development") {
      console.error("Full error details:", error);
    }

    // Return generic error message
    return NextResponse.json(
      {
        error: "An error occurred while processing your request",
        ...(process.env.NODE_ENV === "development" && {
          message: errorMessage,
        }),
      },
      {
        status: 500,
        headers: {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
        },
      }
    );
  }
}

// Only allow POST method
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}