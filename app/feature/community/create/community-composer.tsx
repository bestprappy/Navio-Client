"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CommunityIcon, communityHandle } from "../_components/community-identity";
import { CommunityPictureInput } from "../_components/community-picture-input";
import {
  Check,
  ChevronDown,
  Image as ImageIcon,
  Link2,
  Search,
  Tag,
  Type,
  X,
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
import type { CommunityGroup } from "../_components/data";
import {
  defaultCreatePostDraft,
  getCommunityPostHref,
} from "../_components/data";
import { CommunityFlairDialog } from "./community-flair-dialog";
import { CommunityPlanPicker } from "./community-plan-picker";
import { isShareToken } from "@/app/feature/explore/_components/shared-plans/explore-plans-api";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type PostTab = "text" | "media" | "link";

type PostFieldErrors = Partial<Record<keyof PostFormValues, string>>;

type CommunityComposerProps = {
  groups: CommunityGroup[];
  initialGroupId?: string | null;
  initialPlanToken?: string | null;
};

const TABS = [
  { id: "text", label: "Text", icon: Type },
  { id: "media", label: "Image", icon: ImageIcon },
  { id: "link", label: "Link", icon: Link2 },
] as const satisfies readonly { id: PostTab; label: string; icon: typeof Type }[];

export function CommunityComposer({
  groups,
  initialGroupId = null,
  initialPlanToken = null,
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
  const [file, setFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<PostFieldErrors>({});
  const [draftSaved, setDraftSaved] = useState(false);

  const appliedPrefillKeyRef = useRef<string | null>(null);
  const publishAttempt = useRef<{
    signature: string;
    file: File | null;
    id: string;
  } | null>(null);

  const selectedGroup = groups.find((group) => group.id === postDraft.groupId);
  const canModerateArchive = selectedGroup?.status === "archived";

  // Apply the ?groupId prefill exactly once per incoming id.
  useEffect(() => {
    if (
      !initialGroupId ||
      appliedPrefillKeyRef.current === initialGroupId ||
      groups.length === 0
    ) {
      return;
    }

    const explicitGroup = groups.find((group) => group.id === initialGroupId);

    if (explicitGroup) {
      setPostDraft((previous) => ({
        ...previous,
        groupId: explicitGroup.id,
        place: explicitGroup.places[0] ?? previous.place,
        country: explicitGroup.country,
      }));
    }
    appliedPrefillKeyRef.current = initialGroupId;
  }, [groups, initialGroupId, setPostDraft]);

  // Arriving from an Explore plan's "Discuss" link attaches that plan once.
  const appliedPlanTokenRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isShareToken(initialPlanToken) || appliedPlanTokenRef.current === initialPlanToken) {
      return;
    }
    setPostDraft((previous) => ({ ...previous, planToken: initialPlanToken }));
    appliedPlanTokenRef.current = initialPlanToken;
  }, [initialPlanToken, setPostDraft]);

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
      const signature = JSON.stringify({
        identity,
        group: selectedGroup.slug,
        values,
        selectedFlairId,
        planToken: postDraft.planToken,
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
        postDraft.planToken,
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
                "flex h-11 w-fit items-center gap-2 rounded-full bg-muted px-3 text-sm font-medium transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                communityOpen && "border-foreground/40",
              )}
            />
          }
        >
          {selectedGroup ? (
            <>
              <CommunityIcon
                name={selectedGroup.name}
                seed={selectedGroup.slug ?? selectedGroup.id}
                src={selectedGroup.avatarUrl}
                size="sm"
              />
              <span className="max-w-[14rem] truncate font-semibold">
                {communityHandle(selectedGroup.slug, selectedGroup.name)}
              </span>
            </>
          ) : (
            <>
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50" />
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
                    <CommunityIcon
                      name={group.name}
                      seed={group.slug ?? group.id}
                      src={group.avatarUrl}
                      size="md"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {communityHandle(group.slug, group.name)}
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
      <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Post type">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          const hasContent =
            (tab.id === "text" && postDraft.body.trim().length > 0) ||
            (tab.id === "media" && Boolean(file)) ||
            (tab.id === "link" && postDraft.linkUrl.trim().length > 0);
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`post-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`post-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                event.preventDefault();
                const index = TABS.findIndex((item) => item.id === activeTab);
                const next = TABS[(index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
                setActiveTab(next.id);
                document.getElementById(`post-tab-${next.id}`)?.focus();
              }}
              className={cn(
                "relative inline-flex items-center gap-1.5 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                selected
                  ? "text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4", selected && "text-primary")} aria-hidden="true" />
              {tab.label}
              {hasContent ? (
                <span className="inline-block size-1.5 rounded-full bg-primary" aria-label="has content" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Title */}
      <div>
        <div
          className={cn(
            "relative rounded-xl border border-border bg-card",
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
            className="w-full rounded-xl bg-transparent px-4 py-3.5 pb-7 text-base font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
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
          Add flair
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
        <div id="post-panel-text" role="tabpanel" aria-labelledby="post-tab-text" className="rounded-xl border border-border bg-card focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
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
            className="w-full resize-y rounded-xl bg-transparent px-4 py-3 text-sm leading-6 outline-none placeholder:text-muted-foreground"
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
        <div id="post-panel-media" role="tabpanel" aria-labelledby="post-tab-media">
          <CommunityPictureInput
            label="Picture"
            hint="PNG or JPEG, up to 5 MB"
            shape="post"
            file={file}
            disabled={mutation.isPending}
            onFileChange={setFile}
          />
        </div>
      ) : null}

      {activeTab === "link" ? (
        <div id="post-panel-link" role="tabpanel" aria-labelledby="post-tab-link">
          <div
            className={cn(
              "rounded-xl border border-border bg-card",
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

      <CommunityPlanPicker
        selectedToken={postDraft.planToken}
        disabled={mutation.isPending}
        onChange={(planToken) =>
          setPostDraft((previous) => ({ ...previous, planToken }))
        }
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
          variant="ghost"
          className="h-10 rounded-full px-4"
          disabled={mutation.isPending}
          onClick={() => setDraftSaved(true)}
        >
          Keep draft
        </Button>
        <Button type="submit" className="h-10 rounded-full px-6 font-bold" disabled={publishDisabled}>
          {mutation.isPending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
