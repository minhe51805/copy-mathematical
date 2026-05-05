export type ImageAttachment = {
  id: string;
  name: string;
  mimeType: string;
  kind?: "image";
  dataUrl: string;
  size: number;
};

export type DocumentAttachment = {
  id: string;
  name: string;
  mimeType: string;
  kind: "document";
  size: number;
  extractedText: string;
  textLength: number;
  truncated?: boolean;
  pageCount?: number;
  sheetCount?: number;
};

export type ChatAttachment = ImageAttachment | DocumentAttachment;

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
  timestamp: number;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

export interface ChatStore {
  messages: Message[];
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, content: string) => void;
  removeAttachment: (attachmentId: string) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  saveConversation: () => void;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  createNewConversation: () => void;
}
