"use client";
import dynamic from "next/dynamic";

const PageClient = dynamic(() => import("./pageClient"), { ssr: false });

export default function RootPage() {
  return <PageClient />;
}
