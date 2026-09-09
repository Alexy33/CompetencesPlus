"use client";

import { Chip } from "@/components/common/chip";
import { CONTACT_STATUSES, type ContactStatus } from "@/lib/vocabulary";
import Link from "next/link";
import type { ContactRowProps } from "./types";

export function ContactRow({ contact, onStatusChange }: ContactRowProps) {
  return (
    <article className="grid gap-4 rounded-2xl bg-white p-4 md:grid-cols-[minmax(0,1fr)_190px_auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-ink">{contact.profile.name}</h3>
          {contact.profile.certified ? (
            <Chip tone="success" size="xs" className="font-bold">
              Badge de certification · {contact.profile.score}/100
            </Chip>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          {contact.profile.title} · {contact.profile.city}
        </p>
        <p className="mt-2 line-clamp-1 text-xs text-ink-muted">{contact.message}</p>
      </div>

      <select
        aria-label={`Statut de ${contact.profile.name}`}
        value={contact.status}
        onChange={(event) => onStatusChange(event.target.value as ContactStatus)}
        className="h-10 rounded-xl border border-brand/20 bg-panel px-3 text-sm outline-none focus:border-brand"
      >
        {CONTACT_STATUSES.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>

      <Link
        href={`/profils/${contact.profile.id}`}
        className="text-sm font-semibold text-brand hover:text-brand-700"
      >
        Ouvrir
      </Link>
    </article>
  );
}
