import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Brain,
  ClipboardCheck,
  Download,
  FileText,
  GraduationCap,
  ImagePlus,
  LayoutPanelTop,
  LibraryBig,
  Paperclip,
  Sigma,
  Sparkles,
  SquarePen,
  Table2,
} from "lucide-react";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { HeroPromptBox } from "@/components/landing/hero-prompt-box";
import { ThemeInit } from "@/components/landing/theme-init";
import { Button } from "@/components/ui/button";

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
  {
    icon: Paperclip,
    title: "Đưa đề bài hoặc tài liệu vào",
    description: "Gõ câu hỏi, dán ảnh, kéo PDF, DOCX, Excel hoặc CSV vào khung chat. App giữ file ở nơi dễ kiểm tra trước khi gửi.",
    output: "Đầu vào rõ ràng, không cần viết prompt dài.",
  },
  {
    icon: Brain,
    title: "AI hiểu mục tiêu của bạn",
    description: "Bạn có thể yêu cầu giải bài, soạn giáo án, tạo đề, đọc file hoặc chỉ nhờ chép lại nội dung trong ảnh.",
    output: "Câu trả lời bằng tiếng Việt, có công thức và bố cục dễ đọc.",
  },
  {
    icon: ClipboardCheck,
    title: "Copy phần cần dùng",
    description: "Mỗi câu hỏi có block sao chép riêng. Công thức có nút copy riêng để đưa sang Word thuận tiện hơn.",
    output: "Dùng lại từng đoạn mà không phải copy cả câu trả lời dài.",
  },
  {
    icon: Download,
    title: "Xuất Word hoặc PDF khi cần",
    description: "Khi câu trả lời đã ổn, bạn mở phần xuất file để tải đề, đáp án, giáo án hoặc bản tóm tắt.",
    output: "Không tự chạy xuất file sau mỗi câu, tránh tốn tài nguyên.",
  },
];

const RESULT_EXAMPLES = [
  {
    title: "Lời giải cho học sinh",
    description: "Trình bày từng bước, có đáp án cuối, nêu lỗi sai thường gặp và gợi ý bài tương tự.",
    lines: ["Bước 1: Xác định dạng toán", "Bước 2: Biến đổi công thức", "Kết luận: Chọn đáp án B"],
  },
  {
    title: "Tài liệu cho giáo viên",
    description: "Chuyển file hoặc chủ đề thành giáo án, phiếu học tập, đề kiểm tra và đáp án chi tiết.",
    lines: ["Mục tiêu bài học", "Hoạt động dạy học", "Câu hỏi vận dụng"],
  },
  {
    title: "Nội dung để xuất file",
    description: "Giữ cấu trúc câu hỏi, đáp án, lời giải và chia thành các phần dễ đưa sang Word/PDF.",
    lines: ["Đề kiểm tra", "Đáp án", "Lời giải chi tiết"],
  },
];

