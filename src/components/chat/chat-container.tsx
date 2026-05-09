"use client";

import { useCallback, useMemo, useState } from "react";
import { ClipboardList, FileText, NotebookPen } from "lucide-react";
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

const MODE_SUGGESTION_ICONS = [NotebookPen, ClipboardList, FileText];

export function ChatContainer({ modeConfig }: ChatContainerProps) {
  const [exportSource, setExportSource] = useState<ExportSource | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const removeAttachment = useChatStore((state) => state.removeAttachment);
  const setMessageExportSource = useChatStore((state) => state.setMessageExportSource);

  const handleFinish = useCallback(
    ({ assistantMessageId, assistantContent, previousAssistantContent, userMessage, attachments }: ChatFinishResult) => {
      if (!isExportRequest(userMessage)) return;
      if (isProviderFallbackMessage(assistantContent)) return;

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
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onQuickSend={(content) => {
            sendMessage(content, pendingAttachments);
            setPendingAttachments([]);
          }}
          onExport={handleExport}
          emptyTitle={modeConfig?.workspace.emptyTitle}
          emptySubtitle={modeConfig?.workspace.emptySubtitle}
          suggestions={modeConfig?.workspace.promptStarters.map((starter, index) => ({
            icon: MODE_SUGGESTION_ICONS[index % MODE_SUGGESTION_ICONS.length],
            label: starter.label,
            text: starter.text,
          }))}
          workspaceTools={modeConfig?.workspace.tools}
          setupItems={modeConfig?.workspace.setupItems}
          reviewChecklist={modeConfig?.workspace.reviewChecklist}
          pendingAttachmentCount={pendingAttachments.length}
          isTeacherWorkspace={modeConfig?.id === "teacher"}
          enableTestPdfExport={modeConfig?.id === "teacher"}
        />
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          attachments={pendingAttachments}
          onAttachmentsChange={setPendingAttachments}
          placeholder={modeConfig?.workspace.inputPlaceholder}
          isTeacherWorkspace={modeConfig?.id === "teacher"}
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

function isProviderFallbackMessage(content: string) {
  const normalized = content
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return normalized.includes("minh chua lay duoc phan hoi tu ai")
    || normalized.includes("ai gateway dang ket")
    || normalized.includes("ai gateway xu ly qua lau")
    || normalized.includes("provider unavailable");
}
