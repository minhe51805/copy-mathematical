"use client";

import { useEffect } from "react";
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
  LockKeyhole,
  PanelRight,
  Sigma,
  Sparkles,
  Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { initializeTheme } from "@/hooks/use-theme";
import { MOCK_AUTH_USER } from "@/lib/mock-auth";

const FEATURE_CARDS = [
  {
    icon: Sigma,
    title: "Công thức rõ ràng",
    description: "KaTeX, Markdown, bảng và từng bước giải được trình bày gọn để dễ đọc lại.",
  },
  {
    icon: Images,
    title: "Đưa file vào trực tiếp",
    description: "Kéo thả ảnh, PDF, DOCX, Excel hoặc CSV rồi yêu cầu AI phân tích nội dung.",
  },
  {
    icon: FileDown,
    title: "Xuất nội dung đã trả lời",
    description: "Mở lại modal xuất file, xem nhiều phiên bản và chọn bản muốn tải xuống.",
  },
  {
    icon: PanelRight,
    title: "Quản lý file bên phải",
    description: "Theo dõi file đang chờ gửi và file đã có trong cuộc trò chuyện.",
  },
];

const PRODUCT_DETAILS = [
  {
    eyebrow: "Nhập liệu",
    title: "Kéo thả tài liệu, dán ảnh, hỏi bài toán như đang chat.",
    description:
      "Khung chat hỗ trợ file ngay trong luồng làm việc. Khi bạn đưa tài liệu vào, app đọc nội dung và giữ file ở panel quản lý để có thể xem lại hoặc xoá nhanh.",
    icon: FileText,
    points: ["Ảnh bài toán và bản vẽ tay", "PDF, DOCX, Excel, CSV", "Tự tạo prompt khi chỉ gửi file"],
  },
  {
    eyebrow: "Trình bày",
    title: "Lời giải có công thức, bảng và block sao chép riêng.",
    description:
      "Phần trả lời được render bằng Markdown và KaTeX để giữ cấu trúc toán học. Các block câu hỏi có nút sao chép riêng, phù hợp khi cần lấy từng phần đưa sang Word hoặc tài liệu khác.",
    icon: BookOpenText,
    points: ["Markdown table", "KaTeX display math", "Copy từng phần"],
  },
  {
    eyebrow: "Math Studio",
    title: "Soạn công thức nhanh với bảng công cụ kiểu MathType.",
    description:
      "Math Studio gom template, ký hiệu, đạo hàm, ma trận, tập hợp, lượng giác và hình học trong một panel để chèn công thức vào chat mà không phải nhớ toàn bộ LaTeX.",
    icon: Braces,
    points: ["Template phân số, căn, tổng, tích phân", "Nhóm công thức tiếng Việt hoá dần", "Copy LaTeX hoặc copy đẹp"],
  },
];

const WORKFLOW_STEPS = [
  {
    title: "Đưa đề bài vào",
    description: "Gõ câu hỏi, dán ảnh, hoặc kéo tài liệu vào chat. App hiển thị file đang chờ gửi để kiểm tra trước khi hỏi.",
  },
  {
    title: "AI đọc và giải",
    description: "Model nhận văn bản, ảnh hoặc nội dung trích xuất từ tài liệu rồi trả lời bằng tiếng Việt với công thức toán.",
  },
  {
    title: "Chọn nội dung cần dùng",
    description: "Bạn sao chép từng phần, mở lại modal xuất nội dung hoặc chọn phiên bản tài liệu phù hợp để tải.",
  },
  {
    title: "Mở lại bằng URL",
    description: "Chat mới nằm ở /newchat, chat cũ được mở lại bằng dạng /newchat?=#idchat để dễ chia luồng làm việc.",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "Mock",
    description: "Dành cho giai đoạn thử nghiệm giao diện và luồng đăng nhập nội bộ.",
    features: ["Đăng nhập mock", "Chat toán cơ bản", "Lưu lịch sử local", "Quản lý file trong phiên"],
  },
  {
    name: "Study Pro",
    price: "Đề xuất",
    description: "Gói chính cho người học, giáo viên và người cần xử lý bài tập thường xuyên.",
    features: ["Nhận ảnh bài toán", "Đọc tài liệu", "Math Studio", "Xuất DOCX theo phiên bản", "Copy công thức đẹp"],
    highlighted: true,
  },
  {
    name: "Classroom",
    price: "Tuỳ chỉnh",
    description: "Hướng phát triển cho lớp học hoặc trung tâm có nhiều tài liệu và mẫu xuất riêng.",
    features: ["Thư viện bài tập", "Mẫu xuất riêng", "Không gian nhóm", "Quản lý quyền truy cập"],
  },
];

