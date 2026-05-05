import { normalizeMathMarkdown } from "./math-utils";

const BLOCK_TAGS = new Set([
  "ADDRESS",
  "ARTICLE",
  "ASIDE",
  "BLOCKQUOTE",
  "DIV",
  "DL",
  "FIELDSET",
  "FIGCAPTION",
  "FIGURE",
  "FOOTER",
  "FORM",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HEADER",
  "HR",
  "LI",
  "MAIN",
  "NAV",
  "OL",
  "P",
  "PRE",
  "SECTION",
  "TABLE",
  "UL",
]);

const STRIP_MARKDOWN_PATTERNS: Array<[RegExp, string]> = [
  [/```(?:\w+)?\n?([\s\S]*?)```/g, "$1"],
  [/\$\$([\s\S]*?)\$\$/g, "$1"],
  [/\$([^$\n]+)\$/g, "$1"],
  [/^\s{0,3}#{1,6}\s+/gm, ""],
  [/^\s*[-*+]\s+/gm, "- "],
  [/^\s*>\s?/gm, ""],
  [/\*\*([^*]+)\*\*/g, "$1"],
  [/\*([^*]+)\*/g, "$1"],
  [/__([^_]+)__/g, "$1"],
  [/_([^_]+)_/g, "$1"],
  [/`([^`]+)`/g, "$1"],
  [/\[([^\]]+)\]\([^)]+\)/g, "$1"],
];

const KATEX_CSS_URL = "https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.css";

const KATEX_COPY_STYLE_PROPERTIES = [
  "background",
  "background-color",
  "border",
  "border-bottom",
  "border-left",
  "border-radius",
  "border-right",
  "border-top",
  "box-sizing",
  "clip",
  "clip-path",
  "color",
  "display",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "height",
  "left",
  "line-height",
  "margin",
  "max-height",
  "max-width",
  "min-height",
  "min-width",
  "overflow",
  "overflow-x",
  "overflow-y",
  "padding",
  "position",
  "right",
  "text-align",
  "text-rendering",
  "top",
  "transform",
  "transform-origin",
  "vertical-align",
  "white-space",
  "width",
] as const;

const CLIPBOARD_CSS = `
  @import url("${KATEX_CSS_URL}");
  .math-chat-copy {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 15px;
    line-height: 1.65;
    color: #111;
  }
  .math-chat-copy p { margin: 0 0 12px; }
  .math-chat-copy h1 { font-size: 24px; margin: 18px 0 12px; font-weight: 700; }
  .math-chat-copy h2 { font-size: 20px; margin: 16px 0 10px; font-weight: 700; }
  .math-chat-copy h3 { font-size: 17px; margin: 14px 0 8px; font-weight: 700; }
  .math-chat-copy ul, .math-chat-copy ol { margin: 0 0 12px 24px; padding: 0; }
  .math-chat-copy li { margin: 4px 0; }
  .math-chat-copy table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 14px; }
  .math-chat-copy th, .math-chat-copy td { border: 1px solid #d9d9d9; padding: 8px 10px; vertical-align: top; }
  .math-chat-copy th { background: #f3f3f3; font-weight: 700; }
  .math-chat-copy pre { background: #f5f5f5; border: 1px solid #e5e5e5; border-radius: 8px; padding: 10px; white-space: pre-wrap; }
  .math-chat-copy code { font-family: Consolas, Monaco, monospace; background: #f5f5f5; padding: 1px 4px; border-radius: 4px; }
  .math-chat-copy .katex { font-size: 1.08em; }
  .math-chat-copy .katex-display {
    display: block;
    margin: 14px 0;
    padding: 12px 14px;
    text-align: center;
    overflow-x: auto;
    overflow-y: visible;
    background: #f5f5f5;
    border: 1px solid #d9d9d9;
    border-radius: 10px;
  }
  .math-chat-copy .katex-display > .katex { display: block; padding: 3px 0; text-align: center; }
  .math-chat-copy .katex-html { white-space: nowrap; }
`;

export async function copyRenderedContent(element: HTMLElement | null, fallbackMarkdown: string) {
  const normalizedMarkdown = normalizeMathMarkdown(fallbackMarkdown);
  const plainText = element ? getPlainText(element) : stripMarkdown(normalizedMarkdown);

  if (!element || !("ClipboardItem" in window) || !navigator.clipboard?.write) {
    await navigator.clipboard.writeText(plainText);
    return;
  }

  const html = createClipboardHtml(element);

  try {
    await withTimeout(
      navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ]),
      1500
    );
  } catch {
    await navigator.clipboard.writeText(plainText);
  }
}

export function writeRenderedSelectionToClipboard(
  event: ClipboardEvent,
  root: HTMLElement | null,
  fallbackMarkdown: string
) {
  if (!root || !event.clipboardData) return false;

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !isSelectionInside(root, selection)) {
    return false;
  }

  const container = document.createElement("div");
  for (let index = 0; index < selection.rangeCount; index += 1) {
    container.append(selection.getRangeAt(index).cloneContents());
  }

  const html = createClipboardHtml(container);
  const plainText = cleanupPlainText(selection.toString()) || stripMarkdown(normalizeMathMarkdown(fallbackMarkdown));

  event.preventDefault();
  event.clipboardData.setData("text/html", html);
  event.clipboardData.setData("text/plain", plainText);
  return true;
}

function createClipboardHtml(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;
  trimUiOnlyAttributes(clone);
  inlineKatexStyles(element, clone);

  return [
    "<!doctype html>",
    "<html>",
    "<head>",
    '<meta charset="utf-8">',
    `<link rel="stylesheet" href="${KATEX_CSS_URL}">`,
    `<style>${CLIPBOARD_CSS}</style>`,
    "</head>",
    "<body>",
    `<div class="math-chat-copy">${clone.innerHTML}</div>`,
    "</body>",
    "</html>",
  ].join("");
}

function unwrapHiddenMath(root: HTMLElement) {
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

    if (!isKatexNode(node)) {
      node.removeAttribute("aria-hidden");
      node.removeAttribute("style");
    }
  });
}

function isKatexNode(node: Element): boolean {
  return Boolean(
    node.closest(".katex, .katex-display") ||
    node.classList.contains("katex") ||
    node.classList.contains("katex-display")
  );
}

function inlineKatexStyles(source: HTMLElement, clone: HTMLElement) {
  const sourceNodes = [source, ...Array.from(source.querySelectorAll("*"))];
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll("*"))];

  sourceNodes.forEach((sourceNode, index) => {
    const cloneNode = cloneNodes[index];

    if (!cloneNode || !isKatexNode(sourceNode) || !isStylableElement(cloneNode)) {
      return;
    }

    const computedStyle = window.getComputedStyle(sourceNode);

    for (const property of KATEX_COPY_STYLE_PROPERTIES) {
      cloneNode.style.setProperty(property, computedStyle.getPropertyValue(property));
    }
  });
}

function isStylableElement(node: Element): node is HTMLElement | SVGElement {
  return node instanceof HTMLElement || node instanceof SVGElement;
}

function isSelectionInside(root: HTMLElement, selection: Selection) {
  const anchorNode = selection.anchorNode;
  const focusNode = selection.focusNode;

  return Boolean(
    anchorNode &&
    focusNode &&
    root.contains(anchorNode) &&
    root.contains(focusNode)
  );
}

function getPlainText(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;

  unwrapHiddenMath(clone);
  clone.querySelectorAll("[data-copy-ui]").forEach((node) => {
    node.remove();
  });

  clone.querySelectorAll("br").forEach((br) => {
    br.replaceWith("\n");
  });

  clone.querySelectorAll("tr").forEach((row) => {
    const cells = Array.from(row.querySelectorAll("th, td")).map((cell) =>
      collapseWhitespace(cell.textContent ?? "")
    );
    row.replaceWith(`${cells.join("\t")}\n`);
  });

  clone.querySelectorAll("li").forEach((item) => {
    item.prepend("- ");
  });

  clone.querySelectorAll("*").forEach((node) => {
    if (BLOCK_TAGS.has(node.tagName)) {
      node.append("\n");
    }
  });

  return cleanupPlainText(clone.textContent ?? "");
}

function stripMarkdown(markdown: string): string {
  return cleanupPlainText(
    STRIP_MARKDOWN_PATTERNS.reduce(
      (value, [pattern, replacement]) => value.replace(pattern, replacement),
      markdown
    )
  );
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanupPlainText(value: string): string {
  return value
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error("Clipboard write timed out"));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}
