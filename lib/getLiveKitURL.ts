export function getLiveKitURL(
  projectUrl: string,
  region: string | null,
): string {
  const url = new URL(projectUrl);
  if (region && url.hostname.includes("livekit.cloud")) {
    const [projectId, ...hostParts] = url.hostname.split(".");
    if (hostParts[0] === "staging") {
      hostParts[0] = "production";
    }
    const regionURL = [projectId, region, ...hostParts].join(".");
    url.hostname = regionURL;
  }
  return url.toString();
}
