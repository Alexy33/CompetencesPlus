"use client";

import { Chip } from "@/components/common/chip";
import { BadgeCheck } from "lucide-react";
import type { CertificationChipProps } from "./types";

export function CertificationChip({ certified, score }: CertificationChipProps) {
  if (!certified) {
    return (
      <Chip tone="warning" size="sm" className="font-mono tracking-wider">
        NON CERTIFIÉ
      </Chip>
    );
  }

  return (
    <Chip tone="success" size="sm" className="font-mono font-bold tracking-wider">
      <BadgeCheck aria-hidden="true" className="size-3.5 stroke-[2]" />
      Badge de certification · {score}/100
    </Chip>
  );
}
