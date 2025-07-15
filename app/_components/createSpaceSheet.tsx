"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

export default function CreateSpaceSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [record, setRecord] = useState(false);

  const handleStart = () => {
    if (!title.trim()) return;
    const id = crypto.randomUUID();
    router.push(`/space/${id}?title=${encodeURIComponent(title)}`);
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {/* Overlay */}
      <motion.div
        key="overlay"
        className="absolute inset-0 z-40 bg-background/60 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        key="sheet"
        className="relative z-50 bg-[var(--background)] text-foreground rounded-t-2xl p-6 shadow-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 450, damping: 40 }}
        style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      >
        <div className="h-1 w-10 bg-border rounded-full mx-auto mb-4" />

        <h2 className="text-lg font-semibold mb-4 text-center">
          Create your Space
        </h2>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you want to talk about?"
          className="w-full px-4 py-2 rounded-lg border border-border bg-background mb-4 outline-none focus:ring-2 focus:ring-ring"
        />

        <label className="flex items-center gap-2 mb-6 cursor-pointer select-none text-sm">
          <input
            type="checkbox"
            checked={record}
            onChange={(e) => setRecord(e.target.checked)}
            className="accent-primary"
          />
          Record this Space (coming soon)
        </label>

        <Button
          className="w-full"
          onClick={handleStart}
          disabled={!title.trim()}
        >
          Start your Space
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}

/* simple slide animation */
// tailwind css: add to globals if not existing
