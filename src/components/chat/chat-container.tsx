"use client";

import { useCallback, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { ExportDialog } from "@/components/word/export-dialog";
import { isExportOnlyRequest, isExportRequest } from "@/lib/export-drafts";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";

interface ExportSource {
  content: string;
  request?: string;
}

interface ChatFinishResult {
  assistantContent: string;
  previousAssistantContent: string | null;
  userMessage: string;
}

export function ChatContainer() {
  const [exportSource, setExportSource] = useState<ExportSource | null>(null);

  const handleFinish = useCallback(
    ({ assistantContent, previousAssistantContent, userMessage }: ChatFinishResult) => {
      if (!isExportRequest(userMessage)) return;

      const shouldUsePreviousAnswer = isExportOnlyRequest(userMessage) && previousAssistantContent?.trim();
      const contentToExport = shouldUsePreviousAnswer
        ? previousAssistantContent
        : assistantContent;

      if (contentToExport?.trim()) {
        setExportSource({
          content: contentToExport,
          request: userMessage,
        });
      }
    },
    []
  );

  const { messages, isLoading, sendMessage } = useChat({ onFinish: handleFinish });

  const handleExport = (content: string) => {
    setExportSource({ content });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageList messages={messages} isLoading={isLoading} onExport={handleExport} />
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
      <ExportDialog
        content={exportSource?.content ?? null}
        request={exportSource?.request}
        onClose={() => setExportSource(null)}
      />
    </div>
  );
}
