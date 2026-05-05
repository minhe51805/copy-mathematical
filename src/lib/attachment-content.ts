export interface TextAttachmentLike {
  kind?: string;
  name?: string;
  mimeType?: string;
  extractedText?: string;
  textLength?: number;
  truncated?: boolean;
  pageCount?: number;
  sheetCount?: number;
}

export function hasDocumentAttachments(attachments: TextAttachmentLike[] | undefined) {
  return Boolean(attachments?.some(isReadableDocumentAttachment));
}

export function getDefaultPromptForAttachments(attachments: TextAttachmentLike[] | undefined) {
  if (hasDocumentAttachments(attachments)) {
    return "Đọc các tệp đính kèm và trích xuất toàn bộ nội dung, công thức, bảng biểu, số liệu quan trọng trong đó.";
  }

  return "Đọc ảnh và trích xuất công thức/toán học trong ảnh.";
}

export function buildMessageTextWithAttachments(
  content: string | undefined,
  attachments: TextAttachmentLike[] | undefined
) {
  const baseText = content?.trim() || getDefaultPromptForAttachments(attachments);
  const documentText = formatDocumentAttachments(attachments);

  if (!documentText) {
    return baseText;
  }

  return [
    baseText,
    createDocumentInstruction(baseText, attachments),
    documentText,
  ].join("\n\n");
}

export function buildLocalDocumentCopyResponse(
  userRequest: string,
  attachments: TextAttachmentLike[] | undefined
) {
  const documentAttachments = (attachments ?? []).filter(isReadableDocumentAttachment);

  if (!documentAttachments.length || !isFullCopyRequest(userRequest)) {
    return null;
  }

  return documentAttachments
    .map((attachment, index) => formatLocalDocumentCopy(attachment, index))
    .join("\n\n---\n\n");
}

function createDocumentInstruction(
  userRequest: string,
  attachments: TextAttachmentLike[] | undefined
) {
  const hasTruncatedDocument = attachments?.some((attachment) => attachment.truncated) ?? false;
  const wantsFullCopy = isFullCopyRequest(userRequest);

  return [
    "Nội dung tệp đính kèm đã được ứng dụng trích xuất ở dạng text. Hãy dựa vào đây để trả lời, giữ lại công thức và bảng nếu có.",
    wantsFullCopy
      ? [
        "Yêu cầu quan trọng: người dùng muốn lấy nội dung để chép/copy sang nơi khác, nên KHÔNG tóm tắt và KHÔNG chọn lọc.",
        "Hãy trình bày lại toàn bộ nội dung theo đúng thứ tự xuất hiện trong tệp, không bỏ qua câu/bài nào.",
        "Mỗi bài/câu phải bắt đầu trên một dòng riêng theo dạng `Câu 1`, `Câu 2`, ... để giao diện tạo nút sao chép riêng cho từng phần.",
        "Nếu nội dung quá dài vượt giới hạn trả lời, hãy xuất tuần tự nhiều nhất có thể và kết thúc bằng dòng: `[Còn tiếp - gửi \"tiếp tục\" để lấy phần sau]`.",
      ].join(" ")
      : "Nếu người dùng yêu cầu trích toàn bộ, hãy xuất theo đúng thứ tự trong tệp, không tự ý bỏ câu.",
    hasTruncatedDocument
      ? "Lưu ý: một hoặc nhiều tệp đã bị rút gọn trước khi gửi vào model vì quá dài; hãy nói rõ nếu cần người dùng chia nhỏ file để lấy đầy đủ hơn."
      : "",
  ].filter(Boolean).join("\n");
}

export function formatDocumentAttachments(attachments: TextAttachmentLike[] | undefined) {
  const documentAttachments = (attachments ?? []).filter(isReadableDocumentAttachment);

  if (!documentAttachments.length) {
    return "";
  }

  return documentAttachments
    .map((attachment, index) => {
      const metadata = [
        `name="${escapeAttribute(attachment.name || `file-${index + 1}`)}"`,
        attachment.mimeType ? `mime="${escapeAttribute(attachment.mimeType)}"` : null,
        attachment.pageCount ? `pages="${attachment.pageCount}"` : null,
        attachment.sheetCount ? `sheets="${attachment.sheetCount}"` : null,
        attachment.textLength ? `chars="${attachment.textLength}"` : null,
        attachment.truncated ? `truncated="true"` : null,
      ].filter(Boolean).join(" ");

      return [
        `<attached_document index="${index + 1}" ${metadata}>`,
        attachment.extractedText?.trim() || "",
        "</attached_document>",
      ].join("\n");
    })
    .join("\n\n");
}

function isReadableDocumentAttachment(
  attachment: TextAttachmentLike
): attachment is TextAttachmentLike & { extractedText: string } {
  return attachment.kind === "document"
    && typeof attachment.extractedText === "string"
    && attachment.extractedText.trim().length > 0;
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function isFullCopyRequest(value: string) {
  return /\b(đưa\s*ra\s*hết|dua\s*ra\s*het|toàn\s*bộ|toan\s*bo|full|chép|chep|copy|paste|dán|dan|sao\s*chép|sao\s*chep|trích\s*hết|trich\s*het|trích\s*toàn\s*bộ|trich\s*toan\s*bo|lấy\s*hết|lay\s*het)\b/i
    .test(value);
}

function formatLocalDocumentCopy(
  attachment: TextAttachmentLike & { extractedText: string },
  index: number
) {
  const title = attachment.name?.trim() || `Tệp ${index + 1}`;
  const metadata = [
    attachment.pageCount ? `${attachment.pageCount} trang` : null,
    attachment.sheetCount ? `${attachment.sheetCount} sheet` : null,
    attachment.textLength ? `${attachment.textLength.toLocaleString("vi-VN")} ký tự` : null,
  ].filter(Boolean).join(" · ");

  return [
    `# ${title}`,
    metadata ? `_${metadata}_` : "",
    attachment.truncated
      ? "> Lưu ý: nội dung file này đã bị rút gọn trước khi hiển thị vì quá dài. Hãy chia nhỏ file nếu cần lấy đủ 100%."
      : "",
    normalizeExtractedCopyText(attachment.extractedText),
  ].filter(Boolean).join("\n\n");
}

function normalizeExtractedCopyText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/([^\n])\s+((?:Câu|Cau|Bài|Bai)\s*\d+(?:\b|[\s.:：\-–—)]))/gi, "$1\n\n$2")
    .replace(/([^\n])\s+([A-D]\s*[\.)])\s+/g, "$1\n$2 ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}
