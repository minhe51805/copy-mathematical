import { getOpenAI } from "@/lib/openai";
import { createCorsPreflightResponse, getCorsHeaders } from "@/lib/cors";
import { normalizeExportDrafts } from "@/lib/export-drafts";
import { sanitizeAssistantContent } from "@/lib/math-utils";
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured. Please set OPENAI_API_KEY in .env.local" },
        { status: 500, headers: corsHeaders }
      );
    }

    const openai = getOpenAI();
    const model = process.env.OPENAI_MODEL || "gpt-4o";
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content: [
            "Bạn tạo 3 phiên bản nội dung để người dùng chọn xuất ra Word.",
            "Chỉ trả JSON hợp lệ, không markdown fence, không giải thích ngoài JSON.",
            "Schema: {\"variants\":[{\"id\":\"ai-1\",\"title\":\"...\",\"description\":\"...\",\"filename\":\"...docx\",\"content\":\"markdown...\"}]}",
            "Nội dung phải dùng Markdown GitHub, giữ công thức LaTeX bằng $...$ hoặc $$...$$.",
            "3 phiên bản nên khác nhau rõ: bản tài liệu hoàn chỉnh, bản chi tiết/giảng giải, bản handout/ôn tập.",
            "Không làm sai ý toán học của nội dung gốc.",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            request ? `Yêu cầu xuất file của người dùng:\n${request}` : "",
            "Nội dung gốc cần xuất:",
            content,
          ].filter(Boolean).join("\n\n"),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
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
