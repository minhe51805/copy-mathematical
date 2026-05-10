"use client";

import { type FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Brain,
  FileText,
  GraduationCap,
  ImagePlus,
  LayoutPanelTop,
  LibraryBig,
  Paperclip,
  SendHorizontal,
  Sigma,
  Sparkles,
  SquarePen,
  Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { setPendingGuestPrompt } from "@/lib/guest-access";
import { initializeTheme } from "@/hooks/use-theme";

const NAV_LINKS = [
  { label: "Sản phẩm", href: "/product" },
  { label: "Quy trình", href: "/workflow" },
  { label: "Pricing", href: "/pricing" },
  { label: "Teacher", href: "/teacher" },
];

const QUICK_ACTIONS = [
  {
    label: "Giải bài tập",
    href: "/newchat",
    icon: BookOpenCheck,
  },
  {
    label: "Soạn giáo án",
    href: "/teacher",
    icon: GraduationCap,
  },
  {
    label: "Đọc file",
    href: "/newchat",
    icon: Paperclip,
  },
  {
    label: "Math Studio",
    href: "/product",
    icon: Sigma,
  },
];

const NEWS_CARDS = [
  {
    eyebrow: "Chat học tập",
    title: "Hỏi bài bằng ảnh, file hoặc văn bản",
    description: "Gửi ảnh bài toán, PDF, DOCX, Excel hoặc CSV để AI đọc nội dung và giải thích theo từng bước.",
    icon: ImagePlus,
    href: "/newchat",
  },
  {
    eyebrow: "Teacher Studio",
    title: "Soạn tài liệu dạy học nhanh hơn",
    description: "Không cần viết prompt dài. Chọn loại tài liệu, thêm file và để app tạo giáo án, phiếu học tập hoặc đề kiểm tra.",
    icon: SquarePen,
    href: "/teacher",
  },
  {
    eyebrow: "Xuất file",
    title: "Từ câu trả lời thành Word hoặc PDF",
    description: "Chọn lại nội dung vừa trả lời, xem phiên bản xuất file và tải tài liệu phục vụ học tập hoặc giảng dạy.",
    icon: FileText,
    href: "/workflow",
  },
  {
    eyebrow: "Math Studio",
    title: "Soạn công thức theo bảng ký hiệu",
    description: "Các nhóm đại số, đạo hàm, ma trận, tập hợp, lượng giác và hình học được gom vào một nơi dễ dùng.",
    icon: Sigma,
    href: "/product",
  },
];

const FEATURE_ROWS = [
  {
    title: "Dành cho người học",
    description: "Giải bài tập, so sánh nhiều hướng giải và giải thích lại theo cách dễ hiểu cho học sinh, sinh viên hoặc phụ huynh.",
    icon: Brain,
    points: ["Nhận ảnh bài toán", "Giải từng bước", "Nêu lỗi sai thường gặp"],
  },
  {
    title: "Dành cho giáo viên",
    description: "Tạo giáo án, phiếu học tập, đề kiểm tra và đáp án chi tiết từ chủ đề hoặc từ file tài liệu đã có.",
    icon: GraduationCap,
    points: ["Soạn theo khối lớp", "Tạo đề nhanh", "Xuất đề và đáp án"],
  },
  {
    title: "Dành cho tài liệu toán",
    description: "Giữ bố cục Markdown, bảng, công thức KaTeX và các block sao chép riêng để đưa sang Word gọn hơn.",
    icon: LayoutPanelTop,
    points: ["Bảng Markdown", "Block copy riêng", "File manager bên phải"],
  },
];

const WORKFLOW = [
  "Nhập câu hỏi hoặc kéo file vào khung chat.",
  "AI đọc nội dung và trả lời bằng tiếng Việt có công thức.",
  "Sao chép từng phần, mở Math Studio hoặc xuất Word/PDF.",
];

export default function LandingPage() {
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/10 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-5 md:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="AI Math Chat">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--terracotta))] text-white shadow-[rgba(217,119,87,0.18)_0px_8px_24px]">
              <Sigma className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold">AI Math Chat</span>
              <span className="block text-xs text-muted-foreground">Học toán, soạn bài, xuất file</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/login">
                Đăng nhập
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[1440px] flex-col px-5 py-10 md:px-10 md:py-14">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/15 bg-card px-4 py-2 text-sm text-muted-foreground shadow-[var(--shadow-sm)]">
            <Sparkles className="h-4 w-4 text-[hsl(var(--terracotta))]" />
            Một workspace cho toán học, tài liệu và lớp học
          </div>

          <h1 className="max-w-5xl text-center text-[clamp(2.6rem,7vw,5.8rem)] font-normal leading-[0.98] tracking-[-0.02em]">
            AI Math có thể giúp gì cho bạn?
          </h1>

          <p className="mt-6 max-w-2xl text-center text-base leading-7 text-muted-foreground md:text-[17px]">
            Hỏi bài toán, đưa file vào để phân tích, soạn giáo án hoặc xuất nội dung thành tài liệu.
            Trang chủ được thiết kế như một điểm bắt đầu: ít chữ, rõ tác vụ, bấm là đi đúng nơi.
          </p>

          <HeroPromptBox />

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border/15 bg-card px-4 text-sm text-foreground shadow-[var(--shadow-sm)] transition-colors hover:border-border/30 hover:bg-secondary"
                >
                  <Icon className="h-4 w-4 text-[hsl(var(--terracotta))]" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 pt-12 md:grid-cols-4">
          {NEWS_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group min-h-[190px] rounded-xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-border/30 hover:shadow-[var(--shadow-md)]"
              >
                <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-[hsl(var(--terracotta))]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {card.eyebrow}
                </span>
                <h2 className="mt-2 font-sans text-lg font-semibold leading-6 tracking-normal">
                  {card.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border/10 bg-card/45">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[hsl(var(--terracotta))]">
              Sản phẩm
            </p>
            <h2 className="max-w-2xl text-3xl font-normal leading-tight md:text-5xl">
              Giao diện chat là trung tâm, các công cụ nằm xung quanh đúng lúc cần.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Lấy cảm hứng từ nhịp trang chủ OpenAI: mở đầu bằng một câu hỏi, đưa người dùng vào hành động ngay,
              rồi mới trình bày các nhóm chức năng ở bên dưới.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/login">
                  Bắt đầu hỏi bài
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/teacher">Mở Teacher Studio</Link>
              </Button>
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[hsl(var(--terracotta))]">
              Dùng cho ai?
            </p>
            <h2 className="text-3xl font-normal leading-tight md:text-5xl">
              Ba luồng chính, một kiểu thao tác đơn giản.
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/product">Xem trang sản phẩm</Link>
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {FEATURE_ROWS.map((row) => {
            const Icon = row.icon;
            return (
              <article key={row.title} className="rounded-xl border border-border/15 bg-card p-6 shadow-[var(--shadow-sm)]">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">{row.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{row.description}</p>
                <ul className="mt-6 grid gap-3">
                  {row.points.map((point) => (
                    <li key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BadgeCheck className="h-4 w-4 text-[hsl(var(--terracotta))]" />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border/10 bg-card/45">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[hsl(var(--terracotta))]">
              Quy trình
            </p>
            <h2 className="text-3xl font-normal leading-tight md:text-5xl">
              Từ file hoặc câu hỏi đến tài liệu có thể dùng.
            </h2>
          </div>
          <div className="grid gap-3">
            {WORKFLOW.map((step, index) => (
              <div key={step} className="grid gap-4 rounded-xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] sm:grid-cols-[44px_minmax(0,1fr)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-[9.6px] bg-[#1F1E1D] text-sm text-white dark:bg-[#FAF9F5] dark:text-[#1F1E1D]">
                  {index + 1}
                </span>
                <p className="pt-2 text-base leading-7 text-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
        <div className="rounded-xl border border-border/15 bg-[#1F1E1D] p-6 text-[#FAF9F5] shadow-[var(--shadow-md)] md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#D97757]">
                Bắt đầu
              </p>
              <h2 className="max-w-3xl text-3xl font-normal leading-tight md:text-5xl">
                Vào chat sau đăng nhập, hoặc mở Teacher Studio để soạn bài.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="bg-[#FAF9F5] text-[#1F1E1D] hover:bg-white">
                <Link href="/login">
                  Đăng nhập
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/30 bg-transparent text-[#FAF9F5] hover:bg-white/10">
                <Link href="/pricing">Xem pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroPromptBox() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = prompt.trim();

    if (value) {
      setPendingGuestPrompt(value);
    }

    router.push("/newchat");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 w-full max-w-3xl rounded-[28px] border border-border/15 bg-card p-3 shadow-[var(--shadow-md)] transition-all hover:border-border/30 hover:shadow-[var(--shadow-lg)]"
      aria-label="Bắt đầu chat với AI Math"
    >
      <div className="flex min-h-16 items-center gap-3 rounded-[22px] bg-secondary px-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/15 bg-card text-muted-foreground">
          <Paperclip className="h-4 w-4" />
        </span>
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="Hoi bai toan, keo file vao hoac yeu cau soan giao an..."
        />
        <span className="hidden min-w-0 flex-1 truncate text-left text-base text-muted-foreground">
          Hỏi bài toán, kéo file vào hoặc yêu cầu soạn giáo án...
        </span>
        <button
          type="submit"
          className="hidden h-10 items-center gap-2 rounded-full bg-[#1F1E1D] px-4 text-sm text-white transition hover:bg-[#0A0A0A] dark:bg-[#FAF9F5] dark:text-[#1F1E1D] dark:hover:bg-white sm:inline-flex"
        >
          Bat dau
          <SendHorizontal className="h-4 w-4" />
        </button>
        <span className="hidden h-10 items-center gap-2 rounded-full bg-[#1F1E1D] px-4 text-sm text-white dark:bg-[#FAF9F5] dark:text-[#1F1E1D]">
          Bắt đầu
          <SendHorizontal className="h-4 w-4" />
        </span>
      </div>
    </form>
  );
}

function ProductPreview() {
  return (
    <div className="rounded-xl border border-border/15 bg-card p-3 shadow-[var(--shadow-md)]">
      <div className="overflow-hidden rounded-xl border border-border/15 bg-[#1F1E1D] text-[#FAF9F5]">
        <div className="flex h-12 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#DC6038]" />
            <span className="h-3 w-3 rounded-full bg-[#D29922]" />
            <span className="h-3 w-3 rounded-full bg-[#BCD1CA]" />
          </div>
          <span className="text-xs text-[#FAF9F5]/60">AI Math Chat · /newchat</span>
        </div>
        <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
          <div className="relative min-h-[360px]">
            <Image
              src="/product-chat-screenshot.png"
              alt="Ảnh giao diện chat AI Math"
              width={1040}
              height={720}
              priority
              className="h-full w-full object-cover object-left-top opacity-95"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#1F1E1D]/50" />
          </div>
          <div className="border-t border-white/10 p-4 lg:border-l lg:border-t-0">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center gap-2">
                <LibraryBig className="h-4 w-4 text-[#D97757]" />
                <p className="text-sm font-semibold">File trong cuộc trò chuyện</p>
              </div>
              <div className="grid gap-2">
                {["de-thi.pdf", "bang-diem.xlsx", "anh-bai-toan.png"].map((file) => (
                  <div key={file} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#FAF9F5]/78">
                    {file}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Table2 className="h-4 w-4 text-[#D97757]" />
                <p className="text-sm font-semibold">Kết quả có cấu trúc</p>
              </div>
              <p className="text-sm leading-6 text-[#FAF9F5]/70">
                Công thức, bảng và nội dung xuất file được giữ trong cùng luồng chat.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
