"use client";

import { useEffect, useRef, useState } from "react";
import { Calculator, ChevronDown, FileText, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message as MessageType } from "@/types";
import { cn } from "@/lib/utils";
import { Message } from "./message";

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
  onExport?: (content: string) => void;
}

const SUGGESTIONS = [
  { icon: Calculator, text: "Giải phương trình bậc 2: x² + 3x + 2 = 0", label: "Phương trình" },
  { icon: Sparkles, text: "Tính tích phân ∫₀¹ x² dx", label: "Tích phân" },
  { icon: FileText, text: "Chứng minh định lý Pythagorean", label: "Chứng minh" },
];

export function MessageList({ messages, isLoading, onExport }: MessageListProps) {
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
    <div className="relative min-h-0 flex-1 bg-background">
      <ScrollArea className="h-full" ref={scrollRef} onScroll={handleScroll}>
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 pb-6 pt-4 md:px-6">
          {messages.length === 0 && !isLoading && (
            <div className="flex min-h-[calc(100dvh-14rem)] flex-col items-center justify-center px-2 text-center">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border bg-card text-xl font-semibold shadow-sm">
                ∑
              </div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Tôi có thể giúp gì cho bạn?
              </h2>
              <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                {SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={index}
                    className="group flex min-h-[112px] flex-col items-start gap-2 rounded-2xl border bg-card p-4 text-left transition-colors hover:bg-accent"
                    onClick={() => {
                      const event = new CustomEvent("suggestion-click", { detail: suggestion.text });
                      window.dispatchEvent(event);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <suggestion.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        {suggestion.label}
                      </span>
                    </div>
                    <p className="text-sm leading-snug text-foreground/85 transition-colors group-hover:text-foreground">
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
                "flex w-full gap-3",
                message.role === "user" ? "justify-end message-enter-user" : "justify-start message-enter-ai"
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="mt-1 h-8 w-8 shrink-0 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-foreground text-xs font-semibold text-background">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}
              <Message message={message} onExport={onExport} />
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <div className="flex h-8 w-fit items-center gap-1 rounded-full bg-muted px-3">
                  <div className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/70" />
                  <div className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/70" />
                  <div className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/70" />
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
          className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border bg-background text-foreground shadow-sm transition-colors hover:bg-accent"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
