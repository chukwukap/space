# Spaces Mini-App – Specification for AI Agents

This document is written for **autonomous AI coding agents** that will continue developing the _Spaces_ mini-app. It outlines architecture, data models, user flows, UI/UX expectations, and coding conventions so the agent always knows “the bigger picture”. Update this file whenever the product evolves.

---

## 0. Mission Statement

Build a **Twitter-Spaces-like** audio-room experience that lives inside the Farcaster ecosystem (Web + Frame). Users can:

1. Start a live audio **Space** (room) with a title.
2. Join existing Spaces as listener, speaker, or host.
3. Tip participants (future milestone).
4. Discover ongoing Spaces from homepage.
5. Enjoy an interface that closely resembles Twitter Spaces (black/dark UI, purple accent, slide-up sheets).

---

## 1. Tech Stack (locked-in)

| Layer          | Choice                                                     |
| -------------- | ---------------------------------------------------------- |
| Realtime media | **LiveKit Cloud** (`livekit-client`, `livekit-server-sdk`) |
| Framework      | **Next.js 15** App Router                                  |
| Styling        | **Tailwind CSS 3**, custom CSS vars                        |
| Wallet / chain | **Base MiniKit**, `wagmi`, `viem`                          |
| Farcaster      | `@farcaster/frame-sdk`, OnchainKit MiniKit                 |
| Data           | Upstash Redis (notifications)                              |

---

## 2. Directory Conventions (current)

```
app/
  page.tsx                # Landing  (Happening Now + CTA)
  space/[space]/page.tsx  # In-room sheet (client)
  space/page.tsx          # Redirect -> /
  api/
    spaces/route.ts       # GET live list
    ...other endpoints
components/
  audioRoom.tsx           # LiveKitRoom wrapper (in-room UI)
lib/
  livekit.ts              # ensureRoom, generateAccessToken, listActiveRooms
```

---

## 3. Key Terminology

| Term         | Meaning                                                 |
| ------------ | ------------------------------------------------------- |
| **Space**    | Single LiveKit room (= Twitter Space)                   |
| **Host**     | Creator of a Space (first participant)                  |
| **Speaker**  | Participant currently publishing audio (activeSpeakers) |
| **Listener** | Participant connected but not publishing                |

---

## 4. User Flows (summarised)

See `USER_FLOWS.md` for full details. High-level:

1. Landing → **Start Space** (prompt title) → `/space/<id>?title=`.
2. Landing → **Join** (ID) or click card → `/space/<id>`.
3. In-room sheet replicates Twitter Spaces: header, avatars grid, bottom bar.

---

## 5. UI / UX Blueprint

### 5.1 Landing (`/`)

```
+-----------------------------------------------------------+
|  Gradient BG (purple)                                     |
|                                                           |
|           Spaces   (logo optional)                        |
|  "Live audio conversations for Farcaster"                |
|                                                           |
|  [ Start a Space ]  [ space-id input ][ Join ]            |
|                                                           |
|  ┌───────────────────────────────────────────────┐        |
|  |  Live Now                                    |        |
|  |  ▸ Purple card 1  (title, avatars, count)    |        |
|  |  ▸ Purple card 2                            ...|        |
|  └───────────────────────────────────────────────┘        |
|                                                           |
|  Floating wallet button (bottom-right)                    |
+-----------------------------------------------------------+
```

Components still to build:

- `SpaceCard` – purple card style.
- Empty-state illustration if no live spaces.

### 5.2 Create-Space Sheet _(TODO)_

- Modal overlay with:
  - Title input
  - “Record Space” toggle (future)
  - “Allow incognito” toggle (future)
  - Start button (purple gradient)

### 5.3 In-Room Sheet (`/space/[id]`)

Structure:

```
<header>  ▼   …   Leave(red)              </header>
<title with badges>
<avatar host 96px>
<speaker row scrollable 64px>
<listener grid 48px>
<bottomBar> mic | invite | like | share | chat </bottomBar>
```

Status badges: `Host`, `Co-host`, `Speaker`, `Listener` colours similar to Twitter (#8899a6 for listener text, purple mic icon for speakers).

---

## 6. State Management Guidelines

- Prefer React state + hooks; avoid external stores.
- Revalidate frequency for live list: 0 (dynamic) with client polling every 5 s.

---

## 7. API Endpoints

| Route          | Method | Purpose                                                       |
| -------------- | ------ | ------------------------------------------------------------- |
| `/api/spaces`  | GET    | Return `[ {name,title,participants} ]` from LiveKit listRooms |
| `/api/livekit` | POST   | (legacy) generate token (currently unused)                    |
| `/api/notify`  | POST   | Send Farcaster notif via Neynar                               |

### Response shape – `/api/spaces`

```jsonc
[
  {
    "name": "ee44a9e4-b96f-4b…",
    "title": "Crypto alpha talk",
    "participants": 12,
  },
]
```

---

## 8. Environment Variables

See `README.md`. Additional planned:

- `LIVEKIT_ROOM_TTL_MINUTES` – auto-close empty rooms.

---

## 9. Open TODOs

1. **SpaceCard** component & update `/api/spaces` to include `title`.
2. **CreateSpaceSheet** modal.
3. Bottom bar icons & invite sheet.
4. Tipping integration via Base MiniKit.

Agents should tackle TODOs sequentially, committing with clear messages, and always update this spec accordingly.
