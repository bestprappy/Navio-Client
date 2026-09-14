"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bold,
  Italic,
  Strikethrough,
  Superscript,
  Heading1,
  Link2,
  Image as ImageIcon,
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

import { createPostDraftAtom } from "../_components/community-atoms";
import {
  createPost,
  postFormSchema,
  type PostFormValues,
} from "../_components/community-post-api";
import { CommunityQueryError } from "../_components/community-query-state";
import { CommunityMembershipButton } from "../_components/community-membership-button";
import { useCommunityIdentity } from "../_components/community-group-queries";
import type { CommunityGroup, SharedTrip } from "../_components/data";
import {
  defaultCreatePostDraft,
  explorePlanSharedTrips,
  getCommunityPostHref,
  getTripById,
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

type PostFieldErrors = Partial<Record<keyof PostFormValues, string>>;

type CommunityComposerProps = {
  groups: CommunityGroup[];
  initialGroupId?: string | null;
  initialPlanId?: string | null;
};

const TABS: { id: PostTab; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "media", label: "Images & Video" },
  { id: "link", label: "Link" },
  { id: "poll", label: "Poll" },
];

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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

function validateImageFile(file: File): string {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type) || file.size === 0) {
    return "Choose a PNG or JPEG picture.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Pictures must be 5 MiB or smaller.";
  }
  return "";
}

