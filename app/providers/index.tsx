"use client";

import { type ReactNode } from "react";
import { base } from "wagmi/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { UserProvider } from "./userProvider";
import { ThemeProvider } from "./themeProvider";
import { MotionProvider } from "./motionProvider";
import { Toaster } from "sonner";
import { OnchainKitProvider } from "@coinbase/onchainkit";

export function Providers(props: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <MotionProvider>
        <MiniKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
          config={{
            appearance: {
              mode: "auto",
              theme: "mini-app-theme",
              name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
              logo: process.env.NEXT_PUBLIC_ICON_URL,
            },
          }}
        >
          <UserProvider>
            <Toaster
              position="top-center"
              richColors
              swipeDirections={["top"]}
              duration={3000}
            />

            <OnchainKitProvider
              apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
              chain={base}
            >
              {props.children}
            </OnchainKitProvider>
          </UserProvider>
        </MiniKitProvider>
      </MotionProvider>
    </ThemeProvider>
  );
}
