"use client";

import { useCallback } from "react";
import { useChatStore } from "@/stores/chat-store";
import { getApiUrl, hasRuntimeApi } from "@/lib/api-url";
import { generateId, sanitizeAssistantContent } from "@/lib/math-utils";

interface SendMessageOptions {
  onError?: (error: string) => void;
  onFinish?: (result: {
    assistantContent: string;
    previousAssistantContent: string | null;
    userMessage: string;
  }) => void;
}

export function useChat(options?: SendMessageOptions) {
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
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const previousAssistantContent =
        [...messages].reverse().find((message) =>
          message.role === "assistant" && message.content.trim()
        )?.content ?? null;

      const userMessage = {
        id: generateId(),
        role: "user" as const,
        content: content.trim(),
        timestamp: Date.now(),
      };

      addMessage(userMessage);
      setLoading(true);

      try {
        if (!hasRuntimeApi()) {
          throw new Error(
            "GitHub Pages chỉ chạy giao diện tĩnh nên không có API chat. NEXT_PUBLIC_API_BASE_URL phải là URL backend đã deploy, không phải OPENAI_API_KEY. Nếu muốn chạy đủ tính năng, deploy app bằng Vercel."
          );
        }

        const response = await fetch(getApiUrl("/api/chat"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messages.concat(userMessage).map((m) => ({
              role: m.role,
              content: m.content,
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
          assistantContent: visibleAssistantContent,
          previousAssistantContent,
          userMessage: userMessage.content,
        });
      } catch (error) {
        console.error("Chat error:", error);
        onError?.(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [messages, isLoading, addMessage, updateMessage, setLoading, saveConversation, onError, onFinish]
  );

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
