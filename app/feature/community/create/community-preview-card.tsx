"use client";

import { Users } from "lucide-react";

import { CommunityBanner, CommunityIcon, communityHandle } from "../_components/community-identity";
import { useFilePreview } from "../_components/community-picture-input";

type CommunityPreviewCardProps = {
  name: string;
  slug: string;
  description: string;
  topics: string[];
  banner: File | null;
  icon: File | null;
};

/** Live preview of how a new community will look in lists, updated as the creator types. */
export function CommunityPreviewCard({ name, slug, description, topics, banner, icon }: CommunityPreviewCardProps) {
  const bannerUrl = useFilePreview(banner);
  const iconUrl = useFilePreview(icon);
  const seed = slug || "new-community";
  const displayName = name.trim() || "communityname";

  return (
    <figure aria-label="Community preview" className="overflow-hidden rounded-2xl bg-card shadow-md ring-1 ring-border">
      <CommunityBanner seed={seed} src={bannerUrl} alt="" className="h-20" />
      <div className="px-4 pb-4">
        <CommunityIcon
          name={displayName}
          seed={seed}
          src={iconUrl}
          size="lg"
          className="-mt-5 size-12 text-lg ring-4 ring-card"
        />
        <p className="mt-2 truncate text-base font-extrabold text-foreground">
          {communityHandle(slug || undefined, displayName)}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" aria-hidden="true" />1 member · just you for now
        </p>
        <p className="mt-3 line-clamp-4 min-h-10 break-words text-sm leading-5 text-muted-foreground">
          {description.trim() || "Your community description"}
        </p>
        {topics.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {topics.map((topic) => (
              <li key={topic} className="rounded-full bg-secondary px-2 py-0.5 text-[0.6875rem] font-semibold text-secondary-foreground">
                {topic}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </figure>
  );
}
