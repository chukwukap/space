"use client";
import { useRouter } from "next/navigation";

interface SpaceCardProps {
  space: {
    name: string;
    title?: string;
    participants: number;
    identities?: string[]; // up to 3 participant identities for avatars
  };
}

// Derive a deterministic background colour from a string (simple hash)
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

function Avatar({ id }: { id: string }) {
  return (
    <div
      key={id}
      style={{ backgroundColor: stringToColor(id) }}
      className="w-6 h-6 rounded-full border-2 border-violet-600 flex items-center justify-center text-[10px] font-semibold text-white"
    >
      {id.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default function SpaceCard({ space }: SpaceCardProps) {
  const router = useRouter();
  return (
    <div
      className="bg-violet-600/90 hover:bg-violet-600 transition-colors rounded-2xl p-4 shadow-md text-white cursor-pointer"
      onClick={() => router.push(`/space/${space.name}`)}
    >
      <div className="text-xs uppercase mb-2 flex items-center gap-1">
        <span className="inline-block w-1 h-1 rounded-full bg-red-500 animate-pulse" />
        Live
      </div>
      <h3 className="text-lg font-semibold leading-snug mb-3 line-clamp-2">
        {space.title || "Untitled Space"}
      </h3>
      <div className="flex items-center gap-2 text-sm">
        <div className="flex -space-x-2">
          {(space.identities && space.identities.length > 0
            ? space.identities
            : ["", "", ""]
          )
            .slice(0, 3)
            .map((id, i) =>
              id ? (
                <Avatar id={id} key={id} />
              ) : (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-violet-400 border-2 border-violet-600"
                />
              ),
            )}
        </div>
        <span>{space.participants} listening</span>
      </div>
    </div>
  );
}
