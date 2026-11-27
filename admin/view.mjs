const labels = { pending: "Pending", verified: "Verified", declined: "Declined" };
const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => entities[character]);
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

function showDate(value) {
  return date.format(new Date(value.replace(" ", "T") + "Z"));
}

function registration(row) {
  const reference = escape(row.reference);
  return `<tr>
    <td><strong>${escape(row.name)}</strong><small>${escape(row.email)}</small>
      ${row.phone ? `<small>${escape(row.phone)}</small>` : ""}
      ${row.city || row.country ? `<small>${escape([row.city, row.country].filter(Boolean).join(", "))}</small>` : ""}</td>
    <td>${escape(row.programme)}<small>Class of ${escape(row.graduation_year)}</small></td>
    <td><strong>${currency.format(row.amount_paise / 100)}</strong><small>UTR ${escape(row.transaction_reference)}</small>
      <a href="/proof/${reference}" target="_blank" rel="noopener noreferrer">Open screenshot</a></td>
    <td><span class="badge ${escape(row.status)}">${labels[row.status]}</span>
      <small>Received ${showDate(row.submitted_at)} IST</small>
      ${row.reviewed_at ? `<small>Reviewed ${showDate(row.reviewed_at)} IST</small>` : ""}</td>
    <td><details><summary>${row.status === "pending" ? "Review" : "Details"}</summary>
      ${row.employer ? `<small>Employer or organization</small>${escape(row.employer)}` : ""}
      ${row.job_title ? `<small>Job title or role</small>${escape(row.job_title)}` : ""}
      ${row.industry ? `<small>Industry or sector</small>${escape(row.industry)}` : ""}
      ${row.linkedin_url ? `<small>LinkedIn profile</small>${escape(row.linkedin_url)}` : ""}
      <small>Registration reference</small><code>${reference}</code>
      ${row.status === "pending" ? `<form method="post" action="/review" class="review">
        <input type="hidden" name="reference" value="${reference}">
        <label><input type="checkbox" name="confirm" required> I checked the screenshot and bank records.</label>
        <div class="actions">
          <button name="status" value="verified">Verify payment</button>
          <button name="status" value="declined" class="secondary">Decline</button>
        </div>
      </form>` : ""}</details></td>
  </tr>`;
}

export function dashboard({ rows, counts, filter, query, page, hasNext, notice }) {
  const totals = new Map(counts.map(({ status, total }) => [status, total]));
  const total = counts.reduce((sum, entry) => sum + entry.total, 0);
  const link = (status, nextPage = 1) => "/?" + escape(new URLSearchParams({ status, q: query, page: nextPage }));
  const stats = [["", "All registrations", total], ...Object.entries(labels).map(
    ([status, label]) => [status, label, totals.get(status) ?? 0],
  )];
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>NIPER Alumni | Staff dashboard</title>
<style>
:root{color-scheme:light;--ink:#172841;--muted:#52627b;--line:#dce5ef;--blue:#124bb1;--soft:#f3f7fc}
*{box-sizing:border-box}body{margin:0;background:var(--soft);color:var(--ink);font:15px/1.55 system-ui,sans-serif}
header{background:#10294e;color:#fff;padding:20px max(22px,calc((100% - 1250px)/2));font-weight:650}
main{max-width:1294px;margin:auto;padding:32px 22px}h1{font-size:clamp(29px,5vw,43px);letter-spacing:-.04em;margin:0 0 4px}p{margin:0 0 22px;color:var(--muted)}
a{color:var(--blue);text-underline-offset:3px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:0 0 22px}
.stat,.panel{background:#fff;border:1px solid var(--line);border-radius:14px}.stat{display:block;padding:14px 18px;text-decoration:none;color:var(--muted)}
.stat[aria-current]{border-color:var(--blue);box-shadow:inset 0 0 0 1px var(--blue)}.stat strong{font-size:28px;display:block;color:var(--ink)}
.toolbar,.pagination{padding:16px;display:flex;align-items:end;gap:10px;flex-wrap:wrap}.toolbar label{display:grid;gap:4px;flex:1;min-width:min(100%,250px)}
input[type=search],button{font:inherit;border-radius:8px;padding:8px 12px}input[type=search]{border:1px solid #a7b7cd;width:100%}
button{color:white;background:var(--blue);border:1px solid var(--blue);cursor:pointer}.secondary{color:var(--blue);background:#fff}
.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;text-align:left;min-width:840px}th,td{padding:13px 16px;border-top:1px solid var(--line);vertical-align:top;overflow-wrap:anywhere}
th{background:#edf3fa;color:#344c6d}small{display:block;color:var(--muted);margin:3px 0}code{display:block;overflow-wrap:anywhere;max-width:240px}
.badge{display:inline-block;border-radius:999px;padding:2px 9px;font-size:13px;font-weight:650}.pending{background:#fff1c8;color:#6d4800}.verified{background:#dcf6e8;color:#115d3d}.declined{background:#ffe6e5;color:#842a24}
summary{cursor:pointer;color:var(--blue);font-weight:650}.review{margin-top:10px;max-width:230px}.actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.notice{padding:12px 16px;border-radius:8px;background:#e2efff;color:var(--ink)}.pagination{justify-content:space-between;align-items:center}
@media(max-width:620px){.stats{grid-template-columns:repeat(2,1fr)}main{padding:24px 16px}}
</style></head>
<body><header>NIPER Raebareli Alumni Association · Staff portal</header>
<main><h1>Alumni registrations</h1><p>Track submissions and review payments against the association’s bank records.</p>
${notice === "saved" ? '<p class="notice" role="status">Review saved. The applicant can see the updated status.</p>' : ""}
${notice === "unchanged" ? '<p class="notice" role="status">This registration is no longer pending or could not be found.</p>' : ""}
<nav class="stats" aria-label="Filter by status">${stats.map(([status, label, count]) =>
  `<a class="stat" href="${link(status)}"${filter === status ? ' aria-current="page"' : ""}>${label}<strong>${count}</strong></a>`).join("")}</nav>
<section class="panel" aria-label="Registration records">
<form class="toolbar" method="get" action="/"><input type="hidden" name="status" value="${escape(filter)}">
<label>Search registrations<input type="search" name="q" value="${escape(query)}" maxlength="120" placeholder="Name, email, UTR or registration reference"></label>
<button>Search</button>${query ? `<a href="/?status=${escape(filter)}">Clear search</a>` : ""}</form>
<div class="table-wrap" tabindex="0" role="region" aria-label="Scrollable registration table"><table><thead><tr>
<th scope="col">Alumnus</th><th scope="col">Programme</th><th scope="col">Payment</th><th scope="col">Status</th><th scope="col">Actions</th>
</tr></thead><tbody>${rows.map(registration).join("") || '<tr><td colspan="5">No registrations match these filters.</td></tr>'}</tbody></table></div>
<nav class="pagination" aria-label="Registration pages">${page > 1 ? `<a href="${link(filter, page - 1)}">Previous page</a>` : "<span></span>"}
<span>Page ${page}</span>${hasNext ? `<a href="${link(filter, page + 1)}">Next page</a>` : "<span></span>"}</nav>
</section></main></body></html>`;
}
