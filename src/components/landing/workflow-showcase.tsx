"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardCheck,
  Download,
  FileText,
  GraduationCap,
  MessageSquareText,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./workflow-showcase.module.css";

type ShowcaseStep = {
  id: string;
  label: string;
  icon: LucideIcon;
  headline: string;
  accent: string;
  notes: Array<{
    title: string;
    body: string;
  }>;
  mock: {
    title: string;
    eyebrow: string;
    primary: string;
    secondary: string;
    action: string;
    tone: "chat" | "solve" | "teacher" | "test" | "export";
  };
};

type AskScene = {
  id: string;
  background: string;
  glow: string;
  title: string;
  meta: string;
  body: string;
  action: string;
};

type StackScene = {
  id: string;
  background: string;
  glow: string;
  eyebrow: string;
  title: string;
  titleMeta: string;
  primaryBody: string;
  secondaryTitle: string;
  secondaryBody: string;
  action: string;
};

type NoteScene = {
  id: string;
  background: string;
  glow: string;
  title: string;
  meta: string;
  sections: Array<{
    label: string;
    body: string;
  }>;
  footer: string;
};

const SHOWCASE_STEPS: ShowcaseStep[] = [
  {
    id: "ask",
    label: "Hỏi bài",
    icon: MessageSquareText,
    headline: "Bắt đầu bằng đúng thứ bạn đang có.",
    accent: "Ảnh, PDF, DOCX hay một dòng câu hỏi đều dùng được.",
    notes: [
      {
        title: "\"Không cần viết prompt dài\"",
        body: "Kéo file vào, chụp đề hoặc gõ câu hỏi. AI tự nhận diện bài toán, công thức và phần cần làm tiếp.",
      },
      {
        title: "\"Một nơi cho toàn bộ ngữ cảnh\"",
        body: "Đề bài, ảnh, lời giải cũ và câu hỏi tiếp theo nằm trong cùng một workspace, không rơi rớt giữa nhiều tab.",
      },
    ],
    mock: {
      title: "Đã nhận đề bài",
      eyebrow: "Ảnh + PDF",
      primary: "Tích phân từng phần · Lớp 12",
      secondary: "AI đã đọc công thức và tách từng yêu cầu.",
      action: "Next: Giải từng bước",
      tone: "chat",
    },
  },
  {
    id: "solve",
    label: "Hiểu lời giải",
    icon: BookOpenCheck,
    headline: "Lời giải đi theo từng bước rõ ràng.",
    accent: "Không nhảy đáp án. Không mất công thức khi copy.",
    notes: [
      {
        title: "\"Biết vì sao làm vậy\"",
        body: "Mỗi bước có giải thích ngắn, công thức giữ đúng định dạng và có thể copy riêng từng block.",
      },
      {
        title: "\"Hỏi tiếp đúng chỗ vừa bí\"",
        body: "Bạn có thể yêu cầu giải chậm hơn, đổi cách giải hoặc tạo bài tương tự ngay trong cùng hội thoại.",
      },
    ],
    mock: {
      title: "Bước 3 được làm rõ",
      eyebrow: "Giải thích",
      primary: "Vì u = ln(x) nên du = 1/x dx",
      secondary: "Block công thức đã sẵn sàng để copy.",
      action: "Copy LaTeX",
      tone: "solve",
    },
  },
  {
    id: "teacher",
    label: "Soạn bài",
    icon: GraduationCap,
    headline: "Teacher Studio làm theo cách thầy cô dạy thật.",
    accent: "Chọn công cụ, điền vài dòng, app tự dựng brief ẩn.",
    notes: [
      {
        title: "\"Không phải template cứng\"",
        body: "Giáo án, phiếu học tập, rubric, ma trận đề và ngân hàng câu hỏi được tạo theo lớp, thời lượng và mức học sinh.",
      },
      {
        title: "\"Tận dụng file có sẵn\"",
        body: "Đưa đề cũ, giáo trình hoặc ảnh bài mẫu vào. AI đọc rồi chuyển thành tài liệu dùng được ngay.",
      },
    ],
    mock: {
      title: "Teacher Studio",
      eyebrow: "Công cụ nhanh",
      primary: "Giáo án 45 phút · Hàm số bậc hai",
      secondary: "Mục tiêu, hoạt động lớp, câu hỏi gợi mở.",
      action: "Tạo giáo án",
      tone: "teacher",
    },
  },
  {
    id: "test",
    label: "Kiểm tra",
    icon: ClipboardCheck,
    headline: "Tạo đề, đáp án và ma trận trong một nhịp.",
    accent: "Câu dễ, trung bình, khó được chia rõ trước khi xuất.",
    notes: [
      {
        title: "\"Đề có cấu trúc ngay từ đầu\"",
        body: "AI chia mức độ, dạng câu, đáp án, thang điểm và ghi chú chấm để giáo viên rà nhanh.",
      },
      {
        title: "\"Sửa độ khó không phải làm lại\"",
        body: "Yêu cầu tăng câu vận dụng, đổi số liệu hoặc tách bản học sinh/bản đáp án ngay trong hội thoại.",
      },
    ],
    mock: {
      title: "Đề kiểm tra đã dựng",
      eyebrow: "15 phút",
      primary: "8 trắc nghiệm · 2 tự luận",
      secondary: "Có ma trận, đáp án và thang điểm.",
      action: "Rà lỗi đề",
      tone: "test",
    },
  },
  {
    id: "export",
    label: "Xuất file",
    icon: Download,
    headline: "Tài liệu sẵn sàng gửi lớp hoặc in ra.",
    accent: "Word/PDF có nhiều phiên bản, không cần căn chỉnh lại từ đầu.",
    notes: [
      {
        title: "\"Copy phần nhỏ, xuất bản lớn\"",
        body: "Copy từng công thức khi cần, hoặc mở modal xuất file khi muốn bản hoàn chỉnh.",
      },
      {
        title: "\"Giữ lại để dùng lần sau\"",
        body: "Hội thoại, đề và bản nháp ở lại trong workspace để chỉnh tiếp hoặc tái sử dụng cho buổi học sau.",
      },
    ],
    mock: {
      title: "Tài liệu đã sẵn sàng",
      eyebrow: "DOCX + PDF",
      primary: "Bản đề · Bản đáp án · Bản rút gọn",
      secondary: "Công thức, bảng và tiêu đề được giữ layout.",
      action: "Xuất Word",
      tone: "export",
    },
  },
];

