"use client";

import { type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
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

interface PaletteItem {
  label: string;
  display: string;
  value: string;
  preview?: string;
  wide?: boolean;
}

interface PaletteTab {
  id: string;
  label: string;
  items: PaletteItem[];
  footer?: PaletteItem[];
}

const TEMPLATE_PALETTE_ITEMS: PaletteItem[] = [
  { label: "Fraction", display: "a/b", preview: "\\frac{a}{b}", value: "\\frac{a}{b}" },
  { label: "Root", display: "√x", preview: "\\sqrt{x}", value: "\\sqrt{x}" },
  { label: "Power", display: "x²", preview: "x^{2}", value: "x^{2}" },
  { label: "Subscript", display: "x₁", preview: "x_{1}", value: "x_{1}" },
  { label: "Fence", display: "( )", value: "\\left( x \\right)" },
  { label: "Bracket", display: "[ ]", value: "\\left[ x \\right]" },
  { label: "Cases", display: "{", preview: "\\begin{cases}a=b\\\\c=d\\end{cases}", value: "\\begin{cases}\na=b\\\\\nc=d\n\\end{cases}" },
  { label: "Sum", display: "Σ", preview: "\\sum_{i=1}^{n}", value: "\\sum_{i=1}^{n} a_i" },
  { label: "Integral", display: "∫", preview: "\\int_a^b", value: "\\int_a^b f(x)\\,dx" },
  { label: "Limit", display: "lim", preview: "\\lim_{x\\to 0}", value: "\\lim_{x\\to 0} f(x)" },
  { label: "Matrix 2x2", display: "▦", preview: "\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}", value: "\\begin{pmatrix}\na & b\\\\\nc & d\n\\end{pmatrix}" },
  { label: "Vector", display: "→u", preview: "\\vec{u}", value: "\\vec{u}" },
];

const COMMON_SYMBOL_ITEMS: PaletteItem[] = [
  { label: "Pi", display: "π", value: "\\pi" },
  { label: "Theta", display: "θ", value: "\\theta" },
  { label: "Infinity", display: "∞", value: "\\infty" },
  { label: "Element", display: "∈", value: "\\in" },
  { label: "Arrow", display: "→", value: "\\to" },
  { label: "Partial", display: "∂", value: "\\partial" },
  { label: "Less equal", display: "≤", value: "\\le" },
  { label: "Not equal", display: "≠", value: "\\ne" },
  { label: "Plus minus", display: "±", value: "\\pm" },
  { label: "Parentheses", display: "( )", value: "\\left( x \\right)" },
  { label: "Brackets", display: "[ ]", value: "\\left[ x \\right]" },
  { label: "Braces", display: "{ }", value: "\\left\\{ x \\right\\}" },
  { label: "Union", display: "∪", value: "\\cup" },
  { label: "Intersection", display: "∩", value: "\\cap" },
  { label: "Approximately", display: "≈", value: "\\approx" },
  { label: "Dot", display: "⋅", value: "\\cdot" },
  { label: "Angle", display: "∠", value: "\\angle" },
  { label: "Triangle", display: "△", value: "\\triangle" },
];

const LEGACY_PALETTE_ITEMS: PaletteItem[] = SYMBOL_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    label: `${group.label} · ${item.label}`,
    display: item.display,
    value: item.value,
  }))
);