export function CommunityComposer({
  groups,
  initialGroupId = null,
  initialPlanId = null,
}: CommunityComposerProps) {
  const router = useRouter();
  const cache = useQueryClient();
  const { authenticated, identity } = useCommunityIdentity();

  const [postDraft, setPostDraft] = useAtom(createPostDraftAtom);
  const [activeTab, setActiveTab] = useState<PostTab>("text");
  const [communityOpen, setCommunityOpen] = useState(false);
  const [communitySearch, setCommunitySearch] = useState("");
  const [flairDialogOpen, setFlairDialogOpen] = useState(false);
  const [selectedFlairId, setSelectedFlairId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<PostFieldErrors>({});
  const [draftSaved, setDraftSaved] = useState(false);

  const appliedPrefillKeyRef = useRef<string | null>(null);
  const publishAttempt = useRef<{
    signature: string;
    file: File | null;
    id: string;
  } | null>(null);
  const previewRef = useRef<HTMLImageElement>(null);
  const fileInputId = "post-media-upload";

  const selectableTrips = useMemo(() => explorePlanSharedTrips, []);
  const selectedGroup = groups.find((group) => group.id === postDraft.groupId);
  const canModerateArchive = selectedGroup?.status === "archived";

  // Keep the media tab preview pointed at the currently chosen file.
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (previewRef.current) previewRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Apply ?groupId / ?planId prefill exactly once per incoming query pair.
  useEffect(() => {
    const prefillKey = `${initialGroupId ?? ""}:${initialPlanId ?? ""}`;

    if (
      appliedPrefillKeyRef.current === prefillKey ||
      (!initialGroupId && !initialPlanId) ||
      groups.length === 0
    ) {
      return;
    }

    const queryTrip = initialPlanId
      ? (selectableTrips.find(
          (trip) =>
            trip.id === initialPlanId || trip.sourcePlanId === initialPlanId,
        ) ?? getTripById(initialPlanId))
      : null;
    const explicitGroup = initialGroupId
      ? groups.find((group) => group.id === initialGroupId)
      : null;
    const suggestedGroup = queryTrip
      ? getSuggestedDiscussionGroup(queryTrip, groups)
      : null;
    const nextGroup = explicitGroup ?? suggestedGroup;

    setPostDraft((previous) => ({
      ...previous,
      groupId: nextGroup?.id ?? previous.groupId,
      place: queryTrip?.location ?? nextGroup?.places[0] ?? previous.place,
      country: queryTrip?.country ?? nextGroup?.country ?? previous.country,
      tags:
        queryTrip && !previous.tags.trim()
          ? queryTrip.tags.slice(0, 5).join(", ")
          : previous.tags,
      title:
        queryTrip && !previous.title.trim()
          ? `Plan review: ${queryTrip.title}`.slice(0, 300)
          : previous.title,
      body:
        queryTrip && !previous.body.trim()
          ? "Looking for community feedback on pacing, stop order, charging timing, and local swaps for this Explore plan."
          : previous.body,
      attachTrip: queryTrip ? true : previous.attachTrip,
      sharedTripId: queryTrip ? queryTrip.id : previous.sharedTripId,
    }));
    appliedPrefillKeyRef.current = prefillKey;
  }, [groups, initialGroupId, initialPlanId, selectableTrips, setPostDraft]);

  const filteredGroups = communitySearch
    ? groups.filter((group) =>
        group.name.toLowerCase().includes(communitySearch.toLowerCase()),
      )
    : groups;

  const mutation = useMutation({
    mutationFn: (values: PostFormValues) => {
      if (!selectedGroup?.slug || !selectedGroup.joined) {
        throw new Error("Join a community before posting.");
      }
      const attachedTripId = postDraft.attachTrip
        ? (postDraft.sharedTripId ?? null)
        : null;
      const signature = JSON.stringify({
        identity,
        group: selectedGroup.slug,
        values,
        selectedFlairId,
        attachedTripId,
      });
      // Reuse one request id per unchanged attempt so a retry cannot double-post.
      if (
        !publishAttempt.current ||
        publishAttempt.current.signature !== signature ||
        publishAttempt.current.file !== file
      ) {
        publishAttempt.current = { signature, file, id: crypto.randomUUID() };
      }
      return createPost(
        selectedGroup.slug,
        values,
        selectedFlairId,
        attachedTripId,
        file,
        publishAttempt.current.id,
      );
    },
    onSuccess: async (post) => {
      setPostDraft({ ...defaultCreatePostDraft });
      setSelectedFlairId(null);
      setFile(null);
      await cache.invalidateQueries({ queryKey: ["community"] });
      router.push(
        getCommunityPostHref(
          { name: post.groupName ?? "", slug: post.groupSlug },
          post,
        ),
      );
    },
  });

  function handleSelectGroup(group: CommunityGroup) {
    setPostDraft((previous) => ({
      ...previous,
      groupId: group.id,
      country: group.country,
      place: group.places[0] ?? group.country,
    }));
    setSelectedFlairId(null);
    setCommunityOpen(false);
    setCommunitySearch("");
  }

  function handleAttachTripChange(checked: boolean) {
    const nextTripId = postDraft.sharedTripId ?? selectableTrips[0]?.id ?? null;
    const nextTrip = nextTripId
      ? selectableTrips.find((trip) => trip.id === nextTripId)
      : null;

    setPostDraft((previous) => ({
      ...previous,
      attachTrip: checked,
      sharedTripId: checked ? nextTripId : null,
      place: checked && nextTrip ? nextTrip.location : previous.place,
      country: checked && nextTrip ? nextTrip.country : previous.country,
    }));
  }

  function handleSelectTrip(tripId: string) {
    const trip = selectableTrips.find((item) => item.id === tripId);

    setPostDraft((previous) => ({
      ...previous,
      sharedTripId: tripId,
      place: trip?.location ?? previous.place,
      country: trip?.country ?? previous.country,
      tags: previous.tags || trip?.tags.slice(0, 5).join(", ") || previous.tags,
    }));
  }

  function handleSelectFile(selected: File | null) {
    if (!selected) return;
    const message = validateImageFile(selected);
    if (message) {
      setFileError(message);
      return;
    }
    setFileError("");
    setFile(selected);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraftSaved(false);

    const parsed = postFormSchema.safeParse({
      title: postDraft.title,
      body: postDraft.body,
      linkUrl: postDraft.linkUrl,
    });

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      const nextErrors: PostFieldErrors = {
        title: flattened.title?.[0],
        body: flattened.body?.[0],
        // The link field is a union, so zod's own message is not actionable.
        linkUrl: flattened.linkUrl?.length
          ? "Use a full HTTP or HTTPS link, for example https://example.com."
          : undefined,
      };
      setFieldErrors(nextErrors);
      if (nextErrors.linkUrl) setActiveTab("link");
      else if (nextErrors.body) setActiveTab("text");
      return;
    }

    setFieldErrors({});
    mutation.mutate(parsed.data);
  }

  const publishDisabled =
    !authenticated ||
    !selectedGroup?.joined ||
    canModerateArchive ||
    mutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Community selector */}
      <Popover open={communityOpen} onOpenChange={setCommunityOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className={cn(
                "flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium transition hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                communityOpen && "border-foreground/40",
              )}
            />
          }
        >
          {selectedGroup ? (
            <>
              <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                {selectedGroup.avatarUrl ? (
                  // Group avatars come from arbitrary remote hosts; the optimizer is not configured for them.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedGroup.avatarUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold">
                    {selectedGroup.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="max-w-[160px] truncate">
                {selectedGroup.name}
              </span>
            </>
          ) : (
            <>
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/50">
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
            aria-hidden="true"
          />
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-72 max-w-[calc(100vw-2rem)] overflow-hidden p-0"
        >
          <div className="p-2">
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
              <Search
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Search communities"
                aria-label="Search communities"
                value={communitySearch}
                onChange={(event) => setCommunitySearch(event.target.value)}
              />
            </div>
          </div>

          <ul
            role="listbox"
            aria-label="Communities"
            className="max-h-64 overflow-y-auto"
          >
            {filteredGroups.length === 0 ? (
              <li className="px-3 py-4 text-sm text-muted-foreground">
                No communities match that search.
              </li>
            ) : null}

            {filteredGroups.map((group) => {
              const isSelected = postDraft.groupId === group.id;
              return (
                <li key={group.id} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => handleSelectGroup(group)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:bg-muted focus-visible:outline-none",
                      isSelected && "bg-muted/50",
                    )}
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
                          {group.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {group.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {group.memberCount.toLocaleString()} members
                        {group.joined ? " · Joined" : ""}
                      </span>
                    </span>
                    {isSelected ? (
                      <Check
                        className="ml-auto size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>

      {selectedGroup && !selectedGroup.joined ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
          <p className="text-sm text-muted-foreground">
            Join this community to publish a post.
          </p>
          <CommunityMembershipButton group={selectedGroup} />
        </div>
      ) : null}

      {/* Tab bar */}
      <div className="flex border-b border-border" role="tablist" aria-label="Post type">
        {TABS.map((tab) => {
          const hasContent =
            (tab.id === "text" && postDraft.body.trim().length > 0) ||
            (tab.id === "media" && Boolean(file)) ||
            (tab.id === "link" && postDraft.linkUrl.trim().length > 0);
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={tab.id === "poll"}
              title={
                tab.id === "poll" ? "Polls are not available yet" : undefined
              }
              className={cn(
                "relative px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                activeTab === tab.id
                  ? "text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
                  : "text-muted-foreground hover:text-foreground",
                tab.id === "poll" && "cursor-not-allowed opacity-40",
              )}
            >
              {tab.label}
              {hasContent ? (
                <span
                  aria-label="has content"
                  className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Title */}
      <div>
        <div
          className={cn(
            "relative rounded-lg border border-border bg-card",
            fieldErrors.title && "border-destructive",
          )}
        >
          <label htmlFor="post-title" className="sr-only">
            Post title
          </label>
          <input
            id="post-title"
            type="text"
            value={postDraft.title}
            onChange={(event) => {
              setPostDraft((previous) => ({
                ...previous,
                title: event.target.value.slice(0, 300),
              }));
              setFieldErrors((previous) => ({ ...previous, title: undefined }));
            }}
            placeholder="Title"
            maxLength={300}
            disabled={mutation.isPending}
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={fieldErrors.title ? "post-title-error" : undefined}
            className="w-full rounded-lg bg-transparent px-4 py-3 pb-6 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
            {postDraft.title.length}/300
          </span>
        </div>
        {fieldErrors.title ? (
          <p
            id="post-title-error"
            role="alert"
            className="mt-1.5 text-xs text-destructive"
          >
            {fieldErrors.title}
          </p>
        ) : null}
      </div>

      {/* Add flair */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => selectedGroup && setFlairDialogOpen(true)}
          disabled={!selectedGroup?.postFlairs.length || mutation.isPending}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Tag className="size-3" aria-hidden="true" />
          Add flair and tags
        </button>

        {selectedFlairId && selectedGroup
          ? (() => {
              const flair = selectedGroup.postFlairs.find(
                (item) => item.id === selectedFlairId,
              );
              return flair ? (
                <span className="flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {flair.label}
                  <button
                    type="button"
                    onClick={() => setSelectedFlairId(null)}
                    aria-label={`Remove ${flair.label} flair`}
                    className="text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </span>
              ) : null;
            })()
          : null}
      </div>

      {flairDialogOpen && selectedGroup ? (
        <CommunityFlairDialog
          group={selectedGroup}
          selectedFlairId={selectedFlairId}
          onConfirm={setSelectedFlairId}
          onClose={() => setFlairDialogOpen(false)}
        />
      ) : null}

      {/* Content area */}
      {activeTab === "text" ? (
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
            <ToolbarButton icon={ImageIcon} label="Insert image" />
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
          <label htmlFor="post-body" className="sr-only">
            Post body
          </label>
          <textarea
            id="post-body"
            value={postDraft.body}
            onChange={(event) => {
              setPostDraft((previous) => ({
                ...previous,
                body: event.target.value,
              }));
              setFieldErrors((previous) => ({ ...previous, body: undefined }));
            }}
            placeholder="Body text (optional)"
            rows={8}
            disabled={mutation.isPending}
            aria-invalid={Boolean(fieldErrors.body)}
            aria-describedby={fieldErrors.body ? "post-body-error" : undefined}
            className="w-full resize-y rounded-b-lg bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {fieldErrors.body ? (
            <p
              id="post-body-error"
              role="alert"
              className="px-4 pb-3 text-xs text-destructive"
            >
              {fieldErrors.body}
            </p>
          ) : null}
        </div>
      ) : null}

      {activeTab === "media" ? (
        <div className="space-y-3">
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload a post picture"
            aria-describedby="post-media-help"
            className={cn(
              "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-card transition hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              isDragging && "border-primary bg-primary/5",
              fileError && "border-destructive",
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleSelectFile(event.dataTransfer.files?.[0] ?? null);
            }}
            onClick={() => document.getElementById(fileInputId)?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                document.getElementById(fileInputId)?.click();
              }
            }}
          >
            <span className="flex size-10 items-center justify-center rounded-full border border-border bg-card shadow-xs">
              <Upload
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </span>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-primary">Drag and Drop</span> or
              upload a picture
            </p>
            <input
              id={fileInputId}
              type="file"
              accept="image/png,image/jpeg"
              className="sr-only"
              // The drop zone above is the keyboard-reachable control.
              tabIndex={-1}
              aria-label="Post picture file"
              // The drop zone forwards its click here; stop the bubble so it
              // does not re-open the picker in a loop.
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                event.target.value = "";
                handleSelectFile(selected);
              }}
            />
          </div>

          <p id="post-media-help" className="text-xs text-muted-foreground">
            PNG or JPEG, up to 5 MiB. Video uploads are not available yet.
          </p>

          {fileError ? (
            <p role="alert" className="text-xs text-destructive">
              {fileError}
            </p>
          ) : null}

          {file ? (
            <div className="space-y-2 rounded-lg border border-border bg-card p-3">
              {/* Local blob preview; the server image optimizer cannot read this URL. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={previewRef}
                alt="Post picture preview"
                className="max-h-64 w-full rounded-md object-contain"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 break-all text-sm text-muted-foreground">
                  {file.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={mutation.isPending}
                  onClick={() => {
                    setFile(null);
                    setFileError("");
                  }}
                >
                  <X aria-hidden="true" />
                  Remove
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === "link" ? (
        <div>
          <div
            className={cn(
              "rounded-lg border border-border bg-card",
              fieldErrors.linkUrl && "border-destructive",
            )}
          >
            <label htmlFor="post-link" className="sr-only">
              Post link
            </label>
            <input
              id="post-link"
              type="url"
              inputMode="url"
              value={postDraft.linkUrl}
              onChange={(event) => {
                setPostDraft((previous) => ({
                  ...previous,
                  linkUrl: event.target.value,
                }));
                setFieldErrors((previous) => ({
                  ...previous,
                  linkUrl: undefined,
                }));
              }}
              placeholder="https://example.com"
              disabled={mutation.isPending}
              aria-invalid={Boolean(fieldErrors.linkUrl)}
              aria-describedby={
                fieldErrors.linkUrl ? "post-link-error" : undefined
              }
              className="w-full rounded-lg bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          {fieldErrors.linkUrl ? (
            <p
              id="post-link-error"
              role="alert"
              className="mt-1.5 text-xs text-destructive"
            >
              {fieldErrors.linkUrl}
            </p>
          ) : null}
        </div>
      ) : null}

      <PlanAttachmentSelector
        trips={selectableTrips}
        attachTrip={postDraft.attachTrip}
        selectedTripId={postDraft.sharedTripId}
        disabled={mutation.isPending}
        onAttachChange={handleAttachTripChange}
        onSelectTrip={handleSelectTrip}
      />

      <CommunityQueryError error={mutation.error} />

      {canModerateArchive ? (
        <p role="status" className="text-sm text-muted-foreground">
          Archived communities are read-only.
        </p>
      ) : null}

      {draftSaved ? (
        <p role="status" className="text-sm text-muted-foreground">
          Draft kept for this session. It clears when you reload the page.
        </p>
      ) : null}

      {/* Footer */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={mutation.isPending}
          onClick={() => setDraftSaved(true)}
        >
          Save Draft
        </Button>
        <Button type="submit" size="sm" disabled={publishDisabled}>
          {mutation.isPending ? "Publishing…" : "Post"}
        </Button>
      </div>
    </form>
  );
}

function PlanAttachmentSelector({
  trips,
  attachTrip,
  selectedTripId,
  disabled,
  onAttachChange,
  onSelectTrip,
}: {
  trips: SharedTrip[];
  attachTrip: boolean;
  selectedTripId: string | null;
  disabled: boolean;
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
          disabled={disabled}
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
                      disabled={disabled}
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
                      {selectedTrip.durationDays} days in{" "}
                      {selectedTrip.location}
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

function ToolbarButton({ icon: Icon, label }: { icon: ElementType; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={`${label} is not available yet`}
      disabled
      className="flex size-7 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className="size-3.5" aria-hidden="true" />
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />;
}
