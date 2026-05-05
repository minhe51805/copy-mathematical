"use client";

import { useMemo, useRef, useState } from "react";
import { Braces, Check, Copy, Italic, Plus, Sigma, Type } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { copyRenderedContent, writeRenderedSelectionToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { MathRenderer } from "./math-renderer";

interface FormulaStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (value: FormulaInsertPayload) => void;
}

export type FormulaFont =
  | "katex"
  | "cambria"
  | "latin-modern"
  | "stix"
  | "xits"
  | "noto-serif"
  | "times"
  | "georgia"
  | "arial"
  | "system"
  | "mono";

export interface FormulaInsertPayload {
  markdown: string;
  latex: string;
  font: FormulaFont;
  isItalic: boolean;
  isDisplay: boolean;
}

const DEFAULT_LATEX = "\\int_0^{\\frac{\\pi}{2}} f(x)\\,dx = 0";

const FONT_OPTIONS: Array<{ value: FormulaFont; label: string }> = [
  { value: "katex", label: "KaTeX Math" },
  { value: "cambria", label: "Cambria Math" },
  { value: "latin-modern", label: "Latin Modern Math" },
  { value: "stix", label: "STIX Two Math" },
  { value: "xits", label: "XITS Math" },
  { value: "noto-serif", label: "Noto Serif Math" },
  { value: "times", label: "Times New Roman" },
  { value: "georgia", label: "Georgia" },
  { value: "arial", label: "Arial" },
  { value: "system", label: "System UI" },
  { value: "mono", label: "Consolas" },
];

const SYMBOL_GROUPS = [
  {
    label: "Mẫu",
    icon: Braces,
    items: [
      { label: "Phân số", display: "a⁄b", value: "\\frac{a}{b}" },
      { label: "Căn bậc hai", display: "√x", value: "\\sqrt{x}" },
      { label: "Mũ", display: "x²", value: "x^{2}" },
      { label: "Chỉ số", display: "x₁", value: "x_{1}" },
      { label: "Hệ phương trình", display: "{", value: "\\begin{cases}\nx+y=1\\\\\nx-y=0\n\\end{cases}" },
      { label: "Ma trận", display: "[ ]", value: "\\begin{pmatrix}\na & b\\\\\nc & d\n\\end{pmatrix}" },
    ],
  },
  {
    label: "Giải tích",
    icon: Sigma,
    items: [
      { label: "Tích phân", display: "∫", value: "\\int_a^b f(x)\\,dx" },
      { label: "Tổng", display: "Σ", value: "\\sum_{i=1}^{n} a_i" },
      { label: "Giới hạn", display: "lim", value: "\\lim_{x\\to 0} f(x)" },
      { label: "Đạo hàm", display: "f′", value: "f'(x)" },
      { label: "Vô cực", display: "∞", value: "\\infty" },
      { label: "Suy ra", display: "⇒", value: "\\Rightarrow" },
    ],
  },
  {
    label: "Hình học",
    icon: Type,
    items: [
      { label: "Tam giác", display: "△", value: "\\triangle ABC" },
      { label: "Đồng dạng", display: "∼", value: "\\sim" },
      { label: "Bằng nhau", display: "≅", value: "\\cong" },
      { label: "Góc", display: "∠", value: "\\angle ABC" },
      { label: "Song song", display: "∥", value: "\\parallel" },
      { label: "Vuông góc", display: "⊥", value: "\\perp" },
      { label: "Đoạn thẳng", display: "AB", value: "\\overline{AB}" },
      { label: "Cung", display: "⌢", value: "\\widehat{AB}" },
      { label: "Vector", display: "→u", value: "\\vec{u}" },
      { label: "Độ", display: "°", value: "^{\\circ}" },
    ],
  },
  {
    label: "Quan hệ",
    icon: Plus,
    items: [
      { label: "Khác", display: "≠", value: "\\ne" },
      { label: "Lớn hơn hoặc bằng", display: "≥", value: "\\ge" },
      { label: "Nhỏ hơn hoặc bằng", display: "≤", value: "\\le" },
      { label: "Xấp xỉ", display: "≈", value: "\\approx" },
      { label: "Tương đương", display: "⇔", value: "\\Leftrightarrow" },
      { label: "Thuộc", display: "∈", value: "\\in" },
      { label: "Không thuộc", display: "∉", value: "\\notin" },
      { label: "Tập R", display: "ℝ", value: "\\mathbb{R}" },
    ],
  },
];

