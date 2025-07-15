/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { Button } from "@/components/ui/button";

export default function NotificationBanner() {
  const { context } = useMiniKit();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!context) return;
    (async () => {
      const hasToken = await fetch(
        `/api/notifications?fid=${(context as any).client.fid}`,
      ).then((r) => r.ok);
      setShow(!hasToken);
    })();
  }, [context]);

  if (!show) return null;

  const handleEnable = async () => {
    try {
      const details = await (
        context as any
      )?.client?.notifications.requestPush();
      if (!details) return;
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
      alert("Notifications enabled!");
      setShow(false);
    } catch {
      alert("Failed to enable notifications");
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-lg z-50">
      <span>🔔 Get notified when Spaces go live</span>
      <Button size="sm" onClick={handleEnable}>
        Enable
      </Button>
    </div>
  );
}
