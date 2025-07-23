"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, Settings } from "iconoir-react";
import { cn } from "@/lib/utils";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

/**
 * NavItem type for bottom navigation.
 * The icon is a React component (Lucide icon).
 */
type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  isCenter?: boolean;
};

/**
 * Returns true if the nav should be shown on the current route.
 * Only show on root-level primary pages (e.g. "/", "/settings"), not on any subroutes.
 * Security: Never leaks sensitive data.
 */
function isRootPrimaryRoute(pathname: string): boolean {
  if (!pathname.startsWith("/")) return false;
  const cleanPath =
    pathname.endsWith("/") && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;
  return (cleanPath.match(/\//g) || []).length === 1;
}

// ---------------------------------------------------------------------------
// BottomNav – persistent mobile tab bar
// • Only appears on root-level primary pages
// • Hides on downward scroll, shows on upward scroll (native feel)
// ---------------------------------------------------------------------------

export function BottomNav() {
  const pathname = usePathname();
  const { context } = useMiniKit();

  // Settings replaces profile in the nav
  const NAV_ITEMS: NavItem[] = [
    {
      href: "/",
      label: "Home",
      icon: Home,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  // Auto-hide on scroll (mobile UX)
  const [visible, setVisible] = useState(true);
  const prevScrollY = useRef(0);

  // Determine which nav item is active
  const activeIdx = NAV_ITEMS.findIndex((item) => {
    if (item.href === "/") return pathname === "/";
    return pathname.startsWith(item.href);
  });

  useEffect(() => {
    // Prefer the main scroll container (body remains fixed)
    const scroller = document.querySelector("main") ?? window;

    const getScrollPos = () =>
      scroller === window
        ? window.scrollY
        : (scroller as HTMLElement).scrollTop;

    const onScroll = () => {
      const cur = getScrollPos();
      if (cur < 10) {
        setVisible(true);
      } else if (cur > prevScrollY.current) {
        setVisible(false);
      } else if (cur < prevScrollY.current) {
        setVisible(true);
      }
      prevScrollY.current = cur;
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  // Only render nav on root-level primary pages (not on any subroutes)
  if (!isRootPrimaryRoute(pathname)) return null;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full glass-card shadow-xl transition-transform duration-300 backdrop-blur-lg",
        visible ? "translate-y-0" : "translate-y-[150%]",
      )}
    >
      <div className="h-14 flex items-center justify-center gap-4 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }, idx) => {
          const isActive = activeIdx === idx;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 text-xs",
                isActive ? "text-primary font-bold" : "text-muted-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  isActive ? "scale-110 drop-shadow" : "",
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
