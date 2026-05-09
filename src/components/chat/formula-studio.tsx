"use client";

import { type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Braces,
  Check,
  ChevronDown,
  Copy,
  Eraser,
  Italic,
  Keyboard,
  Loader2,
  PenLine,
  Plus,
  Sparkles,
  Sigma,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
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
import { getApiUrl, hasRuntimeApi } from "@/lib/api-url";
import { cn } from "@/lib/utils";
import { MathRenderer } from "./math-renderer";

interface FormulaStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (value: FormulaInsertPayload) => void;
}

export type FormulaFont =
  | "mathtype"
  | "euclid"
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

interface MathFormulaInsertPayload {
  kind: "math";
  markdown: string;
  latex: string;
  font: FormulaFont;
  isItalic: boolean;
  isDisplay: boolean;
}

interface DrawingFormulaInsertPayload {
  kind: "drawing";
  imageDataUrl: string;
}

export type FormulaInsertPayload = MathFormulaInsertPayload | DrawingFormulaInsertPayload;

interface FormulaRecognitionDebug {
  provider?: string;
  hasFormulaGeminiKey?: boolean;
  hasGeminiKey?: boolean;
  hasOpenAIKey?: boolean;
  openAIBaseUrlHost?: string | null;
  openAIModel?: string | null;
  formulaRecognitionModel?: string;
  attemptedFormulaModels?: string[];
  providerError?: string;
}

const DEFAULT_LATEX = "\\int_0^{\\frac{\\pi}{2}} f(x)\\,dx = 0";
const DRAWING_WIDTH = 920;
const DRAWING_HEIGHT = 300;
const RECOGNITION_DEBOUNCE_MS = 850;

