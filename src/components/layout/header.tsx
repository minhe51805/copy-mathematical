"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ onMenuClick, isSidebarOpen }: HeaderProps) {
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
          <h1 className="truncate font-sans text-[15px] font-semibold leading-5">AI Math Chat</h1>
          <p className="hidden text-xs text-muted-foreground sm:block">Trợ lý toán học thông minh</p>
        </div>
        <span className="claude-badge hidden px-3 py-1 text-xs text-muted-foreground sm:inline-flex">
          {process.env.NEXT_PUBLIC_MODEL_NAME || "AI"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
