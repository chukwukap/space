"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import SubscribeButton from "./subscribe";

export function Header() {
  // Track previous scroll position and header visibility
  const [visible, setVisible] = useState(true);
  const prevScrollY = useRef(0);

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
      className={`w-full max-w-lg bg-black border-b border-white/10 flex items-center px-4 py-3 gap-3 z-30 sticky top-0 transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
      style={{
        willChange: "transform",
        // Prevents accidental pointer events when hidden
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <Image src="/logo.png" alt="Logo" width={32} height={32} />
      <h1 className="text-2xl font-bold flex-1">
        {process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "App"}
      </h1>
      {/* SubscribeButton allows users to give spend permission to the app */}
      <SubscribeButton />
    </header>
  );
}