export default function LandingPage() {
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border/10 bg-background/95">
        <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-5 md:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--terracotta))] text-white shadow-[rgba(217,119,87,0.18)_0px_8px_24px]">
              <Sigma className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-5">AI Math Chat</p>
              <p className="text-xs text-muted-foreground">Trợ lý toán học thông minh</p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            <Link className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground" href="/product">
              Sản phẩm
            </Link>
            <Link className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground" href="/teacher">
              Giáo viên
            </Link>
            <Link className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground" href="/newchat">
              Học sinh
            </Link>
            <Link className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground" href="/workflow">
              Quy trình
            </Link>
            <Link className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground" href="/pricing">
              Pricing
            </Link>
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

      <section className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 py-12 md:px-10 md:py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(560px,1.1fr)] lg:items-center">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-border/15 bg-card px-3 py-2 text-sm text-muted-foreground shadow-[var(--shadow-sm)]">
            <Sparkles className="h-4 w-4 text-[hsl(var(--terracotta))]" />
            Workspace cho toán học, tài liệu và xuất nội dung
          </div>
          <h1 className="max-w-3xl text-4xl font-normal leading-tight md:text-6xl md:leading-[1.08]">
            Giải toán có công thức đẹp, đọc tài liệu và xuất file trong cùng một nơi.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-[17px]">
            Trang chat được chuyển sang <span className="font-medium text-foreground">/newchat</span>. Trước khi vào,
            người dùng đi qua trang giới thiệu để nắm nhanh sản phẩm, chức năng, quy trình và gói dùng thử.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">
                Đăng nhập để vào chat
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/product">Xem chi tiết app</Link>
            </Button>
          </div>
        </div>

        <HeroProductShot />
      </section>

      <section className="border-y border-border/10 bg-card/45">
        <div className="mx-auto grid w-full max-w-[1440px] gap-4 px-5 py-8 md:grid-cols-4 md:px-10">
          {[
            ["Markdown + KaTeX", "Bảng, công thức, block copy"],
            ["File input", "Ảnh, PDF, DOCX, Excel, CSV"],
            ["Export modal", "Chọn nội dung và phiên bản"],
            ["URL chat", "/newchat?=#idchat"],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-xl border border-border/15 bg-card p-4 shadow-[var(--shadow-sm)]">
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="product" className="mx-auto w-full max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
        <div className="mb-10 max-w-3xl">
          <h2 className="text-3xl font-normal md:text-5xl">Một app toán học có đủ phần làm việc quan trọng.</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Bên dưới là phần giới thiệu chi tiết, tách khỏi form đăng nhập để landing page đọc mạch lạc hơn.
            Mỗi khối mô tả một nhóm chức năng thật đang có trong sản phẩm.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {FEATURE_CARDS.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-xl border border-border/15 bg-card p-6 shadow-[var(--shadow-sm)]">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.description}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-12 grid gap-5">
          {PRODUCT_DETAILS.map((detail, index) => {
            const Icon = detail.icon;
            return (
              <article
                key={detail.title}
                className="grid gap-6 rounded-xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] md:grid-cols-[minmax(0,0.85fr)_minmax(340px,1.15fr)] md:p-8"
              >
                <div className={index % 2 === 1 ? "md:order-2" : ""}>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-border/15 bg-secondary px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    <Icon className="h-4 w-4 text-[hsl(var(--terracotta))]" />
                    {detail.eyebrow}
                  </div>
                  <h3 className="text-2xl font-normal leading-tight md:text-3xl">{detail.title}</h3>
                  <p className="mt-4 text-[15px] leading-7 text-muted-foreground">{detail.description}</p>
                  <ul className="mt-5 grid gap-2">
                    {detail.points.map((point) => (
                      <li key={point} className="flex gap-2 text-sm text-muted-foreground">
                        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--terracotta))]" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <ProductMiniFrame variant={index} />
              </article>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="border-y border-border/10 bg-card/45">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <h2 className="text-3xl font-normal md:text-5xl">Quy trình từ đề bài tới tài liệu.</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Lấy cảm hứng từ cách các trang solution giải thích use-case: mỗi bước là một tác vụ rõ ràng,
              không chen form đăng nhập vào phần nội dung chi tiết.
            </p>
          </div>
          <div className="grid gap-3">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step.title} className="grid gap-4 rounded-xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] sm:grid-cols-[44px_minmax(0,1fr)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-[9.6px] bg-[#1F1E1D] text-sm text-white dark:bg-[#FAF9F5] dark:text-[#1F1E1D]">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-normal md:text-5xl">Pricing định hướng.</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Hiện app dùng tài khoản mock để phát triển. Phần pricing được trình bày dạng plan card rõ ràng,
              giống một trang sản phẩm thật để sau này dễ gắn thanh toán hoặc quyền truy cập.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/login">Dùng bản mock</Link>
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {PRICING.map((plan) => (
            <article
              key={plan.name}
              className={[
                "rounded-xl border bg-card p-6 shadow-[var(--shadow-sm)]",
                plan.highlighted
                  ? "border-[hsl(var(--terracotta))] shadow-[rgba(217,119,87,0.1)_0px_8px_32px_0px]"
                  : "border-border/15",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                </div>
                {plan.highlighted && (
                  <span className="rounded-lg border border-[hsl(var(--terracotta))]/30 bg-[hsl(var(--terracotta))]/10 px-3 py-1 text-xs font-medium text-[hsl(var(--terracotta))]">
                    Nổi bật
                  </span>
                )}
              </div>
              <p className="mt-6 text-3xl font-semibold">{plan.price}</p>
              <ul className="mt-6 grid gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--terracotta))]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function HeroProductShot() {
  return (
    <div className="relative rounded-xl border border-border/15 bg-card p-3 shadow-[var(--shadow-md)]">
      <div className="overflow-hidden rounded-xl border border-border/15 bg-[#1F1E1D] text-[#FAF9F5] shadow-[var(--shadow-sm)]">
        <div className="flex h-12 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#DC6038]" />
            <span className="h-3 w-3 rounded-full bg-[#D29922]" />
            <span className="h-3 w-3 rounded-full bg-[#BCD1CA]" />
          </div>
          <span className="text-xs text-[#FAF9F5]/55">/newchat?=#demo</span>
        </div>
        <div className="relative aspect-[1040/720] min-h-[360px]">
          <Image
            src="/product-chat-screenshot.png"
            alt="Ảnh chụp giao diện AI Math Chat trong trang /newchat"
            width={1040}
            height={720}
            priority
            className="h-full w-full object-cover object-left-top opacity-95"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#1F1E1D]/55" />
        </div>
      </div>

      <div
        id="product-login"
        className="mt-3 rounded-xl border border-border/15 bg-card p-4 shadow-[var(--shadow-md)] lg:absolute lg:bottom-5 lg:right-5 lg:mt-0 lg:w-[320px]"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-[hsl(var(--terracotta))]">
            <LockKeyhole className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Đăng nhập tại /login</h2>
            <p className="text-xs text-muted-foreground">
              User: {MOCK_AUTH_USER.username} · Pass: {MOCK_AUTH_USER.password}
            </p>
          </div>
        </div>
        <p className="mb-4 text-sm leading-6 text-muted-foreground">
          Form đăng nhập đã được tách ra trang riêng để landing page gọn hơn và `/newchat` luôn đi qua một cổng xác thực rõ ràng.
        </p>
        <Button asChild className="w-full">
          <Link href="/login">
            Mở trang đăng nhập
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ProductMiniFrame({ variant }: { variant: number }) {
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
      rows: ["Algebra · Đạo hàm · Ma trận", "a/b · √x · ∑ · ∫", "Copy đẹp hoặc chèn chat"],
      icon: Sigma,
    },
  ][variant];
  const Icon = content.icon;

  return (
    <div className="rounded-xl border border-border/15 bg-secondary p-4">
      <div className="rounded-xl border border-border/15 bg-card p-4 shadow-[var(--shadow-sm)]">
        <div className="mb-4 flex items-center justify-between border-b border-border/15 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-[hsl(var(--terracotta))]">
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold">{content.title}</p>
          </div>
          <span className="rounded-lg border border-border/15 px-2 py-1 text-xs text-muted-foreground">Preview</span>
        </div>
        <div className="grid gap-2">
          {content.rows.map((row) => (
            <div key={row} className="rounded-lg border border-border/15 bg-secondary px-3 py-3 text-sm text-muted-foreground">
              {row}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
