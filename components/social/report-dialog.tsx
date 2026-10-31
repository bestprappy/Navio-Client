"use client";

import { useId, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { reportContent } from "@/lib/social-api";
import type { ReportReason, ReportTargetType } from "@/lib/validations/social";

const REASONS: { id: ReportReason; label: string }[] = [
  { id: "spam", label: "Spam or scam" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "hate", label: "Hate speech" },
  { id: "inappropriate", label: "Inappropriate or explicit" },
  { id: "impersonation", label: "Pretending to be someone else" },
  { id: "misinformation", label: "Misleading travel information" },
  { id: "other", label: "Something else" },
];

const NOUN: Record<ReportTargetType, string> = { user: "profile", post: "post", comment: "comment" };

type ReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTargetType;
  targetId: string;
  /** Who or what is being reported, for the title. */
  subject: string;
};

/** Sends a report to Navio's moderators. The reported person is not told who reported them. */
export function ReportDialog({ open, onOpenChange, targetType, targetId, subject }: ReportDialogProps) {
  const detailsId = useId();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const send = useMutation({
    mutationFn: () => reportContent({ targetType, targetId, reason: reason as ReportReason, details }),
  });

  const close = (next: boolean) => {
    if (send.isPending) return;
    onOpenChange(next);
    if (!next) {
      setReason(null);
      setDetails("");
      send.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="gap-5 sm:max-w-md">
        {send.isSuccess ? (
          <>
            <DialogHeader>
              <CheckCircle2 aria-hidden="true" className="size-6 text-success" />
              <DialogTitle>Report sent</DialogTitle>
              <DialogDescription>
                Navio moderators will review this {NOUN[targetType]}. You can also block the account to stop seeing it.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" className="h-10 px-5" onClick={() => close(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (reason) send.mutate();
            }}
          >
            <DialogHeader>
              <DialogTitle>Report {NOUN[targetType]}</DialogTitle>
              <DialogDescription>Why are you reporting {subject}?</DialogDescription>
            </DialogHeader>
            <RadioGroup value={reason ?? ""} onValueChange={(value) => setReason(value as ReportReason)} aria-label="Reason">
              {REASONS.map((option) => (
                <Label key={option.id} className="flex min-h-10 cursor-pointer items-center gap-3 font-normal">
                  <RadioGroupItem value={option.id} />
                  {option.label}
                </Label>
              ))}
            </RadioGroup>
            <div className="flex flex-col gap-2">
              <Label htmlFor={detailsId}>Anything moderators should know? <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea id={detailsId} value={details} maxLength={1000} rows={3} onChange={(event) => setDetails(event.target.value)} />
            </div>
            {send.error ? <p role="alert" className="text-sm text-destructive">{send.error.message}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" className="h-10 px-5" disabled={send.isPending} onClick={() => close(false)}>
                Cancel
              </Button>
              <Button type="submit" className="h-10 px-5" disabled={!reason || send.isPending}>
                {send.isPending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
                Send report
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
