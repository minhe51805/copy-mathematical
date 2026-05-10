import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  GraduationCap,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { Button } from "@/components/ui/button";

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
    cadence: "chat miễn phí",
    description: "Dùng thử nhanh để hỏi bài toán, kiểm tra cách AI trình bày lời giải và thử nhập ảnh.",
    href: "/newchat",
    cta: "Bắt đầu miễn phí",
    features: ["Chat không cần đăng nhập trong giới hạn", "Nhập câu hỏi hoặc ảnh bài toán", "Copy nội dung trả lời", "Đăng nhập khi cần dùng tiếp"],
  },
  {
    icon: BookOpenCheck,
    name: "Study Plus",
    audience: "Người học cần dùng thường xuyên",
    price: "Cá nhân",
    cadence: "đăng nhập để lưu lịch sử",
    description: "Không gian học tập cho việc giải bài, so sánh cách giải, đọc file và luyện bài tương tự.",
    href: "/login?next=/newchat",
    cta: "Dùng cho học tập",
    highlighted: true,
    features: ["Chat không giới hạn theo cấu hình hiện tại", "Đọc ảnh, PDF, DOCX, Excel và CSV", "Math Studio để soạn công thức", "Xuất nội dung thành tài liệu khi cần"],
  },
  {
    icon: GraduationCap,
    name: "Teacher Studio",
    audience: "Giáo viên, giảng viên, trợ giảng",
    price: "Giáo viên",
    cadence: "workspace soạn bài riêng",
    description: "Tạo giáo án, phiếu học tập, đề kiểm tra, đáp án và nguồn tham khảo từ chủ đề hoặc tài liệu có sẵn.",
    href: "/teacher",
    cta: "Mở Teacher Studio",
    features: ["Khu làm việc riêng cho giáo viên", "Tạo đề và đáp án Word/PDF", "Gợi ý prompt từ file tải lên", "Hỗ trợ chia tài liệu theo mục tiêu dạy học"],
  },
  {
    icon: Building2,
    name: "Classroom",
    audience: "Trung tâm, lớp học, nhóm nội bộ",
    price: "Liên hệ",
    cadence: "khi cần triển khai nhiều người",
    description: "Định hướng cho thư viện bài tập, template riêng, phân quyền và dashboard quản trị provider.",
    href: "/dashboard",
    cta: "Xem dashboard",
    features: ["Quản lý provider trong dashboard", "Cấu hình lượt chat khách", "Nền tảng để thêm user thật", "Phù hợp mở rộng thành CMS lớp học"],
  },
];

const COMPARISON = [
  { label: "Hỏi bài bằng văn bản", free: true, plus: true, teacher: true, classroom: true },
  { label: "Nhận ảnh và file", free: "Giới hạn", plus: true, teacher: true, classroom: true },
  { label: "Math Studio", free: "Xem thử", plus: true, teacher: true, classroom: true },
  { label: "Teacher workspace", free: false, plus: false, teacher: true, classroom: true },
  { label: "Xuất đề và đáp án", free: false, plus: "Cơ bản", teacher: true, classroom: true },
  { label: "Dashboard quản trị", free: false, plus: false, teacher: false, classroom: true },
];

