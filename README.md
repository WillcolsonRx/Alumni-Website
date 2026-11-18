# NIPER-Raebareli Alumni Association

The site includes an alumni application form, private status lookup, and the association’s hosted Octopod donation form.

## Development

Requires Node.js 24, as used during cloud development.

```sh
npm ci
npm run dev
npm run lint
npm run build
```

The homepage uses the shadcn/ui button registry component. The institute assets are stored locally. The [institute’s off-campus access page](https://idp.niperrbl.ac.in/) displays both source files.

- [Institute emblem](https://idp.niperrbl.ac.in/public/assets/images/logo.png), used in the header, footer and favicon.
- [Institute entrance photograph](https://idp.niperrbl.ac.in/public/assets/images/slides/img1.jpg), shown at a modest size because the source is 275 × 183.
- The orbital illustration is original CSS 3D artwork. Pointer tilt and entrance animation respect reduced-motion settings.

The supplied Octopod collection is for donations. Paid membership requires an approved fee, billing interval and a separate checkout. Member accounts and the private directory are planned application phases.

## Membership applications

Run with Node.js 24 on a machine with writable persistent disk. Applications are
stored in `.data/applications.sqlite` by default. Set `ALUMNI_DB_PATH` to an
absolute path on the chosen private volume. Keep this database out of version
control and restrict filesystem access to authorized staff.

On the same machine, with the same database path, authorized staff can list and
review applications after checking the association’s records.

```sh
node scripts/review-applications.mjs list
node scripts/review-applications.mjs review <reference> verified
node scripts/review-applications.mjs review <reference> declined
```

Applicants can check the result using their private reference. An application
does not create an account. Public deployment requires a managed database,
staff authentication, and mailbox verification. The local SQLite backend is
disabled on Vercel because its runtime filesystem cannot retain applications.
