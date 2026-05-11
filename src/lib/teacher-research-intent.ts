const RESEARCH_KEYWORDS = [
  "tim",
  "tim kiem",
  "tim them",
  "tra cuu",
  "nghien cuu",
  "research",
  "search",
  "web",
  "nguon",
  "nguon khac",
  "nguon tham khao",
  "tham khao",
  "tham khao them",
  "bo sung",
  "them thong tin",
  "mo rong",
  "doi chieu",
  "so sanh",
  "kiem chung",
  "fact check",
  "fact-check",
  "cap nhat",
  "moi nhat",
  "gan day",
  "hien nay",
  "hien tai",
  "bo giao duc",
  "moet",
  "chuong trinh moi",
  "sach giao khoa",
  "tai lieu tham khao",
  "trich dan",
  "citation",
  "cite",
] as const;

const RESEARCH_INTENT_PATTERN = new RegExp(
  `\\b(?:${RESEARCH_KEYWORDS
    .map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})\\b`,
  "i"
);

export function isTeacherResearchPrompt(content: string) {
  if (!content.trim()) return false;
  return RESEARCH_INTENT_PATTERN.test(normalizeForSearchIntent(content));
}

export function normalizeForSearchIntent(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[“”"'`]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
