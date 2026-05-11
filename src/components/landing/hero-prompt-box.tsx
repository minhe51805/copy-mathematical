"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, SendHorizontal } from "lucide-react";
import { setPendingGuestPrompt } from "@/lib/guest-access";

export function HeroPromptBox() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = prompt.trim();

    if (value) {
      setPendingGuestPrompt(value);
    }

    router.push("/newchat");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 w-full max-w-3xl rounded-[28px] border border-border/15 bg-card p-3 shadow-[var(--shadow-md)] transition-all hover:border-border/30 hover:shadow-[var(--shadow-lg)]"
      aria-label="Bắt đầu chat với AI Math"
    >
      <div className="flex min-h-16 items-center gap-3 rounded-[22px] bg-secondary px-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/15 bg-card text-muted-foreground">
          <Paperclip className="h-4 w-4" />
        </span>
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="Hỏi bài toán, kéo file vào hoặc yêu cầu soạn giáo án..."
        />
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1F1E1D] px-4 text-sm text-white transition hover:bg-[#0A0A0A] dark:bg-[#FAF9F5] dark:text-[#1F1E1D] dark:hover:bg-white"
        >
          Bắt đầu
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
