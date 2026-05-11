"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  createFullCopyExportDrafts,
  createOriginalExportDraft,
  type ExportDraft,
  type ExportDraftId,
} from "@/lib/export-drafts";
import { isFullCopyRequest } from "@/lib/attachment-content";
import { getApiUrl, hasRuntimeApi } from "@/lib/api-url";
import { generateDocx, downloadDocx, getWordExportFilename } from "@/lib/docx-generator";
import { exportElementAsPdf } from "@/lib/test-pdf-export";
import { cn } from "@/lib/utils";

type ExportFormat = "word" | "pdf";

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

const EXPORT_DRAFT_CACHE_KEY = "math-chat-export-draft-cache-v2";
const MAX_CACHED_EXPORTS = 20;

export function ExportDialog({ content, request, onClose }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("word");
  const [selectedDraftState, setSelectedDraftState] = useState<{
    contentKey: string;
    draftId: ExportDraftId;
  }>({ contentKey: "", draftId: "original" });
  const [draftLoadStates, setDraftLoadStates] = useState<Record<string, DraftLoadState>>(
    () => readCachedDraftStates()
  );
  const loadingKeysRef = useRef(new Set<string>());
  const previewRef = useRef<HTMLDivElement>(null);

  const contentKey = useMemo(
    () => content ? createExportCacheKey(content, request) : "",
    [content, request]
  );

  const originalDraft = useMemo(
    () => content ? createOriginalExportDraft({ content, request }) : null,
    [content, request]
  );

  const shouldUseLocalFullCopyDrafts = useMemo(
    () => shouldUseLocalFullCopyExport(content, request),
    [content, request]
  );
  const localFullCopyDrafts = useMemo(
    () => content && shouldUseLocalFullCopyDrafts
      ? createFullCopyExportDrafts({ content, request })
      : [],
    [content, request, shouldUseLocalFullCopyDrafts]
  );

  const draftLoadState = useMemo(
    () => shouldUseLocalFullCopyDrafts
      ? { key: contentKey, drafts: localFullCopyDrafts, error: null }
      : contentKey
        ? draftLoadStates[contentKey] ?? null
        : null,
    [contentKey, draftLoadStates, localFullCopyDrafts, shouldUseLocalFullCopyDrafts]
  );
  const loadedDrafts = draftLoadState?.drafts ?? [];
  const isLoadingDrafts = Boolean(content && !draftLoadState && !shouldUseLocalFullCopyDrafts);
  const drafts = originalDraft ? [originalDraft, ...loadedDrafts] : [];
  const selectedDraftId = selectedDraftState.contentKey === contentKey
    ? selectedDraftState.draftId
    : "original";
  const selectedDraft = drafts.find((draft) => draft.id === selectedDraftId) ?? drafts[0] ?? null;
  const loadError = draftLoadState?.error ?? null;

  useEffect(() => {
    if (shouldUseLocalFullCopyDrafts) return;
    if (!content || !contentKey || draftLoadState || loadingKeysRef.current.has(contentKey)) return;

    let cancelled = false;
    const sourceContent = content;
    const sourceRequest = request;
    const loadingKeys = loadingKeysRef.current;
    loadingKeys.add(contentKey);

    const saveDraftState = (state: DraftLoadState) => {
      setDraftLoadStates((current) => ({ ...current, [contentKey]: state }));
      writeCachedDraftState(state);
    };

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
          saveDraftState({
            key: contentKey,
            drafts: variants.slice(0, 3),
            error: null,
          });
        }
      } catch (error) {
        console.error("Failed to create export variants:", error);
        if (!cancelled) {
          saveDraftState({
            key: contentKey,
            drafts: createFallbackExportDrafts({ content: sourceContent, request: sourceRequest }),
            error: "Không tạo được phiên bản AI, đang dùng bản dự phòng.",
          });
        }
      } finally {
        loadingKeys.delete(contentKey);
      }
    }

    loadDrafts();

    return () => {
      cancelled = true;
      loadingKeys.delete(contentKey);
    };
  }, [content, contentKey, draftLoadState, request, shouldUseLocalFullCopyDrafts]);

  const handleExport = async () => {
    if (!selectedDraft) return;

    setIsExporting(true);
    try {
      if (exportFormat === "pdf") {
        await exportElementAsPdf(previewRef.current, toPdfFilename(selectedDraft.filename));
      } else {
        const blob = await generateDocx(selectedDraft.content, selectedDraft.title, previewRef.current);
        downloadDocx(blob, selectedDraft.filename);
      }
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
      <DialogContent className="flex max-h-[90dvh] gap-0 overflow-hidden border-border/15 bg-card p-0 text-foreground shadow-[var(--shadow-md)] sm:max-w-6xl">
        <div className="flex min-h-0 w-full flex-col bg-card">
          <DialogHeader className="border-b border-border/15 bg-card px-6 py-5">
            <div className="flex items-start justify-between gap-4 pr-8">
              <div>
                <DialogTitle className="flex items-center gap-2 text-2xl font-semibold">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))]">
                    <FileText className="h-[18px] w-[18px]" />
                  </span>
                  Xuất nội dung vừa trả lời
                </DialogTitle>
                <DialogDescription className="mt-2 max-w-3xl">
                  {shouldUseLocalFullCopyDrafts
                    ? "Yêu cầu này cần lấy toàn bộ tài liệu, nên app dùng trực tiếp nội dung đã trích xuất từ file và không để AI tóm tắt."
                    : "Bản gốc là câu trả lời AI ngay phía trên. App sẽ tạo thêm 3 phiên bản bằng AI để bạn xem trước và chọn bản muốn xuất."}
                </DialogDescription>
              </div>
              <FormatToggle value={exportFormat} onChange={setExportFormat} />
            </div>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="min-h-0 border-b border-border/15 bg-background md:border-b-0 md:border-r">
              <div className="flex h-full min-h-0 flex-col">
                <div className="border-b border-border/15 bg-card p-4">
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
                        onSelect={() => setSelectedDraftState({ contentKey, draftId: draft.id })}
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

            <section className="flex min-h-0 flex-col bg-card">
              <div className="border-b border-border/15 bg-card px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold">
                        {selectedDraft?.title ?? "Đang chuẩn bị nội dung"}
                      </h3>
                      {selectedDraft?.source === "ai" && (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-border/15 bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                          <Sparkles className="h-3 w-3" />
                          AI viết lại
                        </span>
                      )}
                      {selectedDraft?.source === "original" && (
                        <span className="rounded-lg border border-border/15 bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                          Bản gốc
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedDraft?.description ?? "Đợi một chút để tạo các phiên bản xuất file."}
                    </p>
                  </div>
                  {selectedDraft && (
                    <div className="rounded-lg border border-border/15 bg-secondary px-3 py-2 text-xs text-muted-foreground">
                      {exportFormat === "pdf"
                        ? toPdfFilename(selectedDraft.filename)
                        : getWordExportFilename(selectedDraft.filename)}
                    </div>
                  )}
                </div>

                {request && (
                  <div className="mt-3 rounded-xl border border-border/15 bg-secondary p-3 text-sm">
                    <span className="font-medium">Yêu cầu xuất: </span>
                    <span className="text-muted-foreground">{request}</span>
                  </div>
                )}

                {loadError && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10 p-3 text-sm text-[#B45309] dark:text-amber-300">
                    <RefreshCw className="h-4 w-4" />
                    {loadError}
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-background p-5">
                {selectedDraft ? (
                  <div ref={previewRef} className="mx-auto max-w-3xl rounded-xl border border-border/15 bg-card p-6 shadow-[var(--shadow-sm)]">
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

          <DialogFooter className="border-t border-border/15 bg-card px-6 py-4">
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
                  Xuất {exportFormat === "pdf" ? "PDF" : "Word"}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FormatToggle({
  value,
  onChange,
}: {
  value: ExportFormat;
  onChange: (format: ExportFormat) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Dạng file xuất"
      className="hidden items-center gap-1 rounded-full border border-border/15 bg-secondary p-1 text-xs md:inline-flex"
    >
      <FormatToggleButton
        active={value === "word"}
        label="Word .doc"
        onClick={() => onChange("word")}
      />
      <FormatToggleButton
        active={value === "pdf"}
        label="PDF"
        onClick={() => onChange("pdf")}
      />
    </div>
  );
}

function FormatToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 transition-colors",
        active
          ? "bg-card text-foreground shadow-[var(--shadow-sm)]"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

function toPdfFilename(filename = "math-chat.pdf") {
  const trimmed = filename.trim() || "math-chat.pdf";
  return trimmed.replace(/\.(docx|doc|pdf)$/i, "") + ".pdf";
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
        "flex w-full items-start gap-3 rounded-xl border border-border/15 bg-card p-3 text-left shadow-[var(--shadow-sm)] transition-all hover:border-border/30 hover:bg-secondary",
        selected && "border-[hsl(var(--terracotta))]/70 bg-secondary shadow-[var(--shadow-md)]"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
          selected ? "border-[hsl(var(--terracotta))] bg-[hsl(var(--terracotta))] text-white" : "text-muted-foreground"
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
    <div className="flex items-center gap-3 rounded-xl border border-border/15 bg-card p-3 text-sm text-muted-foreground shadow-[var(--shadow-sm)]">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

interface CachedDraftState {
  key: string;
  drafts: ExportDraft[];
  error?: string | null;
  updatedAt: number;
}

function createExportCacheKey(content: string, request?: string | null) {
  const source = `${content}\n---request---\n${request ?? ""}`;
  return `${hashString(source)}-${content.length}-${request?.length ?? 0}`;
}

function readCachedDraftStates(): Record<string, DraftLoadState> {
  const cachedStates = readCachedDraftStore();

  return Object.fromEntries(
    Object.values(cachedStates)
      .filter(isUsableCachedDraftState)
      .map((cachedState) => [
        cachedState.key,
        {
          key: cachedState.key,
          drafts: cachedState.drafts,
          error: cachedState.error ?? null,
        },
      ])
  );
}

function writeCachedDraftState(state: DraftLoadState) {
  if (typeof window === "undefined" || !state.drafts.length) return;

  try {
    const cachedStore = readCachedDraftStore();
    cachedStore[state.key] = {
      key: state.key,
      drafts: state.drafts,
      error: state.error ?? null,
      updatedAt: Date.now(),
    };

    const trimmedStore = Object.fromEntries(
      Object.entries(cachedStore)
        .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_CACHED_EXPORTS)
    );

    localStorage.setItem(EXPORT_DRAFT_CACHE_KEY, JSON.stringify(trimmedStore));
  } catch {
    // Export drafts are a convenience cache. If storage is full, the app can still recreate them.
  }
}

function readCachedDraftStore(): Record<string, CachedDraftState> {
  if (typeof window === "undefined") return {};

  try {
    const value = localStorage.getItem(EXPORT_DRAFT_CACHE_KEY);
    if (!value) return {};

    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed as Record<string, CachedDraftState>;
  } catch {
    return {};
  }
}

function isUsableCachedDraftState(value: unknown): value is CachedDraftState {
  return Boolean(
    value
      && typeof value === "object"
      && "key" in value
      && typeof value.key === "string"
      && "drafts" in value
      && Array.isArray(value.drafts)
      && value.drafts.length > 0
      && value.drafts.every(isExportDraft)
  );
}

function isExportDraft(value: unknown): value is ExportDraft {
  return Boolean(
    value
      && typeof value === "object"
      && "id" in value
      && typeof value.id === "string"
      && "title" in value
      && typeof value.title === "string"
      && "description" in value
      && typeof value.description === "string"
      && "filename" in value
      && typeof value.filename === "string"
      && "content" in value
      && typeof value.content === "string"
      && "source" in value
      && typeof value.source === "string"
  );
}

function shouldUseLocalFullCopyExport(content: string | null, request?: string | null) {
  if (request && isFullCopyRequest(request)) {
    return true;
  }

  if (!content || content.length < 12_000) {
    return false;
  }

  const questionCount = content.match(/(?:^|\n)\s*(?:#{1,6}\s*)?(?:Câu|Cau|Bài|Bai)\s*\d+/gi)?.length ?? 0;
  return questionCount >= 8;
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}
