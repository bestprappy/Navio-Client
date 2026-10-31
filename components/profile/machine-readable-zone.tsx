import { toMachineReadableLines } from "@/lib/profile-document";

type MachineReadableZoneProps = {
  displayName: string;
  userId: string;
  memberSince: string | null;
};

/** The passport-style strip along the foot of the profile card. Purely visual. */
export function MachineReadableZone({ displayName, userId, memberSince }: MachineReadableZoneProps) {
  const lines = toMachineReadableLines({ displayName, userId, memberSince });

  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-t border-border bg-well px-5 py-3 font-mono text-[0.6875rem] leading-relaxed tracking-[0.18em] whitespace-pre text-muted-foreground select-none sm:px-7 sm:text-xs"
    >
      {lines.map((line, index) => (
        <div key={index} className="truncate [text-overflow:clip]">
          {line}
        </div>
      ))}
    </div>
  );
}
