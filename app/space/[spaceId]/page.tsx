import { prisma } from "@/lib/prisma";
import SpaceRoom from "./_components/spaceRoom";

export const revalidate = 0;

export default async function SpacePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;

  let spaceWithHost;
  try {
    spaceWithHost = await prisma.space.findUnique({
      where: { livekitName: spaceId },
      include: {
        participants: {
          where: { role: "HOST" },
          include: { user: true },
        },
        host: true,
      },
    });

    console.log("spaceWithHost", JSON.stringify(spaceWithHost, null, 2));
  } catch {
    // Optionally log error here
    return (
      <div>
        <h2>Database Error</h2>
        <p>Could not load this space. Please try again later.</p>
      </div>
    );
  }

  if (!spaceWithHost) {
    return <div>Space not found</div>;
  }

  if (spaceWithHost.status !== "LIVE") {
    return <div>This space has already ended</div>;
  }

  return <SpaceRoom space={spaceWithHost} />;
}
