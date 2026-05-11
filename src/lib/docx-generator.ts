import { normalizeMathMarkdown } from "./math-utils";
import { replaceKatexWithMathmlForWord } from "./clipboard";

const WORD_EXPORT_STYLE_PROPERTIES = [
  "border-collapse",
  "border-radius",
  "border-spacing",
  "border-width",
  "box-sizing",
  "display",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "gap",
  "grid-template-columns",
  "height",
  "left",
  "line-height",
  "margin",
  "max-height",
  "max-width",
  "min-height",
  "min-width",
  "overflow",
  "padding",
  "position",
  "right",
  "table-layout",
  "text-align",
  "text-decoration",
  "top",
  "transform",
  "transform-origin",
  "vertical-align",
  "white-space",
  "width",
] as const;

const WORD_HTML_CSS = `
  @page WordSection1 {
    size: 21cm 29.7cm;
    margin: 1.7cm 1.8cm 1.7cm 1.8cm;
  }
  body {
    margin: 0;
    background: #ffffff;
    color: #111111;
    font-family: "Times New Roman", Times, "Cambria Math", serif;
    font-size: 11pt;
    line-height: 1.55;
  }
  .WordSection1 { page: WordSection1; }
  .export-title {
    margin: 0 0 4px;
    text-align: center;
    font-size: 18pt;
    font-weight: 700;
  }
  .export-date {
    margin: 0 0 18px;
    text-align: center;
    color: #666666;
    font-size: 9pt;
  }
  .math-chat-word,
  .math-chat-word * {
    color: #111111 !important;
  }
  .math-chat-word p { margin: 0 0 10px; }
  .math-chat-word h1 {
    margin: 18px 0 10px;
    color: #1f5f9f !important;
    font-size: 18pt;
    font-weight: 700;
  }
  .math-chat-word h2 {
    margin: 16px 0 9px;
    color: #1f5f9f !important;
    font-size: 15pt;
    font-weight: 700;
  }
  .math-chat-word h3 {
    margin: 14px 0 8px;
    font-size: 13pt;
    font-weight: 700;
  }
  .math-chat-word ul,
  .math-chat-word ol {
    margin: 0 0 10px 24px;
    padding: 0;
  }
  .math-chat-word li { margin: 3px 0; }
  .math-chat-word blockquote {
    margin: 10px 0;
    border-left: 3px solid #d0d0d0;
    padding-left: 10px;
    color: #444444 !important;
    font-style: italic;
  }
  .math-chat-word table {
    width: 100%;
    margin: 12px 0;
    border-collapse: collapse;
    font-size: 10pt;
  }
  .math-chat-word th,
  .math-chat-word td {
    border: 1px solid #d9d9d9;
    padding: 6px 8px;
    vertical-align: top;
  }
  .math-chat-word th {
    background: #f2f2f2;
    font-weight: 700;
  }
  .math-chat-word pre {
    margin: 10px 0;
    padding: 8px 10px;
    background: #f6f6f6;
    border: 1px solid #e3e3e3;
    border-radius: 6px;
    white-space: pre-wrap;
    font-family: "Times New Roman", Times, serif;
    font-size: 10pt;
  }
  .math-chat-word code {
    font-family: "Times New Roman", Times, serif;
    background: #f6f6f6;
    border-radius: 3px;
    padding: 1px 3px;
  }
  .math-chat-word hr {
    margin: 16px 0;
    border: 0;
    border-top: 1px solid #d9d9d9;
  }
  .math-chat-word .katex,
  .math-chat-word .katex * {
    box-sizing: content-box;
  }
  .math-chat-word .katex {
    font-size: 1.08em;
    line-height: normal;
    font-family: KaTeX_Main, "Times New Roman", serif;
    text-rendering: geometricPrecision;
  }
  .math-chat-word math {
    font-family: "Cambria Math", "Times New Roman", serif;
    font-size: 1.05em;
    line-height: 1.2;
  }
  .math-chat-word math * {
    font-family: inherit;
  }
  .math-chat-word .math-word-inline {
    display: inline;
    vertical-align: middle;
  }
  .math-chat-word .math-word-display {
    display: block;
    margin: 12px 0;
    text-align: center;
  }
  .math-chat-word .katex .mathnormal {
    font-family: KaTeX_Math;
  }
  .math-chat-word .katex .mathit,
  .math-chat-word .katex .mathbf,
  .math-chat-word .katex .mainrm {
    font-family: KaTeX_Main;
  }
  .math-chat-word .katex .sqrt > .sqrt-sign,
  .math-chat-word .katex .delimsizing.size1 {
    font-family: KaTeX_Size1;
  }
  .math-chat-word .katex .delimsizing.size2 {
    font-family: KaTeX_Size2;
  }
  .math-chat-word .katex .delimsizing.size3 {
    font-family: KaTeX_Size3;
  }
  .math-chat-word .katex .delimsizing.size4 {
    font-family: KaTeX_Size4;
  }
  .math-chat-word .katex-display {
    display: block;
    margin: 12px 0;
    padding: 10px 12px;
    text-align: center;
    overflow: visible;
    background: #f7f7f7;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
  }
  .math-chat-word .katex-display > .katex {
    display: block;
    text-align: center;
  }
  .math-chat-word .katex-html {
    white-space: nowrap;
    overflow: visible;
  }
`;

