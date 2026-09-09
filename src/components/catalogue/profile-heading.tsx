import type { ProfileDetailsProps } from "./types";

export function ProfileHeading({ profile }: ProfileDetailsProps) {
  return (
    <div className="mt-7 border-b border-brand/15 pb-7">
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
        Profil public · présentation vidéo
      </p>
      <h1 className="mt-3 text-4xl font-extrabold uppercase leading-tight tracking-tight text-ink md:text-5xl">
        {profile.name}
      </h1>
      <p className="mt-2 text-lg text-ink-muted">{profile.title}</p>
    </div>
  );
}
