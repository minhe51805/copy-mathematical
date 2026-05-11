"use client";

/* eslint-disable @next/next/no-img-element */
import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUp,
  Bot,
  ChevronDown,
  ChevronUp,
  FileSearch,
  FileText,
  Lightbulb,
  Loader2,
  Paperclip,
  SendHorizonal,
  Sigma,
  Sparkles,
  Table2,
  UploadCloud,
  X,
} from "lucide-react";
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
import { clearPendingGuestPrompt, getPendingGuestPrompt } from "@/lib/guest-access";
import { cn } from "@/lib/utils";
import type { ChatAttachment, DocumentAttachment, ImageAttachment } from "@/types";
import { FormulaStudio, type FormulaInsertPayload } from "./formula-studio";
import { MathRenderer } from "./math-renderer";

interface ChatInputProps {
  onSend: (message: string, attachments?: ChatAttachment[]) => void | boolean | Promise<void | boolean>;
  isLoading: boolean;
  attachments: ChatAttachment[];
  onAttachmentsChange: Dispatch<SetStateAction<ChatAttachment[]>>;
  placeholder?: string;
  isTeacherWorkspace?: boolean;
}

type FormulaChip = FormulaInsertPayload & {
  id: string;
  attachmentId?: string;
};

type TeacherFilePrompt = {
  id: string;
  title: string;
  description: string;
  prompt: string;
};

const AI_IMAGE_MAX_EDGE = 1280;
const AI_IMAGE_QUALITY = 0.78;
const AI_IMAGE_MIME_TYPE = "image/jpeg";

