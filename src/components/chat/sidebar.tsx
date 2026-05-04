"use client";

import { Bot, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { formatTimestamp } from "@/lib/math-utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onChatSelect?: () => void;
}

export function Sidebar({ onChatSelect }: SidebarProps) {
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
    onChatSelect?.();
  };

  const handleSelectChat = (id: string) => {
    loadConversation(id);
    onChatSelect?.();
  };

  return (
    <div className="flex h-full flex-col bg-[#171717] text-[#f4f4f4]">
      <div className="flex h-14 shrink-0 items-center gap-2 px-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4f4f4] text-sm font-semibold text-[#171717]">
          ∑
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">AI Math Chat</p>
          <p className="truncate text-xs text-[#b4b4b4]">Trợ lý toán học</p>
        </div>
      </div>

      <div className="px-2 pb-2">
        <Button
          onClick={handleNewChat}
          variant="ghost"
          className="h-10 w-full justify-start gap-2 rounded-lg border border-[#ffffff1f] bg-transparent px-3 text-sm text-[#f4f4f4] hover:bg-[#2f2f2f] hover:text-white"
        >
          <Plus className="h-4 w-4" />
          <span className="truncate font-medium">Tạo cuộc trò chuyện mới</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#2f2f2f]">
                <Bot className="h-5 w-5 text-[#b4b4b4]" />
              </div>
              <p className="text-sm text-[#d4d4d4]">
                Chưa có cuộc trò chuyện nào
              </p>
              <p className="mt-1 text-xs text-[#8f8f8f]">
                Bắt đầu bằng một câu hỏi toán học
              </p>
            </div>
          ) : (
            <>
              <div className="px-2 pb-1 pt-3">
                <span className="text-xs font-medium uppercase text-[#8f8f8f]">
                  Lịch sử
                </span>
              </div>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#dcdcdc] transition-colors hover:bg-[#242424]",
                    currentConversationId === conv.id && "bg-[#2f2f2f] text-white"
                  )}
                  onClick={() => handleSelectChat(conv.id)}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-[#b4b4b4]" />
                  <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                    <span className="truncate font-medium leading-snug">{conv.title}</span>
                    <span className="text-xs text-[#8f8f8f]">
                      {formatTimestamp(conv.updatedAt)}
                    </span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-[#b4b4b4] opacity-0 transition-opacity hover:bg-[#3a3a3a] hover:text-white group-hover:opacity-100"
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
        <div className="border-t border-[#ffffff1f] p-2">
          <Button
            onClick={clearAllConversations}
            variant="ghost"
            className="h-10 w-full justify-start gap-2 rounded-lg px-3 text-[#b4b4b4] hover:bg-[#2f2f2f] hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
            <span>Xóa tất cả</span>
          </Button>
        </div>
      )}
    </div>
  );
}
