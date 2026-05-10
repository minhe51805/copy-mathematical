"use client";

import { useCallback } from "react";
import { useChatStore } from "@/stores/chat-store";
import {
  buildLocalDocumentCopyResponse,
  getDefaultPromptForAttachments,
} from "@/lib/attachment-content";
import { getApiUrl, hasRuntimeApi } from "@/lib/api-url";
import { isExportOnlyRequest } from "@/lib/export-drafts";
import {
  DEFAULT_GUEST_CHAT_LIMIT,
  getGuestUsage,
  incrementGuestUsage,
  normalizeGuestLimit,
} from "@/lib/guest-access";
import { generateId, sanitizeAssistantContent } from "@/lib/math-utils";
import { isMockAuthenticated } from "@/lib/mock-auth";
import type { AssistantModeId } from "@/lib/assistant-modes";
import type { ChatAttachment, DocumentAttachment, Message } from "@/types";

const STREAM_RENDER_THROTTLE_MS = 120;
const CLIENT_GATEWAY_ATTACHMENT_TEXT_CHARS = 24_000;
const CLIENT_TEACHER_ATTACHMENT_TEXT_CHARS = 14_000;

interface SendMessageOptions {
  mode?: AssistantModeId;
  onError?: (error: string) => void;
  onGuestLimitReached?: (result: {
    limit: number;
    used: number;
    content: string;
    hasAttachments: boolean;
  }) => void;
  onFinish?: (result: {
    assistantMessageId: string;
    assistantContent: string;
    previousAssistantContent: string | null;
    userMessage: string;
    attachments: ChatAttachment[];
  }) => void;
}

