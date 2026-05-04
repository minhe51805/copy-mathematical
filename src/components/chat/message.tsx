"use client";

import { useRef, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { copyRenderedContent } from "@/lib/clipboard";
import { formatTimestamp } from "@/lib/math-utils";
import type { Message as MessageType } from "@/types";
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
            <MathRenderer
              content={message.content}
              isUser={isUser}
            />
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
