"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import renderMathInElement from "katex/contrib/auto-render";
import { downloadDocx, generateDocx } from "./docx-generator";
import type { TestPaper, TestQuestion } from "./test-paper";
import { parseTestPaper } from "./test-paper";

type PdfVariant = "questions" | "answers";

interface ExportTestPdfOptions {
  variant: PdfVariant;
  title?: string;
}

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const PDF_SCALE = 2;
const PAGE_PADDING_Y = 56;

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
    renderMath(element);
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
    renderMath(element);
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

function renderMath(element: HTMLElement) {
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
