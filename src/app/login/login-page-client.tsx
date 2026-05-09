"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  FolderOpen,
  ImageIcon,
  KeyRound,
  MousePointer2,
  Plus,
  Presentation,
  Sigma,
  SkipForward,
  Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initializeTheme } from "@/hooks/use-theme";
import { isMockAuthenticated, loginMockUser, MOCK_AUTH_USER } from "@/lib/mock-auth";

const SHOWCASE_SCENES = ["headline", "switcher", "workspace", "building", "progress", "document", "tasks"] as const;

type ShowcaseScene = (typeof SHOWCASE_SCENES)[number];

export function LoginPageClient() {
  const router = useRouter();
  const [username, setUsername] = useState(MOCK_AUTH_USER.username);
  const [password, setPassword] = useState(MOCK_AUTH_USER.password);
  const [error, setError] = useState("");
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    initializeTheme();
    const timer = window.setTimeout(() => {
      setHasSession(isMockAuthenticated());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!loginMockUser(username, password)) {
      setError("Tài khoản hoặc mật khẩu chưa đúng.");
      return;
    }

    router.replace(getSafeNextPath());
  };

  const fillMockAccount = () => {
    setUsername(MOCK_AUTH_USER.username);
    setPassword(MOCK_AUTH_USER.password);
    setError("");
  };

  return (
    <main className="min-h-dvh overflow-hidden bg-[#141413] text-[#FAF9F5]">
      <header className="relative z-10">
        <div className="mx-auto flex h-20 w-full max-w-[1480px] items-center justify-between px-6 md:px-10">
          <Link className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/40" href="/">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D97757] text-white shadow-[rgba(217,119,87,0.22)_0px_8px_24px]">
              <Sigma className="h-5 w-5" />
            </div>
            <span className="font-serif text-3xl leading-none">AI Math</span>
          </Link>

          <Button asChild size="sm" variant="outline" className="border-white/20 bg-transparent text-[#FAF9F5] hover:bg-white/10 hover:text-white">
            <Link href="/">Trang chủ</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100dvh-80px)] w-full max-w-[1480px] gap-10 px-6 pb-8 md:px-10 lg:grid-cols-[minmax(420px,0.85fr)_minmax(520px,1.15fr)] lg:items-center">
        <div className="mx-auto w-full max-w-[430px] lg:mx-0 lg:pl-16 xl:pl-24">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="font-serif text-5xl font-normal leading-[1.05] md:text-6xl">
              Nghĩ nhanh,
              <br />
              giải nhanh hơn
            </h1>
            <p className="mt-6 text-lg font-semibold leading-7 text-[#FAF9F5]">Trợ lý toán học cho người giải quyết vấn đề</p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/12 bg-[#1B1A19] p-7 shadow-[rgba(0,0,0,0.22)_0px_24px_80px]">
            <button
              type="button"
              onClick={fillMockAccount}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[9.6px] border border-white/20 bg-transparent px-4 py-3 text-[15px] font-semibold leading-[22.5px] text-[#FAF9F5] transition-colors hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/40"
            >
              <KeyRound className="h-4 w-4 text-[#D97757]" />
              Điền tài khoản mock
            </button>

            <div className="my-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#FAF9F5]/75">
              <span className="h-px bg-white/12" />
              OR
              <span className="h-px bg-white/12" />
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label className="text-[#FAF9F5]/85" htmlFor="username">
                  Tài khoản
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder={MOCK_AUTH_USER.username}
                  autoComplete="username"
                  className="border-white/15 bg-[#2B2A28] text-[#FAF9F5] shadow-none placeholder:text-[#FAF9F5]/45 hover:border-white/25 focus-visible:border-[#D97757] focus-visible:ring-[#D97757]/25"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[#FAF9F5]/85" htmlFor="password">
                  Mật khẩu
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={MOCK_AUTH_USER.password}
                  autoComplete="current-password"
                  className="border-white/15 bg-[#2B2A28] text-[#FAF9F5] shadow-none placeholder:text-[#FAF9F5]/45 hover:border-white/25 focus-visible:border-[#D97757] focus-visible:ring-[#D97757]/25"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-[#E01E5A]/30 bg-[#E01E5A]/10 px-3 py-2 text-sm text-[#FFB3C4]">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full bg-[#FAF9F5] text-[#1F1E1D] hover:bg-white">
                Tiếp tục
                <ArrowRight className="h-4 w-4" />
              </Button>

              {hasSession && (
                <button
                  type="button"
                  onClick={() => router.replace(getSafeNextPath())}
                  className="min-h-10 text-sm font-medium text-[#FAF9F5]/75 transition-colors hover:text-[#FAF9F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/40"
                >
                  Đã có phiên đăng nhập, vào chat
                </button>
              )}
            </div>

            <p className="mt-5 text-xs leading-5 text-[#FAF9F5]/60">
              Tài khoản demo: {MOCK_AUTH_USER.username} / {MOCK_AUTH_USER.password}. Phiên đăng nhập mock được lưu trong trình duyệt local.
            </p>
          </form>
        </div>

        <ShowcaseCard />
      </section>
    </main>
  );
}

function ShowcaseCard() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = SHOWCASE_SCENES[sceneIndex] ?? "headline";

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSceneIndex((current) => (current + 1) % SHOWCASE_SCENES.length);
    }, 3600);

    return () => window.clearInterval(timer);
  }, []);

  const goToDocumentPreview = () => {
    setSceneIndex(SHOWCASE_SCENES.indexOf("document"));
  };

  const goToNextScene = () => {
    setSceneIndex((current) => (current + 1) % SHOWCASE_SCENES.length);
  };

  return (
    <aside className="relative mx-auto hidden h-[min(76dvh,760px)] min-h-[560px] w-full max-w-[720px] overflow-hidden rounded-[18px] border border-[#E6E1D8] bg-[#FAF9F5] text-[#141413] shadow-[rgba(0,0,0,0.24)_0px_28px_90px] lg:block">
      <ShowcaseAnimationStyles />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(31,30,29,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(31,30,29,0.055) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative flex justify-center pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToDocumentPreview}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3D3D3A] text-[#FAF9F5] shadow-[rgba(0,0,0,0.12)_0px_6px_16px]"
            aria-label="Mở preview tài liệu"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToNextScene}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3D3D3A] text-[#FAF9F5] shadow-[rgba(0,0,0,0.12)_0px_6px_16px]"
            aria-label="Xem cảnh tiếp theo"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative h-[calc(100%-48px)]" aria-live="polite">
        <div
          key={scene}
          className="absolute inset-0"
          style={{
            animation: "showcaseSceneIn 760ms cubic-bezier(0.22, 1, 0.36, 1) both",
          }}
        >
          {renderShowcaseScene(scene)}
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#1F1E1D]/10 bg-[#FAF9F5]/80 px-3 py-2 shadow-[rgba(0,0,0,0.08)_0px_8px_24px] backdrop-blur">
        {SHOWCASE_SCENES.map((item, index) => (
          <button
            key={item}
            type="button"
            onClick={() => setSceneIndex(index)}
            className={[
              "h-2 rounded-full transition-all",
              index === sceneIndex ? "w-6 bg-[#D97757]" : "w-2 bg-[#1F1E1D]/20 hover:bg-[#1F1E1D]/35",
            ].join(" ")}
            aria-label={`Chuyển tới cảnh ${index + 1}`}
          />
        ))}
      </div>
    </aside>
  );
}

