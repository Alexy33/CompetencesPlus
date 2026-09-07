import { and, desc, eq, inArray, isNotNull, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { profile, profileSkill, user } from "@/db/schema";
import type { City, ProfileStatus, Sector, Skill, VideoStatus } from "@/lib/vocabulary";
import { MAJORITY_AGE, isMinor } from "@/lib/age";

type ProfileRow = typeof profile.$inferSelect;

export interface ProfileCard {
  id: string;
  name: string;
  initials: string;
  title: string;
  sector: Sector;
  city: City;
  skills: Skill[];
  certified: boolean;
  score: number | null;
}

export interface FullProfile extends ProfileCard {
  bio: string;
  videoUrl: string | null;
  status: ProfileStatus;
  contactCount: number;
  certifiedAt: string | null;
  createdAt: string;
}

export interface VideoModerationView {
  status: VideoStatus;
  reason: string | null;

  decidedBy: string | null;
  decidedAt: string | null;
}

export interface VideoConsentView {
  granted: boolean;
  grantedAt: string | null;
  version: string | null;
  revokedAt: string | null;
}

export interface OwnProfile extends FullProfile {
  views: number;

  videoConsent: VideoConsentView;

  videoModeration: VideoModerationView;
}

export function initialsOf(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function toCard(row: ProfileRow, name: string, skills: Skill[]): ProfileCard {
  return {
    id: row.id,
    name,
    initials: initialsOf(name),
    title: row.title,
    sector: row.sector,
    city: row.city,
    skills,
    certified: row.certifiedAt !== null,
    score: row.score,
  };
}

function toFull(
  row: ProfileRow,
  name: string,
  skills: Skill[],
  birthDate: string | null,
  viewer: ProfileViewer,
): FullProfile {

  const privileged = viewer === "owner" || viewer === "admin";
  const hideVideo = !privileged && (isMinor(birthDate) || row.videoStatus !== "approved");

  return {
    ...toCard(row, name, skills),
    bio: row.bio,
    videoUrl: hideVideo ? null : row.videoUrl,
    status: row.status,
    contactCount: row.contactCount,
    certifiedAt: row.certifiedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function skillsByProfile(ids: string[]): Promise<Map<string, Skill[]>> {
  const out = new Map<string, Skill[]>();
  if (ids.length === 0) return out;

  const rows = await db
    .select()
    .from(profileSkill)
    .where(inArray(profileSkill.profileId, ids));

  for (const row of rows) {
    const list = out.get(row.profileId) ?? [];
    list.push(row.skill);
    out.set(row.profileId, list);
  }
  for (const list of out.values()) list.sort((a, b) => a.localeCompare(b, "fr"));
  return out;
}

export type CatalogViewer = "public" | "recruiter" | "admin";

export type ProfileViewer = CatalogViewer | "owner";

export type SessionLike = { user: { id: string; role?: string | null } };

const OWNER_OF = (userId: string): SessionLike => ({ user: { id: userId, role: "candidate" } });

export function viewerOf(
  session: SessionLike | null | undefined,
  ownerId?: string,
): ProfileViewer {
  if (!session) return "public";
  if (session.user.role === "admin") return "admin";
  if (ownerId && session.user.id === ownerId) return "owner";
  if (session.user.role === "recruiter") return "recruiter";
  return "public";
}

export function catalogViewerOf(session: SessionLike | null | undefined): CatalogViewer {
  const viewer = viewerOf(session);
  return viewer === "owner" ? "public" : viewer;
}

export interface CatalogFilters {
  q?: string;
  sector?: Sector;
  city?: City;
  certified?: boolean;
  skills?: Skill[];
  page: number;
  pageSize: number;

  viewer?: CatalogViewer;
}

export interface CatalogResult {
  items: ProfileCard[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function searchCatalog(filters: CatalogFilters): Promise<CatalogResult> {
  const conditions = [eq(profile.status, "published")];

  if ((filters.viewer ?? "public") === "public") {
    conditions.push(
      sql`(${user.birthDate} IS NULL OR ${user.birthDate} <= date('now', '-${sql.raw(String(MAJORITY_AGE))} years'))`,
    );
  }

  if (filters.sector) conditions.push(eq(profile.sector, filters.sector));
  if (filters.city) conditions.push(eq(profile.city, filters.city));
  if (filters.certified) conditions.push(isNotNull(profile.certifiedAt));

  if (filters.q) {
    const needle = `%${filters.q.toLowerCase()}%`;

    const matchesSkill = sql`EXISTS (
      SELECT 1 FROM ${profileSkill}
      WHERE ${profileSkill.profileId} = ${profile.id}
        AND lower(${profileSkill.skill}) LIKE ${needle}
    )`;
    conditions.push(
      or(
        like(sql`lower(${user.name})`, needle),
        like(sql`lower(${profile.title})`, needle),
        like(sql`lower(${profile.sector})`, needle),
        like(sql`lower(${profile.city})`, needle),
        matchesSkill,
      )!,
    );
  }

  if (filters.skills?.length) {

    const wanted = filters.skills;
    const owning = db
      .select({ id: profileSkill.profileId })
      .from(profileSkill)
      .where(inArray(profileSkill.skill, wanted))
      .groupBy(profileSkill.profileId)
      .having(sql`count(distinct ${profileSkill.skill}) = ${wanted.length}`);
    conditions.push(inArray(profile.id, owning));
  }

  const where = and(...conditions);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(profile)
    .innerJoin(user, eq(user.id, profile.userId))
    .where(where);

  const pageSize = filters.pageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(filters.page, totalPages);

  const rows = await db
    .select({ profile, name: user.name })
    .from(profile)
    .innerJoin(user, eq(user.id, profile.userId))
    .where(where)
    .orderBy(desc(profile.certifiedAt), desc(profile.score), desc(profile.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const skills = await skillsByProfile(rows.map((row) => row.profile.id));

  return {
    items: rows.map((row) => toCard(row.profile, row.name, skills.get(row.profile.id) ?? [])),
    meta: { page, pageSize, total, totalPages },
  };
}

async function findOne(
  where: ReturnType<typeof eq>,
  session?: SessionLike,
): Promise<OwnProfile | null> {
  const [row] = await db
    .select({ profile, name: user.name, birthDate: user.birthDate })
    .from(profile)
    .innerJoin(user, eq(user.id, profile.userId))
    .where(where)
    .limit(1);

  if (!row) return null;

  const viewer = viewerOf(session, row.profile.userId);
  const skills = await skillsByProfile([row.profile.id]);

  const decidedBy = row.profile.videoReviewedBy
    ? ((
        await db
          .select({ name: user.name })
          .from(user)
          .where(eq(user.id, row.profile.videoReviewedBy))
          .limit(1)
      )[0]?.name ?? null)
    : null;

  return {
    ...toFull(row.profile, row.name, skills.get(row.profile.id) ?? [], row.birthDate, viewer),
    views: row.profile.views,
    videoConsent: {
      granted: row.profile.videoConsentGranted,
      grantedAt: row.profile.videoConsentAt?.toISOString() ?? null,
      version: row.profile.videoConsentVersion,
      revokedAt: row.profile.videoConsentRevokedAt?.toISOString() ?? null,
    },
    videoModeration: {
      status: row.profile.videoStatus,
      reason: row.profile.videoReviewReason,
      decidedBy,
      decidedAt: row.profile.videoReviewedAt?.toISOString() ?? null,
    },
  };
}

export async function findProfileById(
  id: string,
  session?: SessionLike,
): Promise<FullProfile | null> {
  const found = await findOne(eq(profile.id, id), session);
  if (!found) return null;
  const { views: _views, videoConsent: _consent, videoModeration: _moderation, ...pub } = found;
  return pub;
}

export function findProfileByUserId(userId: string, session?: SessionLike): Promise<OwnProfile | null> {
  return findOne(eq(profile.userId, userId), session ?? OWNER_OF(userId));
}

export async function recordProfileView(id: string): Promise<void> {
  await db
    .update(profile)
    .set({ views: sql`${profile.views} + 1` })
    .where(eq(profile.id, id));
}

export async function replaceSkills(profileId: string, skills: Skill[]): Promise<void> {
  await db.delete(profileSkill).where(eq(profileSkill.profileId, profileId));
  if (skills.length === 0) return;
  await db
    .insert(profileSkill)
    .values([...new Set(skills)].map((skill) => ({ profileId, skill })));
}
