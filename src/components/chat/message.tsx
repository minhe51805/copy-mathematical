"use client";

/* eslint-disable @next/next/no-img-element */
import { memo, useRef, useState, useEffect } from "react";
import { Brain, Check, CheckCircle2, ChevronDown, Copy, Download, FileText, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { copyRenderedContent, writeRenderedSelectionToClipboard } from "@/lib/clipboard";
import { formatFileSize } from "@/lib/file-extraction";
import { formatTimestamp, sanitizeAssistantContent } from "@/lib/math-utils";
import type { ChatAttachment, DocumentAttachment, ImageAttachment, Message as MessageType } from "@/types";
import { cn } from "@/lib/utils";
import { MathRenderer } from "./math-renderer";
import { TestPdfActions } from "./test-pdf-actions";

interface MessageProps {
  message: MessageType;
  onExport?: (content: string, request?: string | null) => void;
  testPaperContent?: string;
  isLoading?: boolean;
  isLast?: boolean;
  isComplex?: boolean;
}

function parseThinkingContent(content: string) {
  const thinkStartTag = "<think>";
  const thinkEndTag = "</think>";
  const thinkStartIdx = content.indexOf(thinkStartTag);
  
  if (thinkStartIdx === -1) {
    return { thinking: null, content, isThinkingActive: false };
  }
  
  const prefix = content.slice(0, thinkStartIdx).trim();
  const thinkEndIdx = content.indexOf(thinkEndTag, thinkStartIdx);
  
  if (thinkEndIdx === -1) {
    return {
      thinking: content.slice(thinkStartIdx + thinkStartTag.length),
      content: prefix,
      isThinkingActive: true
    };
  }
  
  const thinking = content.slice(thinkStartIdx + thinkStartTag.length, thinkEndIdx).trim();
  const suffix = content.slice(thinkEndIdx + thinkEndTag.length).trim();
  const finalContent = prefix ? `${prefix}\n\n${suffix}` : suffix;
  
  return {
    thinking,
    content: finalContent,
    isThinkingActive: false
  };
}

interface TypewriterParagraphProps {
  text: string;
  speed?: number;
}

function TypewriterParagraph({ text, speed = 8 }: TypewriterParagraphProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    setIsTyping(true);

    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        if (index < text.length) {
          const nextChar = text.charAt(index);
          index++;
          return prev + nextChar;
        } else {
          clearInterval(interval);
          setIsTyping(false);
          return prev;
        }
      });
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <p className="leading-relaxed mb-2 last:mb-0">
      {displayedText}
      {isTyping && (
        <span className="inline-block w-1.5 h-3.5 ml-1 bg-[hsl(var(--terracotta))] animate-[pulse_0.8s_infinite] align-middle rounded-sm" />
      )}
    </p>
  );
}

interface ThinkingAccordionProps {
  thinking: string;
  isActive: boolean;
  isPlaceholder?: boolean;
}

