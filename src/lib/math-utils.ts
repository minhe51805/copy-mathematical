export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function extractLatexBlocks(content: string): { type: "text" | "inline" | "block"; content: string }[] {
  const normalizedContent = normalizeMathMarkdown(content);
  const blocks: { type: "text" | "inline" | "block"; content: string }[] = [];
  const regex = /\$\$([\s\S]*?)\$\$|\$([^$\n]+?)\$|```latex\n?([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(normalizedContent)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: "text", content: normalizedContent.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      blocks.push({ type: "block", content: match[1] });
    } else if (match[2]) {
      blocks.push({ type: "inline", content: match[2] });
    } else if (match[3]) {
      blocks.push({ type: "block", content: match[3] });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < normalizedContent.length) {
    blocks.push({ type: "text", content: normalizedContent.slice(lastIndex) });
  }

  return blocks;
}

export function normalizeMathMarkdown(content: string): string {
  return content
    .replace(/```latex\s*([\s\S]*?)```/gi, (_match, math: string) => {
      return `\n\n$$\n${math.trim()}\n$$\n\n`;
    })
    .replace(/\\\[([\s\S]*?)\\\]/g, (_match, math: string) => {
      return `\n\n$$\n${math.trim()}\n$$\n\n`;
    })
    .replace(/\\\(([\s\S]*?)\\\)/g, (_match, math: string) => {
      return `$${math.trim()}$`;
    });
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff < oneDay && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } else if (diff < 2 * oneDay) {
    return "Hôm qua";
  } else {
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
}

export function sanitizeAssistantContent(content: string): string {
  let cleaned = content
    .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "")
    .replace(/<thinking>[\s\S]*?(?:<\/thinking>|$)/gi, "")
    .replace(/^\s*(?:[-–—]\s*)?(?:analysis|reasoning|thinking)\s*:\s*/i, "");

  const trimmedStart = cleaned.trimStart();
  const leadingWhitespace = cleaned.slice(0, cleaned.length - trimmedStart.length);
  const paragraphs = trimmedStart.split(/\n\s*\n/);
  const lines = trimmedStart.split("\n");
  const firstParagraph = paragraphs[0]?.trim() ?? "";
  const isMetaIntro =
    /^(?:người dùng|nguoi dung|the user|user)\b/i.test(firstParagraph) ||
    /^(?:tôi sẽ|toi se|i will|let me)\b.*\b(?:trả lời|tra loi|liệt kê|liet ke|respond|answer|explain)\b/i.test(firstParagraph);

  if (isMetaIntro) {
    if (paragraphs.length > 1) {
      cleaned = leadingWhitespace + paragraphs.slice(1).join("\n\n").trimStart();
    } else if (lines.length > 1) {
      cleaned = leadingWhitespace + lines.slice(1).join("\n").trimStart();
    } else {
      cleaned = "";
    }
  }

  return cleaned.trimStart();
}
