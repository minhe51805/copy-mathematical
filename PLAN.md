# KẾ HOẠCH CHI TIẾT: AI Chatbot - Word Document Generator with Math Support

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mô tả
Xây dựng web app AI chatbot hỗ trợ tạo Word document với công thức toán đặc biệt (giống ChatGPT nhưng tập trung vào toán học & xuất Word).

### 1.2 Tính năng chính
- AI Chatbot thông minh (hỗ trợ toán học)
- Render công thức toán LaTeX đẹp mắt
- Xuất nội dung chat ra Word (.docx) giữ nguyên công thức
- Giao diện giống ChatGPT (UI thân thiện, dễ dùng)
- Copy công thức toán (LaTeX code)

### 1.3 Tech Stack
| Layer | Công nghệ |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI Components | Shadcn UI |
| Styling | Tailwind CSS |
| AI Provider | OpenAI API (GPT-4o) |
| Math Rendering | KaTeX |
| Word Generation | docx (npm package) |
| Markdown | react-markdown + remark-math + rehype-katex |
| State | Zustand (lightweight) |
| Icons | Lucide React |

---

## 2. GIAI ĐOẠN 1: Setup Project

### Bước 1.1: Khởi tạo Next.js Project
```
npx create-next-app@latest copy-mathematical --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### Bước 1.2: Cài đặt Shadcn UI
```
npx shadcn@latest init
```
Chọn defaults:
- Style: Default
- Base color: Slate
- CSS variables: Yes

### Bước 1.3: Cài đặt các Shadcn components cần thiết
```
npx shadcn@latest add button, input, textarea, dropdown-menu, dialog, scroll-area, separator, sheet, skeleton, toast, tooltip, badge, avatar
```

### Bước 1.4: Cài đặt dependencies
```bash
npm install openai katex react-markdown remark-math rehype-katex docx zustand lucide-react clsx tailwind-merge class-variance-authority
npm install -D @types/katex
```

### Bước 1.5: Cấu trúc thư mục
```
src/
├── app/
│   ├── page.tsx                    # Trang chính (chat)
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global + KaTeX CSS
│   └── api/
│       └── chat/
│           └── route.ts            # POST: AI chat endpoint
├── components/
│   ├── ui/                         # Shadcn base components
│   ├── chat/
│   │   ├── sidebar.tsx             # Sidebar chat history
│   │   ├── chat-container.tsx      # Main chat container
│   │   ├── message-list.tsx         # Messages list
│   │   ├── message.tsx              # Single message
│   │   ├── chat-input.tsx          # Input area
│   │   └── math-renderer.tsx        # KaTeX renderer
│   ├── word/
│   │   ├── export-dialog.tsx       # Dialog chọn options
│   │   └── docx-generator.ts       # Logic tạo Word
│   └── layout/
│       ├── header.tsx              # Header
│       └── theme-toggle.tsx        # Dark/Light mode
├── lib/
│   ├── openai.ts                   # OpenAI client config
│   ├── math-utils.ts               # LaTeX parsing utilities
│   ├── docx-generator.ts            # Tạo Word document
│   ├── utils.ts                    # cn() helper
│   └── prompts.ts                  # System prompts cho AI
├── hooks/
│   ├── use-chat.ts                 # Chat state (Zustand)
│   ├── use-theme.ts                # Theme state
│   └── use-toast.ts                # Toast notifications
├── stores/
│   └── chat-store.ts               # Zustand store
├── types/
│   └── index.ts                    # TypeScript types
└── .env.local                      # API keys
```

### Bước 1.6: Setup Environment
```
# .env.local
OPENAI_API_KEY=sk-...
```

---

## 3. GIAI ĐOẠN 2: UI Layout (giống ChatGPT)

### Bước 2.1: Root Layout
- Import KaTeX CSS vào globals.css
- Setup font (Inter)
- Wrap children với ThemeProvider

### Bước 2.2: Header Component
```
[Logo]  AI Math Chat  [Theme Toggle] [Settings]
```
- Sticky top
- Logo bên trái
- Actions bên phải

### Bước 2.3: Sidebar Component
```
[new chat button]
[chat 1 - 2024-01-01]
[chat 2 - 2024-01-02]
[chat 3 - hôm nay]