export function ChatInput({
  onSend,
  isLoading,
  attachments,
  onAttachmentsChange,
  placeholder = "Hỏi bài toán bất kỳ",
  isTeacherWorkspace = false,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [formulaChips, setFormulaChips] = useState<FormulaChip[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isFormulaStudioOpen, setIsFormulaStudioOpen] = useState(false);
  const [isFileDockOpen, setIsFileDockOpen] = useState(true);
  const [isFileDockCollapsed, setIsFileDockCollapsed] = useState(true);
  const [isAnalyzingFiles, setIsAnalyzingFiles] = useState(false);
  const [teacherPromptSuggestions, setTeacherPromptSuggestions] = useState<TeacherFilePrompt[]>([]);
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
    const pendingPrompt = getPendingGuestPrompt();
    if (!pendingPrompt) return;

    const timer = window.setTimeout(() => {
      const promptToSend = getPendingGuestPrompt();
      if (!promptToSend) return;

      clearPendingGuestPrompt();
      onSend(promptToSend, []);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [onSend]);

  useEffect(() => {
    const handleSuggestion = (event: Event) => {
      const customEvent = event as CustomEvent<string | { text?: string }>;
      const nextText = typeof customEvent.detail === "string"
        ? customEvent.detail
        : customEvent.detail?.text;

      if (!nextText) return;

      setInput(nextText);
      window.requestAnimationFrame(() => textareaRef.current?.focus());
    };
    const handleOpenFormulaStudio = () => {
      setIsFormulaStudioOpen(true);
    };
    const handleOpenFilePicker = () => {
      if (isTeacherWorkspace) {
        setIsFileDockOpen(true);
        setIsFileDockCollapsed(false);
      }
      fileInputRef.current?.click();
    };
    window.addEventListener("suggestion-click", handleSuggestion as EventListener);
    window.addEventListener("open-formula-studio", handleOpenFormulaStudio);
    window.addEventListener("open-file-picker", handleOpenFilePicker);
    return () => {
      window.removeEventListener("suggestion-click", handleSuggestion as EventListener);
      window.removeEventListener("open-formula-studio", handleOpenFormulaStudio);
      window.removeEventListener("open-file-picker", handleOpenFilePicker);
    };
  }, [isTeacherWorkspace]);

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

          const optimizedImage = await readOptimizedImageAsDataUrl(file);
          nextAttachments.push({
            id: generateId(),
            name: file.name || "clipboard-image.png",
            mimeType: optimizedImage.mimeType,
            kind: "image",
            dataUrl: optimizedImage.dataUrl,
            size: optimizedImage.size,
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
      onAttachmentsChange((current) => [...current, ...nextAttachments].slice(0, MAX_ATTACHMENTS));
      if (isTeacherWorkspace) {
        setIsFileDockOpen(true);
        setIsFileDockCollapsed(false);
        setTeacherPromptSuggestions([]);
      }
      textareaRef.current?.focus();
    }

    setAttachmentError(errors.at(-1) ?? null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [attachments.length, isTeacherWorkspace, onAttachmentsChange]);

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
      if (isTeacherWorkspace) {
        setIsFileDockOpen(true);
        setIsFileDockCollapsed(false);
      }
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
  }, [handleFiles, isTeacherWorkspace]);

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
    onAttachmentsChange((current) => current.filter((attachment) => attachment.id !== id));
    setTeacherPromptSuggestions([]);
  };

  const handleSubmit = async () => {
    if ((!input.trim() && attachments.length === 0 && formulaChips.length === 0) || isLoading || isProcessingFiles) return;
    const rawContentToSend = [
      input.trim(),
      ...formulaChips.map((formula) =>
        formula.kind === "math"
          ? formula.markdown.trim()
          : "[Bản vẽ công thức được đính kèm dưới dạng ảnh.]"
      ),
    ].filter(Boolean).join("\n\n");
    const contentToSend = isTeacherWorkspace
      ? compactTeacherPromptForAttachments(rawContentToSend, attachments)
      : rawContentToSend;

    const sendResult = await onSend(contentToSend, attachments);
    if (sendResult === false) return;

    setInput("");
    setFormulaChips([]);
    onAttachmentsChange([]);
    setAttachmentError(null);
    setTeacherPromptSuggestions([]);
    if (isTeacherWorkspace) {
      setIsFileDockOpen(true);
      setIsFileDockCollapsed(true);
    }
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
      onAttachmentsChange((current) => [
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
        onAttachmentsChange((attachmentsValue) =>
          attachmentsValue.filter((attachment) => attachment.id !== removed.attachmentId)
        );
      }

      return current.filter((formula) => formula.id !== id);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const canSend = (input.trim().length > 0 || attachments.length > 0 || formulaChips.length > 0) && !isLoading && !isProcessingFiles;
  const formulaAttachmentIds = new Set(
    formulaChips
      .filter((formula) => formula.kind === "drawing" && formula.attachmentId)
      .map((formula) => formula.attachmentId)
  );
  const visibleAttachments = attachments.filter((attachment) => !formulaAttachmentIds.has(attachment.id));
  const teacherFiles = useMemo(
    () => getTeacherFileAttachments(attachments, formulaChips),
    [attachments, formulaChips]
  );
  const canAnalyzeTeacherFiles = isTeacherWorkspace && teacherFiles.length > 0 && !isAnalyzingFiles;

  const openTeacherFilePicker = () => {
    if (isTeacherWorkspace) {
      setIsFileDockOpen(true);
      setIsFileDockCollapsed(false);
    }
    fileInputRef.current?.click();
  };

  const analyzeTeacherFiles = () => {
    if (!teacherFiles.length || isAnalyzingFiles) return;

    setIsAnalyzingFiles(true);
    window.setTimeout(() => {
      setTeacherPromptSuggestions(buildTeacherFilePromptSuggestions(teacherFiles));
      setIsAnalyzingFiles(false);
    }, 450);
  };

  const useTeacherPrompt = (prompt: string, sendNow = false) => {
    const nextPrompt = compactTeacherPromptForAttachments(prompt, attachments);

    if (sendNow) {
      onSend(nextPrompt, attachments);
      setInput("");
      setFormulaChips([]);
      onAttachmentsChange([]);
      setTeacherPromptSuggestions([]);
      setIsFileDockOpen(true);
      setIsFileDockCollapsed(true);
      return;
    }

    setInput(nextPrompt);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const dragOverlay = !isTeacherWorkspace && typeof document !== "undefined" && isDraggingFile
    ? createPortal(
        <div
          className="pointer-events-auto fixed inset-0 z-[9999] grid place-items-center bg-background/90 p-6 backdrop-blur-sm"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="flex w-full max-w-md flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[hsl(var(--terracotta))] bg-card px-8 py-10 text-center shadow-[var(--shadow-md)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))]">
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
        </div>,
        document.body
      )
    : null;
  const teacherFileDock = isTeacherWorkspace && isFileDockOpen && typeof document !== "undefined"
    ? createPortal(
        <TeacherFileDock
          files={teacherFiles}
          isCollapsed={isFileDockCollapsed}
          isDraggingFile={isDraggingFile}
          isProcessingFiles={isProcessingFiles}
          isAnalyzingFiles={isAnalyzingFiles}
          suggestions={teacherPromptSuggestions}
          canAnalyze={canAnalyzeTeacherFiles}
          error={attachmentError}
          onCollapse={() => setIsFileDockCollapsed((value) => !value)}
          onClose={() => {
            setIsFileDockOpen(true);
            setIsFileDockCollapsed(true);
          }}
          onChooseFile={openTeacherFilePicker}
          onAnalyze={analyzeTeacherFiles}
          onUsePrompt={useTeacherPrompt}
          onRemoveFile={removeAttachment}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        />,
        document.body
      )
    : null;

  return (
    <>
      {dragOverlay}
      {teacherFileDock}
      <div className="shrink-0 border-t bg-background/95 px-3 pb-4 pt-3 backdrop-blur sm:px-4 md:px-6 md:pb-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div
          className={cn(
            "rounded-xl border border-border/15 bg-card px-3 py-3 shadow-[var(--shadow-sm)] transition-all focus-within:border-border/40 focus-within:shadow-[var(--shadow-md)]"
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
              className="h-10 w-10 shrink-0 rounded-lg text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
              disabled={isLoading || isProcessingFiles || attachments.length >= MAX_ATTACHMENTS}
              onClick={openTeacherFilePicker}
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
              className="h-10 w-10 shrink-0 rounded-lg text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
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
              placeholder={placeholder}
              className="max-h-[200px] min-h-[34px] flex-1 resize-none border-0 bg-transparent px-2 py-1 text-[15px] leading-6 text-foreground shadow-none placeholder:text-foreground/55 focus-visible:border-transparent focus-visible:ring-0 disabled:text-muted-foreground disabled:placeholder:text-muted-foreground/70 md:text-[15px]"
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
                onClick={() => void handleSubmit()}
                disabled={!canSend}
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-lg transition-colors",
                  canSend
                    ? "bg-[#1F1E1D] text-white hover:bg-[#141413] dark:bg-[#FAF9F5] dark:text-[#1F1E1D]"
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
    </>
  );
}

function TeacherFileDock({
  files,
  isCollapsed,
  isDraggingFile,
  isProcessingFiles,
  isAnalyzingFiles,
  suggestions,
  canAnalyze,
  error,
  onCollapse,
  onClose,
  onChooseFile,
  onAnalyze,
  onUsePrompt,
  onRemoveFile,
  onDrop,
  onDragOver,
  onDragLeave,
}: {
  files: ChatAttachment[];
  isCollapsed: boolean;
  isDraggingFile: boolean;
  isProcessingFiles: boolean;
  isAnalyzingFiles: boolean;
  suggestions: TeacherFilePrompt[];
  canAnalyze: boolean;
  error: string | null;
  onCollapse: () => void;
  onClose: () => void;
  onChooseFile: () => void;
  onAnalyze: () => void;
  onUsePrompt: (prompt: string, sendNow?: boolean) => void;
  onRemoveFile: (id: string) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
}) {
  if (isCollapsed) {
    return (
      <div className="pointer-events-none fixed bottom-[6.25rem] right-3 z-[80] sm:right-6">
        <div
          className={cn(
            "pointer-events-auto flex h-12 items-center gap-2 rounded-2xl border bg-card px-3 text-left shadow-[0_16px_48px_rgba(0,0,0,0.28)] transition-all hover:-translate-y-0.5 hover:border-border/40 hover:bg-secondary",
            isDraggingFile
              ? "border-[hsl(var(--terracotta))] ring-2 ring-[hsl(var(--terracotta))]/20"
              : "border-border/20"
          )}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <button
            type="button"
            className="flex h-full items-center gap-2 text-left"
            onClick={onCollapse}
            aria-label="Mở khay tài liệu giáo viên"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--terracotta))]/12 text-[hsl(var(--terracotta))]">
              {isProcessingFiles ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block text-xs font-semibold leading-4">Khay tài liệu</span>
              <span className="block text-[11px] leading-4 text-muted-foreground">
                {files.length ? `${files.length} file` : "Kéo file vào đây"}
              </span>
            </span>
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-[6.25rem] left-3 right-3 z-[80] sm:left-auto sm:right-6 sm:w-[390px]">
      <section
        className={cn(
          "pointer-events-auto w-full overflow-hidden rounded-2xl border bg-card shadow-[0_18px_60px_rgba(0,0,0,0.32)] transition-all",
          isDraggingFile
            ? "border-[hsl(var(--terracotta))] ring-2 ring-[hsl(var(--terracotta))]/20"
            : "border-border/20"
        )}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <header className="flex items-center justify-between gap-2 border-b border-border/15 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--terracotta))]/12 text-[hsl(var(--terracotta))]">
              <FileSearch className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold">Khay tài liệu giáo viên</h3>
              <p className="truncate text-xs text-muted-foreground">
                {files.length > 0
                  ? `${files.length} file đang chờ gửi - có thể nhờ AI gợi ý prompt trước`
                  : "Kéo PDF, Word, Excel hoặc ảnh bài mẫu vào đây"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground"
              onClick={onCollapse}
              aria-label={isCollapsed ? "Mở rộng khay tài liệu" : "Thu gọn khay tài liệu"}
            >
              {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground"
              onClick={onClose}
              aria-label="Đóng khay tài liệu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {!isCollapsed && (
          <div className="grid max-h-[min(68vh,34rem)] gap-3 overflow-y-auto p-3">
            <div className="grid gap-3">
              <button
                type="button"
                onClick={onChooseFile}
                className={cn(
                  "flex min-h-24 items-center justify-center rounded-xl border border-dashed p-3 text-center transition-colors",
                  isDraggingFile
                    ? "border-[hsl(var(--terracotta))] bg-[hsl(var(--terracotta))]/10"
                    : "border-border/25 bg-background/40 hover:bg-secondary"
                )}
              >
                <span className="flex flex-col items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))]">
                    {isProcessingFiles ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                  </span>
                  <span className="text-sm font-semibold">
                    {isDraggingFile ? "Thả file để đưa vào khay" : "Kéo file vào đây hoặc bấm để chọn"}
                  </span>
                  <span className="text-xs text-muted-foreground">Hỗ trợ ảnh, PDF, DOCX, XLSX và CSV</span>
                </span>
              </button>

              {files.length > 0 && (
                <div className="grid max-h-40 gap-2 overflow-y-auto pr-1">
                  {files.map((file) => (
                    <TeacherDockFileItem
                      key={file.id}
                      attachment={file}
                      onRemove={() => onRemoveFile(file.id)}
                    />
                  ))}
                </div>
              )}

              {error && (
                <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>

            <aside className="rounded-xl border border-border/15 bg-background/45 p-3">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-[hsl(var(--terracotta))]">
                  <Bot className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold">Sub-agent gợi ý prompt</h4>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Đọc nhanh tên file và phần text đã trích để đề xuất việc nên làm tiếp theo.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                className="mt-3 h-10 w-full gap-2 rounded-[9.6px] bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--terracotta))]/90"
                disabled={!canAnalyze}
                onClick={onAnalyze}
              >
                {isAnalyzingFiles ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                AI xem file & gợi ý prompt
              </Button>

              <div className="mt-3 grid gap-2">
                {suggestions.length === 0 ? (
                  <div className="rounded-lg border border-border/15 bg-card px-3 py-3 text-xs leading-5 text-muted-foreground">
                    Sau khi thêm file, bấm nút trên để lấy prompt như: soạn giáo án, tạo đề kiểm tra, phiếu học tập hoặc tóm tắt nguồn.
                  </div>
                ) : (
                  suggestions.map((suggestion) => (
                    <TeacherPromptSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onUse={() => onUsePrompt(suggestion.prompt)}
                      onSend={() => onUsePrompt(suggestion.prompt, true)}
                    />
                  ))
                )}
              </div>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}

function TeacherDockFileItem({
  attachment,
  onRemove,
}: {
  attachment: ChatAttachment;
  onRemove: () => void;
}) {
  const isImage = isImageAttachment(attachment);
  const Icon = isSpreadsheetAttachment(attachment) ? Table2 : FileText;

  return (
    <div className="group flex min-w-0 items-center gap-3 rounded-xl border border-border/15 bg-card p-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-muted-foreground">
        {isImage ? (
          <img src={attachment.dataUrl} alt={attachment.name} className="h-full w-full object-cover" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.name || "Tài liệu"}</p>
        <p className="truncate text-xs text-muted-foreground">{getAttachmentSummary(attachment)}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={onRemove}
        aria-label="Xóa file khỏi khay"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function TeacherPromptSuggestionCard({
  suggestion,
  onUse,
  onSend,
}: {
  suggestion: TeacherFilePrompt;
  onUse: () => void;
  onSend: () => void;
}) {
  return (
    <article className="rounded-lg border border-border/15 bg-card p-2.5">
      <div className="flex gap-2">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--terracotta))]" />
        <div className="min-w-0">
          <h5 className="text-sm font-semibold">{suggestion.title}</h5>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{suggestion.description}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" size="sm" className="h-8 flex-1 rounded-lg text-xs" onClick={onUse}>
          Dùng prompt
        </Button>
        <Button type="button" size="sm" className="h-8 flex-1 gap-1 rounded-lg text-xs" onClick={onSend}>
          Gửi luôn
          <SendHorizonal className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
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
      <div className="group relative rounded-xl border border-border/15 bg-secondary px-3 py-2 pr-10">
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
    <div className="group relative rounded-xl border border-border/15 bg-secondary px-3 py-2 pr-10">
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
      <div className="group relative h-16 w-16 overflow-hidden rounded-xl border border-border/15 bg-secondary">
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
    <div className="group relative flex min-h-16 max-w-full items-center gap-3 rounded-xl border border-border/15 bg-secondary px-3 py-2 pr-9 sm:max-w-[19rem]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-muted-foreground">
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
      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-border/15 bg-card text-foreground shadow-[var(--shadow-sm)] opacity-90 transition-opacity hover:opacity-100"
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

function getAttachmentSummary(attachment: ChatAttachment) {
  if (isImageAttachment(attachment)) {
    return `Ảnh · ${formatFileSize(attachment.size)}`;
  }

  return getDocumentAttachmentSummary(attachment);
}

function getTeacherFileAttachments(attachments: ChatAttachment[], formulas: FormulaChip[]) {
  const formulaAttachmentIds = new Set(
    formulas
      .filter((formula) => formula.kind === "drawing" && formula.attachmentId)
      .map((formula) => formula.attachmentId)
  );

  return attachments.filter((attachment) => !formulaAttachmentIds.has(attachment.id));
}

function buildTeacherFilePromptSuggestions(files: ChatAttachment[]): TeacherFilePrompt[] {
  const context = buildTeacherFileContext(files);
  const hasImage = files.some(isImageAttachment);
  const hasSpreadsheet = files.some(isSpreadsheetAttachment);
  const base: TeacherFilePrompt[] = [
    {
      id: "lesson-plan",
      title: "Biến file thành giáo án",
      description: "Phù hợp khi file là bài giảng, chuyên đề, đề cương hoặc tài liệu ôn tập.",
      prompt: [
        "Hãy đọc toàn bộ file tôi vừa đưa lên và đề xuất một giáo án hoàn chỉnh cho giáo viên.",
        context,
        "Yêu cầu đầu ra:",
        "- Nêu mục tiêu bài học theo kiến thức, kỹ năng, năng lực và phẩm chất.",
        "- Chia tiến trình dạy học theo mở đầu, hình thành kiến thức, luyện tập, vận dụng.",
        "- Có câu hỏi gợi mở, hoạt động giáo viên - học sinh, dự kiến đáp án.",
        "- Nếu thiếu khối lớp hoặc thời lượng, hãy hỏi lại trước khi soạn chi tiết.",
      ].join("\n"),
    },
    {
      id: "test-maker",
      title: "Tạo đề kiểm tra từ file",
      description: "Sinh đề, đáp án và thang điểm từ nội dung tài liệu đã tải lên.",
      prompt: [
        "Dựa trên file tôi vừa đưa lên, hãy tạo một đề kiểm tra dùng được ngay.",
        context,
        "Yêu cầu:",
        "- Tạo câu hỏi theo 3 mức: dễ, trung bình, khó.",
        "- Mỗi câu trắc nghiệm có 4 đáp án A/B/C/D, chỉ một đáp án đúng.",
        "- Có file đáp án chi tiết: đáp án đúng, lời giải, thang điểm hoặc ghi chú chấm.",
        "- Không tự bịa phần ngoài tài liệu; nếu cần mở rộng, ghi rõ là phần đề xuất bổ sung.",
      ].join("\n"),
    },
    {
      id: "worksheet",
      title: "Làm phiếu học tập",
      description: "Tạo bài tập phân tầng để phát cho học sinh theo nhóm năng lực.",
      prompt: [
        "Hãy chuyển nội dung file vừa tải lên thành phiếu học tập cho học sinh.",
        context,
        "Cấu trúc mong muốn:",
        "- Phần khởi động ngắn.",
        "- Bài tập nhận biết, thông hiểu, vận dụng và vận dụng cao.",
        "- Chừa khoảng trống trả lời nếu phù hợp.",
        "- Cuối phiếu có đáp án ngắn và lỗi sai thường gặp.",
      ].join("\n"),
    },
    {
      id: "source-review",
      title: "Xem nhanh file và đề xuất cách dùng",
      description: "Cho giáo viên biết file này nên biến thành loại tài liệu nào.",
      prompt: [
        "Hãy đóng vai trợ lý soạn học liệu và xem nhanh file tôi vừa đưa lên.",
        context,
        "Hãy trả lời ngắn gọn theo bảng:",
        "- File này có những phần chính nào?",
        "- Có thể biến thành giáo án, đề kiểm tra, phiếu học tập hay slide không?",
        "- Cần tôi bổ sung thông tin gì trước khi soạn?",
        "- 3 prompt tốt nhất tôi nên dùng tiếp theo.",
      ].join("\n"),
    },
  ];

  if (hasImage) {
    base.unshift({
      id: "image-ocr",
      title: "Nhận dạng ảnh bài mẫu",
      description: "Dành cho ảnh chụp đề, lời giải hoặc bảng viết tay.",
      prompt: [
        "Hãy đọc kỹ ảnh tôi vừa đưa lên, chép lại đề bài và công thức rõ ràng trước.",
        context,
        "Sau đó hãy đề xuất 3 hướng sử dụng cho giáo viên: giải mẫu, tạo bài tương tự, hoặc đưa vào giáo án.",
      ].join("\n"),
    });
  }

  if (hasSpreadsheet) {
    base.unshift({
      id: "spreadsheet-plan",
      title: "Biến bảng Excel thành kế hoạch",
      description: "Dành cho ma trận đề, bảng điểm, danh sách câu hỏi hoặc phân phối bài.",
      prompt: [
        "Hãy phân tích file bảng tính tôi vừa đưa lên và cho biết có thể dùng nó để tạo tài liệu gì.",
        context,
        "Nếu là ma trận hoặc ngân hàng câu hỏi, hãy đề xuất cấu trúc đề kiểm tra và cách chia mức độ.",
      ].join("\n"),
    });
  }

  return base.slice(0, 4);
}

function buildTeacherFileContext(files: ChatAttachment[]) {
  const fileLines = files.map((file, index) => {
    const summary = isImageAttachment(file)
      ? "ảnh"
      : `${file.textLength.toLocaleString("vi-VN")} ký tự${file.truncated ? ", đã rút gọn" : ""}`;
    return `${index + 1}. ${file.name || "Tài liệu"} (${summary})`;
  });

  return [
    "File đã được đính kèm trong tin nhắn này. App sẽ gửi nội dung file qua attached_document; không cần chép lại mẫu nội dung file trong prompt.",
    "Thông tin file:",
    ...fileLines,
  ].filter(Boolean).join("\n");
}

function compactTeacherPromptForAttachments(prompt: string, attachments: ChatAttachment[]) {
  const documentAttachments = attachments.filter(isDocumentAttachment);

  if (!documentAttachments.length) {
    return prompt;
  }

  const compactContext = buildTeacherFileContext(documentAttachments);
  const sectionEndPattern = "(?:Yêu cầu(?: đầu ra)?|Cấu trúc mong muốn|Hãy trả lời ngắn gọn|Sau đó hãy|Nếu là)\\s*:";
  const withCompactFileSection = prompt.replace(
    new RegExp(`\\n?Thông tin file:\\s*[\\s\\S]*?(?=\\n${sectionEndPattern})`, "i"),
    `\n${compactContext}\n`
  );

  return withCompactFileSection
    .replace(
      /\n?Một vài nội dung đọc được:\s*[\s\S]*?(?=\n(?:Yêu cầu(?: đầu ra)?|Cấu trúc mong muốn|Hãy trả lời ngắn gọn|Sau đó hãy|Nếu là)\s*:|$)/i,
      "\n"
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

function hasDraggedFile(dataTransfer: DataTransfer) {
  return Array.from(dataTransfer.items).some((item) => item.kind === "file");
}

function estimateDataUrlSize(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.round((base64.length * 3) / 4);
}

async function readOptimizedImageAsDataUrl(file: File) {
  try {
    const dataUrl = await drawImageToDataUrl(file);
    return {
      dataUrl,
      mimeType: AI_IMAGE_MIME_TYPE,
      size: estimateDataUrlSize(dataUrl),
    };
  } catch {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      dataUrl,
      mimeType: getNormalizedMimeType(file),
      size: file.size,
    };
  }
}

async function drawImageToDataUrl(file: File) {
  const image = await loadImageElement(file);
  const maxEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = maxEdge > AI_IMAGE_MAX_EDGE ? AI_IMAGE_MAX_EDGE / maxEdge : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Cannot optimize image");
  }

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL(AI_IMAGE_MIME_TYPE, AI_IMAGE_QUALITY);
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("Cannot load image"));
    };
    image.src = imageUrl;
  });
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
