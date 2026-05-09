"use client";

import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
  userLabel?: string;
  onLogout?: () => void;
  title?: string;
  subtitle?: string;
  badge?: string;
}

export function Header({
  onMenuClick,
  isSidebarOpen,
  userLabel,
  onLogout,
  title = "AI Math Chat",
  subtitle = "Trợ lý toán học thông minh",
  badge,
}: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg md:hidden"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
        <div className="min-w-0">
          <h1 className="truncate font-sans text-[15px] font-semibold leading-5">{title}</h1>
          <p className="hidden text-xs text-muted-foreground sm:block">{subtitle}</p>
        </div>
        <span className="claude-badge hidden px-3 py-1 text-xs text-muted-foreground sm:inline-flex">
          {badge ?? process.env.NEXT_PUBLIC_MODEL_NAME ?? "AI"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {userLabel && (
          <span className="hidden rounded-lg border border-border/15 bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-[var(--shadow-sm)] sm:inline-flex">
            {userLabel}
          </span>
        )}
        <ThemeToggle />
        {onLogout && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden gap-2 sm:inline-flex"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        )}
      </div>
    </header>
  );
}
