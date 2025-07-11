import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
