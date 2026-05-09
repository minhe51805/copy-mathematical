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
const MATHTYPE_FONT_STACK = '"Times New Roman", "Cambria Math", Symbol, "MT Extra", serif';

type RectBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

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
    font-family: "Times New Roman", "Cambria Math", Arial, serif;
    font-size: 15px;
    line-height: 1.65;
    color: #111;
  }
  .math-chat-copy p { margin: 0 0 12px; white-space: pre-wrap; }
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
  .math-chat-copy .katex {
    font-size: 1.08em;
    text-rendering: geometricPrecision;
  }
  .math-chat-copy .katex * {
    box-sizing: content-box;
  }
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
  .math-chat-copy math {
    font-family: ${MATHTYPE_FONT_STACK};
    font-size: 1.08em;
  }
  .math-chat-copy .math-word-inline {
    display: inline;
    vertical-align: middle;
  }
  .math-chat-copy .math-word-display {
    display: block;
    margin: 12px 0;
    text-align: center;
  }
  .math-chat-copy [data-font="mathtype"] math {
    font-family: "Times New Roman", Times, Symbol, "MT Extra", serif;
  }
  .math-chat-copy [data-font="euclid"] math {
    font-family: Euclid, "Euclid Math One", "Euclid Symbol", "Times New Roman", serif;
  }
  .math-chat-copy [data-font="cambria"] math {
    font-family: "Cambria Math", Cambria, "Times New Roman", serif;
  }
