"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/app/providers/userProvider";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./themeToggle";

export function Header() {
  // Track previous scroll position and header visibility
  const [visible, setVisible] = useState(true);
  const prevScrollY = useRef(0);
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const ROOT_ROUTES = ["/", "/discover", "/activity", "/inbox"];
  const showBack = !ROOT_ROUTES.some((r) => pathname.startsWith(r));

  let title: string | null = null;
  if (pathname === "/discover") title = "Discover";
  else if (pathname === "/activity") title = "Activity";
  else if (pathname === "/inbox") title = "Inbox";
  else if (/^\/space\//.test(pathname)) {
    title = decodeURIComponent(searchParams.get("title") ?? "Space");
  } else if (pathname === "/profile") {
    title = user?.username ? `@${user.username}` : "Profile";
  }

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

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 h-12 flex items-center px-4 bg-background/80 backdrop-blur border-b border-border transition-transform duration-300",
        visible ? "translate-y-0" : "-translate-y-full",
      )}
    >
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
        <Link href="/profile" className="flex items-center gap-2">
          <Image
            src={user?.avatarUrl ?? "/icon.png"}
            alt="profile"
            width={28}
            height={28}
            className="rounded-full object-cover"
          />
        </Link>
      )}

      <div className="flex-1 flex justify-center">
        {title ? (
          <h1 className="text-sm font-semibold truncate max-w-[70%]">
            {title}
          </h1>
        ) : (
          <Link href="/" className="select-none">
            <Image src="/logo.png" alt="Logo" width={28} height={28} />
          </Link>
        )}
      </div>

      {!/^\/space\//.test(pathname) && <ThemeToggle />}
    </header>
  );
}
