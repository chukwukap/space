"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Minus, Plus } from "iconoir-react";
import { ReactionType } from "@/lib/generated/prisma";
import { updateTippingPreferences } from "@/actions/tippingPreference";
import { useUser } from "@/app/providers/userProvider";
import type { Address } from "viem";
import {
  REACTION_EMOJIS,
  USDC_ADDRESS_BASE,
  BASE_CHAIN_ID,
} from "@/lib/constants";
import { toast } from "sonner";

// Default tip values for each reaction (can be customized)
const DEFAULT_TIP_VALUES: Record<
  ReactionType,
  { amount: string; delta: number; enabled: boolean }
> = {
  [ReactionType.HEART]: { amount: "0.5", delta: 0.5, enabled: true },
  [ReactionType.CLAP]: { amount: "0.5", delta: 0.5, enabled: true },
  [ReactionType.FIRE]: { amount: "1", delta: 1, enabled: true },
  [ReactionType.LAUGH]: { amount: "0.5", delta: 0.5, enabled: true },
  [ReactionType.LIKE]: { amount: "0.5", delta: 0.5, enabled: true },
};

// Helper for increment/decrement
function adjustAmount(val: string, delta: number) {
  let n = parseFloat(val);
  if (isNaN(n)) n = 0;
  n = Math.max(0, Math.round((n + delta) * 100) / 100);
  return n.toFixed(2);
}

