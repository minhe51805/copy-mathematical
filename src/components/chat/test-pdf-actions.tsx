"use client";

import { useMemo, useState } from "react";
import { FileCheck2, FileDown, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseTestPaper } from "@/lib/test-paper";
import { exportTestPdf, exportTestWord } from "@/lib/test-pdf-export";
import { cn } from "@/lib/utils";

interface TestPdfActionsProps {
  content: string;
}

type ExportVariant = "questions" | "answers";
type ExportFormat = "pdf" | "word";
type ExportTarget = {
  variant: ExportVariant;
  format: ExportFormat;
};

export function TestPdfActions({ content }: TestPdfActionsProps) {
  const paper = useMemo(() => parseTestPaper(content), [content]);
  const [activeExport, setActiveExport] = useState<ExportTarget | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!paper.questions.length) return null;

  const handleExport = async (target: ExportTarget) => {
    if (activeExport) return;

    setError(null);
    setActiveExport(target);
    try {
      const options = { variant: target.variant, title: paper.title };
      if (target.format === "pdf") {
        await exportTestPdf(content, options);
      } else {
        await exportTestWord(content, options);
      }
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Không xuất file được.");
    } finally {
      setActiveExport(null);
    }
  };

  return (
    <div
      data-copy-ui="true"
      className="mt-4 w-full max-w-2xl rounded-xl border border-border/15 bg-card p-4 shadow-[var(--shadow-sm)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-[hsl(var(--terracotta))]">
              <FileCheck2 className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                Xuất đề kiểm tra
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                Gom {paper.questions.length} câu trong lượt hiện tại, không gọi AI.
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <ExportButton
            label="Đề PDF"
            format="pdf"
            loading={isActive(activeExport, "questions", "pdf")}
            onClick={() => handleExport({ variant: "questions", format: "pdf" })}
          />
          <ExportButton
            label="Đáp án PDF"
            format="pdf"
            loading={isActive(activeExport, "answers", "pdf")}
            onClick={() => handleExport({ variant: "answers", format: "pdf" })}
            accent
          />
          <ExportButton
            label="Đề Word"
            format="word"
            loading={isActive(activeExport, "questions", "word")}
            onClick={() => handleExport({ variant: "questions", format: "word" })}
          />
          <ExportButton
            label="Đáp án Word"
            format="word"
            loading={isActive(activeExport, "answers", "word")}
            onClick={() => handleExport({ variant: "answers", format: "word" })}
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function isActive(active: ExportTarget | null, variant: ExportVariant, format: ExportFormat) {
  return active?.variant === variant && active.format === format;
}

function ExportButton({
  label,
  loading,
  accent,
  format,
  onClick,
}: {
  label: string;
  loading: boolean;
  accent?: boolean;
  format: ExportFormat;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={accent ? "default" : "outline"}
      className={cn(
        "h-9 gap-2 rounded-[9.6px] px-3 text-xs",
        accent && "bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--terracotta))]/90"
      )}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : format === "word" ? (
        <FileText className="h-3.5 w-3.5" />
      ) : (
        <FileDown className="h-3.5 w-3.5" />
      )}
      {label}
    </Button>
  );
}