function renderShowcaseScene(scene: ShowcaseScene) {
  switch (scene) {
    case "switcher":
      return <ModeSwitcherScene />;
    case "workspace":
      return <WorkspaceScene />;
    case "building":
      return <BuildingScene />;
    case "progress":
      return <ProgressScene />;
    case "document":
      return <DocumentScene />;
    case "tasks":
      return <TasksScene />;
    default:
      return <HeadlineScene />;
  }
}

function HeadlineScene() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-10 pb-20 text-center">
      <div className="mb-12 flex items-center gap-3">
        <Sigma className="h-10 w-10 text-[#D97757]" />
        <span className="font-serif text-5xl font-semibold">AI Math</span>
      </div>
      <h2 className="max-w-[620px] font-serif text-6xl font-normal leading-[1.06]">Trợ lý xử lý bài toán hằng ngày của bạn</h2>
      <MousePointer2 className="showcase-cursor mt-24 h-11 w-11 fill-black text-black drop-shadow-[0_5px_4px_rgba(0,0,0,0.28)]" />
    </div>
  );
}

function ModeSwitcherScene() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-10 pb-20">
      <div className="relative flex h-[88px] w-[520px] items-center rounded-[28px] border border-[#1F1E1D]/15 bg-[#EDEBE4]/80 p-1.5 shadow-[rgba(0,0,0,0.08)_0px_10px_26px]">
        <div className="showcase-mode-pill absolute left-1.5 top-1.5 h-[calc(100%-12px)] w-[calc(50%-6px)] rounded-[24px] bg-white shadow-[rgba(0,0,0,0.08)_0px_12px_30px]" />
        <div className="relative z-10 grid w-full grid-cols-2 text-center text-3xl">
          <span className="font-medium text-[#1F1E1D]">Chat</span>
          <span className="text-[#1F1E1D]/38">Math Studio</span>
        </div>
      </div>
      <MousePointer2 className="showcase-cursor mt-10 h-10 w-10 fill-black text-black drop-shadow-[0_5px_4px_rgba(0,0,0,0.28)]" />
    </div>
  );
}

