import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  ClipboardCheck,
  Download,
  LayoutPanelTop,
  Paperclip,
  Sigma,
} from "lucide-react";
import { HeroPromptBox } from "@/components/landing/hero-prompt-box";
import { LandingIntro } from "@/components/landing/landing-intro";
import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingHeader } from "@/components/landing/marketing-header";

export const metadata: Metadata = {
  title: "AI Math Chat",
  description: "Hỏi bài, soạn giáo án và xuất tài liệu trong một workspace rõ ràng, dễ dùng.",
};

const ACCENT = "hsl(var(--terracotta))";

const OLD_WAY = [
  "Lật sách, search Google, gõ lại từng dòng",
  "Copy lời giải nhưng mất công thức khi dán",
  "Soạn đề/đáp án bằng Word — căn chỉnh thủ công",
  "Mỗi câu hỏi thêm lại bắt đầu một thread mới",
];

const NEW_WAY = [
  "Hỏi bằng ảnh, file PDF, DOCX hay văn bản — một chỗ",
  "Công thức, bảng, code giữ đúng layout — copy riêng từng phần",
  "Xuất Word/PDF có nhiều phiên bản chỉ trong vài giây",
  "Lưu hội thoại, làm rõ thêm bất cứ lúc nào",
];

const WORKFLOW_INTRO = {
  eyebrow: "Quy trình",
  title: "Từ câu hỏi tới tài liệu, không bị lạc bước.",
  description:
    "Bốn bước, bốn vai trò — bạn không cần học prompt, chỉ cần biết mình muốn gì.",
};

const WORKFLOW_STEPS = [
  {
    icon: Paperclip,
    title: "Đưa nội dung vào",
    description: "Gõ câu hỏi, dán ảnh, kéo PDF, DOCX, Excel hoặc CSV vào khung chat.",
  },
  {
    icon: Brain,
    title: "AI hiểu mục tiêu",
    description: "Chọn việc cần làm: giải bài, soạn giáo án, đọc file hay làm rõ một công thức khó.",
  },
  {
    icon: ClipboardCheck,
    title: "Copy phần cần dùng",
    description: "Mỗi câu trả lời đều có block copy riêng, công thức có nút sao chép riêng để dán lại dễ hơn.",
  },
  {
    icon: Download,
    title: "Xuất file khi thật sự cần",
    description: "Mở modal xuất Word/PDF, chọn phiên bản phù hợp rồi tải về cho lớp học hoặc cá nhân.",
  },
];

