import type { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { redis } from "./redis";
import { sendFrameNotification } from "@/lib/notification-client";

const notificationServiceKey =
  process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME ?? "minikit";

function getUserNotificationDetailsKey(fid: number): string {
  return `${notificationServiceKey}:user:${fid}`;
}

export async function getUserNotificationDetails(
  fid: number,
): Promise<FrameNotificationDetails | null> {
  if (!redis) {
    return null;
  }

  return await redis.get<FrameNotificationDetails>(
    getUserNotificationDetailsKey(fid),
  );
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails,
): Promise<void> {
  if (!redis) {
    return;
  }

  await redis.set(getUserNotificationDetailsKey(fid), notificationDetails);
}

export async function deleteUserNotificationDetails(
  fid: number,
): Promise<void> {
  if (!redis) {
    return;
  }

  await redis.del(getUserNotificationDetailsKey(fid));
}

const HUB_API = "https://hub-api.farcaster.xyz/v1";

async function fetchFollowers(fid: number): Promise<number[]> {
  try {
    const res = await fetch(`${HUB_API}/followers?fid=${fid}&limit=200`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.followers ?? []) as number[];
  } catch {
    return [];
  }
}

export async function sendLiveSpaceNotifications(
  hostFid: number,
  spaceUrl: string,
  spaceTitle: string,
) {
  if (isNaN(hostFid) || hostFid <= 0) return;
  // Rate-limit: check redis key
  const rlKey = `liveNotif:${hostFid}`;
  const redis = (await import("@/lib/redis"))?.redis;
  if (redis) {
    const exist = await redis.get(rlKey);
    if (exist) return;
  }

  const fids = await fetchFollowers(hostFid);
  for (const fid of fids) {
    const details = await getUserNotificationDetails(fid);
    if (!details) continue;
    await sendFrameNotification({
      fid,
      title: "🔴 Space is Live",
      body: spaceTitle,
      notificationDetails: details,
    });
  }
  if (redis) await redis.setex(rlKey, 10800, "sent");
}
