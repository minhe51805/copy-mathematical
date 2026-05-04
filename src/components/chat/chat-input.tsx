"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
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

  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <div className="shrink-0 bg-background px-3 pb-3 pt-2 md:px-6 md:pb-5">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex min-h-[56px] items-end gap-2 rounded-[28px] border bg-card px-3 py-3 shadow-sm transition-colors focus-within:border-muted-foreground/50">
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
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          AI có thể mắc lỗi. Hãy kiểm tra kết quả quan trọng.
        </p>
      </div>
    </div>
  );
}
