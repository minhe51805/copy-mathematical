import { createCorsPreflightResponse, getCorsHeaders } from "@/lib/cors";
import { normalizeExportDrafts } from "@/lib/export-drafts";
import { generateGeminiText, shouldUseGeminiNative } from "@/lib/gemini";
import { sanitizeAssistantContent } from "@/lib/math-utils";
import { getOpenAI } from "@/lib/openai";
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

    if (typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Missing content to export" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in .env.local" },
        { status: 500, headers: corsHeaders }
      );
    }

    const raw = shouldUseGeminiNative()
      ? await generateGeminiText({
          systemInstruction: getExportSystemPrompt(),
          prompt: getExportUserPrompt(content, request),
          temperature: 0.35,
          json: true,
        })
      : await generateOpenAIExportText(content, request);

    const parsed = parseJson(raw);
    const variants = normalizeExportDrafts(parsed.variants ?? [], sanitizeAssistantContent(content), request);

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

async function generateOpenAIExportText(content: string, request?: string) {
  const openai = getOpenAI();
  const model = process.env.OPENAI_MODEL || "gpt-4o";
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content: getExportSystemPrompt(),
      },
      {
        role: "user",
        content: getExportUserPrompt(content, request),
      },
    ],
  });

  return completion.choices[0]?.message?.content ?? "";
}

function getExportSystemPrompt() {
  return [
    "Bạn tạo 3 phiên bản nội dung để người dùng chọn xuất ra Word.",
    "Chỉ trả JSON hợp lệ, không markdown fence, không giải thích ngoài JSON.",
    "Schema: {\"variants\":[{\"id\":\"ai-1\",\"title\":\"...\",\"description\":\"...\",\"filename\":\"...docx\",\"content\":\"markdown...\"}]}",
    "Nội dung phải dùng Markdown GitHub, giữ công thức LaTeX bằng $...$ hoặc $$...$$.",
    "3 phiên bản nên khác nhau rõ: bản tài liệu hoàn chỉnh, bản chi tiết/giảng giải, bản handout/ôn tập.",
    "Không làm sai ý toán học của nội dung gốc.",
  ].join("\n");
}

function getExportUserPrompt(content: string, request?: string) {
  return [
    request ? `Yêu cầu xuất file của người dùng:\n${request}` : "",
    "Nội dung gốc cần xuất:",
    content,
  ].filter(Boolean).join("\n\n");
}

function parseJson(value: string): ExportVariantResponse {
  const cleaned = value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const jsonText = start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned;

  return JSON.parse(jsonText) as ExportVariantResponse;
}
