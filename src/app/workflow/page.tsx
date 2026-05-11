import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  FileText,
  ImagePlus,
  NotebookPen,
  Paperclip,
  Route,
  UploadCloud,
} from "lucide-react";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { HeroDecor } from "@/components/landing/hero-decor";
import styles from "@/components/landing/marketing.module.css";

export const metadata: Metadata = {
  title: "Quy trình | AI Math Chat",
  description: "Luồng làm việc từ nhập đề, đọc tài liệu, giải toán tới xuất Word và PDF.",
};

const STEPS = [
  {
    icon: UploadCloud,
    title: "Đưa nội dung vào",
    description: "Gõ câu hỏi, dán ảnh, kéo PDF, DOCX, Excel hoặc CSV vào khung chat.",
    output: "AI đọc được đúng ngữ cảnh trước khi trả lời.",
  },
  {
    icon: Route,
    title: "Chọn việc cần làm",
    description: "Giải bài, đọc file, soạn giáo án, tạo đề hoặc chuẩn bị đáp án.",
    output: "Không cần học prompt dài.",
  },
  {
    icon: ClipboardCheck,
    title: "Nhận kết quả có cấu trúc",
    description: "Markdown, bảng, công thức và từng block copy được tách rõ.",
    output: "Dùng lại được ngay trong lớp học.",
  },
  {
    icon: FileText,
    title: "Xuất khi cần",
    description: "Mở modal xuất Word/PDF khi nội dung đã ổn, không tốn tài nguyên thừa.",
    output: "Tài liệu sạch, đúng mục đích.",
  },
];

const INPUTS = [
  { icon: ImagePlus, label: "Ảnh bài toán", text: "Chụp đề và để AI đọc lại nội dung trước khi giải." },
  { icon: Paperclip, label: "PDF / DOCX", text: "Tóm tắt, trích ý chính hoặc biến thành đề luyện tập." },
  { icon: NotebookPen, label: "Chủ đề bài dạy", text: "Dựng giáo án, phiếu học tập và đáp án từ một mô tả ngắn." },
];

const CHECKPOINTS = [
  "Người dùng đi từ việc thật, không đi từ menu kỹ thuật.",
  "Mỗi câu trả lời đều có lối ra: hỏi tiếp, copy, mở Math Studio hoặc xuất file.",
  "Các tác vụ nặng chỉ chạy khi người dùng bấm chủ động.",
  "Chat thường và Teacher Studio tách rõ để người mới không bị rối.",
];

