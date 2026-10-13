"use client";

import { useState } from "react";
import {
  HandHeart,
  Heart,
  Laugh,
  Lightbulb,
  Plane,
  SmilePlus,
  type LucideIcon,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { cn } from "@/lib/utils";
import { useCommentReaction } from "./community-queries";
import type { CommunityReaction, CommunityReactionSummary } from "./data";

type ReactionStyle = {
  label: string;
  icon: LucideIcon;
  /** Ink for the icon, and the tint used once the viewer has reacted. */
  ink: string;
  chosen: string;
};

export const REACTION_STYLES: Record<CommunityReaction, ReactionStyle> = {
  helpful: {
    label: "Helpful",
    icon: Lightbulb,
    ink: "text-react-helpful",
    chosen: "bg-react-helpful/12 ring-react-helpful/45",
  },
  love: {
    label: "Love",
    icon: Heart,
    ink: "text-react-love",
    chosen: "bg-react-love/12 ring-react-love/45",
  },
  funny: {
    label: "Funny",
    icon: Laugh,
    ink: "text-react-funny",
    chosen: "bg-react-funny/12 ring-react-funny/45",
  },
  thanks: {
    label: "Thanks",
    icon: HandHeart,
    ink: "text-react-thanks",
    chosen: "bg-react-thanks/12 ring-react-thanks/45",
  },
  want_to_go: {
    label: "Want to go",
    icon: Plane,
    ink: "text-react-want-to-go",
    chosen: "bg-react-want-to-go/12 ring-react-want-to-go/45",
  },
};

const ORDER = Object.keys(REACTION_STYLES) as CommunityReaction[];

type CommentReactionsProps = {
  postId: string;
  commentId: string;
  reactions: CommunityReactionSummary[];
  canReact: boolean;
};

/**
 * Reaction chips under a comment plus a picker. Chips toggle the viewer's own
 * reaction; counts update optimistically and re-sync with the server.
 */
export function CommentReactions({
  postId,
  commentId,
  reactions,
  canReact,
}: CommentReactionsProps) {
  const mutation = useCommentReaction(postId);
  const { requireAuth } = useRequireAuth();
  const [open, setOpen] = useState(false);

  function toggle(reaction: CommunityReaction) {
    const current = reactions.find((item) => item.reaction === reaction);
    requireAuth(() =>
      mutation.mutate({ commentId, reaction, active: !current?.reacted }),
    );
  }

  return (
    <>
      {reactions.map(({ reaction, count, reacted }) => {
        const style = REACTION_STYLES[reaction];
        const Icon = style.icon;
        return (
          <button
            key={reaction}
            type="button"
            disabled={!canReact}
            aria-pressed={reacted}
            aria-label={`${style.label}, ${count} ${count === 1 ? "reaction" : "reactions"}${reacted ? ", including yours" : ""}`}
            onClick={() => toggle(reaction)}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-full px-2 text-xs font-semibold tabular-nums ring-1 ring-border transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:hover:bg-transparent",
              reacted ? style.chosen : "text-muted-foreground",
            )}
          >
            <Icon
              className={cn("size-3.5", style.ink)}
              fill={reacted ? "currentColor" : "none"}
              fillOpacity={0.25}
              aria-hidden="true"
            />
            <span className={reacted ? "text-foreground" : undefined}>{count}</span>
          </button>
        );
      })}

      {canReact ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                aria-label="Add reaction"
                className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            }
          >
            <SmilePlus className="size-4" aria-hidden="true" />
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            sideOffset={6}
            className="w-auto gap-0 rounded-full bg-popover p-1 shadow-lg ring-1 ring-border"
          >
            <div role="group" aria-label="Reactions" className="flex items-center gap-0.5">
              {ORDER.map((reaction) => {
                const style = REACTION_STYLES[reaction];
                const Icon = style.icon;
                const reacted = reactions.some(
                  (item) => item.reaction === reaction && item.reacted,
                );
                return (
                  <button
                    key={reaction}
                    type="button"
                    title={style.label}
                    aria-label={style.label}
                    aria-pressed={reacted}
                    onClick={() => {
                      toggle(reaction);
                      setOpen(false);
                    }}
                    className={cn(
                      "inline-flex size-9 items-center justify-center rounded-full transition-transform hover:scale-110 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:hover:scale-100",
                      reacted && style.chosen,
                    )}
                  >
                    <Icon className={cn("size-5", style.ink)} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}

      {mutation.error ? (
        <span role="alert" className="basis-full text-xs text-destructive">
          {mutation.error.message}
        </span>
      ) : null}
    </>
  );
}
