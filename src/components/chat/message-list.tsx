"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Calculator,
  ChevronDown,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Library,
  MousePointerClick,
  NotebookPen,
  Sigma,
  Sparkles,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { hasTestPaperContent } from "@/lib/test-paper";
import { isTeacherResearchPrompt } from "@/lib/teacher-research-intent";
import { isComplexQuery } from "@/lib/complexity";
import type { Message as MessageType } from "@/types";
import { cn } from "@/lib/utils";
import { Message } from "./message";
import { TeacherResearchTrace } from "./teacher-research-trace";

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
  onQuickSend?: (content: string) => void;
  onExport?: (content: string, request?: string | null) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  suggestions?: MessageSuggestion[];
  workspaceTools?: WorkspaceTool[];
  setupItems?: string[];
  reviewChecklist?: string[];
  pendingAttachmentCount?: number;
  isTeacherWorkspace?: boolean;
  enableTestPdfExport?: boolean;
}

export interface MessageSuggestion {
  icon: LucideIcon;
  text: string;
  label: string;
}

interface WorkspaceTool {
  label: string;
  description: string;
  prompt: string;
}

const SUGGESTIONS: MessageSuggestion[] = [
  { icon: Calculator, text: "Giải phương trình bậc 2: x² + 3x + 2 = 0", label: "Phương trình" },
  { icon: Sparkles, text: "Tính tích phân ∫₀¹ x² dx", label: "Tích phân" },
  { icon: FileText, text: "Chứng minh định lý Pythagorean", label: "Chứng minh" },
];

const TEACHER_SECONDARY_ICONS = [NotebookPen, ClipboardCheck, FileText, Library, Sparkles];

const TEACHER_DOCUMENT_TYPES = [
  {
    id: "lesson-plan",
    label: "Giáo án",
    description: "Mục tiêu, tiến trình dạy học, hoạt động và dặn dò.",
    actionLabel: "Tạo giáo án",
    defaultDuration: "45 phút",
    instruction:
      "Soạn giáo án hoàn chỉnh, có mục tiêu, chuẩn bị, tiến trình dạy học, hoạt động giáo viên - học sinh, câu hỏi gợi mở, luyện tập, vận dụng và dặn dò.",
  },
  {
    id: "test-paper",
    label: "Đề kiểm tra",
    description: "Câu hỏi, đáp án, thang điểm và ma trận mức độ.",
    actionLabel: "Tạo đề + đáp án",
    defaultDuration: "15 phút",
    instruction:
      "Tạo đề kiểm tra có cấu trúc rõ ràng, câu hỏi phân mức độ, đáp án, thang điểm và phần giải thích ngắn cho giáo viên.",
  },
  {
    id: "worksheet",
    label: "Phiếu học tập",
    description: "Bài tập phân tầng, đáp án ngắn và lỗi sai thường gặp.",
    actionLabel: "Tạo phiếu học tập",
    defaultDuration: "45 phút",
    instruction:
      "Tạo phiếu học tập phân tầng cho học sinh, có phần khởi động, luyện tập, vận dụng, đáp án ngắn và lỗi sai thường gặp.",
  },
  {
    id: "exam-matrix",
    label: "Ma trận đề",
    description: "Chuẩn đầu ra, mức độ nhận thức, số câu và điểm.",
    actionLabel: "Tạo ma trận",
    defaultDuration: "1 tiết",
    instruction:
      "Tạo ma trận đề kiểm tra theo bảng rõ ràng, gồm chủ đề, chuẩn cần đánh giá, mức độ nhận biết - thông hiểu - vận dụng - vận dụng cao, số câu, điểm số và gợi ý dạng câu hỏi.",
  },
  {
    id: "rubric",
    label: "Rubric chấm điểm",
    description: "Tiêu chí, thang điểm và mô tả từng mức đạt.",
    actionLabel: "Tạo rubric",
    defaultDuration: "1 nhiệm vụ",
    instruction:
      "Tạo rubric chấm điểm theo tiêu chí rõ ràng, có thang điểm, mô tả mức đạt, lỗi thường gặp và hướng dẫn phản hồi cho học sinh.",
  },
  {
    id: "slide-outline",
    label: "Dàn ý slide",
    description: "Khung slide bài giảng, ví dụ, câu hỏi và hoạt động.",
    actionLabel: "Tạo dàn ý slide",
    defaultDuration: "45 phút",
    instruction:
      "Tạo dàn ý slide bài giảng theo từng slide, có tiêu đề, nội dung chính, ví dụ minh họa, câu hỏi tương tác, hoạt động lớp và ghi chú lời dẫn cho giáo viên.",
  },
  {
    id: "remedial-plan",
    label: "Kế hoạch phụ đạo",
    description: "Lộ trình vá lỗ hổng kiến thức theo nhóm học sinh.",
    actionLabel: "Tạo kế hoạch",
    defaultDuration: "2 tuần",
    instruction:
      "Tạo kế hoạch phụ đạo có mục tiêu, chẩn đoán lỗi nền, lộ trình buổi học, bài tập ngắn, cách theo dõi tiến bộ và nhiệm vụ về nhà.",
  },
  {
    id: "question-bank",
    label: "Ngân hàng câu hỏi",
    description: "Câu hỏi phân mức, đáp án và ghi chú sư phạm.",
    actionLabel: "Tạo ngân hàng câu hỏi",
    defaultDuration: "10 câu",
    instruction:
      "Tạo ngân hàng câu hỏi phân mức độ, có đáp án, lời giải ngắn, bẫy sai thường gặp và gợi ý dùng câu hỏi trong lớp.",
  },
  {
    id: "document-summary",
    label: "Tóm tắt tài liệu",
    description: "Rút ý chính, chia mục và tạo bản Word dễ đọc.",
    actionLabel: "Tóm tắt tài liệu",
    defaultDuration: "Bản 1 trang",
    instruction:
      "Đọc tài liệu hoặc nội dung được cung cấp, rút ý chính, chia mục rõ ràng và biên soạn thành tài liệu Word dễ dùng cho giáo viên.",
  },
];

