"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, FileText, LogIn, NotebookPen, Sparkles } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { ExportDialog } from "@/components/word/export-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildLocalDocumentCopyResponse, isFullCopyRequest } from "@/lib/attachment-content";
import { isExportOnlyRequest, isExportRequest } from "@/lib/export-drafts";
import { setPendingGuestPrompt } from "@/lib/guest-access";
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

interface GuestLimitState {
  limit: number;
  used: number;
  hasAttachments: boolean;
}

export function ChatContainer({ modeConfig }: ChatContainerProps) {
  const [exportSource, setExportSource] = useState<ExportSource | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [guestLimitState, setGuestLimitState] = useState<GuestLimitState | null>(null);
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
      let contentToExport = shouldUsePreviousAnswer
        ? previousAssistantContent
        : fullDocumentCopy ?? assistantContent;

      if (contentToExport?.trim()) {
        // Strip the thinking process block from the exported file content
        contentToExport = contentToExport.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

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

  const handleGuestLimitReached = useCallback(
    ({ limit, used, content, hasAttachments }: GuestLimitState & { content: string }) => {
      if (content.trim()) {
        setPendingGuestPrompt(content);
      }
      setGuestLimitState({ limit, used, hasAttachments });
    },
    []
  );

  const { messages, isLoading, sendMessage } = useChat({
    mode: modeConfig?.id,
    onFinish: handleFinish,
    onGuestLimitReached: handleGuestLimitReached,
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

  const handleExport = useCallback((content: string, request?: string | null) => {
    setExportSource({ content, request });
  }, []);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onQuickSend={(content) => {
            void sendMessage(content, pendingAttachments).then((sent) => {
              if (sent !== false) {
                setPendingAttachments([]);
              }
            });
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
      <GuestLoginDialog
        open={!!guestLimitState}
        limit={guestLimitState?.limit ?? 3}
        hasAttachments={guestLimitState?.hasAttachments ?? false}
        onOpenChange={(open) => !open && setGuestLimitState(null)}
      />
    </div>
  );
}

function GuestLoginDialog({
  open,
  limit,
  hasAttachments,
  onOpenChange,
}: {
  open: boolean;
  limit: number;
  hasAttachments: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] border-border/15 bg-card p-0 text-foreground shadow-[var(--shadow-md)]">
        <DialogHeader className="px-6 pb-2 pt-6 text-left">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--terracotta))]/15 text-[hsl(var(--terracotta))]">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle className="text-2xl font-semibold">
            Đăng nhập để tiếp tục
          </DialogTitle>
          <DialogDescription className="text-[15px] leading-6">
            Bạn đã dùng hết {limit} lượt chat miễn phí. Đăng nhập để tiếp tục gửi câu hỏi, dùng file và lưu lại lịch sử làm việc.
          </DialogDescription>
        </DialogHeader>

        {hasAttachments && (
          <div className="mx-6 rounded-xl border border-[hsl(var(--terracotta))]/30 bg-[hsl(var(--terracotta))]/10 px-4 py-3 text-sm leading-6 text-foreground">
            File đang chọn vẫn ở khung nhập hiện tại. Nếu chuyển sang trang đăng nhập, hãy tải lại file sau khi quay về chat.
          </div>
        )}

        <DialogFooter className="gap-3 px-6 pb-6 pt-4 sm:justify-between sm:space-x-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Để sau
          </Button>
          <Button asChild>
            <Link href="/login?next=/newchat">
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
