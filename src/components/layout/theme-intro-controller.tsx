"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useThemeStore } from "@/hooks/use-theme";
import { LandingIntro } from "@/components/landing/landing-intro";

const NO_INTRO_PATHS = ["/newchat", "/teacher"];

export function ThemeIntroController() {
  const pathname = usePathname();
  const isIntroPlaying = useThemeStore((s) => s.isIntroPlaying);
  const isExcluded = NO_INTRO_PATHS.some((p) => pathname.startsWith(p));

  // Skip intro immediately if on excluded paths
  useEffect(() => {
    if (isIntroPlaying && isExcluded) {
      useThemeStore.getState().applyPendingTheme();
    }
  }, [isIntroPlaying, isExcluded]);

  // Apply theme after intro completes
  useEffect(() => {
    if (!isIntroPlaying) return;

    const timer = window.setTimeout(() => {
      useThemeStore.getState().applyPendingTheme();
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [isIntroPlaying]);

  if (!isIntroPlaying || isExcluded) {
    return null;
  }

  return <LandingIntro />;
}
