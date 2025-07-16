"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, Compass, Mic, Bell, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home; // using lucide type equivalently
  isCenter?: boolean;
};

// ---------------------------------------------------------------------------
// BottomNav – persistent mobile tab bar
// • Five primary destinations: Feed, Discover, Host, Activity, Inbox
// • Center tab (Host) is visually elevated for quick creation flow
// • Animated pill highlights active / hovered tab
// • Hides on downward scroll, shows on upward scroll (native feel)
// Security: purely presentational, does not expose sensitive data.
// ---------------------------------------------------------------------------

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Feed",
    icon: Home,
  },
  {
    href: "/discover",
    label: "Discover",
    icon: Compass,
  },
  {
    href: "/#create", // anchor that triggers create flow
    label: "Host",
    icon: Mic,
    isCenter: true,
  },
  {
    href: "/activity",
    label: "Activity",
    icon: Bell,
  },
  {
    href: "/inbox",
    label: "Inbox",
    icon: Mail,
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  // Auto-hide on scroll (mobile UX)
  const [visible, setVisible] = useState(true);
  const prevScrollY = useRef(0);

  const activeIdx = NAV_ITEMS.findIndex((item) => {
    if (item.isCenter) return false;
    if (item.href === "/") return pathname === "/";
    return pathname.startsWith(item.href);
  });

  useEffect(() => {
    const onScroll = () => {
      const cur = window.scrollY;
      if (cur < 10) {
        setVisible(true);
      } else if (cur > prevScrollY.current) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      prevScrollY.current = cur;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide nav on specific pages (e.g., live Space)
  const hideNav = /^\/space\//.test(pathname);
  if (hideNav) return null;

  return (
    <nav
      className={cn(
        "fixed bottom-2 left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-3xl rounded-full glass-card shadow-xl transition-transform duration-300 backdrop-blur-lg",
        visible ? "translate-y-0" : "translate-y-[150%]",
      )}
    >
      <div className="h-14 flex items-center justify-between px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon, isCenter }, idx) => {
          const isActive = activeIdx === idx;

          // Center button special styling
          if (isCenter) {
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center justify-center -mt-6 bg-secondary text-secondary-foreground p-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
              >
                <Icon className="w-6 h-6" />
                <span className="sr-only">{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 text-xs",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              {/* Profile avatar for Inbox when label is Inbox and there's user pfp? We'll keep icon simple */}
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
