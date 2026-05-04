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
    <header className="flex h-14 shrink-0 items-center justify-between px-3 md:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg md:hidden"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
        <h1 className="truncate text-sm font-medium">AI Math Chat</h1>
        <span className="hidden rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground sm:inline-flex">
          {process.env.NEXT_PUBLIC_MODEL_NAME || "AI"}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
