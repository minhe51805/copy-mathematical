import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  Download,
  FileText,
  GraduationCap,
  ImagePlus,
  MessageSquareText,
  NotebookPen,
  Paperclip,
  Route,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Quy trình | AI Math Chat",
  description: "Luồng làm việc từ nhập đề, đọc tài liệu, giải toán tới xuất Word và PDF.",
};

const PROMPT_EXAMPLES = [
  "Giải bài tích phân này từng bước",
  "Tạo đề 15 phút từ file PDF",
  "Soạn giáo án hàm số lớp 12",
  "Đọc ảnh và chép lại đề",
  "Xuất đáp án chi tiết ra Word",
  "Tạo 10 câu tương tự câu mẫu",
];

const PRIMARY_STEPS = [
  {
    icon: UploadCloud,
    title: "Đưa nội dung vào",
    description: "Gõ câu hỏi, dán ảnh, kéo PDF, DOCX, Excel hoặc CSV vào khung chat. Người dùng luôn thấy file trước khi gửi.",
    detail: "Phù hợp khi bạn có đề bài, ảnh chụp, tài liệu ôn tập hoặc bảng điểm cần đọc nhanh.",
  },
  {
    icon: MessageSquareText,
    title: "AI xử lý theo mục tiêu",
    description: "Chọn cách làm: giải bài, soạn giáo án, tạo đề, phân tích tài liệu hoặc chuẩn bị nội dung xuất file.",
    detail: "Các prompt nhanh giúp người không rành kỹ thuật vẫn dùng đúng luồng ngay từ lần đầu.",
  },
  {
    icon: ClipboardCheck,
    title: "Lấy kết quả để dùng tiếp",
    description: "Copy từng câu, copy riêng công thức, mở Math Studio hoặc xuất Word/PDF khi thật sự cần.",
    detail: "Không tự tạo file sau mỗi câu trả lời, tránh tốn token và tránh làm người dùng bị rối.",
  },
];

const TOOL_ROWS = [
  {
    icon: ImagePlus,
    title: "Ảnh bài toán",
    text: "Chụp đề bằng điện thoại, gửi vào chat và yêu cầu AI chép lại hoặc giải chi tiết.",
  },
  {
    icon: FileText,
    title: "Tài liệu dài",
    text: "Đưa PDF, DOCX hoặc Excel vào để AI đọc phần trích xuất và đề xuất việc nên làm tiếp.",
  },
  {
    icon: NotebookPen,
    title: "Teacher Studio",
    text: "Giáo viên chọn mục tiêu như giáo án, phiếu học tập, đề kiểm tra hoặc nguồn tham khảo.",
  },
  {
    icon: Download,
    title: "Xuất tài liệu",
    text: "Tải đề, đáp án, Word hoặc PDF từ nội dung đã có trong cuộc trò chuyện.",
  },
];

const CHECKPOINTS = [
  "Người dùng bắt đầu bằng một câu hỏi hoặc một file, không cần biết prompt phức tạp.",
  "Mỗi câu trả lời có phần copy riêng, phù hợp để đưa sang Word theo từng đoạn.",
  "Các tác vụ nặng như xuất file chỉ chạy khi người dùng chủ động bấm.",
  "Giáo viên có khu làm việc riêng, học sinh và phụ huynh dùng chat thường ở /newchat.",
];

export default function WorkflowPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <MarketingHeader active="workflow" />

      <section className="mx-auto w-full max-w-[1440px] px-5 py-12 md:px-10 md:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border/15 bg-card px-4 py-2 text-sm text-muted-foreground shadow-[var(--shadow-sm)]">
            <Sparkles className="h-4 w-4 text-[hsl(var(--terracotta))]" />
            Một luồng rõ ràng từ câu hỏi tới tài liệu hoàn chỉnh
          </div>
          <h1 className="text-5xl font-normal leading-[1.04] tracking-normal md:text-7xl">
            Bắt đầu bằng một đề bài. Kết thúc bằng nội dung dùng được.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-muted-foreground md:text-[17px]">
            Lấy cảm hứng từ cách ChatGPT đưa người dùng vào việc thật nhanh: AI Math gom nhập đề, đọc file, giải toán, soạn bài và xuất tài liệu thành một quy trình dễ hiểu.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/newchat">
                Thử quy trình
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/teacher">Mở Teacher Studio</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PROMPT_EXAMPLES.map((example) => (
            <Link
              key={example}
              href="/newchat"
              className="rounded-xl border border-border/15 bg-card px-4 py-3 text-sm text-foreground shadow-[var(--shadow-sm)] transition-colors hover:border-border/30 hover:bg-secondary"
            >
              {example}
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border/10 bg-card/45">
        <div className="mx-auto grid w-full max-w-[1440px] gap-5 px-5 py-12 md:px-10 md:py-16 lg:grid-cols-3">
          {PRIMARY_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="rounded-xl border border-border/15 bg-card p-6 shadow-[var(--shadow-sm)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-lg border border-border/15 bg-background px-3 py-1 text-xs text-muted-foreground">
                    Bước {index + 1}
                  </span>
                </div>
                <h2 className="mt-8 font-sans text-2xl font-semibold leading-tight">{step.title}</h2>
                <p className="mt-3 text-[15px] leading-7 text-foreground">{step.description}</p>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{step.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="lg:sticky lg:top-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--terracotta))] text-white">
            <Route className="h-5 w-5" />
          </div>
          <h2 className="text-4xl font-normal leading-tight md:text-6xl">
            Người dùng chọn việc cần làm, không phải học cách dùng app.
          </h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Bố cục mới ưu tiên các hành động quen thuộc: gửi ảnh, đưa file, hỏi bài, soạn bài và xuất file. Mỗi nhóm có mô tả ngắn để phụ huynh, học sinh hoặc giáo viên hiểu ngay.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {TOOL_ROWS.map((tool) => {
            const Icon = tool.icon;
            return (
              <article key={tool.title} className="rounded-xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)]">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-sans text-xl font-semibold">{tool.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{tool.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border/10 bg-card/45">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h2 className="text-4xl font-normal leading-tight md:text-5xl">Các điểm kiểm soát để không bị lạc.</h2>
          </div>
          <div className="grid gap-3">
            {CHECKPOINTS.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border border-border/15 bg-card p-5 text-sm leading-6 shadow-[var(--shadow-sm)]">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--terracotta))]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
        <div className="rounded-xl border border-border/15 bg-card p-6 shadow-[var(--shadow-sm)] md:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-normal leading-tight md:text-5xl">Sẵn sàng thử với một file thật?</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                Bắt đầu ở chat thường nếu bạn là học sinh, phụ huynh hoặc sinh viên. Chọn Teacher Studio nếu mục tiêu là giáo án, đề kiểm tra hoặc tài liệu dạy học.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/newchat">Vào chat</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/teacher">
                  Teacher Studio
                  <Paperclip className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
