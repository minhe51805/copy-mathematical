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
  Table2,
} from "lucide-react";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sản phẩm | AI Math Chat",
  description: "Tổng quan các chức năng chính của AI Math Chat.",
};

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
    points: ["Template phân số, căn, tổng, tích phân", "Nhóm công thức tiếng Việt hoá", "Copy LaTeX hoặc copy đẹp"],
  },
];

export default function ProductPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <MarketingHeader active="product" />

      <section className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 py-12 md:px-10 md:py-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(520px,1.15fr)] lg:items-center">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[hsl(var(--terracotta))]">Sản phẩm</p>
          <h1 className="text-4xl font-normal leading-tight md:text-6xl md:leading-[1.08]">
            Workspace toán học cho chat, file, công thức và xuất nội dung.
          </h1>
          <p className="mt-6 text-base leading-7 text-muted-foreground md:text-[17px]">
            AI Math Chat gom các thao tác hay bị rời rạc vào một màn hình: gửi đề, đọc tài liệu, trình bày công thức,
            copy từng phần và mở lại nội dung để xuất file khi thật sự cần.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">
                Mở chat
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/workflow">Xem quy trình</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/15 bg-card p-3 shadow-[var(--shadow-md)]">
          <div className="overflow-hidden rounded-xl border border-border/15 bg-[#1F1E1D]">
            <div className="flex h-12 items-center justify-between border-b border-white/10 px-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#DC6038]" />
                <span className="h-3 w-3 rounded-full bg-[#D29922]" />
                <span className="h-3 w-3 rounded-full bg-[#BCD1CA]" />
              </div>
              <span className="text-xs text-[#FAF9F5]/60">/newchat</span>
            </div>
            <Image
              src="/product-chat-screenshot.png"
              alt="Giao diện AI Math Chat"
              width={1040}
              height={720}
              priority
              className="aspect-[1040/720] h-auto w-full object-cover object-left-top"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-border/10 bg-card/45">
        <div className="mx-auto grid w-full max-w-[1440px] gap-4 px-5 py-10 md:grid-cols-2 md:px-10 xl:grid-cols-4">
          {FEATURE_CARDS.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-xl border border-border/15 bg-card p-6 shadow-[var(--shadow-sm)]">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-sans text-lg font-semibold">{feature.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
        <div className="mb-10 max-w-3xl">
          <h2 className="text-3xl font-normal md:text-5xl">Các khối chức năng chính.</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Mỗi khối được thiết kế để giải một vấn đề rất cụ thể trong workflow học toán và soạn tài liệu.
          </p>
        </div>

        <div className="grid gap-5">
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
                <ProductPreviewPanel variant={index} />
              </article>
            );
          })}
        </div>
      </section>
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
      rows: ["Đại số · Đạo hàm · Ma trận", "a/b · √x · ∑ · ∫", "Copy đẹp hoặc chèn chat"],
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
