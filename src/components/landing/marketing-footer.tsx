import Link from "next/link";
import { Download, Sigma, Sparkles } from "lucide-react";

const FOOTER_GROUPS = [
  {
    title: "Sản phẩm",
    links: [
      { label: "Tổng quan", href: "/product" },
      { label: "Quy trình", href: "/workflow" },
      { label: "Pricing", href: "/pricing" },
      { label: "About", href: "/about" },
    ],
  },
  {
    title: "Không gian làm việc",
    links: [
      { label: "Chat học tập", href: "/newchat" },
      { label: "Teacher Studio", href: "/teacher" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Admin", href: "/dashboard/providers" },
    ],
  },
  {
    title: "Bắt đầu",
    links: [
      { label: "Đăng nhập", href: "/login" },
      { label: "Dùng thử chat", href: "/newchat" },
      { label: "Xem pricing", href: "/pricing" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/10 bg-card/45">
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 py-12 md:px-10 md:py-16 lg:grid-cols-[1.1fr_1.9fr]">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            aria-label="AI Math Chat"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--terracotta))] text-white shadow-[rgba(217,119,87,0.18)_0px_8px_24px]">
              <Sigma className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">AI Math Chat</span>
              <span className="block text-xs text-muted-foreground">Học toán, soạn bài, xuất file</span>
            </span>
          </Link>

          <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
            Một workspace cho học sinh, phụ huynh và giáo viên: hỏi bài, đọc file, soạn tài liệu và xuất nội dung thành
            Word hoặc PDF khi cần.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/15 bg-background px-3 py-2 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-[hsl(var(--terracotta))]" />
              Hỏi bài, đọc file, soạn bài trong một nơi.
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/15 bg-background px-3 py-2 text-xs text-muted-foreground">
              <Download className="h-4 w-4 text-[hsl(var(--terracotta))]" />
              Copy từng phần hoặc xuất Word/PDF khi cần.
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
            <Link href="/workflow" className="hover:text-foreground">
              Quy trình
            </Link>
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
