export interface InviteOptions {
  url: string;
  text?: string;
  mentions?: number[]; // fid list
}

export async function castInvite(
  client: unknown,
  { url, text = "🎙️ I'm live → join my Space", mentions = [] }: InviteOptions,
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client as any).casts.create({
      text: `${text} ${url}`,
      embeds: [url],
      mentions,
    });
    return true;
  } catch (err) {
    console.error("[farcaster] castInvite fail", err);
    return false;
  }
}

export async function dmInvite(
  client: unknown,
  fid: number,
  { url, text = "I'm live now, hop in!" }: InviteOptions,
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client as any).users.sendDirectCast({
      fid,
      text: `${text} ${url}`,
      embeds: [url],
    });
    return true;
  } catch (err) {
    console.error("[farcaster] dmInvite fail", err);
    return false;
  }
}
