import { createCorsPreflightResponse, getCorsHeaders } from "@/lib/cors";
import { getOpenAI } from "@/lib/openai";
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions";

interface RecognizeFormulaRequest {
  imageDataUrl?: string;
}

interface RecognitionDebug {
  provider: "gemini" | "openai-compatible" | "missing";
  hasFormulaGeminiKey: boolean;
  hasGeminiKey: boolean;
  hasOpenAIKey: boolean;
  openAIBaseUrlHost: string | null;
  openAIModel: string | null;
  formulaRecognitionModel: string;
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
  const debug = getRecognitionDebug();

  try {
    const { imageDataUrl } = await req.json() as RecognizeFormulaRequest;

    if (!isValidImageDataUrl(imageDataUrl)) {
      return NextResponse.json(
        { error: "Missing or invalid imageDataUrl" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!getFormulaGeminiApiKey() && !process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json(
        {
          latex: "",
          error: "Backend nhận dạng chưa có API key. Hãy set FORMULA_GEMINI_API_KEY trên backend đang được NEXT_PUBLIC_API_BASE_URL trỏ tới, rồi redeploy backend.",
          debug,
        },
        { headers: corsHeaders }
      );
    }

    if (!getFormulaGeminiApiKey() && !isOpenAIProviderLikelyVisionCapable()) {
      return NextResponse.json(
        {
          latex: "",
          error: buildMissingVisionProviderMessage(),
          debug,
        },
        { headers: corsHeaders }
      );
    }

    let rawLatex = "";
    try {
      rawLatex = shouldUseGeminiForFormulaRecognition()
        ? await recognizeWithGemini(imageDataUrl)
        : await recognizeWithOpenAI(imageDataUrl);
    } catch (error) {
      console.error("Formula recognition provider error:", error);
      return NextResponse.json(
        {
          latex: "",
          error: getRecognitionErrorMessage(error),
          debug,
        },
        { headers: corsHeaders }
      );
    }

    const latex = cleanupLatex(rawLatex);

    return NextResponse.json(
      {
        latex,
        warning: !latex && looksLikeModelDidNotReadImage(rawLatex)
          ? "Model hiện tại có thể chưa hỗ trợ đọc ảnh. Hãy dùng FORMULA_GEMINI_API_KEY hoặc model vision như gpt-4o/gemini."
          : undefined,
        debug,
      },
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
  const apiKey = getFormulaGeminiApiKey();
  if (!apiKey) {
    throw new Error("FORMULA_GEMINI_API_KEY or GEMINI_API_KEY environment variable is not set");
  }

  const parsed = parseImageDataUrl(imageDataUrl);
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: getFormulaRecognitionModel(),
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
  let cleaned = value
    .trim()
    .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "")
    .replace(/<thinking>[\s\S]*?(?:<\/thinking>|$)/gi, "")
    .replace(/^```(?:latex|tex)?\s*/i, "")
    .replace(/```$/i, "")
    .replace(/^\s*(?:latex|tex)\s*:\s*/i, "")
    .replace(/^\$\$?/, "")
    .replace(/\$\$?$/, "")
    .trim();

  const boxedMatch = cleaned.match(/\\boxed\{([\s\S]+)\}/);
  if (boxedMatch?.[1]) {
    cleaned = boxedMatch[1].trim();
  }

  if (!/[\\^_=+\-*/()[\]{}0-9a-zA-Z\u2200-\u22ff]/.test(cleaned)) {
    return "";
  }

  return cleaned;
}

function looksLikeModelDidNotReadImage(value: string) {
  return /no image|không có ảnh|khong co anh|haven't provided|hasn't actually provided|unreadable|blank/i
    .test(value);
}

function getRecognitionErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (/API key|api key/i.test(message)) {
    return "Backend chưa có API key cho nhận dạng công thức.";
  }

  if (/vision|image|multimodal|unsupported|model/i.test(message)) {
    return "Model hiện tại không hỗ trợ đọc ảnh. Hãy dùng FORMULA_GEMINI_API_KEY hoặc model vision.";
  }

  if (/404/.test(message)) {
    return "Endpoint/model nhận dạng không tồn tại trên backend hiện tại.";
  }

  return message || "Không nhận dạng được công thức.";
}

function shouldUseGeminiForFormulaRecognition() {
  return Boolean(getFormulaGeminiApiKey());
}

function getFormulaGeminiApiKey() {
  return process.env.FORMULA_GEMINI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
}

function getFormulaRecognitionModel() {
  return process.env.FORMULA_RECOGNITION_MODEL?.trim() || process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

function getRecognitionDebug(): RecognitionDebug {
  return {
    provider: getFormulaGeminiApiKey()
      ? "gemini"
      : process.env.OPENAI_API_KEY?.trim()
        ? "openai-compatible"
        : "missing",
    hasFormulaGeminiKey: Boolean(process.env.FORMULA_GEMINI_API_KEY?.trim()),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY?.trim()),
    openAIBaseUrlHost: getOpenAIBaseUrlHost(),
    openAIModel: process.env.OPENAI_MODEL?.trim() || null,
    formulaRecognitionModel: getFormulaRecognitionModel(),
  };
}

function getOpenAIBaseUrlHost() {
  const value = process.env.OPENAI_BASE_URL?.trim();
  if (!value) return "api.openai.com";

  try {
    return new URL(value).host;
  } catch {
    return value;
  }
}

function isOpenAIProviderLikelyVisionCapable() {
  const model = process.env.OPENAI_MODEL?.trim().toLowerCase() ?? "";
  const baseUrl = process.env.OPENAI_BASE_URL?.trim().toLowerCase() ?? "";

  if (/minimax|deepseek|text|m2\.7|m1|kimi|qwen|llama/.test(`${baseUrl} ${model}`)) {
    return false;
  }

  return /gpt-4o|gpt-4\.1|gpt-5|o3|o4|vision|gemini|claude|pixtral|llava/.test(model);
}

function buildMissingVisionProviderMessage() {
  const debug = getRecognitionDebug();
  const model = debug.openAIModel ?? "OPENAI_MODEL chưa đặt";
  const host = debug.openAIBaseUrlHost ?? "OPENAI_BASE_URL chưa đặt";

  return [
    "Backend nhận dạng chưa thấy FORMULA_GEMINI_API_KEY.",
    `Hiện nó chỉ thấy provider chat ${host} / ${model}, model này không đọc ảnh nên Math Studio không thể nhận dạng nét vẽ.`,
    "Nếu bạn đã thêm key rồi, hãy redeploy backend/Vercel và kiểm tra NEXT_PUBLIC_API_BASE_URL đang trỏ đúng backend mới nhất.",
  ].join(" ");
}