`;

export async function copyRenderedContent(element: HTMLElement | null, fallbackMarkdown: string) {
  const normalizedMarkdown = normalizeMathMarkdown(fallbackMarkdown);
  const singleMathml = element ? getSingleMathmlCopyText(element) : "";
  const plainText = singleMathml || (element ? getPlainText(element) : stripMarkdown(normalizedMarkdown));

  if (!element || !("ClipboardItem" in window) || !navigator.clipboard?.write) {
    await navigator.clipboard.writeText(plainText);
    return;
  }

  const html = singleMathml ? createMathTypeClipboardHtml(element) : createClipboardHtml(element);

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

  const selectedMathElement =
    getSingleSelectedMathElement(root, selection) ??
    getSingleVisuallySelectedMathElement(root, selection);
  const container = document.createElement("div");

  if (selectedMathElement) {
    container.append(selectedMathElement.cloneNode(true));
    inlineSelectedKatexStyles(root, container);

    const plainText = getLatexMathPlainText(selectedMathElement);
    event.preventDefault();
    event.clipboardData.setData("text/plain", plainText);
    void copyRenderedContent(container, plainText);
    return true;
  } else {
    for (let index = 0; index < selection.rangeCount; index += 1) {
      container.append(selection.getRangeAt(index).cloneContents());
    }
  }

  inlineSelectedKatexStyles(root, container);

  const html = createClipboardHtml(container);
  const plainText = selectedMathElement
    ? getLatexMathPlainText(selectedMathElement)
    : getPlainText(container);
  const fallbackText = stripMarkdown(normalizeMathMarkdown(fallbackMarkdown));

  event.preventDefault();
  event.clipboardData.setData("text/html", html);
  event.clipboardData.setData("text/plain", plainText || fallbackText);
  return true;
}

function createClipboardHtml(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;
  inlineKatexStyles(element, clone);
  trimUiOnlyAttributes(clone);
  preserveSoftLineBreaks(clone);
  // Keep visual KaTeX spans for Word paste. Replacing with MathML makes Word
  // auto-convert formulas into Office Equation objects, which breaks the
  // MathType-like copy workflow users expect from the chat surface.
  prepareKatexForVisualClipboard(clone);

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

function createMathTypeClipboardHtml(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;
  inlineKatexStyles(element, clone);
  trimUiOnlyAttributes(clone);
  preserveSoftLineBreaks(clone);
  replaceKatexWithMathmlForWord(clone);
  prepareKatexForVisualClipboard(clone);

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

function prepareKatexForVisualClipboard(root: HTMLElement) {
  root.querySelectorAll(".katex-mathml").forEach((node) => {
    node.remove();
  });

  root.querySelectorAll<HTMLElement>(".katex, .katex *").forEach((node) => {
    node.style.setProperty("box-sizing", "content-box");
    node.style.setProperty("text-rendering", "geometricPrecision");
    node.removeAttribute("aria-hidden");
  });

  root.querySelectorAll<HTMLElement>(".katex-display").forEach((node) => {
    node.style.setProperty("display", "block");
    node.style.setProperty("margin", "12px 0");
    node.style.setProperty("text-align", "center");
  });

  root.querySelectorAll<HTMLElement>(".katex").forEach((node) => {
    node.setAttribute("data-font", "mathtype");
  });

  root.querySelectorAll<HTMLElement>("math").forEach((node) => {
    node.style.setProperty("font-family", MATHTYPE_FONT_STACK);
  });
}

function replaceKatexWithMathmlForWord(root: HTMLElement) {
  const displayNodes = Array.from(root.querySelectorAll<HTMLElement>(".katex-display"));

  displayNodes.forEach((node) => {
    if (!root.contains(node)) return;

    const math = getMathmlElement(node, "block");
    if (!math) return;

    const wrapper = document.createElement("div");
    wrapper.className = "math-word-display";
    wrapper.style.setProperty("display", "block");
    wrapper.style.setProperty("margin", "12px 0");
    wrapper.style.setProperty("text-align", "center");
    wrapper.append(math);
    node.replaceWith(wrapper);
  });

  const inlineNodes = Array.from(root.querySelectorAll<HTMLElement>(".katex"))
    .filter((node) => root.contains(node) && !node.closest(".katex-display"));

  inlineNodes.forEach((node) => {
    const math = getMathmlElement(node, "inline");
    if (!math) return;

    const wrapper = document.createElement("span");
    wrapper.className = "math-word-inline";
    wrapper.style.setProperty("display", "inline");
    wrapper.style.setProperty("vertical-align", "middle");
    wrapper.append(math);
    node.replaceWith(wrapper);
  });
}

function preserveSoftLineBreaks(root: HTMLElement) {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent?.includes("\n")) {
        return NodeFilter.FILTER_REJECT;
      }

      const parent = node.parentElement;
      if (parent?.closest("pre, code, .katex, math")) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  textNodes.forEach((textNode) => {
    const parts = textNode.data.split("\n");
    if (parts.length < 2) return;

    const fragment = document.createDocumentFragment();
    parts.forEach((part, index) => {
      if (part) {
        fragment.append(document.createTextNode(part));
      }
      if (index < parts.length - 1) {
        fragment.append(document.createElement("br"));
      }
    });
    textNode.replaceWith(fragment);
  });
}

function getMathmlElement(node: Element, displayMode?: "inline" | "block") {
  const math = node.matches("math")
    ? node
    : node.querySelector(".katex-mathml math");

  if (!math) return null;

  const clone = math.cloneNode(true) as Element;
  const font = getFormulaFont(node);
  clone.setAttribute("xmlns", "http://www.w3.org/1998/Math/MathML");

  if (displayMode) {
    clone.setAttribute("display", displayMode);
  }

  cleanupMathmlForClipboard(clone);
  const fontFamily = getClipboardMathFontFamily(font);
  clone.setAttribute("style", `font-family: ${fontFamily};`);
  return clone;
}

function getFormulaFont(node: Element) {
  return node.closest("[data-font]")?.getAttribute("data-font") ?? "mathtype";
}

function getClipboardMathFontFamily(font: string) {
  switch (font) {
    case "euclid":
      return 'Euclid, "Euclid Math One", "Euclid Symbol", "Times New Roman", serif';
    case "cambria":
      return '"Cambria Math", Cambria, "Times New Roman", serif';
    case "latin-modern":
      return '"Latin Modern Math", "Cambria Math", "STIX Two Math", serif';
    case "stix":
      return '"STIX Two Math", STIXGeneral, "Cambria Math", serif';
    case "xits":
      return '"XITS Math", XITS, "Cambria Math", serif';
    case "noto-serif":
      return '"Noto Serif Math", "Noto Serif", "Cambria Math", serif';
    case "times":
    case "mathtype":
    default:
      return '"Times New Roman", Times, Symbol, "MT Extra", serif';
  }
}

function cleanupMathmlForClipboard(math: Element) {
  math.removeAttribute("class");
  math.removeAttribute("style");
  math.removeAttribute("aria-hidden");
  math.removeAttribute("data-copy-ui");

  math.querySelectorAll("*").forEach((node) => {
    node.removeAttribute("class");
    node.removeAttribute("style");
    node.removeAttribute("aria-hidden");
    node.removeAttribute("data-copy-ui");
  });
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

function getSingleSelectedMathElement(root: HTMLElement, selection: Selection) {
  const anchorMath = getClosestSelectedMathElement(root, selection.anchorNode);
  const focusMath = getClosestSelectedMathElement(root, selection.focusNode);

  if (!anchorMath || !focusMath) return null;
  if (anchorMath === focusMath) return anchorMath;
  if (anchorMath.contains(focusMath)) return anchorMath;
  if (focusMath.contains(anchorMath)) return focusMath;

  return null;
}

function getSingleVisuallySelectedMathElement(root: HTMLElement, selection: Selection) {
  const selectionBounds = getSelectionBounds(selection);
  if (!selectionBounds) return null;

  const selectedMathNodes = getSelectableMathElements(root).filter((node) => {
    if (!selectionIntersectsNode(selection, node)) return false;

    const rect = node.getBoundingClientRect();
    return rectContainsSelection(rect, selectionBounds);
  });

  return selectedMathNodes.length === 1 ? selectedMathNodes[0] : null;
}

function getSelectableMathElements(root: HTMLElement) {
  return [
    ...Array.from(root.querySelectorAll<HTMLElement>(".katex-display")),
    ...Array.from(root.querySelectorAll<HTMLElement>(".katex"))
      .filter((node) => !node.closest(".katex-display")),
  ];
}

function getSelectionBounds(selection: Selection) {
  const rects: DOMRect[] = [];

  for (let index = 0; index < selection.rangeCount; index += 1) {
    rects.push(...Array.from(selection.getRangeAt(index).getClientRects()));
  }

  const visibleRects = rects.filter((rect) => rect.width > 0 && rect.height > 0);
  if (!visibleRects.length) return null;

  const left = Math.min(...visibleRects.map((rect) => rect.left));
  const top = Math.min(...visibleRects.map((rect) => rect.top));
  const right = Math.max(...visibleRects.map((rect) => rect.right));
  const bottom = Math.max(...visibleRects.map((rect) => rect.bottom));

  return { left, top, right, bottom };
}

function selectionIntersectsNode(selection: Selection, node: Node) {
  for (let index = 0; index < selection.rangeCount; index += 1) {
    try {
      if (selection.getRangeAt(index).intersectsNode(node)) {
        return true;
      }
    } catch {
      // Some detached or browser-normalized nodes cannot be checked reliably.
    }
  }

  return false;
}

function rectContainsSelection(container: DOMRect, selectionBounds: RectBounds) {
  const tolerance = 8;

  return (
    selectionBounds.left >= container.left - tolerance &&
    selectionBounds.right <= container.right + tolerance &&
    selectionBounds.top >= container.top - tolerance &&
    selectionBounds.bottom <= container.bottom + tolerance
  );
}

function getClosestSelectedMathElement(root: HTMLElement, node: Node | null) {
  const element = getNodeElement(node);
  if (!element || !root.contains(element)) return null;

  return element.closest<HTMLElement>(".katex-display, .katex");
}

function getNodeElement(node: Node | null) {
  if (!node) return null;
  return node instanceof Element ? node : node.parentElement;
}

function inlineSelectedKatexStyles(sourceRoot: HTMLElement, cloneRoot: HTMLElement) {
  const sourceMathByLatex = new Map<string, HTMLElement[]>();

  sourceRoot.querySelectorAll<HTMLElement>(".katex").forEach((node) => {
    const latex = getKatexLatex(node);
    if (!latex) return;

    const list = sourceMathByLatex.get(latex) ?? [];
    list.push(node);
    sourceMathByLatex.set(latex, list);
  });

  cloneRoot.querySelectorAll<HTMLElement>(".katex").forEach((cloneMath) => {
    const latex = getKatexLatex(cloneMath);
    const sourceMath = latex ? sourceMathByLatex.get(latex)?.[0] : null;

    if (sourceMath) {
      inlineKatexStyles(sourceMath, cloneMath);
    }
  });
}

function getKatexLatex(node: Element) {
  return node
    .querySelector('annotation[encoding="application/x-tex"]')
    ?.textContent
    ?.trim() ?? "";
}

function getLatexMathPlainText(node: Element) {
  const innerMath = node.querySelector(".katex");
  const latex = getKatexLatex(node) || (innerMath ? getKatexLatex(innerMath) : "");

  if (latex) {
    return node.classList.contains("katex-display") ? `$$\n${latex}\n$$` : `$${latex}$`;
  }

  const clone = node.cloneNode(true) as HTMLElement;
  return getPlainText(clone);
}

function getSingleMathmlCopyText(root: HTMLElement) {
  const displayMathNodes = Array.from(root.querySelectorAll<HTMLElement>(".katex-display"));
  const inlineMathNodes = Array.from(root.querySelectorAll<HTMLElement>(".katex"))
    .filter((node) => !node.closest(".katex-display"));
  const mathNodes = [...displayMathNodes, ...inlineMathNodes];

  if (mathNodes.length !== 1) return "";

  const textClone = root.cloneNode(true) as HTMLElement;
  textClone.querySelectorAll("[data-copy-ui], .katex-display, .katex").forEach((node) => {
    node.remove();
  });

  if (cleanupPlainText(textClone.textContent ?? "")) return "";

  return getSerializedMathml(mathNodes[0]);
}

function getSerializedMathml(node: Element) {
  const displayMode = node.closest(".katex-display") || node.classList.contains("katex-display")
    ? "block"
    : "inline";
  const math = getMathmlElement(node, displayMode);

  if (!math) return "";

  return new XMLSerializer().serializeToString(math);
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
