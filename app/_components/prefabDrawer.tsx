// "use client";

// /**
//  * PrefabDrawer – Space preview & join sheet
//  * ----------------------------------------------------------
//  * Displays key information (title, host, speakers, listener count)
//  * and a prominent “Start listening” button. The drawer mirrors the
//  * familiar Twitter-Spaces join sheet UX while remaining lightweight
//  * and fully typed.
//  */

// import Image from "next/image";
// import {
//   Drawer,
//   DrawerContent,
//   DrawerHeader,
//   DrawerTitle,
//   DrawerFooter,
//   DrawerClose,
// } from "@/components/ui/drawer";
// import { Xmark } from "iconoir-react";
// import { Room } from "livekit-server-sdk";
// import clsx from "clsx";
// import { HTMLAttributes } from "react";
// import { SpaceMetadata } from "@/lib/types";
// import useSWR from "swr";
// import MobileHeader from "./mobileHeader";
// import { ThemeToggle } from "./themeToggle";

// /**
//  * Fetch spaces by names (passed as search param, comma-separated)
//  */
// const fetchSpacesByNames = async (url: string): Promise<Room[]> => {
//   const res = await fetch(url);
//   if (!res.ok) throw new Error("Failed to fetch");
//   const data: Room[] = await res.json();
//   return data;
// };

// interface PrefabDrawerProps extends HTMLAttributes<HTMLDivElement> {
//   spaceId: string | null; // This is the room name
//   callback: (space: Room) => void;
// }

// export default function PrefabDrawer({
//   spaceId,
//   callback,
//   ...rest
// }: PrefabDrawerProps) {
//   const apiUrl = `/api/spaces?names=${spaceId}`;
//   // const {
//   //   data: spaces,
//   //   error,
//   //   isLoading,
//   // } = useSWR<Room[]>(spaceId ? apiUrl : null, fetchSpacesByNames, {
//   //   refreshInterval: 1000 * 60 * 10, // 10min
//   // });
//   // Find the space by name (should be only one in this context)
//   // const space = spaces && spaces.length > 0 ? spaces[0] : null;

//   // if (isLoading) {
//   //   return (
//   //     <div className="flex flex-col min-h-screen">
//   //       <MobileHeader
//   //         title="Spaces"
//   //         showBack={false}
//   //         right={<ThemeToggle />}
//   //         lowerVisible={false}
//   //       />
//   //       <section className="p-6 text-center text-lg font-medium">
//   //         Loading space...
//   //       </section>
//   //     </div>
//   //   );
//   // }

//   // if (error || !space) {
//   //   return (
//   //     <div className="flex flex-col min-h-screen">
//   //       <MobileHeader
//   //         title="Spaces"
//   //         showBack={false}
//   //         right={<ThemeToggle />}
//   //         lowerVisible={false}
//   //       />
//   //       <section className="p-6 text-center text-lg text-red-500 font-medium">
//   //         Failed to load space.
//   //         {error}
//   //       </section>
//   //     </div>
//   //   );
//   // }

//   // Parse metadata if present
//   // const metadata: SpaceMetadata | null = space.metadata
//   //   ? JSON.parse(space.metadata)
//   //   : null;

//   return (
//     <Drawer open={true} shouldScaleBackground>
//       <DrawerContent
//         className={clsx(
//           "bg-card text-foreground rounded-t-2xl border border-border",
//         )}
//         {...rest}
//       >
//         {/* Header */}
//         <DrawerHeader className="px-6 pb-1 text-center relative">
//           {/* Quick close */}
//           <DrawerClose asChild>
//             <button
//               className="absolute right-6 top-1 text-muted-foreground transition-colors"
//               aria-label="Close"
//             >
//               <Xmark className="w-5 h-5" />
//             </button>
//           </DrawerClose>

//           <DrawerTitle
//             className="text-lg font-semibold leading-snug line-clamp-2"
//             style={{ fontFamily: "Sora, sans-serif" }}
//           >
//             {metadata?.title || space.name}
//           </DrawerTitle>
//         </DrawerHeader>

//         {/* Host & Speakers */}
//         <div className="flex items-center gap-3 px-6 mt-3 overflow-x-auto scrollbar-none">
//           {/* Host */}
//           {metadata?.host && (
//             <Avatar
//               src={metadata.host.pfpUrl}
//               name={metadata.host.displayName || "Host"}
//               role="Host"
//             />
//           )}
//         </div>

//         {/* Listener count */}
//         <p className="px-6 mt-4 text-sm text-muted-foreground">
//           +{Math.max((space.numParticipants ?? 0) - 2, 0).toLocaleString()}{" "}
//           other listeners
//         </p>

//         {/* Mic hint */}
//         <p className="px-6 mt-2 text-xs text-muted-foreground">
//           Your mic will be off to start
//         </p>

//         {/* Footer */}
//         <DrawerFooter className="pt-4 border-t border-border">
//           <button
//             onClick={() => {
//               callback(space);
//             }}
//             className="w-full py-3 rounded-full aurora-bg glow-hover text-white text-base font-semibold active:scale-[0.97] transition-transform"
//           >
//             Start listening
//           </button>
//           {/* Cancel / close for accessibility */}
//           <DrawerClose asChild>
//             <button className="mx-auto mt-1 text-sm text-muted-foreground">
//               Close
//             </button>
//           </DrawerClose>
//         </DrawerFooter>
//       </DrawerContent>
//     </Drawer>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* Helper components                                                   */
// /* ------------------------------------------------------------------ */

// function Avatar({
//   src,
//   name,
//   role,
// }: {
//   src?: string | null;
//   name?: string;
//   role: "Host" | "Speaker";
// }) {
//   return (
//     <div className="flex flex-col items-center gap-1 min-w-[56px]">
//       <div className="w-14 h-14 rounded-full overflow-hidden bg-muted">
//         <Image
//           src={src || "/icon.png"}
//           alt={name || role}
//           width={56}
//           height={56}
//           className="object-cover w-full h-full"
//         />
//       </div>
//       <span className="text-xs font-medium truncate max-w-[56px]">
//         {name || role}
//       </span>
//       <span className="text-[10px] text-muted-foreground">{role}</span>
//     </div>
//   );
// }
