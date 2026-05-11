import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  Braces,
  FileDown,
  FileText,
  Images,
  PanelRight,
  Sigma,
  Sparkles,
  Table2,
} from "lucide-react";
import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { HeroDecor } from "@/components/landing/hero-decor";
import styles from "@/components/landing/marketing.module.css";

export const metadata: Metadata = {
  title: "Sản phẩm | AI Math Chat",
  description: "Tổng quan các chức năng chính của AI Math Chat: chat, file, công thức và xuất tài liệu.",
};

const FEATURE_CARDS = [
  {
    icon: Sigma,
    title: "Công thức rõ ràng",
    description: "KaTeX, Markdown, bảng và từng bước giải đều được trình bày gọn để dễ đọc lại.",
  },
  {
    icon: Images,
    title: "Đưa file vào trực tiếp",
    description: "Kéo thả ảnh, PDF, DOCX, Excel hoặc CSV rồi yêu cầu AI phân tích nội dung.",
  },
  {
    icon: FileDown,
    title: "Xuất nội dung đã trả lời",
    description: "Mở lại modal xuất, xem nhiều phiên bản Word/PDF và chọn bản muốn tải xuống.",
  },
  {
    icon: PanelRight,
    title: "Quản lý file bên phải",
    description: "Theo dõi file đang chờ gửi và file đã có trong cuộc trò chuyện ở một panel riêng.",
  },
];

const PRODUCT_DETAILS = [
  {
    eyebrow: "Nhập liệu",
    title: "Kéo thả tài liệu, dán ảnh, hỏi bài toán như đang chat.",
    description:
      "Khung chat hỗ trợ file ngay trong luồng làm việc. Khi bạn đưa tài liệu vào, app đọc nội dung và giữ file ở panel quản lý để xem lại hoặc xoá nhanh.",
    icon: FileText,
    points: ["Ảnh bài toán và bản vẽ tay", "PDF, DOCX, Excel, CSV", "Tự tạo prompt khi chỉ gửi file"],
  },
  {
    eyebrow: "Trình bày",
    title: "Lời giải có công thức, bảng và block sao chép riêng.",
    description:
      "Phần trả lời được render bằng Markdown và KaTeX để giữ cấu trúc toán học. Các block câu hỏi có nút sao chép riêng, phù hợp khi cần lấy từng phần đưa sang Word.",
    icon: BookOpenText,
    points: ["Markdown table", "KaTeX display math", "Copy từng phần"],
  },
  {
    eyebrow: "Math Studio",
    title: "Soạn công thức nhanh với bảng công cụ kiểu MathType.",
    description:
      "Math Studio gom template, ký hiệu, đạo hàm, ma trận, tập hợp, lượng giác và hình học trong một panel để chèn công thức vào chat mà không phải nhớ toàn bộ LaTeX.",
    icon: Braces,
    points: ["Template phân số, căn, tổng, tích phân", "Nhóm công thức tiếng Việt hoá", "Copy LaTeX hoặc copy đẹp"],
  },
];

const HIGHLIGHTS = [
  "Một workspace cho hỏi bài, đọc file và soạn tài liệu.",
  "Markdown + KaTeX giữ nguyên cấu trúc toán học.",
  "Xuất Word/PDF chỉ khi bạn thật sự cần, không tốn tài nguyên thừa.",
  "Teacher Studio tách riêng cho giáo viên soạn giáo án và đề kiểm tra.",
];

