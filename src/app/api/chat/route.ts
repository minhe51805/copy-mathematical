import {
  generateAIText,
  getAIModel,
  getAIProviderSetupError,
  getAIProviderUserMessage,
  getOpenAIConfigForLog,
  isAIProviderRecoverableError,
  type AIChatMessage,
  type AIContentPart,
} from "@/lib/openai";
import { buildMessageTextWithAttachments } from "@/lib/attachment-content";
import { ASSISTANT_MODES, type AssistantModeId } from "@/lib/assistant-modes";
import {
  createTeacherTestAgentPlan,
  formatTeacherTestAgentPrompt,
  formatTeacherTestContinuationPrompt,
} from "@/lib/agents/teacher-test-agent";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { createCorsPreflightResponse, getCorsHeaders } from "@/lib/cors";
import { NextRequest, NextResponse } from "next/server";

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

interface ChatRequestBody {
  mode?: AssistantModeId;
  messages?: IncomingMessage[];
}

const MAX_GATEWAY_HISTORY_MESSAGES = 8;
const MAX_GATEWAY_MESSAGE_CHARS = 6_000;
const MAX_GATEWAY_ATTACHMENT_TEXT_CHARS = 24_000;
const MAX_TEACHER_ATTACHMENT_TEXT_CHARS = 14_000;
const MAX_GATEWAY_IMAGE_ATTACHMENTS = 3;
const LARGE_GENERATION_THRESHOLD = 80;

export function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req);
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  try {
    const { messages, mode } = await req.json() as ChatRequestBody;
    const chatMessages = Array.isArray(messages) ? messages : [];

    const setupError = getAIProviderSetupError();
    if (setupError) {
      return NextResponse.json(
        { error: setupError },
        { status: 500, headers: corsHeaders }
      );
    }

    const responseText = await createGatewayText(chatMessages, mode);

    return createTextStreamResponse(responseText, corsHeaders);
  } catch (error) {
    const errorMessage = getAIProviderUserMessage(error);

    if (isAIProviderRecoverableError(error)) {
      console.warn("Chat provider unavailable:", errorMessage);
      return createTextStreamResponse(
        `Minh chua lay duoc phan hoi tu AI.\n\n${errorMessage}`,
        corsHeaders
      );
    }

    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 503, headers: corsHeaders }
    );
  }
}

function createTextStreamResponse(text: string, corsHeaders: HeadersInit) {
  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      ...corsHeaders,
    },
  });
}

async function createGatewayText(messages: IncomingMessage[], mode?: AssistantModeId) {
  const modeConfig = mode ? ASSISTANT_MODES[mode] : undefined;
  const model = modeConfig?.model.name ?? getAIModel("chat");
  const config = getOpenAIConfigForLog();
  const gatewayMessages = prepareGatewayMessages(messages, mode);
  const latestContent = messages[messages.length - 1]?.content;
  const isContinuation = isContinuationRequest(latestContent);
  const isLargeGeneration = hasLargeGenerationRequest(latestContent);

  console.log("Using AI gateway model:", model);
  console.log("AI provider:", config.provider, config.baseURL, config.generatePath);

  return generateAIText({
    purpose: "chat",
    model,
    system: getSystemPrompt(mode),
    messages: gatewayMessages.map(toAIChatMessage),
    temperature: modeConfig?.model.temperature ?? 0.7,
    maxOutputTokens: isLargeGeneration || isContinuation
      ? Math.min(modeConfig?.model.maxOutputTokens ?? 4096, 3000)
      : modeConfig?.model.maxOutputTokens ?? 4096,
  });
}

function prepareGatewayMessages(messages: IncomingMessage[], mode?: AssistantModeId) {
  const recentMessages = messages.slice(-MAX_GATEWAY_HISTORY_MESSAGES);
  const latestMessageIndex = recentMessages.length - 1;
  const latestMessage = recentMessages[latestMessageIndex];
  const isContinuation = latestMessage?.role === "user" && isContinuationRequest(latestMessage.content);
  const previousAssistantIndex = isContinuation
    ? findPreviousAssistantIndex(recentMessages, latestMessageIndex)
    : -1;
  const previousUserRequest = isContinuation
    ? findPreviousUserRequest(messages, messages.length - 1)
    : "";
  const previousAssistantContent = previousAssistantIndex >= 0
    ? recentMessages[previousAssistantIndex]?.content
    : "";

  return recentMessages.map((message, index) => {
    const isLatestUserMessage = index === latestMessageIndex && message.role === "user";
    const isPreviousAssistantForContinuation = index === previousAssistantIndex;
    const contentForGateway = isLatestUserMessage
      ? isContinuation
        ? rewriteContinuationRequest(message.content, previousAssistantContent, previousUserRequest, mode)
        : rewriteLargeGenerationRequest(message.content, message.attachments, mode)
      : message.content;

    return {
      ...message,
      content: isPreviousAssistantForContinuation
        ? limitTextFromEnd(
          contentForGateway,
          Math.max(MAX_GATEWAY_MESSAGE_CHARS, 8_000),
          "Earlier part of the previous answer was trimmed; keep continuing from the visible ending."
        )
        : limitText(
          contentForGateway,
          isLatestUserMessage ? MAX_GATEWAY_MESSAGE_CHARS : Math.floor(MAX_GATEWAY_MESSAGE_CHARS / 2),
          "Nội dung tin nhắn đã được rút gọn để request chạy ổn định hơn."
        ),
      attachments: isLatestUserMessage
        ? limitGatewayAttachments(message.attachments, mode)
        : undefined,
    };
  });
}

