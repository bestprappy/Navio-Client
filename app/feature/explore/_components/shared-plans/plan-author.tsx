import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const ANONYMOUS_AUTHOR = "a Navio traveler";

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => Array.from(word)[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type PlanAuthorProps = {
  /** The byline the owner published under; null renders "a Navio traveler". */
  name: string | null | undefined;
  size?: "sm" | "default";
  className?: string;
};

/**
 * "Shared by …" for a published plan.
 *
 * <p>Initials only, no photo: the byline is a display name frozen at publish
 * time, and fetching a picture would need the owner's account id, which the
 * public routes deliberately never carry.
 */
export function PlanAuthor({ name, size = "sm", className }: PlanAuthorProps) {
  const shown = name?.trim() || null;
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <Avatar size={size} aria-hidden="true">
        <AvatarFallback className="font-semibold">
          {shown ? initialsOf(shown) : "N"}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 truncate">
        Shared by{" "}
        <span className={cn(shown && "font-medium text-foreground")}>{shown ?? ANONYMOUS_AUTHOR}</span>
      </span>
    </span>
  );
}
