"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { ArrowUp, ImageIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateId } from "@/lib/math-utils";
import { cn } from "@/lib/utils";
import type { ImageAttachment } from "@/types";

interface ChatInputProps {
  onSend: (message: string, attachments?: ImageAttachment[]) => void;
  isLoading: boolean;
}

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
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

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    setAttachmentError(null);
    const nextAttachments: ImageAttachment[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setAttachmentError("Chỉ hỗ trợ file ảnh.");
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setAttachmentError("Ảnh tối đa 5MB.");
        continue;
      }

      if (attachments.length + nextAttachments.length >= MAX_IMAGES) {
        setAttachmentError("Tối đa 4 ảnh mỗi lần gửi.");
        break;
      }

      const dataUrl = await readFileAsDataUrl(file);
      nextAttachments.push({
        id: generateId(),
        name: file.name,
        mimeType: file.type,
        dataUrl,
        size: file.size,
      });
    }

    if (nextAttachments.length) {
      setAttachments((current) => [...current, ...nextAttachments].slice(0, MAX_IMAGES));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
  };

  const handleSubmit = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    onSend(input, attachments);
    setInput("");
    setAttachments([]);
    setAttachmentError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = (input.trim().length > 0 || attachments.length > 0) && !isLoading;

  return (
    <div className="shrink-0 bg-background px-3 pb-3 pt-2 md:px-6 md:pb-5">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-[28px] border bg-card px-3 py-3 shadow-sm transition-colors focus-within:border-muted-foreground/50">
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2 px-1">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="group relative h-16 w-16 overflow-hidden rounded-xl border bg-muted"
                >
                  <img
                    src={attachment.dataUrl}
                    alt={attachment.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm opacity-90 transition-opacity hover:opacity-100"
                    aria-label="Xóa ảnh"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex min-h-[32px] items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => void handleFiles(event.target.files)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              disabled={isLoading || attachments.length >= MAX_IMAGES}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Thêm ảnh"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi bài toán bất kỳ"
              className="max-h-[200px] min-h-[28px] flex-1 resize-none border-0 bg-transparent px-2 py-1 text-[15px] leading-6 shadow-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-[15px]"
              disabled={isLoading}
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
          AI có thể mắc lỗi. Hãy kiểm tra kết quả quan trọng.
        </p>
      </div>
    </div>
  );
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
