export type ExportDraftId = string;

export interface ExportDraft {
  id: ExportDraftId;
  title: string;
  description: string;
  filename: string;
  content: string;
  source: "original" | "ai" | "fallback";
}

interface CreateExportDraftsInput {
  content: string;
  request?: string | null;
}

const EXPORT_INTENT_PATTERN =
  /\b(xuất|xuat|export|download|tải|tai|file|tệp|tep|word|docx|document|tài liệu|tai lieu|canvas)\b/i;

const EXPORT_ONLY_PATTERN =
  /^\s*(hãy|hay|giúp|giup|cho|làm|lam|tạo|tao|xuất|xuat|export|download|tải|tai|in)?\s*(mình|minh|tôi|toi|tui|em|cho tôi|cho tui)?\s*(xuất|xuat|export|download|tải|tai|tạo|tao|làm|lam)?\s*(file|tệp|tep|word|docx|document|tài liệu|tai lieu|bản word|ban word|ra file|ra word|nội dung trên|noi dung tren|câu trên|cau tren|bài trên|bai tren|cái trên|cai tren|phần trên|phan tren)\s*(nhé|nhe|đi|di|với|voi|giùm|gium|cho mình|cho tui|ạ|a|\.|!|\?)*\s*$/i;

export function isExportRequest(message: string): boolean {
  return EXPORT_INTENT_PATTERN.test(message);
}

export function isExportOnlyRequest(message: string): boolean {
  return EXPORT_ONLY_PATTERN.test(message) || (
    isExportRequest(message) &&
    message.trim().split(/\s+/).length <= 8 &&
    !/[=+\-*/^]|giải|giai|tính|tinh|chứng minh|chung minh|viết|viet|soạn|soan/i.test(message)
  );
}

export function createOriginalExportDraft({ content, request }: CreateExportDraftsInput): ExportDraft {
  const source = content.trim();
  const title = inferTitle(source, request);
  const filenameBase = slugify(title || "math-chat");

  return {
    id: "original",
    title: "Nội dung gốc",
    description: "Xuất đúng câu trả lời vừa chọn, giữ nguyên cấu trúc và công thức.",
    filename: `${filenameBase}-goc.docx`,
    content: source,
    source: "original",
  };
}

export function createFallbackExportDrafts({ content, request }: CreateExportDraftsInput): ExportDraft[] {
  const source = content.trim();
  const safeRequest = request?.trim();
  const title = inferTitle(source, safeRequest);
  const filenameBase = slugify(title || "math-chat");
  const highlights = extractHighlights(source);

  return [
    {
      id: "fallback-document",
      title: "Tài liệu hoàn chỉnh",
      description: "Bản trình bày lại có tiêu đề, yêu cầu, nội dung chính và ghi chú kiểm tra.",
      filename: `${filenameBase}-tai-lieu.docx`,
      content: [
        `# ${title}`,
        safeRequest ? `## Yêu cầu\n${safeRequest}` : "",
        "## Nội dung chính",
        source,
        "## Ghi chú",
        "- Kiểm tra lại công thức, ký hiệu và giả thiết trước khi nộp hoặc chia sẻ.",
      ].filter(Boolean).join("\n\n"),
      source: "fallback",
    },
    {
      id: "fallback-summary",
      title: "Bản tóm tắt",
      description: "Rút gọn thành các ý chính để ôn tập nhanh.",
      filename: `${filenameBase}-tom-tat.docx`,
      content: [
        `# Tóm tắt: ${title}`,
        safeRequest ? `**Yêu cầu gốc:** ${safeRequest}` : "",
        "## Ý chính",
        ...highlights.map((item) => `- ${item}`),
        "## Nội dung tham chiếu",
        source,
      ].filter(Boolean).join("\n\n"),
      source: "fallback",
    },
    {
      id: "fallback-handout",
      title: "Phiếu học tập",
      description: "Bản handout có đề bài, lời giải tham khảo và mục tự kiểm tra.",
      filename: `${filenameBase}-phieu-hoc-tap.docx`,
      content: [
        `# Phiếu học tập: ${title}`,
        "## Đề bài / nhiệm vụ",
        safeRequest || "Dựa trên nội dung đã chọn, hoàn thiện phần lời giải hoặc ghi chú học tập.",
        "## Lời giải / nội dung tham khảo",
        source,
        "## Tự kiểm tra",
        "- Các bước biến đổi đã hợp lý chưa?",
        "- Công thức và ký hiệu đã thống nhất chưa?",
        "- Kết luận đã trả lời đúng yêu cầu ban đầu chưa?",
      ].join("\n\n"),
      source: "fallback",
    },
  ];
}

