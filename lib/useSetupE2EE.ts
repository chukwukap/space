import { decodePassphrase } from "./client-utils";
// Note: ExternalE2EEKeyProvider is intentionally not imported here because this
// hook only needs to return the passphrase and a worker instance — the caller
// is responsible for wiring these up to LiveKit's key provider when required.

/**
 * Provides the E2EE worker and decoded passphrase if available in the URL hash.
 * This mirrors the implementation used in the LiveKit Meet sample to enable
 * optional end-to-end encryption when the user joins a room using
 * `#<passphrase>` in the URL.
 */
export function useSetupE2EE() {
  const e2eePassphrase =
    typeof window !== "undefined"
      ? decodePassphrase(location.hash.substring(1))
      : undefined;

  const worker: Worker | undefined =
    typeof window !== "undefined" && e2eePassphrase
      ? new Worker(new URL("livekit-client/e2ee-worker", import.meta.url))
      : undefined;

  return { worker, e2eePassphrase } as const;
}