export function useChat(options?: SendMessageOptions) {
  const mode = options?.mode;
  const onError = options?.onError;
  const onGuestLimitReached = options?.onGuestLimitReached;
  const onFinish = options?.onFinish;
  const {
    messages,
    isLoading,
    addMessage,
    updateMessage,
    clearMessages,
    setLoading,
    saveConversation,
  } = useChatStore();

  const sendMessage = useCallback(
    async (content: string, attachments: ChatAttachment[] = []) => {
      const trimmedContent = content.trim();
      const hasAttachments = attachments.length > 0;
      if ((!trimmedContent && !hasAttachments) || isLoading) return false;

      if (!isMockAuthenticated()) {
        const guestLimit = await fetchGuestChatLimit();
        const used = getGuestUsage().used;

        if (used >= guestLimit) {
          onGuestLimitReached?.({
            limit: guestLimit,
            used,
            content: trimmedContent,
            hasAttachments,
          });
          return false;
        }

        incrementGuestUsage();
      }

      const previousAssistantMessage = [...messages].reverse().find((message) =>
        message.role === "assistant" && (message.exportSource?.content.trim() || message.content.trim())
      );
      const previousAssistantContent =
        previousAssistantMessage?.exportSource?.content
        ?? previousAssistantMessage?.content
        ?? null;

      const userMessage = {
        id: generateId(),
        role: "user" as const,
        content: trimmedContent || getDefaultPromptForAttachments(attachments),
        attachments,
        timestamp: Date.now(),
      };

      addMessage(userMessage);

      if (!hasAttachments && previousAssistantContent?.trim() && isExportOnlyRequest(userMessage.content)) {
        const assistantMessageId = generateId();
        const assistantContent = "Mình đã chuẩn bị nội dung để xuất file. Bạn có thể mở lại modal xuất bằng thẻ bên dưới.";
        addMessage({
          id: assistantMessageId,
          role: "assistant",
          content: assistantContent,
          exportSource: {
            content: previousAssistantContent,
            request: userMessage.content,
          },
          timestamp: Date.now(),
        });
        saveConversation();
        onFinish?.({
          assistantMessageId,
          assistantContent,
          previousAssistantContent,
          userMessage: userMessage.content,
          attachments,
        });
        return;
      }

      setLoading(true);

      try {
        const localDocumentResponse = buildLocalDocumentCopyResponse(userMessage.content, attachments);

        if (localDocumentResponse) {
          const assistantMessageId = generateId();
          const assistantContent = sanitizeAssistantContent(localDocumentResponse);
          addMessage({
            id: assistantMessageId,
            role: "assistant",
            content: assistantContent,
            timestamp: Date.now(),
          });
          saveConversation();
          onFinish?.({
            assistantMessageId,
            assistantContent,
            previousAssistantContent,
            userMessage: userMessage.content,
            attachments,
          });
          return;
        }

        if (!hasRuntimeApi()) {
          throw new Error(
            "GitHub Pages chỉ chạy giao diện tĩnh nên không có API chat. NEXT_PUBLIC_API_BASE_URL phải là URL backend đã deploy, không phải API key. Nếu muốn chạy đủ tính năng, deploy app bằng Vercel."
          );
        }

        const response = await fetch(getApiUrl("/api/chat"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            messages: prepareMessagesForChatRequest(messages.concat(userMessage), mode),
          }),
        });

        if (!response.ok) {
          let errorMsg = "Failed to get response";
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch {
            errorMsg = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMsg);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const assistantMessageId = generateId();
        addMessage({
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        });

        const decoder = new TextDecoder();
        let assistantContent = "";
        let visibleAssistantContent = "";
        let lastRenderAt = 0;

        const flushAssistantContent = (force = false) => {
          const now = Date.now();
          if (!force && now - lastRenderAt < STREAM_RENDER_THROTTLE_MS) {
            return;
          }

          const nextVisibleContent = sanitizeAssistantContent(assistantContent);
          if (nextVisibleContent !== visibleAssistantContent) {
            visibleAssistantContent = nextVisibleContent;
            updateMessage(assistantMessageId, visibleAssistantContent);
          }
          lastRenderAt = now;
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          flushAssistantContent();
        }

        assistantContent += decoder.decode();
        flushAssistantContent(true);

        saveConversation();
        onFinish?.({
          assistantMessageId,
          assistantContent: visibleAssistantContent,
          previousAssistantContent,
          userMessage: userMessage.content,
          attachments,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const recoverable = isRecoverableChatError(errorMessage);

        if (recoverable) {
          console.warn("Chat provider unavailable:", errorMessage);
        } else {
          console.error("Chat error:", error);
        }

        addMessage({
          id: generateId(),
          role: "assistant",
          content: `Mình chưa lấy được phản hồi từ AI.\n\n${errorMessage}`,
          timestamp: Date.now(),
        });
        saveConversation();
        onError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [messages, isLoading, addMessage, updateMessage, setLoading, saveConversation, mode, onError, onFinish, onGuestLimitReached]
  );

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}

async function fetchGuestChatLimit() {
  try {
    const response = await fetch("/api/public/settings", { cache: "no-store" });
    if (!response.ok) return DEFAULT_GUEST_CHAT_LIMIT;

    const data = await response.json() as { guestChatLimit?: number };
    return normalizeGuestLimit(data.guestChatLimit);
  } catch {
    return DEFAULT_GUEST_CHAT_LIMIT;
  }
}

function isRecoverableChatError(message: string) {
  return /ai gateway|async request timed out|last status:\s*processing|timeout|524|504|429|502|503|no available processing capacity|service unavailable|capacity/i.test(message);
}

function prepareMessagesForChatRequest(messages: Message[], mode?: AssistantModeId) {
  const latestIndex = messages.length - 1;

  return messages.map((message, index) => ({
    role: message.role,
    content: message.content,
    attachments: index === latestIndex ? trimAttachmentsForRequest(message.attachments, mode) : undefined,
  }));
}

function trimAttachmentsForRequest(attachments: ChatAttachment[] | undefined, mode?: AssistantModeId) {
  if (!attachments?.length) {
    return undefined;
  }

  const textBudget = mode === "teacher"
    ? CLIENT_TEACHER_ATTACHMENT_TEXT_CHARS
    : CLIENT_GATEWAY_ATTACHMENT_TEXT_CHARS;
  const documents = attachments.filter(isDocumentAttachment);
  const perDocumentBudget = documents.length
    ? Math.max(4_000, Math.floor(textBudget / documents.length))
    : textBudget;

  return attachments.map((attachment) => {
    if (!isDocumentAttachment(attachment)) {
      return attachment;
    }

    const extractedText = attachment.extractedText.length > perDocumentBudget
      ? `${attachment.extractedText.slice(0, perDocumentBudget).trimEnd()}\n\n[Tai lieu dai nen app chi gui phan dau vao model de tranh cham/timeout.]`
      : attachment.extractedText;

    return {
      ...attachment,
      extractedText,
      textLength: attachment.textLength ?? attachment.extractedText.length,
      truncated: attachment.truncated || extractedText.length < attachment.extractedText.length,
    };
  });
}

function isDocumentAttachment(attachment: ChatAttachment): attachment is DocumentAttachment {
  return attachment.kind === "document";
}
