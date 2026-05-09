import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, GraduationCap, UserRound } from "lucide-react";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing | AI Math Chat",
  description: "Các gói định hướng cho AI Math Chat.",
};

const PRICING = [
  {
    icon: UserRound,
    name: "Starter",
    price: "Mock",
    description: "Dành cho giai đoạn thử nghiệm giao diện và luồng đăng nhập nội bộ.",
    features: ["Đăng nhập mock", "Chat toán cơ bản", "Lưu lịch sử local", "Quản lý file trong phiên"],
  },
  {
    icon: GraduationCap,
    name: "Study Pro",
    price: "Đề xuất",
    description: "Gói chính cho người học, giáo viên và người cần xử lý bài tập thường xuyên.",
    features: ["Nhận ảnh bài toán", "Đọc tài liệu", "Math Studio", "Xuất DOCX theo phiên bản", "Copy công thức đẹp"],
    highlighted: true,
  },
  {
    icon: Building2,
    name: "Classroom",
    price: "Tuỳ chỉnh",
    description: "Hướng phát triển cho lớp học hoặc trung tâm có nhiều tài liệu và mẫu xuất riêng.",
    features: ["Thư viện bài tập", "Mẫu xuất riêng", "Không gian nhóm", "Quản lý quyền truy cập"],
  },
];

const FAQS = [
  {
    question: "Hiện tại có thu phí chưa?",
    answer: "Chưa. Trang pricing này là khung định hướng để sau này gắn thanh toán, quyền truy cập hoặc giới hạn theo gói.",
  },
  {
    question: "Tài khoản mock là gì?",
    answer: "Tài khoản dùng thử nội bộ là admin123 / 123456, phục vụ kiểm thử luồng đăng nhập trước khi có hệ thống user thật.",
  },
  {
    question: "Tính năng xuất file có tự chạy không?",
    answer: "Không. Xuất biến thể chỉ nên chạy khi người dùng chủ động mở modal xuất nội dung để tránh tốn token không cần thiết.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <MarketingHeader active="pricing" />

      <section className="mx-auto w-full max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[hsl(var(--terracotta))]">Pricing</p>
          <h1 className="text-4xl font-normal leading-tight md:text-6xl md:leading-[1.08]">
            Gói dùng rõ ràng cho từng mức nhu cầu.
          </h1>
          <p className="mt-6 text-base leading-7 text-muted-foreground md:text-[17px]">
            Pricing hiện là bản định hướng sản phẩm. Mục tiêu là tách rõ bản thử nghiệm, bản học tập cá nhân và bản lớp học
            để sau này dễ gắn phân quyền thật.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {PRICING.map((plan) => {
            const Icon = plan.icon;
            return (
              <article
                key={plan.name}
                className={[
                  "rounded-xl border bg-card p-6 shadow-[var(--shadow-sm)]",
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
                      Nổi bật
                    </span>
                  )}
                </div>
                <h2 className="font-sans text-xl font-semibold">{plan.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                <p className="mt-6 text-3xl font-semibold">{plan.price}</p>
                <ul className="mt-6 grid gap-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--terracotta))]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8 w-full" variant={plan.highlighted ? "default" : "outline"}>
                  <Link href="/login">
                    Dùng thử
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border/10 bg-card/45">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <h2 className="text-3xl font-normal md:text-5xl">Câu hỏi nhanh.</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Phần này giữ thông tin pricing thật rõ để người dùng hiểu đây là bản mock và không nhầm với thanh toán thật.
            </p>
          </div>
          <div className="grid gap-3">
            {FAQS.map((faq) => (
              <article key={faq.question} className="rounded-xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)]">
                <h3 className="text-base font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
