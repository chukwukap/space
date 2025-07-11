export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";

const SpacesFeed = dynamicImport(() => import("@/app/components/SpacesFeed"), {
  ssr: false,
});

export default function SpacesPage() {
  return <SpacesFeed />;
}
