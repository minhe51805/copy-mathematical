"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { Check, Copy, Download, FileText, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { copyRenderedContent } from "@/lib/clipboard";
import { formatFileSize } from "@/lib/file-extraction";
import { formatTimestamp } from "@/lib/math-utils";
import type { ChatAttachment, DocumentAttachment, ImageAttachment, Message as MessageType } from "@/types";
import { cn } from "@/lib/utils";
import { MathRenderer } from "./math-renderer";

interface MessageProps {
  message: MessageType;
  onExport?: (content: string) => void;
}

export function Message({ message, onExport }: MessageProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    if (isCopying) return;

    setIsCopying(true);
    try {
      await copyRenderedContent(contentRef.current, message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setIsCopying(false);
    }
  };

  const handleExport = () => {
    onExport?.(message.content);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "group/message relative min-w-0 transition-colors",
            isUser
              ? "max-w-[min(80%,42rem)] rounded-3xl bg-[#303030] px-4 py-2.5 text-[#f4f4f4]"
              : "w-full max-w-none py-1 text-foreground"
          )}
        >
          <div
            ref={contentRef}
            className={cn(
              "text-[15px] leading-7",
              isUser ? "text-[#f4f4f4]" : "text-foreground"
            )}
          >
            {message.attachments?.length ? (
              <div className="mb-3 flex max-w-[24rem] flex-wrap gap-2">
                {message.attachments.map((attachment) => (
                  <MessageAttachment
                    key={attachment.id}
                    attachment={attachment}
                    isUser={isUser}
                  />
                ))}
              </div>
            ) : null}
            {message.content.trim() ? (
              <MathRenderer
                content={message.content}
                isUser={isUser}
              />
            ) : null}
          </div>

          <div
            className={cn(
              "mt-2 flex items-center gap-1 opacity-70 transition-opacity group-hover/message:opacity-100",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            <span
              className={cn(
                "px-1 text-xs",
                isUser ? "text-white/55" : "text-muted-foreground"
              )}
            >
              {formatTimestamp(message.timestamp)}
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 rounded-lg",
                    isUser
                      ? "text-white/70 hover:bg-white/10 hover:text-white"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                  onClick={handleCopy}
                  disabled={isCopying}
                  aria-label="Sao chép nội dung"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied ? "Đã sao chép định dạng" : "Sao chép định dạng"}</p>
              </TooltipContent>
            </Tooltip>

            {!isUser && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={handleExport}
                    aria-label="Tạo file từ nội dung này"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Xuất file</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function MessageAttachment({
  attachment,
  isUser,
}: {
  attachment: ChatAttachment;
  isUser: boolean;
}) {
  if (isImageAttachment(attachment)) {
    return (
      <a
        href={attachment.dataUrl}
        target="_blank"
        rel="noreferrer"
        className="block h-32 w-40 overflow-hidden rounded-xl border border-white/10 bg-black/10"
      >
        <img
          src={attachment.dataUrl}
          alt={attachment.name}
          className="h-full w-full object-cover"
        />
      </a>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-16 w-full max-w-[24rem] items-center gap-3 rounded-xl border px-3 py-2",
        isUser ? "border-white/10 bg-white/10" : "bg-muted"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          isUser ? "bg-black/10 text-white/75" : "bg-background text-muted-foreground"
        )}
      >
        {isSpreadsheetAttachment(attachment) ? (
          <Table2 className="h-4 w-4" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{attachment.name}</p>
        <p className={cn("truncate text-xs", isUser ? "text-white/60" : "text-muted-foreground")}>
          {getDocumentAttachmentSummary(attachment)}
        </p>
      </div>
    </div>
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
