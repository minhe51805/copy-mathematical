"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
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
      <pre className={cn("mb-3 overflow-x-auto rounded-xl p-3 text-sm last:mb-0", mutedBg)}>
        {children}
      </pre>
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

export function MathRenderer({ content, className, isUser = false }: MathRendererProps) {
  const normalizedContent = normalizeMathMarkdown(content);

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={getMarkdownComponents(isUser)}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
