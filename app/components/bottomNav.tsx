"use client";

import React, { useRef, useEffect, useState } from "react";
import { Home, Search, User, Send, Star as StarIcon } from "iconoir-react";

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
      className={`w-full max-w-lg bg-card border-t border-border flex justify-around items-center py-2 z-30 sticky bottom-0 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      } relative`}
      style={{
        willChange: "transform",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <NavButton Icon={Home} label="Home" />
      <NavButton Icon={Search} label="Search" />
      {/* Center floating action button using absolute positioning within nav */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2">
        <button
          className="bg-primary border-4 border-primary rounded-full p-3 shadow-lg text-primary-foreground"
          aria-label="Main Action"
        >
          <StarIcon width={24} height={24} />
        </button>
      </div>
      <NavButton Icon={User} label="People" />
      <NavButton Icon={Send} label="Inbox" />
    </nav>
  );
}

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

function NavButton({ Icon, label }: { Icon: IconComponent; label: string }) {
  return (
    <button className="flex flex-col items-center text-muted-foreground hover:text-foreground">
      <Icon width={20} height={20} />
      <span className="text-[10px] mt-0.5">{label}</span>
    </button>
  );
}
