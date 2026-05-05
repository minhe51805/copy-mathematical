"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Download, FileText, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MathRenderer } from "@/components/chat/math-renderer";
import {
  createFallbackExportDrafts,
  createOriginalExportDraft,
  type ExportDraft,
  type ExportDraftId,
} from "@/lib/export-drafts";
import { getApiUrl, hasRuntimeApi } from "@/lib/api-url";
import { generateDocx, downloadDocx } from "@/lib/docx-generator";
import { cn } from "@/lib/utils";

interface ExportDialogProps {
  content: string | null;
  request?: string | null;
  onClose: () => void;
}

interface DraftLoadState {
  key: string;
  drafts: ExportDraft[];
  error?: string | null;
}

export function ExportDialog({ content, request, onClose }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState<ExportDraftId>("original");
  const [draftLoadState, setDraftLoadState] = useState<DraftLoadState | null>(null);

  const contentKey = useMemo(
    () => content ? `${content}\n---request---\n${request ?? ""}` : "",
    [content, request]
  );

  const originalDraft = useMemo(
    () => content ? createOriginalExportDraft({ content, request }) : null,
    [content, request]
  );

  const loadedDrafts = draftLoadState?.key === contentKey ? draftLoadState.drafts : [];
  const isLoadingDrafts = Boolean(content && draftLoadState?.key !== contentKey);
  const drafts = originalDraft ? [originalDraft, ...loadedDrafts] : [];
  const selectedDraft = drafts.find((draft) => draft.id === selectedDraftId) ?? drafts[0] ?? null;
  const loadError = draftLoadState?.key === contentKey ? draftLoadState.error : null;

  useEffect(() => {
    if (!content) return;

    let cancelled = false;
    const sourceContent = content;
    const sourceRequest = request;

    async function loadDrafts() {
      try {
        if (!hasRuntimeApi()) {
          throw new Error("Static export has no runtime API");
        }

        const response = await fetch(getApiUrl("/api/export-variants"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: sourceContent, request: sourceRequest }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json() as { variants?: ExportDraft[] };
        const variants = data.variants?.length
          ? data.variants
          : createFallbackExportDrafts({ content: sourceContent, request: sourceRequest });

        if (!cancelled) {
          setDraftLoadState({
            key: contentKey,
            drafts: variants.slice(0, 3),
            error: null,
          });
        }
      } catch (error) {
        console.error("Failed to create export variants:", error);
        if (!cancelled) {
          setDraftLoadState({
            key: contentKey,
            drafts: createFallbackExportDrafts({ content: sourceContent, request: sourceRequest }),
            error: "Không tạo được phiên bản AI, đang dùng bản dự phòng.",
          });
        }
      }
    }

    loadDrafts();

    return () => {
      cancelled = true;
    };
  }, [content, contentKey, request]);

  const handleExport = async () => {
    if (!selectedDraft) return;

    setIsExporting(true);
    try {
      const blob = await generateDocx(selectedDraft.content, selectedDraft.title);
      downloadDocx(blob, selectedDraft.filename);
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={!!content} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="flex max-h-[90dvh] gap-0 overflow-hidden bg-[hsl(var(--background))] p-0 text-[hsl(var(--foreground))] shadow-2xl sm:max-w-6xl">
        <div className="flex min-h-0 w-full flex-col bg-[hsl(var(--background))]">
          <DialogHeader className="border-b bg-[hsl(var(--background))] px-6 py-5">
            <div className="flex items-start justify-between gap-4 pr-8">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5" />
                  Xuất nội dung vừa trả lời
                </DialogTitle>
                <DialogDescription className="mt-2 max-w-3xl">
                  Bản gốc là câu trả lời AI ngay phía trên. App sẽ tạo thêm 3 phiên bản bằng AI để bạn xem trước và chọn bản muốn xuất.
                </DialogDescription>
              </div>
              <div className="hidden rounded-full border bg-[hsl(var(--muted))] px-3 py-1 text-xs text-muted-foreground md:block">
                Word .docx
              </div>
            </div>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="min-h-0 border-b bg-[hsl(var(--card))] md:border-b-0 md:border-r">
              <div className="flex h-full min-h-0 flex-col">
                <div className="border-b bg-[hsl(var(--background))] p-4">
                  <p className="text-sm font-medium">Phiên bản để xuất</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Chọn một bản, xem preview bên phải rồi xuất file.
                  </p>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  <div className="grid gap-2">
                    {drafts.map((draft, index) => (
                      <DraftOption
                        key={draft.id}
                        draft={draft}
                        index={index}
                        selected={selectedDraft?.id === draft.id}
                        onSelect={() => setSelectedDraftId(draft.id)}
                      />
                    ))}

                    {isLoadingDrafts && (
                      <>
                        <LoadingDraftOption label="AI đang tạo bản tài liệu..." />
                        <LoadingDraftOption label="AI đang tạo bản chi tiết..." />
                        <LoadingDraftOption label="AI đang tạo bản handout..." />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            <section className="flex min-h-0 flex-col bg-[hsl(var(--background))]">
              <div className="border-b bg-[hsl(var(--background))] px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold">
                        {selectedDraft?.title ?? "Đang chuẩn bị nội dung"}
                      </h3>
                      {selectedDraft?.source === "ai" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs text-muted-foreground">
                          <Sparkles className="h-3 w-3" />
                          AI viết lại
                        </span>
                      )}
                      {selectedDraft?.source === "original" && (
                        <span className="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs text-muted-foreground">
                          Bản gốc
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedDraft?.description ?? "Đợi một chút để tạo các phiên bản xuất file."}
                    </p>
                  </div>
                  {selectedDraft && (
                    <div className="rounded-lg border px-3 py-2 text-xs text-muted-foreground">
                      {selectedDraft.filename}
                    </div>
                  )}
                </div>

                {request && (
                  <div className="mt-3 rounded-xl border bg-[hsl(var(--card))] p-3 text-sm">
                    <span className="font-medium">Yêu cầu xuất: </span>
                    <span className="text-muted-foreground">{request}</span>
                  </div>
                )}

                {loadError && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                    <RefreshCw className="h-4 w-4" />
                    {loadError}
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-[hsl(var(--card))] p-5">
                {selectedDraft ? (
                  <div className="mx-auto max-w-3xl rounded-2xl border bg-[hsl(var(--background))] p-5 shadow-sm">
                    <MathRenderer content={selectedDraft.content} />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Đang chuẩn bị preview...
                  </div>
                )}
              </div>
            </section>
          </div>

          <DialogFooter className="border-t bg-[hsl(var(--background))] px-6 py-4">
            <Button variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button onClick={handleExport} disabled={!selectedDraft || isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xuất...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Xuất bản đã chọn
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DraftOption({
  draft,
  index,
  selected,
  onSelect,
}: {
  draft: ExportDraft;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border bg-[hsl(var(--background))] p-3 text-left transition-colors hover:bg-[hsl(var(--accent))]",
        selected && "border-foreground bg-[hsl(var(--accent))]"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
          selected ? "border-foreground bg-foreground text-background" : "text-muted-foreground"
        )}
      >
        {selected ? <Check className="h-3.5 w-3.5" /> : index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{draft.title}</p>
          {draft.source === "ai" && <Sparkles className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {draft.description}
        </p>
      </div>
    </button>
  );
}

function LoadingDraftOption({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-[hsl(var(--background))] p-3 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}
