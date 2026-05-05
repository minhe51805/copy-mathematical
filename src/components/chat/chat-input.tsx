"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
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
import { FormulaStudio, type FormulaInsertPayload } from "./formula-studio";
import { MathRenderer } from "./math-renderer";

interface ChatInputProps {
  onSend: (message: string, attachments?: ChatAttachment[]) => void;
  isLoading: boolean;
}

type FormulaChip = FormulaInsertPayload & {
  id: string;
  attachmentId?: string;
};

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [formulaChips, setFormulaChips] = useState<FormulaChip[]>([]);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isFormulaStudioOpen, setIsFormulaStudioOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);

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

  const handleFiles = useCallback(async (files: Iterable<File> | FileList | null) => {
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
  }, [attachments.length]);

  useEffect(() => {
    const resetDragState = () => {
      dragDepthRef.current = 0;
      setIsDraggingFile(false);
    };

    const handleWindowDragEnter = (event: DragEvent) => {
      if (!event.dataTransfer || !hasDraggedFile(event.dataTransfer)) return;

      event.preventDefault();
      dragDepthRef.current += 1;
      setIsDraggingFile(true);
    };

    const handleWindowDragOver = (event: DragEvent) => {
      if (!event.dataTransfer || !hasDraggedFile(event.dataTransfer)) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setIsDraggingFile(true);
    };

    const handleWindowDragLeave = (event: DragEvent) => {
      if (!event.dataTransfer || !hasDraggedFile(event.dataTransfer)) return;

      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      const leftWindow =
        event.clientX <= 0 ||
        event.clientY <= 0 ||
        event.clientX >= window.innerWidth ||
        event.clientY >= window.innerHeight;

      if (dragDepthRef.current === 0 || leftWindow) {
        resetDragState();
      }
    };

    const handleWindowDrop = (event: DragEvent) => {
      if (!event.dataTransfer || !hasDraggedFile(event.dataTransfer)) return;

      event.preventDefault();
      resetDragState();
      void handleFiles(event.dataTransfer.files);
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("drop", handleWindowDrop);
    window.addEventListener("blur", resetDragState);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("drop", handleWindowDrop);
      window.removeEventListener("blur", resetDragState);
    };
  }, [handleFiles]);

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files).filter(isSupportedAttachmentFile);

    if (!files.length) return;

    event.preventDefault();
    void handleFiles(files);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
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
    if ((!input.trim() && attachments.length === 0 && formulaChips.length === 0) || isLoading || isProcessingFiles) return;
    const contentToSend = [
      input.trim(),
      ...formulaChips.map((formula) =>
        formula.kind === "math"
          ? formula.markdown.trim()
          : "[Bản vẽ công thức được đính kèm dưới dạng ảnh.]"
      ),
    ].filter(Boolean).join("\n\n");

    onSend(contentToSend, attachments);
    setInput("");
    setFormulaChips([]);
    setAttachments([]);
    setAttachmentError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const insertFormulaChip = (value: FormulaInsertPayload) => {
    if (value.kind === "drawing") {
      if (attachments.length >= MAX_ATTACHMENTS) {
        setAttachmentError(`Tối đa ${MAX_ATTACHMENTS} file mỗi lần gửi.`);
        return;
      }

      const attachmentId = generateId();
      setAttachments((current) => [
        ...current,
        {
          id: attachmentId,
          name: "math-drawing.png",
          mimeType: "image/png",
          kind: "image",
          dataUrl: value.imageDataUrl,
          size: estimateDataUrlSize(value.imageDataUrl),
        },
      ]);
      setFormulaChips((current) => [
        ...current,
        {
          ...value,
          id: generateId(),
          attachmentId,
        },
      ]);
      window.requestAnimationFrame(() => textareaRef.current?.focus());
      return;
    }

    setFormulaChips((current) => [
      ...current,
      {
        ...value,
        id: generateId(),
      },
    ]);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const removeFormulaChip = (id: string) => {
    setFormulaChips((current) => {
      const removed = current.find((formula) => formula.id === id);
      if (removed?.kind === "drawing" && removed.attachmentId) {
        setAttachments((attachmentsValue) =>
          attachmentsValue.filter((attachment) => attachment.id !== removed.attachmentId)
        );
      }

      return current.filter((formula) => formula.id !== id);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = (input.trim().length > 0 || attachments.length > 0 || formulaChips.length > 0) && !isLoading && !isProcessingFiles;
  const formulaAttachmentIds = new Set(
    formulaChips
      .filter((formula) => formula.kind === "drawing" && formula.attachmentId)
      .map((formula) => formula.attachmentId)
  );
  const visibleAttachments = attachments.filter((attachment) => !formulaAttachmentIds.has(attachment.id));

  return (
    <div className="shrink-0 bg-background px-3 pb-3 pt-2 md:px-6 md:pb-5">
      {isDraggingFile && (
        <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm">
          <div className="flex w-full max-w-lg flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-foreground/40 bg-card px-6 py-10 text-center shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground">
              {isProcessingFiles ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Paperclip className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="text-base font-semibold">Thả file để thêm vào chat</p>
              <p className="mt-1 text-sm text-muted-foreground">Ảnh, PDF, DOCX, Excel hoặc CSV</p>
            </div>
          </div>
        </div>
      )}
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
          {formulaChips.length > 0 && (
            <div className="mb-3 grid gap-2 px-1">
              {formulaChips.map((formula) => (
                <FormulaPreviewChip
                  key={formula.id}
                  formula={formula}
                  onRemove={() => removeFormulaChip(formula.id)}
                />
              ))}
            </div>
          )}

          {visibleAttachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2 px-1">
              {visibleAttachments.map((attachment) => (
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
        onInsert={insertFormulaChip}
      />
    </div>
  );
}

function FormulaPreviewChip({
  formula,
  onRemove,
}: {
  formula: FormulaChip;
  onRemove: () => void;
}) {
  if (formula.kind === "drawing") {
    return (
      <div className="group relative rounded-2xl border bg-muted px-3 py-2 pr-10">
        <img
          src={formula.imageDataUrl}
          alt="Bản vẽ công thức"
          className="max-h-36 w-full rounded-xl bg-white object-contain"
        />
        <RemoveAttachmentButton onRemove={onRemove} label="Xóa bản vẽ" />
      </div>
    );
  }

  return (
    <div className="group relative rounded-2xl border bg-muted px-3 py-2 pr-10">
      <div
        data-font={formula.font}
        data-italic={formula.isItalic ? "on" : "off"}
        className="formula-chat-chip-preview min-w-0 overflow-x-auto text-[15px]"
      >
        <MathRenderer content={formula.markdown} />
      </div>
      <RemoveAttachmentButton onRemove={onRemove} label="Xóa công thức" />
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

function estimateDataUrlSize(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.round((base64.length * 3) / 4);
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