[clear all]
```
- Width: 260px (desktop), drawer (mobile)
- Lưu trữ localStorage
- Hover effects
- Delete chat button

### Bước 2.4: Main Layout (3-panel)
```
+----------+--------------------------------+
| Sidebar  |         Header                 |
| 260px    |--------------------------------|
|          |                                |
| [chat    |       Message List             |
|  list]   |       (scrollable)             |
|          |                                |
|          |--------------------------------|
|          |       Chat Input               |
+----------+--------------------------------+
```

### Bước 2.5: Responsive Breakpoints
- Mobile (<768px): Sidebar thành Sheet/Drawer
- Tablet (768-1024px): Sidebar collapsible
- Desktop (>1024px): Full sidebar

---

## 4. GIAI ĐOẠN 3: Chat Interface

### Bước 4.1: Chat Input Component
```
+--------------------------------------------------+
| [Textarea - auto resize]              [Send] [⌨️] |
+--------------------------------------------------+
```
- Auto-resize textarea (1-6 rows)
- Placeholder: "Nhập câu hỏi toán học..."
- Submit on Enter, Shift+Enter cho new line
- Disable khi đang streaming
- Show character count (optional)

### Bước 4.2: Message Component
```
User message (right aligned, primary color bg):
+------------------------+
| Nội dung tin nhắn      |
|                        |
| [Copy] [Export Word]   |
+------------------------+

AI message (left aligned, secondary bg):
+------------------------+
| Nội dung với **bold**  |
|                        |
| Công thức inline: $x$  |
|                        |
| Công thức block:       |
| $$\int_0^\infty e^{-x^2} dx$$ |
|                        |
| [Copy] [Export Word]   |
+------------------------+
```
- Markdown rendering (bold, italic, lists, code blocks)
- KaTeX rendering cho math expressions
- Copy button (copy text or LaTeX)
- Export Word button
- Timestamps
- Streaming indicator (▊ animated)

### Bước 4.3: Message List Component
- Auto-scroll to bottom on new message
- Scroll-to-bottom button khi có nhiều messages
- Loading skeleton khi đang fetch
- Empty state với gợi ý prompts

### Bước 4.4: Math Renderer Component
- Inline math: `$...$` → KaTeX inline
- Block math: `$$...$$` → KaTeX display
- Copy LaTeX button on hover
- Error fallback (nếu invalid LaTeX)

---

## 5. GIAI ĐOẠN 4: AI Integration

### Bước 5.1: OpenAI Client Config
```typescript
// lib/openai.ts
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

### Bước 5.2: API Route - POST /api/chat
```typescript
// Request body
{
  messages: Message[],      // [{role, content}]
  stream?: boolean          // default: true
}

// Response (streaming)
data: {
  content: string,          // partial content
  done: boolean,
}

// Response (non-stream)
{
  content: string,
  usage: {...},
}
```

### Bước 5.3: System Prompt cho Math
```
Bạn là một trợ lý toán học chuyên nghiệp. Khi trả lời:
1. Sử dụng **bold** cho định nghĩa quan trọng
2. Dùng $...$ cho công thức inline (VD: $x^2 + y^2 = r^2$)
3. Dùng $$...$$ cho công thức display/block
4. Dùng ```latex ... ``` cho code block LaTeX
5. Giải thích từng bước cho bài toán phức tạp
6. Sử dụng bullet points và numbered lists khi cần
```

### Bước 5.4: Chat State Management (Zustand)
```typescript
interface ChatStore {
  messages: Message[];
  conversations: Conversation[];
  addMessage: (msg: Message) => void;
  updateMessage: (id: string, content: string) => void;
  clearMessages: () => void;
  saveConversation: () => void;
  loadConversation: (id: string) => void;
}
```

### Bước 5.5: Streaming Implementation
- Sử dụng `openai.chat.completions.create({stream: true})`
- Stream về client qua ReadableStream
- Client xử lý stream bằng TextDecoder
- Cập nhật UI real-time

---

## 6. GIAI ĐOẠN 5: Word Document Generation

### Bước 6.1: docx Library Setup
```typescript
// lib/docx-generator.ts
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, MathRun, ShadingType } from 'docx';
import { katexToOmml } from './math-converter';
```

### Bước 6.2: Document Structure
```
Document
├── Title: "AI Math Chat Export"
├── Subtitle: Date
├── Separator
├── Message 1
│   ├── Author: "User" / "AI Assistant"
│   ├── Timestamp
│   └── Content (Paragraphs)
│       ├── Text Runs
│       ├── Bold/Italic
│       └── Math Equations (OMML)
├── Message 2
│   └── ...
└── Footer: Generated by AI Math Chat
```

### Bước 6.3: Content Parser
```typescript
function parseMarkdownToDocx(markdown: string): (TextRun | Paragraph)[] {
  // 1. Parse markdown (headings, bold, italic, lists)
  // 2. Extract LaTeX blocks
  // 3. Convert LaTeX → OMML (Word Math)
  // 4. Create docx elements
}
```

### Bước 6.4: Math Conversion (LaTeX → OMML)
- Khó nhất: Chuyển LaTeX → MathML → OMML
- Approach 1: Dùng `katex` + custom converter
- Approach 2: Dùng `mathlive` hoặc `mathjax`
- Approach 3: Chuyển thành hình ảnh (png) - fallback
- Chọn: Approach 2 (MathJax với mathml output)

