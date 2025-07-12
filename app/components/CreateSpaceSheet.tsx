"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* sheet */}
      <div className="relative bg-[var(--app-background)] rounded-t-2xl p-6 shadow-lg animate-slide-up">
        <div className="h-1 w-10 bg-gray-500/50 rounded-full mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4 text-center">
          Create your Space
        </h2>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you want to talk about?"
          className="w-full px-4 py-2 rounded-lg border bg-transparent mb-4"
        />

        <label className="flex items-center gap-2 mb-6 cursor-pointer select-none text-sm">
          <input
            type="checkbox"
            checked={record}
            onChange={(e) => setRecord(e.target.checked)}
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
      </div>
    </div>
  );
}

/* simple slide animation */
// tailwind css: add to globals if not existing
