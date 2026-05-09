import { normalizeMathMarkdown } from "./math-utils";

export interface TestOption {
  label: "A" | "B" | "C" | "D";
  text: string;
}

export interface TestQuestion {
  number: number;
  title: string;
  body: string;
  options: TestOption[];
  answer?: string;
  solution?: string;
  raw: string;
}

export interface TestPaper {
  title: string;
  questions: TestQuestion[];
  source: string;
}

const QUESTION_START_RE =
  /^\s*(?:#{1,6}\s*)?(?:[-*]\s*)?(?:[*_`~]{0,2})?\s*(?:câu|cau|bài|bai)\s*(\d{1,3})(?:\s*[:.)\-–—]|\s|$)/i;

const ANSWER_RE = /(?:đáp\s*án|dap\s*an|chọn|chon)\s*[:.]?\s*([A-D])/i;
const SOLUTION_RE = /^\s*(?:#{1,6}\s*)?(?:[*_`~]{0,2})?\s*(?:lời\s*giải|loi\s*giai|giải\s*thích|giai\s*thich|đáp\s*án|dap\s*an|chọn|chon)\b/i;
const OPTION_LINE_RE = /^\s*(?:[-*]\s*)?([A-D])[\.)]\s+(.+)$/i;
const INLINE_OPTION_RE = /(?:^|[\s|])([A-D])[\.)]\s*([^|]+?)(?=(?:\s*\|\s*)?[A-D][\.)]\s|$)/gi;

export function hasTestPaperContent(content: string) {
  const paper = parseTestPaper(content);
  return paper.questions.length >= 2 || paper.questions.some((question) => question.options.length >= 3);
}

export function parseTestPaper(content: string, title = "Đề kiểm tra"): TestPaper {
  const source = normalizeMathMarkdown(content).replace(/\r\n?/g, "\n").trim();
  if (!source) {
    return { title, questions: [], source };
  }

  const lines = source.split("\n");
  const starts: Array<{ index: number; number: number }> = [];

  lines.forEach((line, index) => {
    const match = line.match(QUESTION_START_RE);
    if (match?.[1]) {
      starts.push({ index, number: Number(match[1]) });
    }
  });

  if (!starts.length) {
    return { title, questions: [], source };
  }

  const questions = starts
    .map((start, order) => {
      const endIndex = starts[order + 1]?.index ?? lines.length;
      const block = lines.slice(start.index, endIndex).join("\n").trim();
      return parseQuestionBlock(block, start.number);
    })
    .filter((question): question is TestQuestion => Boolean(question));

  return {
    title: inferPaperTitle(source, title),
    questions,
    source,
  };
}

function parseQuestionBlock(block: string, fallbackNumber: number): TestQuestion | null {
  const lines = block.split("\n").map((line) => line.trimEnd());
  const firstUsefulLine = lines.find((line) => line.trim()) ?? "";
  const number = Number(firstUsefulLine.match(QUESTION_START_RE)?.[1] ?? fallbackNumber);

  if (!Number.isFinite(number)) return null;

  const contentLines = lines.slice(1);
  const options = collectOptions(contentLines);
  const bodyLines = collectQuestionBodyLines(firstUsefulLine, contentLines);
  const solutionLines = collectSolutionLines(contentLines);
  const answer = block.match(ANSWER_RE)?.[1]?.toUpperCase();

  return {
    number,
    title: cleanMarkdown(firstUsefulLine),
    body: cleanSectionText(bodyLines.join("\n")),
    options,
    answer,
    solution: cleanSectionText(solutionLines.join("\n")),
    raw: block,
  };
}

function collectQuestionBodyLines(firstLine: string, lines: string[]) {
  const bodyLines: string[] = [];
  const firstLineBody = firstLine.replace(QUESTION_START_RE, "").trim();

  if (firstLineBody && !ANSWER_RE.test(firstLineBody)) {
    bodyLines.push(firstLineBody);
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (bodyLines.length && bodyLines[bodyLines.length - 1] !== "") {
        bodyLines.push("");
      }
      continue;
    }

    if (isAnswerLine(trimmed) || SOLUTION_RE.test(trimmed) || containsOptionOnly(trimmed)) {
      break;
    }

    const inlineOptionIndex = findInlineOptionIndex(trimmed);
    if (inlineOptionIndex >= 0) {
      const beforeOptions = trimmed.slice(0, inlineOptionIndex).trim();
      if (beforeOptions) {
        bodyLines.push(beforeOptions);
      }
      break;
    }

    bodyLines.push(trimmed);
  }

  return bodyLines;
}

function collectSolutionLines(lines: string[]) {
  const solutionLines: string[] = [];
  let recording = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const startsSolution = isAnswerLine(trimmed) || SOLUTION_RE.test(trimmed);

    if (startsSolution) {
      recording = true;
    }

    if (!recording) continue;
    if (containsOptionOnly(trimmed)) continue;

    solutionLines.push(line);
  }

  return solutionLines;
}

function collectOptions(lines: string[]): TestOption[] {
  const options = new Map<TestOption["label"], string>();

  lines.forEach((line) => {
    const lineMatch = line.match(OPTION_LINE_RE);
    if (lineMatch?.[1] && lineMatch[2]) {
      options.set(lineMatch[1].toUpperCase() as TestOption["label"], cleanSectionText(lineMatch[2]));
      return;
    }

    const inlineMatches = [...line.matchAll(INLINE_OPTION_RE)];
    if (inlineMatches.length >= 2) {
      inlineMatches.forEach((match) => {
        const label = match[1]?.toUpperCase() as TestOption["label"] | undefined;
        const value = match[2]?.trim();
        if (label && value) {
          options.set(label, cleanSectionText(value));
        }
      });
    }
  });

  return (["A", "B", "C", "D"] as const)
    .map((label) => {
      const text = options.get(label);
      return text ? { label, text } : null;
    })
    .filter((option): option is TestOption => Boolean(option));
}

function containsOptionOnly(line: string) {
  if (OPTION_LINE_RE.test(line)) return true;
  return [...line.matchAll(INLINE_OPTION_RE)].length >= 2;
}

function isAnswerLine(line: string) {
  return ANSWER_RE.test(cleanMarkdown(line));
}

function findInlineOptionIndex(line: string) {
  const match = line.match(/\s[A-D][\.)]\s+/);
  return match?.index ?? -1;
}

function inferPaperTitle(source: string, fallback: string) {
  const line = source
    .split("\n")
    .map((item) => cleanMarkdown(item).trim())
    .find((item) =>
      item.length > 6 &&
      !QUESTION_START_RE.test(item) &&
      !/^\d+[\.)]\s/.test(item) &&
      !/^\[?còn\s+tiếp/i.test(item)
    );

  return line?.slice(0, 96) || fallback;
}

function cleanSectionText(value: string) {
  return cleanMarkdown(value)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanMarkdown(value: string) {
  return value
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .trim();
}
