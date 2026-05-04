"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/chat/sidebar";
import { ChatContainer } from "@/components/chat/chat-container";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { initializeStore } from "@/stores/chat-store";
import { initializeTheme } from "@/hooks/use-theme";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeTheme();
    initializeStore();
    const timer = setTimeout(() => setIsInitialized(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <aside className="hidden w-[260px] shrink-0 bg-[#171717] text-[#f4f4f4] md:block">
        <Sidebar />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] border-r-0 bg-[#171717] p-0 text-[#f4f4f4]">
          <Sidebar onChatSelect={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex min-w-0 flex-1 flex-col bg-background">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          isSidebarOpen={sidebarOpen}
        />
        <ChatContainer />
      </main>
    </div>
  );
}
