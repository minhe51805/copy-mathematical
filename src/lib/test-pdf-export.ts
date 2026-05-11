"use client";

import { downloadDocx, generateDocx } from "./docx-generator";
import type { TestPaper, TestQuestion } from "./test-paper";
import { parseTestPaper } from "./test-paper";

type RenderMathFn = (
  element: HTMLElement,
  options?: {
    delimiters?: Array<{ left: string; right: string; display: boolean }>;
    throwOnError?: boolean;
    strict?: string;
  }
) => void;
type JsPdfCtor = typeof import("jspdf").jsPDF;
type Html2Canvas = typeof import("html2canvas-pro").default;

let renderMathPromise: Promise<RenderMathFn> | null = null;
function loadRenderMath() {
  if (!renderMathPromise) {
    renderMathPromise = import("katex/contrib/auto-render").then(
      (module) => (module as unknown as { default: RenderMathFn }).default
    );
  }
  return renderMathPromise;
}

let pdfLibsPromise: Promise<{ jsPDF: JsPdfCtor; html2canvas: Html2Canvas }> | null = null;
function loadPdfLibs() {
  if (!pdfLibsPromise) {
    pdfLibsPromise = Promise.all([
      import("jspdf"),
      import("html2canvas-pro"),
    ]).then(([jspdfModule, html2canvasModule]) => ({
      jsPDF: jspdfModule.jsPDF,
      html2canvas: html2canvasModule.default,
    }));
  }
  return pdfLibsPromise;
}