export default function ProductPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <MarketingHeader active="product" />

      <section className="relative mx-auto grid w-full max-w-[1200px] gap-10 px-5 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <HeroDecor chips={["Chat", "Math Studio", "Xuất Word/PDF"]} />
        <div className={`${styles.fadeUp} relative border-l border-border/20 pl-8`}>
          <Eyebrow>Sản phẩm</Eyebrow>
          <h1 className="mt-8 max-w-[12ch] font-serif text-[clamp(3.2rem,8vw,6.5rem)] font-normal leading-[0.96] tracking-[-0.04em]">
            Một workspace cho học toán<span className={`${styles.accentDot} text-[#ff4000]`}>.</span>
          </h1>
        </div>

        <div className={`${styles.fadeUp} ${styles.fadeUpDelay2} relative border-l border-border/20 pl-8`}>
          <p className="max-w-sm text-2xl font-semibold leading-tight md:text-3xl">
            Chat, file, công thức và xuất tài liệu trong cùng một nhịp.
          </p>
          <p className="mt-5 max-w-sm text-base leading-7 text-muted-foreground">
            AI Math Chat gom các thao tác hay bị rời rạc vào một màn hình: gửi đề, đọc tài liệu, trình bày công thức,
            copy từng phần và mở lại nội dung để xuất file khi cần.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PillLink href="/newchat" variant="dark">
              Mở chat
              <ArrowRight className="h-4 w-4" />
            </PillLink>
            <PillLink href="/workflow" variant="light">
              Xem quy trình
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
              <span className="ml-2">AI Math Chat · /newchat</span>
            </div>
            <div className="relative aspect-[16/9] pt-11">
              <Image
                src="/product-chat-screenshot.png"
                alt="Giao diện AI Math Chat"
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
            <Eyebrow>Tính năng</Eyebrow>
            <h2 className="mt-6 font-serif text-4xl font-normal leading-tight tracking-[-0.02em] md:text-6xl">
              Bốn việc app làm tốt nhất.
            </h2>
          </div>
          <p className="max-w-lg text-base leading-7 text-muted-foreground">
            Không cố gắng làm mọi thứ — chỉ tập trung những thao tác thật sự lặp lại khi học toán và soạn tài liệu.
          </p>
        </div>

        <div className={`${styles.staggerGrid} grid gap-3 md:grid-cols-2 lg:grid-cols-4`}>
          {FEATURE_CARDS.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className={`${styles.cardHover} min-h-[260px] rounded-[8px] border border-border/15 bg-card p-6`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-[#ff4000]">{String(index + 1).padStart(2, "0")}</span>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="mt-10 text-xl font-semibold leading-tight">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border/10 bg-card/55">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
          <div className="mb-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <Eyebrow>Chi tiết</Eyebrow>
              <h2 className="mt-6 font-serif text-4xl font-normal leading-tight tracking-[-0.02em] md:text-6xl">
                Ba khối chức năng chính.
              </h2>
            </div>
            <p className="max-w-lg text-base leading-7 text-muted-foreground">
              Mỗi khối giải một vấn đề rất cụ thể trong workflow học toán: nhập liệu, trình bày lời giải và soạn công thức.
            </p>
          </div>

          <div className={`${styles.staggerGrid} grid gap-5`}>
            {PRODUCT_DETAILS.map((detail, index) => {
              const Icon = detail.icon;
              return (
                <article
                  key={detail.title}
                  className={`${styles.cardHover} grid gap-6 rounded-[8px] border border-border/15 bg-card p-6 md:grid-cols-[minmax(0,0.85fr)_minmax(340px,1.15fr)] md:p-8`}
                >
                  <div className={index % 2 === 1 ? "md:order-2" : ""}>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/15 bg-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <Icon className="h-3.5 w-3.5 text-[#ff4000]" />
                      {detail.eyebrow}
                    </div>
                    <h3 className="font-serif text-2xl font-normal leading-tight tracking-[-0.01em] md:text-4xl">
                      {detail.title}
                    </h3>
                    <p className="mt-4 text-[15px] leading-7 text-muted-foreground">{detail.description}</p>
                    <ul className="mt-5 grid gap-2">
                      {detail.points.map((point) => (
                        <li key={point} className="flex gap-2 text-sm leading-6">
                          <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-[#ff4000]" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <ProductPreviewPanel variant={index} />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow>Vì sao</Eyebrow>
            <h2 className="mt-6 font-serif text-4xl font-normal leading-tight tracking-[-0.02em] md:text-6xl">
              Đơn giản nhưng đủ dùng.
            </h2>
          </div>
          <div className={`${styles.staggerGrid} grid gap-3`}>
            {HIGHLIGHTS.map((item) => (
              <div
                key={item}
                className={`${styles.cardHover} flex gap-3 rounded-[8px] border border-border/15 bg-card p-5 text-sm leading-6`}
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#ff4000]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DarkCta
        eyebrow="Bắt đầu"
        title="Mở chat hoặc Teacher Studio — chọn không gian phù hợp."
        body="Học sinh và phụ huynh vào chat thường. Giáo viên mở Teacher Studio khi cần soạn giáo án, đề kiểm tra và tài liệu dạy học."
      />

      <MarketingFooter />
    </main>
  );
}

function ProductPreviewPanel({ variant }: { variant: number }) {
  const content = [
    {
      title: "File manager",
      rows: ["de-thi.pdf · 35 trang", "bang-diem.xlsx · 4 sheet", "anh-bai-toan.png"],
      icon: FileText,
    },
    {
      title: "Rendered answer",
      rows: ["| Chủ đề | Ví dụ |", "∫₀¹ f(x)dx = 7/6", "Copy block riêng"],
      icon: Table2,
    },
    {
      title: "Formula palette",
      rows: ["Đại số · Đạo hàm · Ma trận", "a/b · √x · Σ · ∫", "Copy đẹp hoặc chèn chat"],
      icon: Sigma,
    },
  ][variant];
  const Icon = content.icon;

  return (
    <div className="rounded-[8px] border border-border/15 bg-secondary p-4">
      <div className="rounded-[8px] border border-border/15 bg-card p-4">
        <div className="mb-4 flex items-center justify-between border-b border-border/15 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-secondary text-[#ff4000]">
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold">{content.title}</p>
          </div>
          <span className="rounded-full border border-border/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Preview
          </span>
        </div>
        <div className="grid gap-2">
          {content.rows.map((row) => (
            <div
              key={row}
              className="rounded-[6px] border border-border/15 bg-secondary px-3 py-3 text-sm text-muted-foreground"
            >
              {row}
            </div>
          ))}
        </div>
      </div>
    </div>
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
  const cls =
    variant === "dark"
      ? "bg-black text-white hover:bg-black/85"
      : "border border-border/20 bg-card text-foreground hover:bg-secondary";
  return (
    <Link
      className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${cls}`}
      href={href}
    >
      {children}
    </Link>
  );
}

function DarkCta({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <section className="bg-[#0e0d0c] px-5 py-20 text-[#fafafa] md:px-8 md:py-28">
      <div className="mx-auto flex max-w-[1000px] flex-col items-center text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff4000]">{eyebrow}</span>
        <h2 className="mt-6 max-w-[18ch] font-serif text-[clamp(2.5rem,6vw,5rem)] font-normal leading-[1] tracking-[-0.03em]">
          {title}
        </h2>
        <p className="mt-6 max-w-xl text-sm leading-6 text-white/60 md:text-base">{body}</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black"
            href="/newchat"
          >
            Vào chat
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white"
            href="/teacher"
          >
            Teacher Studio
          </Link>
        </div>
      </div>
    </section>
  );
}
