"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, Loader2, Paperclip, Sigma, Table2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ACCEPTED_ATTACHMENT_TYPES,
  MAX_ATTACHMENTS,
  MAX_DOCUMENT_SIZE,
  MAX_IMAGE_SIZE,
  extractDocumentAttachment,
  formatFileSize,
  getNormalizedMimeType,
  getSupportedFileKind,
  isSupportedAttachmentFile,
} from "@/lib/file-extraction";
import { generateId } from "@/lib/math-utils";
import { cn } from "@/lib/utils";
import type { ChatAttachment, DocumentAttachment, ImageAttachment } from "@/types";
import { FormulaStudio } from "./formula-studio";

interface ChatInputProps {
  onSend: (message: string, attachments?: ChatAttachment[]) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isFormulaStudioOpen, setIsFormulaStudioOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    const handleSuggestion = (e: CustomEvent<{ text: string }>) => {
      setInput(e.detail.text);
      textareaRef.current?.focus();
    };
    window.addEventListener("suggestion-click", handleSuggestion as EventListener);
    return () => {
      window.removeEventListener("suggestion-click", handleSuggestion as EventListener);
    };
  }, []);

  const handleFiles = async (files: Iterable<File> | FileList | null) => {
    if (!files) return;

    const fileList = Array.from(files);
    if (!fileList.length) return;

    setAttachmentError(null);
    setIsProcessingFiles(true);
    const nextAttachments: ChatAttachment[] = [];
    const errors: string[] = [];

    try {
      for (const file of fileList) {
        if (attachments.length + nextAttachments.length >= MAX_ATTACHMENTS) {
          errors.push(`Tối đa ${MAX_ATTACHMENTS} file mỗi lần gửi.`);
          break;
        }

        if (!isSupportedAttachmentFile(file)) {
          errors.push(`${file.name || "File"} chưa được hỗ trợ. Hãy dùng ảnh, PDF, DOCX, XLSX hoặc CSV.`);
          continue;
        }

        const kind = getSupportedFileKind(file);

        if (kind === "image") {
          if (file.size > MAX_IMAGE_SIZE) {
            errors.push(`${file.name || "Ảnh"} vượt quá ${formatFileSize(MAX_IMAGE_SIZE)}.`);
            continue;
          }

          const dataUrl = await readFileAsDataUrl(file);
          nextAttachments.push({
            id: generateId(),
            name: file.name || "clipboard-image.png",
            mimeType: getNormalizedMimeType(file),
            kind: "image",
            dataUrl,
            size: file.size,
          });
          continue;
        }

        if (kind === "document") {
          if (file.size > MAX_DOCUMENT_SIZE) {
            errors.push(`${file.name || "Tài liệu"} vượt quá ${formatFileSize(MAX_DOCUMENT_SIZE)}.`);
            continue;
          }

          try {
            nextAttachments.push(await extractDocumentAttachment(file, generateId()));
          } catch (error) {
            const message = error instanceof Error ? error.message : "Không đọc được file.";
            errors.push(`${file.name || "Tài liệu"}: ${message}`);
          }
        }
      }
    } finally {
      setIsProcessingFiles(false);
    }

    if (nextAttachments.length) {
      setAttachments((current) => [...current, ...nextAttachments].slice(0, MAX_ATTACHMENTS));
      textareaRef.current?.focus();
    }

    setAttachmentError(errors.at(-1) ?? null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files).filter(isSupportedAttachmentFile);

    if (!files.length) return;

    event.preventDefault();
    void handleFiles(files);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    void handleFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (hasDraggedFile(event.dataTransfer)) {
      event.preventDefault();
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDraggingFile(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
  };

  const handleSubmit = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading || isProcessingFiles) return;
    onSend(input, attachments);
    setInput("");
    setAttachments([]);
    setAttachmentError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const insertTextAtCursor = (value: string) => {
    const textarea = textareaRef.current;

    setInput((current) => {
      if (!textarea) return `${current}${value}`;

      const start = textarea.selectionStart ?? current.length;
      const end = textarea.selectionEnd ?? current.length;
      const prefix = current.slice(0, start);
      const suffix = current.slice(end);
      const next = `${prefix}${prefix && !prefix.endsWith("\n") ? "\n" : ""}${value}${suffix ? "\n" : ""}${suffix}`;
      const cursor = next.length - suffix.length - (suffix ? 1 : 0);

      window.requestAnimationFrame(() => {
        textarea.focus();
        textarea.selectionStart = cursor;
        textarea.selectionEnd = cursor;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
      });

      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = (input.trim().length > 0 || attachments.length > 0) && !isLoading && !isProcessingFiles;

  return (
    <div className="shrink-0 bg-background px-3 pb-3 pt-2 md:px-6 md:pb-5">
      <div className="mx-auto w-full max-w-3xl">
        <div
          className={cn(
            "rounded-[28px] border bg-card px-3 py-3 shadow-sm transition-colors focus-within:border-muted-foreground/50",
            isDraggingFile && "border-foreground/60 bg-accent"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2 px-1">
              {attachments.map((attachment) => (
                <AttachmentPreview
                  key={attachment.id}
                  attachment={attachment}
                  onRemove={() => removeAttachment(attachment.id)}
                />
              ))}
            </div>
          )}

          <div className="flex min-h-[32px] items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_ATTACHMENT_TYPES}
              multiple
              className="hidden"
              onChange={(event) => void handleFiles(event.target.files)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              disabled={isLoading || isProcessingFiles || attachments.length >= MAX_ATTACHMENTS}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Thêm file"
            >
              {isProcessingFiles ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              disabled={isLoading || isProcessingFiles}
              onClick={() => setIsFormulaStudioOpen(true)}
              aria-label="Mở Math Studio"
              title="Math Studio"
            >
              <Sigma className="h-4 w-4" />
            </Button>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi bài toán bất kỳ"
              className="max-h-[200px] min-h-[28px] flex-1 resize-none border-0 bg-transparent px-2 py-1 text-[15px] leading-6 shadow-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-[15px]"
              disabled={isLoading || isProcessingFiles}
              rows={1}
            />
            <div className="flex shrink-0 items-center gap-2">
              {input.length > 0 && (
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {input.length}
                </span>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!canSend}
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-colors",
                  canSend
                    ? "bg-foreground text-background hover:bg-foreground/85"
                    : "bg-muted text-muted-foreground"
                )}
                aria-label="Gửi tin nhắn"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {attachmentError && (
            <p className="mt-2 px-2 text-xs text-destructive">
              {attachmentError}
            </p>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Dán hoặc kéo ảnh, PDF, DOCX, Excel (.xlsx) hoặc CSV vào khung chat.
        </p>
      </div>
      <FormulaStudio
        open={isFormulaStudioOpen}
        onOpenChange={setIsFormulaStudioOpen}
        onInsert={insertTextAtCursor}
      />
    </div>
  );
}

function AttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: ChatAttachment;
  onRemove: () => void;
}) {
  if (isImageAttachment(attachment)) {
    return (
      <div className="group relative h-16 w-16 overflow-hidden rounded-xl border bg-muted">
        <img
          src={attachment.dataUrl}
          alt={attachment.name}
          className="h-full w-full object-cover"
        />
        <RemoveAttachmentButton onRemove={onRemove} label="Xóa ảnh" />
      </div>
    );
  }

  return (
    <div className="group relative flex min-h-16 max-w-full items-center gap-3 rounded-xl border bg-muted px-3 py-2 pr-9 sm:max-w-[19rem]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
        {isSpreadsheetAttachment(attachment) ? (
          <Table2 className="h-4 w-4" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{attachment.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {getDocumentAttachmentSummary(attachment)}
        </p>
      </div>
      <RemoveAttachmentButton onRemove={onRemove} label="Xóa file" />
    </div>
  );
}

function RemoveAttachmentButton({
  onRemove,
  label,
}: {
  onRemove: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm opacity-90 transition-opacity hover:opacity-100"
      aria-label={label}
    >
      <X className="h-3 w-3" />
    </button>
  );
}

function getDocumentAttachmentSummary(attachment: DocumentAttachment) {
  const details = [formatFileSize(attachment.size)];

  if (attachment.pageCount) {
    details.push(`${attachment.pageCount} trang`);
  }

  if (attachment.sheetCount) {
    details.push(`${attachment.sheetCount} sheet`);
  }

  details.push(`${attachment.textLength.toLocaleString("vi-VN")} ký tự`);

  if (attachment.truncated) {
    details.push("đã rút gọn");
  }

  return details.join(" • ");
}

function isImageAttachment(attachment: ChatAttachment): attachment is ImageAttachment {
  return attachment.kind === "image" || "dataUrl" in attachment;
}

function isSpreadsheetAttachment(attachment: DocumentAttachment) {
  return /spreadsheet|excel|csv/i.test(attachment.mimeType) || /\.(xlsx|csv)$/i.test(attachment.name);
}

function hasDraggedFile(dataTransfer: DataTransfer) {
  return Array.from(dataTransfer.items).some((item) => item.kind === "file");
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Cannot read image"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Cannot read image"));
    reader.readAsDataURL(file);
  });
}
