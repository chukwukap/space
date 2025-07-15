import { NextRequest } from "next/server";
import {
  setUserNotificationDetails,
  getUserNotificationDetails,
} from "@/lib/notification";

export async function GET(req: NextRequest) {
  const fid = Number(req.nextUrl.searchParams.get("fid"));
  if (!fid) return new Response("bad fid", { status: 400 });
  const details = await getUserNotificationDetails(fid);
  return details ? new Response("ok") : new Response("none", { status: 404 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { fid, url, token } = body || {};
  if (!fid || !url || !token) return new Response("bad body", { status: 400 });
  await setUserNotificationDetails(fid, { url, token });
  return new Response("saved");
}