const ACCENT = "hsl(var(--terracotta))";
const ASK_SCENES: AskScene[] = [
  {
    id: "ask-1",
    background:
      "linear-gradient(180deg, rgba(190, 224, 248, 0.98) 0%, rgba(110, 191, 225, 0.96) 42%, rgba(10, 115, 142, 0.98) 100%)",
    glow: "linear-gradient(180deg, rgba(255, 255, 255, 0.34) 0%, rgba(255, 221, 99, 0.14) 100%)",
    title: "Đã nhận đề bài",
    meta: "Ảnh, PDF, DOCX hoặc một dòng câu hỏi",
    body: "AI đang tách ký hiệu, bước giải và phần cần làm tiếp.",
    action: "Next: Giải từng bước",
  },
  {
    id: "ask-2",
    background:
      "linear-gradient(180deg, rgba(255, 150, 96, 0.98) 0%, rgba(244, 79, 44, 0.97) 46%, rgba(35, 8, 8, 0.98) 100%)",
    glow: "linear-gradient(180deg, rgba(255, 198, 140, 0.16) 0%, rgba(0, 0, 0, 0) 100%)",
    title: "Đang đọc công thức",
    meta: "Tách từng phần, giữ layout công thức",
    body: "Mỗi bước được làm rõ để bạn có thể copy riêng hoặc hỏi tiếp ngay.",
    action: "Next: Viết lời giải",
  },
  {
    id: "ask-3",
    background:
      "linear-gradient(180deg, rgba(197, 228, 249, 0.98) 0%, rgba(129, 199, 228, 0.95) 48%, rgba(21, 92, 127, 0.98) 100%)",
    glow: "linear-gradient(180deg, rgba(255, 255, 255, 0.24) 0%, rgba(31, 154, 189, 0.10) 100%)",
    title: "Bản nháp sẵn sàng",
    meta: "Có đáp án, chú thích và phần copy từng block",
    body: "Khi cần, bạn chuyển thẳng sang xuất Word/PDF mà không phải làm lại.",
    action: "Next: Xuất file",
  },
];

