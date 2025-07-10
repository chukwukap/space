"use client";
import { useState } from "react";
import { Button } from "./DemoComponents";

export default function InviteSheet({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(
    "Hey, just started my Space. Want to join?",
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--app-background)] rounded-t-2xl p-6 shadow-lg animate-slide-up max-h-[80vh] w-full">
        <div className="h-1 w-10 bg-gray-500/50 rounded-full mx-auto mb-4" />
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Want to invite people?</h2>
          <button className="text-sm text-violet-400" onClick={onClose}>
            Skip
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          People will join as listeners first.
        </p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for people and groups"
          className="w-full px-4 py-2 rounded-lg border bg-transparent mb-4"
        />
        {/* Placeholder list of suggestions could go here */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="w-full px-4 py-2 rounded-lg border bg-transparent mb-3"
        />
        <Button className="w-full" onClick={onClose}>
          Send invite
        </Button>
      </div>
    </div>
  );
}