const PALETTE_TABS: PaletteTab[] = [
  {
    id: "algebra",
    label: "Algebra",
    items: [
      { label: "Pythagorean radical", display: "√(a²+b²)", preview: "\\sqrt{a^2+b^2}", value: "\\sqrt{a^2+b^2}", wide: true },
      { label: "Limit to infinity", display: "lim x→∞", preview: "\\lim_{x\\to\\infty}", value: "\\lim_{x\\to\\infty} f(x)", wide: true },
      { label: "Quadratic formula", display: "√(b²-4ac)", preview: "\\sqrt{b^2-4ac}", value: "\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}", wide: true },
      { label: "Fraction template", display: "a/b", preview: "\\frac{a}{b}", value: "\\frac{a}{b}" },
      { label: "Binomial", display: "n!", preview: "\\frac{n!}{r!(n-r)!}", value: "\\frac{n!}{r!(n-r)!}", wide: true },
      { label: "One half", display: "1/2", preview: "\\frac{1}{2}", value: "\\frac{1}{2}" },
      { label: "Absolute value", display: "|x|", preview: "\\left|x\\right|", value: "\\left|x\\right|" },
      { label: "Logarithm", display: "log", preview: "\\log_a x", value: "\\log_a x" },
      { label: "Natural log", display: "ln", preview: "\\ln x", value: "\\ln x" },
      { label: "Exponential", display: "eˣ", preview: "e^x", value: "e^x" },
      { label: "Product", display: "Π", preview: "\\prod_{i=1}^{n}", value: "\\prod_{i=1}^{n} a_i" },
      { label: "Cases", display: "{", preview: "\\begin{cases}x>0\\\\x\\le0\\end{cases}", value: "\\begin{cases}\nx>0\\\\\nx\\le 0\n\\end{cases}", wide: true },
    ],
    footer: [
      { label: "Z", display: "ℤ", value: "\\mathbb{Z}" },
      { label: "R", display: "ℝ", value: "\\mathbb{R}" },
      { label: "C", display: "ℂ", value: "\\mathbb{C}" },
      { label: "For all", display: "∀", value: "\\forall" },
      { label: "Exists", display: "∃", value: "\\exists" },
      { label: "Empty set", display: "∅", value: "\\varnothing" },
      { label: "Circular plus", display: "⊕", value: "\\oplus" },
      { label: "Diamond", display: "◇", value: "\\diamond" },
      { label: "Left triangle", display: "◁", value: "\\triangleleft" },
      { label: "Right triangle", display: "▷", value: "\\triangleright" },
      { label: "Interval", display: "[0,1]", value: "[0,1]" },
      { label: "Square root 2", display: "√2", preview: "\\sqrt{2}", value: "\\sqrt{2}" },
    ],
  },
  {
    id: "derivs",
    label: "Derivs",
    items: [
      { label: "dy dx", display: "dy/dx", preview: "\\frac{dy}{dx}", value: "\\frac{dy}{dx}", wide: true },
      { label: "Delta quotient", display: "Δy/Δx", preview: "\\frac{\\Delta y}{\\Delta x}", value: "\\frac{\\Delta y}{\\Delta x}", wide: true },
      { label: "Partial quotient", display: "δy/δx", preview: "\\frac{\\delta y}{\\delta x}", value: "\\frac{\\delta y}{\\delta x}", wide: true },
      { label: "Second partial u", display: "∂²Ω/∂u²", preview: "\\frac{\\partial^2\\Omega}{\\partial u^2}", value: "\\frac{\\partial^2\\Omega}{\\partial u^2}", wide: true },
      { label: "Second partial v", display: "∂²Ω/∂v²", preview: "\\frac{\\partial^2\\Omega}{\\partial v^2}", value: "\\frac{\\partial^2\\Omega}{\\partial v^2}", wide: true },
      { label: "Mixed partial", display: "∂²Ω/∂u∂v", preview: "\\frac{\\partial^2\\Omega}{\\partial u\\partial v}", value: "\\frac{\\partial^2\\Omega}{\\partial u\\partial v}", wide: true },
      { label: "Limit delta", display: "lim δx→0", preview: "\\lim_{\\delta x\\to0}", value: "\\lim_{\\delta x\\to0}\\frac{f(x+\\delta x)-f(x)}{\\delta x}", wide: true },
    ],
    footer: [
      { label: "dx", display: "dx", value: "dx" },
      { label: "dy", display: "dy", value: "dy" },
      { label: "Partial x", display: "∂x", value: "\\partial x" },
      { label: "Partial y", display: "∂y", value: "\\partial y" },
      { label: "Derivative", display: "f′", value: "f'(x)" },
      { label: "Second derivative", display: "f″", value: "f''(x)" },
      { label: "X bar", display: "x̄", preview: "\\bar{x}", value: "\\bar{x}" },
      { label: "X dot", display: "ẋ", preview: "\\dot{x}", value: "\\dot{x}" },
      { label: "X double dot", display: "ẍ", preview: "\\ddot{x}", value: "\\ddot{x}" },
    ],
  },
  {
    id: "statistics",
    label: "Statistics",
    items: [
      { label: "Sum Xi", display: "ΣXi", preview: "\\sum X_i", value: "\\sum_{i=1}^{n} X_i", wide: true },
      { label: "Sum Xi squared", display: "ΣXi²", preview: "\\sum X_i^2", value: "\\sum_{i=1}^{n} X_i^2", wide: true },
      { label: "Sum XiYi", display: "ΣXiYi", preview: "\\sum X_iY_i", value: "\\sum_{i=1}^{n} X_iY_i", wide: true },
      { label: "One over n", display: "1/n", preview: "\\frac{1}{n}", value: "\\frac{1}{n}" },
      { label: "Variance sum", display: "Σ(Xi-x̄)²", preview: "\\sum_{i=1}^{n}(X_i-\\bar{x})^2", value: "\\sum_{i=1}^{n}(X_i-\\bar{x})^2", wide: true },
      { label: "Sample range", display: "X₁,...,Xₙ", preview: "X_1,\\ldots,X_n", value: "X_1,\\ldots,X_n", wide: true },
      { label: "Z score", display: "(x-μ)/σ", preview: "\\frac{x-\\mu}{\\sigma}", value: "\\frac{x-\\mu}{\\sigma}", wide: true },
    ],
    footer: [
      { label: "Mean", display: "x̄", preview: "\\bar{x}", value: "\\bar{x}" },
      { label: "Y mean", display: "ȳ", preview: "\\bar{y}", value: "\\bar{y}" },
      { label: "Mu", display: "μ", value: "\\mu" },
      { label: "Sigma", display: "σ", value: "\\sigma" },
      { label: "Sigma squared", display: "σ²", preview: "\\sigma^2", value: "\\sigma^2" },
      { label: "Probability", display: "P(A)", value: "P(A)" },
      { label: "Expected value", display: "E(X)", value: "E(X)" },
      { label: "Variance", display: "Var(X)", value: "\\operatorname{Var}(X)" },
      { label: "Correlation", display: "ρ", value: "\\rho" },
    ],
  },
  {
    id: "matrices",
    label: "Matrices",
    items: [
      { label: "2x2 parentheses", display: "(aᵢⱼ)", preview: "\\begin{pmatrix}a_{11}&a_{12}\\\\a_{21}&a_{22}\\end{pmatrix}", value: "\\begin{pmatrix}\na_{11} & a_{12}\\\\\na_{21} & a_{22}\n\\end{pmatrix}", wide: true },
      { label: "3x3 brackets", display: "[aᵢⱼ]", preview: "\\begin{bmatrix}a_{11}&a_{12}&a_{13}\\\\a_{21}&a_{22}&a_{23}\\\\a_{31}&a_{32}&a_{33}\\end{bmatrix}", value: "\\begin{bmatrix}\na_{11} & a_{12} & a_{13}\\\\\na_{21} & a_{22} & a_{23}\\\\\na_{31} & a_{32} & a_{33}\n\\end{bmatrix}", wide: true },
      { label: "Ellipsis matrix", display: "⋯ ⋱", preview: "\\begin{pmatrix}a_{11}&\\cdots&a_{1n}\\\\\\vdots&\\ddots&\\vdots\\\\a_{m1}&\\cdots&a_{mn}\\end{pmatrix}", value: "\\begin{pmatrix}\na_{11} & \\cdots & a_{1n}\\\\\n\\vdots & \\ddots & \\vdots\\\\\na_{m1} & \\cdots & a_{mn}\n\\end{pmatrix}", wide: true },
      { label: "Identity", display: "I", preview: "\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}", value: "\\begin{pmatrix}\n1 & 0\\\\\n0 & 1\n\\end{pmatrix}", wide: true },
      { label: "Determinant", display: "|A|", preview: "\\begin{vmatrix}a&b\\\\c&d\\end{vmatrix}", value: "\\begin{vmatrix}\na & b\\\\\nc & d\n\\end{vmatrix}", wide: true },
      { label: "Augmented", display: "[A|b]", preview: "\\left[\\begin{array}{cc|c}a&b&e\\\\c&d&f\\end{array}\\right]", value: "\\left[\\begin{array}{cc|c}\na & b & e\\\\\nc & d & f\n\\end{array}\\right]", wide: true },
    ],
    footer: [
      { label: "Horizontal dots", display: "⋯", value: "\\cdots" },
      { label: "Vertical dots", display: "⋮", value: "\\vdots" },
      { label: "Diagonal dots", display: "⋱", value: "\\ddots" },
      { label: "Colon", display: ":", value: ":" },
      { label: "Matrix transpose", display: "Aᵀ", preview: "A^T", value: "A^T" },
      { label: "Vector column", display: "col", preview: "\\begin{pmatrix}x\\\\y\\end{pmatrix}", value: "\\begin{pmatrix}\nx\\\\\ny\n\\end{pmatrix}" },
    ],
  },
  {
    id: "sets",
    label: "Sets",
    items: [
      { label: "Union indexed", display: "⋃Xi", preview: "\\bigcup_i X_i", value: "\\bigcup_i X_i", wide: true },
      { label: "Intersection indexed", display: "⋂Xi", preview: "\\bigcap_i X_i", value: "\\bigcap_i X_i", wide: true },
      { label: "Set builder", display: "{x|...}", preview: "\\left\\{x\\mid x\\in A\\right\\}", value: "\\left\\{x\\mid x\\in A\\right\\}", wide: true },
      { label: "Interval", display: "[a,b]", preview: "[a,b]", value: "[a,b]" },
      { label: "Open interval", display: "(a,b)", preview: "(a,b)", value: "(a,b)" },
      { label: "Power set", display: "P(A)", preview: "\\mathcal{P}(A)", value: "\\mathcal{P}(A)" },
    ],
    footer: [
      { label: "Empty set", display: "∅", value: "\\varnothing" },
      { label: "Member", display: "∈", value: "\\in" },
      { label: "Not member", display: "∉", value: "\\notin" },
      { label: "Subset", display: "⊂", value: "\\subset" },
      { label: "Subset equal", display: "⊆", value: "\\subseteq" },
      { label: "Superset", display: "⊃", value: "\\supset" },
      { label: "Superset equal", display: "⊇", value: "\\supseteq" },
      { label: "Union", display: "∪", value: "\\cup" },
      { label: "Intersection", display: "∩", value: "\\cap" },
      { label: "Complement", display: "∁", value: "\\complement" },
      { label: "Natural", display: "ℕ", value: "\\mathbb{N}" },
      { label: "Integer", display: "ℤ", value: "\\mathbb{Z}" },
      { label: "Rational", display: "ℚ", value: "\\mathbb{Q}" },
      { label: "Real", display: "ℝ", value: "\\mathbb{R}" },
    ],
  },
  {
    id: "trig",
    label: "Trig",
    items: [
      { label: "Cos inverse", display: "cos⁻¹θ", preview: "\\cos^{-1}\\theta", value: "\\cos^{-1}\\theta", wide: true },
      { label: "Sin inverse", display: "sin⁻¹θ", preview: "\\sin^{-1}\\theta", value: "\\sin^{-1}\\theta", wide: true },
      { label: "Arcsin", display: "arcsinθ", preview: "\\arcsin\\theta", value: "\\arcsin\\theta", wide: true },
      { label: "Euler", display: "eⁱθ", preview: "e^{i\\theta}", value: "e^{i\\theta}", wide: true },
      { label: "Opposite over hypotenuse", display: "Opp/Hyp", preview: "\\frac{\\text{opposite}}{\\text{hypotenuse}}", value: "\\frac{\\text{opposite}}{\\text{hypotenuse}}", wide: true },
      { label: "Complement angle", display: "π/2-θ", preview: "\\left(\\frac{\\pi}{2}-\\theta\\right)", value: "\\left(\\frac{\\pi}{2}-\\theta\\right)", wide: true },
    ],
    footer: [
      { label: "Theta", display: "θ", value: "\\theta" },
      { label: "Pi", display: "π", value: "\\pi" },
      { label: "Pi over two", display: "π/2", preview: "\\frac{\\pi}{2}", value: "\\frac{\\pi}{2}" },
      { label: "Pi over three", display: "π/3", preview: "\\frac{\\pi}{3}", value: "\\frac{\\pi}{3}" },
      { label: "Pi over four", display: "π/4", preview: "\\frac{\\pi}{4}", value: "\\frac{\\pi}{4}" },
      { label: "Pi over six", display: "π/6", preview: "\\frac{\\pi}{6}", value: "\\frac{\\pi}{6}" },
      { label: "Degree", display: "°", value: "^{\\circ}" },
      { label: "Sin", display: "sin", value: "\\sin" },
      { label: "Cos", display: "cos", value: "\\cos" },
      { label: "Tan", display: "tan", value: "\\tan" },
      { label: "Cot", display: "cot", value: "\\cot" },
      { label: "Sec", display: "sec", value: "\\sec" },
      { label: "Csc", display: "csc", value: "\\csc" },
    ],
  },
  {
    id: "geometry",
    label: "Geometry",
    items: [
      { label: "Line segment", display: "AB bar", preview: "\\overline{AB}", value: "\\overline{AB}", wide: true },
      { label: "Vector AB", display: "AB vector", preview: "\\overrightarrow{AB}", value: "\\overrightarrow{AB}", wide: true },
      { label: "Arc ABC", display: "arc ABC", preview: "\\widehat{ABC}", value: "\\widehat{ABC}", wide: true },
      { label: "Triangle ABC", display: "△ABC", preview: "\\triangle ABC", value: "\\triangle ABC", wide: true },
      { label: "Angle ABC", display: "∠ABC", preview: "\\angle ABC", value: "\\angle ABC", wide: true },
      { label: "Measure angle", display: "m∠A", preview: "m\\angle A", value: "m\\angle A" },
    ],
    footer: [
      { label: "Perpendicular", display: "⊥", value: "\\perp" },
      { label: "Parallel", display: "∥", value: "\\parallel" },
      { label: "Congruent", display: "≅", value: "\\cong" },
      { label: "Similar", display: "∼", value: "\\sim" },
      { label: "Square", display: "□", value: "\\square" },
      { label: "Circle", display: "○", value: "\\circ" },
      { label: "Filled triangle", display: "▲", value: "\\blacktriangle" },
      { label: "Degree", display: "°", value: "^{\\circ}" },
    ],
  },
  {
    id: "tab8",
    label: "Tab 8",
    items: [
      ...LEGACY_PALETTE_ITEMS.slice(0, 9),
      { label: "Long implies", display: "⟹", value: "\\Longrightarrow" },
      { label: "Iff", display: "⟺", value: "\\Longleftrightarrow" },
      { label: "Therefore", display: "∴", value: "\\therefore" },
      { label: "Because", display: "∵", value: "\\because" },
      { label: "Nabla", display: "∇", value: "\\nabla" },
      { label: "Proportional", display: "∝", value: "\\propto" },
    ],
  },
  {
    id: "tab9",
    label: "Tab 9",
    items: [
      { label: "Alpha", display: "α", value: "\\alpha" },
      { label: "Beta", display: "β", value: "\\beta" },
      { label: "Gamma", display: "γ", value: "\\gamma" },
      { label: "Delta", display: "δ", value: "\\delta" },
      { label: "Epsilon", display: "ε", value: "\\varepsilon" },
      { label: "Lambda", display: "λ", value: "\\lambda" },
      { label: "Mu", display: "μ", value: "\\mu" },
      { label: "Sigma", display: "σ", value: "\\sigma" },
      { label: "Omega", display: "ω", value: "\\omega" },
      { label: "Capital Delta", display: "Δ", value: "\\Delta" },
      { label: "Capital Sigma", display: "Σ", value: "\\Sigma" },
      { label: "Capital Omega", display: "Ω", value: "\\Omega" },
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
  const [activePaletteTab, setActivePaletteTab] = useState(PALETTE_TABS[0]?.id ?? "algebra");
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
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-24px)] max-w-[calc(100vw-24px)] flex-col gap-0 overflow-hidden border-border/15 bg-[hsl(var(--card))] p-0 text-foreground shadow-[var(--shadow-md)] sm:max-w-[1120px]">
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
          <div className="grid min-h-0 min-w-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
            <section className="flex min-h-0 min-w-0 flex-col border-b lg:border-b-0 lg:border-r">
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

            <FormulaPalette
              activeTabId={activePaletteTab}
              onTabChange={setActivePaletteTab}
              onInsert={insertSnippet}
            />
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

interface FormulaPaletteProps {
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onInsert: (value: string) => void;
}

function FormulaPalette({ activeTabId, onTabChange, onInsert }: FormulaPaletteProps) {
  const activeTab = PALETTE_TABS.find((tab) => tab.id === activeTabId) ?? PALETTE_TABS[0];

  return (
    <aside className="min-h-0 min-w-0 overflow-hidden border-t border-border/15 bg-[hsl(var(--background))] lg:border-l lg:border-t-0">
      <div className="h-full min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-3">
        <div className="mb-3 rounded-xl border border-border/15 bg-card p-3 shadow-[var(--shadow-sm)]">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-[hsl(var(--terracotta))]">
              <Sigma className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">MathType Palette</p>
              <p className="truncate text-xs text-muted-foreground">Chọn mẫu, ký hiệu rồi chèn vào công thức.</p>
            </div>
          </div>

          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Ký hiệu nhanh
          </div>
          <div className="grid min-w-0 grid-cols-6 gap-1.5">
            {COMMON_SYMBOL_ITEMS.map((item) => (
              <PaletteButton key={`common-${item.label}`} item={item} onInsert={onInsert} compact />
            ))}
          </div>
        </div>

        <div className="grid min-w-0 gap-3">
          <section className="rounded-xl border border-border/15 bg-card p-3 shadow-[var(--shadow-sm)]">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Braces className="h-4 w-4 text-muted-foreground" />
              Template
            </div>
            <div className="grid min-w-0 grid-cols-4 gap-2">
              {TEMPLATE_PALETTE_ITEMS.map((item) => (
                <PaletteButton key={`template-${item.label}`} item={item} onInsert={onInsert} />
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border/15 bg-card p-3 shadow-[var(--shadow-sm)]">
            <div className="mb-2 text-sm font-semibold text-foreground">Nhóm công thức</div>
            <div className="grid min-w-0 grid-cols-3 gap-1.5">
              {PALETTE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex h-9 min-w-0 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition-colors",
                    activeTab.id === tab.id
                      ? "border-[hsl(var(--terracotta))] bg-[hsl(var(--terracotta))]/12 text-foreground"
                      : "border-border/15 bg-secondary text-muted-foreground hover:border-border/30 hover:text-foreground"
                  )}
                >
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border/15 bg-card p-3 shadow-[var(--shadow-sm)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{activeTab.label}</p>
                <p className="text-xs text-muted-foreground">Mẫu thường dùng trong nhóm này.</p>
              </div>
              <span className="shrink-0 rounded-lg border border-border/15 bg-secondary px-2 py-1 text-xs text-muted-foreground">
                {activeTab.items.length}
              </span>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-2">
              {activeTab.items.map((item) => (
                <PaletteButton key={`${activeTab.id}-${item.label}`} item={item} onInsert={onInsert} />
              ))}
            </div>

            {activeTab.footer?.length ? (
              <div className="mt-3 border-t border-border/15 pt-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Ký hiệu phụ
                </div>
                <div className="grid min-w-0 grid-cols-4 gap-1.5">
                  {activeTab.footer.map((item) => (
                    <PaletteButton key={`${activeTab.id}-footer-${item.label}`} item={item} onInsert={onInsert} compact />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </aside>
  );
}

interface PaletteButtonProps {
  item: PaletteItem;
  onInsert: (value: string) => void;
  compact?: boolean;
}

function PaletteButton({ item, onInsert, compact = false }: PaletteButtonProps) {
  return (
    <button
      type="button"
      title={item.label}
      aria-label={item.label}
      onClick={() => onInsert(item.value)}
      className={cn(
        "group flex w-full min-w-0 max-w-full items-center justify-center overflow-hidden rounded-lg border border-border/15 bg-card text-center font-semibold text-foreground shadow-[var(--shadow-sm)] transition-colors",
        "hover:border-border/30 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--terracotta))]/35",
        compact ? "h-9 px-1.5 text-xs" : "h-14 px-2.5 py-2 text-sm",
        item.wide && !compact ? "h-16" : ""
      )}
    >
      {item.preview ? (
        <FormulaInlinePreview latex={item.preview} />
      ) : (
        <span className="min-w-0 max-w-full truncate">{item.display}</span>
      )}
    </button>
  );
}

function FormulaInlinePreview({ latex }: { latex: string }) {
  const previewRef = useRef<HTMLSpanElement>(null);
  const html = useMemo(
    () =>
      katex.renderToString(latex, {
        displayMode: false,
        strict: "ignore",
        throwOnError: false,
      }),
    [latex]
  );

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    const resizeMath = () => {
      const math = preview.querySelector<HTMLElement>(".katex");
      if (!math) return;

      const availableWidth = preview.clientWidth;
      const neededWidth = math.scrollWidth;
      const scale = neededWidth > availableWidth && availableWidth > 0
        ? Math.max(0.58, Math.min(1, (availableWidth - 4) / neededWidth))
        : 1;

      preview.style.setProperty("--formula-preview-scale", scale.toString());
    };

    resizeMath();

    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resizeMath);
    observer?.observe(preview);
    window.addEventListener("resize", resizeMath);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", resizeMath);
    };
  }, [html]);

  return (
    <span
      ref={previewRef}
      className="formula-palette-preview flex h-full w-full min-w-0 max-w-full items-center justify-center overflow-hidden text-center text-[14px] leading-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
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
