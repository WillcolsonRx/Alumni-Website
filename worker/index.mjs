import { FEE_RUPEES, MAX_SCREENSHOT_BYTES } from "../lib/registration.mjs";

const referencePattern = /^[a-f0-9]{32}$/;
const statuses = {
  pending: "Your registration is pending staff payment verification.",
  verified: "Staff verified your payment. Your registration is confirmed.",
  declined: "Your registration was declined. Contact the association for help.",
};

function response(message, status = 200, data = {}) {
  return Response.json({ message, ...data }, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

function field(data, key) {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function readForm(request, limit) {
  const chunks = [];
  const reader = request.body?.getReader();
  if (!reader) return null;
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  try {
    return await new Response(new Blob(chunks), {
      headers: { "Content-Type": request.headers.get("Content-Type") ?? "" },
    }).formData();
  } catch {
    return null;
  }
}

function imageType(bytes) {
  const startsWith = (signature) => signature.every((value, index) => value === bytes[index]);
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith([0xff, 0xd8, 0xff])) return "jpeg";
  return null;
}

async function sendReceipt(env, email, reference) {
  if (!env.RESEND_API_KEY || !env.REGISTRATION_EMAIL_FROM) return;

  const statusUrl = "https://niper-raebareli-alumni.niper-raebareli-alumni.workers.dev/#membership";
  try {
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `alumni-registration/${reference}`,
      },
      body: JSON.stringify({
        from: env.REGISTRATION_EMAIL_FROM,
        to: [email],
        subject: "NIPER Raebareli alumni registration received",
        text: [
          "We received your NIPER Raebareli Alumni Association registration.",
          "Your registration is pending until staff verify your ₹6,000 payment.",
          `Your private registration reference is ${reference}. Keep it for your records.`,
          `To check your status, enter the reference at ${statusUrl}`,
        ].join("\n\n"),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!result.ok) console.error("Registration receipt email rejected", result.status);
  } catch {
    console.error("Registration receipt email request failed");
  }
}

async function register(data, env, ctx) {
  const reference = field(data, "reference");
  const name = field(data, "name");
  const email = field(data, "email").toLowerCase();
  const programme = field(data, "programme");
  const year = Number(field(data, "year"));
  const transaction = field(data, "transaction").toUpperCase();
  const screenshot = data.get("screenshot");
  const phone = field(data, "phone");
  const city = field(data, "city");
  const country = field(data, "country");
  const employer = field(data, "employer");
  const jobTitle = field(data, "job_title");
  const linkedinUrl = field(data, "linkedin_url");
  const industry = field(data, "industry");

  if (!referencePattern.test(reference) || name.length < 2 || name.length > 120 ||
      email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      programme.length < 2 || programme.length > 120 || !Number.isInteger(year) ||
      year < 2008 || year > new Date().getUTCFullYear() || field(data, "consent") !== "on" ||
      !/^[A-Z0-9][A-Z0-9/-]{5,79}$/.test(transaction)) {
    return response("Check your graduation details, payment reference and consent.", 400);
  }
  if (field(data, "amount") !== String(FEE_RUPEES)) {
    return response("Registration requires a payment of exactly ₹6,000.", 400);
  }
  if (!(screenshot instanceof File) || !screenshot.size || screenshot.size > MAX_SCREENSHOT_BYTES) {
    return response("Upload your payment screenshot as PNG or JPEG, up to 5 MB.", 400);
  }
  const digits = phone.replace(/[^0-9]/g, "");
  if (!/^\+[1-9][0-9 ().-]*$/.test(phone) || phone.length > 32 ||
      digits.length < 7 || digits.length > 15) {
    return response("Enter a phone number with the international country code.", 400);
  }
  if (!city || city.length > 120 || !country || country.length > 120 ||
      !employer || employer.length > 160 || !jobTitle || jobTitle.length > 160 ||
      industry.length > 120) {
    return response("Check your location and professional details.", 400);
  }
  if (linkedinUrl && (linkedinUrl.length > 300 ||
      !/^https:\/\/(?:[a-z0-9-]+\.)?linkedin\.com\/in\/[^\s/?#]+(?:[/?#][^\s]*)?$/i.test(linkedinUrl))) {
    return response("Enter a valid LinkedIn profile URL starting with https://.", 400);
  }
  const bytes = await screenshot.arrayBuffer();
  const type = imageType(new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 8)));
  if (!type || screenshot.type !== `image/${type}`) {
    return response("Upload a PNG or JPEG payment screenshot.", 400);
  }

  const db = env.REGISTRATIONS.withSession("first-primary");
  const findExisting = () => db.prepare(
    "SELECT status FROM registrations WHERE reference = ? AND email = ? AND transaction_reference = ?",
  ).bind(reference, email, transaction).first();
  const existing = await findExisting();
  if (existing) return response(statuses[existing.status], 200, { reference });

  const key = `payments/${crypto.randomUUID()}.${type}`;
  await env.SCREENSHOTS.put(key, bytes, { httpMetadata: { contentType: `image/${type}` } });
  // Keep the object if the database outcome is unknown. A committed row may use it.
  const result = await db.prepare(`
    INSERT INTO registrations
      (reference, name, email, programme, graduation_year, amount_paise, transaction_reference, screenshot_key,
       phone, city, country, employer, job_title, linkedin_url, industry)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING
  `).bind(reference, name, email, programme, year, FEE_RUPEES * 100, transaction, key,
    phone, city, country, employer, jobTitle, linkedinUrl || null, industry || null).run();
  if (result.meta.changes === 1) {
    ctx.waitUntil(sendReceipt(env, email, reference));
    return response(statuses.pending, 201, { reference });
  }

  ctx.waitUntil(env.SCREENSHOTS.delete(key).catch(() => console.error("Screenshot cleanup failed")));
  const existingAfterInsert = await findExisting();
  if (existingAfterInsert) return response(statuses[existingAfterInsert.status], 200, { reference });
  return response("A registration already uses these details. Use your private reference or contact the association.", 409);
}

const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
      if (!["GET", "HEAD"].includes(request.method)) return response("A secure connection is required.", 403);
      url.protocol = "https:";
      return Response.redirect(url, 308);
    }
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    const registration = url.pathname === "/api/registrations";
    if (!registration && url.pathname !== "/api/registration-status") return response("Not found.", 404);
    if (request.method !== "POST") return response("Submit the form to continue.", 405);
    const origin = request.headers.get("Origin");
    if (!origin || (origin !== url.origin && origin !== env.VERCEL_ORIGIN)) {
      return response("Open the form on the association website.", 403);
    }

    try {
      const form = await readForm(request, registration ? MAX_SCREENSHOT_BYTES + 65536 : 8192);
      if (!form) return response("The form is invalid or exceeds the upload limit.", 400);
      if (registration) return await register(form, env, ctx);

      const reference = field(form, "reference").toLowerCase();
      if (!referencePattern.test(reference)) return response("Enter your 32-character private reference.", 400);
      const row = await env.REGISTRATIONS.withSession("first-primary")
        .prepare("SELECT status FROM registrations WHERE reference = ?").bind(reference).first();
      return row ? response(statuses[row.status]) : response("No registration matches that reference.", 404);
    } catch {
      console.error("Registration service operation failed");
      return response("The registration service is temporarily unavailable. Please try again.", 503);
    }
  },
};

export default worker;
