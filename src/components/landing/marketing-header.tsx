import Link from "next/link";
import { ArrowRight, Sigma } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

type MarketingPage = "product" | "workflow" | "pricing" | "teacher";

const NAV_ITEMS: Array<{ href: string; label: string; value: MarketingPage }> = [
  { href: "/product", label: "Sản phẩm", value: "product" },
  { href: "/workflow", label: "Quy trình", value: "workflow" },
  { href: "/pricing", label: "Pricing", value: "pricing" },
  { href: "/teacher", label: "Teacher", value: "teacher" },
];

export function MarketingHeader({ active }: { active?: MarketingPage }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/10 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-5 md:px-10">
        <Link className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30" href="/">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--terracotta))] text-white shadow-[rgba(217,119,87,0.18)_0px_8px_24px]">
            <Sigma className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-5">AI Math Chat</p>
            <p className="text-xs text-muted-foreground">Học toán, soạn bài, xuất file</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              aria-current={active === item.value ? "page" : undefined}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
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
  );
}