export async function generateDocx(
  content: string,
  title = "AI Math Chat Export",
  renderedElement?: HTMLElement | null
): Promise<Blob> {
  const bodyHtml = renderedElement
    ? createRenderedContentHtml(renderedElement)
    : createFallbackContentHtml(content);

  return new Blob(
    [
      [
        "<!doctype html>",
        '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">',
        "<head>",
        '<meta charset="utf-8">',
        `<title>${escapeHtml(title)}</title>`,
        `<style>${WORD_HTML_CSS}</style>`,
        "</head>",
        "<body>",
        '<div class="WordSection1">',
        `<h1 class="export-title">${escapeHtml(title)}</h1>`,
        `<p class="export-date">Exported on ${new Date().toLocaleDateString("vi-VN")}</p>`,
        `<div class="math-chat-word">${bodyHtml}</div>`,
        "</div>",
        "</body>",
        "</html>",
      ].join(""),
    ],
    { type: "application/msword;charset=utf-8" }
  );
}

export function getWordExportFilename(filename = "math-chat.doc") {
  const trimmed = filename.trim() || "math-chat.doc";
  return trimmed.replace(/\.(docx|doc)$/i, "") + ".doc";
}

export function downloadDocx(blob: Blob, filename: string = "math-chat.doc") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = getWordExportFilename(filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function createRenderedContentHtml(element: HTMLElement) {
  const clone = element.cloneNode(true) as HTMLElement;
  inlineRenderedStyles(element, clone);
  replaceKatexWithMathmlForWord(clone);
  removeHiddenMath(clone);
  trimUiOnlyAttributes(clone);
  return clone.innerHTML;
}

function inlineRenderedStyles(source: HTMLElement, clone: HTMLElement) {
  const sourceNodes = [source, ...Array.from(source.querySelectorAll("*"))];
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll("*"))];

  sourceNodes.forEach((sourceNode, index) => {
    const cloneNode = cloneNodes[index];

    if (!cloneNode || !isStylableElement(cloneNode)) return;

    const shouldInline = isKatexNode(sourceNode) || isCoreContentNode(sourceNode);
    if (!shouldInline) return;

    const computedStyle = window.getComputedStyle(sourceNode);

    for (const property of WORD_EXPORT_STYLE_PROPERTIES) {
      const value = computedStyle.getPropertyValue(property);
      if (value) {
        cloneNode.style.setProperty(property, value);
      }
    }
  });
}

function isKatexNode(node: Element) {
  return Boolean(
    node.closest(".katex, .katex-display") ||
    node.classList.contains("katex") ||
    node.classList.contains("katex-display")
  );
}

function isCoreContentNode(node: Element) {
  return /^(DIV|SPAN|P|H1|H2|H3|H4|H5|H6|UL|OL|LI|TABLE|THEAD|TBODY|TR|TH|TD|BLOCKQUOTE|PRE|CODE|HR)$/i
    .test(node.tagName);
}

function isStylableElement(node: Element): node is HTMLElement | SVGElement {
  return node instanceof HTMLElement || node instanceof SVGElement;
}

function removeHiddenMath(root: HTMLElement) {
  root.querySelectorAll(".katex-mathml, annotation").forEach((node) => {
    node.remove();
  });
}

function trimUiOnlyAttributes(root: HTMLElement) {
  root.querySelectorAll("[data-copy-ui]").forEach((node) => {
    node.remove();
  });

  root.querySelectorAll("*").forEach((node) => {
    node.removeAttribute("data-state");
    node.removeAttribute("data-copy-ui");
    node.removeAttribute("aria-hidden");

    if (!node.classList.contains("math-word-inline") && !node.classList.contains("math-word-display")) {
      node.removeAttribute("class");
    }
  });
}

function createFallbackContentHtml(content: string) {
  return normalizeMathMarkdown(content)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${formatFallbackInline(paragraph)}</p>`)
    .join("");
}

function formatFallbackInline(value: string) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\$([^$\n]+)\$/g, '<span style="font-family: Cambria Math, serif;">$1</span>')
    .replace(/\n/g, "<br>");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
