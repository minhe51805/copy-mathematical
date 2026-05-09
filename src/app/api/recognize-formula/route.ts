import { createCorsPreflightResponse, getCorsHeaders } from "@/lib/cors";
import {
  generateAIText,
  getAIModel,
  getAIProviderDebug,
  getAIProviderLabel,
  getAIProviderSetupError,
  type AIContentPart,
} from "@/lib/openai";
import { NextRequest, NextResponse } from "next/server";

interface RecognizeFormulaRequest {
  imageDataUrl?: string;
}

interface RecognitionDebug {
  provider: "ai-gateway" | "missing";
  hasGatewayUrl: boolean;
  hasGatewayKey: boolean;
  baseUrlHost: string | null;
  generatePath?: string | null;
  model: string;
  formulaRecognitionModel: string;
  providerError?: string;
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
    const debug = getRecognitionDebug();

    if (!isValidImageDataUrl(imageDataUrl)) {
      return NextResponse.json(
        { error: "Missing or invalid imageDataUrl", debug },
        { status: 400, headers: corsHeaders }
      );
    }

    const setupError = getAIProviderSetupError();
    if (setupError) {
      return NextResponse.json(
        {
          latex: "",
          error: "Backend nhan dang chua cau hinh AI Gateway. Hay set AI_GATEWAY_PRIMARY_URL va AI_GATEWAY_PRIMARY_KEY roi redeploy backend.",
          debug: {
            ...debug,
            providerError: setupError,
          },
        },
        { headers: corsHeaders }
      );
    }

    let rawLatex = "";
    try {
      rawLatex = await recognizeWithGateway(imageDataUrl);
    } catch (error) {
      console.error("Formula recognition provider error:", error);
      const providerError = sanitizeProviderErrorMessage(error);

      return NextResponse.json(
        {
          latex: "",
          error: getRecognitionErrorMessage(error),
          debug: {
            ...getRecognitionDebug(),
            providerError,
          },
        },
        { headers: corsHeaders }
      );
    }

    const latex = cleanupLatex(rawLatex);

    return NextResponse.json(
      {
        latex,
        warning: !latex && looksLikeModelDidNotReadImage(rawLatex)
          ? "Model hien tai co the chua doc duoc anh. Hay dung model Gemini/vision tren AI Gateway."
          : undefined,
        debug: getRecognitionDebug(),
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

async function recognizeWithGateway(imageDataUrl: string) {
  const model = getAIModel("formula");
  const imagePart: AIContentPart = {
    type: "image_url",
    image_url: {
      url: imageDataUrl,
    },
  };

  return generateAIText({
    purpose: "formula",
    model,
    temperature: 0.05,
    maxOutputTokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
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
  return /no image|khong co anh|haven't provided|hasn't actually provided|unreadable|blank/i
    .test(value);
}

function getRecognitionErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (/API key|api key|401|403|unauthorized|forbidden/i.test(message)) {
    return "AI Gateway tu choi key. Hay kiem tra AI_GATEWAY_PRIMARY_KEY tren backend.";
  }

  if (/404|not found/i.test(message)) {
    return "Endpoint hoac model nhan dang khong ton tai tren AI Gateway. Hay kiem tra AI_GATEWAY_PRIMARY_URL va model dang dung.";
  }

  if (/vision|image|multimodal|unsupported|model/i.test(message)) {
    return "Model hien tai khong ho tro doc anh. Hay chon model Gemini/vision tren AI Gateway.";
  }

  return message || "Khong nhan dang duoc cong thuc.";
}

function sanitizeProviderErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[redacted-api-key]")
    .replace(/\b(?:sk|org)_[0-9A-Za-z_-]+/g, "[redacted-api-key]")
    .replace(/key=[0-9A-Za-z_-]+/gi, "key=[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 360);
}

function getRecognitionDebug(): RecognitionDebug {
  const providerDebug = getAIProviderDebug();

  return {
    provider: providerDebug.provider,
    hasGatewayUrl: providerDebug.hasGatewayUrl,
    hasGatewayKey: providerDebug.hasGatewayKey,
    baseUrlHost: providerDebug.baseUrlHost,
    generatePath: providerDebug.generatePath,
    model: getAIModel("chat"),
    formulaRecognitionModel: getAIModel("formula"),
  };
}

export function getRecognitionProviderLabelForDebug() {
  return getAIProviderLabel();
}
