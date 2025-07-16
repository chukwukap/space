"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, Mail } from "lucide-react";
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
  isProfile?: boolean;
};

// ---------------------------------------------------------------------------
// BottomNav – persistent mobile tab bar
// • Five primary destinations: Feed, Discover, Host, Activity, Profile
// • Center tab (Host) is visually elevated for quick creation flow
// • Animated pill highlights active / hovered tab
// • Hides on downward scroll, shows on upward scroll (native feel)
// Security: purely presentational, does not expose sensitive data.
// ---------------------------------------------------------------------------

export function BottomNav() {
  const pathname = usePathname();
  const { context } = useMiniKit();

  // Build nav items dynamically to access context for profile tab
  const NAV_ITEMS: NavItem[] = [
    {
      href: "/",
      label: "Spaces",
      icon: Home,
    },

    // Host button moved to global CreateSpaceButton

    {
      href: "/profile",
      label: context?.user?.username ?? "Profile",
      icon: Mail,
      isProfile: true,
    },
  ];

  // Auto-hide on scroll (mobile UX)
  const [visible, setVisible] = useState(true);
  const prevScrollY = useRef(0);

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

  // Render nav only on top-level tabs
  const showNav = ["/", "/discover", "/activity", "/inbox", "/profile"].some(
    (p) => pathname === p,
  );
  if (!showNav) return null;

  return (
    <nav
      className={cn(
        "fixed bottom-2 left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-3xl rounded-full glass-card shadow-xl transition-transform duration-300 backdrop-blur-lg",
        visible ? "translate-y-0" : "translate-y-[150%]",
      )}
    >
      <div className="h-14 flex items-center justify-around px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }, idx) => {
          const isActive = activeIdx === idx;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 text-xs",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
