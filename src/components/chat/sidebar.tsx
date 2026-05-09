"use client";

import { useRouter } from "next/navigation";
import { Bot, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { formatTimestamp } from "@/lib/math-utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { WorkspaceId } from "@/types";

interface SidebarProps {
  onChatSelect?: () => void;
  workspaceId?: WorkspaceId;
}

export function Sidebar({ onChatSelect, workspaceId = "general" }: SidebarProps) {
  const router = useRouter();
  const {
    conversations,
    currentConversationId,
    loadConversation,
    deleteConversation,
    clearAllConversations,
    createNewConversation,
  } = useChatStore();

  const handleNewChat = () => {
    createNewConversation();
    router.push(getWorkspacePath(workspaceId));
    onChatSelect?.();
  };

  const handleSelectChat = (id: string) => {
    loadConversation(id);
    router.push(`${getWorkspacePath(workspaceId)}?=#${encodeURIComponent(id)}`);
    onChatSelect?.();
  };

  return (
    <div className="flex h-full flex-col bg-[hsl(var(--sidebar-bg))] text-[#FAF9F5]">
      <div className="flex h-16 shrink-0 items-center gap-3 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--terracotta))] text-sm font-semibold text-white shadow-[rgba(217,119,87,0.18)_0px_8px_24px]">
          ∑
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{getWorkspaceTitle(workspaceId)}</p>
          <p className="truncate text-xs text-[#FAF9F5]/65">{getWorkspaceSubtitle(workspaceId)}</p>
        </div>
      </div>

      <div className="px-3 pb-3">
        <Button
          onClick={handleNewChat}
          variant="ghost"
          className="h-11 w-full justify-start gap-2 rounded-[9.6px] border-white/15 bg-white/[0.03] px-3 text-sm text-[#FAF9F5] hover:border-white/25 hover:bg-white/[0.07] hover:text-white"
        >
          <Plus className="h-4 w-4" />
          <span className="truncate font-medium">{getNewChatLabel(workspaceId)}</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.07]">
                <Bot className="h-5 w-5 text-[#FAF9F5]/65" />
              </div>
              <p className="text-sm text-[#FAF9F5]/85">
                Chưa có cuộc trò chuyện nào
              </p>
              <p className="mt-1 text-xs text-[#FAF9F5]/50">
                Bắt đầu bằng một câu hỏi toán học
              </p>
            </div>
          ) : (
            <>
              <div className="px-2 pb-1 pt-3">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#FAF9F5]/45">
                  Lịch sử
                </span>
              </div>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group relative flex min-w-0 cursor-pointer items-center gap-2 rounded-[9.6px] px-3 py-2.5 pr-10 text-sm text-[#FAF9F5]/82 transition-colors hover:bg-white/[0.06]",
                    currentConversationId === conv.id && "bg-[hsl(var(--sidebar-active))] text-white"
                  )}
                  onClick={() => handleSelectChat(conv.id)}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-[#FAF9F5]/58" />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <span className="block truncate font-medium leading-snug">{conv.title}</span>
                    <span className="text-xs text-[#FAF9F5]/45">
                      {formatTimestamp(conv.updatedAt)}
                    </span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-[#FAF9F5]/58 opacity-0 transition-opacity hover:border-white/15 hover:bg-white/[0.08] hover:text-white group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
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
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {conversations.length > 0 && (
        <div className="border-t border-white/10 p-3">
          <Button
            onClick={clearAllConversations}
            variant="ghost"
            className="h-10 w-full justify-start gap-2 rounded-[9.6px] px-3 text-[#FAF9F5]/62 hover:border-white/15 hover:bg-white/[0.07] hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
            <span>Xóa tất cả</span>
          </Button>
        </div>
      )}
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
  if (workspaceId === "teacher") return "Soạn giáo án";
  return "Trợ lý toán học";
}

function getNewChatLabel(workspaceId: WorkspaceId) {
  if (workspaceId === "teacher") return "Tạo hồ sơ soạn bài mới";
  return "Tạo cuộc trò chuyện mới";
}
