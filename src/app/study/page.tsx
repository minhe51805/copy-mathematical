import type { Metadata } from "next";
import { Suspense } from "react";
import { ChatShell } from "@/components/chat/chat-shell";

export const metadata: Metadata = {
  title: "Study Coach | AI Math Chat",
  description: "Workspace học sinh, sinh viên và phụ huynh để giải bài tập, so sánh hướng giải và luyện thêm.",
};

export default function StudyPage() {
  return (
    <Suspense fallback={<WorkspaceLoading label="Đang mở Study Coach..." />}>
      <ChatShell mode="study" />
    </Suspense>
  );
}

function WorkspaceLoading({ label }: { label: string }) {
  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <div className="rounded-xl border border-border/15 bg-card px-5 py-4 text-sm text-muted-foreground shadow-[var(--shadow-sm)]">
        {label}
      </div>
    </div>
  );
}
