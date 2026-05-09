"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, LockKeyhole, Sigma, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initializeTheme } from "@/hooks/use-theme";
import { isMockAuthenticated, loginMockUser, MOCK_AUTH_USER } from "@/lib/mock-auth";

const LOGIN_BENEFITS = [
  "Mở trang chat tại /newchat",
  "Giữ lại URL chat cũ nếu bị chuyển về login",
  "Dùng tài khoản mock để kiểm thử nhanh",
];

export function LoginPageClient() {
  const router = useRouter();
  const [username, setUsername] = useState(MOCK_AUTH_USER.username);
  const [password, setPassword] = useState(MOCK_AUTH_USER.password);
  const [error, setError] = useState("");

  useEffect(() => {
    initializeTheme();
    if (isMockAuthenticated()) {
      router.replace(getSafeNextPath());
    }
  }, [router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!loginMockUser(username, password)) {
      setError("Tài khoản hoặc mật khẩu chưa đúng.");
      return;
    }

    router.replace(getSafeNextPath());
  };

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border/10 bg-background/95">
        <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-5 md:px-10">
          <Link className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30" href="/">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--terracotta))] text-white shadow-[rgba(217,119,87,0.18)_0px_8px_24px]">
              <Sigma className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-5">AI Math Chat</p>
              <p className="text-xs text-muted-foreground">Trợ lý toán học thông minh</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm" variant="outline">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Trang chủ
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[1180px] gap-8 px-5 py-12 md:px-10 md:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-border/15 bg-card px-3 py-2 text-sm text-muted-foreground shadow-[var(--shadow-sm)]">
            <Sparkles className="h-4 w-4 text-[hsl(var(--terracotta))]" />
            Cổng vào /newchat
          </div>
          <h1 className="text-4xl font-normal leading-tight md:text-6xl md:leading-[1.08]">Đăng nhập để vào không gian chat toán học.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-[17px]">
            Đây là tài khoản ảo dùng cho giai đoạn mock. Sau khi đăng nhập đúng, app lưu phiên trong trình duyệt và chuyển bạn vào
            trang chat chính.
          </p>

          <div className="mt-8 grid gap-3">
            {LOGIN_BENEFITS.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-sm text-muted-foreground">
                <BadgeCheck className="h-4 w-4 shrink-0 text-[hsl(var(--terracotta))]" />
                {benefit}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border/15 bg-card p-5 shadow-[var(--shadow-md)] md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))]">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Tài khoản mock</h2>
              <p className="text-sm text-muted-foreground">
                User: {MOCK_AUTH_USER.username} · Pass: {MOCK_AUTH_USER.password}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Tài khoản</Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={MOCK_AUTH_USER.username}
                autoComplete="username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={MOCK_AUTH_USER.password}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="mt-2 w-full">
              Đăng nhập vào /newchat
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}

function getSafeNextPath() {
  if (typeof window === "undefined") return "/newchat";

  const nextPath = new URLSearchParams(window.location.search).get("next");
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//") || nextPath.startsWith("/login")) {
    return "/newchat";
  }

  return nextPath;
}
