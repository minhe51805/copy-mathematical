import type { Metadata } from "next";
import { Suspense } from "react";
import { ChatShell } from "@/components/chat/chat-shell";

export const metadata: Metadata = {
  title: "Teacher Studio | AI Math Chat",
  description: "Workspace giáo viên để soạn giáo án, học liệu, bài kiểm tra và tài liệu tham khảo.",
};

export default function TeacherPage() {
  return (
    <Suspense fallback={<WorkspaceLoading label="Đang mở Teacher Studio..." />}>
      <ChatShell mode="teacher" />
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
