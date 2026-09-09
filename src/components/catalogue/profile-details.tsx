import { ProfileVideo } from "./profile-video";
import type { ProfileDetailsProps } from "./types";

export function ProfileDetails({ profile }: ProfileDetailsProps) {
  return (
    <div>
      <ProfileVideo video={profile.video} name={profile.name} />

      <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider">
        <span className="rounded-full bg-brand-200 px-3 py-1.5 text-brand-800">{profile.city}</span>
        <span className="rounded-full bg-info px-3 py-1.5 text-info-fg">{profile.sector}</span>
      </div>

      {profile.bio ? (
        <div className="mt-6 rounded-3xl border border-brand-300 bg-panel p-6">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Présentation
          </h2>
          <p className="mt-3 max-w-[70ch] text-[15.5px] leading-[1.65] text-ink-muted">
            {profile.bio}
          </p>
        </div>
      ) : null}

      {profile.skills.length > 0 ? (
        <div className="mt-6 rounded-3xl border border-brand-300 bg-panel p-6">
          <h2 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Compétences déclarées
          </h2>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full bg-teal px-3 py-1.5 text-xs font-semibold text-teal-fg"
              >
                {skill}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