const PERSONA_STEPS = [
  {
    role: "Học sinh",
    headline: "Bắt đầu mỗi buổi học với hướng đi rõ ràng.",
    subtitle: "Không cần học prompt. Không cần training. Chỉ cần biết bước kế tiếp.",
    bullets: [
      {
        title: "“Biết phải làm gì tiếp.”",
        body: "Một danh sách câu hỏi rõ — không phải mở 3 tab. Hướng dẫn từng bước theo đúng dạng bài, không phải tìm lại mẫu giải cũ.",
      },
      {
        title: "Bám sát cách bạn đang học.",
        body: "Ghi lại cách giải hợp với bạn — không cần viết dài. Mở lại công thức khi bí. Hỏi tiếp mà không phải nhắc lại đề.",
      },
    ],
  },
  {
    role: "Phụ huynh",
    headline: "Hiểu đủ để hướng dẫn con — không cần là dân toán.",
    subtitle: "Đưa bài vào, đọc tóm tắt, mở giải thích khi cần.",
    bullets: [
      {
        title: "Đọc 30 giây, hiểu được.",
        body: "Tóm tắt ngắn ở đầu mỗi câu trả lời. Phần giải thích bung ra khi muốn xem chi tiết với con.",
      },
      {
        title: "Lưu lại để hỏi tiếp.",
        body: "Mọi hội thoại được giữ trong workspace. Mở lại sau bữa tối, hỏi tiếp đúng chỗ vừa dừng.",
      },
    ],
  },
  {
    role: "Giáo viên",
    headline: "Soạn giáo án và đề kiểm tra như cách bạn làm thật.",
    subtitle: "Teacher Studio gom file, chủ đề và prompt gợi ý vào một chỗ.",
    bullets: [
      {
        title: "Không phải template cứng.",
        body: "Mô tả ngắn ý đồ dạy — AI dựng cấu trúc bài. Sửa từng phần, không phải gõ lại cả file.",
      },
      {
        title: "Xuất Word/PDF nhiều phiên bản.",
        body: "Một lệnh ra cả bản đề, bản đáp án, bản tách câu. Copy riêng từng câu cho nhóm WhatsApp.",
      },
    ],
  },
  {
    role: "Tổ chuyên môn",
    headline: "Giữ chất lượng nội dung đồng nhất giữa các lớp.",
    subtitle: "Một workspace cho cả tổ — không còn lạc file giữa Zalo.",
    bullets: [
      {
        title: "Một nguồn nội dung.",
        body: "Mọi đề, giáo án, đáp án nằm trong cùng một dashboard, có thể chia theo khối/môn.",
      },
      {
        title: "Tái sử dụng nhanh.",
        body: "Lấy lại đề năm trước, AI điều chỉnh độ khó hoặc đổi số liệu trong vài giây.",
      },
    ],
  },
  {
    role: "Nhà trường",
    headline: "Triển khai cho cả trường mà không cần IT.",
    subtitle: "Một tài khoản admin, ba lớp người dùng, lộ trình rõ.",
    bullets: [
      {
        title: "Bật là chạy.",
        body: "Không cần cài máy chủ. Đăng nhập bằng Google, phân vai trò trong dashboard.",
      },
      {
        title: "Kiểm soát chi phí.",
        body: "Quản lý lượt dùng theo giáo viên hoặc lớp. Xem báo cáo lượt tạo tài liệu mỗi tuần.",
      },
    ],
  },
];

const FEATURE_BLOCKS = [
  {
    icon: ClipboardCheck,
    eyebrow: "Workflow",
    title: "Được dựng quanh cách bạn thật sự làm.",
    tagline: "Phần mềm gọn — tốt lên mỗi ngày.",
    points: [
      {
        title: "“Chỉ cho tôi việc kế tiếp.”",
        body: "Một danh sách câu hỏi rõ — không phải ba hệ thống và một cái bảng trắng. Hướng dẫn theo bước, không phải đi lùng phiên bản đúng của tài liệu.",
      },
      {
        title: "Không còn template cứng.",
        body: "Ghi lại cách giải/cách dạy thật sự hiệu quả — không cần viết dài. Mở manual của bài hoặc công thức ngay khi gặp khó.",
      },
    ],
  },
  {
    icon: LayoutPanelTop,
    eyebrow: "Giao diện",
    title: "Tối giản — chỉ hiện đúng việc cần.",
    tagline: "Mỗi màn hình chỉ giữ thứ liên quan tới vai trò bạn đang dùng.",
    points: [
      {
        title: "“Chỉ cho tôi việc kế tiếp.”",
        body: "Danh sách câu hỏi rõ ràng, hướng dẫn theo bước. Không phải đi tìm SOP đúng hay file di chuyển khắp Zalo.",
      },
      {
        title: "Dùng được mỗi ngày, mọi vai trò.",
        body: "Mỗi màn hình được dựng cho công việc tương ứng — học, dạy hay quản lý. Hệ thống dẫn dắt và giữ mọi người đồng bộ.",
      },
    ],
  },
  {
    icon: Brain,
    eyebrow: "Dữ liệu",
    title: "Nền dữ liệu sẵn sàng mở rộng.",
    tagline: "Luôn học. Luôn tốt lên.",
    points: [
      {
        title: "“Chỉ cho tôi việc kế tiếp.”",
        body: "Khi cả lớp/cả trường dùng, dữ liệu giữ sạch nhờ giao diện đơn giản và validate sớm.",
      },
      {
        title: "Sẵn sàng cho AI nhờ việc hằng ngày.",
        body: "Mọi hội thoại tạo ra một luồng dữ liệu real-time đáng tin — sẵn sàng để mở rộng và tối ưu khi cần.",
      },
    ],
  },
  {
    icon: Sigma,
    eyebrow: "Thông minh",
    title: "Trí tuệ vận hành thực sự.",
    tagline: "Trợ lý có kiến thức về cả lớp học của bạn.",
    points: [
      {
        title: "“Chỉ cho tôi việc kế tiếp.”",
        body: "Câu hỏi học sinh nào hỏi nhiều? Bài nào học sinh trượt nhiều? Câu trả lời đến từ dữ liệu thật — không phải phán đoán.",
      },
      {
        title: "Hỏi gì cũng có ngay câu trả lời.",
        body: "Giáo án, công thức và cách giải mẫu của bạn đều search được khi cần. Không phải nhớ file đang nằm ở đâu.",
      },
    ],
  },
];

