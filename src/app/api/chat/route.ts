import { getOpenAI } from "@/lib/openai";
import { buildMessageTextWithAttachments } from "@/lib/attachment-content";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { createCorsPreflightResponse, getCorsHeaders } from "@/lib/cors";
import { createGeminiStream, shouldUseGeminiNative } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";
import type {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

interface IncomingAttachment {
  id?: string;
  name?: string;
  mimeType?: string;
  kind?: string;
  dataUrl?: string;
  extractedText?: string;
  textLength?: number;
  truncated?: boolean;
  pageCount?: number;
  sheetCount?: number;
  size?: number;
}

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
  attachments?: IncomingAttachment[];
}

export function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req);
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  try {
    const { messages } = await req.json() as { messages?: IncomingMessage[] };
    const chatMessages = Array.isArray(messages) ? messages : [];

    if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in .env.local" },
        { status: 500, headers: corsHeaders }
      );
    }

    const stream = shouldUseGeminiNative()
      ? await createGeminiStream(chatMessages, SYSTEM_PROMPT)
      : await createOpenAIStream(chatMessages);

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = getStreamChunkText(chunk);
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function createOpenAIStream(messages: IncomingMessage[]) {
  const openai = getOpenAI();
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  console.log("Using OpenAI-compatible model:", model);
  console.log("Base URL:", process.env.OPENAI_BASE_URL || "default");

  return openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map(toChatCompletionMessage),
    ],
    stream: true,
    temperature: 0.7,
  });
}

function getStreamChunkText(chunk: unknown): string {
  if (isGeminiChunk(chunk)) {
    return chunk.text ?? "";
  }

  if (isOpenAIChunk(chunk)) {
    return chunk.choices[0]?.delta?.content ?? "";
  }

  return "";
}

function isGeminiChunk(chunk: unknown): chunk is { text?: string } {
  return Boolean(chunk && typeof chunk === "object" && "text" in chunk);
}

function isOpenAIChunk(chunk: unknown): chunk is { choices: Array<{ delta?: { content?: string | null } }> } {
  return Boolean(chunk && typeof chunk === "object" && "choices" in chunk);
}

function toChatCompletionMessage(message: IncomingMessage): ChatCompletionMessageParam {
  const text = buildMessageTextWithAttachments(message.content, message.attachments);
  const imageParts = (message.attachments ?? [])
    .filter((attachment) => isValidImageDataUrl(attachment.dataUrl))
    .map((attachment): ChatCompletionContentPart => ({
      type: "image_url",
      image_url: {
        url: attachment.dataUrl as string,
      },
    }));

  if (message.role === "user" && imageParts.length > 0) {
    return {
      role: "user",
      content: [
        {
          type: "text",
          text,
        },
        ...imageParts,
      ],
    };
  }

  return {
    role: message.role,
    content: text,
  };
}

function isValidImageDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);
}
