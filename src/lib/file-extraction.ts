"use client";

import type { DocumentAttachment } from "@/types";

export const ACCEPTED_ATTACHMENT_TYPES = [
  "image/*",
  ".pdf",
  ".docx",
  ".xlsx",
  ".csv",
].join(",");

export const MAX_ATTACHMENTS = 8;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;
export const MAX_DOCUMENT_TEXT_CHARS = 240_000;

type SupportedDocumentType = "pdf" | "docx" | "spreadsheet" | "csv";

interface ExtractionResult {
  text: string;
  textLength: number;
  truncated: boolean;
  pageCount?: number;
  sheetCount?: number;
}

export function getSupportedFileKind(file: File): "image" | "document" | null {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  return getSupportedDocumentType(file) ? "document" : null;
}

export function isSupportedAttachmentFile(file: File) {
  return getSupportedFileKind(file) !== null;
}

export function getNormalizedMimeType(file: File) {
  return file.type || getMimeTypeFromExtension(file.name) || "application/octet-stream";
}

export async function extractDocumentAttachment(file: File, id: string): Promise<DocumentAttachment> {
  const documentType = getSupportedDocumentType(file);

  if (!documentType) {
    throw new Error("File này chưa được hỗ trợ.");
  }

  const result = await extractDocumentText(file, documentType);

  if (!result.text.trim()) {
    throw new Error("Không đọc được nội dung text trong file này.");
  }

  return {
    id,
    name: file.name,
    mimeType: getNormalizedMimeType(file),
    kind: "document",
    size: file.size,
    extractedText: result.text,
    textLength: result.textLength,
    truncated: result.truncated,
    pageCount: result.pageCount,
    sheetCount: result.sheetCount,
  };
}

export function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getSupportedDocumentType(file: File): SupportedDocumentType | null {
  const extension = getExtension(file.name);
  const mimeType = file.type.toLowerCase();

  if (extension === "pdf" || mimeType === "application/pdf") {
    return "pdf";
  }

  if (
    extension === "docx"
    || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }

  if (
    extension === "xlsx"
    || mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "spreadsheet";
  }

  if (extension === "csv" || mimeType === "text/csv") {
    return "csv";
  }

  return null;
}

function getExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function getMimeTypeFromExtension(filename: string) {
  switch (getExtension(filename)) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "csv":
      return "text/csv";
    default:
      return null;
  }
}

async function extractDocumentText(
  file: File,
  documentType: SupportedDocumentType
): Promise<ExtractionResult> {
  switch (documentType) {
    case "pdf":
      return extractPdfText(file);
    case "docx":
      return extractDocxText(file);
    case "spreadsheet":
      return extractSpreadsheetText(file);
    case "csv":
      return limitExtractedText(await file.text());
  }
}

async function extractPdfText(file: File): Promise<ExtractionResult> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;

  try {
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => {
          if (!isPdfTextItem(item)) return "";
          return item.hasEOL ? `${item.str}\n` : `${item.str} `;
        })
        .join("")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (pageText) {
        pages.push(`--- Trang ${pageNumber} ---\n${pageText}`);
      }
    }

    return {
      ...limitExtractedText(pages.join("\n\n")),
      pageCount: pdf.numPages,
    };
  } finally {
    await pdf.destroy();
  }
}

async function extractDocxText(file: File): Promise<ExtractionResult> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  });

  return limitExtractedText(result.value);
}

async function extractSpreadsheetText(file: File): Promise<ExtractionResult> {
  const { default: readXlsxFile } = await import("read-excel-file/browser");
  const workbookSheets = await readXlsxFile(file);
  const sheets = workbookSheets
    .map(({ sheet, data }) => {
      const rows = data
        .map((row) => row.map(formatSpreadsheetCellValue).join(","))
        .filter((rowText) => rowText.trim().length > 0);

      return `--- Sheet: ${sheet} ---\n${rows.join("\n")}`;
    })
    .filter((sheetText) => sheetText.trim().length > 0);

  return {
    ...limitExtractedText(sheets.join("\n\n")),
    sheetCount: workbookSheets.length,
  };
}

function formatSpreadsheetCellValue(value: unknown): string {
  if (value == null) return "";

  if (value instanceof Date) {
    return value.toISOString();
  }

  return escapeCsvCell(String(value));
}

function escapeCsvCell(value: string) {
  if (!/[",\n]/.test(value)) return value;
  return `"${value.replace(/"/g, "\"\"")}"`;
}

function limitExtractedText(value: string): ExtractionResult {
  const normalized = normalizeExtractedText(value);
  const textLength = normalized.length;

  if (textLength <= MAX_DOCUMENT_TEXT_CHARS) {
    return {
      text: normalized,
      textLength,
      truncated: false,
    };
  }

  return {
    text: [
      normalized.slice(0, MAX_DOCUMENT_TEXT_CHARS),
      "",
      `[Nội dung file dài hơn ${MAX_DOCUMENT_TEXT_CHARS.toLocaleString("vi-VN")} ký tự nên app đã rút gọn phần gửi vào model.]`,
    ].join("\n"),
    textLength,
    truncated: true,
  };
}

function normalizeExtractedText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function isPdfTextItem(item: unknown): item is { str: string; hasEOL?: boolean } {
  return Boolean(item && typeof item === "object" && "str" in item);
}
