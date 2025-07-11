export interface SpaceSummary {
  id: string;
  title: string;
  listeners: number;
  hostName: string;
  hostRole: string;
  hostBio: string;
  avatars: string[]; // up to two avatars
}