function WorkspaceScene() {
  const actions = [
    { icon: FileText, label: "Tạo tài liệu" },
    { icon: Table2, label: "Đọc bảng điểm" },
    { icon: ImageIcon, label: "Nhận dạng ảnh" },
    { icon: Sigma, label: "Soạn công thức" },
    { icon: FolderOpen, label: "Sắp xếp file" },
    { icon: Presentation, label: "Xuất Word" },
  ];

  return (
    <div className="flex h-full items-center justify-center px-12 pb-16">
      <div className="w-full max-w-[590px]">
        <div className="grid grid-cols-3 gap-3 rounded-[22px] border border-[#1F1E1D]/12 bg-[#FAF9F5]/85 p-4 shadow-[rgba(0,0,0,0.08)_0px_16px_40px] backdrop-blur">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={action.label}
                className={[
                  "flex h-12 items-center gap-3 rounded-[9.6px] border border-[#1F1E1D]/12 px-3 text-sm",
                  index === 0 ? "bg-[#EDEBE4]" : "bg-white/70",
                ].join(" ")}
              >
                <Icon className="h-5 w-5 text-[#73726C]" />
                <span>{action.label}</span>
              </div>
            );
          })}
        </div>
        <div className="showcase-prompt mt-3 rounded-[22px] border border-[#1F1E1D]/12 bg-white p-4 shadow-[rgba(0,0,0,0.08)_0px_18px_46px]">
          <p className="text-lg">Giải toàn bộ file tích phân thành tài liệu Word</p>
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#1F1E1D]/12 bg-[#FAF9F5] px-3 text-sm">
                <FolderOpen className="h-4 w-4" />
                đề-thi.pdf
              </span>
              <Plus className="h-5 w-5 text-[#73726C]" />
            </div>
            <button className="h-11 rounded-[9.6px] bg-[#D97757] px-5 font-semibold text-white" type="button">
              Bắt đầu <ArrowRight className="ml-1 inline h-4 w-4" />
            </button>
          </div>
        </div>
        <MousePointer2 className="showcase-hand ml-16 mt-[-52px] h-12 w-12 fill-black text-black drop-shadow-[0_5px_4px_rgba(0,0,0,0.28)]" />
      </div>
    </div>
  );
}

function BuildingScene() {
  return (
    <div className="flex h-full items-center justify-center px-12 pb-16">
      <div className="flex items-center gap-4">
        <Sigma className="showcase-logo-spin h-16 w-16 text-[#D97757]" />
        <p className="font-serif text-5xl italic text-[#73726C]">
          <span className="showcase-typing">Đang dựng lời giải...</span>
        </p>
      </div>
    </div>
  );
}