const SOLVE_SCENES: StackScene[] = [
  {
    id: "solve-1",
    background:
      "linear-gradient(180deg, rgba(193, 227, 248, 0.98) 0%, rgba(141, 214, 242, 0.96) 46%, rgba(19, 119, 149, 0.98) 100%)",
    glow: "linear-gradient(180deg, rgba(255, 255, 255, 0.34) 0%, rgba(255, 216, 116, 0.14) 100%)",
    eyebrow: "Hiểu lời giải",
    title: "Tách từng bước cho dễ hiểu",
    titleMeta: "Bản giải có thể copy riêng",
    primaryBody: "Mỗi bước giữ LaTeX riêng, gọn để đọc lại mà không vỡ công thức.",
    secondaryTitle: '"Biết vì sao"',
    secondaryBody: "Giải thích ngắn, đúng nhịp để học sinh theo kịp.",
    action: "Next: Soạn bài",
  },
  {
    id: "solve-2",
    background:
      "linear-gradient(180deg, rgba(209, 233, 250, 0.98) 0%, rgba(126, 211, 221, 0.95) 47%, rgba(11, 107, 132, 0.98) 100%)",
    glow: "linear-gradient(180deg, rgba(255, 255, 255, 0.24) 0%, rgba(76, 208, 189, 0.14) 100%)",
    eyebrow: "Ghi chú",
    title: "Khung giải và khung nhớ tách nhau",
    titleMeta: "Không nhảy đáp án",
    primaryBody: "Phần suy luận và phần kết luận đứng riêng từng khối, dễ copy vào vở hoặc slide.",
    secondaryTitle: '"Có thể hỏi lại"',
    secondaryBody: "Nếu cần, AI viết chậm hơn và thêm một ví dụ nhỏ ngay trong cùng màn.",
    action: "Next: Lên giáo án",
  },
  {
    id: "solve-3",
    background:
      "linear-gradient(180deg, rgba(197, 228, 250, 0.98) 0%, rgba(150, 218, 232, 0.96) 45%, rgba(12, 96, 125, 0.98) 100%)",
    glow: "linear-gradient(180deg, rgba(255, 255, 255, 0.30) 0%, rgba(179, 233, 132, 0.14) 100%)",
    eyebrow: "Rút gọn",
    title: "Một bản rút gọn để ôn tập",
    titleMeta: "Cho buổi sau dùng lại",
    primaryBody: "Đổi lời giải dài thành bản ngắn hơn nhưng vẫn giữ đủ ý chính.",
    secondaryTitle: '"Copy đúng phần"',
    secondaryBody: "Bạn lấy từng block cần thiết, không phải dọn lại cả trang.",
    action: "Next: Kiểm tra",
  },
];

