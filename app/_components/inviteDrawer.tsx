"use client";

/**
 * InviteDrawer – bottom sheet for inviting people to a Space.
 * ----------------------------------------------------------
 * UI/UX goals:
 * 1. Smoothly animating drawer that feels native on mobile & desktop.
 * 2. Powerful, accessible search that filters suggestions in real-time.
 * 3. Multi-select invitees with instant visual feedback (checked icon).
 * 4. Message composer with character limit and disabled state until at
 *    least one invitee is selected – nudging users towards the primary
 *    action without confusion.
 * 5. Highly reusable – consumers only provide `people` data and an
 *    optional custom trigger; everything else works out-of-the-box.
 * 6. Secure by design – no un-escaped HTML, aria-labels on interactive
 *    elements and predictable focus order.
 */

import { useMemo, useState } from "react";
import Image from "next/image";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { castInvite, dmInvite } from "@/lib/farcaster";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import clsx from "clsx";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export interface Person {
  id: string | number;
  /** Display name e.g. "Anmol" */
  name: string;
  /** @example "0xanmol" */
  handle: string;
  /** Path or url to avatar image */
  avatar?: string;
  verified?: boolean;
}

interface InviteDrawerProps {
  /** List of potential people/groups to invite */
  people: Person[];
  /** Optional custom trigger element. */
  trigger?: React.ReactNode;
  /** Callback fired when user sends the invite */
  onSend?: (payload: { selected: Person[]; message: string }) => void;
  /** Placeholder text for the composer */
  defaultMessage?: string;
  /** Whether the drawer should start open */
  defaultOpen?: boolean;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function InviteDrawer({
  people,
  trigger,
  onSend,
  defaultMessage = "Hey, just started my Space. Want to join?",
  defaultOpen = false,
}: InviteDrawerProps) {
  /* ---------------------------- State ----------------------------- */
  const [open, setOpen] = useState(defaultOpen);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(defaultMessage);
  const [selected, setSelected] = useState<Set<Person["id"]>>(new Set());
  const [mode, setMode] = useState<"public" | "dm">("public");

  const { context } = useMiniKit();

  /* ---------------------------- Memo ------------------------------ */
  const filtered = useMemo(() => {
    if (!search.trim()) return people;
    const term = search.toLowerCase();
    return people.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.handle.toLowerCase().includes(term),
    );
  }, [people, search]);

  /* --------------------------- Handlers --------------------------- */
  const toggleSelect = (id: Person["id"]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0) return; // Should be disabled anyway.
    const selPeople = people.filter((p) => selected.has(p.id));

    if (context?.client) {
      const url = window.location.href;
      if (mode === "public") {
        // Chunk mentions by 10 max per cast
        const ids = selPeople.map((p) => Number(p.id)).filter(Boolean);
        const chunks: number[][] = [];
        for (let i = 0; i < ids.length; i += 10)
          chunks.push(ids.slice(i, i + 10));
        if (chunks.length === 0) chunks.push([]); // at least one cast without mentions
        for (const mentions of chunks) {
          await castInvite(context.client as unknown, {
            url,
            text: message,
            mentions,
          });
        }
      } else {
        for (const person of selPeople) {
          await dmInvite(context.client as unknown, Number(person.id), {
            url,
            text: message,
          });
        }
      }
    }

