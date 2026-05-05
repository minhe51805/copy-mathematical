"use client";

import { useCallback, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { ExportDialog } from "@/components/word/export-dialog";
import { buildLocalDocumentCopyResponse, isFullCopyRequest } from "@/lib/attachment-content";
import { isExportOnlyRequest, isExportRequest } from "@/lib/export-drafts";
import type { ChatAttachment } from "@/types";
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
  attachments: ChatAttachment[];
}

export function ChatContainer() {
  const [exportSource, setExportSource] = useState<ExportSource | null>(null);

  const handleFinish = useCallback(
    ({ assistantContent, previousAssistantContent, userMessage, attachments }: ChatFinishResult) => {
      if (!isExportRequest(userMessage)) return;

      const fullDocumentCopy = isFullCopyRequest(userMessage)
        ? buildLocalDocumentCopyResponse(userMessage, attachments)
        : null;
      const shouldUsePreviousAnswer = isExportOnlyRequest(userMessage) && previousAssistantContent?.trim();
      const contentToExport = shouldUsePreviousAnswer
        ? previousAssistantContent
        : fullDocumentCopy ?? assistantContent;

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