const TEACHER_SCENES: StackScene[] = [
  {
    id: "teacher-1",
    background:
      "linear-gradient(180deg, rgba(205, 232, 250, 0.98) 0%, rgba(148, 214, 239, 0.95) 48%, rgba(16, 108, 133, 0.98) 100%)",
    glow: "linear-gradient(180deg, rgba(255, 255, 255, 0.28) 0%, rgba(252, 201, 93, 0.16) 100%)",
    eyebrow: "Soạn bài",
    title: "Giáo án 45 phút vừa ý lớp",
    titleMeta: "Lớp 8 · Hàm số bậc hai",
    primaryBody: "Mục tiêu, hoạt động và câu hỏi gợi mở đã đi thành một bản ngắn.",
    secondaryTitle: '"Không phải template cứng"',
    secondaryBody: "AI bám theo file và nhịp dạy thật, không bắt bạn điền form dài.",
    action: "Next: Thêm bài tập",
  },
  {
    id: "teacher-2",
    background:
      "linear-gradient(180deg, rgba(220, 236, 251, 0.98) 0%, rgba(128, 206, 222, 0.95) 47%, rgba(14, 98, 124, 0.98) 100%)",
    glow: "linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(139, 225, 177, 0.14) 100%)",
    eyebrow: "Tùy tiết",
    title: "Bản giảng đổi ngay theo tiết học",
    titleMeta: "Sửa trực tiếp trên màn",
    primaryBody: "Thêm ví dụ, đổi hoạt động nhóm hoặc rút ngắn phần giảng trong vài nhịp.",
    secondaryTitle: '"Cập nhật live"',
    secondaryBody: "Slide, handout và ghi chú đều đi cùng một outline.",
    action: "Next: Gắn rubric",
  },
  {
    id: "teacher-3",
    background:
      "linear-gradient(180deg, rgba(216, 236, 252, 0.98) 0%, rgba(119, 203, 220, 0.95) 46%, rgba(12, 90, 120, 0.98) 100%)",
    glow: "linear-gradient(180deg, rgba(255, 255, 255, 0.20) 0%, rgba(242, 215, 102, 0.14) 100%)",
    eyebrow: "Dùng lại",
    title: "Một outline, nhiều phiên bản dùng lại",
    titleMeta: "Giáo án · phiếu học tập · note",
    primaryBody: "Từ cùng một khung, bạn xuất được giáo án, phiếu học tập và bản nhắc giờ dạy.",
    secondaryTitle: '"Dùng lại hôm sau"',
    secondaryBody: "Lưu thành mẫu để mở tiết sau mà không phải gõ lại từ đầu.",
    action: "Next: Kiểm tra",
  },
];

const TEST_SCENES: NoteScene[] = [
  {
    id: "test-1",
    background:
      "linear-gradient(180deg, rgba(195, 226, 249, 0.98) 0%, rgba(111, 194, 223, 0.93) 48%, rgba(17, 89, 121, 0.98) 100%)",
    glow: "linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 208, 72, 0.12) 100%)",
    title: "Đề kiểm tra đã ráp xong",
    meta: "15 phút · 8 trắc nghiệm · 2 tự luận",
    sections: [
      {
        label: "Mức độ",
        body: "3 câu dễ, 4 câu vừa, 3 câu vận dụng.",
      },
      {
        label: "Đáp án",
        body: "Có thang điểm riêng cho bản giáo viên.",
      },
      {
        label: "Ghi chú",
        body: "Tách bản học sinh và bản chấm.",
      },
    ],
    footer: "Xuất ra PDF hoặc Word ngay khi duyệt xong.",
  },
  {
    id: "test-2",
    background:
      "linear-gradient(180deg, rgba(186, 219, 247, 0.98) 0%, rgba(108, 186, 208, 0.94) 49%, rgba(15, 73, 102, 0.98) 100%)",
    glow: "linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 141, 76, 0.14) 100%)",
    title: "Bản chấm đang rõ hơn",
    meta: "Rubric theo từng ý",
    sections: [
      {
        label: "Câu 1",
        body: "Mỗi ý quan trọng được đánh số.",
      },
      {
        label: "Câu 2",
        body: "Chỗ nào dễ nhầm được chú thích ngay.",
      },
      {
        label: "Tổng kết",
        body: "Giảm thời gian chữa bài sau giờ.",
      },
    ],
    footer: "Giữ layout sạch để xem nhanh từng ý.",
  },
  {
    id: "test-3",
    background:
      "linear-gradient(180deg, rgba(204, 231, 250, 0.98) 0%, rgba(122, 204, 225, 0.95) 47%, rgba(12, 86, 112, 0.98) 100%)",
    glow: "linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(131, 221, 168, 0.16) 100%)",
    title: "Bản học sinh gọn hơn",
    meta: "Phiên bản phát cho lớp",
    sections: [
      {
        label: "Không lộ đáp án",
        body: "Chỉ giữ phần đề, không lộ lời giải.",
      },
      {
        label: "Layout đã khóa",
        body: "Không phải kéo cột hay xuống dòng lại.",
      },
      {
        label: "Dùng ngay",
        body: "In ra là có thể phát cho lớp.",
      },
    ],
    footer: "Next: Xuất Word + PDF.",
  },
];

