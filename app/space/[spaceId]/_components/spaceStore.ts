import { create } from "zustand";
import { Participant } from "livekit-client";

interface SpaceStore {
  hostSid: string | null;
  recording: boolean;
  speakers: Map<string, Participant>; // sid -> participant
  handQueue: Map<string, Participant>;

  setHost: (sid: string | null) => void;
  setRecording: (rec: boolean) => void;
  addSpeaker: (p: Participant) => void;
  removeSpeaker: (sid: string) => void;
  enqueueHand: (p: Participant) => void;
  dequeueHand: (sid: string) => void;
}

export const useSpaceStore = create<SpaceStore>((set) => ({
  hostSid: null,
  recording: false,
  speakers: new Map(),
  handQueue: new Map(),

  setHost: (sid) => set({ hostSid: sid }),
  setRecording: (rec) => set({ recording: rec }),
  addSpeaker: (p) =>
    set((s) => {
      const speakers = new Map(s.speakers);
      speakers.set(p.sid, p);
      return { speakers };
    }),
  removeSpeaker: (sid) =>
    set((s) => {
      const speakers = new Map(s.speakers);
      speakers.delete(sid);
      return { speakers };
    }),
  enqueueHand: (p) =>
    set((s) => {
      const handQueue = new Map(s.handQueue);
      handQueue.set(p.sid, p);
      return { handQueue };
    }),
  dequeueHand: (sid) =>
    set((s) => {
      const handQueue = new Map(s.handQueue);
      handQueue.delete(sid);
      return { handQueue };
    }),
}));
