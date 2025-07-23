"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useUser } from "../providers/userProvider";
import SpendLimit from "./_components/tokenAllowance";
import TippingPreferences from "./_components/tippingPreferences";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // shadcn tabs
import MobileHeader from "../_components/mobileHeader";

/**
 * SettingsPage
 * - Mobile-first settings page for Sonic Space
 * - Swipeable/tabs UI for switching between Spend Limit and Tipping Preferences
 * - Uses shadcn Tabs for a smooth, touch-friendly experience
 */
export default function SettingsPage() {
  const { user } = useUser();
  const [tab, setTab] = useState<"spend" | "tip">("spend");

  return (
    <div
      className={cn(
        "min-h-screen bg-background flex flex-col items-center px-0 pb-4",
      )}
      style={{
        maxWidth: 460,
        margin: "0 auto",
        fontFamily: "Sora, sans-serif",
      }}
    >
      <MobileHeader title="Settings" showBack lowerVisible={false} />
      {/* User info */}
      <div className="w-full px-4 mt-10">
        <div className="rounded-xl glass-card px-4 py-3 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[15px]">@{user?.username}</span>
          </div>
          <div className="text-[13px] text-muted-foreground mt-1">
            Welcome to your Sonic Space settings. Personalize your tipping and
            spending experience!
          </div>
        </div>
      </div>

      {/* Swipeable/tabs for switching between Spend Limit and Tipping Preferences */}
      <div className="w-full px-0 mt-4">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "spend" | "tip")}
          className="w-full"
        >
          <TabsList className=" flex bg-muted rounded-xl mb-2 ">
            <TabsTrigger
              value="spend"
              className={cn(
                "flex-1 text-center rounded-lg  text-sm transition-all",
                tab === "spend"
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-transparent text-foreground",
              )}
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              Spend Limit
            </TabsTrigger>
            <TabsTrigger
              value="tip"
              className={cn(
                "flex-1 text-center rounded-lg text-sm transition-all",
                tab === "tip"
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-transparent text-foreground",
              )}
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              Tipping Preferences
            </TabsTrigger>
          </TabsList>
          <TabsContent value="spend" className="w-full">
            <SpendLimit />
          </TabsContent>
          <TabsContent value="tip" className="w-full">
            <TippingPreferences />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
