export async function register() {

  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const { db } = await import("./db");

  try {
    migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[instrumentation] migrations Drizzle appliquees");
  } catch (error) {
    console.error("[instrumentation] echec des migrations :", error);

    throw error;
  }
}
