"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  FileSearch,
  Globe,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherResearchTraceProps {
  query: string;
  hint?: string;
  className?: string;
}

const STEPS = [
  {
    title: "Phân tích yêu cầu",
    description: "Tách từ khóa, mục tiêu và phần cần tra cứu trong câu hỏi.",
    icon: FileSearch,
  },
  {
    title: "Mở web tìm nguồn",
    description: "Chạy truy vấn web để lấy kết quả mới và phù hợp nhất.",
    icon: Globe,
  },
  {
    title: "Đọc và lọc nguồn",
    description: "Giữ lại nguồn tin cậy, bỏ qua kết quả trùng hoặc yếu.",
    icon: BookOpen,
  },
  {
    title: "Đối chiếu nội dung",
    description: "So sánh các nguồn để rút ý chính và tránh trả lời bừa.",
    icon: Sparkles,
  },
  {
    title: "Tổng hợp câu trả lời",
    description: "Biến kết quả research thành nội dung cho giáo viên dùng được ngay.",
    icon: Sparkles,
  },
];

export function TeacherResearchTrace({
  query,
  hint = "Đang tìm nguồn web và kiểm chứng thông tin...",
  className,
}: TeacherResearchTraceProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 850);

    return () => window.clearInterval(timer);
  }, []);

  const cycleLength = Math.max(STEPS.length * 4, 4);
  const phase = tick % cycleLength;
  const activeIndex = Math.min(STEPS.length - 1, Math.floor(phase / 4));
  const progress = Math.min(98, 14 + (phase / cycleLength) * 78);
  const currentStep = STEPS[activeIndex] ?? STEPS[0];
  const displayQuery = query.trim() || "Đang chuẩn bị truy vấn tra cứu...";

  return (
    <div
      className={cn(
        "w-full max-w-3xl overflow-hidden rounded-2xl border border-border/15 bg-card shadow-[var(--shadow-sm)]",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[hsl(var(--terracotta))] animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Teacher research agent
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border/10 bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Web search
          </span>
          <span className="rounded-full border border-[hsl(var(--terracotta))]/20 bg-[hsl(var(--terracotta))]/10 px-2.5 py-1 text-[10px] font-semibold text-[hsl(var(--terracotta))]">
            {currentStep.title}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <div className="rounded-xl border border-border/15 bg-background/70 px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{displayQuery}</span>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[hsl(var(--terracotta))]" />
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {STEPS.map((step, index) => {
            const isActive = index === activeIndex;
            const isComplete = index < activeIndex;
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-3 py-3 transition-all duration-300",
                  isActive
                    ? "border-[hsl(var(--terracotta))]/40 bg-[hsl(var(--terracotta))]/10"
                    : isComplete
                      ? "border-border/15 bg-secondary/40"
                      : "border-border/10 bg-background/40"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                    isActive
                      ? "border-[hsl(var(--terracotta))]/30 bg-card text-[hsl(var(--terracotta))]"
                      : isComplete
                        ? "border-border/20 bg-card text-foreground"
                        : "border-border/10 bg-background text-muted-foreground"
                  )}
                >
                  {isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {step.title}
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                <div
                  className={cn(
                    "mt-2 h-2 w-2 shrink-0 rounded-full",
                    isActive
                      ? "bg-[hsl(var(--terracotta))] animate-pulse"
                      : isComplete
                        ? "bg-emerald-400"
                        : "bg-border/50"
                  )}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary/80">
          <div
            className="h-full rounded-full bg-[hsl(var(--terracotta))] transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <span className="truncate">{hint}</span>
          <span className="font-mono text-foreground/70">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  );
}
