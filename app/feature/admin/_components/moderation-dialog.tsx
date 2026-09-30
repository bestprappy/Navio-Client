"use client";

import { useEffect, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  AdminApiError,
  moderationReasonSchema,
  REASON_MAX_LENGTH,
  type ModerationAction,
  type ModerationResult,
} from "./admin-api";
import { useModerateUser } from "./admin-queries";

const formSchema = z.object({ reason: moderationReasonSchema });
type FormValues = z.infer<typeof formSchema>;

type ModerationDialogProps = {
  action: ModerationAction;
  user: { id: string; displayName: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: (result: ModerationResult) => void;
};

const COPY: Record<ModerationAction, {
  title: (name: string) => string;
  consequence: (name: string) => string;
  reasonHint: string;
  confirm: string;
  pending: string;
}> = {
  ban: {
    title: (name) => `Ban ${name}?`,
    consequence: (name) =>
      `${name} is signed out on every device and cannot sign back in. Anything already open in their browser stops working within 5 minutes. Their trips and garage are kept.`,
    reasonHint: "Say what happened. Other moderators see this in the account history.",
    confirm: "Ban account",
    pending: "Banning…",
  },
  unban: {
    title: (name) => `Unban ${name}?`,
    consequence: (name) => `${name} can sign in again straight away, with their trips and garage as they left them.`,
    reasonHint: "Say why the ban is lifted, for example an upheld appeal.",
    confirm: "Unban account",
    pending: "Unbanning…",
  },
};

export function ModerationDialog({ action, user, open, onOpenChange, onCompleted }: ModerationDialogProps) {
  const copy = COPY[action];
  const reasonId = useId();
  const hintId = `${reasonId}-hint`;
  const errorId = `${reasonId}-error`;
  const mutation = useModerateUser();
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { reason: "" } });
  const { reset: resetForm } = form;
  const { reset: resetMutation } = mutation;

  // Each opening starts clean; a reason typed for one account must never
  // carry over to the next.
  useEffect(() => {
    if (open) {
      resetForm({ reason: "" });
      resetMutation();
    }
  }, [open, resetForm, resetMutation]);

  const submit = form.handleSubmit((values) => {
    mutation.mutate(
      { userId: user.id, action, reason: values.reason },
      {
        onSuccess: (result) => {
          onOpenChange(false);
          onCompleted(result);
        },
      },
    );
  });

  const requestError = mutation.error
    ? mutation.error instanceof AdminApiError
      ? mutation.error.message
      : "Navio did not confirm the change. Refresh the account to check its current state before trying again."
    : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing mid-request would hide whether the ban happened.
        if (!mutation.isPending) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={!mutation.isPending}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{copy.title(user.displayName)}</DialogTitle>
            <DialogDescription>{copy.consequence(user.displayName)}</DialogDescription>
          </DialogHeader>

          <Controller
            control={form.control}
            name="reason"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={reasonId}>Reason</FieldLabel>
                <Textarea
                  {...field}
                  id={reasonId}
                  rows={4}
                  maxLength={REASON_MAX_LENGTH}
                  autoFocus
                  disabled={mutation.isPending}
                  aria-invalid={fieldState.invalid || undefined}
                  aria-describedby={cn(hintId, fieldState.invalid && errorId)}
                />
                <FieldDescription id={hintId}>{copy.reasonHint}</FieldDescription>
                <FieldError id={errorId} errors={[fieldState.error]} />
              </Field>
            )}
          />

          {requestError ? (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {requestError}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" disabled={mutation.isPending} />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className={cn(
                action === "ban" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
            >
              {mutation.isPending ? copy.pending : copy.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
