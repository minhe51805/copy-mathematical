"use client";

import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface ThemeStore {
  theme: Theme;
  pendingTheme: Theme | null;
  isIntroPlaying: boolean;
  setTheme: (theme: Theme) => void;
  setPendingTheme: (theme: Theme | null) => void;
  setIntroPlaying: (playing: boolean) => void;
  applyPendingTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: "light",
  pendingTheme: null,
  isIntroPlaying: false,

  setTheme: (theme) => {
    const { theme: current } = get();
    if (theme === current) return;

    set({ pendingTheme: theme, isIntroPlaying: true });
  },

  setPendingTheme: (theme) => set({ pendingTheme: theme }),

  setIntroPlaying: (playing) => set({ isIntroPlaying: playing }),

  applyPendingTheme: () => {
    const { pendingTheme } = get();
    if (!pendingTheme) return;

    set(() => ({
      theme: pendingTheme,
      pendingTheme: null,
      isIntroPlaying: false,
    }));

    if (typeof window !== "undefined") {
      localStorage.setItem("math-chat-theme", pendingTheme);
      const root = document.documentElement;
      if (pendingTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  },
}));

export function initializeTheme() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem("math-chat-theme") as Theme | null;
  if (stored) {
    useThemeStore.getState().setTheme(stored);
    // Apply without intro for initial load
    const root = document.documentElement;
    if (stored === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    useThemeStore.setState({ theme: stored, pendingTheme: null, isIntroPlaying: false });
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    const initial = "dark";
    useThemeStore.setState({ theme: initial, pendingTheme: null, isIntroPlaying: false });
    const root = document.documentElement;
    root.classList.add("dark");
  }
}
