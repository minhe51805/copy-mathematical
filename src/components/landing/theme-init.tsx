"use client";

import { useEffect } from "react";
import { initializeTheme } from "@/hooks/use-theme";

export function ThemeInit() {
  useEffect(() => {
    initializeTheme();
  }, []);

  return null;
}
