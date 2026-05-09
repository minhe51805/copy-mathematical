import { Suspense } from "react";
import { ChatShell } from "@/components/chat/chat-shell";

export default function NewChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-background">
          <div className="rounded-xl border border-border/15 bg-card px-5 py-4 text-sm text-muted-foreground shadow-[var(--shadow-sm)]">
            Đang mở phòng chat...
          </div>
        </div>
      }
    >
      <ChatShell />
    </Suspense>
  );
}
