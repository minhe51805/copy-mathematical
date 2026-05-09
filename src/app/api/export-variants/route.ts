import { createCorsPreflightResponse, getCorsHeaders } from "@/lib/cors";
import { normalizeExportDrafts } from "@/lib/export-drafts";
import { sanitizeAssistantContent } from "@/lib/math-utils";
import { generateAIText, getAIModel, getAIProviderSetupError } from "@/lib/openai";
import { NextRequest, NextResponse } from "next/server";

interface ExportVariantResponse {
  variants?: Array<{
    id?: string;
    title?: string;
    description?: string;
    filename?: string;
    content?: string;
  }>;
}

export function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req);
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  try {
    const { content, request } = await req.json();
    const sanitizedContent = typeof content === "string" ? sanitizeAssistantContent(content) : "";

    if (!sanitizedContent.trim()) {
      return NextResponse.json(
        { error: "Missing content to export" },
        { status: 400, headers: corsHeaders }
      );
    }

    const setupError = getAIProviderSetupError();
    if (setupError) {
      return NextResponse.json(
        {
          variants: createFallbackVariants(sanitizedContent, request),
          warning: `${setupError} Using fallback export variants.`,
        },
        { headers: corsHeaders }
      );
    }

    let raw = "";
    try {
      raw = await generateGatewayExportText(sanitizedContent, request);
    } catch (error) {
      console.error("Export variants AI generation failed:", error);
      return NextResponse.json(
        {
          variants: createFallbackVariants(sanitizedContent, request),
          warning: "AI export variant generation failed, using fallback variants.",
        },
        { headers: corsHeaders }
      );
    }

    const parsed = parseJson(raw);
    const variants = normalizeExportDrafts(parsed.variants ?? [], sanitizedContent, request);

    return NextResponse.json({ variants }, { headers: corsHeaders });
  } catch (error) {
    console.error("Export variants API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}

function createFallbackVariants(content: string, request?: string) {
  return normalizeExportDrafts([], content, request);
}

async function generateGatewayExportText(content: string, request?: string) {
  const model = getAIModel("export");

  return generateAIText({
    purpose: "export",
    model,
    temperature: 0.35,
    maxOutputTokens: 8192,
    system: getExportSystemPrompt(),
    messages: [
      {
        role: "user",
        content: getExportUserPrompt(content, request),
      },
    ],
  });
}

function getExportSystemPrompt() {
  return [
    "Create 3 Vietnamese export variants for the user to choose and export to Word.",
    "Return valid JSON only. Do not wrap it in markdown fences and do not add explanations outside JSON.",
    "Schema: {\"variants\":[{\"id\":\"ai-1\",\"title\":\"...\",\"description\":\"...\",\"filename\":\"...docx\",\"content\":\"markdown...\"}]}",
    "Use GitHub-flavored Markdown. Preserve LaTeX math as $...$ or $$...$$.",
    "Make the 3 variants clearly different: complete document, detailed explanation, study handout.",
    "Do not change the mathematical meaning of the source content.",
  ].join("\n");
}

function getExportUserPrompt(content: string, request?: string) {
  return [
    request ? `User export request:\n${request}` : "",
    "Source content to export:",
    content,
  ].filter(Boolean).join("\n\n");
}

function parseJson(value: string): ExportVariantResponse {
  try {
    const cleaned = value
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const jsonText = start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned;

    return JSON.parse(jsonText) as ExportVariantResponse;
  } catch (error) {
    console.error("Failed to parse export variants JSON:", error);
    return {};
  }
}
