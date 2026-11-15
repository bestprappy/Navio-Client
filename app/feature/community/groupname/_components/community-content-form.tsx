"use client";

import { z } from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommunityFormField } from "../../_components/community-form-field";
import { CommunityQueryError } from "../../_components/community-query-state";
import { useUpdateCommunityGroup } from "../../_components/community-group-queries";
import type { GroupDetail } from "../../_components/community-api";
import { getTripBlockColorByIndex } from "../../../planner/planId/_components/constants/trip-block-colors";
import {
  CommunityFlairColorField,
  CommunityFlairPreview,
} from "./community-flair-fields";

type Section = "rules" | "flairs" | "resources";
const itemSchema = z.object({
  label: z.string().trim().min(1, "Enter a title or label.").max(120),
  description: z.string().trim(),
  url: z.string().trim(),
  colorId: z.string(),
});
const schema = z.object({ items: z.array(itemSchema) });
type Values = z.infer<typeof schema>;
const emptyItem: Values["items"][number] = {
  label: "",
  description: "",
  url: "",
  colorId: getTripBlockColorByIndex(0),
};

function initialValues(group: GroupDetail, section: Section): Values {
  if (section === "rules")
    return {
      items: group.rules.map((rule) => ({
        ...emptyItem,
        label: rule.title,
        description: rule.description,
      })),
    };
  if (section === "resources")
    return {
      items: group.resources.map((resource) => ({
        ...emptyItem,
        label: resource.label,
        url: resource.url ?? "",
      })),
    };
  return {
    items: group.postFlairs.map((flair) => ({
      ...emptyItem,
      label: flair.label,
      colorId: flair.colorId,
    })),
  };
}

export function CommunityContentForm({
  group,
  section,
}: {
  group: GroupDetail;
  section: Section;
}) {
  const mutation = useUpdateCommunityGroup(group.slug);
  const validation = schema.superRefine(({ items }, context) =>
    items.forEach((item, index) => {
      if (section === "rules" && !item.description)
        context.addIssue({
          code: "custom",
          path: ["items", index, "description"],
          message: "Describe this rule.",
        });
      if (section === "flairs" && item.label.length > 80)
        context.addIssue({
          code: "custom",
          path: ["items", index, "label"],
          message: "Use at most 80 characters.",
        });
      if (
        section === "resources" &&
        item.url &&
        !/^https?:\/\/[^\s]+$/.test(item.url)
      )
        context.addIssue({
          code: "custom",
          path: ["items", index, "url"],
          message: "Enter an HTTP or HTTPS URL.",
        });
    }),
  );
  const form = useForm<Values>({
    resolver: zodResolver(validation),
    defaultValues: initialValues(group, section),
  });
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "items",
  });
  function submit(values: Values) {
    const body =
      section === "rules"
        ? {
            rules: values.items.map((item) => ({
              title: item.label,
              description: item.description,
            })),
          }
        : section === "resources"
          ? {
              resources: values.items.map((item) => ({
                label: item.label,
                url: item.url || null,
              })),
            }
          : {
              // flairType and tone keep servers from before palette colors
              // accepting the save; newer servers keep colorId.
              flairs: values.items.map((item) => ({
                flairType: "post",
                label: item.label,
                tone: "reliable",
                colorId: item.colorId,
              })),
            };
    mutation.mutate({ section, body }, { onSuccess: () => form.reset(values) });
  }
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      <p className="text-sm text-muted-foreground">
        {section === "flairs"
          ? "Members tag their posts with one of these flairs. Colors come from the admin palette."
          : `Add, remove, or reorder ${section}, then save your changes.`}
      </p>
      {fields.length === 0 ? (
        <p className="text-sm">No {section} configured.</p>
      ) : null}
      {fields.map((item, index) => (
        <fieldset
          key={item.id}
          disabled={mutation.isPending}
          className="space-y-3 rounded-lg border border-border p-4"
        >
          {section === "flairs" ? (
            <CommunityFlairPreview control={form.control} index={index} />
          ) : (
            <legend className="px-1 text-sm font-medium">
              Item {index + 1}
            </legend>
          )}
          {section === "flairs" ? (
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-48 flex-1">
                <CommunityFormField
                  control={form.control}
                  name={`items.${index}.label`}
                  label="Label"
                />
              </div>
              <CommunityFlairColorField control={form.control} index={index} />
            </div>
          ) : (
            <CommunityFormField
              control={form.control}
              name={`items.${index}.label`}
              label={section === "rules" ? "Title" : "Label"}
            />
          )}
          {section === "rules" ? (
            <CommunityFormField
              control={form.control}
              name={`items.${index}.description`}
              label="Description"
              multiline
            />
          ) : null}
          {section === "resources" ? (
            <CommunityFormField
              control={form.control}
              name={`items.${index}.url`}
              label="Link URL (optional)"
            />
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={index === 0}
              aria-label={`Move item ${index + 1} up`}
              onClick={() => move(index, index - 1)}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={index === fields.length - 1}
              aria-label={`Move item ${index + 1} down`}
              onClick={() => move(index, index + 1)}
            >
              <ArrowDown />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Remove item ${index + 1}`}
              onClick={() => remove(index)}
            >
              <Trash2 />
            </Button>
          </div>
        </fieldset>
      ))}
      <CommunityQueryError error={mutation.error} />
      {mutation.isSuccess && !form.formState.isDirty ? (
        <p role="status" className="text-sm text-success">
          Changes saved.
        </p>
      ) : null}
      <div className="flex flex-wrap justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={mutation.isPending}
          onClick={() =>
            append({
              ...emptyItem,
              colorId: getTripBlockColorByIndex(fields.length),
            })
          }
        >
          <Plus />
          {section === "flairs" ? "Add flair" : "Add item"}
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending || !form.formState.isDirty}
        >
          {mutation.isPending ? "Saving…" : `Save ${section}`}
        </Button>
      </div>
    </form>
  );
}
