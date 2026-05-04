import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

type DocxBlock = Paragraph | Table;

export async function generateDocx(content: string, title = "AI Math Chat Export"): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Exported on ${new Date().toLocaleDateString("vi-VN")}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          ...parseContent(content),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

function parseContent(content: string): DocxBlock[] {
  const lines = content.split("\n");
  const blocks: DocxBlock[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      blocks.push(new Paragraph({ text: "" }));
      continue;
    }

    if (isMarkdownTableStart(lines, index)) {
      const tableLines = collectTableLines(lines, index);
      blocks.push(createTable(tableLines));
      index += tableLines.length - 1;
      continue;
    }

    if (trimmed.startsWith("$$")) {
      const mathLines = [trimmed.replace(/^\$\$/, "")];
      while (index + 1 < lines.length && !lines[index + 1].trim().endsWith("$$")) {
        index += 1;
        mathLines.push(lines[index].trim());
      }
      if (index + 1 < lines.length) {
        index += 1;
        mathLines.push(lines[index].trim().replace(/\$\$$/, ""));
      }
      blocks.push(createParagraph(`[Math] ${mathLines.join(" ").trim()}`, { italics: true }));
      continue;
    }

    if (trimmed.startsWith("# ")) {
      blocks.push(new Paragraph({ text: trimmed.slice(2), heading: HeadingLevel.HEADING_1 }));
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push(new Paragraph({ text: trimmed.slice(3), heading: HeadingLevel.HEADING_2 }));
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push(new Paragraph({ text: trimmed.slice(4), heading: HeadingLevel.HEADING_3 }));
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      blocks.push(
        new Paragraph({
          children: [
            new TextRun({ text: "• ", bold: true }),
            ...parseInlineStyles(bulletMatch[1]),
          ],
        })
      );
      continue;
    }

    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      blocks.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${numberedMatch[1]}. `, bold: true }),
            ...parseInlineStyles(numberedMatch[2]),
          ],
        })
      );
      continue;
    }

    blocks.push(createParagraph(trimmed));
  }

  return blocks;
}

function createParagraph(text: string, options?: { italics?: boolean }): Paragraph {
  if (options?.italics) {
    return new Paragraph({
      children: [new TextRun({ text: cleanInlineMarkdown(text), italics: true })],
    });
  }

  return new Paragraph({
    children: parseInlineStyles(text),
  });
}

function isMarkdownTableStart(lines: string[], index: number): boolean {
  return Boolean(lines[index]?.includes("|") && lines[index + 1] && isTableSeparator(lines[index + 1]));
}

function collectTableLines(lines: string[], startIndex: number): string[] {
  const tableLines: string[] = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    if (!lines[index].includes("|")) break;
    tableLines.push(lines[index]);
  }
  return tableLines;
}

function createTable(lines: string[]): Table {
  const rows = lines
    .filter((line) => !isTableSeparator(line))
    .map(parseTableRow)
    .filter((cells) => cells.length > 0);

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: rows.map((cells) =>
      new TableRow({
        children: cells.map((cell) =>
          new TableCell({
            children: [
              new Paragraph({
                children: parseInlineStyles(cell),
              }),
            ],
          })
        ),
      })
    ),
  });
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cleanInlineMarkdown(cell.trim()));
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function parseInlineStyles(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const cleanedText = cleanInlineMarkdown(text);
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(cleanedText)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: cleanedText.slice(lastIndex, match.index) }));
    }
    runs.push(new TextRun({ text: match[1], bold: true }));
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < cleanedText.length) {
    runs.push(new TextRun({ text: cleanedText.slice(lastIndex) }));
  }

  return runs.length > 0 ? runs : [new TextRun({ text: cleanedText })];
}

function cleanInlineMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\$([^$\n]+)\$/g, "$1");
}

export function downloadDocx(blob: Blob, filename: string = "math-chat.docx") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
