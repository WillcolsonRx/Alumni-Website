import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

export function openApplications() {
  if (process.env.VERCEL || process.env.ALUMNI_APPLICATIONS_DISABLED === "1") throw new Error("A persistent database is required on Vercel.");
  const path = resolve(/* turbopackIgnore: true */ process.env.ALUMNI_DB_PATH || ".data/applications.sqlite");
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS applications (
      reference TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      programme TEXT NOT NULL,
      graduation_year INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','declined')),
      submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TEXT
    ) STRICT;
  `);
  return db;
}

export function submitApplication({ name, email, programme, year }) {
  const db = openApplications();
  try {
    const reference = randomBytes(16).toString("hex");
    const result = db.prepare(`
      INSERT INTO applications (reference, name, email, programme, graduation_year)
      VALUES (?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING
    `).run(reference, name, email, programme, year);
    return result.changes ? reference : null;
  } finally {
    db.close();
  }
}

export function applicationStatus(reference) {
  const db = openApplications();
  try {
    return db.prepare("SELECT status FROM applications WHERE reference = ?").get(reference)?.status;
  } finally {
    db.close();
  }
}
