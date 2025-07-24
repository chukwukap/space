import { useEffect, useRef } from "react";

/**
 * useClickOutside
 *
 * A React hook that triggers a callback when a click or touch event occurs outside the referenced element.
 *
 * @param handler - Function to call when a click outside is detected
 * @returns ref - React ref to attach to the element you want to monitor
 *
 * Usage:
 * const ref = useClickOutside(() => setOpen(false));
 * <div ref={ref}> ... </div>
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    function listener(event: MouseEvent | TouchEvent) {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    }

    document.addEventListener("mousedown", listener, true);
    document.addEventListener("touchstart", listener, true);

    return () => {
      document.removeEventListener("mousedown", listener, true);
      document.removeEventListener("touchstart", listener, true);
    };
  }, [handler]);

  return ref;
}
