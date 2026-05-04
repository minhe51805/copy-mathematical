"use client";

import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: "light",
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== "undefined") {
      localStorage.setItem("math-chat-theme", theme);
      const root = document.documentElement;
      if (theme === "dark") {
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
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    useThemeStore.getState().setTheme("dark");
  }
}