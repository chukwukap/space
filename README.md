# 🎙️ Farcaster Spaces – Audio Rooms, Tipping & Frames

> A Twitter-Spaces experience rebuilt for the Farcaster social graph. Start live audio rooms, invite speakers, tip hosts – all from inside Warpcast Frames.

## ✨ Features

|                           |                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------- |
| 🟣 **Start a Space**      | One click to create a LiveKit room and broadcast the link (or Frame) to Farcaster.      |
| 🎧 **Join & Speak**       | Listeners become speakers with on-chain mic requests.                                   |
| 💸 **Tipping**            | Send USDC (or any ERC-20) tips to hosts & speakers via Base MiniKit – gasless optional. |
| ❤️ **Reactions**          | Emoji reactions double as micro-tips (e.g. $0.05).                                      |
| 🎞 **Frames Integration** | “Join”, “Tip” & live metadata rendered directly in Warpcast.                            |
| 🔔 **Notifications**      | Optional push when followed hosts go live (Upstash Redis).                              |

## 🏗 Tech Stack

| Layer          | Tech                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| Realtime Media | **LiveKit Cloud**, `livekit-client`, `@livekit/components-react`           |
| Web Framework  | **Next.js 15** (App Router, RSC)                                           |
| UI & Styling   | Tailwind CSS 3, Radix UI, Vaul Drawer                                      |
| Wallet / Chain | `wagmi`, `viem`, **Base MiniKit**                                          |
| Farcaster      | `@farcaster/frame-sdk`, **OnchainKit**                                     |
| Data           | **Prisma + Postgres** (users, spaces, tips), Upstash Redis (notifications) |

## 🔃 Architecture Diagram

```mermaid
flowchart TD
  A[Warpcast Frame] -->|Join / Tip| B(Next.js API Route)
  B --> C[LiveKit Cloud]
  B --> D[(Postgres + Prisma)]
  B --> E[[Base MiniKit Contracts]]
  B --> F[Upstash Redis]
  C --> G[Client Room UI]
```

## 🚀 Quick Start

```bash
# 1. Install deps (pnpm preferred)
pnpm install

# 2. Configure environment
cp .env.example .env.local  # & fill values (see below)

# 3. Generate Prisma client & DB
pnpm prisma migrate dev --name init

# 4. Run dev server
pnpm dev
# ➜ http://localhost:3000
```

### `.env.local` Template

```dotenv
# — LiveKit —
LIVEKIT_URL=https://your-project.livekit.cloud
LIVEKIT_API_KEY=lk_...
LIVEKIT_API_SECRET=...
NEXT_PUBLIC_LIVEKIT_WS_URL=wss://your-project.livekit.cloud

# — Database —
DATABASE_URL=postgresql://user:pass@localhost:5432/spaces

# — Base MiniKit / OnchainKit —
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=Farcaster Spaces
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_ICON_URL=https://yourcdn/icon.png
NEXT_PUBLIC_ONCHAINKIT_API_KEY=...

# Frame account-association headers (generated via `npx create-onchain --manifest`)
FARCASTER_HEADER=
FARCASTER_PAYLOAD=
FARCASTER_SIGNATURE=

# — Redis (optional) —
REDIS_URL=
REDIS_TOKEN=
```

## 📂 Project Structure

```
miniapp/
├─ app/                 # Next.js routes (RSC + client)
│  ├─ page.tsx          # Landing – Live list & CTA
│  ├─ space/[id]/       # In-room UI (LiveKit)
│  └─ api/              # Serverless endpoints
│     ├─ livekit/       # Token issuing
│     ├─ spaces/        # Fetch live rooms
│     ├─ user/          # User CRUD
│     └─ ...
├─ components/          # Reusable UI (drawer, buttons)
├─ lib/                 # Server / client helpers
├─ prisma/              # Schema & migrations
├─ public/              # Images / OG assets
└─ tailwind.config.ts
```

## 🛠 Scripts

| Command                   | Purpose                               |
| ------------------------- | ------------------------------------- |
| `pnpm dev`                | Start local dev server (Hot Reloader) |
| `pnpm build`              | Production build                      |
| `pnpm start`              | Run built app                         |
| `pnpm prisma migrate dev` | Run new DB migration                  |
| `pnpm lint`               | ESLint + Prettier                     |

## 🔐 Security Notes

1. **Never** expose `LIVEKIT_API_SECRET` to the client – token generation stays server-side.
2. Rate-limit critical endpoints (`/api/livekit`, tipping) in production.
3. Use Vercel/Cloudflare secrets for env management.
4. Sanitize user-generated content and follow OWASP best practices.

## 🛣 Roadmap

- [x] MVP: start/join spaces, invite sheet, tipping schema
- [ ] Full tipping workflow via Base MiniKit
- [ ] OG Frame image with live listeners count
- [ ] Host analytics dashboard
- [ ] Mobile PWA wrapper (Expo)

## 🤝 Contributing

PRs & issues are welcome – feel free to open one! Please follow the Airbnb + Prettier ESLint rules and commit with Conventional Commits.

## 📝 License

MIT © 2025 Farcaster Spaces contributors
