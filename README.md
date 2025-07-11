# Farcaster Spaces: Host & Tip Audio Rooms on Farcaster

Farcaster Spaces is a mini-app that lets anyone start **live audio rooms** (like Twitter Spaces) inside Warpcast and tip hosts or speakers directly—on-chain, transparently, with creator-first economics. Built for the Base Hackathon, Spaces reimagines live social audio by leveraging **LiveKit**, **Base MiniKit** tipping contracts, and deep **Farcaster Frames** integration.

## Motivation

Today’s social-audio platforms are closed, ad-driven, and take a large cut from creators:

- No native crypto rails for direct support
- Limited reach outside the walled garden
- Centralised infra and opaque algorithms

**Farcaster Spaces** fixes this by running on open protocols (Frames + EVM), enabling direct wallet-to-wallet tips, and giving hosts full ownership over their audience and content.

## Key Features

- **Start a Space Instantly:** Create a LiveKit room and share the join Frame in one tap.
- **Join & Speak:** Listeners can request the mic; hosts approve on-chain.
- **Wallet-Based Tipping:** Send USDC (or any ERC-20) tips to hosts/speakers via Base MiniKit.
- **Reactions = Micro-Tips:** Hearts, laughs, 🔥 all map to small preset tip amounts.
- **Invite Drawer:** Search & invite Farcaster friends without leaving the room.
- **Notifications:** Followers get an optional push when a host they follow goes live.

## User Flow

1. **Add Spaces to Farcaster:** User opens the mini-app and adds it to their sidebar.
2. **Configure Wallet Permissions:** User grants spend permissions for tipping (optional).
3. **Start a Space:** Set a title → Creates LiveKit room + Frame link.
4. **Invite & Speak:** Host invites friends; listeners request to speak.
5. **Tip & React:** Audience tips or reacts (micro-tips) during the show.
6. **Leave & Settle:** When the host ends the Space funds are already in their wallet.

## Data Model

- **User**
  - fid (Farcaster)
  - wallet `address`
  - `displayName`, `avatarUrl`
  - `hostedSpaces`, `participants`
  - `tipsSent`, `tipsReceived`
- **Space**
  - `id` (UUID)
  - `title`, `status`, `recording`
  - `hostId → User`
  - `participants`, `tips`, `reactions`
- **Participant**
  - `spaceId`, `userId`
  - `role` (HOST / SPEAKER / LISTENER)
  - `joinedAt`, `leftAt`
- **Tip**
  - `fromId`, `toId`, `spaceId`
  - `amount`, `tokenSymbol`, `txHash`
- **Reaction**
  - `userId`, `spaceId`, `type`, `tipId?`

See `prisma/schema.prisma` for the full schema.

## Tech Stack

- **Frontend:** Next.js 15, React Server Components, Tailwind CSS, Radix UI
- **Realtime Audio:** LiveKit Cloud, `@livekit/components-react`
- **Blockchain:** Base MiniKit contracts, wagmi, viem
- **Backend/Data:** PostgreSQL + Prisma, Upstash Redis (notifications)
- **Other:** Farcaster Frames (OnchainKit), Vaul Drawer UX, ESLint + Prettier

## Getting Started

1. **Install dependencies:**
   ```sh
   pnpm install
   ```
2. **Run database migrations & generate client:**
   ```sh
   pnpm prisma migrate dev --name init
   ```
3. **Run the development server:**
   ```sh
   pnpm dev
   ```
4. **Open in browser:** Visit <http://localhost:3000> and click **Start a Space**.

## Extending the Project

- Integrate gasless tips via Base’s relayer.
- Add live listener count to OG Frame image.
- Implement host analytics (top tippers, time-in-room).
- Ship a mobile PWA wrapper for native push and background audio.
- Enable token-gated rooms (NFT or ERC-20 holders).
