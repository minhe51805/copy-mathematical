import { create } from "zustand";
import type { ChatStore, Message, Conversation, WorkspaceId } from "@/types";
import { generateId, sanitizeAssistantContent } from "@/lib/math-utils";

const STORAGE_KEY = "math-chat-conversations";

function getStorageKey(workspaceId: WorkspaceId) {
  return workspaceId === "general" ? STORAGE_KEY : `${STORAGE_KEY}-${workspaceId}`;
}

function loadFromStorage(workspaceId: WorkspaceId): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(getStorageKey(workspaceId));
    const conversations = data ? JSON.parse(data) as Conversation[] : [];
    return conversations.map((conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) =>
        message.role === "assistant"
          ? { ...message, content: sanitizeAssistantContent(message.content) }
          : message
      ),
    }));
  } catch {
    return [];
  }
}

function saveToStorage(workspaceId: WorkspaceId, conversations: Conversation[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(workspaceId), JSON.stringify(conversations));
  } catch {
    // Ignore storage errors
  }
}

export const useChatStore = create<ChatStore>((set, get) => ({
  workspaceId: "general",
  messages: [],
  conversations: [],
  currentConversationId: null,
  conversationResetKey: 0,
  isLoading: false,

  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  updateMessage: (id: string, content: string) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      ),
    }));
  },

  setMessageExportSource: (id: string, exportSource) => {
    const { messages, conversations, currentConversationId, workspaceId } = get();
    const nextMessages = messages.map((message) =>
      message.id === id ? { ...message, exportSource } : message
    );
    const targetConversationId = currentConversationId ?? conversations[0]?.id ?? null;
    const nextConversations = conversations.map((conversation) =>
      conversation.id === targetConversationId
        ? { ...conversation, messages: nextMessages, updatedAt: Date.now() }
        : conversation
    );

    set({
      messages: nextMessages,
      conversations: nextConversations,
    });

    if (targetConversationId) {
      saveToStorage(workspaceId, nextConversations);
    }
  },

  removeAttachment: (attachmentId: string) => {
    const { messages, conversations, currentConversationId, workspaceId } = get();
    const nextMessages = messages.map((message) => ({
      ...message,
      attachments: message.attachments?.filter((attachment) => attachment.id !== attachmentId),
    }));

    const nextConversations = conversations.map((conversation) =>
      conversation.id === currentConversationId
        ? { ...conversation, messages: nextMessages, updatedAt: Date.now() }
        : conversation
    );

    set({
      messages: nextMessages,
      conversations: nextConversations,
    });

    if (currentConversationId) {
      saveToStorage(workspaceId, nextConversations);
    }
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  saveConversation: () => {
    const { messages, conversations, currentConversationId, workspaceId } = get();
    if (messages.length === 0) return;

    const title = messages[0]?.content?.slice(0, 50) || "New chat";
    let nextConversationId = currentConversationId;
    const updatedConversations = conversations.map((conv) =>
      conv.id === currentConversationId
        ? { ...conv, messages, updatedAt: Date.now() }
        : conv
    );

    if (!currentConversationId || !conversations.find((c) => c.id === currentConversationId)) {
      nextConversationId = currentConversationId || generateId();
      const newConv: Conversation = {
        id: nextConversationId,
        title: title + (messages.length > 1 ? "..." : ""),
        messages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      updatedConversations.unshift(newConv);
    }

    saveToStorage(workspaceId, updatedConversations);
    set({ conversations: updatedConversations, currentConversationId: nextConversationId });
  },

  loadConversation: (id: string) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (conv) {
      set({
        messages: conv.messages,
        currentConversationId: id,
      });
    }
  },

  deleteConversation: (id: string) => {
    const { workspaceId } = get();
    const updated = get().conversations.filter((c) => c.id !== id);
    saveToStorage(workspaceId, updated);
    set({ conversations: updated });
    if (get().currentConversationId === id) {
      set((state) => ({
        messages: [],
        currentConversationId: null,
        conversationResetKey: state.conversationResetKey + 1,
      }));
    }
  },

  clearAllConversations: () => {
    localStorage.removeItem(getStorageKey(get().workspaceId));
    set((state) => ({
      conversations: [],
      messages: [],
      currentConversationId: null,
      conversationResetKey: state.conversationResetKey + 1,
    }));
  },

  createNewConversation: () => {
    set((state) => ({
      messages: [],
      currentConversationId: null,
      isLoading: false,
      conversationResetKey: state.conversationResetKey + 1,
    }));
  },
}));

export function initializeStore(workspaceId: WorkspaceId = "general") {
  const conversations = loadFromStorage(workspaceId);
  useChatStore.setState({
    workspaceId,
    conversations,
    messages: [],
    currentConversationId: null,
  });
}
