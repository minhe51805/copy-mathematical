import { generateAIText } from "./openai";

/**
 * Utility to check if a user query is a complex task that warrants showing the AI Thinking accordion.
 * Returns true for math queries, document generation, files, or long prompts.
 * Returns false for simple conversational chat (e.g. "hi", "bạn là", greetings).
 */
export function isComplexQuery(content: string, attachments?: any[]): boolean {
  if (attachments && attachments.length > 0) {
    return true;
  }

  const text = content.trim().toLowerCase();
  if (text.length > 40) {
    return true;
  }

  // Check for math patterns: LaTeX, common equations, calculus, geometry variables with operators
  const hasMathPattern = /[\$]|\\\(|\\\[|\\frac|\\int|\\lim|\\sum|[\dxyzt]\s*[\+\-\*\/=<>^]\s*[\dxyzt]/i.test(text);
  if (hasMathPattern) {
    return true;
  }

  // Complex keywords: math terms, solution intents, workspace document generation
  const complexKeywords = [
    "giai", "tinh", "tim", "chung minh", "soan", "tao", "de thi", "de kiem tra", "de bai",
    "ma tran", "rubric", "slide", "phu dao", "ngan hang", "tom tat", "giao an",
    "solve", "calculate", "prove", "find", "create", "generate", "write",
    "latex", "mathtype", "word", "pdf", "tich phan", "dao ham", "phuong trinh", "he thuc"
  ];

  // Normalize Vietnamese diacritics for robust matching
  const normalizedText = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return complexKeywords.some((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    return regex.test(normalizedText);
  });
}

/**
 * Advanced AI-driven semantic complexity evaluator and router.
 * Evaluates the query natural language semantics using a low-cost, fast pre-flight AI classification step.
 * Gracefully falls back to synchronous keyword/regex heuristics in case of any API error or timeout.
 */
export async function evaluateQueryComplexitySemantic(content: string, attachments?: any[]): Promise<boolean> {
  // 1. If there are attachments (images, documents, PDFs), it is always complex as it requires file reading/parsing
  if (attachments && attachments.length > 0) {
    return true;
  }

  const text = content.trim();

  // 2. Extremely short queries (under 4 chars) don't need semantic classification and are always fast path
  if (text.length < 4) {
    return false;
  }

  // 3. Zero-latency Fast Heuristic Bypass for greetings, quick chat, or small standard phrases
  const normalizedText = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const fastBypassGreetings = [
    "he lo", "hello", "hi", "xin chao", "chao ban", "chao ai", "chao", "chao ad", "chao shop", "helo", "hey",
    "bạn la ai", "ban la ai", "ten ban la gi", "ban ten gi", "ai do", "who are you",
    "test", "test chat", "ok", "oke", "da ok", "roi", "day", "vang", "u", "uh", "um", "yes", "no", "bye", "tam biet", "cam on", "thank", "thanks", "gud", "good"
  ];

  if (normalizedText.length < 25) {
    const isFastGreeting = fastBypassGreetings.some(greet => 
      normalizedText === greet || 
      normalizedText.startsWith(greet + " ") || 
      normalizedText.endsWith(" " + greet) ||
      /^(hi|hello|chao|ok|oke|cam on|thank|thanks)[.!?]*$/i.test(normalizedText)
    );
    if (isFastGreeting) {
      console.log(`[Semantic Router] Fast Heuristic Bypass triggered: "${text}" -> FAST (0ms)`);
      return false;
    }
  }

  // 4. Make a highly optimized, super concise pre-flight AI routing query (fewest input and output tokens)
  try {
    const routerPrompt = `Phân loại câu hỏi sau thành "THINK" (câu hỏi toán học, lập trình, giải bài, lập kế hoạch sư phạm bài bản, cần suy nghĩ/lập luận chi tiết) hoặc "FAST" (chào hỏi xã giao, yêu cầu sao chép công thức thuần túy, câu hỏi thông thường cực ngắn).
Chỉ phản hồi DUY NHẤT từ "THINK" hoặc "FAST" (viết hoa, không giải thích gì thêm).

Câu hỏi: "${text}"`;

    const start = Date.now();
    const result = await generateAIText({
      purpose: "chat",
      system: "Bạn là classifier phân loại cực nhanh. Chỉ trả về từ THINK hoặc FAST.",
      messages: [{ role: "user", content: routerPrompt }],
      temperature: 0,
      maxOutputTokens: 2,
    });
    const duration = Date.now() - start;

    const classification = result.trim().toUpperCase();
    console.log(`[Semantic Router] Classified in ${duration}ms: "${classification}" for query: "${text.slice(0, 50)}${text.length > 50 ? "..." : ""}"`);

    if (classification.includes("THINK")) {
      return true;
    }
    if (classification.includes("FAST")) {
      return false;
    }

    // If unexpected response, fallback to heuristic
    console.warn(`[Semantic Router] Unexpected AI response: "${classification}". Falling back to heuristics.`);
    return isComplexQuery(content, attachments);
  } catch (error) {
    console.warn("[Semantic Router] Error during semantic evaluation, falling back to heuristics:", error);
    return isComplexQuery(content, attachments);
  }
}