function ThinkingAccordion({ thinking, isActive, isPlaceholder = false }: ThinkingAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      setIsExpanded(true);
    }
  }, [isActive]);

  if (!thinking.trim()) return null;

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-border/30 bg-muted/25 backdrop-blur-[2px] transition-all duration-200">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/30"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2.5 text-[13px] font-medium text-muted-foreground select-none">
          <span className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full bg-primary/5 text-primary transition-all duration-300",
            isActive && "animate-pulse bg-primary/10"
          )}>
            <Brain className="h-3.5 w-3.5 text-[hsl(var(--terracotta))]" />
          </span>
          <span className="flex items-center gap-2">
            <span className="font-semibold text-foreground/80">Suy nghĩ của AI</span>
            {isActive ? (
              <span className="flex items-center gap-1.5 text-[11px] font-normal text-[hsl(var(--terracotta))]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--terracotta))] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[hsl(var(--terracotta))]"></span>
                </span>
                Đang suy nghĩ...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-normal text-emerald-600 dark:text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Đã suy nghĩ xong
              </span>
            )}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground/60 transition-transform duration-300 ease-in-out",
            isExpanded && "rotate-180"
          )}
        />
      </button>
      
      {isExpanded && (
        <div className="border-t border-border/10 px-4 pb-3.5 pt-2.5 transition-all duration-300 animate-in fade-in slide-in-from-top-1">
          <div className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-muted-foreground/80 border-l-2 border-[hsl(var(--terracotta))]/30 dark:border-[hsl(var(--terracotta))]/50 pl-3.5 ml-1">
            {isPlaceholder ? (
              <div className="flex flex-col">
                {thinking.split("\n\n").map((para, idx) => (
                  <TypewriterParagraph key={idx} text={para} />
                ))}
              </div>
            ) : (
              thinking
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const CLAUDE_STYLE_THOUGHTS = [
  "Hmm, để mình đọc kỹ yêu cầu đề bài xem sao... Có vẻ khá thú vị đây!",
  "Ủa, nhưng mà có chi tiết hay điều kiện ẩn nào cần lưu ý đặc biệt ở đây không nhỉ? Để xem...",
  "À! Nếu đi theo cách thông thường thì có bị dài dòng hay dễ nhầm lẫn quá không ta?",
  "Để mình thử nghĩ xem có hướng tiếp cận nào ngắn gọn, trực quan và tối ưu hơn không nhé.",
  "Nhưng khoan đã... Điều kiện xác định ở đây là gì ta? x có cần khác không hay lớn hơn không?",
  "À đúng rồi, x phải dương vì nằm trong căn thức, tí nữa thì mình quên mất điều này, may quá!",
  "Thế còn trường hợp đặc biệt nào khác không nhỉ? Thử nhẩm nháp nhanh xem số liệu có khớp không...",
  "Ồ, tính nhẩm thử thì kết quả ra rất tròn và đẹp. Hướng đi này hoàn toàn chính xác rồi!",
  "Mà trình bày thế nào để bạn ấy dễ hiểu nhất nhỉ? Có nên chia nhỏ ra thành từng bước giải thích không?",
  "Chắc chắn rồi! Cứ viết thật chi tiết, giải thích rõ lý do ở từng bước để bạn ấy nắm bắt bản chất.",
  "Được rồi, hướng suy nghĩ đã cực kỳ mạch lạc rồi. Mình chuẩn bị trình bày chi tiết đây..."
];

function MessageComponent({ message, onExport, testPaperContent, isLoading, isLast, isComplex = false }: MessageProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const isUser = message.role === "user";
  const isProviderFallback = isProviderFallbackMessage(message.content)
    || isProviderFallbackMessage(message.exportSource?.content ?? "");

  const [cumulativeThoughts, setCumulativeThoughts] = useState<string[]>([]);

  let parsed = parseThinkingContent(message.content);

  useEffect(() => {
    if (!isLoading || !isLast || !isComplex) {
      setCumulativeThoughts([]);
      return;
    }

    const hasActualThinking = parsed.thinking && parsed.thinking.trim().length > 0;
    if (hasActualThinking) {
      return;
    }

    setCumulativeThoughts((prev) => prev.length === 0 ? [CLAUDE_STYLE_THOUGHTS[0]] : prev);

    const interval = setInterval(() => {
      setCumulativeThoughts((prev) => {
        if (prev.length >= CLAUDE_STYLE_THOUGHTS.length) {
          return prev;
        }
        return [...prev, CLAUDE_STYLE_THOUGHTS[prev.length]];
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isLoading, isLast, isComplex, parsed.thinking]);

  const monologueText = cumulativeThoughts.join("\n\n");
  let isPlaceholder = false;

  if (!isUser) {
    if (isLoading && isLast) {
      if (isComplex) {
        if (!message.content.trim()) {
          isPlaceholder = true;
          parsed = {
            thinking: monologueText || CLAUDE_STYLE_THOUGHTS[0],
            content: "",
            isThinkingActive: true
          };
        } else if (message.content.includes("<think>")) {
          if (!parsed.thinking?.trim()) {
            isPlaceholder = true;
            parsed = {
              thinking: monologueText || CLAUDE_STYLE_THOUGHTS[0],
              content: parsed.content || "",
              isThinkingActive: true
            };
          }
        } else {
          // If it started streaming normal text but has no <think> tag, do not show any thinking accordion!
          parsed = {
            thinking: null,
            content: message.content,
            isThinkingActive: false
          };
        }
      }
    }
  }

  const handleCopy = async () => {
    if (isCopying) return;

    setIsCopying(true);
    try {
      await copyRenderedContent(contentRef.current, parsed.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setIsCopying(false);
    }
  };

  const handleExport = () => {
    onExport?.(message.exportSource?.content ?? parsed.content, message.exportSource?.request);
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
              ? "max-w-[min(80%,42rem)] rounded-xl border border-border/10 bg-[var(--message-user-bg)] px-4 py-3 text-foreground shadow-[var(--shadow-sm)]"
              : "w-full max-w-none py-1 text-foreground"
          )}
        >
          <div className={cn("text-[15px] leading-[1.65]")}>
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

            {!isUser && parsed.thinking && (
              <ThinkingAccordion
                thinking={parsed.thinking}
                isActive={parsed.isThinkingActive}
                isPlaceholder={isPlaceholder}
              />
            )}

            {!isUser && !parsed.thinking && !parsed.content.trim() && isLoading && isLast && (
              <div className="flex flex-col gap-2.5 py-2 animate-pulse">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[hsl(var(--terracotta))]/80 animate-bounce [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 rounded-full bg-[hsl(var(--terracotta))]/80 animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 rounded-full bg-[hsl(var(--terracotta))]/80 animate-bounce" />
                  <span className="ml-2 text-[13px] font-medium text-muted-foreground/80 select-none tracking-wide">
                    Mình đang soạn câu trả lời...
                  </span>
                </div>
                <div className="space-y-2 mt-1 max-w-[16rem]">
                  <div className="h-1.5 rounded-full bg-muted-foreground/10 w-full" />
                  <div className="h-1.5 rounded-full bg-muted-foreground/10 w-3/4" />
                </div>
              </div>
            )}

            {parsed.content.trim() ? (
              <div
                ref={contentRef}
                data-font="mathtype"
                onCopy={(event) => {
                  writeRenderedSelectionToClipboard(event.nativeEvent, contentRef.current, parsed.content);
                }}
              >
                <MathRenderer
                  content={parsed.content}
                  isUser={isUser}
                />
              </div>
            ) : null}
          </div>

          {!isUser && !isProviderFallback && message.exportSource && onExport && (
            <ExportDocumentCard
              content={message.exportSource.content}
              request={message.exportSource.request}
              onOpen={handleExport}
            />
          )}

          {!isUser && testPaperContent && (
            <TestPdfActions content={testPaperContent} />
          )}

          <div
            className={cn(
              "mt-3 flex items-center gap-1 opacity-70 transition-opacity group-hover/message:opacity-100",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            <span
              className={cn(
                "px-1 text-xs",
                isUser ? "text-muted-foreground" : "text-muted-foreground"
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
                    "h-8 w-8 rounded-lg",
                    isUser
                      ? "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
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

            {!isUser && !isProviderFallback && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
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

export const Message = memo(MessageComponent, (previous, next) =>
  previous.message === next.message
  && previous.onExport === next.onExport
  && previous.testPaperContent === next.testPaperContent
  && previous.isLoading === next.isLoading
  && previous.isLast === next.isLast
  && previous.isComplex === next.isComplex
);

function ExportDocumentCard({
  content,
  request,
  onOpen,
}: {
  content: string;
  request?: string | null;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="claude-card claude-card-hover mt-4 flex w-full max-w-[27rem] items-center justify-between gap-3 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      aria-label="Mở lại modal xuất nội dung câu trả lời này"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-[hsl(var(--terracotta))]">
          <FileText className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">
            {getExportDocumentTitle(content, request)}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            Document · Word
          </span>
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/20 bg-card px-3 py-1.5 text-sm text-foreground">
        Open
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </span>
    </button>
  );
}

function getExportDocumentTitle(content: string, request?: string | null) {
  const firstUsefulLine = (content || request || "")
    .split("\n")
    .map((line) => line
      .replace(/^#{1,6}\s*/, "")
      .replace(/[*_`>|-]/g, "")
      .trim()
    )
    .find((line) => line.length > 0 && !line.startsWith("\\[") && !line.startsWith("$$"));

  if (!firstUsefulLine) {
    return "Câu trả lời AI.doc";
  }

  const compactTitle = firstUsefulLine
    .replace(/\s+/g, " ")
    .slice(0, 42)
    .trim();

  return `${compactTitle}${firstUsefulLine.length > 42 ? "..." : ""}.doc`;
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
        className="block h-32 w-40 overflow-hidden rounded-xl border border-border/15 bg-card shadow-[var(--shadow-sm)]"
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
        "flex min-h-16 w-full max-w-[24rem] items-center gap-3 rounded-xl border px-3 py-2 shadow-[var(--shadow-sm)]",
        isUser ? "bg-card/70" : "bg-card"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          isUser ? "bg-secondary text-muted-foreground" : "bg-secondary text-muted-foreground"
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
        <p className="truncate text-xs text-muted-foreground">
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
