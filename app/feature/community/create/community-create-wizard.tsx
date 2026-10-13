"use client";

import { useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CommunityApiError,
  communitySlugPreview,
  createGroupSchema,
  uploadCommunityPicture,
  type CommunityPictureSlot,
  type CreateGroupValues,
  type GroupDetail,
} from "../_components/community-api";
import { createCommunityOpenAtom } from "../_components/community-atoms";
import { useCommunityIdentity, useCreateCommunityGroup } from "../_components/community-group-queries";
import { CommunityPictureInput } from "../_components/community-picture-input";
import { CommunityQueryError } from "../_components/community-query-state";
import { MAX_COMMUNITY_TOPICS, communityTopicSuggestions } from "../_components/data";
import { CommunityPreviewCard } from "./community-preview-card";

const STEPS = [
  {
    title: "Tell us about your community",
    description: "A name and description help travelers understand what your community is for.",
    fields: ["name", "description"] as const,
  },
  {
    title: "Style your community",
    description: "A banner and icon make your community easy to recognize. Both are optional and can be changed later.",
    fields: [] as const,
  },
  {
    title: "Add topics",
    description: `Topics help travelers find your community. Choose up to ${MAX_COMMUNITY_TOPICS}.`,
    fields: ["country", "places"] as const,
  },
];

const EMPTY: CreateGroupValues = { name: "", description: "", country: "", places: "", tags: "" };

type UploadFailure = { slot: CommunityPictureSlot; message: string };
type Phase =
  | { kind: "editing" }
  | { kind: "saving"; label: string }
  | { kind: "partial"; group: GroupDetail; failures: UploadFailure[] };

const SLOT_LABEL: Record<CommunityPictureSlot, string> = { banner: "banner", icon: "icon" };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The upload did not finish.";
}

/**
 * Reddit-style create flow. The community is created first; pictures need its
 * address, so they upload right after. If an upload fails the community still
 * exists, and the creator can retry or continue without it.
 */