function findPreviousAssistantIndex(messages: IncomingMessage[], beforeIndex: number) {
  for (let index = beforeIndex - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "assistant") {
      return index;
    }
  }

  return -1;
}

function findPreviousUserRequest(messages: IncomingMessage[], beforeIndex: number) {
  for (let index = beforeIndex - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user" && !isContinuationRequest(message.content)) {
      return message.content;
    }
  }

  return "";
}

function limitGatewayAttachments(attachments: IncomingAttachment[] | undefined, mode?: AssistantModeId) {
  if (!attachments?.length) {
    return undefined;
  }

  const documents = attachments.filter((attachment) =>
    attachment.kind === "document" && typeof attachment.extractedText === "string"
  );
  const images = attachments
    .filter((attachment) => isValidImageDataUrl(attachment.dataUrl))
    .slice(0, MAX_GATEWAY_IMAGE_ATTACHMENTS);
  const totalBudget = mode === "teacher"
    ? MAX_TEACHER_ATTACHMENT_TEXT_CHARS
    : MAX_GATEWAY_ATTACHMENT_TEXT_CHARS;
  const perDocumentBudget = documents.length
    ? Math.max(4_000, Math.floor(totalBudget / documents.length))
    : totalBudget;

  return [
    ...documents.map((attachment) => {
      const originalText = attachment.extractedText ?? "";
      const text = limitText(
        originalText,
        perDocumentBudget,
        "Tài liệu dài nên chỉ gửi phần đầu vào model. Nếu cần xử lý đủ, hãy yêu cầu theo từng phần hoặc dùng chức năng copy nội dung file."
      );

      return {
        ...attachment,
        extractedText: text,
        textLength: attachment.textLength ?? originalText.length,
        truncated: attachment.truncated || text.length < originalText.length,
      };
    }),
    ...images,
  ];
}

function rewriteContinuationRequest(
  content: string | undefined,
  previousAssistantContent: string | undefined,
  previousUserRequest: string | undefined,
  mode?: AssistantModeId
) {
  const userText = content?.trim() || "tiep tuc";

  if (mode === "teacher" && previousUserRequest && hasLargeGenerationRequest(previousUserRequest)) {
    const plan = createTeacherTestAgentPlan(previousUserRequest);
    return formatTeacherTestContinuationPrompt(previousUserRequest, plan, previousAssistantContent ?? "");
  }

  const lastQuestionNumber = inferLastQuestionNumber(previousAssistantContent ?? "");
  const nextQuestionNumber = lastQuestionNumber ? lastQuestionNumber + 1 : null;
  const nextEndNumber = nextQuestionNumber ? nextQuestionNumber + 9 : null;

  return [
    "Nguoi dung dang yeu cau tiep tuc tu cau tra loi truoc.",
    "Hay doc phan CUOI cua cau tra loi assistant ngay truoc do va tiep tuc dung mach dang lam.",
    "Tuyet doi KHONG bat dau lai tu dau, KHONG tao lai De so 1 tu cau 1, KHONG nhac lai cac cau da tao.",
    nextQuestionNumber
      ? `Bat dau tu Cau ${nextQuestionNumber} va tao toi da den Cau ${nextEndNumber}.`
      : "Neu khong xac dinh duoc so cau cuoi, hay tiep tuc ngay sau diem dung gan nhat.",
    "Giu dung phan bo do kho va dang bai da thong nhat o phan truoc.",
    "Ket thuc bang dong: [Con tiep - gui \"tiep tuc\" de tao 10 cau ke tiep].",
    "",
    "Tin nhan moi cua nguoi dung:",
    userText,
  ].join("\n");
}

function isContinuationRequest(content: string | undefined) {
  const normalized = normalizeForIntent(content ?? "");
  return /^(tiep|tiep di|tiep tuc|lam tiep|viet tiep|cho tiep|continue|next|more)(?:\b|[.!?]*)/.test(normalized);
}

function inferLastQuestionNumber(content: string) {
  const normalized = normalizeForIntent(content);
  const matches = Array.from(normalized.matchAll(/(?:cau|bai)\s*(\d+)/g));
  const numbers = matches
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value > 0);

  return numbers.length ? Math.max(...numbers) : null;
}

