"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Plus,
  RefreshCw,
  ServerCog,
  Settings,
  ShieldCheck,
  ToggleRight,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isMockAuthenticated, MOCK_AUTH_USER } from "@/lib/mock-auth";
import { cn } from "@/lib/utils";

type ProviderId = "ai-gateway" | "gemini-aistudio";
type DashboardSection = "overview" | "providers" | "users" | "activity" | "settings";

interface ProviderSnapshot {
  provider: ProviderId;
  activeModel: string;
  gateway: {
    url: string;
    hasKey: boolean;
    model: string;
    preferredProvider: string;
    asyncTimeoutMs: string;
  };
  gemini: {
    hasKey: boolean;
    model: string;
  };
  envFile: string;
}

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "teacher" | "student" | "operator";
  scope: string;
  status: "active" | "disabled";
  createdAt: string;
  lastActiveAt: string;
}

interface AdminActivity {
  id: string;
  type: "provider" | "user" | "system";
  title: string;
  detail: string;
  actor: string;
  createdAt: string;
}

interface AdminSettings {
  guestChatLimit: number;
}

const providerOptions: Array<{
  id: ProviderId;
  name: string;
  description: string;
}> = [
  {
    id: "gemini-aistudio",
    name: "Gemini AI Studio",
    description: "Goi truc tiep Google Gemini bang key da setup trong env.",
  },
  {
    id: "ai-gateway",
    name: "AI Gateway",
    description: "Dung gateway rieng voi fallback va cau hinh noi bo.",
  },
];

const navItems: Array<{ section: DashboardSection; href: string; label: string; icon: typeof LayoutDashboard }> = [
  { section: "overview", href: "/dashboard", label: "Tong quan", icon: LayoutDashboard },
  { section: "providers", href: "/dashboard/providers", label: "Provider", icon: ServerCog },
  { section: "users", href: "/dashboard/users", label: "Nguoi dung", icon: UsersRound },
  { section: "activity", href: "/dashboard/activity", label: "Nhat ky", icon: Activity },
  { section: "settings", href: "/dashboard/settings", label: "Thiet lap", icon: Settings },
];

const quickLinks = [
  { href: "/newchat", label: "Test chat", description: "Gui anh hoac bai toan de kiem tra provider." },
  { href: "/teacher", label: "Teacher Studio", description: "Kiem tra upload tai lieu va tao de." },
  { href: "/", label: "Trang gioi thieu", description: "Xem landing page cua san pham." },
];

const roleLabels: Record<AdminUser["role"], string> = {
  admin: "Quan tri",
  teacher: "Giao vien",
  student: "Hoc sinh",
  operator: "Van hanh",
};

const sectionMeta: Record<DashboardSection, { title: string; subtitle: string }> = {
  overview: {
    title: "Tong quan he thong",
    subtitle: "Theo doi provider, nguoi dung, luong test va trang thai cau hinh.",
  },
  providers: {
    title: "Quan ly provider",
    subtitle: "Chuyen nhanh giua cac provider da setup san trong env.",
  },
  users: {
    title: "Quan ly nguoi dung",
    subtitle: "Them, khoa, xoa tai khoan noi bo dung trong khu admin.",
  },
  activity: {
    title: "Nhat ky he thong",
    subtitle: "Theo doi cac thao tac provider va nguoi dung gan day.",
  },
  settings: {
    title: "Thiet lap",
    subtitle: "Kiem tra cau hinh xac thuc va cac duong dan quan tri.",
  },
};

