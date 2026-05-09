"use client";

import { useCallback } from "react";
import { useChatStore } from "@/stores/chat-store";
import {
  buildLocalDocumentCopyResponse,
  getDefaultPromptForAttachments,
} from "@/lib/attachment-content";
import { getApiUrl, hasRuntimeApi } from "@/lib/api-url";
import { isExportOnlyRequest } from "@/lib/export-drafts";
import { generateId, sanitizeAssistantContent } from "@/lib/math-utils";
import type { AssistantModeId } from "@/lib/assistant-modes";
import type { ChatAttachment } from "@/types";

interface SendMessageOptions {
  mode?: AssistantModeId;
  onError?: (error: string) => void;
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
      if ((!trimmedContent && !hasAttachments) || isLoading) return;

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
            messages: messages.concat(userMessage).map((m) => ({
              role: m.role,
              content: m.content,
              attachments: m.attachments,
            })),
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
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantContent += chunk;
          visibleAssistantContent = sanitizeAssistantContent(assistantContent);
          updateMessage(assistantMessageId, visibleAssistantContent);
        }

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
    [messages, isLoading, addMessage, updateMessage, setLoading, saveConversation, mode, onError, onFinish]
  );

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}

function isRecoverableChatError(message: string) {
  return /ai gateway|async request timed out|last status:\s*processing|timeout|524|504|429|502|503|no available processing capacity|service unavailable|capacity/i.test(message);
}
