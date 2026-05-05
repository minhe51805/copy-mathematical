import { GoogleGenAI, type Content, type Part } from "@google/genai";

let geminiClient: GoogleGenAI | null = null;

export interface GeminiImageAttachment {
  mimeType?: string;
  dataUrl?: string;
}

export interface GeminiMessage {
  role: "user" | "assistant";
  content: string;
  attachments?: GeminiImageAttachment[];
}

export function shouldUseGeminiNative() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL || process.env.OPENAI_MODEL || "gemini-2.5-flash";
}

function getGeminiClient() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    geminiClient = new GoogleGenAI({ apiKey });
  }

  return geminiClient;
}

export async function createGeminiStream(messages: GeminiMessage[], systemInstruction: string) {
  const ai = getGeminiClient();

  return ai.models.generateContentStream({
    model: getGeminiModel(),
    contents: messages.map(toGeminiContent),
    config: {
      systemInstruction,
      temperature: 0.7,
    },
  });
}

export async function generateGeminiText(params: {
  prompt: string;
  systemInstruction: string;
  temperature?: number;
  json?: boolean;
}) {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: params.prompt,
    config: {
      systemInstruction: params.systemInstruction,
      temperature: params.temperature ?? 0.35,
      responseMimeType: params.json ? "application/json" : undefined,
    },
  });

  return response.text ?? "";
}

function toGeminiContent(message: GeminiMessage): Content {
  const parts: Part[] = [
    {
      text: message.content?.trim() || "Đọc ảnh và trích xuất công thức/toán học trong ảnh.",
    },
  ];

  if (message.role === "user") {
    for (const attachment of message.attachments ?? []) {
      const inlineData = toInlineData(attachment);
      if (inlineData) {
        parts.push({ inlineData });
      }
    }
  }

  return {
    role: message.role === "assistant" ? "model" : "user",
    parts,
  };
}

function toInlineData(attachment: GeminiImageAttachment) {
  if (!attachment.dataUrl) return null;

  const match = attachment.dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) return null;

  return {
    mimeType: attachment.mimeType || match[1],
    data: match[2],
  };
}
