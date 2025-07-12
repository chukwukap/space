import { Participant } from "livekit-client";

interface Props {
  list: Participant[];
  onClose: () => void;
  onAccept: (sid: string) => void;
  onReject: (sid: string) => void;
}

export default function HandRaiseQueue({
  list,
  onClose,
  onAccept,
  onReject,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 w-80 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Hand Raise Queue</h3>
          <button onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {list.length === 0 ? (
          <p className="text-sm text-gray-400">No requests</p>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {list.map((p) => (
              <li key={p.sid} className="flex items-center justify-between">
                <span>{p.identity}</span>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-0.5 bg-violet-600 rounded text-sm"
                    onClick={() => onAccept(p.sid)}
                  >
                    Invite
                  </button>
                  <button
                    className="px-2 py-0.5 bg-gray-600 rounded text-sm"
                    onClick={() => onReject(p.sid)}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
