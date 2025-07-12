export interface SpaceSummary {
  id: string;
  title: string;
  listeners: number;
  hostName: string;
  hostRole: string;
  hostBio: string;
  avatars: string[]; // up to two avatars
}

export interface Participant {
  id: string;
  fid?: number;
  username?: string;
  walletAddress?: string;
  pfpUrl?: string;
}

export interface SpaceMetadata {
  title: string;
  hostId: string;
  recording: boolean;
}