function rewriteLargeGenerationRequest(
  content: string | undefined,
  attachments: IncomingAttachment[] | undefined,
  mode?: AssistantModeId
) {
  const text = content?.trim() ?? "";
  const workload = estimateGenerationWorkload(text);

  if (workload < LARGE_GENERATION_THRESHOLD) {
    return text;
  }

  if (mode === "teacher") {
    return formatTeacherTestAgentPrompt(text, createTeacherTestAgentPlan(text));
  }

  const hasImage = attachments?.some((attachment) => isValidImageDataUrl(attachment.dataUrl)) ?? false;
  const requestedSets = extractNumberBeforeKeyword(text, ["đề", "de", "bộ", "bo"]) ?? 1;
  const requestedQuestions = extractNumberBeforeKeyword(text, ["câu", "cau"]) ?? workload;

  return [
    "Yêu cầu gốc của người dùng quá lớn để tạo trong một lần, có thể gây timeout gateway.",
    `Khối lượng ước tính: khoảng ${requestedSets} đề/bộ và ${requestedQuestions} câu, tương đương khoảng ${workload} câu hoặc mục cần sinh.`,
    "",
    "Hãy KHÔNG tạo toàn bộ trong một phản hồi.",
    "Chỉ làm PHẦN 1 thật gọn nhưng hữu ích:",
    hasImage
      ? "1. Đọc ảnh mẫu, rút ra dạng toán/chủ đề/cấu trúc câu hỏi mẫu trong 3-5 ý."
      : "1. Rút ra dạng toán/chủ đề/cấu trúc câu hỏi mẫu trong 3-5 ý.",
    "2. Đề xuất ma trận phân bổ cho toàn bộ yêu cầu: dễ, trung bình, khó.",
    "3. Tạo trước 10 câu đầu tiên cho Đề 1, gồm 3 câu dễ, 5 câu trung bình, 2 câu khó. Mỗi câu có đáp án ngắn.",
    "4. Kết thúc bằng dòng: [Còn tiếp - gửi \"tiếp tục\" để tạo 10 câu kế tiếp].",
    "",
    "Yêu cầu gốc:",
    text,
  ].join("\n");
}

function hasLargeGenerationRequest(content: string | undefined) {
  return estimateGenerationWorkload(content ?? "") >= LARGE_GENERATION_THRESHOLD;
}

function estimateGenerationWorkload(content: string) {
  const lowerContent = content.toLowerCase();
  const setCount = extractNumberBeforeKeyword(lowerContent, ["đề", "de", "bộ", "bo"]) ?? 1;
  const questionCount = extractNumberBeforeKeyword(lowerContent, ["câu", "cau"]) ?? 1;

  if (/(mỗi|moi|1)\s*(đề|de|bộ|bo)/i.test(lowerContent)) {
    return setCount * questionCount;
  }

  if (setCount >= 5 && questionCount >= 20) {
    return setCount * questionCount;
  }

  if (questionCount >= LARGE_GENERATION_THRESHOLD) {
    return questionCount;
  }

  return Math.max(setCount, questionCount);
}

function extractNumberBeforeKeyword(content: string, keywords: string[]) {
  const pattern = new RegExp(`(\\d+)\\s*(?:${keywords.join("|")})`, "i");
  const match = content.match(pattern);
  return match?.[1] ? Number(match[1]) : null;
}

function limitText(value: string | undefined, maxLength: number, note: string) {
  const text = value?.trim() ?? "";
  if (text.length <= maxLength) {
    return text;
  }

  return [
    text.slice(0, maxLength).trimEnd(),
    "",
    `[${note}]`,
  ].join("\n");
}

function limitTextFromEnd(value: string | undefined, maxLength: number, note: string) {
  const text = value?.trim() ?? "";
  if (text.length <= maxLength) {
    return text;
  }

  return [
    `[${note}]`,
    "",
    text.slice(-maxLength).trimStart(),
  ].join("\n");
}

function normalizeForIntent(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[“”"']/g, "")
    .trim();
}

function getSystemPrompt(mode?: AssistantModeId) {
  if (!mode || !ASSISTANT_MODES[mode]) {
    return SYSTEM_PROMPT;
  }

  return [
    SYSTEM_PROMPT,
    "",
    `Workspace preset: ${ASSISTANT_MODES[mode].badge}`,
    ASSISTANT_MODES[mode].systemPrompt,
  ].join("\n");
}

function toAIChatMessage(message: IncomingMessage): AIChatMessage {
  const text = buildMessageTextWithAttachments(message.content, message.attachments);
  const imageParts = (message.attachments ?? [])
    .filter((attachment) => isValidImageDataUrl(attachment.dataUrl))
    .map((attachment): AIContentPart => ({
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
