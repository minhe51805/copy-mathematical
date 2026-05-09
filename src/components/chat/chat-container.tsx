"use client";

import { useCallback, useMemo, useState } from "react";
import { BookOpenCheck, NotebookPen } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { ExportDialog } from "@/components/word/export-dialog";
import { buildLocalDocumentCopyResponse, isFullCopyRequest } from "@/lib/attachment-content";
import { isExportOnlyRequest, isExportRequest } from "@/lib/export-drafts";
import { useChatStore } from "@/stores/chat-store";
import type { AssistantModeConfig } from "@/lib/assistant-modes";
import type { ChatAttachment } from "@/types";
import { FileManager, type UploadedFileEntry } from "./file-manager";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { WorkspacePanel } from "./workspace-panel";

interface ExportSource {
  content: string;
  request?: string | null;
}

interface ChatFinishResult {
  assistantMessageId: string;
  assistantContent: string;
  previousAssistantContent: string | null;
  userMessage: string;
  attachments: ChatAttachment[];
}

interface ChatContainerProps {
  modeConfig?: AssistantModeConfig;
}

export function ChatContainer({ modeConfig }: ChatContainerProps) {
  const [exportSource, setExportSource] = useState<ExportSource | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const removeAttachment = useChatStore((state) => state.removeAttachment);
  const setMessageExportSource = useChatStore((state) => state.setMessageExportSource);

  const handleFinish = useCallback(
    ({ assistantMessageId, assistantContent, previousAssistantContent, userMessage, attachments }: ChatFinishResult) => {
      if (!isExportRequest(userMessage)) return;

      const fullDocumentCopy = isFullCopyRequest(userMessage)
        ? buildLocalDocumentCopyResponse(userMessage, attachments)
        : null;
      const shouldUsePreviousAnswer = isExportOnlyRequest(userMessage) && previousAssistantContent?.trim();
      const contentToExport = shouldUsePreviousAnswer
        ? previousAssistantContent
        : fullDocumentCopy ?? assistantContent;

      if (contentToExport?.trim()) {
        const nextExportSource = {
          content: contentToExport,
          request: userMessage,
        };
        setMessageExportSource(assistantMessageId, nextExportSource);
        setExportSource(nextExportSource);
      }
    },
    [setMessageExportSource]
  );

  const { messages, isLoading, sendMessage } = useChat({
    mode: modeConfig?.id,
    onFinish: handleFinish,
  });

  const uploadedFiles = useMemo<UploadedFileEntry[]>(
    () =>
      messages.flatMap((message) =>
        (message.attachments ?? []).map((attachment) => ({
          id: `${message.id}-${attachment.id}`,
          attachment,
          messageId: message.id,
          timestamp: message.timestamp,
        }))
      ),
    [messages]
  );
  const hasManagedFiles = pendingAttachments.length > 0 || uploadedFiles.length > 0;

  const handleExport = (content: string, request?: string | null) => {
    setExportSource({ content, request });
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {modeConfig && <WorkspacePanel config={modeConfig} />}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onExport={handleExport}
          emptyTitle={modeConfig?.workspace.emptyTitle}
          emptySubtitle={modeConfig?.workspace.emptySubtitle}
          suggestions={modeConfig?.workspace.promptStarters.map((starter) => ({
            icon: modeConfig.id === "teacher" ? NotebookPen : BookOpenCheck,
            label: starter.label,
            text: starter.text,
          }))}
          enableTestPdfExport={modeConfig?.id === "teacher"}
        />
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          attachments={pendingAttachments}
          onAttachmentsChange={setPendingAttachments}
          placeholder={modeConfig?.workspace.inputPlaceholder}
        />
      </div>
      {hasManagedFiles && (
        <FileManager
          pendingAttachments={pendingAttachments}
          uploadedFiles={uploadedFiles}
          onRemovePending={(id) =>
            setPendingAttachments((current) => current.filter((attachment) => attachment.id !== id))
          }
          onRemoveUploaded={removeAttachment}
        />
      )}
      <ExportDialog
        content={exportSource?.content ?? null}
        request={exportSource?.request}
        onClose={() => setExportSource(null)}
      />
    </div>
  );
}
