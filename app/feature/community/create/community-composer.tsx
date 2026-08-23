"use client";

import { useState, useRef, useEffect, useMemo, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Bold,
  Italic,
  Strikethrough,
  Superscript,
  Heading1,
  Link2,
  Image,
  Smile,
  List,
  ListOrdered,
  Highlighter,
  Quote,
  Code,
  Braces,
  Table2,
  MoreHorizontal,
  Check,
  ChevronDown,
  Search,
  Upload,
  Tag,
  X,
  MapPinned,
} from "lucide-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import {
  createPostDraftAtom,
  createdPostsAtom,
  joinedGroupIdsAtom,
} from "../_components/community-atoms";
import type {
  CommunityGroup,
  CommunityPost,
  SharedTrip,
} from "../_components/data";
import {
  currentCommunityUser,
  defaultCreatePostDraft,
  explorePlanSharedTrips,
  getCommunityPostHref,
  getTripById,
  parseTagList,
  slugifyCommunityValue,
} from "../_components/data";
import { CommunityFlairDialog } from "./community-flair-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type PostTab = "text" | "media" | "link" | "poll";

type CommunityComposerProps = {
  groups: CommunityGroup[];
  initialGroupId?: string | null;
  initialPlanId?: string | null;
};

function getSuggestedDiscussionGroup(
  trip: SharedTrip,
  groups: CommunityGroup[],
): CommunityGroup | null {
  const location = trip.location.toLowerCase();
  const tripTags = new Set(trip.tags.map((tag) => tag.toLowerCase()));
  const hasTagOverlap = (group: CommunityGroup) =>
    group.tags.some((tag) => tripTags.has(tag.toLowerCase()));
  const hasPlaceMatch = (group: CommunityGroup) =>
    group.places.some((place) => location.includes(place.toLowerCase()));
  const placeMatches = groups.filter(hasPlaceMatch);

  return (
    placeMatches.find(
      (group) =>
        group.name.toLowerCase().includes(location) && hasTagOverlap(group),
    ) ??
    placeMatches.find(hasTagOverlap) ??
    placeMatches.at(0) ??
    groups.find(
      (group) =>
        group.country.toLowerCase() === trip.country.toLowerCase() &&
        hasTagOverlap(group),
    ) ??
    groups.find(
      (group) => group.country.toLowerCase() === trip.country.toLowerCase(),
    ) ??
    groups.at(0) ??
    null
  );
}

