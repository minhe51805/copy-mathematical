"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { ReactNode } from "react";
import { Check, Copy, FileText, Table2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/file-extraction";
import { formatTimestamp } from "@/lib/math-utils";
import { cn } from "@/lib/utils";
import type { ChatAttachment, DocumentAttachment, ImageAttachment } from "@/types";

export interface UploadedFileEntry {
  id: string;
  attachment: ChatAttachment;
  messageId: string;
  timestamp: number;
}

interface FileManagerProps {
  pendingAttachments: ChatAttachment[];
  uploadedFiles: UploadedFileEntry[];
  onRemovePending: (id: string) => void;
  onRemoveUploaded: (id: string) => void;
}

export function FileManager({
  pendingAttachments,
  uploadedFiles,
  onRemovePending,
  onRemoveUploaded,
}: FileManagerProps) {
  const totalFiles = pendingAttachments.length + uploadedFiles.length;

  return (
    <aside className="hidden w-[288px] shrink-0 border-l bg-background xl:flex xl:flex-col 2xl:w-[312px]">
      <div className="border-b bg-card/70 px-4 py-4 2xl:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Tệp đã đưa lên</h2>
            <p className="text-xs text-muted-foreground">{totalFiles} file</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))]">
            <FileText className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 2xl:px-4">
        {totalFiles === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="max-w-[13rem] text-sm text-muted-foreground">
              Kéo file vào chat để quản lý tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {pendingAttachments.length > 0 && (
              <FileSection title="Đang chờ gửi">
                {pendingAttachments.map((attachment) => (
                  <FileManagerItem
                    key={attachment.id}
                    attachment={attachment}
                    meta="Chưa gửi"
                    onRemove={() => onRemovePending(attachment.id)}
                  />
                ))}
              </FileSection>
            )}

            {uploadedFiles.length > 0 && (
              <FileSection title="Trong cuộc trò chuyện">
                {uploadedFiles.map((file) => (
                  <FileManagerItem
                    key={file.id}
                    attachment={file.attachment}
                    meta={formatTimestamp(file.timestamp)}
                    onRemove={() => onRemoveUploaded(file.attachment.id)}
                  />
                ))}
              </FileSection>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function FileSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function FileManagerItem({
  attachment,
  meta,
  onRemove,
}: {
  attachment: ChatAttachment;
  meta: string;
  onRemove: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyText = async () => {
    if (!isDocumentAttachment(attachment)) return;

    await navigator.clipboard.writeText(attachment.extractedText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="group rounded-xl border border-border/15 bg-card p-3 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
      <div className="flex gap-2">
        <FileThumbnail attachment={attachment} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{attachment.name}</p>
          <p className="truncate text-xs text-muted-foreground">{getFileSummary(attachment)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground/80">{meta}</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          {isImageAttachment(attachment) ? (
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <a href={attachment.dataUrl} target="_blank" rel="noreferrer">
                Mở
              </a>
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-xs"
              onClick={handleCopyText}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              Text
            </Button>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
          aria-label="Xóa file"
          title="Xóa file"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function FileThumbnail({ attachment }: { attachment: ChatAttachment }) {
  if (isImageAttachment(attachment)) {
    return (
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/15 bg-secondary">
        <img
          src={attachment.dataUrl}
          alt={attachment.name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const Icon = isSpreadsheetAttachment(attachment) ? Table2 : FileText;

  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border/15 bg-secondary text-muted-foreground",
        isSpreadsheetAttachment(attachment) && "text-green-500"
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

function getFileSummary(attachment: ChatAttachment) {
  const details = [formatFileSize(attachment.size)];

  if (isDocumentAttachment(attachment)) {
    if (attachment.pageCount) {
      details.push(`${attachment.pageCount} trang`);
    }

    if (attachment.sheetCount) {
      details.push(`${attachment.sheetCount} sheet`);
    }

    details.push(`${attachment.textLength.toLocaleString("vi-VN")} ký tự`);
  }

  return details.join(" · ");
}

function isImageAttachment(attachment: ChatAttachment): attachment is ImageAttachment {
  return attachment.kind === "image" || "dataUrl" in attachment;
}

function isDocumentAttachment(attachment: ChatAttachment): attachment is DocumentAttachment {
  return attachment.kind === "document";
}

function isSpreadsheetAttachment(attachment: ChatAttachment) {
  return isDocumentAttachment(attachment)
    && (/spreadsheet|excel|csv/i.test(attachment.mimeType) || /\.(xlsx|csv)$/i.test(attachment.name));
}
