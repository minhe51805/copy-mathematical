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
    "Nội dung tệp đính kèm đã được ứng dụng trích xuất ở dạng text. Hãy dựa vào đây để trả lời, giữ lại công thức và bảng nếu có.",
    documentText,
  ].join("\n\n");
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