    onSend?.({ selected: selPeople, message });
    // Reset on success – UX friendly.
    setSelected(new Set());
    setMessage(defaultMessage);
    setOpen(false);
  };

  /* ---------------------------- JSX ------------------------------ */
  return (
    <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      {/* ╭─────────────────────────────────────────────╮ */}
      {/* │ Trigger                                    │ */}
      {/* ╰─────────────────────────────────────────────╯ */}
      <DrawerTrigger asChild>
        {trigger ? (
          // eslint-disable-next-line jsx-a11y/anchor-is-valid
          <span role="button" tabIndex={0} className="outline-none">
            {trigger}
          </span>
        ) : (
          <button
            className="absolute bottom-24 right-6 w-16 h-16 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center shadow-xl focus:outline-none"
            aria-label="Invite people"
          >
            {/* plus icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </DrawerTrigger>

      {/* ╭─────────────────────────────────────────────╮ */}
      {/* │ Content                                   │ */}
      {/* ╰─────────────────────────────────────────────╯ */}
      <DrawerContent className="bg-card rounded-t-2xl border border-border text-foreground flex flex-col pb-4 max-h-[85vh]">
        {/* Header */}
        <DrawerHeader className="px-6">
          <DrawerTitle className="flex justify-between items-center text-lg">
            <span>Want to invite people?</span>
            <DrawerClose asChild>
              <button className="text-sm text-violet-400 hover:text-violet-500 outline-none">
                Skip
              </button>
            </DrawerClose>
          </DrawerTitle>
          <DrawerDescription className="text-muted-foreground mt-1">
            People will join as listeners first.
          </DrawerDescription>
        </DrawerHeader>

        {/* Search */}
        <div className="relative px-6 mt-4">
          <span className="absolute left-8 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for people and groups"
            className="w-full pl-10 pr-4 py-2 rounded-full bg-muted/20 border border-border placeholder-muted-foreground focus:outline-none"
            aria-label="Search people"
          />
        </div>

        {/* Mode toggle */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            className={`px-3 py-1 rounded-full text-sm ${mode === "public" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setMode("public")}
          >
            Public Cast
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm ${mode === "dm" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setMode("dm")}
          >
            Direct DM
          </button>
        </div>

        {/* Suggestions */}
        <ul className="flex-1 overflow-y-auto mt-4 px-2 space-y-1">
          {filtered.length === 0 ? (
            <li className="text-center text-sm text-gray-500 py-8">
              No results
            </li>
          ) : (
            filtered.map((p) => {
              const isSelected = selected.has(p.id);
              return (
                <li
                  key={p.id}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors",
                    isSelected ? "bg-primary/20" : "hover:bg-muted/10",
                  )}
                  onClick={() => toggleSelect(p.id)}
                  aria-selected={isSelected}
                >
                  {/* Avatar */}
                  {p.avatar ? (
                    <Image
                      src={p.avatar}
                      alt={p.name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-700 rounded-full" />
                  )}

                  {/* Names */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="flex items-center gap-1 font-medium truncate">
                      {p.name}
                      {p.verified && <VerifiedBadge />}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      @{p.handle}
                    </span>
                  </div>

                  {/* Checkbox */}
                  <div
                    className={clsx(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {isSelected && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3 h-3 text-white"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>

        {/* Composer & send */}
        <DrawerFooter className="pt-2 border-t border-border">
          <div className="relative">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-muted/20 rounded-full py-2 pl-4 pr-14 placeholder-muted-foreground focus:outline-none"
              maxLength={280}
              aria-label="Invitation message"
            />
            <button
              onClick={handleSend}
              disabled={selected.size === 0}
              className={clsx(
                "absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors",
                selected.size === 0
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground",
              )}
              aria-label="Send invite"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
          {selected.size > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-1">
              Inviting {selected.size}{" "}
              {selected.size === 1 ? "person" : "people"}
            </p>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */
/* Icons                                                              */
/* ------------------------------------------------------------------ */
function SearchIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SendIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      className={className}
    >
      <path d="M22 2L11 13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function VerifiedBadge({
  className = "w-4 h-4 text-[#1D9BF0]",
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M22.5 12.03l-2.86-.66-.66-2.86a1.13 1.13 0 0 0-2.2 0l-.66 2.86-2.86.66a1.13 1.13 0 0 0 0 2.2l2.86.66.66 2.86a1.13 1.13 0 0 0 2.2 0l.66-2.86 2.86-.66a1.13 1.13 0 0 0 0-2.2z" />
    </svg>
  );
}
