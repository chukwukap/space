"use client";

import { useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { Heart, MessageCircle, Mic2Icon, Share, Users } from "lucide-react";

export default function BottomBar({ onInvite }: { onInvite: () => void }) {
  const [micOn, setMicOn] = useState(false);
  const room = useRoomContext();
  const [liked, setLiked] = useState(false);
  return (
    <div className="fixed bottom-0 left-0 w-full bg-black/50 backdrop-blur flex justify-around items-center py-3 z-40">
      <button
        onClick={() => {
          const enabled = !micOn;
          setMicOn(enabled);
          room.localParticipant.setMicrophoneEnabled?.(enabled);
        }}
        className="flex flex-col items-center text-white"
      >
        <Mic2Icon />
        <span className="text-[10px] mt-1">{micOn ? "Mic on" : "Mic off"}</span>
      </button>
      <button
        onClick={onInvite}
        className="flex flex-col items-center text-white"
      >
        <Users />
        <span className="text-[10px] mt-1">Invite</span>
      </button>
      <button
        className={`flex flex-col items-center ${liked ? "text-pink-400" : "text-white"}`}
        onClick={() => setLiked(!liked)}
      >
        <Heart />
        <span className="text-[10px] mt-1">Like</span>
      </button>
      <button className="flex flex-col items-center text-white">
        <Share name="share" />
        <span className="text-[10px] mt-1">Share</span>
      </button>
      <button className="flex flex-col items-center text-white">
        <MessageCircle name="chat" />
        <span className="text-[10px] mt-1">0</span>
      </button>
    </div>
  );
}
