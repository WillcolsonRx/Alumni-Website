import { openApplications } from "../lib/applications.mjs";

const [command, reference, status] = process.argv.slice(2);
if (command !== "list" && !(command === "review" && /^[a-f0-9]{32}$/.test(reference ?? "") &&
    ["verified", "declined"].includes(status))) {
  console.error("Usage: node scripts/review-applications.mjs list | review <reference> <verified|declined>");
  process.exit(1);
}

const db = openApplications();
try {
  if (command === "list") {
    console.table(db.prepare("SELECT * FROM applications ORDER BY submitted_at DESC").all());
  } else {
    const result = db.prepare("UPDATE applications SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE reference = ? AND status = 'pending'").run(status, reference);
    if (!result.changes) {
      console.error("No pending application matches that reference.");
      process.exitCode = 1;
    }
  }
} finally {
  db.close();
}
