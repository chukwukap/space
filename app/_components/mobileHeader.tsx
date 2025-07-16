"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  showBack?: boolean;
  title?: string;
  right?: ReactNode;
  className?: string;
}

export default function MobileHeader({
  showBack = false,
  title,
  right,
  className,
}: MobileHeaderProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const prevScrollY = useRef(0);

  useEffect(() => {
    const scroller = document.querySelector("main") ?? window;

    const getScroll = () =>
      scroller === window
        ? window.scrollY
        : (scroller as HTMLElement).scrollTop;

    const onScroll = () => {
      const cur = getScroll();
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

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 h-12 flex items-center px-4 bg-background/80 backdrop-blur border-b border-border transition-transform duration-300",
        visible ? "translate-y-0" : "-translate-y-full",
        className,
      )}
    >
      {/* Back button or placeholder for alignment */}
      {showBack ? (
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="p-2 -ml-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M15.78 19.28a.75.75 0 01-1.06 0L7.47 12l7.25-7.28a.75.75 0 111.06 1.06L9.56 12l6.22 6.22a.75.75 0 010 1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      ) : (
        <span className="w-6" />
      )}

      {/* Title centered */}
      <div className="flex-1 flex justify-center">
        {title && <h1 className="text-sm font-semibold truncate">{title}</h1>}
      </div>

      {/* Right slot or placeholder */}
      <div className="flex items-center justify-end w-6">{right}</div>
    </header>
  );
}
