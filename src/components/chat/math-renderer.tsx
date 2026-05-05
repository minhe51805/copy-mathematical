"use client";

import { type ReactNode, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyRenderedContent } from "@/lib/clipboard";
import { normalizeMathMarkdown } from "@/lib/math-utils";
import { cn } from "@/lib/utils";

interface MathRendererProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

function getMarkdownComponents(isUser: boolean): Components {
  const subtleText = isUser ? "text-white/75" : "text-muted-foreground";
  const border = isUser ? "border-white/15" : "border-border";
  const mutedBg = isUser ? "bg-white/10" : "bg-muted";

  return {
    h1: ({ children }) => (
      <h1 className="mb-3 mt-5 text-xl font-semibold leading-tight first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-5 text-lg font-semibold leading-tight first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-4 text-base font-semibold leading-tight first:mt-0">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-3 whitespace-pre-wrap last:mb-0">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="mb-3 ml-5 list-disc space-y-1 last:mb-0">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 ml-5 list-decimal space-y-1 last:mb-0">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="pl-1">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className={cn("mb-3 border-l-2 pl-3 italic last:mb-0", border, subtleText)}>
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className={cn("my-4 overflow-x-auto rounded-xl border", border)}>
        <table className="w-full border-collapse text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead className={mutedBg}>{children}</thead>,
    tbody: ({ children }) => (
      <tbody className={cn("divide-y", isUser ? "divide-white/10" : "divide-border")}>
        {children}
      </tbody>
    ),
    tr: ({ children }) => <tr>{children}</tr>,
    th: ({ children }) => (
      <th className={cn("border-r px-3 py-2 text-left font-semibold last:border-r-0", border)}>
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className={cn("border-r px-3 py-2 align-top last:border-r-0", border)}>
        {children}
      </td>
    ),
    pre: ({ children }) => (
      <CopyableMarkdownBlock
        fallbackText={getNodeText(children)}
        isUser={isUser}
        label="Terminal"
        className="mb-3 last:mb-0"
        contentClassName={cn("overflow-x-auto rounded-xl p-3 text-sm", mutedBg)}
      >
        <pre>
          {children}
        </pre>
      </CopyableMarkdownBlock>
    ),
    code: ({ children, className, ...props }) => {
      const isBlock = className?.includes("language-");
      return (
        <code
          className={cn(
            isBlock
              ? "block font-mono"
              : "rounded-md px-1.5 py-0.5 font-mono text-[0.9em]",
            !isBlock && mutedBg,
            className
          )}
          {...props}
        >
          {children}
        </code>
      );
    },
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={cn("underline underline-offset-2", isUser ? "text-white" : "text-foreground")}
      >
        {children}
      </a>
    ),
    hr: () => <hr className={cn("my-5", border)} />,
  };
}

function MarkdownContent({ content, isUser }: { content: string; isUser: boolean }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={getMarkdownComponents(isUser)}
    >
      {content}
    </ReactMarkdown>
  );
}

export function MathRenderer({ content, className, isUser = false }: MathRendererProps) {
  const normalizedContent = normalizeMathMarkdown(content);
  const segments = splitCopyableQuestionSections(normalizedContent);

  return (
    <div className={className}>
      {segments.map((segment, index) => (
        segment.copyable ? (
          <CopyableMarkdownBlock
            key={`${segment.type}-${index}`}
            fallbackText={segment.content}
            isUser={isUser}
            label={segment.label}
            className="my-4 first:mt-0 last:mb-0"
          >
            <MarkdownContent content={segment.content} isUser={isUser} />
          </CopyableMarkdownBlock>
        ) : (
          <MarkdownContent
            key={`${segment.type}-${index}`}
            content={segment.content}
            isUser={isUser}
          />
        )
      ))}
    </div>
  );
}

interface CopyableSegment {
  type: "text" | "question";
  content: string;
  copyable: boolean;
  label?: string;
}

function CopyableMarkdownBlock({
  children,
  fallbackText,
  isUser,
  label = "Copy block",
  className,
  contentClassName,
}: {
  children: ReactNode;
  fallbackText: string;
  isUser: boolean;
  label?: string;
  className?: string;
  contentClassName?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = async () => {
    if (isCopying) return;

    setIsCopying(true);
    try {
      await copyRenderedContent(contentRef.current, fallbackText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border",
        isUser ? "border-white/15 bg-black/10" : "border-border bg-card",
        className
      )}
    >
      <div
        data-copy-ui="true"
        className={cn(
          "flex items-center justify-between gap-3 border-b px-3 py-2",
          isUser ? "border-white/10 bg-white/10" : "border-border bg-muted/60"
        )}
      >
        <span className={cn("truncate text-xs font-medium", isUser ? "text-white/65" : "text-muted-foreground")}>
          {label}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 text-xs",
            isUser ? "text-white/75 hover:bg-white/10 hover:text-white" : "text-muted-foreground"
          )}
          onClick={handleCopy}
          disabled={isCopying}
          aria-label="Sao chép riêng phần này"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              Đã chép
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Sao chép
            </>
          )}
        </Button>
      </div>
      <div
        ref={contentRef}
        className={cn(
          "px-4 py-3",
          isUser ? "text-white" : "text-foreground",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

function splitCopyableQuestionSections(content: string): CopyableSegment[] {
  const lines = content.split("\n");
  const segments: CopyableSegment[] = [];
  let normalBuffer: string[] = [];
  let questionBuffer: string[] | null = null;

  const flushNormal = () => {
    const normalContent = normalBuffer.join("\n").trim();
    if (normalContent) {
      segments.push({
        type: "text",
        content: normalContent,
        copyable: false,
      });
    }
    normalBuffer = [];
  };

  const flushQuestion = () => {
    if (!questionBuffer) return;
    const questionContent = trimSectionDelimiters(questionBuffer.join("\n"));
    if (questionContent) {
      segments.push({
        type: "question",
        content: questionContent,
        copyable: true,
        label: inferSectionLabel(questionContent),
      });
    }
    questionBuffer = null;
  };

  for (const line of lines) {
    if (isQuestionSectionStart(line)) {
      flushQuestion();
      flushNormal();
      questionBuffer = [line];
      continue;
    }

    if (questionBuffer) {
      questionBuffer.push(line);
    } else {
      normalBuffer.push(line);
    }
  }

  flushQuestion();
  flushNormal();

  return segments.length ? segments : [{
    type: "text",
    content,
    copyable: false,
  }];
}

function isQuestionSectionStart(line: string) {
  return /^\s*(?:#{1,6}\s*)?(?:[*_]{0,2})?(?:câu|cau|bài|bai)\s*\d+[\s.:：-]/i.test(line.trim());
}

function inferSectionLabel(content: string) {
  const firstLine = content
    .split("\n")
    .map((line) => line.replace(/^#{1,6}\s*/, "").replace(/[*_`]/g, "").trim())
    .find(Boolean);

  const match = firstLine?.match(/^(câu|cau|bài|bai)\s*\d+/i);
  return match?.[0] ? `${match[0]} · Sao chép riêng` : "Khối nội dung · Sao chép riêng";
}

function trimSectionDelimiters(content: string) {
  return content
    .replace(/^\s*---+\s*\n/, "")
    .replace(/\n\s*---+\s*$/, "")
    .trim();
}

function getNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join("");
  }

  if (node && typeof node === "object" && "props" in node) {
    const props = node.props as { children?: ReactNode };
    return getNodeText(props.children);
  }

  return "";
}
