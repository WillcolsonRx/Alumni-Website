import { dashboard } from "./view.mjs";

const referencePattern = /^[a-f0-9]{32}$/;
const statuses = ["pending", "verified", "declined"];
const pageSize = 25;
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
};

function response(body, status = 200, extra = {}) {
  return new Response(body, { status, headers: { ...headers, ...extra } });
}

async function authenticated(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const encoder = new TextEncoder();
  const expected = "Basic " + btoa("alumni-admin:" + env.ADMIN_PASSWORD);
  const [supplied, required] = await Promise.all(
    [request.headers.get("Authorization") ?? "", expected].map(
      (value) => crypto.subtle.digest("SHA-256", encoder.encode(value)),
    ),
  );
  return crypto.subtle.timingSafeEqual(supplied, required);
}

export default {
  async fetch(request, env) {
    if (!await authenticated(request, env)) {
      return response("Admin credentials required.", 401, {
        "WWW-Authenticate": 'Basic realm="NIPER Alumni Staff", charset="UTF-8"',
      });
    }

    const url = new URL(request.url);
    const db = env.REGISTRATIONS.withSession("first-primary");
    try {
      const proof = url.pathname.match(/^\/proof\/([a-f0-9]{32})$/);
      if (request.method === "GET" && proof) {
        const row = await db.prepare("SELECT screenshot_key FROM registrations WHERE reference = ?")
          .bind(proof[1]).first();
        if (!row) return response("Screenshot unavailable.", 404);
        const object = await env.SCREENSHOTS.get(row.screenshot_key);
        if (!object) return response("Screenshot unavailable.", 404);
        return response(object.body, 200, {
          "Content-Type": row.screenshot_key.endsWith(".png") ? "image/png" : "image/jpeg",
          "Content-Disposition": "inline",
        });
      }

      if (request.method === "POST" && url.pathname === "/review") {
        if (request.headers.get("Origin") !== url.origin) return response("Invalid request origin.", 403);
        const form = await request.formData();
        const reference = form.get("reference");
        const status = form.get("status");
        if (typeof reference !== "string" || !referencePattern.test(reference) ||
            !["verified", "declined"].includes(status) || form.get("confirm") !== "on") {
          return response("Invalid review decision.", 400);
        }
        const result = await db.prepare(
          "UPDATE registrations SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE reference = ? AND status = 'pending'",
        ).bind(status, reference).run();
        return response(null, 303, {
          Location: result.meta.changes === 1 ? "/?notice=saved" : "/?notice=unchanged",
        });
      }

      if (request.method !== "GET" || url.pathname !== "/") return response("Not found.", 404);
      const status = url.searchParams.get("status") ?? "";
      const query = (url.searchParams.get("q") ?? "").trim().slice(0, 120);
      const page = Math.min(1000000, Math.max(1, parseInt(url.searchParams.get("page"), 10) || 1));
      const filter = statuses.includes(status) ? status : "";
      const [counts, records] = await db.batch([
        db.prepare("SELECT status, COUNT(*) AS total FROM registrations GROUP BY status"),
        db.prepare(`SELECT reference, name, email, programme, graduation_year, transaction_reference,
                    amount_paise, status, submitted_at, reviewed_at
                    FROM registrations
                    WHERE (?1 = '' OR status = ?1) AND
                          (?2 = '' OR instr(lower(name), lower(?2)) OR instr(lower(email), lower(?2))
                                   OR instr(lower(transaction_reference), lower(?2)) OR reference = lower(?2))
                    ORDER BY submitted_at DESC, reference DESC LIMIT ?3 OFFSET ?4`)
          .bind(filter, query, pageSize + 1, (page - 1) * pageSize),
      ]);
      const rows = records.results.slice(0, pageSize);
      return response(dashboard({
        rows, counts: counts.results, filter, query, page, hasNext: records.results.length > pageSize,
        notice: url.searchParams.get("notice"),
      }), 200, { "Content-Type": "text/html; charset=utf-8" });
    } catch {
      console.error("Alumni admin request failed");
      return response("The dashboard is temporarily unavailable.", 503);
    }
  },
};
