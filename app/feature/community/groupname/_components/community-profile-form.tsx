"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { CommunityFormField } from "../../_components/community-form-field";
import { CommunityQueryError } from "../../_components/community-query-state";
import { useUpdateCommunityGroup } from "../../_components/community-group-queries";
import {
  splitCommunityTerms,
  type GroupDetail,
} from "../../_components/community-api";

const schema = z.object({
  description: z.string().trim().min(1, "Describe your community."),
  country: z.string().trim().max(120),
  places: z.string(),
  tags: z.string(),
  summary: z.string().trim(),
  bannerUrl: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .regex(/^https?:\/\/[^\s]+$/, "Enter an HTTP or HTTPS URL."),
  ]),
});
type Values = z.infer<typeof schema>;

export function CommunityProfileForm({ group }: { group: GroupDetail }) {
  const mutation = useUpdateCommunityGroup(group.slug);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: group.description,
      country: group.country ?? "",
      places: (group.places ?? []).join(", "),
      tags: (group.tags ?? []).join(", "),
      summary: group.summary ?? "",
      bannerUrl: group.bannerUrl ?? "",
    },
  });
  function submit(values: Values) {
    mutation.mutate(
      {
        section: "profile",
        body: {
          ...values,
          country: values.country || null,
          summary: values.summary || null,
          bannerUrl: values.bannerUrl || null,
          places: splitCommunityTerms(values.places),
          tags: splitCommunityTerms(values.tags),
        },
      },
      { onSuccess: () => form.reset(values) },
    );
  }
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      <CommunityFormField
        control={form.control}
        name="description"
        label="Description"
        multiline
        disabled={mutation.isPending}
      />
      <CommunityFormField
        control={form.control}
        name="summary"
        label="Sidebar summary"
        multiline
        disabled={mutation.isPending}
      />
      <CommunityFormField
        control={form.control}
        name="country"
        label="Country"
        disabled={mutation.isPending}
      />
      <CommunityFormField
        control={form.control}
        name="places"
        label="Places (comma separated)"
        disabled={mutation.isPending}
      />
      <CommunityFormField
        control={form.control}
        name="tags"
        label="Tags (comma separated)"
        disabled={mutation.isPending}
      />
      <CommunityFormField
        control={form.control}
        name="bannerUrl"
        label="Banner image URL"
        disabled={mutation.isPending}
      />
      <CommunityQueryError error={mutation.error} />
      {mutation.isSuccess && !form.formState.isDirty ? (
        <p role="status" className="text-sm text-success">
          Profile saved.
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={mutation.isPending || !form.formState.isDirty}
      >
        {mutation.isPending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
