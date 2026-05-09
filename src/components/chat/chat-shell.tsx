"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/chat/sidebar";
import { ChatContainer } from "@/components/chat/chat-container";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { initializeStore, useChatStore } from "@/stores/chat-store";
import { initializeTheme } from "@/hooks/use-theme";
import { ASSISTANT_MODES, type AssistantModeId } from "@/lib/assistant-modes";
import { isMockAuthenticated, logoutMockUser, MOCK_AUTH_USER } from "@/lib/mock-auth";
import type { WorkspaceId } from "@/types";

interface ChatShellProps {
  mode?: AssistantModeId;
}

export function ChatShell({ mode }: ChatShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeConfig = mode ? ASSISTANT_MODES[mode] : undefined;
  const workspaceId: WorkspaceId = mode ?? "general";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hashValue, setHashValue] = useState("");
  const conversations = useChatStore((state) => state.conversations);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const loadConversation = useChatStore((state) => state.loadConversation);

  useEffect(() => {
    initializeTheme();
    initializeStore(workspaceId);
    const timer = window.setTimeout(() => {
      setIsAuthenticated(isMockAuthenticated());
      setHashValue(getWindowHash());
      setIsInitialized(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [workspaceId]);

  useEffect(() => {
    const handleHashChange = () => setHashValue(getWindowHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    const urlConversationId = getConversationIdFromUrl(searchParams, hashValue);
    if (!urlConversationId || currentConversationId === urlConversationId) return;

    const conversationExists = conversations.some((conversation) => conversation.id === urlConversationId);
    if (conversationExists) {
      loadConversation(urlConversationId);
    }
  }, [
    conversations,
    currentConversationId,
    hashValue,
    isAuthenticated,
    isInitialized,
    loadConversation,
    searchParams,
  ]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !currentConversationId) return;

    const targetUrl = `${getWorkspacePath(workspaceId)}?=#${encodeURIComponent(currentConversationId)}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentUrl !== targetUrl) {
      router.replace(targetUrl, { scroll: false });
    }
  }, [currentConversationId, isAuthenticated, isInitialized, router, workspaceId]);

  const handleLogout = () => {
    logoutMockUser();
    router.replace("/login");
  };

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="rounded-xl border border-border/15 bg-card px-5 py-4 text-sm text-muted-foreground shadow-[var(--shadow-sm)]">
          Đang kiểm tra phiên đăng nhập...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <aside className="hidden w-[272px] shrink-0 border-r border-white/10 bg-[hsl(var(--sidebar-bg))] text-[#FAF9F5] md:block">
        <Sidebar workspaceId={workspaceId} />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[288px] border-r-0 bg-[hsl(var(--sidebar-bg))] p-0 text-[#FAF9F5]">
          <Sidebar workspaceId={workspaceId} onChatSelect={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex min-w-0 flex-1 flex-col bg-background">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          isSidebarOpen={sidebarOpen}
          userLabel={MOCK_AUTH_USER.displayName}
          onLogout={handleLogout}
          title={modeConfig?.workspace.name}
          subtitle={modeConfig?.workspace.subtitle}
          badge={modeConfig?.badge ?? process.env.NEXT_PUBLIC_MODEL_NAME ?? "AI"}
        />
        <ChatContainer modeConfig={modeConfig} />
      </main>
    </div>
  );
}

function getWorkspacePath(workspaceId: WorkspaceId) {
  if (workspaceId === "teacher") return "/teacher";
  return "/newchat";
}

function getWindowHash() {
  if (typeof window === "undefined") return "";
  return window.location.hash.replace(/^#/, "");
}

function getConversationIdFromUrl(searchParams: URLSearchParams | ReadonlyURLSearchParamsLike, hashValue: string) {
  return (
    searchParams.get("chat") ||
    searchParams.get("id") ||
    searchParams.get("") ||
    decodeURIComponent(hashValue)
  );
}

interface ReadonlyURLSearchParamsLike {
  get: (name: string) => string | null;
}