export function FormulaStudio({ open, onOpenChange, onInsert }: FormulaStudioProps) {
  const [latex, setLatex] = useState(DEFAULT_LATEX);
  const [font, setFont] = useState<FormulaFont>("katex");
  const [isItalic, setIsItalic] = useState(true);
  const [isDisplay, setIsDisplay] = useState(true);
  const [copied, setCopied] = useState<"rich" | "latex" | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const markdown = useMemo(
    () => buildFormulaMarkdown(latex, isDisplay),
    [latex, isDisplay]
  );

  const insertSnippet = (snippet: string) => {
    const editor = editorRef.current;
    setLatex((current) => {
      if (!editor) return current ? `${current} ${snippet}` : snippet;

      const start = editor.selectionStart ?? current.length;
      const end = editor.selectionEnd ?? current.length;
      const next = `${current.slice(0, start)}${snippet}${current.slice(end)}`;
      const cursor = start + snippet.length;

      window.requestAnimationFrame(() => {
        editor.focus();
        editor.selectionStart = cursor;
        editor.selectionEnd = cursor;
      });

      return next;
    });
  };

  const handleCopyRich = async () => {
    await copyRenderedContent(previewRef.current, markdown);
    setCopied("rich");
    window.setTimeout(() => setCopied(null), 1500);
  };

  const handleCopyLatex = async () => {
    await navigator.clipboard.writeText(latex.trim());
    setCopied("latex");
    window.setTimeout(() => setCopied(null), 1500);
  };

  const handleInsert = () => {
    onInsert({
      markdown,
      latex: latex.trim(),
      font,
      isItalic,
      isDisplay,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden bg-[hsl(var(--background))] p-0 text-[hsl(var(--foreground))] sm:max-w-5xl">
        <DialogHeader className="border-b bg-[hsl(var(--background))] px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sigma className="h-5 w-5" />
            Math Studio
          </DialogTitle>
          <DialogDescription>
            Soạn công thức, chọn kiểu chữ rồi copy hoặc chèn vào khung chat.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[minmax(0,1fr)_320px]">
          <section className="flex min-h-0 flex-col border-b md:border-b-0 md:border-r">
            <div className="border-b bg-[hsl(var(--card))] p-4">
              <div className="mb-3 grid gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  Font công thức
                </div>
                <div className="flex max-w-full gap-2 overflow-x-auto rounded-xl border bg-background p-1">
                  {FONT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFont(option.value)}
                      className={cn(
                        "h-8 shrink-0 rounded-lg px-3 text-sm transition-colors",
                        font === option.value
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                      aria-pressed={font === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant={isItalic ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsItalic((value) => !value)}
                    aria-pressed={isItalic}
                  >
                    <Italic className="h-4 w-4" />
                    Nghiêng
                  </Button>

                  <Button
                    type="button"
                    variant={isDisplay ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsDisplay((value) => !value)}
                    aria-pressed={isDisplay}
                  >
                    {isDisplay ? "Block" : "Inline"}
                  </Button>
                </div>
              </div>

              <Textarea
                ref={editorRef}
                value={latex}
                onChange={(event) => setLatex(event.target.value)}
                spellCheck={false}
                className="min-h-32 resize-none font-mono text-sm leading-6"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[hsl(var(--background))] p-4">
              <div
                ref={previewRef}
                data-font={font}
                data-italic={isItalic ? "on" : "off"}
                className={cn(
                  "formula-studio-preview min-h-40 select-text rounded-xl border bg-[hsl(var(--card))] p-5",
                  "text-[17px] leading-8"
                )}
                onCopy={(event) => {
                  writeRenderedSelectionToClipboard(event.nativeEvent, previewRef.current, markdown);
                }}
              >
                <MathRenderer content={markdown} />
              </div>
            </div>
          </section>

          <aside className="min-h-0 overflow-y-auto bg-[hsl(var(--card))] p-4">
            <div className="grid gap-4">
              {SYMBOL_GROUPS.map((group) => {
                const Icon = group.icon;
                return (
                  <section key={group.label}>
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {group.label}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {group.items.map((item) => (
                        <button
                          key={`${group.label}-${item.label}`}
                          type="button"
                          title={item.label}
                          aria-label={item.label}
                          onClick={() => insertSnippet(item.value)}
                          className="flex h-10 items-center justify-center rounded-lg border bg-background px-2 text-sm font-medium transition-colors hover:bg-accent"
                        >
                          {item.display}
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </aside>
        </div>

        <DialogFooter className="gap-2 border-t bg-[hsl(var(--background))] px-5 py-4 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleCopyLatex}>
              {copied === "latex" ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
              Copy LaTeX
            </Button>
            <Button type="button" variant="outline" onClick={handleCopyRich}>
              {copied === "rich" ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
              Copy đẹp
            </Button>
          </div>
          <Button type="button" onClick={handleInsert}>
            <Plus className="mr-2 h-4 w-4" />
            Chèn vào chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildFormulaMarkdown(latex: string, isDisplay: boolean) {
  const source = latex.trim() || "\\square";
  return isDisplay ? `\n$$\n${source}\n$$\n` : `$${source}$`;
}