const FONT_OPTIONS: Array<{ value: FormulaFont; label: string }> = [
  { value: "mathtype", label: "MathType Classic" },
  { value: "euclid", label: "Euclid MathType" },
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
  const [mode, setMode] = useState<"typing" | "drawing">("typing");
  const [latex, setLatex] = useState(DEFAULT_LATEX);
  const [font, setFont] = useState<FormulaFont>("mathtype");
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const [isItalic, setIsItalic] = useState(true);
  const [isDisplay, setIsDisplay] = useState(true);
  const [drawingTool, setDrawingTool] = useState<"pen" | "eraser">("pen");
  const [penSize, setPenSize] = useState(4);
  const [drawingHistory, setDrawingHistory] = useState<string[]>([]);
  const [recognizedLatex, setRecognizedLatex] = useState("");
  const [recognitionState, setRecognitionState] = useState<"idle" | "waiting" | "loading" | "success" | "error" | "unavailable">("idle");
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [recognitionHint, setRecognitionHint] = useState<string | null>(null);
  const [copied, setCopied] = useState<"rich" | "latex" | "drawing" | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const recognitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRunRef = useRef(0);

  const markdown = useMemo(
    () => buildFormulaMarkdown(latex, isDisplay),
    [latex, isDisplay]
  );

  useEffect(() => {
    if (open && mode === "drawing") {
      initializeDrawingCanvas(canvasRef.current);
    }
  }, [open, mode]);

  useEffect(() => {
    if (!isFontMenuOpen) return;

    const close = () => setIsFontMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [isFontMenuOpen]);

  useEffect(() => {
    return () => {
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
    };
  }, []);

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

  const handleCopyDrawing = async () => {
    const blob = await getDrawingBlob(canvasRef.current);
    if (!blob) return;

    if ("ClipboardItem" in window && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
      setCopied("drawing");
      window.setTimeout(() => setCopied(null), 1500);
    }
  };

  const handleInsert = () => {
    onInsert({
      kind: "math",
      markdown,
      latex: latex.trim(),
      font,
      isItalic,
      isDisplay,
    });
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setIsFontMenuOpen(false);
    }
    onOpenChange(nextOpen);
  };

  const handleInsertDrawing = () => {
    const imageDataUrl = canvasRef.current?.toDataURL("image/png");
    if (!imageDataUrl) return;

    onInsert({
      kind: "drawing",
      imageDataUrl,
    });
    onOpenChange(false);
  };

  const recognizeDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasVisibleDrawing(canvas)) {
      setRecognizedLatex("");
      setRecognitionError(null);
      setRecognitionHint(null);
      setRecognitionState("idle");
      return;
    }

    if (!hasRuntimeApi()) {
      setRecognitionState("unavailable");
      setRecognitionHint(null);
      setRecognitionError("Live nhận dạng cần backend đang chạy.");
      return;
    }

    const runId = recognitionRunRef.current + 1;
    recognitionRunRef.current = runId;
    setRecognitionState("loading");
    setRecognitionError(null);
    setRecognitionHint(null);

    try {
      const response = await fetch(getApiUrl("/api/recognize-formula"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: canvas.toDataURL("image/png"),
        }),
      });

      const data = await response.json().catch(() => ({})) as {
        latex?: string;
        error?: string;
        warning?: string;
        debug?: FormulaRecognitionDebug;
      };

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (recognitionRunRef.current !== runId) return;

      if (data.error) {
        setRecognizedLatex("");
        setRecognitionState("error");
        setRecognitionError(data.error);
        setRecognitionHint(getRecognitionDebugHint(data.debug));
        return;
      }

      const nextLatex = data.latex?.trim() ?? "";
      setRecognizedLatex(nextLatex);
      setRecognitionState(nextLatex ? "success" : data.warning ? "error" : "idle");
      setRecognitionError(nextLatex ? null : data.warning ?? null);
      setRecognitionHint(nextLatex ? null : getRecognitionDebugHint(data.debug));
    } catch (error) {
      if (recognitionRunRef.current !== runId) return;
      setRecognitionState("error");
      setRecognitionHint(null);
      setRecognitionError(error instanceof Error ? error.message : "Không nhận dạng được.");
    }
  };

  const scheduleDrawingRecognition = (delay = RECOGNITION_DEBOUNCE_MS, assumeHasDrawing = false) => {
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
    }

    const canvas = canvasRef.current;
    if (!canvas || (!assumeHasDrawing && !hasVisibleDrawing(canvas))) {
      setRecognizedLatex("");
      setRecognitionError(null);
      setRecognitionHint(null);
      setRecognitionState("idle");
      return;
    }

    if (!hasRuntimeApi()) {
      setRecognitionState("unavailable");
      setRecognitionHint(null);
      setRecognitionError("Live nhận dạng cần Vercel/backend API.");
      return;
    }

    setRecognitionState("waiting");
    recognitionTimeoutRef.current = setTimeout(() => {
      void recognizeDrawing();
    }, delay);
  };

  const useRecognizedFormula = () => {
    if (!recognizedLatex.trim()) return;
    setLatex(recognizedLatex);
    setMode("typing");
  };

  const beginDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setDrawingHistory((history) => [...history.slice(-19), canvas.toDataURL("image/png")]);
    drawingRef.current = true;
    lastPointRef.current = getCanvasPoint(event, canvas);
    canvas.setPointerCapture(event.pointerId);
  };

  const draw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const lastPoint = lastPointRef.current;
    if (!canvas || !drawingRef.current || !lastPoint) return;

    const nextPoint = getCanvasPoint(event, canvas);
    const context = canvas.getContext("2d");
    if (!context) return;

    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = drawingTool === "eraser" ? penSize * 3 : penSize;
    context.strokeStyle = drawingTool === "eraser" ? "#ffffff" : "#111111";
    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(nextPoint.x, nextPoint.y);
    context.stroke();
    lastPointRef.current = nextPoint;
    scheduleDrawingRecognition(RECOGNITION_DEBOUNCE_MS, true);
  };

  const endDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    drawingRef.current = false;
    lastPointRef.current = null;
    canvas?.releasePointerCapture(event.pointerId);
  };

  const undoDrawing = () => {
    const previous = drawingHistory.at(-1);
    if (!previous) return;

    restoreDrawing(canvasRef.current, previous);
    setDrawingHistory((history) => history.slice(0, -1));
    window.setTimeout(() => scheduleDrawingRecognition(150), 80);
  };

  const clearDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setDrawingHistory((history) => [...history.slice(-19), canvas.toDataURL("image/png")]);
    initializeDrawingCanvas(canvas);
    setRecognizedLatex("");
    setRecognitionError(null);
    setRecognitionHint(null);
    setRecognitionState("idle");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden border-border/15 bg-[hsl(var(--card))] p-0 text-foreground shadow-[var(--shadow-md)] sm:max-w-5xl">
        <DialogHeader className="border-b border-border/15 bg-[hsl(var(--card))] px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))]">
              <Sigma className="h-[18px] w-[18px]" />
            </span>
            Math Studio
          </DialogTitle>
          <DialogDescription>
            Soạn công thức, chọn kiểu chữ rồi copy hoặc chèn vào khung chat.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-border/15 bg-[hsl(var(--background))] px-5 py-3">
          <div className="inline-flex rounded-xl border border-border/15 bg-card p-1 shadow-[var(--shadow-sm)]">
            <button
              type="button"
              onClick={() => setMode("typing")}
              className={cn(
                "flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition-colors",
                mode === "typing" ? "bg-[#1F1E1D] text-white dark:bg-[#FAF9F5] dark:text-[#1F1E1D]" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
              )}
            >
              <Keyboard className="h-4 w-4" />
              Soạn công thức
            </button>
            <button
              type="button"
              onClick={() => setMode("drawing")}
              className={cn(
                "flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition-colors",
                mode === "drawing" ? "bg-[#1F1E1D] text-white dark:bg-[#FAF9F5] dark:text-[#1F1E1D]" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
              )}
            >
              <PenLine className="h-4 w-4" />
              Vẽ tay
            </button>
          </div>
        </div>

        {mode === "typing" ? (
          <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[minmax(0,1fr)_320px]">
            <section className="flex min-h-0 flex-col border-b md:border-b-0 md:border-r">
              <div className="border-b border-border/15 bg-[hsl(var(--card))] p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[15rem]" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setIsFontMenuOpen((value) => !value)}
                      className="flex h-11 w-full items-center justify-between gap-3 rounded-[9.6px] border border-border/15 bg-card px-3 text-left text-sm text-foreground shadow-[var(--shadow-sm)] transition-colors hover:border-border/30 hover:bg-secondary"
                      aria-label="Chọn font công thức"
                      aria-expanded={isFontMenuOpen}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Type className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{getFontLabel(font)}</span>
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                    {isFontMenuOpen && (
                      <div className="absolute left-0 top-12 z-50 max-h-72 w-full overflow-y-auto rounded-xl border border-border/15 bg-popover p-1 text-popover-foreground shadow-[var(--shadow-md)]">
                        {FONT_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setFont(option.value);
                              setIsFontMenuOpen(false);
                            }}
                            className={cn(
                              "flex h-9 w-full items-center rounded-lg px-3 text-left text-sm transition-colors",
                              font === option.value
                                ? "bg-[hsl(var(--terracotta))] text-white"
                                : "text-popover-foreground hover:bg-secondary"
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

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

                <Textarea
                  ref={editorRef}
                  value={latex}
                  onChange={(event) => setLatex(event.target.value)}
                  spellCheck={false}
                  className="min-h-32 resize-none border-border/15 bg-[hsl(var(--card))] font-mono text-sm leading-6 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-[hsl(var(--background))] p-4">
                <div
                  ref={previewRef}
                  data-font={font}
                  data-italic={isItalic ? "on" : "off"}
                  className={cn(
                    "formula-studio-preview min-h-40 select-text rounded-xl border border-border/15 bg-[hsl(var(--card))] p-5 shadow-[var(--shadow-sm)]",
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

            <aside className="min-h-0 overflow-y-auto bg-[hsl(var(--background))] p-4">
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
                            className="flex h-10 items-center justify-center rounded-lg border border-border/15 bg-card px-2 text-sm font-medium transition-colors hover:border-border/30 hover:bg-secondary"
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
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[hsl(var(--background))]">
            <div className="grid gap-3 border-b border-border/15 bg-[hsl(var(--card))] p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={drawingTool === "pen" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDrawingTool("pen")}
                >
                  <PenLine className="h-4 w-4" />
                  Bút
                </Button>
                <Button
                  type="button"
                  variant={drawingTool === "eraser" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDrawingTool("eraser")}
                >
                  <Eraser className="h-4 w-4" />
                  Tẩy
                </Button>
                <label className="flex min-h-10 items-center gap-2 rounded-lg border border-border/15 bg-card px-3 py-1.5 text-sm shadow-[var(--shadow-sm)]">
                  Nét
                  <input
                    type="range"
                    min="2"
                    max="12"
                    value={penSize}
                    onChange={(event) => setPenSize(Number(event.target.value))}
                    className="w-24"
                  />
                </label>
                <Button type="button" variant="outline" size="sm" onClick={undoDrawing} disabled={!drawingHistory.length}>
                  <Undo2 className="h-4 w-4" />
                  Undo
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearDrawing}>
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </Button>
              </div>

              <div className="min-h-20 rounded-xl border border-border/15 bg-card p-3 shadow-[var(--shadow-sm)]">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    Kết quả nhận dạng
                  </span>
                  {recognizedLatex && (
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={useRecognizedFormula}>
                      Dùng
                    </Button>
                  )}
                </div>
                <div className="min-h-8 text-sm">
                  {recognitionState === "waiting" && (
                    <span className="text-muted-foreground">Đợi nét vẽ ổn định...</span>
                  )}
                  {recognitionState === "loading" && (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang nhận dạng...
                    </span>
                  )}
                  {recognitionState === "success" && recognizedLatex && (
                    <div className="max-h-24 overflow-y-auto">
                      <MathRenderer content={`$${recognizedLatex}$`} />
                    </div>
                  )}
                  {recognitionState === "error" && (
                    <div className="space-y-1">
                      <p className="text-destructive">{recognitionError ?? "Không nhận dạng được."}</p>
                      {recognitionHint && (
                        <p className="text-xs leading-5 text-muted-foreground">{recognitionHint}</p>
                      )}
                    </div>
                  )}
                  {recognitionState === "unavailable" && (
                    <span className="text-muted-foreground">{recognitionError}</span>
                  )}
                  {recognitionState === "idle" && !recognizedLatex && (
                    <span className="text-muted-foreground">Vẽ công thức để app tự nhận.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-4">
              <canvas
                ref={canvasRef}
                width={DRAWING_WIDTH}
                height={DRAWING_HEIGHT}
                className="block h-[300px] w-full touch-none rounded-xl border border-border/15 bg-white shadow-[var(--shadow-sm)]"
                onPointerDown={beginDrawing}
                onPointerMove={draw}
                onPointerUp={endDrawing}
                onPointerCancel={endDrawing}
                aria-label="Bảng vẽ công thức"
              />
              <p className="mt-3 text-sm text-muted-foreground">
                Vẽ công thức bằng chuột hoặc bút cảm ứng. Khi chèn vào chat, bản vẽ sẽ được gửi như ảnh để AI có thể đọc.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 border-t border-border/15 bg-[hsl(var(--card))] px-5 py-4 sm:justify-between">
          {mode === "typing" ? (
            <>
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
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleCopyDrawing}>
                {copied === "drawing" ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                Copy ảnh
              </Button>
              <Button type="button" onClick={handleInsertDrawing}>
                <Plus className="mr-2 h-4 w-4" />
                Chèn bản vẽ
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildFormulaMarkdown(latex: string, isDisplay: boolean) {
  const source = latex.trim() || "\\square";
  return isDisplay ? `\n$$\n${source}\n$$\n` : `$${source}$`;
}

function getFontLabel(font: FormulaFont) {
  return FONT_OPTIONS.find((option) => option.value === font)?.label ?? "MathType Classic";
}

function getRecognitionDebugHint(debug?: FormulaRecognitionDebug) {
  if (!debug) return null;

  if (!debug.hasFormulaGeminiKey && !debug.hasGeminiKey) {
    const provider = [debug.openAIBaseUrlHost, debug.openAIModel].filter(Boolean).join(" / ");
    return provider
      ? `Backend đang thấy provider chat: ${provider}. Nó chưa thấy FORMULA_GEMINI_API_KEY.`
      : "Backend chưa thấy FORMULA_GEMINI_API_KEY.";
  }

  if (debug.provider === "gemini") {
    const attempted = debug.attemptedFormulaModels?.length
      ? ` Đã thử: ${debug.attemptedFormulaModels.join(", ")}.`
      : "";
    return `Backend đang dùng Gemini cho nhận dạng: ${debug.formulaRecognitionModel ?? "model chưa rõ"}.${attempted}`;
  }

  return null;
}

function initializeDrawingCanvas(canvas: HTMLCanvasElement | null) {
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#111111";
  context.lineCap = "round";
  context.lineJoin = "round";
}

function getCanvasPoint(event: ReactPointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function restoreDrawing(canvas: HTMLCanvasElement | null, dataUrl: string) {
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;

  const image = new Image();
  image.onload = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  };
  image.src = dataUrl;
}

function hasVisibleDrawing(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) return false;

  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < data.length; index += 16) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];

    if (alpha > 0 && (red < 245 || green < 245 || blue < 245)) {
      return true;
    }
  }

  return false;
}

function getDrawingBlob(canvas: HTMLCanvasElement | null) {
  return new Promise<Blob | null>((resolve) => {
    if (!canvas) {
      resolve(null);
      return;
    }

    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
