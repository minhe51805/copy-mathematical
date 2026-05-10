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

const SIDEBAR_COLLAPSED_STORAGE_KEY = "math-chat-sidebar-collapsed";

export function ChatShell({ mode }: ChatShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeConfig = mode ? ASSISTANT_MODES[mode] : undefined;
  const workspaceId: WorkspaceId = mode ?? "general";
  const requiresAuth = workspaceId !== "general";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hashValue, setHashValue] = useState("");
  const conversations = useChatStore((state) => state.conversations);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const conversationResetKey = useChatStore((state) => state.conversationResetKey);
  const loadConversation = useChatStore((state) => state.loadConversation);

  useEffect(() => {
    initializeTheme();
    initializeStore(workspaceId);
    const timer = window.setTimeout(() => {
      setIsSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true");
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
    if (requiresAuth && !isAuthenticated) {
      const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
    }
  }, [isAuthenticated, isInitialized, requiresAuth, router]);

  useEffect(() => {
    if (!isInitialized || (requiresAuth && !isAuthenticated)) return;

    const liveHashValue = getWindowHash();
    const urlConversationId = getConversationIdFromUrl(searchParams, liveHashValue);
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
    requiresAuth,
    searchParams,
  ]);

  useEffect(() => {
    if (!isInitialized || (requiresAuth && !isAuthenticated) || !currentConversationId) return;

    const targetUrl = `${getWorkspacePath(workspaceId)}?=#${encodeURIComponent(currentConversationId)}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentUrl !== targetUrl) {
      router.replace(targetUrl, { scroll: false });
    }
  }, [currentConversationId, isAuthenticated, isInitialized, requiresAuth, router, workspaceId]);

  const handleLogout = () => {
    logoutMockUser();
    router.replace("/login");
  };

  const handleSidebarCollapsedChange = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
  };

  if (!isInitialized || (requiresAuth && !isAuthenticated)) {
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
      <aside
        className={`hidden shrink-0 overflow-hidden border-r border-white/10 bg-[hsl(var(--sidebar-bg))] text-[#FAF9F5] transition-[width] duration-200 ease-out md:block ${
          isSidebarCollapsed ? "w-[74px]" : "w-[272px]"
        }`}
      >
        <Sidebar
          workspaceId={workspaceId}
          isCollapsed={isSidebarCollapsed}
          onCollapsedChange={handleSidebarCollapsedChange}
        />
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
          userLabel={isAuthenticated ? MOCK_AUTH_USER.displayName : "Guest"}
          onLogout={isAuthenticated ? handleLogout : undefined}
          title={modeConfig?.workspace.name}
          subtitle={modeConfig?.workspace.subtitle}
          badge={modeConfig?.badge ?? process.env.NEXT_PUBLIC_MODEL_NAME ?? "AI"}
        />
        <ChatContainer
          key={`${workspaceId}:${currentConversationId ?? "new"}:${conversationResetKey}`}
          modeConfig={modeConfig}
        />
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
