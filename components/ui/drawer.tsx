"use client";

/**
 *
 * This file provides a sweet, product-focused Drawer component suite for UmbraSwap,
 * designed for delightful user experiences and security-first UI patterns.
 *
 * All components are non-generic and do not use React.forwardRef unless absolutely necessary.
 * Drawer is now rendered within the borders of its container, not fixed to the viewport.
 * The DrawerContent is responsive in height, adapting to its children.
 * The drawer handle is always visible and never scrolls with content.
 *
 * 2025 © UmbraSwap
 */

import React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

/**
 * Drawer Root Component
 * Wraps the DrawerPrimitive.Root and provides background scaling.
 * Now renders Drawer content relative to its container, not the viewport.
 *
 * SECURITY: Only passes supported props to DrawerPrimitive.Root to avoid type errors.
 */
export function Drawer({
  shouldScaleBackground = true,
  children,
  ...props
}: {
  shouldScaleBackground?: boolean;
  children: React.ReactNode;
} & Omit<
  React.ComponentProps<typeof DrawerPrimitive.Root>,
  "children" | "fadeFromIndex"
>) {
  // Remove fadeFromIndex to avoid type errors
  return (
    <DrawerPrimitive.Root
      {...props}
      shouldScaleBackground={shouldScaleBackground}
    >
      {children}
    </DrawerPrimitive.Root>
  );
}

/**
 * DrawerTrigger
 * Use this component to trigger the opening of the Drawer.
 */
export function DrawerTrigger(
  props: React.ComponentProps<typeof DrawerPrimitive.Trigger>,
) {
  return <DrawerPrimitive.Trigger {...props} />;
}

/**
 * DrawerPortal
 * Provides a portal for Drawer content.
 * For container-bounded Drawer, this is a no-op (renders children in place).
 */
export function DrawerPortal({ children }: { children: React.ReactNode }) {
  // No portal, just render children in place for container-bounded Drawer
  return <>{children}</>;
}

/**
 * DrawerClose
 * Use this component to close the Drawer.
 */
export function DrawerClose(
  props: React.ComponentProps<typeof DrawerPrimitive.Close>,
) {
  return <DrawerPrimitive.Close {...props} />;
}

/**
 * DrawerOverlay
 * A beautiful, secure overlay for the Drawer.
 * Now uses absolute positioning to stay within the container.
 */
export function DrawerOverlay({
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      className={cn(
        // Use absolute positioning and rounded top for container-bounded overlay
        "absolute inset-0 z-40 bg-gradient-to-b from-black/70 via-black/60 to-black/30 rounded-t-[16px]",
        className,
      )}
      {...props}
    />
  );
}

/**
 * DrawerContent
 * The main content area of the Drawer.
 * Now uses absolute positioning to stay within the container.
 * Height is responsive and adapts to its children, up to 90% of the container height.
 * The handle is always visible and never scrolls with content.
 *
 * SECURITY: overflow-y-auto ensures content never overflows the container.
 */
export function DrawerContent({
  className = "",
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
} & Omit<
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>,
  "children"
>) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        className={cn(
          // Use absolute positioning and full width of parent container
          // Height is responsive: max-h-[90%] ensures it never overflows the container
          // The handle is sticky at the top and never scrolls with content
          "absolute left-0 right-0 bottom-0 z-50 mt-24 flex flex-col rounded-t-[16px] border border-white/10 bg-gradient-to-b from-[#232347] via-[#181825] to-[#181825] max-h-[90%] w-full shadow-2xl",
          className,
        )}
        {...props}
      >
        {/* Drawer Handle: sticky, always visible, never scrolls with content */}
        <div className="sticky top-0 z-10 flex justify-center bg-transparent pt-4 pb-2">
          <div
            className="h-2 w-16 rounded-full"
            style={{
              background: "linear-gradient(90deg, #a18aff 0%, #6e7fff 100%)",
              boxShadow: "0 2px 8px 0 rgba(100, 100, 255, 0.10)",
              opacity: 0.95,
            }}
            aria-label="Drawer handle"
          />
        </div>
        {/* Scrollable content area below the handle */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">{children}</div>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

/**
 * DrawerHeader
 * A sweet header for your Drawer.
 */
export function DrawerHeader({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
      {...props}
    />
  );
}

/**
 * DrawerFooter
 * A gentle footer for Drawer actions.
 */
export function DrawerFooter({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

/**
 * DrawerTitle
 * A polished title for your Drawer.
 */
export function DrawerTitle({
  className = "",
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </DrawerPrimitive.Title>
  );
}

/**
 * DrawerDescription
 * A subtle description for your Drawer.
 */
export function DrawerDescription({
  className = "",
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </DrawerPrimitive.Description>
  );
}
