"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SpaceErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter();

  useEffect(() => {
    // Optionally log error to an error reporting service here
    // console.error("Space page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 py-10 font-sora">
      {/* Mobile-friendly back arrow */}
      <button
        aria-label="Back"
        className="absolute top-4 left-4 flex items-center gap-2 text-primary text-lg font-semibold"
        onClick={() => router.back()}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M18 22L10 14L18 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="sr-only">Back</span>
      </button>

      <div className="max-w-lg w-full bg-card/80 rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <div className="mb-4">
          {/* Unique error icon */}
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="28" fill="#F87171" />
            <path
              d="M36 20L20 36M20 20l16 16"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-destructive">
          Something went wrong
        </h1>
        <p className="text-base text-muted-foreground mb-6 text-center">
          Oops! Sonic Space ran into an error.
          <br />
          If this keeps happening, please let us know.
        </p>
        <div className="w-full bg-destructive/10 rounded-lg p-4 mb-4 overflow-x-auto">
          <pre className="text-xs text-destructive break-all whitespace-pre-wrap font-mono">
            {error?.message || "Unknown error"}
            {error?.stack ? (
              <>
                {"\n\n"}
                {error.stack}
              </>
            ) : null}
            {error?.digest ? (
              <>
                {"\n\nDigest: "}
                {error.digest}
              </>
            ) : null}
          </pre>
        </div>
        <div className="flex gap-3 w-full">
          <button
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow transition"
            onClick={() => reset()}
          >
            Try Again
          </button>
          <button
            className="flex-1 px-4 py-2 rounded-lg bg-muted text-foreground font-semibold border border-border transition"
            onClick={() => router.push("/")}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

// Professional commit message:
// feat: add mobile-friendly error page for Sonic Space with full error and stack trace display
