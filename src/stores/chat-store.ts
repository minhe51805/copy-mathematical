import { create } from "zustand";
import type { ChatStore, Message, Conversation } from "@/types";
import { generateId, sanitizeAssistantContent } from "@/lib/math-utils";

const STORAGE_KEY = "math-chat-conversations";

function loadFromStorage(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
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

function saveToStorage(conversations: Conversation[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    // Ignore storage errors
  }
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  conversations: [],
  currentConversationId: null,
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

  clearMessages: () => {
    set({ messages: [] });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  saveConversation: () => {
    const { messages, conversations, currentConversationId } = get();
    if (messages.length === 0) return;

    const title = messages[0]?.content?.slice(0, 50) || "New chat";
    const updatedConversations = conversations.map((conv) =>
      conv.id === currentConversationId
        ? { ...conv, messages, updatedAt: Date.now() }
        : conv
    );

    if (!currentConversationId || !conversations.find((c) => c.id === currentConversationId)) {
      const newConv: Conversation = {
        id: currentConversationId || generateId(),
        title: title + (messages.length > 1 ? "..." : ""),
        messages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      updatedConversations.unshift(newConv);
    }

    saveToStorage(updatedConversations);
    set({ conversations: updatedConversations });
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
    const updated = get().conversations.filter((c) => c.id !== id);
    saveToStorage(updated);
    set({ conversations: updated });
    if (get().currentConversationId === id) {
      set({ messages: [], currentConversationId: null });
    }
  },

  clearAllConversations: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ conversations: [], messages: [], currentConversationId: null });
  },

  createNewConversation: () => {
    set({ messages: [], currentConversationId: null });
  },
}));

export function initializeStore() {
  const conversations = loadFromStorage();
  useChatStore.setState({ conversations });
}
