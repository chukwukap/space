"use client";
import dynamic from "next/dynamic";

const LandingClient = dynamic(() => import("./pageClient"), { ssr: false });

export default function RootPage() {
  return <LandingClient />;
}
