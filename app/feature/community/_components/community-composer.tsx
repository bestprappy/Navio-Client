"use client";

import type { FormEvent } from "react";
import { Plus, Send, Users } from "lucide-react";
import { useAtom, useSetAtom } from "jotai";

import {
  createGroupDraftAtom,
  createdGroupsAtom,
  createdPostsAtom,
  createPostDraftAtom,
  joinedGroupIdsAtom,
} from "./community-atoms";
import type { CommunityGroup, CommunityPost } from "./data";
import {
  currentCommunityUser,
  defaultCreateGroupDraft,
  defaultCreatePostDraft,
  mockSharedTrips,
  parseTagList,
  slugifyCommunityValue,
} from "./data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CommunityComposerProps = {
  groups: CommunityGroup[];
};

export function CommunityComposer({ groups }: CommunityComposerProps) {
  const [groupDraft, setGroupDraft] = useAtom(createGroupDraftAtom);
  const [postDraft, setPostDraft] = useAtom(createPostDraftAtom);
  const setCreatedGroups = useSetAtom(createdGroupsAtom);
  const setCreatedPosts = useSetAtom(createdPostsAtom);
  const setJoinedGroupIds = useSetAtom(joinedGroupIdsAtom);

  function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = groupDraft.name.trim();
    const description = groupDraft.description.trim();

    if (!name || !description) {
      return;
    }

    const nextGroup: CommunityGroup = {
      id: `group-local-${slugifyCommunityValue(name)}-${Date.now()}`,
      name,
      description,
      country: groupDraft.country.trim() || "Thailand",
      places: [groupDraft.country.trim() || "Thailand"],
      tags: parseTagList(groupDraft.tags),
      rules: [
        {
          id: "local-rule-civil",
          title: "Be respectful and helpful",
          description:
            "Keep discussion useful for travelers who may copy routes from this group.",
        },
        {
          id: "local-rule-context",
          title: "Add trip context",
          description:
            "Include place, timing, budget, and whether advice is first-hand or researched.",
        },
      ],
      postFlairs: [
        { id: "local-flair-question", label: "Question", tone: "question" },
        { id: "local-flair-itinerary", label: "Itinerary", tone: "itinerary" },
        { id: "local-flair-reliable", label: "Reliable", tone: "reliable" },
      ],
      userFlairs: [
        { id: "local-user-planner", label: "Trip Planner", tone: "itinerary" },
      ],
      bookmarks: [
        { id: "local-bookmark-guide", label: "Group guide" },
        { id: "local-bookmark-resources", label: "Useful resources" },
      ],
      memberCount: 1,
      postCount: 0,
      createdById: currentCommunityUser.id,
    };

    setCreatedGroups((previous) => [nextGroup, ...previous]);
    setJoinedGroupIds((previous) =>
      previous.includes(nextGroup.id) ? previous : [...previous, nextGroup.id],
    );
    setPostDraft((previous) => ({ ...previous, groupId: nextGroup.id }));
    setGroupDraft({ ...defaultCreateGroupDraft });
  }

  function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = postDraft.title.trim();
    const body = postDraft.body.trim();

    if (!title || !body) {
      return;
    }

    const selectedGroup = groups.find((group) => group.id === postDraft.groupId);
    const fallbackGroup = groups[0];
    const groupId = selectedGroup?.id ?? fallbackGroup?.id;

    if (!groupId) {
      return;
    }

    const nextPost: CommunityPost = {
      id: `post-local-${slugifyCommunityValue(title)}-${Date.now()}`,
      groupId,
      authorId: currentCommunityUser.id,
      title,
      body,
      createdAt: new Date().toISOString(),
      upvotes: 1,
      commentCount: 0,
      tags: parseTagList(postDraft.tags),
      place: postDraft.place.trim() || selectedGroup?.places[0] || "Thailand",
      country: postDraft.country.trim() || selectedGroup?.country || "Thailand",
      sharedTripId:
        postDraft.attachTrip && postDraft.sharedTripId
          ? postDraft.sharedTripId
          : undefined,
    };

    setCreatedPosts((previous) => [nextPost, ...previous]);
    setPostDraft({
      ...defaultCreatePostDraft,
      groupId,
      attachTrip: postDraft.attachTrip,
      sharedTripId: postDraft.sharedTripId,
    });
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2" aria-label="Create community content">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="size-4" aria-hidden="true" />
            Start a discussion
          </CardTitle>
          <CardDescription>
            Ask for trip feedback, restaurant swaps, or route timing advice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleCreatePost}>
            <div className="space-y-2">
              <label
                htmlFor="community-post-title"
                className="text-sm font-medium text-foreground"
              >
                Title
              </label>
              <Input
                id="community-post-title"
                value={postDraft.title}
                onChange={(event) =>
                  setPostDraft((previous) => ({
                    ...previous,
                    title: event.target.value,
                  }))
                }
                placeholder="Ask about a trip, restaurant, or route"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="community-post-body"
                className="text-sm font-medium text-foreground"
              >
                Details
              </label>
              <Textarea
                id="community-post-body"
                value={postDraft.body}
                onChange={(event) =>
                  setPostDraft((previous) => ({
                    ...previous,
                    body: event.target.value,
                  }))
                }
                placeholder="Add context, route notes, constraints, or what you want others to discuss."
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">
                Group
              </legend>
              <div className="flex flex-wrap gap-2">
                {groups.slice(0, 6).map((group) => (
                  <Button
                    key={group.id}
                    type="button"
                    size="sm"
                    variant={
                      postDraft.groupId === group.id ? "secondary" : "outline"
                    }
                    aria-pressed={postDraft.groupId === group.id}
                    onClick={() =>
                      setPostDraft((previous) => ({
                        ...previous,
                        groupId: group.id,
                        country: group.country,
                        place: group.places[0] ?? group.country,
                      }))
                    }
                    className="max-w-full"
                  >
                    <span className="truncate">{group.name}</span>
                  </Button>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="community-post-place"
                  className="text-sm font-medium text-foreground"
                >
                  Place
                </label>
                <Input
                  id="community-post-place"
                  value={postDraft.place}
                  onChange={(event) =>
                    setPostDraft((previous) => ({
                      ...previous,
                      place: event.target.value,
                    }))
                  }
                  placeholder="Bangkok"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="community-post-tags"
                  className="text-sm font-medium text-foreground"
                >
                  Tags
                </label>
                <Input
                  id="community-post-tags"
                  value={postDraft.tags}
                  onChange={(event) =>
                    setPostDraft((previous) => ({
                      ...previous,
                      tags: event.target.value,
                    }))
                  }
                  placeholder="restaurant, thailand"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                <Checkbox
                  checked={postDraft.attachTrip}
                  onCheckedChange={(checked) =>
                    setPostDraft((previous) => ({
                      ...previous,
                      attachTrip: Boolean(checked),
                    }))
                  }
                  aria-label="Attach a shared trip"
                />
                Attach a shared trip
              </label>
              {postDraft.attachTrip ? (
                <div className="flex flex-wrap gap-2">
                  {mockSharedTrips.slice(0, 4).map((trip) => (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() =>
                        setPostDraft((previous) => ({
                          ...previous,
                          sharedTripId: trip.id,
                        }))
                      }
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left text-xs transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        postDraft.sharedTripId === trip.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="line-clamp-1 font-medium">
                        {trip.title}
                      </span>
                      <span className="mt-1 block">{trip.location}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!postDraft.title.trim() || !postDraft.body.trim()}
              >
                <Plus aria-hidden="true" />
                Post discussion
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" aria-hidden="true" />
            Create a group
          </CardTitle>
          <CardDescription>
            Make a focused place or topic group without the r/ prefix.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleCreateGroup}>
            <div className="space-y-2">
              <label
                htmlFor="community-group-name"
                className="text-sm font-medium text-foreground"
              >
                Group name
              </label>
              <Input
                id="community-group-name"
                value={groupDraft.name}
                onChange={(event) =>
                  setGroupDraft((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder="Thailand Hidden Restaurants"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="community-group-description"
                className="text-sm font-medium text-foreground"
              >
                Description
              </label>
              <Textarea
                id="community-group-description"
                value={groupDraft.description}
                onChange={(event) =>
                  setGroupDraft((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                placeholder="What should travelers discuss here?"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="community-group-country"
                  className="text-sm font-medium text-foreground"
                >
                  Country or area
                </label>
                <Input
                  id="community-group-country"
                  value={groupDraft.country}
                  onChange={(event) =>
                    setGroupDraft((previous) => ({
                      ...previous,
                      country: event.target.value,
                    }))
                  }
                  placeholder="Thailand"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="community-group-tags"
                  className="text-sm font-medium text-foreground"
                >
                  Tags
                </label>
                <Input
                  id="community-group-tags"
                  value={groupDraft.tags}
                  onChange={(event) =>
                    setGroupDraft((previous) => ({
                      ...previous,
                      tags: event.target.value,
                    }))
                  }
                  placeholder="restaurant, thailand, local"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {parseTagList(groupDraft.tags).map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="secondary"
                disabled={
                  !groupDraft.name.trim() || !groupDraft.description.trim()
                }
              >
                <Plus aria-hidden="true" />
                Create group
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
