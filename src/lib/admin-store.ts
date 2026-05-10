import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export type AdminUserRole = "admin" | "teacher" | "student" | "operator";
export type AdminUserStatus = "active" | "disabled";

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: AdminUserRole;
  scope: string;
  status: AdminUserStatus;
  createdAt: string;
  lastActiveAt: string;
}

export interface AdminActivity {
  id: string;
  type: "provider" | "user" | "system";
  title: string;
  detail: string;
  actor: string;
  createdAt: string;
}

export interface AdminSettings {
  guestChatLimit: number;
}

const DATA_DIR = path.join(process.cwd(), ".admin-data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const ACTIVITY_FILE = path.join(DATA_DIR, "activity.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

const defaultSettings: AdminSettings = {
  guestChatLimit: 3,
};

const defaultUsers: AdminUser[] = [
  {
    id: "admin",
    username: "admin123",
    displayName: "Admin",
    role: "admin",
    scope: "Toan quyen dashboard",
    status: "active",
    createdAt: "2026-05-01T00:00:00.000Z",
    lastActiveAt: "2026-05-10T00:00:00.000Z",
  },
  {
    id: "teacher",
    username: "teacher",
    displayName: "Teacher Studio",
    role: "teacher",
    scope: "Soan giao an, tao de, quan ly tai lieu",
    status: "active",
    createdAt: "2026-05-01T00:00:00.000Z",
    lastActiveAt: "2026-05-10T00:00:00.000Z",
  },
  {
    id: "study",
    username: "study",
    displayName: "AI Math Chat",
    role: "student",
    scope: "Chat hoc tap va giai bai tap",
    status: "active",
    createdAt: "2026-05-01T00:00:00.000Z",
    lastActiveAt: "2026-05-10T00:00:00.000Z",
  },
];

export async function readAdminUsers() {
  const users = await readJsonFile<AdminUser[]>(USERS_FILE, defaultUsers);
  return users.length > 0 ? users : defaultUsers;
}

export async function createAdminUser(input: Partial<AdminUser>) {
  const users = await readAdminUsers();
  const username = normalizeUsername(input.username);

  if (!username) {
    throw new Error("Username is required");
  }

  if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username already exists");
  }

  const now = new Date().toISOString();
  const user: AdminUser = {
    id: randomUUID(),
    username,
    displayName: input.displayName?.trim() || username,
    role: normalizeRole(input.role),
    scope: input.scope?.trim() || getScopeForRole(normalizeRole(input.role)),
    status: normalizeStatus(input.status),
    createdAt: now,
    lastActiveAt: now,
  };

  await writeJsonFile(USERS_FILE, [...users, user]);
  await appendAdminActivity({
    type: "user",
    title: "Created user",
    detail: `${user.displayName} (${user.username})`,
    actor: "admin123",
  });

  return user;
}

export async function updateAdminUser(id: string, input: Partial<AdminUser>) {
  const users = await readAdminUsers();
  const index = users.findIndex((user) => user.id === id);

  if (index === -1) {
    throw new Error("User not found");
  }

  const current = users[index];
  const next: AdminUser = {
    ...current,
    displayName: input.displayName?.trim() || current.displayName,
    role: normalizeRole(input.role ?? current.role),
    scope: input.scope?.trim() || current.scope,
    status: current.id === "admin" ? "active" : normalizeStatus(input.status ?? current.status),
  };

  const nextUsers = [...users];
  nextUsers[index] = next;
  await writeJsonFile(USERS_FILE, nextUsers);
  await appendAdminActivity({
    type: "user",
    title: "Updated user",
    detail: `${next.displayName} (${next.username})`,
    actor: "admin123",
  });

  return next;
}

export async function deleteAdminUser(id: string) {
  if (id === "admin") {
    throw new Error("Admin user cannot be deleted");
  }

  const users = await readAdminUsers();
  const target = users.find((user) => user.id === id);

  if (!target) {
    throw new Error("User not found");
  }

  await writeJsonFile(USERS_FILE, users.filter((user) => user.id !== id));
  await appendAdminActivity({
    type: "user",
    title: "Deleted user",
    detail: `${target.displayName} (${target.username})`,
    actor: "admin123",
  });
}

export async function readAdminActivity(limit = 50) {
  const activity = await readJsonFile<AdminActivity[]>(ACTIVITY_FILE, []);
  return activity
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
}

export async function appendAdminActivity(input: Omit<AdminActivity, "id" | "createdAt">) {
  const activity = await readAdminActivity(200);
  const next: AdminActivity = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };

  await writeJsonFile(ACTIVITY_FILE, [next, ...activity].slice(0, 200));
  return next;
}

export async function readAdminSettings() {
  const settings = await readJsonFile<AdminSettings>(SETTINGS_FILE, defaultSettings);

  return {
    guestChatLimit: normalizeGuestChatLimit(settings.guestChatLimit),
  };
}

export async function updateAdminSettings(input: Partial<AdminSettings>) {
  const current = await readAdminSettings();
  const next: AdminSettings = {
    ...current,
    guestChatLimit: normalizeGuestChatLimit(input.guestChatLimit ?? current.guestChatLimit),
  };

  await writeJsonFile(SETTINGS_FILE, next);
  await appendAdminActivity({
    type: "system",
    title: "Updated guest limit",
    detail: `Guest chat limit: ${next.guestChatLimit}`,
    actor: "admin123",
  });

  return next;
}

function normalizeUsername(username: string | undefined) {
  return username?.trim().replace(/\s+/g, "-").toLowerCase() || "";
}

function normalizeRole(role: string | undefined): AdminUserRole {
  if (role === "admin" || role === "teacher" || role === "student" || role === "operator") {
    return role;
  }

  return "operator";
}

function normalizeStatus(status: string | undefined): AdminUserStatus {
  return status === "disabled" ? "disabled" : "active";
}

function getScopeForRole(role: AdminUserRole) {
  if (role === "admin") return "Toan quyen dashboard";
  if (role === "teacher") return "Soan giao an, tao de, quan ly tai lieu";
  if (role === "student") return "Chat hoc tap va giai bai tap";
  return "Van hanh noi bo";
}

function normalizeGuestChatLimit(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultSettings.guestChatLimit;
  return Math.max(0, Math.min(100, Math.floor(parsed)));
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, data: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
