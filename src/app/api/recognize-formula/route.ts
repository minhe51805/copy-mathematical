import { createCorsPreflightResponse, getCorsHeaders } from "@/lib/cors";
import { getGeminiModel, shouldUseGeminiNative } from "@/lib/gemini";
import { getOpenAI } from "@/lib/openai";
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions";

interface RecognizeFormulaRequest {
  imageDataUrl?: string;
}

const SYSTEM_PROMPT = [
  "You recognize handwritten mathematical expressions from a canvas image.",
  "Return only LaTeX for the expression, no markdown fences, no explanation.",
  "If the image is blank or unreadable, return an empty string.",
  "Use concise LaTeX suitable for KaTeX.",
].join("\n");

const USER_PROMPT = [
  "Read the handwritten math expression in this image.",
  "Return the best LaTeX transcription only.",
].join("\n");

export function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req);
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  try {
    const { imageDataUrl } = await req.json() as RecognizeFormulaRequest;

    if (!isValidImageDataUrl(imageDataUrl)) {
      return NextResponse.json(
        { error: "Missing or invalid imageDataUrl" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY." },
        { status: 500, headers: corsHeaders }
      );
    }

    const latex = shouldUseGeminiNative()
      ? await recognizeWithGemini(imageDataUrl)
      : await recognizeWithOpenAI(imageDataUrl);

    return NextResponse.json(
      { latex: cleanupLatex(latex) },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Formula recognition API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function recognizeWithGemini(imageDataUrl: string) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const parsed = parseImageDataUrl(imageDataUrl);
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: [
      {
        role: "user",
        parts: [
          { text: USER_PROMPT },
          {
            inlineData: {
              mimeType: parsed.mimeType,
              data: parsed.data,
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.05,
    },
  });

  return response.text ?? "";
}

async function recognizeWithOpenAI(imageDataUrl: string) {
  const openai = getOpenAI();
  const model = process.env.OPENAI_MODEL || "gpt-4o";
  const imagePart: ChatCompletionContentPart = {
    type: "image_url",
    image_url: {
      url: imageDataUrl,
    },
  };

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.05,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: USER_PROMPT,
          },
          imagePart,
        ],
      },
    ],
  });

  return completion.choices[0]?.message?.content ?? "";
}

function parseImageDataUrl(value: string) {
  const match = value.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) {
    throw new Error("Invalid image data URL");
  }

  return {
    mimeType: match[1],
    data: match[2],
  };
}

function isValidImageDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);
}

function cleanupLatex(value: string) {
  return value
    .trim()
    .replace(/^```(?:latex|tex)?\s*/i, "")
    .replace(/```$/i, "")
    .replace(/^\$\$?/, "")
    .replace(/\$\$?$/, "")
    .trim();
}
