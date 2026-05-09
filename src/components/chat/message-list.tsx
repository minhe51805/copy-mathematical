"use client";

import { useEffect, useRef, useState } from "react";
import { Calculator, ChevronDown, FileText, Sparkles, type LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { hasTestPaperContent } from "@/lib/test-paper";
import type { Message as MessageType } from "@/types";
import { cn } from "@/lib/utils";
import { Message } from "./message";

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
  onExport?: (content: string, request?: string | null) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  suggestions?: MessageSuggestion[];
  enableTestPdfExport?: boolean;
}

export interface MessageSuggestion {
  icon: LucideIcon;
  text: string;
  label: string;
}

const SUGGESTIONS: MessageSuggestion[] = [
  { icon: Calculator, text: "Giải phương trình bậc 2: x² + 3x + 2 = 0", label: "Phương trình" },
  { icon: Sparkles, text: "Tính tích phân ∫₀¹ x² dx", label: "Tích phân" },
  { icon: FileText, text: "Chứng minh định lý Pythagorean", label: "Chứng minh" },
];

export function MessageList({
  messages,
  isLoading,
  onExport,
  emptyTitle = "Tôi có thể giúp gì cho bạn?",
  emptySubtitle,
  suggestions = SUGGESTIONS,
  enableTestPdfExport = false,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isAtBottom]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    setIsAtBottom(distanceFromBottom < 100);
    setShowScrollButton(distanceFromBottom > 300);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-background">
      <ScrollArea className="h-full" ref={scrollRef} onScroll={handleScroll}>
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-8 px-4 pb-8 pt-6 sm:px-6 md:px-8 xl:px-10">
          {messages.length === 0 && !isLoading && (
            <div className="flex min-h-[calc(100dvh-15rem)] w-full min-w-0 flex-col items-center justify-center px-1 text-center sm:px-2">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-border/15 bg-card text-xl font-semibold text-[hsl(var(--terracotta))] shadow-[var(--shadow-sm)]">
                ∑
              </div>
              <h2 className="w-full max-w-[46rem] text-balance text-[clamp(2rem,5vw,3rem)] font-normal leading-[1.12] text-foreground">
                {emptyTitle}
              </h2>
              {emptySubtitle && (
                <p className="mt-4 max-w-[34rem] text-balance text-sm leading-6 text-muted-foreground md:text-[15px]">
                  {emptySubtitle}
                </p>
              )}
              <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 md:grid-cols-3">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="claude-card claude-card-hover group flex min-h-[124px] min-w-0 flex-col items-start gap-3 p-4 text-left sm:p-5"
                    onClick={() => {
                      const event = new CustomEvent("suggestion-click", { detail: suggestion.text });
                      window.dispatchEvent(event);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-[hsl(var(--terracotta))] transition-colors group-hover:bg-card">
                        <suggestion.icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {suggestion.label}
                      </span>
                    </div>
                    <p className="max-w-full text-sm leading-6 text-muted-foreground transition-colors group-hover:text-foreground/85">
                      {suggestion.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex w-full gap-4",
                message.role === "user" ? "justify-end message-enter-user" : "justify-start message-enter-ai"
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="mt-1 h-8 w-8 shrink-0 rounded-lg shadow-[var(--shadow-sm)]">
                  <AvatarFallback className="rounded-lg bg-[hsl(var(--terracotta))] text-xs font-semibold text-white">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}
              <Message
                message={message}
                onExport={onExport}
                testPaperContent={enableTestPdfExport ? getTestPaperContentForMessage(messages, message.id) : undefined}
              />
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <div className="flex h-10 w-fit items-center gap-1 rounded-[9.6px] border border-border/15 bg-card px-4 shadow-[var(--shadow-sm)]">
                  <div className="typing-dot h-1.5 w-1.5 rounded-full bg-[hsl(var(--terracotta))]" />
                  <div className="typing-dot h-1.5 w-1.5 rounded-full bg-[hsl(var(--terracotta))]" />
                  <div className="typing-dot h-1.5 w-1.5 rounded-full bg-[hsl(var(--terracotta))]" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-border/15 bg-card text-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-secondary"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function getTestPaperContentForMessage(messages: MessageType[], messageId: string) {
  const currentIndex = messages.findIndex((message) => message.id === messageId);
  const currentMessage = messages[currentIndex];

  if (!currentMessage || currentMessage.role !== "assistant") {
    return undefined;
  }

  const startIndex = findCurrentTestSequenceStart(messages, currentIndex);
  const assistantTestChunks = messages
    .slice(startIndex, currentIndex + 1)
    .filter((message) => message.role === "assistant" && hasTestPaperContent(message.content))
    .map((message) => message.content.trim())
    .filter(Boolean);

  if (!assistantTestChunks.length || !hasTestPaperContent(currentMessage.content)) {
    return undefined;
  }

  return assistantTestChunks.join("\n\n---\n\n");
}

function findCurrentTestSequenceStart(messages: MessageType[], currentIndex: number) {
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user" && !isContinuationMessage(message.content)) {
      return index;
    }
  }

  return 0;
}

function isContinuationMessage(content: string) {
  const normalized = content
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  return /^(tiep|tiep di|tiep tuc|lam tiep|viet tiep|cho tiep|continue|next|more)(?:\b|[.!?]*)/.test(normalized);
}
