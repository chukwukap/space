/* eslint-disable @typescript-eslint/no-explicit-any */
import { roomService } from "@/lib/livekit";

export async function startAudioRecording(
  roomName: string,
  enableFlag: boolean,
) {
  if (process.env.LK_RECORDING_ENABLED !== "true") return;
  if (!enableFlag) return;
  try {
    await (roomService as any).startCompositeEgress({
      roomName,
      audioOnly: true,
      fileOutputs: [
        {
          filepath: `spaces/${roomName}.webm`,
          outputType: "WEBM",
          s3: {
            bucket: process.env.S3_BUCKET!,
            region: process.env.S3_REGION!,
            accessKey: process.env.S3_ACCESS_KEY!,
            secret: process.env.S3_SECRET!,
          },
        },
      ],
    });
  } catch (err) {
    console.error("[livekit egress]", err);
  }
}
