/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during `next build` – generated Prisma WASM & other vendor
  // files trigger thousands of warnings that block the build. We still run
  // `pnpm lint` separately for first-party code.
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        hostname: "avatar.tobi.sh",
      },
      {
        hostname: "imagedelivery.net",
      },
      {
        hostname: "api.dicebear.com",
      },
    ],
  },
  // Silence warnings from WalletConnect deps
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
