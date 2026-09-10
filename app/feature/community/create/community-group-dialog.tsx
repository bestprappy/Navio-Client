"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  createGroupSchema,
  type CreateGroupValues,
} from "../_components/community-api";
import { useCreateCommunityGroup } from "../_components/community-group-queries";
import { CommunityQueryError } from "../_components/community-query-state";

const FIELDS = [
  { name: "name", label: "Community name", placeholder: "Thailand road trips" },
  {
    name: "description",
    label: "Description",
    placeholder: "What will travelers find in this community?",
  },
  { name: "country", label: "Country (optional)", placeholder: "Thailand" },
  {
    name: "places",
    label: "Places (comma separated, optional)",
    placeholder: "Bangkok, Chiang Mai",
  },
  {
    name: "tags",
    label: "Tags (comma separated, optional)",
    placeholder: "Road trips, EV charging",
  },
] as const;

export function CommunityGroupDialog() {
  const [open, setOpen] = useState(false);
  const { requireAuth, isAuthenticationLoading } = useRequireAuth();
  const router = useRouter();
  const mutation = useCreateCommunityGroup();
  const form = useForm<CreateGroupValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      country: "",
      places: "",
      tags: "",
    },
  });

  function submit(values: CreateGroupValues) {
    mutation.mutate(values, {
      onSuccess: (group) => {
        setOpen(false);
        form.reset();
        router.push(`/community/${encodeURIComponent(group.slug)}`);
      },
    });
  }

  return (
    <>
      <Button
        disabled={isAuthenticationLoading}
        onClick={() =>
          requireAuth(() => {
            mutation.reset();
            setOpen(true);
          })
        }
      >
        <Plus className="size-4" aria-hidden="true" />
        Create community
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!mutation.isPending) setOpen(next);
        }}
      >
        <DialogContent
          className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
          showCloseButton={!mutation.isPending}
        >
          <DialogHeader>
            <DialogTitle>Create a community</DialogTitle>
            <DialogDescription>
              Bring travelers together. You will become the first moderator.
            </DialogDescription>
          </DialogHeader>
          <form
            id="create-community"
            onSubmit={form.handleSubmit(submit)}
            className="space-y-4"
          >
            {FIELDS.map(({ name, label, placeholder }) => (
              <Controller
                key={name}
                name={name}
                control={form.control}
                render={({ field, fieldState }) => {
                  const id = `community-${name}`;
                  const props = {
                    ...field,
                    id,
                    placeholder,
                    disabled: mutation.isPending,
                    "aria-invalid": fieldState.invalid,
                    "aria-describedby": fieldState.error
                      ? `${id}-error`
                      : undefined,
                  };
                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={id}>{label}</FieldLabel>
                      {name === "description" ? (
                        <Textarea {...props} rows={4} />
                      ) : (
                        <Input
                          {...props}
                          maxLength={
                            name === "name" || name === "country"
                              ? 120
                              : undefined
                          }
                        />
                      )}
                      <FieldError
                        id={`${id}-error`}
                        errors={[fieldState.error]}
                      />
                    </Field>
                  );
                }}
              />
            ))}
            <CommunityQueryError error={mutation.error} />
          </form>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-community"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creating…" : "Create community"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
