import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import {
  CITIES,
  CONTACT_STATUSES,
  PROFILE_STATUSES,
  SECTORS,
  SKILLS,
  USER_ROLES,
  VIDEO_STATUSES,
  mutable,
} from "@/lib/vocabulary";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),

  role: text("role", { enum: mutable(USER_ROLES) })
    .notNull()
    .default("candidate"),

  birthDate: text("birth_date"),

  lastSeenAt: integer("last_seen_at", { mode: "timestamp" }),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),

  issuer: text("issuer").notNull().default(""),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),

  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const profile = sqliteTable("profile", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),

  title: text("title").notNull().default(""),
  sector: text("sector", { enum: mutable(SECTORS) }).notNull(),
  city: text("city", { enum: mutable(CITIES) }).notNull(),
  bio: text("bio").notNull().default(""),

  videoUrl: text("video_url"),

  videoConsentGranted: integer("video_consent_granted", { mode: "boolean" })
    .notNull()
    .default(false),
  videoConsentAt: integer("video_consent_at", { mode: "timestamp" }),
  videoConsentVersion: text("video_consent_version"),
  videoConsentRevokedAt: integer("video_consent_revoked_at", { mode: "timestamp" }),

  videoStatus: text("video_status", { enum: mutable(VIDEO_STATUSES) })
    .notNull()
    .default("pending"),
  videoReviewReason: text("video_review_reason"),

  videoReviewedBy: text("video_reviewed_by").references(() => user.id, { onDelete: "set null" }),
  videoReviewedAt: integer("video_reviewed_at", { mode: "timestamp" }),

  status: text("status", { enum: mutable(PROFILE_STATUSES) })
    .notNull()
    .default("pending"),

  score: integer("score"),
  certifiedAt: integer("certified_at", { mode: "timestamp" }),

  views: integer("views").notNull().default(0),
  contactCount: integer("contact_count").notNull().default(0),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const profileSkill = sqliteTable(
  "profile_skill",
  {
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    skill: text("skill", { enum: mutable(SKILLS) }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.profileId, table.skill] })],
);

export const company = sqliteTable("company", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),

  name: text("name").notNull(),

  siren: text("siren").notNull().unique(),

  position: text("position").notNull(),

  address: text("address").notNull(),
  postalCode: text("postal_code").notNull(),
  city: text("city").notNull(),

  sector: text("sector", { enum: mutable(SECTORS) }).notNull(),

  phone: text("phone"),
  website: text("website"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * @deprecated Le questionnaire est desormais versionne dans
 * `certification/questions.vN.json`. Ces deux tables ne sont plus lues ni
 * ecrites par l'application ; elles sont conservees pour ne pas detruire
 * l'historique des installations existantes.
 */
export const question = sqliteTable("question", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),

  weight: integer("weight").notNull().default(2),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const questionOption = sqliteTable("question_option", {
  id: text("id").primaryKey(),
  questionId: text("question_id")
    .notNull()
    .references(() => question.id, { onDelete: "cascade" }),
  label: text("label").notNull(),

  value: integer("value").notNull(),
  position: integer("position").notNull().default(0),
});

export const certificationAttempt = sqliteTable("certification_attempt", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["in_progress", "submitted"] })
    .notNull()
    .default("in_progress"),

  // Version du questionnaire sous laquelle la tentative a ete ouverte.
  // Figee a la creation : une tentative v1 reste v1 apres le passage a v2.
  questionnaireVersion: integer("questionnaire_version").notNull(),

  score: integer("score"),
  passed: integer("passed", { mode: "boolean" }),
  submittedAt: integer("submitted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const certificationAnswer = sqliteTable(
  "certification_answer",
  {
    attemptId: text("attempt_id")
      .notNull()
      .references(() => certificationAttempt.id, { onDelete: "cascade" }),
    // Identifiant de question issu de certification/questions.vN.json.
    // Pas de cle etrangere : le questionnaire n'est plus en base, et les
    // reponses d'une tentative doivent survivre au passage a une version
    // ulterieure qui ne contiendrait plus cette question.
    questionId: text("question_id").notNull(),
    value: integer("value").notNull(),
  },
  (table) => [primaryKey({ columns: [table.attemptId, table.questionId] })],
);

export const favorite = sqliteTable(
  "favorite",
  {
    recruiterId: text("recruiter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [primaryKey({ columns: [table.recruiterId, table.profileId] })],
);

export const contact = sqliteTable(
  "contact",
  {
    id: text("id").primaryKey(),
    recruiterId: text("recruiter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    status: text("status", { enum: mutable(CONTACT_STATUSES) })
      .notNull()
      .default("À qualifier"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [unique("contact_recruiter_profile").on(table.recruiterId, table.profileId)],
);

export const notification = sqliteTable("notification", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["contact", "moderation", "certification"] }).notNull(),
  text: text("text").notNull(),
  readAt: integer("read_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const setting = sqliteTable("setting", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