export default function TippingPreferences() {
  // Get user and tipping preferences from context
  const { user } = useUser();

  // Extract tipping preferences from user context, fallback to defaults
  const tippingPref = user?.tippingPreferences;

  // Token and chainId (static for now, should be dynamic in future)
  const token: Address = (tippingPref?.token as Address) || USDC_ADDRESS_BASE;
  const chainId: number = tippingPref?.chainId || BASE_CHAIN_ID;

  // State for global tipping enabled/disabled
  const [tippingEnabled, setTippingEnabled] = useState(
    tippingPref?.tippingEnabled ?? true,
  );

  // State for tip settings per type
  const [tipSettings, setTipSettings] = useState(DEFAULT_TIP_VALUES);

  // State for update button loading
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync state with user context if it changes
  useEffect(() => {
    setTippingEnabled(tippingPref?.tippingEnabled ?? true);
    setTipSettings(DEFAULT_TIP_VALUES);
  }, [user?.tippingPreferences, tippingPref?.tippingEnabled]);

  // Toggle tip enable/disable for each type
  const handleTipToggle = (key: ReactionType) => {
    setTipSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled,
      },
    }));
  };

  // Handle tip amount change, with input sanitization
  const handleTipAmountChange = (key: ReactionType, value: string) => {
    let sanitized = value.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");
    if (parts.length > 2) {
      sanitized = parts[0] + "." + parts.slice(1).join("");
    }
    if (sanitized.includes(".")) {
      const [intPart, decPart] = sanitized.split(".");
      sanitized = intPart + "." + decPart.slice(0, 2);
    }
    setTipSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        amount: sanitized,
      },
    }));
  };

  // Increment/decrement handlers
  const handleAdjust = (key: ReactionType, delta: number) => {
    setTipSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        amount: adjustAmount(prev[key].amount, delta),
      },
    }));
  };

  // Toggle all tipping
  const handleGlobalToggle = () => {
    setTippingEnabled((prev) => !prev);
  };

  // Handle update/save action
  const handleUpdate = async () => {
    if (!user?.id) return;
    setIsUpdating(true);
    try {
      // Compose payload for updateTippingPreferences
      const payload = {
        tippingEnabled,
        heart: {
          enabled: tipSettings.HEART.enabled,
          amount: tipSettings.HEART.amount,
        },
        clap: {
          enabled: tipSettings.CLAP.enabled,
          amount: tipSettings.CLAP.amount,
        },
        fire: {
          enabled: tipSettings.FIRE.enabled,
          amount: tipSettings.FIRE.amount,
        },
        laugh: {
          enabled: tipSettings.LAUGH.enabled,
          amount: tipSettings.LAUGH.amount,
        },
        like: {
          enabled: tipSettings.LIKE.enabled,
          amount: tipSettings.LIKE.amount,
        },
        token,
        chainId,
      };
      await updateTippingPreferences(payload, user.id);

      toast.success("Tipping preferences updated");
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={cn(
        "w-full bg-background flex flex-col items-center px-0 pb-4",
      )}
      style={{
        margin: "0 auto",
        fontFamily: "Sora, sans-serif",
      }}
    >
      <div className="w-full  px-2 mt-4">
        <div className="rounded-2xl bg-background px-4 py-4 flex flex-col gap-3 border border-input">
          {/* Description and global toggle */}
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-sm text-foreground">
                Set your default tip for each moment—applause, laughs, or love.
                <br />
                <span className="text-xs text-muted-foreground">
                  Choose your favorite token and amounts for every reaction.
                  <br />
                  Make every tap count, your way.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={tippingEnabled}
                onChange={handleGlobalToggle}
                className="sr-only peer"
                aria-label="Enable all tipping"
              />
              <div
                className={cn(
                  "w-9 h-5 rounded-full transition-all duration-200",
                  tippingEnabled ? "bg-green-500" : "bg-gray-200",
                )}
              ></div>
              <div
                className={cn(
                  "absolute left-1 top-1 w-3 h-3 bg-background rounded-full shadow transition-all duration-200",
                  tippingEnabled ? "translate-x-4" : "translate-x-0",
                )}
              ></div>
            </label>
          </div>
          {/* Tip rows */}
          <div className="flex flex-col gap-3">
            {Object.values(ReactionType).map((tip) => (
              <div
                key={tip}
                className={cn(
                  "rounded-xl flex flex-col bg-background px-3 py-2 shadow-sm border border-input",
                  !tippingEnabled && "opacity-60 pointer-events-none",
                )}
              >
                {/* Action label and toggle */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {tip}
                    <span className="ml-1 text-lg align-middle">
                      {REACTION_EMOJIS[tip]}
                    </span>
                  </div>

                  {
                    <label className="relative inline-flex items-center cursor-pointer ml-2">
                      <input
                        type="checkbox"
                        checked={tipSettings[tip].enabled}
                        onChange={() => handleTipToggle(tip)}
                        className="sr-only peer"
                        aria-label={`Enable tip for ${tip}`}
                        disabled={!tippingEnabled}
                      />
                      <div
                        className={cn(
                          "w-7 h-4 bg-background rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary transition-all duration-200",
                          tipSettings[tip].enabled && "bg-primary",
                        )}
                      ></div>
                      <div
                        className={cn(
                          "absolute left-0.5 top-0.5 w-3 h-3 bg-background rounded-full shadow transition-all duration-200",
                          tipSettings[tip].enabled
                            ? "translate-x-3"
                            : "translate-x-0",
                        )}
                      ></div>
                    </label>
                  }
                </div>
                {/* Token, input, plus/minus, USD */}
                <div className="flex items-center justify-between">
                  {/* Token icon and dropdown (static for now) */}
                  <Image
                    src="/tokens/usdc.png"
                    alt="USDC"
                    width={24}
                    height={24}
                    className="rounded-full border border-input"
                  />
                  <div className="flex  items-center">
                    {/* Minus button */}
                    <button
                      type="button"
                      className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-full border border-input bg-background text-lg font-bold text-foreground active:scale-95 transition",
                        (!tipSettings[tip].enabled || !tippingEnabled) &&
                          "opacity-50 pointer-events-none",
                      )}
                      aria-label="Decrease tip"
                      onClick={() =>
                        handleAdjust(tip, -DEFAULT_TIP_VALUES[tip].delta)
                      }
                      disabled={!tipSettings[tip].enabled || !tippingEnabled}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    {/* Input */}
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="^\d+(\.\d{0,2})?$"
                      className={cn(
                        "w-16 text-center bg-transparent outline-none font-semibold text-[15px] px-0  mx-1",
                        (!tipSettings[tip].enabled || !tippingEnabled) &&
                          "opacity-60",
                      )}
                      value={tipSettings[tip].amount}
                      onChange={(e) =>
                        handleTipAmountChange(tip, e.target.value)
                      }
                      disabled={!tipSettings[tip].enabled || !tippingEnabled}
                      aria-label={`Tip amount for ${tip}`}
                    />
                    {/* Plus button */}
                    <button
                      type="button"
                      className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-full border border-input bg-background text-lg font-bold text-foreground active:scale-95 transition",
                        (!tipSettings[tip].enabled || !tippingEnabled) &&
                          "opacity-50 pointer-events-none",
                      )}
                      aria-label="Increase tip"
                      onClick={() =>
                        handleAdjust(tip, DEFAULT_TIP_VALUES[tip].delta)
                      }
                      disabled={!tipSettings[tip].enabled || !tippingEnabled}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-sm text-muted-foreground font-semibold min-w-[48px]">
                    ${DEFAULT_TIP_VALUES[tip].delta}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Update button */}
          <button
            className={cn(
              "mt-5 w-full rounded-xl py-3 text-lg font-bold flex items-center justify-center gap-2 transition",
              tippingEnabled
                ? "bg-primary text-primary-foreground"
                : "bg-foreground text-background cursor-not-allowed opacity-60",
              isUpdating && "opacity-70 cursor-wait",
            )}
            onClick={handleUpdate}
            disabled={!tippingEnabled || isUpdating}
            type="button"
            aria-label="Update tipping preferences"
          >
            {isUpdating ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-primary-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                Updating...
              </span>
            ) : (
              "Update"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
