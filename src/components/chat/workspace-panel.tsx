"use client";

import {
  BookOpenCheck,
  CheckCircle2,
  FileSearch,
  GraduationCap,
  NotebookPen,
  Paperclip,
  Sigma,
  Wand2,
} from "lucide-react";
import type { AssistantModeConfig } from "@/lib/assistant-modes";

interface WorkspacePanelProps {
  config: AssistantModeConfig;
}

const TOOL_ICONS = [NotebookPen, BookOpenCheck, Wand2, FileSearch, GraduationCap];

export function WorkspacePanel({ config }: WorkspacePanelProps) {
  const isTeacher = config.id === "teacher";

  return (
    <aside className="hidden w-[300px] shrink-0 border-r bg-background xl:flex xl:flex-col 2xl:w-[320px]">
      <div className="border-b bg-card/80 px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--terracotta))] text-white shadow-[rgba(217,119,87,0.16)_0px_8px_28px]">
            {isTeacher ? <NotebookPen className="h-5 w-5" /> : <BookOpenCheck className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold">{config.workspace.name}</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{config.workspace.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <section className="rounded-xl border border-border/15 bg-card p-4 shadow-[var(--shadow-sm)]">
          <h2 className="text-sm font-semibold">Bắt đầu rất đơn giản</h2>
          <div className="mt-4 grid gap-3">
            {config.workspace.setupItems.map((item, index) => (
              <div key={item} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-[hsl(var(--terracotta))]">
                  {index + 1}
                </span>
                <p className="pt-1 text-xs leading-5 text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">{config.workspace.toolTitle}</h2>
            <button
              type="button"
              onClick={openFormulaStudio}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/20 bg-card px-3 text-xs font-medium text-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-secondary"
            >
              <Sigma className="h-3.5 w-3.5 text-[hsl(var(--terracotta))]" />
              Công thức
            </button>
          </div>
          <div className="grid gap-2">
            {config.workspace.tools.map((tool, index) => {
              const Icon = TOOL_ICONS[index % TOOL_ICONS.length];
              return (
                <button
                  key={tool.label}
                  type="button"
                  onClick={() => setChatDraft(tool.prompt)}
                  className="group rounded-xl border border-border/15 bg-card p-3 text-left shadow-[var(--shadow-sm)] transition-all hover:border-[hsl(var(--terracotta))]/35 hover:bg-secondary/75 hover:shadow-[var(--shadow-md)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-[hsl(var(--terracotta))] transition-colors group-hover:bg-card">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{tool.label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{tool.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-border/15 bg-card p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2">
            {isTeacher ? (
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--terracotta))]" />
            ) : (
              <Paperclip className="h-4 w-4 text-[hsl(var(--terracotta))]" />
            )}
            <h2 className="text-sm font-semibold">{isTeacher ? "Trước khi dùng" : "Mẹo cho bài tập"}</h2>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {isTeacher
              ? "Gửi thêm file đề cũ, yêu cầu của trường hoặc ảnh bài mẫu để AI soạn sát lớp hơn."
              : "Bạn có thể kéo ảnh, PDF, Word hoặc Excel vào khung chat. AI sẽ đọc file rồi giải thích lại theo từng bước."}
          </p>
        </section>
      </div>
    </aside>
  );
}

function setChatDraft(text: string) {
  window.dispatchEvent(new CustomEvent("suggestion-click", { detail: text }));
}

function openFormulaStudio() {
  window.dispatchEvent(new CustomEvent("open-formula-studio"));
}
