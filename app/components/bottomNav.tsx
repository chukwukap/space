"use client";

import { Star } from "lucide-react";
import React, { useRef, useEffect, useState } from "react";

export function BottomNav() {
  // Track previous scroll position and nav visibility
  const [visible, setVisible] = useState(true);
  const prevScrollY = useRef(0);

  useEffect(() => {
    // Handler for scroll event
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Hide nav if scrolling down, show if scrolling up
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

  // Security: No sensitive data is exposed in bottom nav.
  return (
    <nav
      className={`w-full max-w-lg bg-black border-t border-white/10 flex justify-around items-center py-2 z-30 sticky bottom-0 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      } relative`}
      style={{
        willChange: "transform",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <NavButton icon="star" label="Home" />
      <NavButton icon="chat" label="Search" />
      {/* Center floating action button using absolute positioning within nav */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2">
        <button
          className="bg-black border-4 border-black rounded-full p-3 shadow-lg"
          aria-label="Main Action"
        >
          <Star name="star" size="lg" />
        </button>
      </div>
      <NavButton icon="users" label="People" />
      <NavButton icon="share" label="Inbox" />
    </nav>
  );
}

function NavButton({
  icon,
  label,
}: {
  icon: Parameters<typeof Star>[0]["name"];
  label: string;
}) {
  return (
    <button className="flex flex-col items-center text-white/80 hover:text-white">
      <Star name={icon} />
      <span className="text-[10px] mt-0.5">{label}</span>
    </button>
  );
}
