import { ParticipantMetadata } from "@/lib/types";

// Predefined mock participants for local development/testing.
// Add or modify entries as needed.
export const MOCK_PARTICIPANTS: Record<string, ParticipantMetadata> = {
  host: {
    fid: 755074,
    address: "0xd584F8079192E078F0f3237622345E19360384A2",
    displayName: "Chukwuka.base.eth",
    username: "chukwukauba",
    pfpUrl:
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/4d0248d8-f666-4a19-65fd-3cb9acbb8100/original",
    identity: 755074,
    clientFid: 9152,
    isHost: true,
  },
  listener1: {
    fid: 123456,
    address: "0x1111111111111111111111111111111111111111",
    displayName: "Alice Listener",
    username: "alice",
    pfpUrl: "https://placekitten.com/100/100",
    identity: 123456,
    clientFid: 123456,
    isHost: false,
  },
  listener2: {
    fid: 654321,
    address: "0x2222222222222222222222222222222222222222",
    displayName: "Bob Listener",
    username: "bob",
    pfpUrl: "https://placekitten.com/101/101",
    identity: 654321,
    clientFid: 654321,
    isHost: false,
  },
};

export function getMockParticipant(id: string): ParticipantMetadata | null {
  return MOCK_PARTICIPANTS[id] ?? null;
}
