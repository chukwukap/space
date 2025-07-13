import { Redis } from "@upstash/redis";

const { REDIS_URL, REDIS_TOKEN } = process.env;

// Only create an Upstash Redis client when using their HTTPS endpoint.
// For local development with docker (redis://localhost:6379) we fall back to `null`
// so that features depending on Redis are disabled gracefully.
if (!REDIS_URL || (!REDIS_URL.startsWith("https://") && !REDIS_TOKEN)) {
  console.warn(
    "REDIS_URL is not an Upstash https URL – Redis features disabled for local dev.",
  );
}

export const redis =
  REDIS_URL && REDIS_URL.startsWith("https://") && REDIS_TOKEN
    ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN })
    : null;