export function CommunityCreateWizard() {
  const [open, setOpen] = useAtom(createCommunityOpenAtom);
  const [step, setStep] = useState(0);
  const [banner, setBanner] = useState<File | null>(null);
  const [icon, setIcon] = useState<File | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "editing" });
  const router = useRouter();
  const client = useQueryClient();
  const { identity } = useCommunityIdentity();
  const create = useCreateCommunityGroup();
  const form = useForm<CreateGroupValues>({ resolver: zodResolver(createGroupSchema), defaultValues: EMPTY });
  const [name = "", description = ""] = useWatch({ control: form.control, name: ["name", "description"] });
  const slug = communitySlugPreview(name);
  const busy = phase.kind === "saving";
  const last = step === STEPS.length - 1;

  function reset() {
    setStep(0);
    setBanner(null);
    setIcon(null);
    setTopics([]);
    setCustomTopic("");
    setPhase({ kind: "editing" });
    create.reset();
    form.reset(EMPTY);
  }

  function close() {
    if (busy) return;
    setOpen(false);
    reset();
  }

  function finish(group: GroupDetail) {
    setOpen(false);
    reset();
    router.push(`/community/${encodeURIComponent(group.slug)}`);
  }

  async function uploadPictures(group: GroupDetail, slots: CommunityPictureSlot[]) {
    const failures: UploadFailure[] = [];
    for (const slot of slots) {
      const file = slot === "banner" ? banner : icon;
      if (!file) continue;
      setPhase({ kind: "saving", label: `Uploading ${SLOT_LABEL[slot]}…` });
      try {
        await uploadCommunityPicture(group.slug, slot, file);
      } catch (error) {
        console.error("Community picture upload failed after create", { slug: group.slug, slot, error });
        failures.push({ slot, message: errorMessage(error) });
      }
    }
    await client.invalidateQueries({ queryKey: ["community", identity] });
    if (failures.length) setPhase({ kind: "partial", group, failures });
    else finish(group);
  }

  async function submit(values: CreateGroupValues) {
    if (!last) {
      setStep((current) => current + 1);
      return;
    }
    setPhase({ kind: "saving", label: "Creating community…" });
    try {
      const group = await create.mutateAsync({ ...values, tags: topics.join(", ") });
      await uploadPictures(group, ["banner", "icon"]);
    } catch (error) {
      setPhase({ kind: "editing" });
      if (error instanceof CommunityApiError && (error.status === 409 || error.status === 400)) {
        setStep(0);
        form.setError("name", {
          message: error.status === 409 ? "That name is taken. Try another one." : error.message,
        });
      }
    }
  }

  async function next() {
    const valid = await form.trigger([...STEPS[step].fields]);
    if (valid) await form.handleSubmit(submit)();
  }

  function addTopic(value: string) {
    const topic = value.trim().replace(/\s+/g, " ").slice(0, 40);
    if (!topic || topics.length >= MAX_COMMUNITY_TOPICS) return;
    if (topics.some((item) => item.toLowerCase() === topic.toLowerCase())) return;
    setTopics((current) => [...current, topic]);
  }

  function toggleTopic(topic: string) {
    if (topics.includes(topic)) setTopics((current) => current.filter((item) => item !== topic));
    else addTopic(topic);
  }

  function handleCustomTopicKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addTopic(customTopic);
    setCustomTopic("");
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-3xl" showCloseButton={!busy}>
        <div className="flex gap-1.5 px-6 pt-6" aria-hidden="true">
          {STEPS.map((item, index) => (
            <span
              key={item.title}
              className={cn("h-1 flex-1 rounded-full transition-colors", index <= step ? "bg-primary" : "bg-muted")}
            />
          ))}
        </div>

        {phase.kind === "partial" ? (
          <PartialUploadNotice
            phase={phase}
            onRetry={() => void uploadPictures(phase.group, phase.failures.map((failure) => failure.slot))}
            onContinue={() => finish(phase.group)}
          />
        ) : (
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void next();
            }}
          >
            <div className="grid gap-6 px-6 py-5 md:grid-cols-[minmax(0,1fr)_16rem]">
              <div className="flex min-w-0 flex-col gap-5">
                <DialogHeader className="gap-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Step {step + 1} of {STEPS.length}
                  </p>
                  <DialogTitle className="text-xl font-extrabold tracking-tight">{STEPS[step].title}</DialogTitle>
                  <DialogDescription>{STEPS[step].description}</DialogDescription>
                </DialogHeader>

                {step === 0 ? (
                  <>
                    <Controller
                      control={form.control}
                      name="name"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="create-community-name">Community name</FieldLabel>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                              n/
                            </span>
                            <Input
                              {...field}
                              id="create-community-name"
                              autoFocus
                              maxLength={120}
                              disabled={busy}
                              placeholder="thailand-road-trips"
                              aria-invalid={fieldState.invalid}
                              aria-describedby="create-community-name-help create-community-name-error"
                              className="h-11 pl-8"
                            />
                          </div>
                          <FieldDescription id="create-community-name-help" className="flex justify-between gap-3">
                            <span className="min-w-0 truncate">
                              {slug ? `Your address: /community/${slug}` : "Use English letters or numbers so it has an address."}
                            </span>
                            <span className="shrink-0 tabular-nums">{field.value.length}/120</span>
                          </FieldDescription>
                          <FieldError id="create-community-name-error" errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="description"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="create-community-description">Description</FieldLabel>
                          <Textarea
                            {...field}
                            id="create-community-description"
                            rows={5}
                            maxLength={500}
                            disabled={busy}
                            placeholder="Route notes, charging stops and food finds for driving across Thailand."
                            aria-invalid={fieldState.invalid}
                            aria-describedby="create-community-description-count create-community-description-error"
                          />
                          <FieldDescription id="create-community-description-count" className="text-right tabular-nums">
                            {field.value.length}/500
                          </FieldDescription>
                          <FieldError id="create-community-description-error" errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </>
                ) : null}

                {step === 1 ? (
                  <>
                    <CommunityPictureInput
                      label="Banner"
                      hint="Wide picture, 4:1 works best"
                      shape="banner"
                      file={banner}
                      disabled={busy}
                      onFileChange={setBanner}
                    />
                    <CommunityPictureInput
                      label="Icon"
                      hint="Square, shown in a circle"
                      shape="icon"
                      file={icon}
                      disabled={busy}
                      onFileChange={setIcon}
                    />
                    <p className="text-xs text-muted-foreground">PNG or JPEG, up to 5 MB and 4096 pixels per side.</p>
                  </>
                ) : null}

                {step === 2 ? (
                  <>
                    <fieldset className="flex flex-col gap-2.5">
                      <legend className="mb-2.5 flex w-full justify-between text-sm font-semibold">
                        Topics
                        <span className="text-xs font-normal tabular-nums text-muted-foreground">
                          {topics.length}/{MAX_COMMUNITY_TOPICS}
                        </span>
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {[...new Set([...communityTopicSuggestions, ...topics])].map((topic) => {
                          const selected = topics.includes(topic);
                          return (
                            <button
                              key={topic}
                              type="button"
                              aria-pressed={selected}
                              disabled={busy || (!selected && topics.length >= MAX_COMMUNITY_TOPICS)}
                              onClick={() => toggleTopic(topic)}
                              className={cn(
                                "inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40",
                                selected
                                  ? "bg-primary text-primary-foreground ring-primary"
                                  : "bg-card text-foreground ring-border hover:bg-muted",
                              )}
                            >
                              {selected ? <Check className="size-3.5" aria-hidden="true" /> : null}
                              {topic}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={customTopic}
                          onChange={(event) => setCustomTopic(event.target.value)}
                          onKeyDown={handleCustomTopicKey}
                          maxLength={40}
                          disabled={busy || topics.length >= MAX_COMMUNITY_TOPICS}
                          placeholder="Add your own topic"
                          aria-label="Add your own topic"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy || !customTopic.trim() || topics.length >= MAX_COMMUNITY_TOPICS}
                          onClick={() => {
                            addTopic(customTopic);
                            setCustomTopic("");
                          }}
                        >
                          <Plus aria-hidden="true" />
                          Add
                        </Button>
                      </div>
                    </fieldset>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Controller
                        control={form.control}
                        name="country"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="create-community-country">Country (optional)</FieldLabel>
                            <Input {...field} id="create-community-country" maxLength={120} disabled={busy} placeholder="Thailand" aria-invalid={fieldState.invalid} />
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />
                      <Controller
                        control={form.control}
                        name="places"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel htmlFor="create-community-places">Places (optional)</FieldLabel>
                            <Input {...field} id="create-community-places" disabled={busy} placeholder="Bangkok, Chiang Mai" aria-describedby="create-community-places-help" />
                            <FieldDescription id="create-community-places-help">Separate places with commas.</FieldDescription>
                          </Field>
                        )}
                      />
                    </div>
                    <p className="rounded-xl bg-well px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                      Communities are public: anyone can read them, and signed-in travelers can join and post. You
                      become the owner and first moderator.
                    </p>
                  </>
                ) : null}

                <CommunityQueryError error={create.error && phase.kind === "editing" && step !== 0 ? create.error : null} />
              </div>

              <div className="hidden md:block">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Preview</p>
                <CommunityPreviewCard
                  name={name}
                  slug={slug}
                  description={description}
                  topics={topics}
                  banner={banner}
                  icon={icon}
                />
              </div>
            </div>

            <DialogFooter className="mx-0 mb-0 flex-row items-center justify-between rounded-b-xl px-6 py-4 sm:justify-between">
              <span role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
                {busy ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    {phase.label}
                  </>
                ) : null}
              </span>
              <div className="flex gap-2">
                {step > 0 ? (
                  <Button type="button" variant="ghost" disabled={busy} onClick={() => setStep((current) => current - 1)}>
                    Back
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" disabled={busy} onClick={close}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={busy} className="min-w-28 rounded-full font-bold">
                  {last ? "Create community" : step === 1 && !banner && !icon ? "Skip" : "Next"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PartialUploadNotice({
  phase,
  onRetry,
  onContinue,
}: {
  phase: Extract<Phase, { kind: "partial" }>;
  onRetry: () => void;
  onContinue: () => void;
}) {
  const missing = phase.failures.map((failure) => SLOT_LABEL[failure.slot]).join(" and ");
  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <DialogHeader className="gap-1.5">
        <DialogTitle className="text-xl font-extrabold tracking-tight">n/{phase.group.slug} is ready</DialogTitle>
        <DialogDescription>
          Your community was created, but its {missing} did not upload. Try again now, or add it later from
          Manage community.
        </DialogDescription>
      </DialogHeader>
      <ul className="flex flex-col gap-2">
        {phase.failures.map((failure) => (
          <li key={failure.slot} role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/8 px-3 py-2.5 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            <span>
              <span className="font-semibold capitalize">{SLOT_LABEL[failure.slot]}:</span> {failure.message}
            </span>
          </li>
        ))}
      </ul>
      <DialogFooter className="-mx-6 -mb-6 mt-2 rounded-b-xl px-6">
        <Button type="button" variant="outline" onClick={onContinue}>
          <X aria-hidden="true" />
          Continue without it
        </Button>
        <Button type="button" onClick={onRetry} className="font-bold">
          Retry upload
        </Button>
      </DialogFooter>
    </div>
  );
}
