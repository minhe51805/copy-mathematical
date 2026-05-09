"use client";

import { useRouter } from "next/navigation";
import {
  Bot,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Trash2,
} from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { formatTimestamp } from "@/lib/math-utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Conversation, WorkspaceId } from "@/types";

interface SidebarProps {
  onChatSelect?: () => void;
  workspaceId?: WorkspaceId;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({
  onChatSelect,
  workspaceId = "general",
  isCollapsed = false,
  onCollapsedChange,
}: SidebarProps) {
  const router = useRouter();
  const {
    conversations,
    currentConversationId,
    loadConversation,
    deleteConversation,
    createNewConversation,
  } = useChatStore();

  const handleNewChat = () => {
    const workspacePath = getWorkspacePath(workspaceId);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", workspacePath);
      window.dispatchEvent(new Event("hashchange"));
    }
    createNewConversation();
    router.replace(workspacePath, { scroll: false });
    onChatSelect?.();
  };

  const handleSelectChat = (id: string) => {
    loadConversation(id);
    router.push(`${getWorkspacePath(workspaceId)}?=#${encodeURIComponent(id)}`);
    onChatSelect?.();
  };

  return (
    <div
      className={cn(
        "flex h-full min-w-0 flex-col bg-[hsl(var(--sidebar-bg))] text-[#FAF9F5]",
        isCollapsed && "items-center"
      )}
    >
      <div
        className={cn(
          "flex h-16 w-full shrink-0 items-center border-b border-white/10",
          isCollapsed ? "justify-center px-2" : "gap-3 px-4"
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--terracotta))] text-sm font-semibold text-white shadow-[rgba(217,119,87,0.18)_0px_8px_24px]">
              ∑
            </div>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              <p>{getWorkspaceTitle(workspaceId)}</p>
            </TooltipContent>
          )}
        </Tooltip>

        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{getWorkspaceTitle(workspaceId)}</p>
            <p className="truncate text-xs text-[#FAF9F5]/65">{getWorkspaceSubtitle(workspaceId)}</p>
          </div>
        )}
      </div>

      <div className={cn("w-full shrink-0", isCollapsed ? "px-2 py-3" : "px-3 py-3")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleNewChat}
              variant="ghost"
              aria-label={getNewChatLabel(workspaceId)}
              className={cn(
                "h-11 rounded-[9.6px] border-white/15 bg-white/[0.03] text-sm text-[#FAF9F5] hover:border-white/25 hover:bg-white/[0.07] hover:text-white",
                isCollapsed ? "w-11 justify-center px-0" : "w-full justify-start gap-2 px-3"
              )}
            >
              <Plus className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate font-medium">{getNewChatLabel(workspaceId)}</span>}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              <p>{getNewChatLabel(workspaceId)}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      <div className="min-h-0 min-w-0 w-full flex-1 overflow-y-auto overflow-x-hidden">
        <div className={cn("box-border w-full max-w-full py-2", isCollapsed ? "space-y-1.5 px-2" : "space-y-2 px-4")}>
          {conversations.length === 0 ? (
            <EmptyState workspaceId={workspaceId} isCollapsed={isCollapsed} />
          ) : (
            <>
              {!isCollapsed && (
                <div className="px-1 pb-1 pt-3">
                  <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#FAF9F5]/45">
                    Lịch sử
                  </span>
                </div>
              )}

              {conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={currentConversationId === conversation.id}
                  isCollapsed={isCollapsed}
                  onSelect={() => handleSelectChat(conversation.id)}
                  onDelete={() => deleteConversation(conversation.id)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {onCollapsedChange && (
        <div className={cn("w-full shrink-0 border-t border-white/10", isCollapsed ? "px-2 py-3" : "p-3")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                onClick={() => onCollapsedChange(!isCollapsed)}
                variant="ghost"
                aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
                className={cn(
                  "h-10 rounded-[9.6px] text-[#FAF9F5]/62 hover:border-white/15 hover:bg-white/[0.07] hover:text-white",
                  isCollapsed ? "w-11 justify-center px-0" : "w-full justify-start gap-2 px-3"
                )}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4 shrink-0" />
                ) : (
                  <PanelLeftClose className="h-4 w-4 shrink-0" />
                )}
                {!isCollapsed && <span>Thu gọn sidebar</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isCollapsed ? "right" : "top"}>
              <p>{isCollapsed ? "Mở rộng" : "Thu gọn"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  workspaceId,
  isCollapsed,
}: {
  workspaceId: WorkspaceId;
  isCollapsed: boolean;
}) {
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="mx-auto mt-3 flex h-11 w-11 items-center justify-center rounded-[9.6px] bg-white/[0.05] text-[#FAF9F5]/62">
            <Bot className="h-5 w-5" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{getEmptyTitle(workspaceId)}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.07]">
        <Bot className="h-5 w-5 text-[#FAF9F5]/65" />
      </div>
      <p className="text-sm text-[#FAF9F5]/85">{getEmptyTitle(workspaceId)}</p>
      <p className="mt-1 text-xs text-[#FAF9F5]/50">{getEmptySubtitle(workspaceId)}</p>
    </div>
  );
}

function ConversationItem({
  conversation,
  isActive,
  isCollapsed,
  onSelect,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  isCollapsed: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={conversation.title}
            className={cn(
              "mx-auto flex h-11 w-11 items-center justify-center rounded-[9.6px] text-[#FAF9F5]/62 transition-colors hover:bg-white/[0.07] hover:text-white",
              isActive && "bg-[hsl(var(--sidebar-active))] text-white"
            )}
            onClick={onSelect}
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-64">
          <p className="truncate font-medium">{conversation.title}</p>
          <p className="text-xs text-muted-foreground">{formatTimestamp(conversation.updatedAt)}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full max-w-full min-w-0 cursor-pointer items-center gap-2.5 overflow-hidden rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3 text-sm text-[#FAF9F5]/82 transition-colors hover:border-white/18 hover:bg-white/[0.06]",
        isActive && "border-[hsl(var(--terracotta))]/55 bg-[hsl(var(--sidebar-active))] text-white"
      )}
      onClick={onSelect}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white/[0.06] text-[#FAF9F5]/58",
          isActive && "bg-[hsl(var(--terracotta))]/18 text-[hsl(var(--terracotta))]"
        )}
      >
        <MessageSquare className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1 overflow-hidden">
        <span className="block truncate font-semibold leading-snug">{conversation.title}</span>
        <span className="mt-0.5 block text-xs text-[#FAF9F5]/45">{formatTimestamp(conversation.updatedAt)}</span>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Xóa cuộc trò chuyện"
            className="h-8 w-8 shrink-0 rounded-[8px] text-[#FAF9F5]/45 transition-colors hover:border-white/15 hover:bg-white/[0.08] hover:text-white"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Xóa cuộc trò chuyện</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function getWorkspacePath(workspaceId: WorkspaceId) {
  if (workspaceId === "teacher") return "/teacher";
  return "/newchat";
}

function getWorkspaceTitle(workspaceId: WorkspaceId) {
  if (workspaceId === "teacher") return "Teacher Studio";
  return "AI Math Chat";
}

function getWorkspaceSubtitle(workspaceId: WorkspaceId) {
  if (workspaceId === "teacher") return "Soạn tài liệu dạy học";
  return "Trợ lý toán học";
}

function getNewChatLabel(workspaceId: WorkspaceId) {
  if (workspaceId === "teacher") return "Soạn tài liệu mới";
  return "Tạo cuộc trò chuyện mới";
}

function getEmptyTitle(workspaceId: WorkspaceId) {
  if (workspaceId === "teacher") return "Chưa có hồ sơ soạn bài";
  return "Chưa có cuộc trò chuyện nào";
}

function getEmptySubtitle(workspaceId: WorkspaceId) {
  if (workspaceId === "teacher") return "Bấm nút trên để bắt đầu.";
  return "Bắt đầu bằng một câu hỏi toán học";
}
