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
    <div className="px-6 py-2 mt-4 bg-muted rounded shadow">
      <h2 className="font-semibold mb-2">Pending Requests</h2>
      <ul>
        {requests.map((req) => (
          <li
            key={req.sid}
            className="flex items-center justify-between mb-2"
            data-testid={`pending-request-${req.sid}`}
          >
            <span>
              {/* Display user name, fallback to "Unknown" if missing */}
              {req.user?.name || "Unknown"}{" "}
              <span className="text-xs text-muted-foreground">
                (
                {req.timestamp
                  ? new Date(req.timestamp).toLocaleTimeString()
                  : "Unknown time"}
                )
              </span>
            </span>
            <div className="flex gap-2">
              <button
                className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                onClick={() => onApprove(req.sid)}
                aria-label={`Approve request from ${req.user?.name || "Unknown"}`}
                type="button"
              >
                Approve
              </button>
              <button
                className="px-2 py-1 bg-red-600 text-white rounded text-xs"
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