const COMPARISON_COLUMNS = [
  { id: "humble", label: "AI Math Chat", accent: true },
  { id: "google", label: "Tự search Google", accent: false },
  { id: "word", label: "Word + LaTeX tay", accent: false },
  { id: "none", label: "Không dùng AI", accent: false },
];

const COMPARISON_ROWS: Array<{ label: string; values: [string, string, string, string] }> = [
  {
    label: "Thời gian có kết quả",
    values: ["Vài phút sau khi hỏi", "30–60 phút search & lọc", "1–2 giờ gõ tay", "Không có"],
  },
  {
    label: "Tần suất cải tiến",
    values: [
      "Hỏi tiếp ngay, làm rõ trong cùng hội thoại",
      "Mỗi lần lại bắt đầu lại",
      "Sửa tay mỗi lần",
      "Workarounds tự duy trì",
    ],
  },
  {
    label: "Mức độ tiếp nhận của học sinh",
    values: [
      "Có ngay block copy riêng từng câu",
      "Copy-paste thường mất công thức",
      "File cuối cùng đẹp nhưng cứng",
      "Phụ thuộc người giảng lại",
    ],
  },
  {
    label: "Chi phí khi đổi nội dung",
    values: ["Thấp — sửa trong chat là xong", "Trung bình — gõ lại", "Cao — căn chỉnh lại Word", "Ẩn (đến từ workaround)"],
  },
  {
    label: "Chất lượng dữ liệu lưu lại",
    values: [
      "Sạch từ ngày 1 — mỗi hội thoại đã có cấu trúc",
      "Không có",
      "Mỗi file một định dạng",
      "Chỉ trong đầu người dạy",
    ],
  },
  {
    label: "Hỗ trợ dạng bài khó / 5% edge case",
    values: [
      "Có sẵn — math, code, bảng, công thức nhiều dòng",
      "Mỗi loại bài lại tìm site khác",
      "LaTeX tay được nhưng tốn thời gian",
      "Spreadsheet vá tạm",
    ],
  },
  {
    label: "Tích hợp file",
    values: [
      "PDF, DOCX, Excel, ảnh — drop là đọc được",
      "Phải tự copy text ra",
      "Phải convert thủ công",
      "Re-entry bằng tay",
    ],
  },
  {
    label: "Ai dựng & duy trì",
    values: [
      "AI Math + giáo viên (SME) cùng tinh chỉnh",
      "Mỗi người tự lo",
      "Giáo viên gánh hết",
      "Không ai làm",
    ],
  },
  {
    label: "Tiền/công sức rủi ro",
    values: ["3 lượt miễn phí · gói trả theo lớp", "Miễn phí nhưng tốn thời gian", "Chi phí thời gian gốc", "Chi phí cơ hội đang tăng"],
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <LandingIntro />
      <MarketingHeader />

      {/* HERO ---------------------------------------------------------- */}
      <section className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-5 pb-12 pt-14 text-center md:pt-20">
        <Eyebrow>Một workspace cho toán học</Eyebrow>

        <h1
          className="mt-8 max-w-[14ch] font-serif text-[clamp(3rem,8vw,6.5rem)] font-normal leading-[0.95] tracking-[-0.035em]"
        >
          Hỏi bài, soạn bài, xuất file — <span className="text-muted-foreground">tất cả trong</span>{" "}
          <span style={{ color: ACCENT }}>một chỗ.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-[17px]">
          AI Math Chat là không gian cho học sinh, phụ huynh và giáo viên: hỏi bài bằng ảnh hoặc file,
          copy từng phần lời giải, và xuất Word/PDF khi cần — không cần biết prompt.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <PillLink href="/newchat" variant="solid">
            Bắt đầu chat
            <ArrowRight className="h-4 w-4" />
          </PillLink>
          <PillLink href="/pricing" variant="outline">
            Xem pricing
          </PillLink>
        </div>

        <div className="w-full">
          <div className="mx-auto max-w-3xl">
            <HeroPromptBox />
          </div>
        </div>
      </section>

      {/* HERO IMAGE / PREVIEW ------------------------------------------ */}
      <section className="relative px-5 pb-20 md:pb-28">
        <div
          className="mx-auto max-w-[1200px] overflow-hidden rounded-[28px] border border-border/15 bg-card shadow-[var(--shadow-md)]"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
          }}
        >
          <div className="relative aspect-[16/9] w-full bg-[#1F1E1D]">
            <Image
              src="/product-chat-screenshot.png"
              alt="Ảnh giao diện chat AI Math"
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-top opacity-95"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1F1E1D]/30" />
          </div>
        </div>
      </section>

      {/* OLD WAY vs NEW WAY -------------------------------------------- */}
      <section className="mx-auto w-full max-w-[1200px] px-5 pb-20 md:pb-28">
        <div className="mb-10 text-center">
          <Eyebrow>Cách cũ vs cách mới</Eyebrow>
          <h2 className="mt-6 font-serif text-3xl font-normal leading-tight tracking-tight md:text-5xl">
            Bạn không cần kéo nhiều tab nữa.
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-border/15 bg-card p-7 md:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Cách cũ
            </p>
            <h3 className="mt-3 font-serif text-2xl font-normal leading-snug md:text-3xl">
              Lật sách, search, copy paste — vẫn không gọn.
            </h3>
            <ul className="mt-6 grid gap-3">
              {OLD_WAY.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 text-sm leading-6 text-muted-foreground line-through decoration-border/40 decoration-2"
                >
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  {line}
                </li>
              ))}
            </ul>
          </article>

          <article
            className="relative rounded-3xl border border-transparent p-7 text-[#FAF9F5] shadow-[var(--shadow-md)] md:p-9"
            style={{ backgroundColor: "#141413" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
              Cách mới — AI Math
            </p>
            <h3 className="mt-3 font-serif text-2xl font-normal leading-snug md:text-3xl">
              Hỏi một lần. Copy từng phần. Xuất khi cần.
            </h3>
            <ul className="mt-6 grid gap-3">
              {NEW_WAY.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm leading-6 text-[#FAF9F5]/85">
                  <span
                    className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: ACCENT }}
                  />
                  {line}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              <PillLink href="/newchat" variant="solid-light">
                Thử ngay
                <ArrowRight className="h-4 w-4" />
              </PillLink>
              <PillLink href="/workflow" variant="ghost-light">
                Xem quy trình
              </PillLink>
            </div>
          </article>
        </div>
      </section>

      {/* WORKFLOW ------------------------------------------------------ */}
      <section className="border-y border-border/10 bg-card/45">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-16 md:py-24">
          <div className="mb-12 flex flex-col items-center text-center">
            <Eyebrow>{WORKFLOW_INTRO.eyebrow}</Eyebrow>
            <h2 className="mt-6 max-w-2xl font-serif text-3xl font-normal leading-tight tracking-tight md:text-5xl">
              {WORKFLOW_INTRO.title}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              {WORKFLOW_INTRO.description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className="flex min-h-[260px] flex-col rounded-3xl border border-border/15 bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-border/30 hover:shadow-[var(--shadow-sm)]"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-sm font-mono"
                      style={{ color: ACCENT, border: "1px solid hsl(var(--border) / 0.15)" }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-serif text-xl font-normal leading-tight">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* PERSONA STEPPER ----------------------------------------------- */}
      <section className="mx-auto w-full max-w-[1200px] px-5 py-16 md:py-24">
        <div className="mb-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <Eyebrow>Câu chuyện của bạn</Eyebrow>
            <h2 className="mt-6 font-serif text-3xl font-normal leading-tight tracking-tight md:text-5xl">
              Bắt đầu một ngày với hướng đi rõ ràng.
            </h2>
          </div>
          <p className="text-base leading-7 text-muted-foreground lg:max-w-md">
            5 vai trò, 5 cách dùng AI Math khác nhau — nhưng cùng một workspace. Cuộn để xem từng vai trò.
          </p>
        </div>

        <div className="-mx-5 overflow-x-auto px-5 pb-2">
          <div className="grid auto-cols-[minmax(300px,1fr)] grid-flow-col gap-4 md:auto-cols-[minmax(360px,1fr)]">
            {PERSONA_STEPS.map((step, index) => (
              <article
                key={step.role}
                className="flex flex-col rounded-3xl border border-border/15 bg-card p-7 transition-all hover:border-border/30 hover:shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  <span style={{ color: ACCENT }}>{step.role}</span>
                  <span className="font-mono">
                    {String(index + 1).padStart(2, "0")} <span className="opacity-40">/ {String(PERSONA_STEPS.length).padStart(2, "0")}</span>
                  </span>
                </div>

                <h3 className="mt-6 font-serif text-2xl font-normal leading-snug">
                  {step.headline}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.subtitle}</p>

                <div className="mt-7 grid gap-5 border-t border-border/15 pt-6">
                  {step.bullets.map((bullet) => (
                    <div key={bullet.title}>
                      <h4 className="font-sans text-[13px] font-semibold uppercase tracking-[0.12em]">
                        {bullet.title}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{bullet.body}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
          ← Kéo để xem cả 5 vai trò →
        </p>
      </section>

      {/* FEATURE BLOCKS ------------------------------------------------ */}
      <section className="border-y border-border/10 bg-card/45">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-16 md:py-24">
          <div className="mb-12 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <Eyebrow>Sản phẩm</Eyebrow>
              <h2 className="mt-6 font-serif text-4xl font-normal leading-tight tracking-tight md:text-6xl">
                Bố cục gọn, công thức rõ, copy đúng phần cần.
              </h2>
            </div>
            <p className="text-base leading-7 text-muted-foreground lg:max-w-md">
              Mỗi module phục vụ một nhịp công việc thật. Không có panel thừa, không có nút bạn không bao giờ bấm.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {FEATURE_BLOCKS.map((block) => {
              const Icon = block.icon;
              return (
                <article
                  key={block.title}
                  className="flex flex-col rounded-3xl border border-border/15 bg-card p-7 md:p-9"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {block.eyebrow}
                    </span>
                    <Icon className="h-5 w-5" style={{ color: ACCENT }} />
                  </div>

                  <h3 className="mt-6 font-serif text-2xl font-normal leading-snug md:text-[28px]">
                    {block.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{block.tagline}</p>

                  <div className="mt-7 grid gap-5 border-t border-border/15 pt-6 sm:grid-cols-2">
                    {block.points.map((point) => (
                      <div key={point.title}>
                        <h4 className="font-sans text-[13px] font-semibold uppercase tracking-[0.12em]">
                          {point.title}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{point.body}</p>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE --------------------------------------------- */}
      <section className="mx-auto w-full max-w-[1200px] px-5 py-16 md:py-24">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <Eyebrow>So sánh</Eyebrow>
            <h2 className="mt-6 font-serif text-3xl font-normal leading-tight tracking-tight md:text-5xl">
              Tại sao AI Math Chat, không phải cách cũ.
            </h2>
          </div>
          <p className="text-base leading-7 text-muted-foreground lg:max-w-md">
            Mọi so sánh dưới đây tới từ trải nghiệm thực của giáo viên & học sinh đang dùng. Không phải bảng marketing.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-border/15 bg-card">
          <table className="w-full min-w-[840px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/15">
                <th className="w-[24%] px-5 py-5 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Tiêu chí
                </th>
                {COMPARISON_COLUMNS.map((col) => (
                  <th
                    key={col.id}
                    className="px-5 py-5 text-left font-sans text-sm font-semibold"
                    style={col.accent ? { color: ACCENT } : { color: "hsl(var(--muted-foreground))" }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, rowIndex) => (
                <tr
                  key={row.label}
                  className={rowIndex % 2 === 1 ? "bg-secondary/40" : ""}
                >
                  <th
                    scope="row"
                    className="px-5 py-4 text-left align-top font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-foreground"
                  >
                    {row.label}
                  </th>
                  {row.values.map((value, colIndex) => {
                    const isAccent = COMPARISON_COLUMNS[colIndex]?.accent;
                    return (
                      <td
                        key={colIndex}
                        className="px-5 py-4 align-top leading-6"
                        style={
                          isAccent
                            ? { color: "hsl(var(--foreground))", fontWeight: 500 }
                            : { color: "hsl(var(--muted-foreground))" }
                        }
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          AI Math Chat cam kết: 3 lượt dùng thử miễn phí, hủy bất cứ lúc nào, không khóa dữ liệu.
        </p>
      </section>

      {/* DARK CTA ------------------------------------------------------ */}
      <section
        className="relative px-5 py-24 md:py-32"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background)) 22%, #0E0D0C 78%, #0E0D0C 100%)",
        }}
      >
        <div className="mx-auto flex max-w-[1100px] flex-col items-center text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.18em]"
            style={{ color: ACCENT }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
            Sẵn sàng?
          </span>

          <h2 className="mt-6 max-w-[18ch] font-serif text-[clamp(2.4rem,6vw,5rem)] font-normal leading-[1] tracking-[-0.03em] text-[#FAF9F5]">
            Hỏi bài đầu tiên,{" "}
            <span className="text-[#FAF9F5]/55">xuất tài liệu</span>{" "}
            <span style={{ color: ACCENT }}>chỉ trong vài phút.</span>
          </h2>

          <p className="mt-6 max-w-xl text-sm leading-6 text-[#FAF9F5]/55 md:text-base">
            3 lượt miễn phí cho khách. Đăng nhập để lưu hội thoại và mở Teacher Studio.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <PillLink href="/newchat" variant="solid-light">
              Vào chat
              <ArrowRight className="h-4 w-4" />
            </PillLink>
            <PillLink href="/teacher" variant="ghost-light">
              Mở Teacher Studio
              <ArrowUpRight className="h-4 w-4" />
            </PillLink>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}

/* -----------------------------------------------------------
 * Small presentational helpers
 * --------------------------------------------------------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/15 bg-card px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: ACCENT }}
        aria-hidden
      />
      {children}
    </span>
  );
}

type PillVariant = "solid" | "outline" | "solid-light" | "ghost-light";

function PillLink({
  href,
  variant,
  children,
}: {
  href: string;
  variant: PillVariant;
  children: React.ReactNode;
}) {
  const base =
    "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition-colors";
  const styles: Record<PillVariant, string> = {
    solid:
      "bg-[#141413] text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] hover:bg-[#0A0A0A] dark:bg-[#FAF9F5] dark:text-[#1F1E1D]",
    outline:
      "border border-border/30 bg-card text-foreground hover:border-border/60 hover:bg-secondary",
    "solid-light":
      "bg-[#FAF9F5] text-[#141413] shadow-[0_8px_30px_rgba(255,255,255,0.08)] hover:bg-white",
    "ghost-light":
      "border border-white/15 bg-white/[0.04] text-[#FAF9F5] hover:bg-white/[0.08]",
  };
  return (
    <Link href={href} className={`${base} ${styles[variant]}`}>
      {children}
    </Link>
  );
}