const STUDENT_LEVEL_OPTIONS = ["Yếu nền", "Trung bình", "Khá giỏi", "Ôn thi", "Phân hóa"];
const OUTPUT_FORMAT_OPTIONS = ["Bản ngắn", "Bản đầy đủ", "Bảng dùng in", "Dàn ý nhanh"];

const TEACHER_CONTEXT_PRESETS = [
  {
    label: "Bài mới",
    text: "Bối cảnh: bài mới, cần mở đầu gợi tò mò, giải thích từng bước và có kiểm tra nhanh cuối bài.",
  },
  {
    label: "Ôn tập",
    text: "Bối cảnh: tiết ôn tập, cần hệ thống hóa kiến thức, bài tập tăng dần và chỉ ra lỗi sai thường gặp.",
  },
  {
    label: "Kiểm tra",
    text: "Bối cảnh: chuẩn bị kiểm tra, cần câu hỏi phân mức, đáp án, thang điểm và ma trận ngắn.",
  },
  {
    label: "Phụ đạo",
    text: "Bối cảnh: phụ đạo học sinh mất gốc, cần giải thích chậm, ví dụ đơn giản và bài luyện ngắn.",
  },
];

export function MessageList({
  messages,
  isLoading,
  onQuickSend,
  onExport,
  emptyTitle = "Tôi có thể giúp gì cho bạn?",
  emptySubtitle,
  suggestions = SUGGESTIONS,
  workspaceTools = [],
  setupItems = [],
  reviewChecklist = [],
  pendingAttachmentCount = 0,
  isTeacherWorkspace = false,
  enableTestPdfExport = false,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const latestUserMessage = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message?.role === "user") {
        return message.content ?? "";
      }
    }
    return "";
  }, [messages]);
  const showTeacherResearchTrace =
    isTeacherWorkspace && isLoading && isTeacherResearchPrompt(latestUserMessage);
  const testPaperContentByMessageId = useMemo(() => {
    if (!enableTestPdfExport) {
      return new Map<string, string>();
    }

    const contentByMessageId = new Map<string, string>();
    let currentTestChunks: string[] = [];

    for (const message of messages) {
      if (message.role === "user" && !isContinuationMessage(message.content)) {
        currentTestChunks = [];
        continue;
      }

      if (message.role !== "assistant" || !hasTestPaperContent(message.content)) {
        continue;
      }

      const chunk = message.content.trim();
      if (!chunk) {
        continue;
      }

      currentTestChunks.push(chunk);
      contentByMessageId.set(message.id, currentTestChunks.join("\n\n---\n\n"));
    }

    return contentByMessageId;
  }, [enableTestPdfExport, messages]);

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
        <div
          className={cn(
            "mx-auto flex min-h-full w-full flex-col gap-8 px-4 pb-8 pt-6 sm:px-6 md:px-8 xl:px-10",
            isTeacherWorkspace ? "max-w-7xl" : "max-w-4xl"
          )}
        >
          {messages.length === 0 && !isLoading && (
            isTeacherWorkspace ? (
              <TeacherEmptyState
                emptyTitle={emptyTitle}
                emptySubtitle={emptySubtitle}
                suggestions={suggestions}
                workspaceTools={workspaceTools}
                setupItems={setupItems}
                reviewChecklist={reviewChecklist}
                pendingAttachmentCount={pendingAttachmentCount}
                onQuickSend={onQuickSend}
              />
            ) : (
              <DefaultEmptyState
                emptyTitle={emptyTitle}
                emptySubtitle={emptySubtitle}
                suggestions={suggestions}
              />
            )
          )}

          {messages.map((message, index) => {
            let isComplex = false;
            if (message.role === "assistant") {
              const precedingUser = messages
                .slice(0, index)
                .reverse()
                .find((m) => m.role === "user");
              if (precedingUser) {
                isComplex = isComplexQuery(precedingUser.content, precedingUser.attachments);
              }
            }

            return (
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
                  testPaperContent={testPaperContentByMessageId.get(message.id)}
                  isLoading={isLoading}
                  isLast={index === messages.length - 1}
                  isComplex={isComplex}
                />
              </div>
            );
          })}

          {isLoading && (
            <div className="flex flex-col gap-4 animate-fade-in">
              {showTeacherResearchTrace && (
                <TeacherResearchTrace
                  query={latestUserMessage}
                  hint="Teacher Studio đang mở web, đọc nguồn và chuẩn bị bản trả lời có trích dẫn."
                />
              )}

              {messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-3">
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

function TeacherEmptyState({
  emptyTitle,
  emptySubtitle,
  suggestions,
  workspaceTools,
  setupItems,
  reviewChecklist,
  pendingAttachmentCount,
  onQuickSend,
}: {
  emptyTitle: string;
  emptySubtitle?: string;
  suggestions: MessageSuggestion[];
  workspaceTools: WorkspaceTool[];
  setupItems: string[];
  reviewChecklist: string[];
  pendingAttachmentCount: number;
  onQuickSend?: (content: string) => void;
}) {
  const [view, setView] = useState<"create" | "chat">("create");
  const [documentType, setDocumentType] = useState(TEACHER_DOCUMENT_TYPES[0].id);
  const [grade, setGrade] = useState("");
  const [duration, setDuration] = useState("45 phút");
  const [itemCount, setItemCount] = useState("8-10");
  const [studentLevel, setStudentLevel] = useState(STUDENT_LEVEL_OPTIONS[1]);
  const [outputFormat, setOutputFormat] = useState(OUTPUT_FORMAT_OPTIONS[1]);
  const [sourceText, setSourceText] = useState("");
  const primarySuggestions = suggestions.slice(0, 3);
  const secondaryTools = workspaceTools.slice(0, 6);
  const selectedDocument = TEACHER_DOCUMENT_TYPES.find((type) => type.id === documentType) ?? TEACHER_DOCUMENT_TYPES[0];
  const hasDocumentInput = !isBlank(sourceText) || !isBlank(grade) || pendingAttachmentCount > 0;
  const canCreate = Boolean(onQuickSend);

  const handleCreateDocument = () => {
    if (!onQuickSend) return;

    onQuickSend(buildTeacherDocumentPrompt({
      typeLabel: selectedDocument.label,
      typeInstruction: selectedDocument.instruction,
      grade,
      duration,
      itemCount,
      studentLevel,
      outputFormat,
      sourceText,
      hasAttachments: pendingAttachmentCount > 0,
    }));
  };

  const appendContextPreset = (text: string) => {
    setSourceText((current) => current.trim() ? `${current.trim()}\n${text}` : text);
  };

  return (
    <div className="flex min-h-[calc(100dvh-15rem)] w-full items-center justify-center py-8">
      <div className="w-full max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border/15 bg-card text-xl font-semibold text-[hsl(var(--terracotta))] shadow-[var(--shadow-sm)]">
            ∑
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[hsl(var(--terracotta))]">
              Teacher Studio
            </p>
            <h2 className="mx-auto mt-3 max-w-3xl text-balance text-[clamp(2rem,4vw,3.25rem)] font-normal leading-[1.1] text-foreground">
              {emptyTitle}
            </h2>
            {emptySubtitle && (
              <p className="mx-auto mt-4 max-w-2xl text-balance text-[15px] leading-7 text-muted-foreground">
                {emptySubtitle}
              </p>
            )}
          </div>
          <div className="mx-auto grid w-full max-w-md grid-cols-2 rounded-xl border border-border/15 bg-card p-1 shadow-[var(--shadow-sm)]">
            <button
              type="button"
              onClick={() => setView("create")}
              className={cn(
                "h-11 rounded-[9.6px] text-sm font-medium transition-colors",
                view === "create" ? "bg-secondary text-foreground shadow-[var(--shadow-sm)]" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tạo tài liệu
            </button>
            <button
              type="button"
              onClick={() => setView("chat")}
              className={cn(
                "h-11 rounded-[9.6px] text-sm font-medium transition-colors",
                view === "chat" ? "bg-secondary text-foreground shadow-[var(--shadow-sm)]" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Chat với AI
            </button>
          </div>
        </div>

        {view === "create" ? (
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-2xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] sm:p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[hsl(var(--terracotta))]">
                  Bộ công cụ không cần prompt
                </p>
                <h3 className="mt-2 text-2xl font-semibold">Chọn việc cần làm, app tự dựng brief ẩn</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Thầy cô chỉ chọn công cụ, điền vài thông tin ngắn hoặc thêm file. Hệ thống sẽ tự gửi yêu cầu chuẩn để AI soạn tài liệu có thể xuất Word.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {TEACHER_CONTEXT_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => appendContextPreset(preset.text)}
                      className="rounded-full border border-border/15 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-[hsl(var(--terracotta))]/45 hover:text-foreground"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <div>
                  <label className="text-sm font-semibold">1. Chọn công cụ</label>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {TEACHER_DOCUMENT_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setDocumentType(type.id);
                          setDuration(type.defaultDuration);
                        }}
                        className={cn(
                          "rounded-xl border p-4 text-left transition-colors",
                          documentType === type.id
                            ? "border-[hsl(var(--terracotta))] bg-[hsl(var(--terracotta))]/10"
                            : "border-border/15 bg-background/40 hover:border-border/30 hover:bg-secondary"
                        )}
                      >
                        <span className="block text-sm font-semibold">{type.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{type.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">2. Khối/lớp</span>
                    <input
                      value={grade}
                      onChange={(event) => setGrade(event.target.value)}
                      placeholder="Ví dụ: lớp 12, đại học năm 1"
                      className="h-11 rounded-[9.6px] border border-border/15 bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-border/40 focus:ring-2 focus:ring-foreground/10"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">3. Thời lượng / quy mô</span>
                    <input
                      value={duration}
                      onChange={(event) => setDuration(event.target.value)}
                      placeholder="Ví dụ: 45 phút, 1 tiết, bản 1 trang"
                      className="h-11 rounded-[9.6px] border border-border/15 bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-border/40 focus:ring-2 focus:ring-foreground/10"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">4. Số câu/hoạt động</span>
                    <input
                      value={itemCount}
                      onChange={(event) => setItemCount(event.target.value)}
                      placeholder="Ví dụ: 10 câu, 4 hoạt động"
                      className="h-11 rounded-[9.6px] border border-border/15 bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-border/40 focus:ring-2 focus:ring-foreground/10"
                    />
                  </label>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="grid gap-2">
                    <span className="text-sm font-semibold">5. Mức học sinh</span>
                    <div className="flex flex-wrap gap-2">
                      {STUDENT_LEVEL_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setStudentLevel(option)}
                          className={cn(
                            "h-9 rounded-full border px-3 text-xs font-medium transition-colors",
                            studentLevel === option
                              ? "border-[hsl(var(--terracotta))] bg-[hsl(var(--terracotta))]/10 text-foreground"
                              : "border-border/15 bg-background text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <span className="text-sm font-semibold">6. Định dạng đầu ra</span>
                    <div className="flex flex-wrap gap-2">
                      {OUTPUT_FORMAT_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setOutputFormat(option)}
                          className={cn(
                            "h-9 rounded-full border px-3 text-xs font-medium transition-colors",
                            outputFormat === option
                              ? "border-[hsl(var(--terracotta))] bg-[hsl(var(--terracotta))]/10 text-foreground"
                              : "border-border/15 bg-background text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold">7. Chủ đề hoặc nội dung cần xử lý</span>
                  <textarea
                    value={sourceText}
                    onChange={(event) => setSourceText(event.target.value)}
                    placeholder="Ví dụ: Tích phân từng phần lớp 12, cần ví dụ từng bước, bài tập phân tầng và đáp án..."
                    rows={6}
                    className="min-h-36 resize-none rounded-xl border border-border/15 bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-border/40 focus:ring-2 focus:ring-foreground/10"
                  />
                </label>

                <div className="flex flex-col gap-3 rounded-xl border border-border/15 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-[hsl(var(--terracotta))]">
                      <FileCheck2 className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        {pendingAttachmentCount > 0 ? `Đã thêm ${pendingAttachmentCount} file` : "Có thể thêm file kèm theo"}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {hasDocumentInput
                          ? "AI sẽ đọc file và nội dung đã nhập trước khi soạn bản nháp."
                          : "Có thể bấm tạo ngay để AI hỏi phần còn thiếu, hoặc thêm file/chủ đề để ra bản nháp đầy đủ hơn."}
                      </p>
                    </div>
                  </div>
                  <Button type="button" variant="outline" className="h-10 gap-2 rounded-[9.6px]" onClick={openFilePicker}>
                    <UploadCloud className="h-4 w-4" />
                    Chọn file
                  </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    className="h-12 flex-1 gap-2 rounded-[9.6px] bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--terracotta))]/90"
                    disabled={!onQuickSend || !canCreate}
                    onClick={handleCreateDocument}
                  >
                    {selectedDocument.actionLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 gap-2 rounded-[9.6px]"
                    onClick={openFormulaStudio}
                  >
                    <Sigma className="h-4 w-4 text-[hsl(var(--terracotta))]" />
                    Math Studio
                  </Button>
                </div>
              </div>
            </section>

            <aside className="grid content-start gap-4">
              <TeacherSideHelp
                setupItems={setupItems}
                reviewChecklist={reviewChecklist}
                pendingAttachmentCount={pendingAttachmentCount}
              />
            </aside>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">Chat với AI</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Dùng khi thầy cô muốn hỏi tự do hoặc chỉnh nội dung đang soạn.
                  </p>
                </div>
                <Button type="button" variant="outline" className="h-10 gap-2 rounded-[9.6px]" onClick={openFormulaStudio}>
                  <Sigma className="h-4 w-4 text-[hsl(var(--terracotta))]" />
                  Math Studio
                </Button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {primarySuggestions.map((suggestion, index) => (
                  <TeacherPrimaryCard key={suggestion.label} suggestion={suggestion} index={index} />
                ))}
              </div>

              {secondaryTools.length > 0 && (
                <div className="mt-5 rounded-xl border border-border/15 bg-background/40 p-4">
                  <h4 className="text-sm font-semibold">Tác vụ nhỏ thường dùng</h4>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {secondaryTools.map((tool, index) => {
                      const Icon = TEACHER_SECONDARY_ICONS[index % TEACHER_SECONDARY_ICONS.length];
                      return (
                        <button
                          key={tool.label}
                          type="button"
                          onClick={() => sendSuggestion(tool.prompt)}
                          className="group flex min-h-[76px] items-start gap-3 rounded-xl border border-border/15 bg-card p-3 text-left transition-colors hover:border-[hsl(var(--terracotta))]/45 hover:bg-secondary"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-[hsl(var(--terracotta))] group-hover:bg-card">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{tool.label}</span>
                            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                              {tool.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            <aside className="grid content-start gap-4">
              <TeacherSideHelp
                setupItems={setupItems}
                reviewChecklist={reviewChecklist}
                pendingAttachmentCount={pendingAttachmentCount}
              />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function TeacherPrimaryCard({ suggestion, index }: { suggestion: MessageSuggestion; index: number }) {
  const Icon = suggestion.icon;

  return (
    <button
      type="button"
      onClick={() => sendSuggestion(suggestion.text)}
      className="group flex min-h-[190px] flex-col rounded-xl border border-border/15 bg-background/40 p-4 text-left transition-all hover:border-[hsl(var(--terracotta))]/45 hover:bg-secondary hover:shadow-[var(--shadow-md)]"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-card text-[hsl(var(--terracotta))] shadow-[var(--shadow-sm)]">
          <Icon className="h-5 w-5" />
        </span>
        <span className="rounded-full border border-border/15 bg-card px-2.5 py-1 text-xs text-muted-foreground">
          Mẫu {index + 1}
        </span>
      </div>
      <span className="text-base font-semibold leading-6">{suggestion.label}</span>
      <span className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
        {suggestion.text}
      </span>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--terracotta))]">
        Bắt đầu từ mẫu này
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

function TeacherSideHelp({
  setupItems,
  reviewChecklist,
  pendingAttachmentCount,
}: {
  setupItems: string[];
  reviewChecklist: string[];
  pendingAttachmentCount: number;
}) {
  return (
    <>
      <button
        type="button"
        onClick={openFilePicker}
        className="group rounded-2xl border border-dashed border-[hsl(var(--terracotta))]/45 bg-[hsl(var(--terracotta))]/10 p-5 text-left transition-colors hover:bg-[hsl(var(--terracotta))]/15"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card text-[hsl(var(--terracotta))] shadow-[var(--shadow-sm)]">
            <UploadCloud className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-semibold">
              {pendingAttachmentCount > 0 ? `Đã thêm ${pendingAttachmentCount} file` : "Thêm tài liệu có sẵn"}
            </span>
            <span className="mt-1 block text-sm leading-6 text-muted-foreground">
              Kéo file vào trang hoặc bấm để chọn PDF, Word, Excel, ảnh bài mẫu.
            </span>
            <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--terracotta))]">
              Chọn file
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </span>
        </div>
      </button>

      <section className="rounded-2xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-[hsl(var(--terracotta))]">
            <MousePointerClick className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-base font-semibold">Luồng làm việc</h3>
            <p className="text-xs text-muted-foreground">Rõ từng bước, không cần tự nhớ mẫu.</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {setupItems.map((item, index) => (
            <div key={item} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-[hsl(var(--terracotta))]">
                {index + 1}
              </span>
              <p className="pt-0.5 text-sm leading-6 text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-[hsl(var(--terracotta))]">
            <BookOpenCheck className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-base font-semibold">Trước khi dùng cho lớp</h3>
            <p className="text-xs text-muted-foreground">Các điểm nên rà lại nhanh.</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {reviewChecklist.slice(0, 3).map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--terracotta))]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function buildTeacherDocumentPrompt({
  typeLabel,
  typeInstruction,
  grade,
  duration,
  itemCount,
  studentLevel,
  outputFormat,
  sourceText,
  hasAttachments,
}: {
  typeLabel: string;
  typeInstruction: string;
  grade: string;
  duration: string;
  itemCount: string;
  studentLevel: string;
  outputFormat: string;
  sourceText: string;
  hasAttachments: boolean;
}) {
  return [
    `Hãy tạo ${typeLabel} và chuẩn bị xuất file Word cho giáo viên. Đây là yêu cầu được tạo từ công cụ nhanh, giáo viên không tự viết prompt.`,
    typeInstruction,
    grade.trim() ? `Khối/lớp: ${grade.trim()}.` : "Nếu thiếu khối/lớp, hãy chọn cách trình bày trung tính và ghi rõ phần cần giáo viên xác nhận.",
    duration.trim() ? `Thời lượng: ${duration.trim()}.` : "",
    itemCount.trim() ? `Số câu hoặc số hoạt động mong muốn: ${itemCount.trim()}.` : "",
    studentLevel.trim() ? `Mức học sinh: ${studentLevel.trim()}.` : "",
    outputFormat.trim() ? `Định dạng đầu ra: ${outputFormat.trim()}.` : "",
    hasAttachments ? "Có file đính kèm trong tin nhắn này. Hãy đọc file và ưu tiên nội dung trong file." : "",
    sourceText.trim() ? `Nội dung/chủ đề do giáo viên nhập:\n${sourceText.trim()}` : "",
    "Nếu thiếu dữ liệu quan trọng, chỉ hỏi lại tối đa 3 câu ngắn. Nếu vẫn có thể làm bản nháp hợp lý, hãy tự ghi giả định ở đầu tài liệu rồi tiếp tục soạn.",
    "Yêu cầu trình bày: viết bằng tiếng Việt, chia mục rõ ràng, ưu tiên dùng được ngay trong lớp, có phần giáo viên cần kiểm tra lại nếu thiếu dữ liệu.",
    "Yêu cầu xuất file: sau khi tạo nội dung, hãy trình bày như một bản tài liệu hoàn chỉnh để app mở modal xuất Word.",
  ].filter(Boolean).join("\n\n");
}

function isBlank(value: string) {
  return value.trim().length === 0;
}

function DefaultEmptyState({
  emptyTitle,
  emptySubtitle,
  suggestions,
}: {
  emptyTitle: string;
  emptySubtitle?: string;
  suggestions: MessageSuggestion[];
}) {
  return (
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
            onClick={() => sendSuggestion(suggestion.text)}
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
  );
}

function sendSuggestion(text: string) {
  window.dispatchEvent(new CustomEvent("suggestion-click", { detail: text }));
}

function openFormulaStudio() {
  window.dispatchEvent(new CustomEvent("open-formula-studio"));
}

function openFilePicker() {
  window.dispatchEvent(new CustomEvent("open-file-picker"));
}

function isContinuationMessage(content: string) {
  const normalized = content
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  return /^(tiep|tiep di|tiep tuc|lam tiep|viet tiep|cho tiep|continue|next|more)(?:\b|[.!?]*)/.test(normalized);
}
