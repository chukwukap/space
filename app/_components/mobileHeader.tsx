"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "iconoir-react";

/**
 * Returns true if the nav/header should be shown on the current route.
 * Only show on root-level primary pages (e.g. "/", "/profile"), not on any subroutes.
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

interface MobileHeaderProps {
  showBack?: boolean;
  title?: string;
  right?: ReactNode;
  className?: string;
  upperComponent?: ReactNode; // Custom component for upper part
  lowerComponent?: ReactNode; // Custom component for lower part
  lowerVisible?: boolean; // Controls visibility of lower header
}

/**
 * MobileHeader component for UmbraSwap
 * - Upper part auto-hides on scroll (native app feel)
 * - Lower part is always rigidly fixed at the top, not affected by scroll, and visibility is controlled by prop
 * - Sora font enforced for brand consistency
 */
export default function MobileHeader({
  showBack = false,
  title,
  right,
  className,
  upperComponent,
  lowerComponent,
  lowerVisible = true,
}: MobileHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [upperVisible, setUpperVisible] = useState(true);
  const prevScrollY = useRef(0);

  // Only show upper part on root-level primary routes
  const showUpper = isRootPrimaryRoute(pathname);

  // Upper header auto-hide on scroll
  useEffect(() => {
    if (!showUpper) return;
    const scroller = document.querySelector("main") ?? window;

    const getScroll = () =>
      scroller === window
        ? window.scrollY
        : (scroller as HTMLElement).scrollTop;

    const onScroll = () => {
      const cur = getScroll();
      if (cur < 10) {
        setUpperVisible(true);
      } else if (cur > prevScrollY.current) {
        setUpperVisible(false);
      } else if (cur < prevScrollY.current) {
        setUpperVisible(true);
      }
      prevScrollY.current = cur;
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [showUpper]);

  return (
    <div
      className={cn("fixed top-0 left-0 right-0 z-40", className)}
      style={{ fontFamily: "Sora, var(--font-sora), sans-serif" }}
    >
      {/* Upper part: only on root-level primary routes, auto-hides on scroll */}
      {showUpper && (
        <div
          className={cn(
            "h-12 flex items-center px-4 bg-background/80 backdrop-blur border-b border-border transition-transform duration-300",
            upperVisible ? "translate-y-0" : "-translate-y-full",
          )}
        >
          {upperComponent ? (
            upperComponent
          ) : (
            <>
              {/* Back button placeholder for alignment */}
              <span className="w-6" />
              {/* Title centered */}
              <div className="flex-1 flex justify-start">
                {title && <h1 className="text-sm  truncate">{title}</h1>}
              </div>
              {/* Right slot or placeholder */}
              <div className="flex items-center justify-end w-6">{right}</div>
            </>
          )}
        </div>
      )}

      {/* Lower part: always rigidly positioned at the top, not affected by scroll */}
      {lowerVisible && (
        <div className="h-12 flex items-center px-4 bg-background/90 backdrop-blur border-b border-border border-t">
          {lowerComponent ? (
            lowerComponent
          ) : showBack ? (
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="p-2 -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <span className="w-6" />
          )}
          {/* Lower part can also have a slot for right-aligned content if needed */}
          <div className="flex-1" />
        </div>
      )}
    </div>
  );
}
