import "./theme.css";
import "@coinbase/onchainkit/styles.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { BottomNav } from "./_components/bottomNav";
import NewSpaceDrawer from "./_components/newSpaceDrawer";
// import { BottomNav } from "./components/bottomNav";

// Font configuration for Spaces: five standout Google Fonts for a polished, modern app experience.
// This would be in font.ts and exported for use throughout the app.

// Sora: A modern, clean, and highly readable font with a unique character.
// Space Grotesk: A modern, clean, and highly readable font with a unique character.
// Manrope: A modern, clean, and highly readable font with a unique character.
// Inter: A modern, clean, and highly readable font with a unique character.
// DM Sans: A modern, clean, and highly readable font with a unique character.

import { Sora } from "next/font/google";
import { cn } from "@/lib/utils";

// Professional font setup for
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "500", "700"],
});

//  const spaceGrotesk = Space_Grotesk({
//   subsets: ["latin"],
//   variable: "--font-space-grotesk",
//   display: "swap",
//   weight: ["400", "500", "700"],
// });

//  const manrope = Manrope({
//   subsets: ["latin"],
//   variable: "--font-manrope",
//   display: "swap",
//   weight: ["400", "500", "700"],
// });

//  const inter = Inter({
//   subsets: ["latin"],
//   variable: "--font-inter",
//   display: "swap",
//   weight: ["400", "500", "700"],
// });

//  const dmSans = DM_Sans({
//   subsets: ["latin"],
//   variable: "--font-dm-sans",
//   display: "swap",
//   weight: ["400", "500", "700"],
// });

/**
 * Set viewport for responsive design.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * Generate metadata for the app.
 */
export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL;
  return {
    title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
    description:
      "Space lets anyone go live, receive crypto tips in real-time, and grow a sovereign audience—no middle-men, no algorithm.",
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE,
        button: {
          title: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME}`,
          action: {
            type: "launch_frame",
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
            url: URL,
            splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE,
            splashBackgroundColor:
              process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
          },
        },
      }),
    },
  };
}

/**
 * RootLayout component for the app.
 * - Header is sticky and auto-hides on scroll up, shows on scroll down (like Twitter app).
 * - Bottom nav is sticky and auto-hides on scroll down, shows on scroll up (like Twitter app).
 * - Prevents scrollbars from showing using TailwindCSS utilities.
 * - Makes the main content scrollable, but hides scrollbars for a native app feel.
 * - Security: No sensitive data is exposed in layout.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overscroll-none">
      <body
        className={cn(
          `${sora.variable} overscroll-none`,
          "font-sora bg-background text-foreground",
        )}
      >
        <Providers>
          <div className="flex flex-col min-h-svh  bg-background/80 text-foreground h-svh relative">
            {/* Per-page headers are rendered within page layouts */}
            {/* Main scrollable content area with hidden scrollbars */}
            <main
              className="flex-1 overflow-y-auto scrollbar-none overscroll-none pt-10"
              style={{
                // Hide scrollbars for all browsers
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {/* Hide scrollbars for Webkit browsers */}
              <style>
                {`
                  .scrollbar-none::-webkit-scrollbar {
                    display: none;
                  }
                `}
              </style>
              {children}
            </main>
            {/* Sticky, auto-hiding bottom navigation bar */}
            <BottomNav />
            <NewSpaceDrawer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
