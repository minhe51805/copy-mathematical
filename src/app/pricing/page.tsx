import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  Check,
  GraduationCap,
  HelpCircle,
  Minus,
  UserRound,
} from "lucide-react";
import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { HeroDecor } from "@/components/landing/hero-decor";
import styles from "@/components/landing/marketing.module.css";

export const metadata: Metadata = {
  title: "Pricing | AI Math Chat",
  description: "Các gói sử dụng AI Math Chat cho học tập, giáo viên và lớp học.",
};

const PLANS = [
  {
    icon: UserRound,
    name: "Free",
    audience: "Học sinh, phụ huynh, sinh viên",
    price: "3 lượt",
    cadence: "để thử nhanh",
    description: "Dùng thử để hỏi bài toán, đọc ảnh và xem cách AI trình bày lời giải.",
    href: "/newchat",
    cta: "Bắt đầu miễn phí",
    features: ["Chat giới hạn ban đầu", "Nhập câu hỏi hoặc ảnh", "Copy nội dung trả lời", "Đăng nhập khi cần dùng tiếp"],
  },
  {
    icon: BookOpenCheck,
    name: "Study",
    audience: "Người học cần dùng thường xuyên",
    price: "Cá nhân",
    cadence: "lưu lịch sử học tập",
    description: "Không gian học tập cho giải bài, đọc file, luyện bài tương tự và hỏi tiếp theo mạch cũ.",
    href: "/login?next=/newchat",
    cta: "Dùng cho học tập",
    highlighted: true,
    features: ["Chat theo cấu hình hiện tại", "Đọc PDF, DOCX, Excel, CSV", "Math Studio cho công thức", "Xuất nội dung khi cần"],
  },
  {
    icon: GraduationCap,
    name: "Teacher",
    audience: "Giáo viên, trợ giảng",
    price: "Studio",
    cadence: "soạn bài riêng",
    description: "Tạo giáo án, phiếu học tập, đề kiểm tra, đáp án và tài liệu từ chủ đề hoặc file có sẵn.",
    href: "/teacher",
    cta: "Mở Teacher Studio",
    features: ["Workspace riêng cho giáo viên", "Tạo đề và đáp án", "Gợi ý từ file tải lên", "Chuẩn bị Word/PDF"],
  },
  {
    icon: Building2,
    name: "Classroom",
    audience: "Trung tâm, lớp học, nhóm",
    price: "Liên hệ",
    cadence: "khi cần triển khai rộng",
    description: "Dành cho nhóm cần quản trị provider, cấu hình lượt khách và mở rộng thành thư viện nội dung.",
    href: "/dashboard",
    cta: "Xem dashboard",
    features: ["Quản lý provider", "Cấu hình lượt chat khách", "Nền cho CMS lớp học", "Phù hợp nhóm nhiều người"],
  },
];

const COMPARISON = [
  ["Hỏi bài bằng văn bản", true, true, true, true],
  ["Nhận ảnh và file", "Giới hạn", true, true, true],
  ["Math Studio", "Xem thử", true, true, true],
  ["Teacher workspace", false, false, true, true],
  ["Xuất đề và đáp án", false, "Cơ bản", true, true],
  ["Dashboard quản trị", false, false, false, true],
] as const;

