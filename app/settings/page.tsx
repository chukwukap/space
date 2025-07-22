"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useUser } from "../providers/userProvider";
import Image from "next/image";
// Sora font is already set in globals.css

const PRESET_AMOUNTS = [
  { value: 5, usd: 5 },
  { value: 10, usd: 10 },
  { value: 25, usd: 25 },
  { value: 50, usd: 50 },
  { value: 100, usd: 100 },
  { value: 500, usd: 500 },
  { value: 1500, usd: 1500 },
  { value: 2000, usd: 2000 },
];

export default function SettingsPage() {
  const { user } = useUser();
  const [spendLimit, setSpendLimit] = useState<number | "">("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [address] = useState(user?.address);
  const [copied, setCopied] = useState(false);

  // Simulate approval
  const handleApprove = () => {
    setIsApproved(true);
    setTimeout(() => setIsApproved(false), 2000);
  };

  // Copy address
  const handleCopy = () => {
    navigator.clipboard.writeText(address ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  // Handle preset click
  const handlePresetClick = (idx: number) => {
    setSelectedPreset(idx);
    setSpendLimit(PRESET_AMOUNTS[idx].value);
  };

  // Handle manual input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPreset(null);
    const val = e.target.value.replace(/[^0-9]/g, "");
    setSpendLimit(val === "" ? "" : parseInt(val));
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-background flex flex-col items-center px-0 pb-4",
      )}
      style={{
        maxWidth: 430,
        margin: "0 auto",
        fontFamily: "Sora, sans-serif",
      }}
    >
      {/* User info */}
      <div className="w-full px-4 mt-2">
        <div className="rounded-xl glass-card px-4 py-3 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[15px]">@{user?.username}</span>
          </div>
          <div className="text-[13px] text-muted-foreground mt-1">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
            quos.
          </div>
        </div>
      </div>

      {/* Spending limit card */}
      <div className="w-full px-4 mt-4">
        <div className="rounded-xl glass-card px-4 py-4 flex flex-col gap-3">
          <div className="text-[14px] text-foreground font-medium">
            Approve a spending limit for TipSpace on farcaster. When it runs
            out, top it up or revoke it anytime.
          </div>

          {/* Approval status */}
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                "rounded-full px-2 py-1 text-xs font-semibold flex items-center gap-1",
                isApproved
                  ? "bg-primary text-primary-foreground"
                  : "bg-destructive text-destructive-foreground",
              )}
            >
              <span
                className={cn(
                  "inline-block w-2 h-2 rounded-full mr-1",
                  isApproved ? "bg-primary" : "bg-destructive",
                )}
              />
              {isApproved ? "approved" : "no approval"}
            </span>
            <span className="ml-2 text-xs text-muted-foreground font-mono select-all flex items-center gap-1">
              {address}
              <button
                onClick={handleCopy}
                className="ml-1 p-1 rounded-full active:bg-muted transition"
                aria-label="Copy address"
                type="button"
                tabIndex={0}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="inline-block"
                >
                  <rect
                    x="3"
                    y="3"
                    width="9"
                    height="9"
                    rx="2"
                    stroke="#bbb"
                    strokeWidth="1.2"
                  />
                  <rect
                    x="5.5"
                    y="1.5"
                    width="8"
                    height="8"
                    rx="1.5"
                    stroke="#888"
                    strokeWidth="1.1"
                  />
                </svg>
              </button>
              {copied && (
                <span className="ml-1 text-primary font-semibold transition-opacity duration-300">
                  copied!
                </span>
              )}
            </span>
          </div>

          {/* Spend limit input */}
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className={cn(
                  "w-full rounded-lg border border-input bg-background px-3 py-2 text-lg font-semibold text-center outline-none focus:ring-2 focus:ring-primary transition",
                  "placeholder:text-muted-foreground",
                )}
                placeholder="0"
                value={spendLimit === "" ? "" : spendLimit}
                onChange={handleInputChange}
                aria-label="Custom spend limit"
              />
              <Image
                src="/tokens/usdc.png"
                alt="USDC"
                width={24}
                height={24}
                className="w-6 h-6 rounded-full"
              />
            </div>
            {/* 
              Preset spend limit buttons with a clean, modern, mobile-first style.
              Optimized for touch, no emojis/icons, minimal and elegant.
            */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 w-full">
              {PRESET_AMOUNTS.map((preset, idx) => (
                <button
                  key={preset.value}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg px-0 py-3 border-0 shadow-sm glass-card relative transition-all duration-150",
                    "active:scale-97 focus:outline-none focus:ring-2 focus:ring-primary",
                    selectedPreset === idx
                      ? "ring-2 ring-primary bg-primary text-primary-foreground font-bold scale-100"
                      : "bg-background text-foreground font-semibold",
                  )}
                  style={{
                    minWidth: 0,
                    minHeight: 54,
                  }}
                  onClick={() => handlePresetClick(idx)}
                  type="button"
                  aria-pressed={selectedPreset === idx}
                >
                  <span className="text-base font-bold leading-none">
                    {preset.value}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium leading-none">
                    ${preset.usd}
                  </span>
                  {selectedPreset === idx && (
                    <span className="absolute top-1 right-2 text-primary-foreground text-xs font-bold">
                      {/* Simple checkmark, no emoji */}
                      <svg width="14" height="14" viewBox="0 0 14 14" className="inline" aria-hidden="true">
                        <polyline points="3.5 7.5 6 10 10.5 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Approve button */}
          <button
            className={cn(
              "mt-5 w-full rounded-xl py-3 text-lg font-bold flex items-center justify-center gap-2 transition",
              isApproved
                ? "bg-primary text-primary-foreground cursor-not-allowed"
                : "bg-foreground text-background active:bg-primary/80",
            )}
            onClick={handleApprove}
            disabled={isApproved || !spendLimit}
            type="button"
            aria-label="Approve spend limit"
          >
            Approve <span className="ml-1 font-extrabold">🌀</span> USDC
          </button>
        </div>
      </div>
    </div>
  );
}
