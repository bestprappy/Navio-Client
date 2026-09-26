"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VehicleMedia } from "@/app/feature/planner/planId/_components/garage/vehicle-media";
import { catalogVehicleCar } from "@/app/feature/planner/planId/_components/garage/vehicle-mappers";
import { vehicleCatalogSchema } from "@/app/feature/planner/planId/_components/garage/vehicle-api";
import { AdminLoadingRows } from "../admin-query-state";
import { BATTERY_BASES, CONNECTORS, RANGE_STANDARDS, catalogFieldsSchema, catalogKeys, EMPTY_CATALOG_FIELDS, getAdminCatalogEntry, saveCatalogEntry, transitionCatalogEntry, type CatalogEntry, type CatalogFields } from "./catalog-api";

export function CatalogEditor({ id }: { id: string | null }) {
  const query = useQuery({ queryKey: [...catalogKeys.root, "detail", id], queryFn: () => getAdminCatalogEntry(id!), enabled: id !== null, staleTime: 0, retry: false });
  if (id && query.isPending) return <AdminLoadingRows rows={6} label="Loading vehicle" />;
  if (id && query.isError) return <div role="alert" className="grid gap-3"><p>{query.error.message}</p><Button variant="outline" onClick={() => query.refetch()}>Try again</Button><Link href="/admin/vehicles">Back to catalog</Link></div>;
  return <CatalogForm key={`${id ?? "new"}-${query.data?.version ?? 0}`} entry={query.data ?? null} />;
}