export function CommunityComposer({
  groups,
  initialGroupId = null,
  initialPlanId = null,
}: CommunityComposerProps) {
  const router = useRouter();
  const [postDraft, setPostDraft] = useAtom(createPostDraftAtom);
  const setCreatedPosts = useSetAtom(createdPostsAtom);
  const joinedGroupIds = useAtomValue(joinedGroupIdsAtom);

  const [activeTab, setActiveTab] = useState<PostTab>("text");
  const [communityOpen, setCommunityOpen] = useState(false);
  const [communitySearch, setCommunitySearch] = useState("");
  const [flairDialogOpen, setFlairDialogOpen] = useState(false);
  const [selectedFlairId, setSelectedFlairId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const appliedPrefillKeyRef = useRef<string | null>(null);
  const selectableTrips = useMemo(() => explorePlanSharedTrips, []);
  const queryGroupId = initialGroupId;
  const queryPlanId = initialPlanId;

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setCommunityOpen(false);
      }
    }
    if (communityOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [communityOpen]);

  const selectedGroup = groups.find((g) => g.id === postDraft.groupId);

  useEffect(() => {
    const prefillKey = `${queryGroupId ?? ""}:${queryPlanId ?? ""}`;

    if (
      appliedPrefillKeyRef.current === prefillKey ||
      (!queryGroupId && !queryPlanId)
    ) {
      return;
    }

    const queryTrip = queryPlanId
      ? (selectableTrips.find(
          (trip) =>
            trip.id === queryPlanId || trip.sourcePlanId === queryPlanId,
        ) ?? getTripById(queryPlanId))
      : null;
    const explicitGroup = queryGroupId
      ? groups.find((group) => group.id === queryGroupId)
      : null;
    const suggestedGroup = queryTrip
      ? getSuggestedDiscussionGroup(queryTrip, groups)
      : null;
    const nextGroup = explicitGroup ?? suggestedGroup;

    setPostDraft((prev) => ({
      ...prev,
      groupId: nextGroup?.id ?? prev.groupId,
      place: queryTrip?.location ?? nextGroup?.places[0] ?? prev.place,
      country: queryTrip?.country ?? nextGroup?.country ?? prev.country,
      tags:
        queryTrip && !prev.tags.trim()
          ? queryTrip.tags.slice(0, 5).join(", ")
          : prev.tags,
      title:
        queryTrip && !prev.title.trim()
          ? `Plan review: ${queryTrip.title}`.slice(0, 300)
          : prev.title,
      body:
        queryTrip && !prev.body.trim()
          ? "Looking for community feedback on pacing, stop order, charging timing, and local swaps for this Explore plan."
          : prev.body,
      attachTrip: queryTrip ? true : prev.attachTrip,
      sharedTripId: queryTrip ? queryTrip.id : prev.sharedTripId,
    }));
    appliedPrefillKeyRef.current = prefillKey;
  }, [
    groups,
    queryGroupId,
    queryPlanId,
    selectableTrips,
    setPostDraft,
  ]);

  const filteredGroups = communitySearch
    ? groups.filter((g) =>
        g.name.toLowerCase().includes(communitySearch.toLowerCase()),
      )
    : groups;

  function handleSelectGroup(group: CommunityGroup) {
    setPostDraft((prev) => ({
      ...prev,
      groupId: group.id,
      country: group.country,
      place: group.places[0] ?? group.country,
    }));
    setSelectedFlairId(null);
    setCommunityOpen(false);
    setCommunitySearch("");
  }

  function handleAttachTripChange(checked: boolean) {
    const nextTripId =
      postDraft.sharedTripId ?? selectableTrips[0]?.id ?? null;
    const nextTrip = nextTripId
      ? selectableTrips.find((trip) => trip.id === nextTripId)
      : null;

    setPostDraft((prev) => ({
      ...prev,
      attachTrip: checked,
      sharedTripId: checked ? nextTripId : null,
      place: checked && nextTrip ? nextTrip.location : prev.place,
      country: checked && nextTrip ? nextTrip.country : prev.country,
    }));
  }

  function handleSelectTrip(tripId: string) {
    const trip = selectableTrips.find((item) => item.id === tripId);

    setPostDraft((prev) => ({
      ...prev,
      sharedTripId: tripId,
      place: trip?.location ?? prev.place,
      country: trip?.country ?? prev.country,
      tags: prev.tags || trip?.tags.slice(0, 5).join(", ") || prev.tags,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = postDraft.title.trim();
    if (!title || !postDraft.groupId) return;

    const group = groups.find((g) => g.id === postDraft.groupId);
    if (!group) return;

    const nextPost: CommunityPost = {
      id: `post-local-${slugifyCommunityValue(title)}-${Date.now()}`,
      groupId: postDraft.groupId,
      authorId: currentCommunityUser.id,
      title,
      body: postDraft.body.trim(),
      createdAt: new Date().toISOString(),
      upvotes: 1,
      commentCount: 0,
      tags: parseTagList(postDraft.tags),
      place: postDraft.place || group.places[0] || "Thailand",
      country: postDraft.country || group.country || "Thailand",
      sharedTripId:
        postDraft.attachTrip && postDraft.sharedTripId
          ? postDraft.sharedTripId
          : undefined,
      flairId: selectedFlairId ?? undefined,
    };

    setCreatedPosts((prev) => [nextPost, ...prev]);
    setPostDraft({ ...defaultCreatePostDraft });
    setSelectedFlairId(null);
    router.push(getCommunityPostHref(group, nextPost));
  }

  const canPost =
    postDraft.title.trim().length > 0 && postDraft.groupId.length > 0;

  const TABS: { id: PostTab; label: string }[] = [
    { id: "text", label: "Text" },
    { id: "media", label: "Images & Video" },
    { id: "link", label: "Link" },
    { id: "poll", label: "Poll" },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Community selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setCommunityOpen((prev) => !prev)}
          className={cn(
            "flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium transition hover:border-foreground/30",
            communityOpen && "border-foreground/40",
          )}
          aria-haspopup="listbox"
          aria-expanded={communityOpen}
        >
          {selectedGroup ? (
            <>
              <span className="flex size-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                {selectedGroup.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedGroup.avatarUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold">r</span>
                )}
              </span>
              <span className="max-w-[160px] truncate">{selectedGroup.name}</span>
            </>
          ) : (
            <>
              <span className="flex size-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/50">
                <span className="text-[9px] font-extrabold text-muted-foreground">
                  N
                </span>
              </span>
              <span className="text-muted-foreground">Select a community</span>
            </>
          )}
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform",
              communityOpen && "rotate-180",
            )}
          />
        </button>

        {communityOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
            <div className="p-2">
              <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
                <Search className="size-3.5 flex-shrink-0 text-muted-foreground" />
                <input
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Select a community"
                  value={communitySearch}
                  onChange={(e) => setCommunitySearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <ul
              role="listbox"
              aria-label="Communities"
              className="max-h-64 overflow-y-auto"
            >
              {!communitySearch && (
                <li
                  role="option"
                  aria-selected={false}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50"
                  onClick={() => setCommunityOpen(false)}
                >
                  <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    N
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">u/{currentCommunityUser.handle}</p>
                    <p className="text-xs text-muted-foreground">Your profile</p>
                  </div>
                </li>
              )}

              {filteredGroups.map((group) => {
                const isJoined = joinedGroupIds.includes(group.id);
                const isSelected = postDraft.groupId === group.id;
                return (
                  <li
                    key={group.id}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50",
                      isSelected && "bg-muted/50",
                    )}
                    onClick={() => handleSelectGroup(group)}
                  >
                    <span className="flex size-8 shrink-0 overflow-hidden rounded-full bg-muted">
                      {group.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={group.avatarUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-xs font-bold">
                          r
                        </span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{group.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.memberCount.toLocaleString()} members
                        {isJoined ? " · Joined" : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            disabled={tab.id === "poll"}
            className={cn(
              "relative px-4 py-2.5 text-sm font-semibold transition-colors",
              activeTab === tab.id
                ? "text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[var(--color-brand)]"
                : "text-muted-foreground hover:text-foreground",
              tab.id === "poll" && "cursor-not-allowed opacity-40",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Title */}
      <div className="relative rounded-lg border border-border bg-card">
        <input
          id="post-title"
          type="text"
          value={postDraft.title}
          onChange={(e) =>
            setPostDraft((prev) => ({
              ...prev,
              title: e.target.value.slice(0, 300),
            }))
          }
          placeholder="Title*"
          maxLength={300}
          required
          aria-label="Post title"
          className="w-full rounded-lg bg-transparent px-4 py-3 pb-6 text-sm outline-none placeholder:text-muted-foreground"
        />
        <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
          {postDraft.title.length}/300
        </span>
      </div>

      {/* Add flair and tags */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => selectedGroup && setFlairDialogOpen(true)}
          disabled={!selectedGroup}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-foreground/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Tag className="size-3" aria-hidden="true" />
          Add flair and tags
          <span className="text-destructive" aria-hidden="true">*</span>
        </button>

        {selectedFlairId && selectedGroup && (() => {
          const flair = selectedGroup.postFlairs.find(
            (f) => f.id === selectedFlairId,
          );
          return flair ? (
            <span className="flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
              {flair.label}
              <button
                type="button"
                onClick={() => setSelectedFlairId(null)}
                aria-label={`Remove ${flair.label} flair`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ) : null;
        })()}
      </div>

      {flairDialogOpen && selectedGroup && (
        <CommunityFlairDialog
          group={selectedGroup}
          selectedFlairId={selectedFlairId}
          onConfirm={setSelectedFlairId}
          onClose={() => setFlairDialogOpen(false)}
        />
      )}

      {/* Content area */}
      {activeTab === "text" && (
        <div className="rounded-lg border border-border bg-card">
          <div
            role="toolbar"
            aria-label="Text formatting"
            className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5"
          >
            <ToolbarButton icon={Bold} label="Bold" />
            <ToolbarButton icon={Italic} label="Italic" />
            <ToolbarButton icon={Strikethrough} label="Strikethrough" />
            <ToolbarButton icon={Superscript} label="Superscript" />
            <ToolbarButton icon={Heading1} label="Heading" />
            <ToolbarDivider />
            <ToolbarButton icon={Link2} label="Link" />
            <ToolbarButton icon={Image} label="Insert image" />
            <ToolbarButton icon={Smile} label="Emoji" />
            <ToolbarDivider />
            <ToolbarButton icon={List} label="Bullet list" />
            <ToolbarButton icon={ListOrdered} label="Numbered list" />
            <ToolbarDivider />
            <ToolbarButton icon={Highlighter} label="Highlight" />
            <ToolbarButton icon={Quote} label="Blockquote" />
            <ToolbarButton icon={Code} label="Inline code" />
            <ToolbarButton icon={Braces} label="Code block" />
            <ToolbarButton icon={Table2} label="Table" />
            <div className="ml-auto">
              <ToolbarButton icon={MoreHorizontal} label="More options" />
            </div>
          </div>
          <textarea
            value={postDraft.body}
            onChange={(e) =>
              setPostDraft((prev) => ({ ...prev, body: e.target.value }))
            }
            placeholder="Body text (optional)"
            rows={8}
            aria-label="Post body"
            className="w-full resize-y rounded-b-lg bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      )}

      {activeTab === "media" && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload media"
          className={cn(
            "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-card transition hover:border-foreground/30",
            isDragging &&
              "border-[var(--color-brand)] bg-[var(--color-brand)]/5",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onClick={() =>
            document.getElementById("post-media-upload")?.click()
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              document.getElementById("post-media-upload")?.click();
            }
          }}
        >
          <span className="flex size-10 items-center justify-center rounded-full border border-border bg-card shadow-sm">
            <Upload className="size-4 text-muted-foreground" aria-hidden="true" />
          </span>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-[var(--color-brand)]">
              Drag and Drop
            </span>{" "}
            or upload media
          </p>
          <input
            id="post-media-upload"
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            aria-label="Upload media file"
          />
        </div>
      )}

      {activeTab === "link" && (
        <div className="rounded-lg border border-border bg-card">
          <input
            type="url"
            placeholder="Url"
            aria-label="Post URL"
            className="w-full rounded-lg bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      )}

      <PlanAttachmentSelector
        trips={selectableTrips}
        attachTrip={postDraft.attachTrip}
        selectedTripId={postDraft.sharedTripId}
        onAttachChange={handleAttachTripChange}
        onSelectTrip={handleSelectTrip}
      />

      {/* Footer */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm">
          Save Draft
        </Button>
        <Button type="submit" size="sm" disabled={!canPost}>
          Post
        </Button>
      </div>
    </form>
  );
}

function PlanAttachmentSelector({
  trips,
  attachTrip,
  selectedTripId,
  onAttachChange,
  onSelectTrip,
}: {
  trips: SharedTrip[];
  attachTrip: boolean;
  selectedTripId: string | null;
  onAttachChange: (checked: boolean) => void;
  onSelectTrip: (tripId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedTrip =
    trips.find((trip) => trip.id === selectedTripId) ?? trips[0] ?? null;

  return (
    <section
      aria-label="Plan attachment"
      className="rounded-lg border border-border bg-card p-3"
    >
      <label className="flex cursor-pointer items-start gap-3 text-sm font-medium text-foreground">
        <Checkbox
          checked={attachTrip}
          onCheckedChange={(checked) => onAttachChange(checked === true)}
          aria-label="Attach an Explore plan"
          className="mt-0.5"
        />
        <span className="min-w-0">
          <span className="block">Discuss an Explore plan</span>
          {attachTrip && selectedTrip ? (
            <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
              {selectedTrip.title}
            </span>
          ) : null}
        </span>
      </label>

      {attachTrip ? (
        <div className="mt-3 grid gap-3">
          {trips.length > 0 ? (
            <>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto min-h-10 w-full justify-between gap-2 rounded-md px-3 py-2 text-left"
                      aria-label="Select Explore plan"
                    />
                  }
                >
                  <MapPinned
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {selectedTrip?.title ?? "Select an Explore plan"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      open && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={6}
                  className="w-(--anchor-width) max-w-[calc(100vw-2rem)] gap-1 p-1"
                >
                  <div
                    role="listbox"
                    aria-label="Explore plans"
                    className="max-h-72 overflow-y-auto"
                  >
                    {trips.map((trip) => {
                      const isSelected = trip.id === selectedTrip?.id;

                      return (
                        <button
                          key={trip.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={cn(
                            "grid w-full grid-cols-[1.25rem_1fr] gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                            isSelected && "bg-muted text-foreground",
                          )}
                          onClick={() => {
                            onSelectTrip(trip.id);
                            setOpen(false);
                          }}
                        >
                          <span className="mt-0.5 flex size-5 items-center justify-center rounded-full border border-border text-primary">
                            {isSelected ? (
                              <Check className="size-3" aria-hidden="true" />
                            ) : null}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-foreground">
                              {trip.title}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {trip.durationDays} days in {trip.location}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              {selectedTrip ? (
                <div className="grid gap-3 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-[5.5rem_1fr]">
                  <div
                    role="img"
                    aria-label={selectedTrip.title}
                    className="h-20 rounded-md bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${selectedTrip.coverImageUrl})`,
                    }}
                  />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                      {selectedTrip.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedTrip.durationDays} days in {selectedTrip.location}
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {selectedTrip.summary}
                    </p>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              No Explore plans available.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-7 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      <Icon className="size-3.5" aria-hidden="true" />
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />;
}
