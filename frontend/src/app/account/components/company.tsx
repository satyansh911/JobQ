"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { Building2, Trash2 } from "lucide-react";
import { Company as CompanyType } from "@/type";
import { job_service } from "@/context/AppContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const MAX_COMPANIES = 3;

const initials = (n: string) =>
  n.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const Company = () => {
  const token = Cookies.get("token");

  const [companies, setCompanies] = useState<CompanyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [confirming, setConfirming] = useState<CompanyType | null>(null);

  const reset = () => {
    setName("");
    setDescription("");
    setWebsite("");
    setLogo(null);
  };

  async function fetchCompanies() {
    try {
      const { data } = await axios.get(`${job_service}/api/job/company/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompanies(data);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addCompany() {
    if (!name || !description || !website || !logo) {
      toast.error("Every field is required, including the logo");
      return;
    }
    const fd = new FormData();
    fd.append("name", name);
    fd.append("description", description);
    fd.append("website", website);
    fd.append("file", logo);

    try {
      setBtnLoading(true);
      const { data } = await axios.post(
        `${job_service}/api/job/company/new`,
        fd,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(data.message);
      reset();
      setOpen(false);
      fetchCompanies();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not add the company");
    } finally {
      setBtnLoading(false);
    }
  }

  async function deleteCompany(id: string) {
    try {
      setBtnLoading(true);
      const { data } = await axios.delete(
        `${job_service}/api/job/company/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(data.message);
      fetchCompanies();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete");
    } finally {
      setBtnLoading(false);
      setConfirming(null);
    }
  }

  const atLimit = companies.length >= MAX_COMPANIES;

  return (
    <section className="mt-6 border border-hairline bg-raised">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-6 py-4">
        <div>
          <h2 className="t-h3">Your companies</h2>
          <p className="t-body-sm mt-0.5">
            <span className="numeric">{companies.length}</span> of{" "}
            <span className="numeric">{MAX_COMPANIES}</span> · each can carry its
            own postings
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          disabled={atLimit}
          title={atLimit ? `You can register up to ${MAX_COMPANIES} companies` : undefined}
          className="btn-primary-sm disabled:opacity-45"
        >
          Add a company
        </button>
      </div>

      {loading ? (
        <div className="space-y-px bg-hairline">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-4 bg-raised px-6 py-4">
              <div className="skeleton size-11 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Building2 className="mx-auto size-8 text-ink-4" />
          <h3 className="t-h3 mt-3">No companies yet</h3>
          <p className="t-body-sm mx-auto mt-1 max-w-sm">
            Register a company before you post a role — every posting belongs to
            one.
          </p>
          <button onClick={() => setOpen(true)} className="btn-primary-sm mt-5">
            Add a company
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-[color-mix(in_srgb,var(--color-ink)_16%,transparent)]">
          {companies.map((c) => (
            <li key={c.company_id} className="flex items-center gap-4 px-6 py-4">
              <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden border border-hairline bg-sunken font-[family-name:var(--font-display)] text-[15px] font-semibold text-ink-3">
                {c.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.logo} alt="" className="size-full object-cover" />
                ) : (
                  initials(c.name)
                )}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/company/${c.company_id}`}
                  className="font-[family-name:var(--font-display)] text-[17px] font-semibold"
                >
                  {c.name}
                </Link>
                <p className="t-body-sm truncate">{c.description}</p>
              </div>
              <Link
                href={`/company/${c.company_id}`}
                className="hidden border border-line-strong px-3 py-1.5 text-[14px] font-medium text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)] sm:inline-block"
              >
                Manage
              </Link>
              <button
                onClick={() => setConfirming(c)}
                aria-label={`Delete ${c.name}`}
                className="flex size-9 items-center justify-center border border-line-strong text-ink-3 hover:bg-bad-tint hover:text-bad-text"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* add company */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="t-h3">Add a company</DialogTitle>
            <DialogDescription className="t-body-sm">
              Candidates see this on every posting you publish under it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="co-name" className="t-label">Company name</Label>
              <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-desc" className="t-label">Description</Label>
              <textarea
                id="co-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="One line on what the company does."
                className="w-full resize-y border border-line-strong bg-sunken px-3 py-2 text-[15px] placeholder:text-ink-4 focus-visible:border-steel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-steel/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-site" className="t-label">Website</Label>
              <Input
                id="co-site"
                type="url"
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-logo" className="t-label">Logo</Label>
              <Input
                id="co-logo"
                type="file"
                accept="image/*"
                onChange={(e) => setLogo(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              className="border border-line-strong px-4 py-2 text-[15px] font-medium text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
            >
              Cancel
            </button>
            <button
              onClick={addCompany}
              disabled={btnLoading}
              className="btn-primary-sm disabled:opacity-45"
            >
              {btnLoading ? "Adding…" : "Add company"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete confirm — replaces the native confirm() */}
      <Dialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="t-h3">Delete {confirming?.name}?</DialogTitle>
            <DialogDescription className="t-body-sm">
              Every posting under this company is deleted with it, along with
              the applications attached to them. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setConfirming(null)}
              className="border border-line-strong px-4 py-2 text-[15px] font-medium text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
            >
              Keep it
            </button>
            <button
              onClick={() => confirming && deleteCompany(String(confirming.company_id))}
              disabled={btnLoading}
              className="border border-destructive bg-destructive px-4 py-2 font-[family-name:var(--font-display)] text-[15px] font-semibold text-white hover:bg-[#7a3129] disabled:opacity-45"
            >
              {btnLoading ? "Deleting…" : "Delete company"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Company;