export function WorkflowShowcase() {
  const [activeId, setActiveId] = useState(SHOWCASE_STEPS[0].id);
  const activeIndex = SHOWCASE_STEPS.findIndex((step) => step.id === activeId);
  const activeStep = SHOWCASE_STEPS[activeIndex] ?? SHOWCASE_STEPS[0];
  const ActiveIcon = activeStep.icon;

  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-16 md:py-24">
      <div className="mb-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/15 bg-card px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--terracotta))]" />
          Workflow thật
        </span>
        <h2 className="mt-6 text-balance font-serif text-4xl font-normal leading-tight tracking-tight md:text-6xl">
          Workflow của bạn, không phải prompt của AI.
        </h2>
      </div>

      <div className="mx-auto mb-10 flex max-w-[980px] gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Workflow AI Math">
        {SHOWCASE_STEPS.map((step, index) => (
          <button
            key={step.id}
            type="button"
            role="tab"
            aria-selected={activeStep.id === step.id}
            onClick={() => setActiveId(step.id)}
            className={cn(
              "group min-w-[172px] flex-1 border-b-2 px-3 pb-4 pt-2 text-left transition-colors",
              activeStep.id === step.id
                ? "border-[hsl(var(--terracotta))] text-foreground"
                : "border-border/15 text-muted-foreground hover:border-border/40 hover:text-foreground"
            )}
          >
            <span className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-md border text-[11px]",
                  activeStep.id === step.id
                    ? "border-[hsl(var(--terracotta))] text-[hsl(var(--terracotta))]"
                    : "border-border/30 text-muted-foreground"
                )}
              >
                {index + 1}
              </span>
              {step.label}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-[30px] border border-border/15 bg-secondary/70 p-2 shadow-[var(--shadow-md)] lg:h-[620px]">
        <div className="grid h-full gap-2 lg:grid-cols-[0.52fr_1fr]">
          <article className="min-h-[520px] overflow-hidden rounded-[24px] border border-border/20 bg-card p-6 shadow-[var(--shadow-sm)] md:p-9 lg:h-full lg:min-h-0">
            <div key={`copy-${activeStep.id}`} className={cn("flex h-full flex-col", styles.slidePanel)}>
              <ActiveIcon className="h-7 w-7 text-foreground" strokeWidth={1.8} />
              <h3 className="mt-6 max-w-[13ch] text-balance font-serif text-3xl font-normal leading-[1.08] tracking-tight md:text-4xl">
                {activeStep.headline}
              </h3>
              <p className="mt-5 max-w-sm font-mono text-sm leading-6 text-[hsl(var(--terracotta))]">
                {activeStep.accent}
              </p>

              <div className="mt-auto grid gap-6 pt-12">
                {activeStep.notes.map((note, noteIndex) => (
                  <div
                    key={note.title}
                    className={cn(noteIndex > 0 && "border-t border-border/15 pt-6")}
                  >
                    <h4 className="text-sm font-semibold">{note.title}</h4>
                    <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{note.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <div className="relative min-h-[520px] overflow-hidden rounded-[24px] border border-border/20 bg-[#bfe1f5] lg:h-full lg:min-h-0">
            <div key={`visual-${activeStep.id}`} className={cn("absolute inset-0", styles.visualLayer)}>
              <Image
                src="/product-chat-screenshot.png"
                alt="Giao diện AI Math Chat trong workflow"
                fill
                sizes="(max-width: 1024px) 100vw, 780px"
                className="object-cover object-left-top opacity-45"
              />
              <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(191,225,245,0.92),rgba(131,208,196,0.74)_42%,rgba(248,220,95,0.38)_100%)]" />
              <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#006073]/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#004a57]/45 to-transparent" />
            </div>

            <div key={`mock-${activeStep.id}`} className={cn("absolute inset-0", styles.mockMotion)}>
              <MockPanel step={activeStep} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MockPanel({ step }: { step: ShowcaseStep }) {
  switch (step.id) {
    case "ask":
      return <AskMockPanel />;
    case "solve":
      return <StackScenePanel scene={SOLVE_SCENES[0] ?? SOLVE_SCENES[0]} Icon={step.icon} />;
    case "teacher":
      return <StackScenePanel scene={TEACHER_SCENES[0] ?? TEACHER_SCENES[0]} Icon={step.icon} />;
    case "test":
      return <NoteScenePanel scene={TEST_SCENES[0] ?? TEST_SCENES[0]} Icon={step.icon} />;
    case "export":
      return (
        <div className="absolute left-1/2 top-1/2 w-[min(88%,420px)] -translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-white/10 bg-[#10100f] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em]" style={{ color: ACCENT }}>
                {step.mock.eyebrow}
              </p>
              <h4 className="mt-2 text-2xl font-semibold">{step.mock.title}</h4>
            </div>
            <FileText className="h-6 w-6 text-white/70" />
          </div>
          <div className="mt-7 h-28 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="h-2 w-2/3 rounded-full bg-white/60" />
            <div className="mt-4 h-2 w-5/6 rounded-full bg-white/25" />
            <div className="mt-3 h-2 w-3/5 rounded-full bg-white/20" />
            <div className="mt-5 h-2 w-4/5 rounded-full bg-[hsl(var(--terracotta))]" />
          </div>
          <p className="mt-5 text-sm font-medium">{step.mock.primary}</p>
          <p className="mt-1 text-sm text-white/55">{step.mock.secondary}</p>
          <button className="mt-6 h-11 rounded-full bg-white px-5 text-sm font-semibold text-black">
            {step.mock.action}
          </button>
        </div>
      );
    default:
      return <AskMockPanel />;
  }
}

function SceneBackdrop({
  background,
  glow,
  variant,
}: {
  background: string;
  glow: string;
  variant: "light" | "dark";
}) {
  return (
    <div className={cn("absolute inset-0", styles.visualLayer)} style={{ background }}>
      <div className="absolute inset-0" style={{ background: glow }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.3)_0%,transparent_22%),radial-gradient(circle_at_82%_78%,rgba(255,221,99,0.18)_0%,transparent_24%),radial-gradient(circle_at_76%_20%,rgba(255,255,255,0.14)_0%,transparent_18%)]" />
      {variant === "light" ? (
        <>
          <div className="absolute -left-10 bottom-0 h-48 w-72 rounded-full bg-[#0c708d]/35 blur-[72px]" />
          <div className="absolute right-[-6%] top-14 h-44 w-56 rounded-full bg-[#d6c04d]/22 blur-[86px]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#00515e]/36 to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute -left-8 bottom-0 h-56 w-72 rounded-full bg-[#0e7f70]/22 blur-[88px]" />
          <div className="absolute right-[-8%] bottom-6 h-52 w-56 rounded-full bg-[#cfbe3a]/26 blur-[92px]" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/12 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/34 to-transparent" />
        </>
      )}
    </div>
  );
}

function StackScenePanel({ scene, Icon }: { scene: StackScene; Icon: LucideIcon }) {
  const [typedAction, setTypedAction] = useState("");

  useEffect(() => {
    let charIndex = 0;
    let timer: number | undefined;

    const typeNext = () => {
      charIndex += 1;
      setTypedAction(scene.action.slice(0, charIndex));

      if (charIndex < scene.action.length) {
        timer = window.setTimeout(typeNext, 40);
        return;
      }

      timer = window.setTimeout(() => {
        setTypedAction(scene.action);
      }, 1200);
    };

    timer = window.setTimeout(() => {
      setTypedAction("");
      typeNext();
    }, 220);

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [scene.action]);

  return (
    <div className="absolute inset-0">
      <SceneBackdrop key={scene.id} background={scene.background} glow={scene.glow} variant="light" />

      <div className="absolute inset-0 flex items-center justify-center px-4 md:px-6">
        <div
          key={`${scene.id}-panel`}
          className={cn(
            "w-[min(100%,500px)] rounded-[28px] border border-white/40 bg-white/62 p-3 shadow-[0_22px_65px_rgba(12,61,76,0.22)] backdrop-blur-md",
            styles.mockMotion
          )}
        >
          <div className="grid gap-3">
            <div className="rounded-[20px] bg-white p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-11 w-11 items-center justify-center rounded-full border border-border/20 bg-secondary text-foreground">
                    <Icon className="h-4 w-4" strokeWidth={1.9} />
                  </span>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: ACCENT }}>
                      {scene.eyebrow}
                    </p>
                    <h4 className="mt-2 text-[22px] font-semibold leading-tight">{scene.title}</h4>
                  </div>
                </div>
                <span className="pt-1 text-xs font-medium text-muted-foreground">{scene.titleMeta}</span>
              </div>

              <div className="mt-4 rounded-[18px] border border-border/10 bg-[#f6f8fb] p-4">
                <p className="text-sm leading-6 text-muted-foreground">{scene.primaryBody}</p>
              </div>
            </div>

            <div className="rounded-[20px] bg-white p-5 shadow-[var(--shadow-sm)]">
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-foreground/90">
                {scene.secondaryTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{scene.secondaryBody}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-[20px] bg-[#141413] p-2 text-white">
            <div className="flex h-12 flex-1 items-center gap-3 rounded-[16px] border border-white/10 px-4">
              <Sparkles className="h-4 w-4 text-[hsl(var(--terracotta))]" />
              <span className="font-mono text-sm">
                {typedAction}
                <span className="inline-block translate-y-0.5 animate-pulse text-[hsl(var(--terracotta))]">|</span>
              </span>
            </div>
            <button className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white text-black">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteScenePanel({ scene, Icon }: { scene: NoteScene; Icon: LucideIcon }) {
  return (
    <div className="absolute inset-0">
      <SceneBackdrop key={scene.id} background={scene.background} glow={scene.glow} variant="dark" />

      <div className="absolute inset-0 flex items-center justify-center px-4 md:px-6">
        <div
          key={`${scene.id}-panel`}
          className={cn(
            "w-[min(100%,430px)] rounded-[28px] border border-white/12 bg-[#151515]/95 p-4 text-white shadow-[0_26px_80px_rgba(0,0,0,0.44)]",
            styles.mockMotion
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.05] text-[hsl(var(--terracotta))]">
                <Icon className="h-4 w-4" strokeWidth={1.9} />
              </span>
              <div>
                <span className="inline-block h-1.5 w-8 rounded-full bg-[hsl(var(--terracotta))]" />
                <h4 className="mt-3 text-[28px] font-semibold leading-tight">{scene.title}</h4>
              </div>
            </div>
            <AvatarPile />
          </div>

          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-white/50">{scene.meta}</p>
          <div className="mt-5 h-px bg-gradient-to-r from-[hsl(var(--terracotta))] via-white/10 to-[hsl(var(--terracotta))]" />

          <div className="mt-5 grid gap-4">
            {scene.sections.map((section) => (
              <div key={section.label}>
                <p className="text-sm font-semibold text-white/92">{section.label}</p>
                <p className="mt-1 text-sm leading-6 text-white/56">{section.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[18px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Kết quả</p>
            <p className="mt-2 text-sm leading-6 text-white/78">{scene.footer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AvatarPile() {
  return (
    <div className="flex items-center -space-x-2 pt-1">
      <span className="h-8 w-8 rounded-full border border-white/20 bg-[#f4ede7]" />
      <span className="h-8 w-8 rounded-full border border-white/20 bg-[#c9b2a2]" />
      <span className="h-8 w-8 rounded-full border border-white/20 bg-[#9bb6d0]" />
    </div>
  );
}

function AskMockPanel() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [typedAction, setTypedAction] = useState("");
  const scene = ASK_SCENES[sceneIndex] ?? ASK_SCENES[0];

  useEffect(() => {
    const currentScene = ASK_SCENES[sceneIndex] ?? ASK_SCENES[0];
    let charIndex = 0;
    let timer: number | undefined;

    const typeNext = () => {
      charIndex += 1;
      setTypedAction(currentScene.action.slice(0, charIndex));

      if (charIndex < currentScene.action.length) {
        timer = window.setTimeout(typeNext, 42);
        return;
      }

      timer = window.setTimeout(() => {
        setTypedAction("");
        setSceneIndex((current) => (current + 1) % ASK_SCENES.length);
      }, 1250);
    };

    timer = window.setTimeout(() => {
      setTypedAction("");
      typeNext();
    }, 220);

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [sceneIndex]);

  return (
    <div className="absolute inset-0">
      <div
        key={scene.id}
        className={cn("absolute inset-0", styles.visualLayer)}
        style={{ background: scene.background }}
      >
        <div className="absolute inset-0" style={{ background: scene.glow }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.26)_0%,transparent_22%),radial-gradient(circle_at_84%_76%,rgba(255,221,99,0.16)_0%,transparent_24%),radial-gradient(circle_at_76%_18%,rgba(255,255,255,0.16)_0%,transparent_18%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/10" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/16 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#004357]/40 to-transparent" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div
          key={`${scene.id}-panel`}
          className={cn(
            "w-[min(100%,470px)] rounded-[26px] border border-white/40 bg-white/68 p-3 shadow-[0_22px_65px_rgba(12,61,76,0.22)] backdrop-blur-md",
            styles.mockMotion
          )}
        >
          <div className="rounded-[18px] bg-white p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-4 w-4 rounded-full border border-border/30" />
                <div>
                  <p className="text-sm font-semibold">{scene.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{scene.meta}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">2 Minutes ago</span>
            </div>
            <div className="mt-4 rounded-2xl border border-border/10 bg-secondary/70 p-4">
              <p className="text-sm font-semibold">AI đã đọc câu hỏi</p>
              <p className="mt-1 text-sm text-muted-foreground">{scene.body}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-[18px] bg-[#141413] p-2 text-white">
            <div className="flex h-11 flex-1 items-center gap-3 rounded-xl border border-white/10 px-4">
              <Sparkles className="h-4 w-4 text-[hsl(var(--terracotta))]" />
              <span className="font-mono text-sm">
                {typedAction}
                <span className="inline-block translate-y-0.5 animate-pulse text-[hsl(var(--terracotta))]">|</span>
              </span>
            </div>
            <button className="flex h-11 w-12 items-center justify-center rounded-xl bg-white text-black">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
