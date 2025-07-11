# 🎙️ **Farcaster Spaces**

**Own your conversations.** Spin up a live audio room, invite your Farcaster frens, and get paid in real-time when the crowd shows love.  
Built on open protocols – LiveKit for low-latency audio and Base MiniKit for on-chain tips – Spaces turns social audio into a crypto-native experience.

---

## 🚀 Why Spaces?

Traditional audio platforms capture the value you create and fence off your audience.  
With Spaces **you** hold the keys:

- **Wallet-to-wallet monetisation** – listeners tip you directly, no middlemen.
- **Portable audience** – your room link is a Farcaster Frame, shareable anywhere.
- **100% transparent economics** – every tip is an on-chain receipt.

---

## ✨ Feature Highlights

|                               |                                                                               |
| :---------------------------- | :---------------------------------------------------------------------------- |
| 🎤 **One-tap Rooms**          | Pick a title, click _Go Live_. We create a LiveKit room + Frame instantly.    |
| 🧑‍🤝‍🧑 **Invite Drawer**          | Search your following list and bring speakers on stage without breaking flow. |
| ❤️ **Reactions = Micro-tips** | Emojis aren’t just vanity metrics – each one sends a tiny USDC tip.           |
| 💸 **Direct Tips**            | Bigger applause? Send any ERC-20 via Base MiniKit contracts.                  |
| 🪄 **Frames Magic**           | Join, React, Tip – all happen right inside Warpcast.                          |
| 🔔 **Go-Live Alerts**         | Followers opt-in to on-chain notifications the moment you hit _Start_.        |

---

## 🛣️ User Journey

1. **Add Spaces** to your Farcaster sidebar.
2. **Connect Wallet** (optional) – grant a minimal spend allowance for micro-tips.
3. **Start a Space** – we mint a unique room slug and publish the Frame.
4. **Micro-Monetise** – reactions & tips flow in while you talk.
5. **End Room** – audio archive & earnings summary are yours; no platform fees.

---

## 🗃️ Data Blueprint

| Entity          | Fields (primary)                                         |
| --------------- | -------------------------------------------------------- |
| **User**        | `fid`, `address`, `displayName`, social stats            |
| **Space**       | `id`, `title`, `status`, `hostId`, timestamps            |
| **Participant** | `spaceId`, `userId`, `role`, join/leave times            |
| **Tip**         | `fromId`, `toId`, `spaceId`, `amount`, `token`, `txHash` |
| **Reaction**    | `userId`, `spaceId`, `type`, optional `tipId` linkage    |

Full schema lives in [`prisma/schema.prisma`](./prisma/schema.prisma).

---

## 🏗️ Under the Hood

```mermaid
flowchart TD
  A[Warpcast Frame] --> B(Next.js Edge API)
  B --> C[LiveKit Cloud]
  B --> D[(Postgres \n+ Prisma)]
  B --> E{{Base MiniKit}}
  B --> F[Upstash Redis]
  C --> G[React Client UI]
```

### Tech Stack

- **Next.js 15** – App Router + RSC
- **LiveKit** – sub-100 ms audio streaming
- **Tailwind CSS 3** + Radix UI – sleek, accessible components
- **Base MiniKit** + `wagmi` / `viem` – gas-optimised tipping
- **Prisma ORM** + Postgres – relational data, type-safe queries
- **Redis (Upstash)** – fan-out notifications
- **OnchainKit** – Frame metadata & signing

---

## 🏁 Quick Start

```bash
# 1. Install deps
pnpm install

# 2. Create database & generate client
env DATABASE_URL=postgres://user:pass@localhost/spaces \
  pnpm prisma migrate dev --name init

# 3. Copy env template & fill secrets
cp .env.example .env.local

# 4. Run dev server
pnpm dev
```

Visit **http://localhost:3000** and hit _Start a Space_ – you’re live in seconds.

---

## 🔧 Extend & Hack

- **Gasless mode** – plug in Base relayer for subsidised tips.
- **Token-gated rooms** – restrict entry to NFT or ERC-20 holders.
- **Analytics dashboard** – surface top tippers & average listen time.
- **PWA shell** – enable background audio + push on mobile.

---

## 🤝 Contributing

Ideas, bug reports, or killer PRs are welcome. Please follow Conventional Commits and our ESLint rules. Let’s make Farcaster a little louder together.

---

## 📝 License

MIT © 2025 Spaces contributors
