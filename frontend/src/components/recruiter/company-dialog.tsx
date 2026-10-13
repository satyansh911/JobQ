"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { job_service } from "@/context/AppContext";
import { Company } from "@/type";
import { apiError, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PanelDialog } from "@/components/ui/panel-dialog";
import { CompanyLogo } from "@/components/jq/identity";
import { FieldError, FormAlert } from "@/components/auth/auth-shell";
import { authHeaders, siteLabel, websiteError } from "./shared";

const DESC_MAX = 500;
type Errors = Partial<Record<"name" | "description" | "website" | "logo", string>>;

/** Add a company, or edit one when `company` is passed. */
export function CompanyDialog({
  open,
  onOpenChange,
  company,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  company?: Company | null;
  onSaved: (c: Company) => void;
}) {
  const editing = !!company;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fill the form each time the dialog opens (state adjusted during render, not in an effect).
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(company?.name ?? "");
      setDescription(company?.description ?? "");
      setWebsite(company ? siteLabel(company.website) : "");
      setLogo(null);
      setErrors({});
      setFormError(null);
    }
  }

  const preview = useMemo(() => (logo ? URL.createObjectURL(logo) : null), [logo]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const pick = (f?: File) => {
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type))
      return setErrors((e) => ({
        ...e,
        logo: "Logos need to be a PNG or JPG.",
      }));
    if (f.size > 2 * 1024 * 1024) return setErrors((e) => ({ ...e, logo: "Logos need to be under 2MB." }));
    setErrors((e) => ({ ...e, logo: undefined }));
    setLogo(f);
  };

  const edit = (k: keyof Errors, set: (v: string) => void) => (v: string) => {
    set(v);
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const save = async () => {
    setFormError(null);
    const found: Errors = {};
    if (!name.trim()) found.name = "Add the company's name.";
    if (!description.trim()) found.description = "Add a line or two about what the company does.";
    const w = websiteError(website);
    if (w) found.website = w;
    setErrors(found);
    if (Object.keys(found).length) return;

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("description", description.trim());
    fd.append("website", website.trim());
    if (logo) fd.append("file", logo);

    setBusy(true);
    try {
      const { data } = editing
        ? await axios.put(`${job_service}/api/job/company/${company!.company_id}`, fd, authHeaders())
        : await axios.post(`${job_service}/api/job/company/new`, fd, authHeaders());
      onSaved(data.company);
      onOpenChange(false);
    } catch (err) {
      const res = (err as { response?: { status?: number; data?: { message?: string } } }).response;
      const msg = res?.data?.message ?? "";
      if (res?.status === 409) setErrors({ name: msg });
      else if (/full address/i.test(msg)) setErrors({ website: msg });
      else setFormError(apiError(err, editing ? "Couldn't save the company." : "Couldn't add the company."));
    } finally {
      setBusy(false);
    }
  };

  const inv = (k: keyof Errors) => ({
    "aria-invalid": !!errors[k] || undefined,
    "aria-describedby": errors[k] ? `co-${k}-err` : undefined,
  });

  return (
    <PanelDialog
      open={open}
      onOpenChange={onOpenChange}
      closable={!busy}
      title={editing ? "Edit company" : "Add a company"}
      width={600}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} loading={busy}>
            {busy ? "Saving" : editing ? "Save changes" : "Add company"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-[18px]">
        {formError && <FormAlert>{formError}</FormAlert>}
        <div className="flex items-start gap-4">
          <CompanyLogo name={name || "?"} src={preview ?? company?.logo} size={84} className={cn(!preview && !company?.logo && "border-dashed")} />
          <div className="flex min-w-0 flex-col items-start gap-2">
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
              {preview || company?.logo ? "Change logo" : "Upload logo"}
            </Button>
            {errors.logo ? (
              <FieldError id="co-logo-err">{errors.logo}</FieldError>
            ) : (
              <span className="t-help">A square PNG or JPG works best. Until you add one, we&apos;ll show these initials.</span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="co-name">Company name</Label>
          <Input id="co-name" value={name} onChange={(e) => edit("name", setName)(e.target.value)} disabled={busy} autoComplete="organization" {...inv("name")} />
          {errors.name && <FieldError id="co-name-err">{errors.name}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="co-description">Description</Label>
          <Textarea
            id="co-description"
            rows={3}
            maxLength={DESC_MAX}
            value={description}
            onChange={(e) => edit("description", setDescription)(e.target.value)}
            disabled={busy}
            placeholder="What the company makes, where it is, how big the team is."
            {...inv("description")}
          />
          <div className="flex justify-between gap-3">
            {errors.description ? <FieldError id="co-description-err">{errors.description}</FieldError> : <span />}
            <span className="t-help tabular-nums">
              {description.length} / {DESC_MAX}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="co-website">Website</Label>
          <Input
            id="co-website"
            inputMode="url"
            placeholder="kitepost.in"
            value={website}
            onChange={(e) => edit("website", setWebsite)(e.target.value)}
            disabled={busy}
            autoComplete="url"
            {...inv("website")}
          />
          {errors.website && <FieldError id="co-website-err">{errors.website}</FieldError>}
        </div>
      </div>
    </PanelDialog>
  );
}