const FOOTER_GROUPS = [
  {
    title: "Sản phẩm",
    links: [
      { label: "Tổng quan", href: "/product" },
      { label: "Quy trình", href: "/workflow" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Không gian làm việc",
    links: [
      { label: "Chat học tập", href: "/newchat" },
      { label: "Teacher Studio", href: "/teacher" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Bắt đầu",
    links: [
      { label: "Đăng nhập", href: "/login" },
      { label: "Dùng thử miễn phí", href: "/newchat" },
      { label: "Admin", href: "/dashboard/providers" },
    ],
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <ThemeInit />
      <MarketingHeader />

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
        <div className="mx-auto w-full max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
          <div className="mb-10 grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[hsl(var(--terracotta))]">
                Quy trình
              </p>
              <h2 className="text-3xl font-normal leading-tight md:text-5xl">
                Từ file hoặc câu hỏi đến tài liệu có thể dùng.
              </h2>
            </div>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Phần này được làm rõ hơn để người dùng mới không phải đoán: đưa nội dung vào đâu, AI xử lý kiểu gì, khi nào copy, khi nào xuất Word/PDF.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {WORKFLOW.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className="flex min-h-[320px] flex-col rounded-xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] transition-all hover:border-border/30 hover:shadow-[var(--shadow-md)]"
                >
                  <div className="mb-7 flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-[9.6px] border border-border/15 bg-background text-sm text-muted-foreground">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="font-sans text-xl font-semibold leading-tight">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
                  <div className="mt-auto pt-6">
                    <p className="rounded-xl border border-border/15 bg-secondary px-4 py-3 text-sm leading-6 text-foreground">
                      {step.output}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[hsl(var(--terracotta))]">
              Kết quả nhận được
            </p>
            <h2 className="text-3xl font-normal leading-tight md:text-5xl">
              Không chỉ trả lời, mà còn chia sẵn để dùng lại.
            </h2>
          </div>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            Người dùng non-tech cần nhìn thấy đầu ra thật. Vì vậy mỗi luồng đều hướng tới nội dung có thể đọc, copy hoặc xuất file ngay.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {RESULT_EXAMPLES.map((item) => (
            <article key={item.title} className="rounded-xl border border-border/15 bg-card p-6 shadow-[var(--shadow-sm)]">
              <h3 className="font-sans text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
              <div className="mt-6 rounded-xl border border-border/15 bg-secondary p-4">
                <div className="grid gap-2">
                  {item.lines.map((line) => (
                    <div key={line} className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm text-foreground">
                      <BadgeCheck className="h-4 w-4 shrink-0 text-[hsl(var(--terracotta))]" />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-border/15 bg-card p-6 shadow-[var(--shadow-sm)] md:p-10">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[hsl(var(--terracotta))]">
              Bắt đầu
            </p>
            <h2 className="max-w-3xl text-3xl font-normal leading-tight md:text-5xl">
              Chọn đúng không gian học, rồi để AI xử lý phần nặng.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Học sinh có thể vào chat để hỏi bài ngay. Giáo viên mở Teacher Studio khi cần soạn giáo án, tạo đề hoặc chuẩn bị tài liệu.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/login">
                  Đăng nhập để vào chat
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/teacher">Mở Teacher Studio</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <Link
              href="/newchat"
              className="group flex items-center gap-4 rounded-2xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] transition-all hover:border-border/30 hover:bg-secondary"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))] group-hover:bg-card">
                <BookOpenCheck className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-sans text-base font-semibold">Chat học tập</span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                  Hỏi bài, đọc ảnh, copy lời giải từng phần.
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
            </Link>

            <Link
              href="/teacher"
              className="group flex items-center gap-4 rounded-2xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] transition-all hover:border-border/30 hover:bg-secondary"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))] group-hover:bg-card">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-sans text-base font-semibold">Teacher Studio</span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                  Soạn bài, tạo đề, chuẩn bị đáp án và tài liệu.
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
            </Link>

            <Link
              href="/pricing"
              className="group flex items-center gap-4 rounded-2xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] transition-all hover:border-border/30 hover:bg-secondary"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))] group-hover:bg-card">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-sans text-base font-semibold">Gói sử dụng</span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                  Xem nhanh gói phù hợp cho học sinh, giáo viên hoặc lớp học.
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t border-border/10 bg-card/45">
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 py-12 md:px-10 md:py-16 lg:grid-cols-[1.2fr_1.8fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30" aria-label="AI Math Chat">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--terracotta))] text-white shadow-[rgba(217,119,87,0.18)_0px_8px_24px]">
              <Sigma className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">AI Math Chat</span>
              <span className="block text-xs text-muted-foreground">Học toán, soạn bài, xuất file</span>
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
            Workspace thử nghiệm cho học sinh, phụ huynh và giáo viên: hỏi bài, đọc tài liệu, soạn giáo án và chuẩn bị nội dung Word/PDF.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/15 bg-background px-3 py-2 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-[hsl(var(--terracotta))]" />
              Hỏi bài, đọc file, soạn bài trong một nơi.
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/15 bg-background px-3 py-2 text-xs text-muted-foreground">
              <Download className="h-4 w-4 text-[hsl(var(--terracotta))]" />
              Copy hoặc xuất Word/PDF khi cần.
            </span>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="font-sans text-sm font-semibold">{group.title}</h3>
              <ul className="mt-4 grid gap-3">
                {group.links.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/10">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-5 py-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
          <span>© 2026 AI Math Chat. Built for learning workflows.</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/workflow" className="hover:text-foreground">Quy trình</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
          </div>
        </div>
      </div>
    </footer>
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