export default function WorkflowPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <MarketingHeader active="workflow" />

      <section className="relative mx-auto grid w-full max-w-[1200px] gap-10 px-5 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <HeroDecor chips={["f(x) = ax² + bx + c", "∫ f(x) dx", "√(b² − 4ac)"]} />
        <div className={`${styles.fadeUp} relative border-l border-border/20 pl-8`}>
          <Eyebrow>Quy trình</Eyebrow>
          <h1 className="mt-8 max-w-[12ch] font-serif text-[clamp(3.2rem,8vw,6.5rem)] font-normal leading-[0.96] tracking-[-0.04em]">
            Từ đề bài tới tài liệu dùng được<span className={`${styles.accentDot} text-[#ff4000]`}>.</span>
          </h1>
        </div>

        <div className={`${styles.fadeUp} ${styles.fadeUpDelay2} relative border-l border-border/20 pl-8`}>
          <p className="max-w-sm text-2xl font-semibold leading-tight md:text-3xl">
            Không cần prompt dài. Không cần mở nhiều công cụ.
          </p>
          <p className="mt-5 max-w-sm text-base leading-7 text-muted-foreground">
            AI Math gom hỏi bài, đọc file, soạn bài và xuất tài liệu thành một luồng rõ ràng cho học sinh,
            phụ huynh và giáo viên.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PillLink href="/newchat" variant="dark">
              Thử quy trình
              <ArrowRight className="h-4 w-4" />
            </PillLink>
            <PillLink href="/teacher" variant="light">
              Teacher Studio
            </PillLink>
          </div>
        </div>
      </section>

      <section className="relative border-y border-border/10 bg-card/55 px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-[1120px]">
          <div className="relative overflow-hidden rounded-[8px] border border-border/15 bg-[#111] shadow-[var(--shadow-md)]">
            <div className="absolute inset-x-0 top-0 z-10 flex h-11 items-center gap-2 border-b border-white/10 bg-black/45 px-4 text-xs text-white/60">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff4000]" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/35" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="ml-2">AI Math workflow preview</span>
            </div>
            <div className="relative aspect-[16/9] pt-11">
              <Image
                src="/product-chat-screenshot.png"
                alt="Giao diện AI Math Chat trong quy trình làm việc"
                fill
                priority
                sizes="(max-width: 1120px) 100vw, 1120px"
                className="object-cover object-top opacity-95"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <Eyebrow>4 bước</Eyebrow>
            <h2 className="mt-6 font-serif text-4xl font-normal leading-tight tracking-[-0.02em] md:text-6xl">
              Mỗi bước có một đầu ra rõ.
            </h2>
          </div>
          <p className="max-w-lg text-base leading-7 text-muted-foreground">
            Người dùng luôn biết mình đang ở đâu trong luồng: nhập nội dung, chọn mục tiêu, nhận kết quả,
            rồi xuất file nếu thật sự cần.
          </p>
        </div>

        <div className={`${styles.staggerGrid} grid gap-3 md:grid-cols-2 lg:grid-cols-4`}>
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className={`${styles.cardHover} min-h-[300px] rounded-[8px] border border-border/15 bg-card p-6`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-[#ff4000]">{String(index + 1).padStart(2, "0")}</span>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="mt-10 text-xl font-semibold leading-tight">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
                <p className="mt-6 border-t border-border/15 pt-4 text-sm font-medium leading-6">{step.output}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border/10 bg-card/55">
        <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow>Đầu vào</Eyebrow>
            <h2 className="mt-6 font-serif text-4xl font-normal leading-tight tracking-[-0.02em] md:text-6xl">
              Bắt đầu bằng thứ bạn đang có.
            </h2>
          </div>

          <div className="grid gap-3">
            {INPUTS.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.label}
                  className={`${styles.cardHover} grid gap-4 rounded-[8px] border border-border/15 bg-card p-5 sm:grid-cols-[44px_1fr]`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-secondary text-[#ff4000]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow>Kiểm soát</Eyebrow>
            <h2 className="mt-6 font-serif text-4xl font-normal leading-tight tracking-[-0.02em] md:text-6xl">
              Không để người dùng bị lạc.
            </h2>
          </div>
          <div className={`${styles.staggerGrid} grid gap-3`}>
            {CHECKPOINTS.map((item) => (
              <div key={item} className={`${styles.cardHover} flex gap-3 rounded-[8px] border border-border/15 bg-card p-5 text-sm leading-6`}>
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#ff4000]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DarkCta
        eyebrow="Sẵn sàng?"
        title="Thử bằng một file thật trong vài phút."
        body="Vào chat nếu bạn cần hỏi bài. Mở Teacher Studio nếu bạn cần soạn giáo án, đề kiểm tra hoặc tài liệu dạy học."
      />

    </main>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-[#ff4000]" />
      {children}
    </span>
  );
}

function PillLink({
  href,
  variant,
  children,
}: {
  href: string;
  variant: "dark" | "light";
  children: React.ReactNode;
}) {
  const styles =
    variant === "dark"
      ? "bg-black text-white hover:bg-black/85"
      : "border border-border/20 bg-card text-foreground hover:bg-secondary";

  return (
    <Link className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${styles}`} href={href}>
      {children}
    </Link>
  );
}

function DarkCta({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <section className="bg-[#0e0d0c] px-5 py-20 text-[#fafafa] md:px-8 md:py-28">
      <div className="mx-auto flex max-w-[1000px] flex-col items-center text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff4000]">{eyebrow}</span>
        <h2 className="mt-6 max-w-[16ch] font-serif text-[clamp(2.5rem,6vw,5rem)] font-normal leading-[1] tracking-[-0.03em]">
          {title}
        </h2>
        <p className="mt-6 max-w-xl text-sm leading-6 text-white/60 md:text-base">{body}</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black" href="/newchat">
            Vào chat
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white" href="/teacher">
            Teacher Studio
          </Link>
        </div>
      </div>
    </section>
  );
}
