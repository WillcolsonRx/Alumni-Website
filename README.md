# NIPER-Raebareli Alumni Association

The site accepts alumni registrations after an applicant transfers exactly ₹6,000 to the association and uploads a payment screenshot. The Worker records the registration in D1 and the screenshot in private R2. Applicants can check their status using the private reference shown after submission.

## Local development

Use Node.js 24.

```sh
npm ci
npm run lint
npm run build
npx wrangler@4 d1 migrations apply REGISTRATIONS --local
npx wrangler@4 dev --local
```

Rebuild after changing the frontend. Wrangler serves the exported website and handles the registration API on the same origin.

## Cloudflare deployment

`wrangler.jsonc` selects the association’s Cloudflare account. Bind `CLOUDFLARE_API_TOKEN` in the deployment environment. The token needs D1 Edit, Workers R2 Storage Edit, and Workers Scripts Edit for that account.

```sh
npx wrangler@4 d1 create niper-alumni-registrations
npx wrangler@4 r2 bucket create niper-alumni-payment-screenshots
```

Create each resource only if it is absent. Set `database_id` in `wrangler.jsonc` to the real D1 UUID. In R2, leave Public Development URL and custom domains disabled. Configure a Workers subdomain for the account if one has not already been configured.

```sh
npm run build
npx wrangler@4 d1 migrations apply REGISTRATIONS --remote
npx wrangler@4 deploy
```

Verify the registration page and status endpoint on the deployed origin before routing the public site to this Worker. The legacy SQLite review script can still read any existing local applications using their original database path. Those applications have no payment proof and are outside the new registration flow.

## Staff payment review

Use an authorized Cloudflare identity. List pending registrations, then open each screenshot by its object key in the private R2 dashboard. Check the transaction reference and exact ₹6,000 credit in the association’s bank records before marking the registration verified. If the payment has not been confirmed and the review is still open, leave the registration pending.

```sh
node scripts/review-registrations.mjs list
node scripts/review-registrations.mjs review <reference> verified
node scripts/review-registrations.mjs review <reference> declined
```

Review commands change only pending registrations and store the review time. Keep the command output and screenshots within authorized staff access.

## Vercel frontend

Deploy this repository on Vercel using the settings in `vercel.json`. The static
export serves the site and rewrites the two registration endpoints to the
Cloudflare Worker. Keep the Cloudflare API token in the Worker deployment
environment.

Once Vercel assigns the production URL, set `VERCEL_ORIGIN` under the top-level
`vars` in `wrangler.jsonc` to its exact HTTPS origin, without a trailing slash,
then redeploy the Worker. Verify status lookup from the Vercel production
domain. Use the Cloudflare URL for registration until that check passes.

## Registration receipt email

The Worker uses [Resend](https://resend.com/docs/dashboard/domains/introduction)
to send a receipt after it saves a new registration. The receipt includes the
private status reference and explains that staff payment verification is pending.

Verify a sending domain in Resend and create a sending API key. Set the following
Worker secrets using the Cloudflare dashboard or Wrangler:

```sh
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put REGISTRATION_EMAIL_FROM
```

For the sender, enter an address on the verified domain, optionally in the format
`NIPER Raebareli Alumni Association <registrations@example.org>`. Both settings
are required to enable email. The Worker saves registrations even when email is
disabled or the provider rejects a send. Delivery failures appear in Worker
logs and the email provider dashboard.
