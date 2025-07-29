"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

/**
 * ThemeProvider
 * Smooth, adaptive dark/light mode for Tipspace.
 * - System-based, follows OS preference.
 * - Smooth transitions, no flickering.
 * - No extra dependencies; just Next.js and Tailwind.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      enableSystem
      defaultTheme="system"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
