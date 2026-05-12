import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeInit } from "@/components/landing/theme-init";
import { ThemeIntroController } from "@/components/layout/theme-intro-controller";

export const metadata: Metadata = {
  title: "AI Math Chat",
  description: "Hỏi bài, soạn giáo án và xuất tài liệu trong một workspace rõ ràng, dễ dùng.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeInit />
        <ThemeIntroController />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
