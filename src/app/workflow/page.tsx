import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Download, FileUp, MessageSquareText, ScanText, Workflow } from "lucide-react";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Quy trình | AI Math Chat",
  description: "Quy trình dùng AI Math Chat từ đưa đề bài vào đến xuất nội dung.",
};

const WORKFLOW_STEPS = [
  {
    icon: FileUp,
    title: "Đưa đề bài vào",
    description: "Gõ câu hỏi, dán ảnh hoặc kéo tài liệu vào chat. App hiển thị file đang chờ gửi để kiểm tra trước khi hỏi.",
  },
  {
    icon: ScanText,
    title: "AI đọc nội dung",
    description: "Model nhận văn bản, ảnh hoặc nội dung trích xuất từ tài liệu rồi hiểu yêu cầu theo ngữ cảnh cuộc trò chuyện.",
  },
  {
    icon: MessageSquareText,
    title: "Trả lời có cấu trúc",
    description: "Lời giải được trình bày bằng tiếng Việt, có Markdown, bảng, block câu hỏi riêng và công thức KaTeX rõ ràng.",
  },
  {
    icon: ClipboardCheck,
    title: "Chọn phần cần dùng",
    description: "Bạn có thể sao chép từng phần, mở lại modal xuất nội dung hoặc giữ file ở panel bên phải để đối chiếu.",
  },
  {
    icon: Download,
    title: "Xuất khi thật sự cần",
    description: "App chỉ tạo biến thể xuất file khi người dùng mở modal xuất, tránh tự động tốn token sau mỗi câu trả lời.",
  },
];

const CHECKPOINTS = [
  "File được thêm vào chat bằng nút chọn, paste hoặc kéo thả.",
  "Chat mới nằm ở /newchat, chat cũ có dạng /newchat?=#idchat.",
  "Mỗi câu trả lời có vùng copy và vùng mở lại modal xuất nếu có nội dung xuất.",
  "Math Studio phục vụ soạn công thức trước khi gửi cho AI.",
];

export default function WorkflowPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <MarketingHeader active="workflow" />

      <section className="mx-auto w-full max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-8">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[hsl(var(--terracotta))]">Quy trình</p>
            <h1 className="text-4xl font-normal leading-tight md:text-6xl md:leading-[1.08]">
              Từ đề bài tới nội dung có thể dùng lại.
            </h1>
            <p className="mt-6 text-base leading-7 text-muted-foreground md:text-[17px]">
              Quy trình được thiết kế để người dùng không bị lạc giữa nhiều tác vụ: gửi tài liệu, đọc kết quả, copy công thức,
              mở lại nội dung cần xuất và quay về chat cũ bằng URL.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/login">
                  Đăng nhập để bắt đầu
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pricing">Xem pricing</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {WORKFLOW_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className="grid gap-4 rounded-xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] sm:grid-cols-[56px_minmax(0,1fr)] md:p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-[9.6px] bg-[#1F1E1D] text-white dark:bg-[#FAF9F5] dark:text-[#1F1E1D]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <span className="rounded-lg border border-border/15 bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                        Bước {index + 1}
                      </span>
                    </div>
                    <h2 className="font-sans text-xl font-semibold">{step.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border/10 bg-card/45">
        <div className="mx-auto grid w-full max-w-[1440px] gap-6 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--terracotta))] text-white">
              <Workflow className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-normal md:text-5xl">Các điểm kiểm soát trong luồng làm việc.</h2>
          </div>

          <div className="grid gap-3">
            {CHECKPOINTS.map((item) => (
              <div key={item} className="rounded-xl border border-border/15 bg-card p-5 text-sm leading-6 shadow-[var(--shadow-sm)]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
