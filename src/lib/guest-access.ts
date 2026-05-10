"use client";

export const DEFAULT_GUEST_CHAT_LIMIT = 3;
export const GUEST_USAGE_STORAGE_KEY = "ai-math-guest-chat-usage";
export const GUEST_PENDING_PROMPT_KEY = "ai-math-guest-pending-prompt";

interface GuestUsage {
  used: number;
  updatedAt: number;
}

export function getGuestUsage(): GuestUsage {
  if (typeof window === "undefined") {
    return { used: 0, updatedAt: 0 };
  }

  try {
    const raw = window.localStorage.getItem(GUEST_USAGE_STORAGE_KEY);
    if (!raw) return { used: 0, updatedAt: 0 };

    const parsed = JSON.parse(raw) as Partial<GuestUsage>;
    return {
      used: Math.max(0, Number(parsed.used) || 0),
      updatedAt: Number(parsed.updatedAt) || 0,
    };
  } catch {
    return { used: 0, updatedAt: 0 };
  }
}

export function incrementGuestUsage() {
  if (typeof window === "undefined") return { used: 0, updatedAt: 0 };

  const next = {
    used: getGuestUsage().used + 1,
    updatedAt: Date.now(),
  };

  window.localStorage.setItem(GUEST_USAGE_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("guest-chat-usage-change", { detail: next }));
  return next;
}

export function resetGuestUsage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_USAGE_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("guest-chat-usage-change", { detail: getGuestUsage() }));
}

export function getRemainingGuestChats(limit: number) {
  return Math.max(0, normalizeGuestLimit(limit) - getGuestUsage().used);
}

export function normalizeGuestLimit(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_GUEST_CHAT_LIMIT;
  return Math.max(0, Math.min(100, Math.floor(parsed)));
}

export function setPendingGuestPrompt(prompt: string) {
  if (typeof window === "undefined") return;
  const value = prompt.trim();
  if (!value) return;
  window.localStorage.setItem(GUEST_PENDING_PROMPT_KEY, value);
}

export function getPendingGuestPrompt() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(GUEST_PENDING_PROMPT_KEY) ?? "";
}

export function clearPendingGuestPrompt() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_PENDING_PROMPT_KEY);
}

export function consumePendingGuestPrompt() {
  if (typeof window === "undefined") return "";
  const value = getPendingGuestPrompt();
  clearPendingGuestPrompt();
  return value;
}
