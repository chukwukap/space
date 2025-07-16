"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/app/providers/userProvider";
import { cn } from "@/lib/utils";

// Helper removed – header no longer route-aware

export function Header() {
  // Track previous scroll position and header visibility
  const [visible, setVisible] = useState(true);
  const prevScrollY = useRef(0);
  // Header is now route-agnostic
  const { user } = useUser();

  useEffect(() => {
    // Handler for scroll event
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Show header if scrolling up, hide if scrolling down
      if (currentScrollY < 10) {
        setVisible(true);
      } else if (currentScrollY > prevScrollY.current) {
        setVisible(false);
      } else if (currentScrollY < prevScrollY.current) {
        setVisible(true);
      }
      prevScrollY.current = currentScrollY;
    };

    // Use passive event listener for performance
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Security: No sensitive data is exposed in header.
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 h-12 flex items-center px-4 bg-background/80 backdrop-blur border-b border-border transition-transform duration-300",
        visible ? "translate-y-0" : "-translate-y-full",
      )}
    >
      {/* Left – avatar triggers profile */}
      <Link href="/profile" className="flex items-center gap-2">
        <Image
          src={user?.pfpUrl || "/icon.png"}
          alt="profile"
          width={28}
          height={28}
          className="rounded-full object-cover"
        />
      </Link>

      {/* Center – logo or title */}
      <div className="flex-1 flex justify-center">
        <Link href="/" className="select-none">
          <Image src="/logo.png" alt="Logo" width={28} height={28} />
        </Link>
      </div>

      {/* Right – theme toggle */}
      <ThemeToggle />
    </header>
  );
}

// ------------------------------------------------------------------

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark =
    theme === "dark" || (theme === "system" && resolvedTheme === "dark");

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="p-2 rounded-full hover:bg-muted/20 transition-colors"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
