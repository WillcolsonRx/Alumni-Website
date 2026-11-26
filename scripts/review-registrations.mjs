import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const local = args[0] === "--local";
const [action, reference, decision, extra] = local ? args.slice(1) : args;
let sql;
if (action === "list" && !reference && !decision && !extra) {
  sql = `SELECT reference, name, email, programme, graduation_year, transaction_reference,
                amount_paise, screenshot_key, submitted_at
         FROM registrations WHERE status = 'pending' ORDER BY submitted_at`;
} else if (action === "review" && /^[a-f0-9]{32}$/.test(reference ?? "") &&
           ["verified", "declined"].includes(decision) && !extra) {
  sql = `UPDATE registrations SET status = '${decision}', reviewed_at = CURRENT_TIMESTAMP
         WHERE reference = '${reference}' AND status = 'pending' RETURNING reference, status, reviewed_at`;
} else {
  console.error("Usage: node scripts/review-registrations.mjs [--local] list | review <reference> <verified|declined>");
  process.exit(1);
}

const result = spawnSync("npx", ["--yes", "wrangler@4", "d1", "execute", "REGISTRATIONS",
  local ? "--local" : "--remote", "--json", "--command", sql], { encoding: "utf8" });
if (result.error || result.status !== 0) {
  console.error(result.error?.message || result.stderr.trim() || "Cloudflare command failed.");
  process.exit(1);
}

const statements = JSON.parse(result.stdout);
if (!statements.length || statements.some(({ success }) => !success)) {
  console.error("Cloudflare did not confirm the database operation.");
  process.exit(1);
}
const rows = statements.flatMap(({ results }) => results);
if (action === "review" && rows.length !== 1) {
  console.error("No pending registration matched the reference.");
  process.exit(1);
}
console.log(JSON.stringify(rows, null, 2));
