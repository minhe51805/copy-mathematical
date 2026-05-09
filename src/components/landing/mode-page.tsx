import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  FileText,
  Gauge,
  MessageSquareText,
  Settings2,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { Button } from "@/components/ui/button";
import type { AssistantModeConfig } from "@/lib/assistant-modes";

interface ModePageProps {
  config: AssistantModeConfig;
  sibling: {
    href: string;
    label: string;
  };
}

export function ModePage({ config, sibling }: ModePageProps) {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <MarketingHeader active={config.id} />

      <section className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 py-12 md:px-10 md:py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(460px,1.1fr)] lg:items-center">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-lg border border-border/15 bg-card px-3 py-2 text-sm font-medium text-[hsl(var(--terracotta))] shadow-[var(--shadow-sm)]">
            {config.badge}
          </p>
          <h1 className="text-4xl font-normal leading-tight md:text-6xl md:leading-[1.08]">{config.title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-[17px]">{config.subtitle}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">
                Thử mode này
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={sibling.href}>{sibling.label}</Link>
            </Button>
          </div>
        </div>

        <ModeConfigPanel config={config} />
      </section>

      <section className="border-y border-border/10 bg-card/45">
        <div className="mx-auto grid w-full max-w-[1440px] gap-4 px-5 py-8 md:grid-cols-3 md:px-10">
          <SummaryCard icon={MessageSquareText} title="Đối tượng" text={config.audience} />
          <SummaryCard icon={ClipboardList} title="Tác vụ chính" text={config.primaryUse} />
          <SummaryCard
            icon={Gauge}
            title="Model preset"
            text={`${config.model.name} · temp ${config.model.temperature} · ${config.model.maxOutputTokens.toLocaleString("vi-VN")} tokens`}
          />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1440px] gap-5 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-2">
        <InfoList title="Điểm mạnh" items={config.strengths} tone="good" />
        <InfoList title="Điểm yếu cần kiểm soát" items={config.limits} tone="warn" />
      </section>

      <section className="border-y border-border/10 bg-card/45">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <h2 className="text-3xl font-normal md:text-5xl">Luồng phát triển đề xuất.</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Chat prompt hiện tại vẫn giữ nguyên. Workspace giáo viên dùng preset riêng; khi mở chat sẽ truyền
              `mode=teacher` khi cần workspace giáo viên; người học dùng `/newchat` để chat bình thường.
            </p>
          </div>
          <div className="grid gap-3">
            {config.workflow.map((step, index) => (
              <div
                key={step}
                className="grid gap-4 rounded-xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] sm:grid-cols-[44px_minmax(0,1fr)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-[9.6px] bg-[#1F1E1D] text-sm text-white dark:bg-[#FAF9F5] dark:text-[#1F1E1D]">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="text-3xl font-normal md:text-5xl">Đầu ra nên hỗ trợ.</h2>
          <div className="mt-6 grid gap-3">
            {config.outputs.map((output) => (
              <div key={output} className="rounded-xl border border-border/15 bg-card p-4 text-sm shadow-[var(--shadow-sm)]">
                {output}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] md:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-[hsl(var(--terracotta))]" />
            Prompt riêng để nối backend sau
          </div>
          <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-xl border border-border/15 bg-secondary p-4 text-[13px] leading-6 text-muted-foreground">
            {config.systemPrompt}
          </pre>
        </div>
      </section>
    </main>
  );
}

function ModeConfigPanel({ config }: { config: AssistantModeConfig }) {
  return (
    <div className="rounded-xl border border-border/15 bg-card p-4 shadow-[var(--shadow-md)]">
      <div className="rounded-xl border border-border/15 bg-secondary p-4">
        <div className="flex items-center justify-between gap-4 border-b border-border/15 pb-4">
          <div>
            <p className="text-sm font-semibold">Mode preset</p>
            <p className="mt-1 text-sm text-muted-foreground">{config.route}</p>
          </div>
          <span className="rounded-lg border border-[hsl(var(--terracotta))]/30 bg-[hsl(var(--terracotta))]/10 px-3 py-1 text-xs font-medium text-[hsl(var(--terracotta))]">
            Prompt riêng
          </span>
        </div>

        <div className="mt-4 grid gap-3">
          <ConfigRow label="Provider" value={config.model.provider} />
          <ConfigRow label="Model" value={config.model.name} />
          <ConfigRow label="Temperature" value={String(config.model.temperature)} />
          <ConfigRow label="Max output" value={`${config.model.maxOutputTokens.toLocaleString("vi-VN")} tokens`} />
        </div>

        <div className="mt-5 rounded-xl border border-border/15 bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Settings2 className="h-4 w-4 text-[hsl(var(--terracotta))]" />
            Gợi ý tích hợp
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Khi người dùng bấm thử mode, app có thể mở <code className="rounded bg-secondary px-1">{`/newchat?mode=${config.id}`}</code>.
            Backend đọc mode để gắn system prompt và tham số model riêng, còn prompt chat hiện tại vẫn giữ nguyên.
          </p>
        </div>
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border/15 bg-card px-3 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--terracotta))]">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="font-sans text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </article>
  );
}

function InfoList({ title, items, tone }: { title: string; items: string[]; tone: "good" | "warn" }) {
  const Icon = tone === "good" ? BadgeCheck : TriangleAlert;
  return (
    <section className="rounded-xl border border-border/15 bg-card p-5 shadow-[var(--shadow-sm)] md:p-6">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <ul className="mt-5 grid gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
            <Icon
              className={[
                "mt-0.5 h-4 w-4 shrink-0",
                tone === "good" ? "text-[hsl(var(--terracotta))]" : "text-[hsl(var(--warning))]",
              ].join(" ")}
            />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
