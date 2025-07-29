"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

/**
 * MotionProvider
 * Seamless, professional page transitions for Tipspace.
 * - Subtle fade and slide for a polished, mobile-first feel.
 * - No distracting effects; just smooth, elegant navigation.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 0 }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        className="h-full"
        style={{ fontFamily: "Sora, sans-serif" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
