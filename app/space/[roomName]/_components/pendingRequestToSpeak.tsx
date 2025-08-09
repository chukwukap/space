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
    <div className="px-4 py-3 mt-2 mx-3 bg-card/80 border border-primary/10 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-sm">Pending requests</h2>
        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">
          {requests.length}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {requests.map((req) => (
          <li
            key={req.sid}
            className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2"
            data-testid={`pending-request-${req.sid}`}
          >
            <span className="text-xs">
              {req.user?.name || "Unknown"}{" "}
              <span className="text-[10px] text-muted-foreground">
                (
                {req.timestamp
                  ? new Date(req.timestamp).toLocaleTimeString()
                  : "Unknown time"}
                )
              </span>
            </span>
            <div className="flex gap-2">
              <button
                className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px]"
                onClick={() => onApprove(req.sid)}
                aria-label={`Approve request from ${req.user?.name || "Unknown"}`}
                type="button"
              >
                Approve
              </button>
              <button
                className="px-2 py-1 bg-rose-600 text-white rounded text-[10px]"
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