export function DashboardPageClient({ section = "overview" }: { section?: DashboardSection }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [switchingProvider, setSwitchingProvider] = useState<ProviderId | null>(null);
  const [message, setMessage] = useState("");
  const [snapshot, setSnapshot] = useState<ProviderSnapshot | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({ guestChatLimit: 3 });
  const [settingsForm, setSettingsForm] = useState({ guestChatLimit: "3" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [userForm, setUserForm] = useState({
    displayName: "",
    username: "",
    role: "teacher" as AdminUser["role"],
    scope: "",
    status: "active" as AdminUser["status"],
  });

  const loadProvider = useCallback(async () => {
    const response = await fetch("/api/admin/provider", {
      headers: { "x-admin-user": MOCK_AUTH_USER.username },
    });

    if (!response.ok) {
      throw new Error(`Provider HTTP ${response.status}`);
    }

    setSnapshot(await response.json() as ProviderSnapshot);
  }, []);

  const loadUsers = useCallback(async () => {
    const response = await fetch("/api/admin/users", {
      headers: { "x-admin-user": MOCK_AUTH_USER.username },
    });

    if (!response.ok) {
      throw new Error(`Users HTTP ${response.status}`);
    }

    const data = await response.json() as { users: AdminUser[] };
    setUsers(data.users);
  }, []);

  const loadActivity = useCallback(async () => {
    const response = await fetch("/api/admin/activity", {
      headers: { "x-admin-user": MOCK_AUTH_USER.username },
    });

    if (!response.ok) {
      throw new Error(`Activity HTTP ${response.status}`);
    }

    const data = await response.json() as { activity: AdminActivity[] };
    setActivity(data.activity);
  }, []);

  const loadSettings = useCallback(async () => {
    const response = await fetch("/api/admin/settings", {
      headers: { "x-admin-user": MOCK_AUTH_USER.username },
    });

    if (!response.ok) {
      throw new Error(`Settings HTTP ${response.status}`);
    }

    const data = await response.json() as { settings: AdminSettings };
    setSettings(data.settings);
    setSettingsForm({ guestChatLimit: String(data.settings.guestChatLimit) });
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      await Promise.all([loadProvider(), loadUsers(), loadActivity(), loadSettings()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Khong tai duoc dashboard.");
    } finally {
      setLoading(false);
    }
  }, [loadActivity, loadProvider, loadSettings, loadUsers]);

  useEffect(() => {
    const boot = async () => {
      if (!isMockAuthenticated()) {
        router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
        return;
      }

      setReady(true);
      await loadDashboard();
    };

    void boot();
  }, [loadDashboard, pathname, router]);

  async function switchProvider(provider: ProviderId) {
    setSwitchingProvider(provider);
    setMessage("");

    try {
      const response = await fetch("/api/admin/provider", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-user": MOCK_AUTH_USER.username,
        },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || `HTTP ${response.status}`);
      }

      const data = await response.json() as { config: ProviderSnapshot };
      setSnapshot(data.config);
      await loadActivity();
      setMessage("Da doi provider. Request tiep theo se dung cau hinh moi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Khong doi duoc provider.");
    } finally {
      setSwitchingProvider(null);
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingUser(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-user": MOCK_AUTH_USER.username,
        },
        body: JSON.stringify(userForm),
      });

      const data = await response.json() as { users?: AdminUser[]; error?: string };
      if (!response.ok || !data.users) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setUsers(data.users);
      setUserForm({ displayName: "", username: "", role: "teacher", scope: "", status: "active" });
      await loadActivity();
      setMessage("Da them nguoi dung moi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Khong them duoc nguoi dung.");
    } finally {
      setSavingUser(false);
    }
  }

  async function toggleUserStatus(user: AdminUser) {
    if (user.id === "admin") return;
    const nextStatus = user.status === "active" ? "disabled" : "active";
    setMessage("");

    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-user": MOCK_AUTH_USER.username,
      },
      body: JSON.stringify({ id: user.id, status: nextStatus }),
    });

    const data = await response.json() as { users?: AdminUser[]; error?: string };
    if (response.ok && data.users) {
      setUsers(data.users);
      await loadActivity();
      return;
    }

    setMessage(data.error || "Khong cap nhat duoc nguoi dung.");
  }

  async function deleteUser(user: AdminUser) {
    if (user.id === "admin") return;
    setMessage("");

    const response = await fetch(`/api/admin/users?id=${encodeURIComponent(user.id)}`, {
      method: "DELETE",
      headers: { "x-admin-user": MOCK_AUTH_USER.username },
    });

    const data = await response.json() as { users?: AdminUser[]; error?: string };
    if (response.ok && data.users) {
      setUsers(data.users);
      await loadActivity();
      return;
    }

    setMessage(data.error || "Khong xoa duoc nguoi dung.");
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingSettings(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-user": MOCK_AUTH_USER.username,
        },
        body: JSON.stringify({ guestChatLimit: Number(settingsForm.guestChatLimit) }),
      });

      const data = await response.json() as { settings?: AdminSettings; error?: string };
      if (!response.ok || !data.settings) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setSettings(data.settings);
      setSettingsForm({ guestChatLimit: String(data.settings.guestChatLimit) });
      await loadActivity();
      setMessage("Da cap nhat gioi han chat khach.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Khong luu duoc thiet lap.");
    } finally {
      setSavingSettings(false);
    }
  }

  const activeProviderName = snapshot?.provider === "gemini-aistudio" ? "Gemini AI Studio" : "AI Gateway";
  const meta = sectionMeta[section];

  if (!ready) {
    return <main className="min-h-screen bg-[#141413]" />;
  }

  return (
    <main className="min-h-screen bg-[#141413] text-[#FAF9F5]">
      <div className="flex min-h-screen">
        <AdminSidebar activeSection={section} />

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#141413]/95 backdrop-blur">
            <div className="flex min-h-16 flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#FAF9F5]/45">
                  <span>Admin</span>
                  <span>/</span>
                  <span>{meta.title}</span>
                </div>
                <h1 className="mt-1 text-2xl font-semibold tracking-normal">{meta.title}</h1>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={loadDashboard}
                  disabled={loading}
                  className="h-10 rounded-[9.6px] border-white/15 bg-transparent text-[#FAF9F5] hover:bg-white/10"
                >
                  {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
                  Lam moi
                </Button>
                <Button asChild className="h-10 rounded-[9.6px] bg-[#FAF9F5] text-[#141413] hover:bg-white">
                  <Link href="/newchat">
                    Test chat
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-[1480px] flex-1 flex-col gap-5 px-5 py-5">
            <section className="rounded-2xl border border-white/10 bg-[#1F1E1D] p-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-3xl">
                  <Badge className="mb-3 border-[#D97757]/35 bg-[#D97757]/10 text-[#FAF9F5]">
                    Admin dashboard
                  </Badge>
                  <h2 className="text-3xl font-semibold tracking-normal">{meta.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#FAF9F5]/62">{meta.subtitle}</p>
                </div>

                <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:min-w-[420px]">
                  <StatusPill label="Dang dung" value={activeProviderName} />
                  <StatusPill label="Model" value={snapshot?.activeModel ?? "Dang tai"} mono />
                </div>
              </div>
            </section>

            {message ? (
              <div className="rounded-2xl border border-[#D97757]/30 bg-[#D97757]/10 px-4 py-3 text-sm text-[#FAF9F5]">
                {message}
              </div>
            ) : null}

            {section === "overview" ? (
              <OverviewSection
                snapshot={snapshot}
                users={users}
                activity={activity}
                loading={loading}
                switchingProvider={switchingProvider}
                activeProviderName={activeProviderName}
                onSwitchProvider={switchProvider}
              />
            ) : null}

            {section === "providers" ? (
              <ProviderSection
                snapshot={snapshot}
                loading={loading}
                switchingProvider={switchingProvider}
                onSwitchProvider={switchProvider}
              />
            ) : null}

            {section === "users" ? (
              <UsersSection
                users={users}
                userForm={userForm}
                savingUser={savingUser}
                onFormChange={setUserForm}
                onCreateUser={createUser}
                onToggleUserStatus={toggleUserStatus}
                onDeleteUser={deleteUser}
              />
            ) : null}

            {section === "activity" ? <ActivitySection activity={activity} /> : null}

            {section === "settings" ? (
              <SettingsSection
                snapshot={snapshot}
                users={users}
                settings={settings}
                settingsForm={settingsForm}
                savingSettings={savingSettings}
                onSettingsFormChange={setSettingsForm}
                onSaveSettings={saveSettings}
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function OverviewSection({
  snapshot,
  users,
  activity,
  loading,
  switchingProvider,
  activeProviderName,
  onSwitchProvider,
}: {
  snapshot: ProviderSnapshot | null;
  users: AdminUser[];
  activity: AdminActivity[];
  loading: boolean;
  switchingProvider: ProviderId | null;
  activeProviderName: string;
  onSwitchProvider: (provider: ProviderId) => Promise<void>;
}) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Bot className="size-4" />}
          label="Provider dang chay"
          value={activeProviderName}
          detail={snapshot?.activeModel ?? "..."}
        />
        <MetricCard
          icon={<KeyRound className="size-4" />}
          label="Gemini AI Studio"
          value={snapshot?.gemini.hasKey ? "Da setup" : "Thieu key"}
          detail={snapshot?.gemini.model ?? "No model"}
        />
        <MetricCard
          icon={<ServerCog className="size-4" />}
          label="AI Gateway"
          value={snapshot?.gateway.hasKey ? "Da setup" : "Thieu key"}
          detail={snapshot?.gateway.model ?? "No model"}
        />
        <MetricCard
          icon={<UsersRound className="size-4" />}
          label="Nguoi dung"
          value={`${users.length} tai khoan`}
          detail={`${users.filter((user) => user.status === "active").length} dang hoat dong`}
        />
      </section>

      <section className="grid gap-5 2xl:grid-cols-[1.25fr_0.75fr]">
        <Panel title="Provider management" description="Chuyen provider da setup san trong env.">
          <ProviderTable
            snapshot={snapshot}
            loading={loading}
            switchingProvider={switchingProvider}
            onSwitch={onSwitchProvider}
          />
        </Panel>

        <Panel title="Quick actions" description="Mo nhanh cac khu vuc can test.">
          <div className="grid gap-3">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#D97757]/50 hover:bg-[#D97757]/10"
              >
                <span className="min-w-0">
                  <span className="block font-semibold">{item.label}</span>
                  <span className="mt-1 block text-sm leading-5 text-[#FAF9F5]/55">{item.description}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-[#FAF9F5]/45 transition group-hover:translate-x-0.5 group-hover:text-[#D97757]" />
              </Link>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 2xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Nguoi dung moi nhat" description="Quan ly nhanh tai khoan noi bo.">
          <CompactUserList users={users.slice(0, 4)} />
        </Panel>
        <Panel title="Nhat ky gan day" description="Cac thay doi moi trong dashboard.">
          <ActivityFeed activity={activity.slice(0, 5)} />
        </Panel>
      </section>
    </>
  );
}

function ProviderSection(props: {
  snapshot: ProviderSnapshot | null;
  loading: boolean;
  switchingProvider: ProviderId | null;
  onSwitchProvider: (provider: ProviderId) => Promise<void>;
}) {
  return (
    <Panel title="Provider management" description="Bang dieu khien provider AI dang dung cho chat, export va Math Studio.">
      <ProviderTable
        snapshot={props.snapshot}
        loading={props.loading}
        switchingProvider={props.switchingProvider}
        onSwitch={props.onSwitchProvider}
      />
    </Panel>
  );
}

function UsersSection({
  users,
  userForm,
  savingUser,
  onFormChange,
  onCreateUser,
  onToggleUserStatus,
  onDeleteUser,
}: {
  users: AdminUser[];
  userForm: Pick<AdminUser, "displayName" | "username" | "role" | "scope" | "status">;
  savingUser: boolean;
  onFormChange: (value: Pick<AdminUser, "displayName" | "username" | "role" | "scope" | "status">) => void;
  onCreateUser: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onToggleUserStatus: (user: AdminUser) => Promise<void>;
  onDeleteUser: (user: AdminUser) => Promise<void>;
}) {
  return (
    <section className="grid gap-5 2xl:grid-cols-[0.72fr_1.28fr]">
      <Panel title="Them nguoi dung" description="Tao tai khoan noi bo de quan ly vai tro trong dashboard.">
        <form className="grid gap-3" onSubmit={onCreateUser}>
          <TextField
            label="Ten hien thi"
            value={userForm.displayName}
            onChange={(value) => onFormChange({ ...userForm, displayName: value })}
            placeholder="Vi du: Nguyen Van A"
          />
          <TextField
            label="Username"
            value={userForm.username}
            onChange={(value) => onFormChange({ ...userForm, username: value })}
            placeholder="vi-du-user"
          />
          <label className="grid gap-2 text-sm font-medium">
            Vai tro
            <select
              value={userForm.role}
              onChange={(event) => onFormChange({ ...userForm, role: event.target.value as AdminUser["role"] })}
              className="h-11 rounded-[9.6px] border border-white/15 bg-[#2A2927] px-3 text-sm text-[#FAF9F5] outline-none focus:border-[#D97757]"
            >
              <option value="teacher">Giao vien</option>
              <option value="student">Hoc sinh</option>
              <option value="operator">Van hanh</option>
              <option value="admin">Quan tri</option>
            </select>
          </label>
          <TextField
            label="Quyen su dung"
            value={userForm.scope}
            onChange={(value) => onFormChange({ ...userForm, scope: value })}
            placeholder="De trong de app tu dien theo vai tro"
          />
          <Button type="submit" disabled={savingUser} className="mt-2 h-11 bg-[#FAF9F5] text-[#141413] hover:bg-white">
            {savingUser ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
            Them nguoi dung
          </Button>
        </form>
      </Panel>

      <Panel title="Danh sach nguoi dung" description="Khoa tai khoan hoac xoa nguoi dung khong con su dung.">
        <UserTable users={users} onToggleUserStatus={onToggleUserStatus} onDeleteUser={onDeleteUser} />
      </Panel>
    </section>
  );
}

function ActivitySection({ activity }: { activity: AdminActivity[] }) {
  return (
    <Panel title="Nhat ky he thong" description="Log duoc tao khi doi provider, them user, cap nhat user hoac xoa user.">
      <ActivityFeed activity={activity} />
    </Panel>
  );
}

function SettingsSection({
  snapshot,
  users,
  settings,
  settingsForm,
  savingSettings,
  onSettingsFormChange,
  onSaveSettings,
}: {
  snapshot: ProviderSnapshot | null;
  users: AdminUser[];
  settings: AdminSettings;
  settingsForm: { guestChatLimit: string };
  savingSettings: boolean;
  onSettingsFormChange: (value: { guestChatLimit: string }) => void;
  onSaveSettings: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <section className="grid gap-5 2xl:grid-cols-2">
      <Panel title="Guest chat" description="Nguoi chua dang nhap van vao /newchat duoc, nhung bi gioi han so lan gui.">
        <form className="grid gap-4" onSubmit={onSaveSettings}>
          <label className="grid gap-2 text-sm font-medium">
            So luot chat mien phi
            <input
              type="number"
              min={0}
              max={100}
              value={settingsForm.guestChatLimit}
              onChange={(event) => onSettingsFormChange({ guestChatLimit: event.target.value })}
              className="h-11 rounded-[9.6px] border border-white/15 bg-[#2A2927] px-3 text-sm text-[#FAF9F5] outline-none placeholder:text-[#FAF9F5]/35 focus:border-[#D97757]"
            />
          </label>
          <p className="text-sm leading-6 text-[#FAF9F5]/55">
            Hien tai khach duoc gui {settings.guestChatLimit} tin nhan. Dat 0 neu muon bat buoc dang nhap moi chat.
          </p>
          <Button type="submit" disabled={savingSettings} className="h-11 w-fit bg-[#FAF9F5] text-[#141413] hover:bg-white">
            {savingSettings ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Settings className="mr-2 size-4" />}
            Luu gioi han
          </Button>
        </form>
      </Panel>
      <Panel title="Cau hinh hien tai" description="Thong tin chi doc lay tu env va API noi bo.">
        <div className="grid gap-3">
          <InfoRow label="Env file" value={snapshot?.envFile ?? ".env.local"} />
          <InfoRow label="Provider" value={snapshot?.provider ?? "unknown"} />
          <InfoRow label="Model" value={snapshot?.activeModel ?? "unknown"} />
          <InfoRow label="Tong user" value={`${users.length}`} />
          <InfoRow label="Guest chat limit" value={`${settings.guestChatLimit}`} />
        </div>
      </Panel>
      <Panel title="Xac thuc admin" description="Dashboard chi cho tai khoan admin da dang nhap trong trinh duyet truy cap.">
        <div className="grid gap-3">
          <InfoRow label="Admin account" value={MOCK_AUTH_USER.username} />
          <InfoRow label="Login URL" value="/login" />
          <InfoRow label="Dashboard URL" value="/dashboard" />
          <InfoRow label="Provider API" value="/api/admin/provider" />
        </div>
      </Panel>
    </section>
  );
}

function AdminSidebar({ activeSection }: { activeSection: DashboardSection }) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#1B1A19] p-4 lg:flex lg:flex-col">
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="flex size-11 items-center justify-center rounded-xl bg-[#D97757] text-lg font-semibold text-white">
          Σ
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">AI Math Admin</p>
          <p className="text-xs text-[#FAF9F5]/55">CMS noi bo</p>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.section}
            href={item.href}
            className={cn(
              "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm transition",
              activeSection === item.section
                ? "bg-[#D97757]/14 text-[#FAF9F5]"
                : "text-[#FAF9F5]/62 hover:bg-white/[0.05] hover:text-[#FAF9F5]"
            )}
          >
            <item.icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#D97757]/18 text-[#FAF9F5]">
            <UserRound className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{MOCK_AUTH_USER.displayName}</p>
            <p className="truncate text-xs text-[#FAF9F5]/50">admin123</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ProviderTable({
  snapshot,
  loading,
  switchingProvider,
  onSwitch,
}: {
  snapshot: ProviderSnapshot | null;
  loading: boolean;
  switchingProvider: ProviderId | null;
  onSwitch: (provider: ProviderId) => Promise<void>;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="bg-white/[0.035] text-xs uppercase tracking-[0.08em] text-[#FAF9F5]/45">
          <tr>
            <th className="px-4 py-3 font-medium">Provider</th>
            <th className="px-4 py-3 font-medium">Model</th>
            <th className="px-4 py-3 font-medium">Key</th>
            <th className="px-4 py-3 font-medium">Trang thai</th>
            <th className="px-4 py-3 text-right font-medium">Thao tac</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {providerOptions.map((item) => {
            const info = getProviderInfo(item.id, snapshot);
            const active = snapshot?.provider === item.id;
            const busy = switchingProvider === item.id;

            return (
              <tr key={item.id} className={cn("transition hover:bg-white/[0.035]", active ? "bg-[#D97757]/8" : "")}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-white/[0.06] text-[#D97757]">
                      {item.id === "gemini-aistudio" ? <KeyRound className="size-4" /> : <ServerCog className="size-4" />}
                    </span>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs leading-5 text-[#FAF9F5]/45">{item.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 font-mono text-xs text-[#FAF9F5]/75">{info.model}</td>
                <td className="px-4 py-4">
                  <Badge className={cn(
                    "border text-xs",
                    info.hasKey
                      ? "border-[#D97757]/30 bg-[#D97757]/10 text-[#FAF9F5]"
                      : "border-white/10 bg-white/[0.04] text-[#FAF9F5]/55"
                  )}>
                    {info.hasKey ? "Da setup" : "Thieu key"}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  {active ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#FAF9F5]">
                      <CheckCircle2 className="size-4 text-[#D97757]" />
                      Dang chay
                    </span>
                  ) : (
                    <span className="text-[#FAF9F5]/45">Du phong</span>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onSwitch(item.id)}
                    disabled={loading || active || Boolean(switchingProvider)}
                    className={cn(
                      "h-9 rounded-lg",
                      active
                        ? "bg-white/15 text-[#FAF9F5]"
                        : "bg-[#FAF9F5] text-[#141413] hover:bg-white"
                    )}
                  >
                    {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ToggleRight className="mr-2 size-4" />}
                    {active ? "Dang dung" : "Chuyen sang"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UserTable({
  users,
  onToggleUserStatus,
  onDeleteUser,
}: {
  users: AdminUser[];
  onToggleUserStatus: (user: AdminUser) => Promise<void>;
  onDeleteUser: (user: AdminUser) => Promise<void>;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="bg-white/[0.035] text-xs uppercase tracking-[0.08em] text-[#FAF9F5]/45">
          <tr>
            <th className="px-4 py-3 font-medium">Tai khoan</th>
            <th className="px-4 py-3 font-medium">Vai tro</th>
            <th className="px-4 py-3 font-medium">Trang thai</th>
            <th className="px-4 py-3 text-right font-medium">Thao tac</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-white/[0.035]">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#D97757]/18 text-sm font-semibold">
                    {user.displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{user.displayName}</p>
                    <p className="truncate text-xs text-[#FAF9F5]/45">{user.username}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <p className="font-medium">{roleLabels[user.role]}</p>
                <p className="mt-1 text-xs text-[#FAF9F5]/45">{user.scope}</p>
              </td>
              <td className="px-4 py-4">
                <Badge className={cn(
                  "border text-xs",
                  user.status === "active"
                    ? "border-[#D97757]/30 bg-[#D97757]/10 text-[#FAF9F5]"
                    : "border-white/10 bg-white/[0.04] text-[#FAF9F5]/55"
                )}>
                  {user.status === "active" ? "Dang hoat dong" : "Da khoa"}
                </Badge>
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleUserStatus(user)}
                    disabled={user.id === "admin"}
                    className="h-9 border-white/15 bg-transparent text-[#FAF9F5] hover:bg-white/10"
                  >
                    {user.status === "active" ? "Khoa" : "Mo khoa"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteUser(user)}
                    disabled={user.id === "admin"}
                    className="h-9 border-white/15 bg-transparent text-[#FAF9F5] hover:bg-white/10"
                  >
                    <Trash2 className="mr-2 size-4" />
                    Xoa
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompactUserList({ users }: { users: AdminUser[] }) {
  return (
    <div className="grid gap-3">
      {users.map((user) => (
        <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.displayName}</p>
            <p className="truncate text-sm text-[#FAF9F5]/50">{roleLabels[user.role]} · {user.username}</p>
          </div>
          <Badge className="border-white/10 bg-white/[0.04] text-xs text-[#FAF9F5]/70">
            {user.status === "active" ? "Active" : "Locked"}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function ActivityFeed({ activity }: { activity: AdminActivity[] }) {
  if (activity.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-[#FAF9F5]/55">
        Chua co log nao. Hay doi provider hoac them nguoi dung de tao nhat ky.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activity.map((item) => (
        <div key={item.id} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#D97757]">
            {item.type === "provider" ? <ServerCog className="size-4" /> : item.type === "user" ? <UsersRound className="size-4" /> : <ShieldCheck className="size-4" />}
          </span>
          <span className="min-w-0">
            <span className="block font-medium">{item.title}</span>
            <span className="mt-1 block text-sm text-[#FAF9F5]/50">{item.detail}</span>
            <span className="mt-2 block text-xs text-[#FAF9F5]/35">{formatDateTime(item.createdAt)} by {item.actor}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-[9.6px] border border-white/15 bg-[#2A2927] px-3 text-sm text-[#FAF9F5] outline-none placeholder:text-[#FAF9F5]/35 focus:border-[#D97757]"
      />
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <span className="text-sm text-[#FAF9F5]/55">{label}</span>
      <span className="truncate font-mono text-sm">{value}</span>
    </div>
  );
}

function getProviderInfo(provider: ProviderId, snapshot: ProviderSnapshot | null) {
  if (provider === "gemini-aistudio") {
    return {
      model: snapshot?.gemini.model ?? "No model",
      hasKey: Boolean(snapshot?.gemini.hasKey),
    };
  }

  return {
    model: snapshot?.gateway.model ?? "No model",
    hasKey: Boolean(snapshot?.gateway.hasKey),
  };
}

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1F1E1D]">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-[#FAF9F5]/55">{description}</p> : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function MetricCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1F1E1D] p-4">
      <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-white/[0.06] text-[#D97757]">
        {icon}
      </div>
      <p className="text-xs uppercase tracking-[0.08em] text-[#FAF9F5]/40">{label}</p>
      <p className="mt-2 truncate text-lg font-semibold">{value}</p>
      <p className="mt-1 truncate font-mono text-xs text-[#FAF9F5]/50">{detail}</p>
    </div>
  );
}

function StatusPill({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <p className="text-xs text-[#FAF9F5]/45">{label}</p>
      <p className={cn("mt-1 truncate text-sm font-semibold", mono ? "font-mono" : "")}>{value}</p>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", { hour12: false });
}
