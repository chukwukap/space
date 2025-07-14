"use client";

import { type ReactNode } from "react";
import { base } from "wagmi/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { UserProvider } from "./userProvider";
import { ThemeProvider } from "./themeProvider";

export function Providers(props: { children: ReactNode }) {
  return (
    <ThemeProvider>
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
        <UserProvider>{props.children}</UserProvider>
      </MiniKitProvider>
    </ThemeProvider>
  );
}
