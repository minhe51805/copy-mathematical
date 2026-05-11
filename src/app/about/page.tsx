import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, GraduationCap, Target, Wand2 } from "lucide-react";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { HeroDecor } from "@/components/landing/hero-decor";
import styles from "@/components/landing/marketing.module.css";

export const metadata: Metadata = {
  title: "About | AI Math Chat",
  description: "Câu chuyện và định hướng của AI Math Chat cho học sinh, phụ huynh và giáo viên.",
};

const VALUES = [
  {
    icon: Target,
    title: "Rõ việc",
    text: "Mỗi màn hình trả lời một câu hỏi thật: hỏi bài, soạn bài, đọc file hay xuất tài liệu.",
  },
  {
    icon: Wand2,
    title: "Dễ dùng",
    text: "Người dùng non-tech không cần học prompt dài, menu phức tạp hay thuật ngữ kỹ thuật.",
  },
  {
    icon: GraduationCap,
    title: "Dùng được ngay",
    text: "Học sinh, phụ huynh và giáo viên có lối vào riêng nhưng vẫn chung một hệ thống.",
  },
];

const STORY = [
  "Bài tập, ảnh chụp, file dài, giáo án và đề kiểm tra thường nằm rời rạc ở nhiều nơi.",
  "AI Math gom tất cả vào một luồng, giữ công thức, bảng và block copy riêng cho từng phần.",
  "Mục tiêu là biến việc học và soạn tài liệu thành một thói quen nhẹ hơn, ít thao tác hơn.",
];

export default function AboutPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <MarketingHeader active="about" />

      <section className="relative mx-auto grid w-full max-w-[1200px] gap-10 px-5 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <HeroDecor chips={["Hỏi bài", "Soạn giáo án", "Xuất Word/PDF"]} />
        <div className={`${styles.fadeUp} relative border-l border-border/20 pl-8`}>
          <Eyebrow>About</Eyebrow>
          <h1 className="mt-8 max-w-[12ch] font-serif text-[clamp(3.2rem,8vw,6.5rem)] font-normal leading-[0.96] tracking-[-0.04em]">
            Làm việc học bớt rối<span className={`${styles.accentDot} text-[#ff4000]`}>.</span>
          </h1>
        </div>

        <div className={`${styles.fadeUp} ${styles.fadeUpDelay2} relative border-l border-border/20 pl-8`}>
          <p className="max-w-md text-2xl font-semibold leading-tight md:text-3xl">
            AI Math được xây cho người cần kết quả rõ, không phải cho người thích chỉnh công cụ.
          </p>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
            Hỏi bài, đọc file, soạn giáo án và xuất tài liệu nên nằm trong cùng một nhịp làm việc.
            Đó là lý do trang này tồn tại.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PillLink href="/newchat" variant="dark">
              Vào chat
              <ArrowRight className="h-4 w-4" />
            </PillLink>
            <PillLink href="/pricing" variant="light">
              Xem pricing
            </PillLink>
          </div>
        </div>
      </section>

      <section className="border-y border-border/10 bg-card/55 px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto grid max-w-[1120px] gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Eyebrow>Ý tưởng chính</Eyebrow>
            <h2 className="mt-6 font-serif text-4xl font-normal leading-tight tracking-[-0.02em] md:text-6xl">
              Người dùng nói mục tiêu. AI xử lý phần nặng.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              Khi trải nghiệm đủ rõ, người học không phải nhớ mình cần bấm gì tiếp. Họ chỉ cần đưa nội dung vào
              và chọn đầu ra mình muốn.
            </p>
          </div>

          <div className="overflow-hidden rounded-[8px] border border-border/15 bg-card">
            <div className="relative aspect-[4/3]">
              <Image
                src="/product-chat-screenshot.png"
                alt="Không gian làm việc AI Math"
                fill
                sizes="(max-width: 1120px) 100vw, 540px"
                className="object-cover object-left-top"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <Eyebrow>Nguyên tắc</Eyebrow>
            <h2 className="mt-6 font-serif text-4xl font-normal leading-tight tracking-[-0.02em] md:text-6xl">
              Ba điều giữ sản phẩm đi đúng hướng.
            </h2>
          </div>
          <p className="max-w-lg text-base leading-7 text-muted-foreground">
            Mỗi tính năng mới phải giúp người dùng đi tới đáp án, tài liệu hoặc quyết định rõ hơn.
          </p>
        </div>

        <div className={`${styles.staggerGrid} grid gap-3 lg:grid-cols-3`}>
          {VALUES.map((value) => {
            const Icon = value.icon;
            return (
              <article key={value.title} className={`${styles.cardHover} rounded-[8px] border border-border/15 bg-card p-6`}>
                <Icon className="h-5 w-5 text-[#ff4000]" />
                <h3 className="mt-8 text-2xl font-semibold">{value.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{value.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border/10 bg-card/55">
        <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow>Câu chuyện</Eyebrow>
            <h2 className="mt-6 font-serif text-4xl font-normal leading-tight tracking-[-0.02em] md:text-6xl">
              Từ rời rạc tới một workspace.
            </h2>
          </div>
          <div className={`${styles.staggerGrid} grid gap-3`}>
            {STORY.map((point, index) => (
              <article key={point} className={`${styles.cardHover} grid gap-4 rounded-[8px] border border-border/15 bg-card p-5 sm:grid-cols-[56px_1fr]`}>
                <span className="font-mono text-sm text-[#ff4000]">{String(index + 1).padStart(2, "0")}</span>
                <p className="text-sm leading-6 text-muted-foreground">{point}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-8 border-y border-border/15 py-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <Eyebrow>Tuyên bố</Eyebrow>
            <h2 className="mt-6 font-serif text-4xl font-normal leading-tight tracking-[-0.02em] md:text-6xl">
              Không phải AI nói chuyện cho vui.
            </h2>
          </div>
          <div>
            <p className="text-2xl font-semibold leading-snug md:text-4xl">
              Là AI giúp người học và người dạy đi tới kết quả rõ ràng hơn.
            </p>
            <div className="mt-8 grid gap-3">
              {["Đáp án rõ hơn", "Tài liệu sạch hơn", "Ít thao tác thủ công hơn"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-medium">
                  <BadgeCheck className="h-4 w-4 text-[#ff4000]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0e0d0c] px-5 py-20 text-[#fafafa] md:px-8 md:py-28">
        <div className="mx-auto grid max-w-[1000px] gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff4000]">Bắt đầu</span>
            <h2 className="mt-5 max-w-[18ch] font-serif text-[clamp(2.5rem,6vw,5rem)] font-normal leading-[1] tracking-[-0.03em]">
              Chọn đúng không gian rồi để AI xử lý phần nặng.
            </h2>
          </div>
          <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black" href="/newchat">
            Vào chat
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

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
