"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { SunLight, HalfMoon } from "iconoir-react";
import { Mic2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/app/providers/userProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Returns true if the current pathname is a Space page (/space/[spaceId])
 * e.g. /space/ee077823-8d11-4a49-a487-d75e07f21b6c or /space/ee077823-8d11-4a49-a487-d75e07f21b6c?title=...
 */
function isSpacePage(pathname: string) {
  // Accepts /space/[id] or /space/[id]?title=...
  // Not perfect, but robust for our route structure
  return /^\/space\/[^/]+/.test(pathname);
}

export function Header() {
  // Track previous scroll position and header visibility
  const [visible, setVisible] = useState(true);
  const prevScrollY = useRef(0);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();

  // Determine if we are on a Space page
  const onSpacePage = isSpacePage(pathname);

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
        "fixed top-3 left-1/2 -translate-x-1/2 z-40 w-[90vw] max-w-5xl px-4 py-2 rounded-full glass-card flex items-center gap-2 transition-transform duration-300 backdrop-blur-md",
        visible ? "translate-y-0" : "-translate-y-[140%]",
      )}
      style={{
        willChange: "transform",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* Logo & Brand */}
      <Link href="/" className="flex items-center gap-2 select-none">
        <Image src="/logo.png" alt="Logo" width={28} height={28} />
        <span className="text-lg font-extrabold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text leading-none">
          Space
        </span>
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Show avatar link on non-home pages */}
        {pathname !== "/" && (
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full overflow-hidden border border-border"
          >
            <Image
              src={user?.pfpUrl || "/icon.png"}
              alt="profile"
              width={32}
              height={32}
              className="object-cover w-full h-full"
            />
          </Link>
        )}

        {/* CTA – Start Space (hide on /space/[spaceId] pages) */}
        {!onSpacePage && (
          <Button
            variant="secondary"
            size="sm"
            className="hidden sm:inline-flex gap-1"
            onClick={() => {
              // scroll to bottom mic trigger or route to create flow
              const micBtn = document.getElementById("create-space-btn");
              if (micBtn) {
                micBtn.click();
              } else {
                router.push("/#create");
              }
            }}
          >
            <Mic2 className="w-4 h-4" /> Start Space
          </Button>
        )}
      </div>
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
      {isDark ? (
        <SunLight className="w-5 h-5" />
      ) : (
        <HalfMoon className="w-5 h-5" />
      )}
    </button>
  );
}