const MODERN_COLOR_FUNCTION_PATTERN = /\b(?:oklab|oklch|lab|lch|color)\s*\(/i;

const COLOR_FALLBACKS: Record<string, string> = {
  color: "#141413",
  backgroundColor: "#ffffff",
  borderTopColor: "#e5e5e5",
  borderRightColor: "#e5e5e5",
  borderBottomColor: "#e5e5e5",
  borderLeftColor: "#e5e5e5",
  outlineColor: "#e5e5e5",
  textDecorationColor: "#141413",
  fill: "#141413",
  stroke: "#141413",
  caretColor: "#141413",
  columnRuleColor: "#e5e5e5",
};

const STRIPPABLE_PROPS = ["backgroundImage", "boxShadow", "textShadow", "filter"] as const;

function neutralizeModernColors(root: HTMLElement) {
  const context = document.createElement("canvas").getContext("2d");

  const coerce = (value: string): string | null => {
    if (!context) return null;
    try {
      context.fillStyle = "#000";
      context.fillStyle = value;
      const normalized = context.fillStyle;
      if (typeof normalized !== "string") return null;
      return MODERN_COLOR_FUNCTION_PATTERN.test(normalized) ? null : normalized;
    } catch {
      return null;
    }
  };

  const setKebab = (element: HTMLElement, prop: string, value: string) => {
    element.style.setProperty(prop.replace(/([A-Z])/g, "-$1").toLowerCase(), value);
  };

  const elements: HTMLElement[] = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

  for (const element of elements) {
    const computed = window.getComputedStyle(element);

    for (const [prop, fallback] of Object.entries(COLOR_FALLBACKS)) {
      const value = computed[prop as keyof CSSStyleDeclaration] as string | undefined;
      if (!value || !MODERN_COLOR_FUNCTION_PATTERN.test(value)) continue;
      const coerced = coerce(value);
      setKebab(element, prop, coerced ?? fallback);
    }

    for (const prop of STRIPPABLE_PROPS) {
      const value = computed[prop] as string | undefined;
      if (value && MODERN_COLOR_FUNCTION_PATTERN.test(value)) {
        setKebab(element, prop, "none");
      }
    }
  }
}

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const PDF_SCALE = 2;
const PAGE_PADDING_Y = 56;

const PREVIEW_PDF_CSS = `
  .preview-pdf-root {
    --background: 0 0% 100%;
    --foreground: 30 3% 12%;
    --card: 0 0% 100%;
    --card-foreground: 30 3% 12%;
    --popover: 0 0% 100%;
    --popover-foreground: 30 3% 12%;
    --primary: 30 3% 12%;
    --primary-foreground: 0 0% 100%;
    --secondary: 45 31% 97%;
    --secondary-foreground: 30 3% 12%;
    --muted: 45 18% 93%;
    --muted-foreground: 43 3% 30%;
    --accent: 42 19% 91%;
    --accent-foreground: 30 3% 12%;
    --border: 30 3% 12%;
    --input: 30 3% 12%;
    --ring: 15 63% 60%;
    --terracotta: 15 63% 60%;
    --terracotta-foreground: 0 0% 100%;
    --shadow-sm: none;
    --shadow-md: none;
    --shadow-lg: none;

    width: ${A4_WIDTH_PX}px;
    padding: 56px 58px;
    background: #ffffff;
    color: #141413;
    font-family: "Times New Roman", Times, "Cambria Math", serif;
    font-size: 16px;
    line-height: 1.55;
  }

  .preview-pdf-root * {
    box-sizing: border-box;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  .preview-pdf-root .katex,
  .preview-pdf-root .katex * {
    box-sizing: content-box;
  }

  .preview-pdf-root h1,
  .preview-pdf-root h2,
  .preview-pdf-root h3,
  .preview-pdf-root h4 {
    font-family: "Times New Roman", Times, serif;
    color: #141413;
  }

  .preview-pdf-root h1 { font-size: 24px; margin: 0 0 14px; font-weight: 700; }
  .preview-pdf-root h2 { font-size: 20px; margin: 18px 0 10px; font-weight: 700; }
  .preview-pdf-root h3 { font-size: 17px; margin: 14px 0 8px; font-weight: 700; }
  .preview-pdf-root p { margin: 0 0 10px; }
  .preview-pdf-root ul,
  .preview-pdf-root ol { margin: 0 0 10px 24px; padding: 0; }
  .preview-pdf-root li { margin: 0 0 4px; }
  .preview-pdf-root table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
  }
  .preview-pdf-root th,
  .preview-pdf-root td {
    border: 1px solid #d4d4d4;
    padding: 6px 10px;
    text-align: left;
    vertical-align: top;
  }
  .preview-pdf-root code {
    font-family: "Cascadia Code", Consolas, monospace;
    font-size: 0.92em;
    background: #f5f5f4;
    padding: 1px 4px;
    border-radius: 4px;
  }
  .preview-pdf-root pre {
    background: #f5f5f4;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    padding: 10px 12px;
    overflow: visible;
    white-space: pre-wrap;
  }
  .preview-pdf-root blockquote {
    border-left: 3px solid #d4d4d4;
    margin: 0 0 10px;
    padding: 4px 12px;
    color: #4a4a47;
  }
  .preview-pdf-root .katex-display {
    margin: 8px 0;
    text-align: center;
    overflow: visible;
  }
`;

function createPreviewPdfWrapper(source: HTMLElement) {
  const clone = source.cloneNode(true) as HTMLElement;

  clone.querySelectorAll("[data-copy-ui]").forEach((node) => node.remove());
  clone.querySelectorAll("button").forEach((node) => node.remove());

  clone.removeAttribute("class");
  clone.removeAttribute("style");

  const wrapper = document.createElement("div");
  wrapper.className = "preview-pdf-root";
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  wrapper.style.zIndex = "-1";

  const style = document.createElement("style");
  style.textContent = PREVIEW_PDF_CSS;
  wrapper.appendChild(style);
  wrapper.appendChild(clone);

  return wrapper;
}

export async function exportElementAsPdf(element: HTMLElement | null, filename: string) {
  if (!element) {
    throw new Error("Không tìm thấy nội dung để xuất PDF.");
  }

  const { jsPDF, html2canvas } = await loadPdfLibs();
  const wrapper = createPreviewPdfWrapper(element);
  document.body.appendChild(wrapper);

  try {
    await waitForFonts();
    await waitForAnimationFrame();

    const canvas = await html2canvas(wrapper, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: A4_WIDTH_PX,
      onclone: (_doc, clonedElement) => {
        neutralizeModernColors(clonedElement as HTMLElement);
      },
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
      compress: true,
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    const image = canvas.toDataURL("image/jpeg", 0.95);

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(image, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(image, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } finally {
    wrapper.remove();
  }
}

type PdfVariant = "questions" | "answers";

interface ExportTestPdfOptions {
  variant: PdfVariant;
  title?: string;
}

export async function exportTestPdf(content: string, options: ExportTestPdfOptions) {
  const paper = parseTestPaper(content, options.title);
  if (!paper.questions.length) {
    throw new Error("Không tìm thấy câu hỏi để xuất PDF.");
  }

  const title = options.variant === "questions" ? "ĐỀ KIỂM TRA" : "ĐÁP ÁN CHI TIẾT";
  const filename = options.variant === "questions" ? "de-kiem-tra.pdf" : "dap-an-chi-tiet.pdf";
  const element = createPdfElement(paper, options.variant, title);

  document.body.appendChild(element);

  try {
    await renderMath(element);
    await waitForMathLayout();
    paginatePdfElement(element);
    await waitForMathLayout();

    await downloadElementAsPdf(element, filename);
  } finally {
    element.remove();
  }
}

export async function exportTestWord(content: string, options: ExportTestPdfOptions) {
  const paper = parseTestPaper(content, options.title);
  if (!paper.questions.length) {
    throw new Error("Không tìm thấy câu hỏi để xuất Word.");
  }

  const title = options.variant === "questions" ? "ĐỀ KIỂM TRA" : "ĐÁP ÁN CHI TIẾT";
  const filename = options.variant === "questions" ? "de-kiem-tra.doc" : "dap-an-chi-tiet.doc";
  const element = createPdfElement(paper, options.variant, title);

  document.body.appendChild(element);

  try {
    await renderMath(element);
    await waitForMathLayout();
    const renderedPaper = element.querySelector<HTMLElement>(".pdf-measure");
    const blob = await generateDocx("", title, renderedPaper);
    downloadDocx(blob, filename);
  } finally {
    element.remove();
  }
}

function createPdfElement(paper: TestPaper, variant: PdfVariant, title: string) {
  const wrapper = document.createElement("div");
  wrapper.className = "test-pdf-render-root";
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  wrapper.style.width = `${A4_WIDTH_PX}px`;
  wrapper.style.background = "#ffffff";
  wrapper.style.color = "#141413";
  wrapper.style.zIndex = "-1";
  wrapper.innerHTML = `
    <style>${PDF_CSS}</style>
    <main class="paper pdf-measure">
      <header class="paper-header">
        <div class="paper-info">
          <span>Họ và tên: ................................................</span>
          <span>Lớp: ........................</span>
        </div>
        <h1>${escapeHtml(title)}</h1>
        <p class="paper-subtitle">${variant === "questions" ? "Khoanh tròn đáp án đúng nhất." : "Dùng để đối chiếu và chữa bài."}</p>
      </header>
      ${variant === "questions" ? buildQuestionPaperBody(paper) : buildAnswerPaperBody(paper)}
    </main>
  `;

  return wrapper;
}

function buildQuestionPaperBody(paper: TestPaper) {
  return paper.questions.map((question, index) => `
    <section class="question">
      <h2>Câu ${index + 1}</h2>
      <div class="question-body">${formatRichText(question.body || removeQuestionPrefix(question.title))}</div>
      ${buildOptionsHtml(question)}
    </section>
  `).join("");
}

function buildAnswerPaperBody(paper: TestPaper) {
  return paper.questions.map((question, index) => `
    <section class="question answer">
      <h2>Câu ${index + 1}</h2>
      <div class="answer-line">
        <span>Đáp án</span>
        <strong>${escapeHtml(question.answer || "Chưa xác định")}</strong>
      </div>
      <div class="question-body">${formatRichText(question.body || removeQuestionPrefix(question.title))}</div>
      ${buildOptionsHtml(question)}
      <div class="solution">
        <h3>Lời giải chi tiết</h3>
        ${formatRichText(question.solution || question.raw)}
      </div>
    </section>
  `).join("");
}

function buildOptionsHtml(question: TestQuestion) {
  if (!question.options.length) return "";
  const rows = [];

  for (let index = 0; index < question.options.length; index += 2) {
    const left = question.options[index];
    const right = question.options[index + 1];
    rows.push(`
      <tr>
        <td>${left ? buildOptionHtml(left) : ""}</td>
        <td>${right ? buildOptionHtml(right) : ""}</td>
      </tr>
    `);
  }

  return `
    <table class="options">
      <tbody>${rows.join("")}</tbody>
    </table>
  `;
}

function buildOptionHtml(option: TestQuestion["options"][number]) {
  return `
    <div class="option">
      <span class="option-label">${option.label}.</span>
      <div class="option-text">${formatRichText(option.text, "option")}</div>
    </div>
  `;
}

function removeQuestionPrefix(value: string) {
  return value.replace(/^Câu\s*\d+\s*[:.)\-–—]?\s*/i, "");
}

function formatRichText(value: string, context: "text" | "option" = "text") {
  const safe = escapeHtml(prepareMathText(value || "", context));
  const withBasicMarkdown = safe
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br />");

  return `<p>${withBasicMarkdown}</p>`;
}

function paginatePdfElement(root: HTMLElement) {
  const measure = root.querySelector<HTMLElement>(".pdf-measure");
  if (!measure) return;

  const header = measure.querySelector<HTMLElement>(".paper-header");
  const questions = Array.from(measure.querySelectorAll<HTMLElement>(".question"));
  const pagesRoot = document.createElement("div");
  pagesRoot.className = "pdf-pages";
  root.appendChild(pagesRoot);

  let page = createPage();
  let body = page.querySelector<HTMLElement>(".page-body")!;
  pagesRoot.appendChild(page);

  let remainingHeight = getPageBodyHeight();
  if (header) {
    body.appendChild(header);
    remainingHeight -= getOuterHeight(header);
  }

  questions.forEach((question) => {
    const questionHeight = getOuterHeight(question);
    const shouldStartNewPage = body.children.length > 0 && questionHeight > remainingHeight;

    if (shouldStartNewPage) {
      page = createPage();
      body = page.querySelector<HTMLElement>(".page-body")!;
      pagesRoot.appendChild(page);
      remainingHeight = getPageBodyHeight();
    }

    body.appendChild(question);
    remainingHeight -= questionHeight;
  });

  measure.remove();
}

function getOuterHeight(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  return Math.ceil(
    element.getBoundingClientRect().height +
    Number.parseFloat(style.marginTop || "0") +
    Number.parseFloat(style.marginBottom || "0")
  );
}

function createPage() {
  const page = document.createElement("section");
  page.className = "pdf-page";
  page.innerHTML = '<div class="page-body"></div>';
  return page;
}

function getPageBodyHeight() {
  return A4_HEIGHT_PX - PAGE_PADDING_Y * 2;
}

function repairLatexSpacing(value: string) {
  return value
    .replace(/\\(int|iint|iiint|oint|sum|prod|lim)(?=[A-Za-z])/g, "\\$1 ")
    .replace(/\\vec\s*([A-Za-z])/g, "\\vec{$1}");
}

function prepareMathText(value: string, context: "text" | "option") {
  const repaired = repairLatexSpacing(value);

  if (hasMathDelimiters(repaired)) {
    return repaired;
  }

  if (context === "option" && hasLatexSyntax(repaired)) {
    return `$${repaired}$`;
  }

  return wrapLooseLatexSegments(repaired);
}

function hasMathDelimiters(value: string) {
  return /(?:\$\$?[^$]+\$\$?|\\\(|\\\[)/.test(value);
}

function hasLatexSyntax(value: string) {
  return /\\(?:frac|sqrt|int|iint|iiint|oint|sum|prod|lim|vec|left|right|sin|cos|tan|ln|log|cdot|times|le|ge|neq|ne|infty|pi|alpha|beta|theta|Delta|nabla|partial)\b/.test(value);
}

function wrapLooseLatexSegments(value: string) {
  let output = value;
  const commandPattern = /\\(?:frac|sqrt|int|iint|iiint|oint|sum|prod|lim|vec|left|right|sin|cos|tan|ln|log|cdot|times|le|ge|neq|ne|infty|pi|alpha|beta|theta|Delta|nabla|partial)\b/g;
  let match: RegExpExecArray | null;
  let offset = 0;
  let lastWrappedEnd = 0;

  while ((match = commandPattern.exec(value)) !== null) {
    const start = Math.max(0, match.index - inferFormulaPrefixLength(value.slice(0, match.index)));
    const end = inferFormulaEnd(value, match.index);
    const rawFormula = value.slice(start, end).trim();

    if (start < lastWrappedEnd) continue;
    if (!rawFormula || hasMathDelimiters(rawFormula)) continue;

    const adjustedStart = start + offset;
    const adjustedEnd = end + offset;
    output = `${output.slice(0, adjustedStart)}$${rawFormula}$${output.slice(adjustedEnd)}`;
    offset += 2;
    lastWrappedEnd = end;
  }

  return output;
}

function inferFormulaPrefixLength(prefix: string) {
  const match = prefix.match(/(?:^|\s)([A-Za-z]\s*=\s*)$/);
  return match?.[1]?.length ?? 0;
}

function inferFormulaEnd(value: string, commandIndex: number) {
  const tail = value.slice(commandIndex);
  const stopWords = [
    " với ",
    " voi ",
    " là ",
    " la ",
    " hướng ",
    " huong ",
    " qua ",
    " trên ",
    " tren ",
    " trong ",
  ];
  const punctuationIndex = tail.search(/[.;:]/);
  const stopWordIndex = stopWords
    .map((word) => tail.toLowerCase().indexOf(word))
    .filter((index) => index > 0)
    .sort((a, b) => a - b)[0];
  const endOffset = Math.min(
    punctuationIndex > 0 ? punctuationIndex : tail.length,
    stopWordIndex ?? tail.length
  );

  return commandIndex + endOffset;
}

async function renderMath(element: HTMLElement) {
  const renderMathInElement = await loadRenderMath();
  renderMathInElement(element, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
    ],
    throwOnError: false,
    strict: "ignore",
  });
}

async function downloadElementAsPdf(element: HTMLElement, filename: string) {
  const pages = Array.from(element.querySelectorAll<HTMLElement>(".pdf-page"));
  if (!pages.length) {
    throw new Error("Không tạo được trang PDF.");
  }

  const { jsPDF, html2canvas } = await loadPdfLibs();

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (const [index, page] of pages.entries()) {
    const canvas = await html2canvas(page, {
      backgroundColor: "#ffffff",
      scale: PDF_SCALE,
      useCORS: true,
      logging: false,
      windowWidth: A4_WIDTH_PX,
      windowHeight: A4_HEIGHT_PX,
      onclone: (_doc, clonedElement) => {
        neutralizeModernColors(clonedElement as HTMLElement);
      },
    });
    const image = canvas.toDataURL("image/jpeg", 0.95);

    if (index > 0) {
      pdf.addPage();
    }
    pdf.addImage(image, "JPEG", 0, 0, pageWidth, pageHeight);
  }

  pdf.save(filename);
}

async function waitForFonts() {
  if ("fonts" in document) {
    await document.fonts.ready;
  }
}

async function waitForMathLayout() {
  await waitForFonts();
  await waitForAnimationFrame();
  await waitForFonts();
  await waitForAnimationFrame();
}

function waitForAnimationFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PDF_CSS = `
  .test-pdf-render-root,
  .test-pdf-render-root * {
    box-sizing: border-box;
  }

  .test-pdf-render-root .katex,
  .test-pdf-render-root .katex * {
    box-sizing: content-box;
  }

  .paper,
  .pdf-page {
    width: 794px;
    min-height: 1123px;
    padding: 56px 58px;
    background: #ffffff;
    color: #141413;
    font-family: "Times New Roman", Times, "Cambria Math", serif;
    font-size: 16px;
    line-height: 1.55;
  }

  .pdf-page {
    height: 1123px;
    min-height: 1123px;
    overflow: hidden;
  }

  .page-body {
    height: 1011px;
  }

  .pdf-measure {
    min-height: auto;
  }

  .paper-header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    text-align: center;
  }

  .paper-info {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 18px;
    color: #3d3d3a;
    font-family: "Times New Roman", Times, serif;
    font-size: 13px;
    text-align: left;
  }

  h1 {
    margin: 0;
    color: #141413;
    font-family: "Times New Roman", Times, serif;
    font-size: 30px;
    font-weight: 600;
    line-height: 1.18;
    letter-spacing: 0;
  }

  .paper-subtitle {
    margin: 8px 0 0;
    color: #73726c;
    font-family: "Times New Roman", Times, serif;
    font-size: 13px;
  }

  .question {
    break-inside: avoid;
    margin: 0 0 20px;
    padding: 0 0 18px;
  }

  .question:last-child {
    border-bottom: 0;
  }

  h2 {
    margin: 0 0 8px;
    font-family: "Times New Roman", Times, serif;
    font-size: 17px;
    font-weight: 700;
  }

  .question-body p,
  .solution p {
    margin: 0 0 8px;
  }

  .options {
    width: 100%;
    margin: 12px 0 0;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .options td {
    width: 50%;
    padding: 8px 28px 12px 0;
    vertical-align: middle;
    overflow: visible;
  }

  .option {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr);
    align-items: center;
    gap: 6px;
    min-width: 0;
    min-height: 34px;
    break-inside: avoid;
    overflow: visible;
  }

  .option-label {
    font-weight: 600;
    line-height: 1.4;
  }

  .option-text {
    min-width: 0;
    overflow: visible;
    overflow-wrap: anywhere;
    line-height: 2;
  }

  .option-text p {
    margin: 0;
    overflow: visible;
  }

  .answer-line {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    padding: 6px 11px;
    border: 1px solid rgba(217, 119, 87, 0.35);
    border-radius: 8px;
    background: rgba(217, 119, 87, 0.08);
    font-family: "Times New Roman", Times, serif;
    font-size: 13px;
  }

  .answer-line strong {
    color: #d97757;
    font-size: 16px;
  }

  .solution {
    margin-top: 12px;
    padding: 12px 14px;
    border: 1px solid rgba(31, 30, 29, 0.15);
    border-radius: 10px;
    background: #faf9f5;
  }

  .solution h3 {
    margin: 0 0 8px;
    font-family: "Times New Roman", Times, serif;
    font-size: 14px;
  }

  .katex {
    font-size: 1.04em;
    line-height: normal;
    font-family: KaTeX_Main, "Times New Roman", serif;
    text-rendering: geometricPrecision;
  }

  .katex .mathnormal {
    font-family: KaTeX_Math;
  }

  .katex .mathit,
  .katex .mathbf,
  .katex .mainrm {
    font-family: KaTeX_Main;
  }

  .katex .sqrt > .sqrt-sign,
  .katex .delimsizing.size1 {
    font-family: KaTeX_Size1;
  }

  .katex .delimsizing.size2 {
    font-family: KaTeX_Size2;
  }

  .katex .delimsizing.size3 {
    font-family: KaTeX_Size3;
  }

  .katex .delimsizing.size4 {
    font-family: KaTeX_Size4;
  }

  .katex,
  .katex-html,
  .katex .base,
  .katex .strut,
  .katex .vlist-t,
  .katex .vlist-r,
  .katex .vlist {
    overflow: visible;
  }

  .katex-display {
    margin: 9px 0;
    overflow: visible;
    text-align: center;
  }
`;