const FAQS = [
  {
    question: "Free có phải gói thật không?",
    answer: "Free là luồng trải nghiệm hiện tại: khách được chat một số lượt trước khi được mời đăng nhập.",
  },
  {
    question: "Study và Teacher khác gì nhau?",
    answer: "Study ưu tiên giải bài và học lại. Teacher ưu tiên soạn giáo án, tạo đề, đáp án và tài liệu dạy học.",
  },
  {
    question: "Khi nào cần Classroom?",
    answer: "Khi bạn triển khai cho lớp, trung tâm hoặc nhóm có nhiều người dùng, nhiều tài liệu và cần dashboard quản trị.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <MarketingHeader active="pricing" />

      <section className="relative mx-auto grid w-full max-w-[1200px] gap-10 px-5 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24 lg:grid-cols-[1fr_1fr] lg:items-end">
        <HeroDecor variant="wave" chips={["Free · 3 lượt", "Study · cá nhân", "Teacher · Studio"]} />
        <div className={`${styles.fadeUp} relative border-l border-border/20 pl-8`}>
          <Eyebrow>Pricing</Eyebrow>
          <h1 className="mt-8 max-w-[11ch] font-serif text-[clamp(3.2rem,8vw,6.5rem)] font-normal leading-[0.96] tracking-[-0.04em]">
            Chọn theo việc cần làm<span className={`${styles.accentDot} text-[#ff4000]`}>.</span>
          </h1>
        </div>
        <div className={`${styles.fadeUp} ${styles.fadeUpDelay2} relative border-l border-border/20 pl-8`}>
          <p className="max-w-md text-2xl font-semibold leading-tight md:text-3xl">
            Không ép chọn gói trước khi bạn biết mình cần gì.
          </p>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
            Bắt đầu bằng Free để thử. Dùng Study cho học tập hằng ngày. Mở Teacher Studio khi cần soạn tài liệu.
          </p>
          <div className="mt-8">
            <Link className="inline-flex h-11 items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white hover:bg-black/85" href="/newchat">
              Bắt đầu miễn phí
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-border/10 bg-card/55 px-5 py-12 md:px-8 md:py-16">
        <div className={`${styles.staggerGrid} mx-auto grid max-w-[1200px] gap-3 lg:grid-cols-4`}>
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <article
                key={plan.name}
                className={[
                  styles.cardHover,
                  "flex min-h-[520px] flex-col rounded-[8px] border p-6",
                  plan.highlighted ? "border-[#ff4000] bg-[#0e0d0c] text-white" : "border-border/15 bg-card",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <div className={plan.highlighted ? "text-[#ff4000]" : "text-muted-foreground"}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {plan.highlighted && (
                    <span className="rounded-full bg-[#ff4000] px-3 py-1 text-xs font-semibold text-white">Phổ biến</span>
                  )}
                </div>

                <p className={["mt-8 text-xs font-semibold uppercase tracking-[0.15em]", plan.highlighted ? "text-white/45" : "text-muted-foreground"].join(" ")}>
                  {plan.audience}
                </p>
                <h2 className="mt-3 text-2xl font-semibold">{plan.name}</h2>
                <div className="mt-6">
                  <p className="text-4xl font-semibold">{plan.price}</p>
                  <p className={["mt-1 text-sm", plan.highlighted ? "text-white/55" : "text-muted-foreground"].join(" ")}>{plan.cadence}</p>
                </div>
                <p className={["mt-6 text-sm leading-6", plan.highlighted ? "text-white/70" : "text-muted-foreground"].join(" ")}>
                  {plan.description}
                </p>

                <ul className="mt-7 grid gap-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm leading-6">
                      <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-[#ff4000]" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  className={[
                    "mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition",
                    plan.highlighted ? "bg-white text-black hover:bg-white/90" : "border border-border/20 bg-card hover:bg-secondary",
                  ].join(" ")}
                  href={plan.href}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1200px] gap-10 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Eyebrow>So sánh</Eyebrow>
          <h2 className="mt-6 font-serif text-4xl font-normal leading-tight tracking-[-0.02em] md:text-6xl">
            Nhìn một lần là biết nên chọn gì.
          </h2>
        </div>

        <div className="overflow-x-auto rounded-[8px] border border-border/15 bg-card">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/15 bg-secondary/70">
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Tính năng
                </th>
                {["Free", "Study", "Teacher", "Classroom"].map((label) => (
                  <th key={label} className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([label, free, study, teacher, classroom]) => (
                <tr key={label} className="border-b border-border/10 last:border-b-0">
                  <th className="px-4 py-4 text-left font-medium">{label}</th>
                  <FeatureValue value={free} />
                  <FeatureValue value={study} />
                  <FeatureValue value={teacher} />
                  <FeatureValue value={classroom} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-y border-border/10 bg-card/55">
        <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="mt-6 font-serif text-4xl font-normal leading-tight tracking-[-0.02em] md:text-6xl">
              Câu hỏi nhanh.
            </h2>
          </div>
          <div className={`${styles.staggerGrid} grid gap-3`}>
            {FAQS.map((faq) => (
              <article key={faq.question} className={`${styles.cardHover} rounded-[8px] border border-border/15 bg-card p-5`}>
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-1 h-4 w-4 shrink-0 text-[#ff4000]" />
                  <div>
                    <h3 className="font-semibold">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0e0d0c] px-5 py-20 text-[#fafafa] md:px-8 md:py-28">
        <div className="mx-auto grid max-w-[1000px] gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff4000]">Chọn nhanh</span>
            <h2 className="mt-5 max-w-[18ch] font-serif text-[clamp(2.5rem,6vw,5rem)] font-normal leading-[1] tracking-[-0.03em]">
              Chưa chắc gói nào? Bắt đầu bằng chat.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/60 md:text-base">
              Cứ thử một bài thật trước. Khi nhu cầu rõ hơn, pricing sẽ tự nhiên hơn nhiều.
            </p>
          </div>
          <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black" href="/newchat">
            Vào chat
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <td className="px-4 py-4 text-center text-[#ff4000]">
        <Check className="mx-auto h-4 w-4" />
      </td>
    );
  }

  if (value === false) {
    return (
      <td className="px-4 py-4 text-center text-muted-foreground">
        <Minus className="mx-auto h-4 w-4" />
      </td>
    );
  }

  return <td className="px-4 py-4 text-center text-xs leading-5 text-muted-foreground">{value}</td>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-[#ff4000]" />
      {children}
    </span>
  );
}
