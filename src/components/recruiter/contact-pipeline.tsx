"use client";

import { EmptyState } from "@/components/common/feedback";
import { Surface, SurfaceHeading } from "@/components/common/surface";
import { ContactRow } from "./contact-row";
import type { ContactPipelineProps } from "./types";

export function ContactPipeline({ contacts, onStatusChange }: ContactPipelineProps) {
  return (
    <Surface tone="elevated" padding="responsive">
      <SurfaceHeading
        title="Candidats contactés"
        description="Faites avancer chaque profil dans votre suivi."
      />

      <div className="mt-6 space-y-3">
        {contacts.length ? (
          contacts.map((contact) => (
            <ContactRow
              key={contact.id}
              contact={contact}
              onStatusChange={(status) => onStatusChange(contact.id, status)}
            />
          ))
        ) : (
          <EmptyState>Aucun candidat contacté pour le moment.</EmptyState>
        )}
      </div>
    </Surface>
  );
}
