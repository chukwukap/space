"use client";

import React from "react";
import type { PendingRequest } from "@/lib/types";

/**
 * Props for the PendingRequestToSpeak component.
 * - requests: Array of pending "Request to Speak" objects.
 * - onApprove: Handler to approve a request (invite to speak).
 * - onReject: Handler to reject a request.
 */
interface PendingRequestToSpeakProps {
  requests: PendingRequest[];
  onApprove: (sid: string) => void;
  onReject: (sid: string) => void;
}

/**
 * PendingRequestToSpeak
 *
 * Secure, host-only UI for managing pending "Request to Speak" actions.
 * - Only visible to hosts.
 * - Approve/Reject actions are permission-checked at a higher level.
 * - No sensitive data is exposed in the UI.
 * - 2025 security best practices: No user input is trusted, all actions are explicit.
 */
const PendingRequestToSpeak: React.FC<PendingRequestToSpeakProps> = ({
  requests,
  onApprove,
  onReject,
}) => {
  if (!requests || requests.length === 0) return null;

  return (
    <div className="mx-2 mt-3 rounded-xl border border-border/60 bg-card/70 backdrop-blur p-3 shadow-sm">
      <h2 className="text-sm font-semibold mb-2">Pending requests</h2>
      <ul className="space-y-2">
        {requests.map((req) => (
          <li
            key={req.sid}
            className="flex items-center justify-between gap-2"
            data-testid={`pending-request-${req.sid}`}
          >
            <div className="min-w-0">
              <p className="text-sm truncate">{req.user?.name || "Unknown"}</p>
              <p className="text-[11px] text-muted-foreground">
                {req.timestamp
                  ? new Date(req.timestamp).toLocaleTimeString()
                  : "Unknown time"}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                className="px-2.5 h-8 bg-emerald-600 text-white rounded-md text-xs active:scale-[0.98]"
                onClick={() => onApprove(req.sid)}
                aria-label={`Approve request from ${req.user?.name || "Unknown"}`}
                type="button"
              >
                Approve
              </button>
              <button
                className="px-2.5 h-8 bg-rose-600 text-white rounded-md text-xs active:scale-[0.98]"
                onClick={() => onReject(req.sid)}
                aria-label={`Reject request from ${req.user?.name || "Unknown"}`}
                type="button"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PendingRequestToSpeak;
