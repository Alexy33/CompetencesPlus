"use client";

import { formatTimestamp } from "@/lib/dates";
import type { OwnProfile } from "@/server/services/profiles";
import { ArrowRight, ShieldCheck, ShieldOff } from "lucide-react";
import Link from "next/link";
import type { ConsentSummaryProps } from "./types";

function summaryOf(consent: OwnProfile["videoConsent"]): string {
  if (consent.granted) {
    return `Accord en cours depuis le ${formatTimestamp(consent.grantedAt)} (version ${consent.version ?? "—"}).`;
  }
  if (consent.revokedAt) {
    return `Retiré le ${formatTimestamp(consent.revokedAt)} : aucune vidéo ne peut être hébergée.`;
  }
  return "Jamais donné : aucune vidéo ne peut être hébergée.";
}

export function ConsentSummary({ consent }: ConsentSummaryProps) {
  return (
    <div className="mt-6 rounded-2xl border border-brand-300 bg-white p-5" id="consentement">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex size-10 items-center justify-center rounded-xl ${
              consent.granted ? "bg-success text-success-fg" : "bg-danger text-danger-fg"
            }`}
          >
            {consent.granted ? (
              <ShieldCheck aria-hidden="true" className="size-5" />
            ) : (
              <ShieldOff aria-hidden="true" className="size-5" />
            )}
          </span>
          <div>
            <h3 className="text-lg font-bold uppercase text-ink">Consentement à la diffusion</h3>
            <p className="text-sm text-ink-muted">{summaryOf(consent)}</p>
          </div>
        </div>

        <Link
          href="/candidate/consentement"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-action px-5 text-sm font-semibold text-white hover:bg-action-hover"
        >
          {consent.granted ? "Gérer mon consentement" : "Donner mon consentement"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </div>
  );
}