function CatalogForm({ entry }: { entry: CatalogEntry | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmation, setConfirmation] = useState<"publish" | "archive" | "reload" | null>(null);
  const [message, setMessage] = useState("");
  const form = useForm<CatalogFields>({ resolver: zodResolver(catalogFieldsSchema), defaultValues: entry?.specification ?? EMPTY_CATALOG_FIELDS });
  const fields = useWatch({ control: form.control });
  const dirty = form.formState.isDirty;
  const mutation = useMutation({
    mutationFn: (action: { kind: "save"; fields: CatalogFields } | { kind: "publish" | "archive" }) => action.kind === "save" ? saveCatalogEntry(entry, action.fields) : transitionCatalogEntry(entry!, action.kind),
    retry: false,
    onSuccess: async (saved, action) => {
      setConfirmation(null);
      form.reset(saved.specification);
      setMessage(action.kind === "save" ? "Changes saved." : action.kind === "publish" ? "Vehicle published." : "Vehicle archived.");
      queryClient.setQueryData([...catalogKeys.root, "detail", saved.id], saved);
      await Promise.all([queryClient.invalidateQueries({ queryKey: catalogKeys.root }), queryClient.invalidateQueries({ queryKey: catalogKeys.public })]);
      if (!entry) router.replace(`/admin/vehicles/${saved.id}`);
    },
  });
  const preview = vehicleCatalogSchema.safeParse({ ...fields, id: entry?.id ?? "preview", version: entry?.version ?? 0, imageUrl: fields.imageUrl ?? "" });
  function numberField(name: "year" | "batteryCapacityKwh" | "rangeKm" | "maxAcKw" | "maxDcKw", label: string, max: number, min = 0, step = "0.01") {
    return <Field data-invalid={Boolean(form.formState.errors[name])}><FieldLabel htmlFor={name}>{label}</FieldLabel><Input id={name} type="number" min={min} max={max} step={step} {...form.register(name, { setValueAs: (value: string | null | undefined) => value == null || value === "" ? null : Number(value) })} aria-invalid={Boolean(form.formState.errors[name])} /><FieldError errors={[form.formState.errors[name]]} /></Field>;
  }
  function textField(name: "make" | "model" | "trim" | "market" | "imageUrl" | "sourceUrl" | "verifiedAt", label: string, type = "text") {
    return <Field data-invalid={Boolean(form.formState.errors[name])}><FieldLabel htmlFor={name}>{label}</FieldLabel><Input id={name} type={type} maxLength={name.endsWith("Url") ? 2048 : name === "market" ? 2 : 100} {...form.register(name, { setValueAs: (value: string) => name === "market" ? value.toUpperCase() : ["imageUrl", "sourceUrl", "verifiedAt"].includes(name) && !value ? null : value })} aria-invalid={Boolean(form.formState.errors[name])} /><FieldError errors={[form.formState.errors[name]]} /></Field>;
  }
  function selectField(name: "batteryCapacityBasis" | "rangeStandard", label: string, options: readonly string[]) {
    return <Controller name={name} control={form.control} render={({ field, fieldState }) => <Field><FieldLabel htmlFor={name}>{label}</FieldLabel><Select value={field.value ?? "NOT_SET"} onValueChange={(value) => field.onChange(value === "NOT_SET" ? null : value)}><SelectTrigger id={name} className="w-full"><SelectValue /></SelectTrigger><SelectContent>{name === "rangeStandard" && <SelectItem value="NOT_SET">Not set</SelectItem>}{options.map((option) => <SelectItem key={option} value={option}>{option === "MANUFACTURER_DECLARED" ? "Manufacturer declared" : option === "UNKNOWN" ? "Unknown" : option === "USABLE" ? "Usable" : option === "GROSS" ? "Gross" : option}</SelectItem>)}</SelectContent></Select><FieldError errors={[fieldState.error]} /></Field>} />;
  }
  return <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/admin/vehicles" className="flex items-center gap-2 text-sm underline-offset-4 hover:underline"><ArrowLeft className="size-4" />Back to catalog</Link><Badge variant="outline">{entry ? entry.status[0] + entry.status.slice(1).toLowerCase() : "Unsaved draft"}</Badge></div>
    <p role="status" className={message ? "text-sm text-muted-foreground" : "sr-only"}>{message}</p>
    {mutation.isError && <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"><p className="text-sm">{mutation.error.message}</p>{entry && <Button variant="outline" onClick={() => setConfirmation("reload")}>Reload saved version</Button>}</div>}
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <form id="catalog-form" onSubmit={form.handleSubmit((values) => mutation.mutate({ kind: "save", fields: values }))} noValidate>
        <fieldset disabled={mutation.isPending} className="flex min-w-0 flex-col gap-8">
          <Section title="Identity"><div className="grid gap-4 sm:grid-cols-2">{textField("make", "Make")}{textField("model", "Model")}{textField("trim", "Trim (optional)")}{numberField("year", "Model year (optional)", 2200, 1900, "1")}{textField("market", "Market code")}</div><p className="text-xs text-muted-foreground">Use the two-letter country code for this specification, such as TH for Thailand.</p></Section>
          <Section title="Battery and range"><div className="grid gap-4 sm:grid-cols-2">{numberField("batteryCapacityKwh", "Battery capacity (kWh)", 999999.99, 0.01)}{selectField("batteryCapacityBasis", "Capacity basis", BATTERY_BASES)}{numberField("rangeKm", "Official range (km)", 999999.99, 0.01)}{selectField("rangeStandard", "Range test standard", RANGE_STANDARDS)}</div><p className="text-xs text-muted-foreground">Record the sourced specification. Drivers set their own real-world consumption when selecting the car.</p></Section>
          <Section title="Charging"><div className="grid gap-4 sm:grid-cols-2">{numberField("maxAcKw", "Maximum AC (kW, optional)", 1000)}{numberField("maxDcKw", "Maximum DC (kW, optional)", 2000)}</div><Controller control={form.control} name="connectorTypes" render={({ field }) => <fieldset className="mt-2"><legend className="mb-2 text-sm font-medium">Connectors</legend><div className="flex flex-wrap gap-2">{CONNECTORS.map((connector) => <label key={connector} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring"><input type="checkbox" checked={field.value.includes(connector)} onChange={(event) => field.onChange(event.target.checked ? [...field.value, connector] : field.value.filter((value) => value !== connector))} className="size-4 accent-primary" />{connector}</label>)}</div></fieldset>} /></Section>
          <Section title="Image and sources">{textField("imageUrl", "Image URL (optional)")}<p className="text-xs text-muted-foreground">Use an HTTPS image or an existing /images/vehicles/ asset. Leave blank for a placeholder.</p>{textField("sourceUrl", "Specification source URL", "url")}{textField("verifiedAt", "Date verified", "date")}</Section>
          <div className="flex flex-wrap items-center gap-3 border-t pt-5"><Button type="submit" variant="secondary">{mutation.isPending ? "Saving…" : entry?.status === "PUBLISHED" ? "Save changes" : "Save draft"}</Button>{dirty && <span className="text-xs text-muted-foreground">You have unsaved changes.</span>}</div>
        </fieldset>
      </form>
      <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
        <section className="overflow-hidden rounded-xl border bg-card"><div className="border-b px-4 py-3"><h2 className="font-semibold">Picker preview</h2></div><div className="flex flex-col gap-3 p-4">
          {preview.success ? <><VehicleMedia car={catalogVehicleCar(preview.data)} /><p className="font-semibold">{preview.data.make} {preview.data.model}</p><p className="text-sm text-muted-foreground">{preview.data.trim} {preview.data.year} · {preview.data.market}</p><div className="flex flex-wrap gap-2"><Badge variant="secondary">{preview.data.rangeKm} km {preview.data.rangeStandard}</Badge><Badge variant="outline">{preview.data.batteryCapacityKwh} kWh</Badge></div></> : <><p className="font-semibold">{fields.make || "Make"} {fields.model || "Model"}</p><p className="text-sm text-muted-foreground">Add battery capacity, range, connectors and a dated source to complete the preview.</p></>}
        </div></section>
        <section className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4"><h2 className="font-semibold">Availability</h2><p className="text-sm text-muted-foreground">{entry?.status === "PUBLISHED" ? "Visible to every driver. Saved changes apply to future selections." : "Only administrators can see this vehicle until it is published."}</p>
          {entry ? <>{entry.status !== "PUBLISHED" && <Button variant="secondary" disabled={dirty || mutation.isPending} onClick={() => setConfirmation("publish")}>{entry.status === "ARCHIVED" ? "Republish vehicle" : "Publish vehicle"}</Button>}{entry.status !== "ARCHIVED" && <Button variant="outline" disabled={dirty || mutation.isPending} onClick={() => setConfirmation("archive")}>Archive vehicle</Button>}{dirty && <p className="text-xs text-muted-foreground">Save your changes before publishing or archiving.</p>}</> : <p className="text-xs text-muted-foreground">Save a draft first to enable publishing.</p>}
          <p className="text-xs text-muted-foreground">Existing garages and saved trips keep their current specifications.</p>
        </section>
      </aside>
    </div>
    <Dialog open={confirmation !== null} onOpenChange={(open) => { if (!open && !mutation.isPending) setConfirmation(null); }}>
      <DialogContent showCloseButton={!mutation.isPending}><DialogHeader><DialogTitle>{confirmation === "reload" ? "Reload saved version?" : confirmation === "publish" ? "Publish this vehicle?" : "Archive this vehicle?"}</DialogTitle><DialogDescription>{confirmation === "reload" ? "This replaces your unsaved edits with the latest saved specifications." : confirmation === "publish" ? "Drivers, including guests, will be able to select this vehicle. Its specifications must have a dated source." : "This removes the vehicle from new selections. Existing garages and trips keep their saved specifications."}</DialogDescription></DialogHeader>
        {mutation.isError && confirmation !== "reload" && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
        <DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={() => setConfirmation(null)}>Cancel</Button><Button variant="secondary" disabled={mutation.isPending} onClick={async () => {
          if (confirmation === "reload") { const saved = await queryClient.fetchQuery({ queryKey: [...catalogKeys.root, "detail", entry!.id], queryFn: () => getAdminCatalogEntry(entry!.id), staleTime: 0 }).catch(() => null); if (saved) { form.reset(saved.specification); mutation.reset(); setConfirmation(null); } }
          else if (confirmation) mutation.mutate({ kind: confirmation });
        }}>{mutation.isPending ? "Updating…" : confirmation === "reload" ? "Reload saved version" : confirmation === "publish" ? "Publish vehicle" : "Archive vehicle"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="flex flex-col gap-4"><h2 className="text-lg font-semibold">{title}</h2>{children}</section>;
}