### Bước 6.5: Export Dialog
```
+--------------------------------+
|  Export to Word                |
|                                |
|  Options:                      |
|  [x] Include math equations    |
|  [x] Preserve formatting       |
|  [ ] Include timestamps        |
|                                |
|  Range:                        |
|  ( ) Current message           |
|  (•) All messages              |
|                                |
|  [Cancel]        [Export]     |
+--------------------------------+
```

### Bước 6.6: Download Trigger
```typescript
function downloadDocx(doc: Document) {
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `math-chat-${date}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## 7. GIAI ĐOẠN 6: Copy Features

### Bước 7.1: Copy Message Text
- Copy markdown/text content
- Toast notification: "Đã sao chép!"

### Bước 7.2: Copy LaTeX Code
- Click vào math block → copy LaTeX source
- Icon: `</>` hiện khi hover math

### Bước 7.3: Copy dạng hình ảnh
- Render math → canvas → base64 → clipboard
- Dùng `html2canvas` hoặc native Canvas API

---

## 8. GIAI ĐOẠN 7: Polish & UX

### Bước 8.1: Loading States
- Skeleton messages khi AI đang "think"
- Typing indicator animation
- Button loading spinners

### Bước 8.2: Error Handling
- API key missing → Hướng dẫn setup
- API error → Toast + retry button
- Invalid LaTeX → Hiển thị lỗi đẹp
- Network error → Offline indicator

### Bước 8.3: Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Send message |
| `Ctrl/Cmd + N` | New chat |
| `Ctrl/Cmd + Shift + S` | Export current to Word |
| `Escape` | Close dialogs |

### Bước 8.4: Animations
- Fade-in cho messages
- Slide-in cho sidebar
- Smooth scroll
- Hover transitions

### Bước 8.5: Accessibility
- Focus management
- ARIA labels
- Keyboard navigation
- Screen reader support

---

## 9. THỨ TỰ ƯU TIÊN & TIMELINE

### Phase 1: Core MVP (3-4 ngày)
1. Setup project + Shadcn
2. Layout (sidebar, header, chat area)
3. Chat input + send message
4. API route → OpenAI
5. Display AI response (plain text)
6. Basic markdown rendering

### Phase 2: Math Support (2-3 ngày)
7. KaTeX integration
8. Inline & block math rendering
9. Copy LaTeX feature
10. Math error handling

### Phase 3: Word Export (2-3 ngày)
11. docx setup
12. Parse markdown → docx
13. Math → OMML conversion
14. Export dialog + download

### Phase 4: Polish (1-2 ngày)
15. Animations & transitions
16. Error handling
17. Keyboard shortcuts
18. Mobile responsive
19. Dark mode

---

## 10. CÂU HỎI CẦN XÁC NHẬN

### Trước khi bắt đầu code, bạn cần trả lời:

**Q1. AI Provider?**
- A) OpenAI (GPT-4o) - Cần API key
- B) Anthropic Claude - Cần API key
- C) Ollama (local, miễn phí nhưng chậm hơn)

**Q2. Database?**
- A) Chỉ localStorage (miễn phí, đơn giản)
- B) PostgreSQL/Supabase (cần setup server)

**Q3. Ưu tiên tính năng nào nhất?**
- A) AI Chat thông minh + Math rendering
- B) Export Word chính xác
- C) Cả hai như nhau

---

## 11. FILE MANIFEST

```
Danh sách files cần tạo:

1.  src/app/globals.css
2.  src/app/layout.tsx
3.  src/app/page.tsx
4.  src/app/api/chat/route.ts
5.  src/components/layout/header.tsx
6.  src/components/layout/theme-toggle.tsx
7.  src/components/chat/sidebar.tsx
8.  src/components/chat/chat-container.tsx
9.  src/components/chat/message-list.tsx
10. src/components/chat/message.tsx
11. src/components/chat/chat-input.tsx
12. src/components/chat/math-renderer.tsx
13. src/components/word/export-dialog.tsx
14. src/lib/openai.ts
15. src/lib/utils.ts
16. src/lib/math-utils.ts
17. src/lib/docx-generator.ts
18. src/lib/prompts.ts
19. src/hooks/use-chat.ts
20. src/hooks/use-theme.ts
21. src/stores/chat-store.ts
22. src/types/index.ts
23. .env.local.example
24. package.json (sau khi create-next-app)
25. components.json (sau khi shadcn init)
26. tailwind.config.ts
27. tsconfig.json
28. next.config.mjs
```

---

## 12. CHECKLIST TRƯỚC KHI CODE

```
□ Xác nhận AI Provider
□ Xác nhận phương thức lưu trữ
□ Xác nhận thứ tự ưu tiên
□ Chuẩn bị OpenAI API key (nếu dùng OpenAI)
□ Windows/Linux/Mac (để biết commands)
□ Cần authentication không?
□ Cần multi-user không?
□ Deploy lên đâu? (Vercel/Fly.io/Local)
```

---

*Bạn trả lời các câu hỏi trên, tôi sẽ bắt đầu code ngay!*
