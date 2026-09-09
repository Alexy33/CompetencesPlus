"use client";

import { Surface } from "@/components/common/surface";
import { formatSiren } from "@/lib/siren";
import { Building2 } from "lucide-react";
import type { CompanyPanelProps, RowProps } from "./types";

function Row({ label, children }: RowProps) {
  return (
    <div className="rounded-xl bg-white p-4">
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </dt>
      {children}
    </div>
  );
}

export function CompanyPanel({ company }: CompanyPanelProps) {
  return (
    <Surface>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-200 text-brand-800">
          <Building2 aria-hidden="true" className="size-5" />
        </span>
        <h2 className="text-xl font-bold uppercase text-ink">Mon entreprise</h2>
      </div>

      {company ? (
        <dl className="mt-5 space-y-3 text-sm">
          <Row label="Raison sociale">
            <dd className="mt-1 font-bold text-ink">{company.name}</dd>
            <dd className="mt-1 font-mono text-xs text-ink-muted">
              SIREN {formatSiren(company.siren)}
            </dd>
          </Row>

          <Row label="Votre poste">
            <dd className="mt-1 text-ink">{company.position}</dd>
          </Row>

          <Row label="Adresse">
            <dd className="mt-1 text-ink">
              {company.address}
              <br />
              {company.postalCode} {company.city}
            </dd>
            <dd className="mt-2 text-xs text-ink-muted">
              {company.sector}
              {company.phone ? ` · ${company.phone}` : ""}
            </dd>
            {company.website ? (
              <dd className="mt-1 truncate text-xs">
                <a
                  href={company.website}
                  className="text-brand underline underline-offset-2"
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {company.website}
                </a>
              </dd>
            ) : null}
          </Row>
        </dl>
      ) : (
        <p className="mt-5 rounded-xl bg-white p-4 text-sm text-ink-muted">
          Aucune entreprise déclarée sur ce compte.
        </p>
      )}
    </Surface>
  );
}
