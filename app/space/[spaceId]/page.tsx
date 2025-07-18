import { prisma } from "@/lib/prisma";
import SpaceRoom from "./_components/spaceRoom";

export const revalidate = 0;

export default async function SpacePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;

  const space = await prisma.space.findUnique({
    where: { livekitName: spaceId },
    include: {
      participants: {
        where: { role: "HOST" },
        include: { user: true },
      },
    },
  });

  if (!space) {
    return <div>Space not found</div>;
  }

  if (space.status !== "LIVE") {
    return <div>This space has already ended</div>;
  }

  return <SpaceRoom space={space} />;
}