const FAQS = [
  {
    question: "Free có phải gói thật không?",
    answer: "Free là giới hạn trải nghiệm hiện tại: khách được chat một số lượt trước khi được mời đăng nhập. Số lượt có thể chỉnh ở dashboard admin.",
  },
  {
    question: "Study Plus và Teacher Studio khác gì nhau?",
    answer: "Study Plus ưu tiên giải bài và học lại. Teacher Studio ưu tiên soạn giáo án, tạo đề, xuất đáp án và xử lý tài liệu dạy học.",
  },
  {
    question: "Khi nào cần Classroom?",
    answer: "Khi muốn triển khai cho lớp học, trung tâm hoặc nhóm có nhiều tài liệu, nhiều người dùng và cần quản trị provider, quyền truy cập hoặc template riêng.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <MarketingHeader active="pricing" />

      <section className="mx-auto w-full max-w-[1440px] px-5 py-12 md:px-10 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border/15 bg-card px-4 py-2 text-sm text-muted-foreground shadow-[var(--shadow-sm)]">
            <Sparkles className="h-4 w-4 text-[hsl(var(--terracotta))]" />
            Chọn theo việc bạn cần làm, không theo thuật ngữ kỹ thuật
          </div>
          <h1 className="text-5xl font-normal leading-[1.04] tracking-normal md:text-7xl">
            Gói dùng rõ ràng cho học tập và giảng dạy.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-muted-foreground md:text-[17px]">
            Pricing được bố trí giống một trang chọn sản phẩm: thấy ngay mình thuộc nhóm nào, bấm đúng lối vào và hiểu những gì mỗi gói hỗ trợ.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <article
                key={plan.name}
                className={[
                  "flex min-h-[520px] flex-col rounded-xl border bg-card p-6 shadow-[var(--shadow-sm)] transition-all hover:border-border/30 hover:shadow-[var(--shadow-md)]",
                  plan.highlighted
                    ? "border-[hsl(var(--terracotta))] shadow-[rgba(217,119,87,0.1)_0px_8px_32px_0px]"
                    : "border-border/15",
                ].join(" ")}
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))]">
                    <Icon className="h-5 w-5" />
                  </div>
                  {plan.highlighted && (
                    <span className="rounded-lg border border-[hsl(var(--terracotta))]/30 bg-[hsl(var(--terracotta))]/10 px-3 py-1 text-xs font-medium text-[hsl(var(--terracotta))]">
                      Phổ biến
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">{plan.audience}</p>
                <h2 className="mt-2 font-sans text-2xl font-semibold">{plan.name}</h2>
                <div className="mt-5">
                  <p className="text-3xl font-semibold">{plan.price}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.cadence}</p>
                </div>
                <p className="mt-5 text-sm leading-6 text-muted-foreground">{plan.description}</p>

                <ul className="mt-6 grid gap-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm leading-6 text-foreground">
                      <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-[hsl(var(--terracotta))]" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button asChild className="mt-auto w-full" variant={plan.highlighted ? "default" : "outline"}>
                  <Link href={plan.href}>
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border/10 bg-card/45">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--terracotta))] text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-4xl font-normal leading-tight md:text-5xl">So sánh nhanh trước khi chọn.</h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Bảng này dùng ngôn ngữ đời thường để người dùng phổ thông biết nên đi vào chat thường, Teacher Studio hay dashboard.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border/15 bg-card shadow-[var(--shadow-sm)]">
              <div className="grid grid-cols-[1.5fr_repeat(4,0.8fr)] border-b border-border/15 bg-secondary text-xs font-semibold text-muted-foreground">
                <div className="px-4 py-3">Tính năng</div>
                <div className="px-3 py-3 text-center">Free</div>
                <div className="px-3 py-3 text-center">Study</div>
                <div className="px-3 py-3 text-center">Teacher</div>
                <div className="px-3 py-3 text-center">Classroom</div>
              </div>
              {COMPARISON.map((row) => (
                <div key={row.label} className="grid grid-cols-[1.5fr_repeat(4,0.8fr)] border-b border-border/10 text-sm last:border-b-0">
                  <div className="px-4 py-4 font-medium">{row.label}</div>
                  <FeatureValue value={row.free} />
                  <FeatureValue value={row.plus} />
                  <FeatureValue value={row.teacher} />
                  <FeatureValue value={row.classroom} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))]">
            <HelpCircle className="h-5 w-5" />
          </div>
          <h2 className="text-4xl font-normal leading-tight md:text-5xl">Câu hỏi nhanh.</h2>
        </div>
        <div className="grid gap-3">
          {FAQS.map((faq) => (
            <article key={faq.question} className="rounded-xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)]">
              <h3 className="font-sans text-lg font-semibold">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-5 pb-16 md:px-10 md:pb-24">
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-border/15 bg-card p-6 shadow-[var(--shadow-sm)] md:p-8">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[hsl(var(--terracotta))]">
              Chọn nhanh
            </p>
            <h2 className="text-3xl font-normal leading-tight md:text-5xl">
              Không cần chọn gói ngay.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Bắt đầu từ việc bạn cần làm hôm nay. Khi nhu cầu rõ hơn, pricing sẽ tự nhiên hơn nhiều.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href="/newchat"
              className="group flex min-h-[220px] flex-col rounded-2xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] transition-all hover:border-border/30 hover:bg-secondary"
            >
              <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))] group-hover:bg-card">
                <BookOpenCheck className="h-5 w-5" />
              </span>
              <span className="font-sans text-lg font-semibold">Học sinh</span>
              <span className="mt-3 text-sm leading-6 text-muted-foreground">
                Hỏi bài, đọc ảnh, copy lời giải từng phần.
              </span>
              <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-medium text-foreground">
                Vào chat
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/teacher"
              className="group flex min-h-[220px] flex-col rounded-2xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] transition-all hover:border-border/30 hover:bg-secondary"
            >
              <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))] group-hover:bg-card">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="font-sans text-lg font-semibold">Giáo viên</span>
              <span className="mt-3 text-sm leading-6 text-muted-foreground">
                Soạn bài, tạo đề, chuẩn bị đáp án và tài liệu.
              </span>
              <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-medium text-foreground">
                Mở studio
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/workflow"
              className="group flex min-h-[220px] flex-col rounded-2xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] transition-all hover:border-border/30 hover:bg-secondary"
            >
              <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))] group-hover:bg-card">
                <Building2 className="h-5 w-5" />
              </span>
              <span className="font-sans text-lg font-semibold">Lớp học</span>
              <span className="mt-3 text-sm leading-6 text-muted-foreground">
                Xem luồng dùng cho nhóm, trung tâm hoặc triển khai nội bộ.
              </span>
              <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-medium text-foreground">
                Xem quy trình
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <div className="flex items-center justify-center px-3 py-4 text-[hsl(var(--terracotta))]">
        <CheckCircle2 className="h-4 w-4" />
      </div>
    );
  }

  if (value === false) {
    return <div className="px-3 py-4 text-center text-muted-foreground">-</div>;
  }

  return <div className="px-3 py-4 text-center text-xs leading-5 text-muted-foreground">{value}</div>;
}