function ProgressScene() {
  const items = [
    { label: "Đọc 35 trang tài liệu", done: true },
    { label: "Nhận dạng công thức", done: true },
    { label: "Tổng hợp lời giải", done: true },
    { label: "Xuất bản Word đẹp", done: false },
  ];

  return (
    <div className="flex h-full items-center justify-center px-12 pb-16">
      <div className="w-full max-w-[600px] rounded-[28px] border border-[#1F1E1D]/12 bg-white p-8 shadow-[rgba(0,0,0,0.08)_0px_20px_55px]">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-semibold">Progress</h2>
          <ChevronDown className="h-7 w-7 text-[#73726C]" />
        </div>
        <div className="grid gap-6">
          {items.map((item, index) => (
            <div key={item.label} className="flex items-center gap-5 text-2xl">
              <div
                className={[
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                  item.done ? "bg-[#2F8CDF] text-white" : "border-4 border-[#2F8CDF] bg-white text-[#1F1E1D]",
                ].join(" ")}
              >
                {item.done ? <Check className="h-7 w-7" /> : index + 1}
              </div>
              <span className={item.done ? "text-[#73726C] line-through" : "text-[#1F1E1D]"}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentScene() {
  return (
    <div className="flex h-full items-start justify-center px-10 pt-10">
      <div className="showcase-document h-[640px] w-full max-w-[560px] overflow-hidden rounded-[16px] border border-[#1F1E1D]/12 bg-[#E7E5DB] shadow-[rgba(0,0,0,0.12)_0px_22px_58px]">
        <div className="flex h-12 items-center justify-between border-b border-[#1F1E1D]/10 bg-white px-4">
          <p className="text-sm font-semibold">Tài liệu giải toán · DOCX</p>
          <span className="rounded-lg border border-[#1F1E1D]/12 px-3 py-1 text-xs font-semibold">Mở trong Word</span>
        </div>
        <div className="p-4">
          <div className="rounded-xl bg-[#202337] p-6 text-white">
            <p className="text-4xl font-semibold leading-tight">Tích phân vận dụng cao</p>
            <div className="mt-8 h-16 rounded-lg bg-[#88B7E5]" />
          </div>
          <div className="mt-4 rounded-xl bg-white p-6">
            <h3 className="font-serif text-2xl font-semibold">Tóm tắt kết quả</h3>
            <div className="mt-5 grid grid-cols-3 gap-4">
              {[
                ["50", "câu hỏi"],
                ["18", "công thức"],
                ["DOCX", "sẵn sàng"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-[#202337] p-4 text-center text-white">
                  <p className="font-serif text-4xl">{value}</p>
                  <p className="mt-3 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TasksScene() {
  const tasks = [
    ["Tạo đề cương ôn tập", true],
    ["Trích xuất công thức trong ảnh", false],
    ["Chuyển lời giải sang Word", true],
    ["Kiểm tra đáp án cuối", false],
    ["Lưu bộ câu hỏi vào thư viện", true],
  ] as const;

  return (
    <div className="flex h-full items-center justify-center px-12 pb-16">
      <div className="w-full max-w-[440px] rounded-[28px] bg-[#FAF9F5] p-8 shadow-[rgba(0,0,0,0.08)_0px_22px_60px]">
        <h2 className="font-serif text-3xl font-semibold">AI Math</h2>
        <div className="mt-6 flex items-center gap-3 text-xl">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#141413] text-white">
            <Plus className="h-5 w-5" />
          </span>
          Công việc mới
        </div>
        <div className="mt-7 grid gap-6">
          {tasks.map(([task, active]) => (
            <div key={task} className="flex items-center justify-between text-xl">
              <span className={active ? "text-[#1F1E1D]" : "text-[#73726C]"}>{task}</span>
              {!active && <span className="h-3 w-3 rounded-full bg-[#2F8CDF]" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShowcaseAnimationStyles() {
  return (
    <style>{`
      @keyframes showcaseSceneIn {
        from {
          opacity: 0;
          transform: translateY(18px) scale(0.985);
          filter: blur(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
        }
      }

      @keyframes showcaseCursor {
        0%, 100% { transform: translate3d(0, 0, 0) rotate(-10deg); }
        45% { transform: translate3d(18px, -12px, 0) rotate(-10deg) scale(0.96); }
        60% { transform: translate3d(18px, -12px, 0) rotate(-10deg) scale(0.88); }
      }

      @keyframes showcasePill {
        0%, 42% { transform: translateX(0); }
        50%, 92% { transform: translateX(100%); }
        100% { transform: translateX(0); }
      }

      @keyframes showcasePrompt {
        from { transform: translateY(26px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      @keyframes showcaseHand {
        0% { transform: translate3d(0, 28px, 0) rotate(-8deg); opacity: 0; }
        35% { opacity: 1; }
        70% { transform: translate3d(30px, 0, 0) rotate(-8deg) scale(0.92); }
        100% { transform: translate3d(30px, 0, 0) rotate(-8deg) scale(1); }
      }

      @keyframes showcaseLogoSpin {
        from { transform: rotate(0deg) scale(0.96); opacity: 0.75; }
        50% { transform: rotate(180deg) scale(1); opacity: 1; }
        to { transform: rotate(360deg) scale(0.96); opacity: 0.75; }
      }

      @keyframes showcaseTypingCaret {
        0%, 48% { border-color: rgba(31, 30, 29, 0.8); }
        49%, 100% { border-color: transparent; }
      }

      @keyframes showcaseDocument {
        from { transform: translateY(48px) scale(0.96); }
        to { transform: translateY(0) scale(1); }
      }

      .showcase-cursor { animation: showcaseCursor 2.8s ease-in-out infinite; }
      .showcase-mode-pill { animation: showcasePill 3.2s ease-in-out infinite; }
      .showcase-prompt { animation: showcasePrompt 720ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both; }
      .showcase-hand { animation: showcaseHand 1.8s cubic-bezier(0.22, 1, 0.36, 1) 300ms both; }
      .showcase-logo-spin { animation: showcaseLogoSpin 2.8s ease-in-out infinite; }
      .showcase-typing { border-right: 3px solid rgba(31, 30, 29, 0.8); animation: showcaseTypingCaret 800ms steps(1) infinite; }
      .showcase-document { animation: showcaseDocument 860ms cubic-bezier(0.22, 1, 0.36, 1) both; }

      @media (prefers-reduced-motion: reduce) {
        .showcase-cursor,
        .showcase-mode-pill,
        .showcase-prompt,
        .showcase-hand,
        .showcase-logo-spin,
        .showcase-typing,
        .showcase-document {
          animation: none !important;
        }
      }
    `}</style>
  );
}

function getSafeNextPath() {
  if (typeof window === "undefined") return "/newchat";

  const nextPath = new URLSearchParams(window.location.search).get("next");
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//") || nextPath.startsWith("/login")) {
    return "/newchat";
  }

  return nextPath;
}
