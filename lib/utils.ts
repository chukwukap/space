import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

/**
 * Utility helper to combine TailwindCSS class strings intelligently.
 * Uses `clsx` for conditional classes and `tailwind-merge` to deduplicate/conflict-resolve.
 *
 * @param inputs - Variadic list of class values (strings, booleans, arrays, objects).
 * @returns Merged class string ready for the `className` prop.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a secure, unique username based on a prefix and random elements.
 * Ensures usernames are URL-safe and avoids ambiguous characters.
 *
 * @param prefix Optional prefix for the username (e.g., "user", "umbra", etc.)
 * @param length Number of random characters to append (default: 8)
 * @returns A generated username string
 */
export function generateUsername(
  prefix: string = "spacer_",
  length: number = 8,
): string {
  // Use a secure character set: lowercase, numbers, no ambiguous chars
  const chars = "abcdefghjkmnpqrstuvwxyz23456789"; // Excludes: i, l, o, 0, 1
  let randomPart = "";
  // Use crypto for secure random generation
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    window.crypto.getRandomValues
  ) {
    // Browser environment
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      randomPart += chars[array[i] % chars.length];
    }
  } else if (typeof require !== "undefined") {
    // Node.js environment
    try {
      const buf = crypto.randomBytes(length);
      for (let i = 0; i < length; i++) {
        randomPart += chars[buf[i] % chars.length];
      }
    } catch {
      // Fallback to Math.random (not cryptographically secure)
      for (let i = 0; i < length; i++) {
        randomPart += chars[Math.floor(Math.random() * chars.length)];
      }
    }
  } else {
    // Fallback to Math.random (not cryptographically secure)
    for (let i = 0; i < length; i++) {
      randomPart += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  // Compose username, all lowercase, URL-safe
  return `${prefix.toLowerCase()}_${randomPart}`;
}
