"use client";

import { useTheme } from "next-themes";
import { SunLight, HalfMoon } from "iconoir-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark =
    theme === "dark" || (theme === "system" && resolvedTheme === "dark");

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="p-2 rounded-full hover:bg-muted/20 transition-colors"
    >
      {isDark ? (
        <SunLight className="w-5 h-5" />
      ) : (
        <HalfMoon className="w-5 h-5" />
      )}
    </button>
  );
}