export function createFullCopyExportDrafts({ content, request }: CreateExportDraftsInput): ExportDraft[] {
  const source = content.trim();
  const safeRequest = request?.trim();
  const title = inferTitle(source, safeRequest);
  const filenameBase = slugify(title || "tai-lieu-day-du");
  const separatedContent = normalizeQuestionSeparators(source);
  const wordCleanContent = normalizeSpacingForWord(separatedContent);

  return [
    {
      id: "full-copy-word",
      title: "Bản Word đầy đủ",
      description: "Tạo trực tiếp từ text đã trích xuất, không gọi AI và không tóm tắt.",
      filename: `${filenameBase}-word-day-du.docx`,
      content: wordCleanContent,
      source: "fallback",
    },
    {
      id: "full-copy-questions",
      title: "Bản tách từng câu",
      description: "Giữ đủ nội dung, căn lại khoảng cách để mỗi câu dễ xem và dễ sao chép riêng.",
      filename: `${filenameBase}-tach-cau.docx`,
      content: separatedContent,
      source: "fallback",
    },
    {
      id: "full-copy-raw",
      title: "Bản nguyên văn trích xuất",
      description: "Giữ sát nội dung đọc được từ file, chỉ dùng cho trường hợp cần đối chiếu.",
      filename: `${filenameBase}-nguyen-van.docx`,
      content: source,
      source: "fallback",
    },
  ];
}

export function createExportDrafts(input: CreateExportDraftsInput): ExportDraft[] {
  return [
    createOriginalExportDraft(input),
    ...createFallbackExportDrafts(input),
  ];
}

export function normalizeExportDrafts(drafts: Array<Partial<ExportDraft>>, content: string, request?: string | null): ExportDraft[] {
  const fallback = createFallbackExportDrafts({ content, request });
  const title = inferTitle(content, request);
  const base = slugify(title || "math-chat");

  const normalized = drafts
    .slice(0, 3)
    .map((draft, index) => ({
      id: draft.id || `ai-${index + 1}`,
      title: draft.title?.trim() || fallback[index]?.title || `Phiên bản ${index + 1}`,
      description: draft.description?.trim() || fallback[index]?.description || "Bản do AI biên soạn lại.",
      filename: normalizeFilename(draft.filename, `${base}-ban-${index + 1}.docx`),
      content: draft.content?.trim() || fallback[index]?.content || content,
      source: "ai" as const,
    }))
    .filter((draft) => draft.content.trim());

  if (normalized.length >= 3) return normalized;

  return [
    ...normalized,
    ...fallback.slice(normalized.length).map((draft) => ({
      ...draft,
      id: draft.id.replace("fallback", "ai-fallback"),
    })),
  ].slice(0, 3);
}

export function inferTitle(content: string, request?: string | null): string {
  const heading = content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^#{1,3}\s+/.test(line));

  if (heading) {
    return heading.replace(/^#{1,3}\s+/, "").slice(0, 80);
  }

  const firstMeaningfulLine = (request || content)
    .split("\n")
    .map((line) => line.replace(/[*_`|#>-]/g, "").trim())
    .find(Boolean);

  return firstMeaningfulLine?.slice(0, 80) || "Tài liệu toán học";
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "math-chat";
}

function extractHighlights(content: string): string[] {
  const lines = content
    .split("\n")
    .map((line) => line.replace(/^#{1,6}\s+/, "").replace(/^[-*]\s+/, "").trim())
    .filter((line) => line && !isMarkdownTableSyntax(line));

  const uniqueLines = Array.from(new Set(lines));
  const highlights = uniqueLines
    .filter((line) => line.length >= 12)
    .slice(0, 6)
    .map((line) => line.slice(0, 180));

  return highlights.length > 0 ? highlights : ["Nội dung chính được giữ trong phần tham chiếu bên dưới."];
}

function isMarkdownTableSyntax(line: string): boolean {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line) || line.includes("|");
}

function normalizeFilename(filename: string | undefined, fallback: string): string {
  const raw = filename?.trim() || fallback;
  const withoutExtension = raw.replace(/\.docx$/i, "");
  return `${slugify(withoutExtension)}.docx`;
}

function normalizeQuestionSeparators(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/([^\n])\s+((?:Câu|Cau|Bài|Bai)\s*\d+(?:\b|[\s.:：\-–—)]))/gi, "$1\n\n$2")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function normalizeSpacingForWord(value: string) {
  return normalizeQuestionSeparators(value)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
