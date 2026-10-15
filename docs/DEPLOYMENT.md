# Deployment and connection guide

## 1. Database on DigitalOcean

Create a PostgreSQL cluster and a clinic database. Restrict trusted sources to the application and authorized administration IPs. Download the cluster CA certificate. In DBeaver create a PostgreSQL connection using the supplied host, port, database and user; enable SSL with certificate and hostname verification. Do not disable certificate validation.

For a **new empty database**, run the separate database package's `create_tables.sql` as a complete SQL script. It creates the tables, indexes, views, default clinic configuration and 81 alert definitions. It creates no operational records. Alternatively, set the backend environment and run `npm run migrate`; use one installation route, not both.

For an existing database, take a restorable backup first. Review migration history and run `npm run migrate`; it skips applied versions. Migration 005 normalizes ten-digit Indian patient phone numbers with country code 91. A duplicate patient identity causes a rollback; reconcile duplicates with the clinic before retrying. Never automatically merge medical histories.

The runtime connection needs DML access to the clinic tables and sequences, not permission to create/drop schema. A grants script is supplied for a separately created `mahaveer_app` role. Use a migration-owner connection for migrations and a restricted runtime connection for the API and worker.

## 2. API service

Deploy the backend with Node.js 24. Install using `npm ci --omit=dev`. Use `npm start` for the web service and `/api/health` as its health check. Do not expose the source folder as static web content. The Dockerfile runs the application as a non-root user.

Required production environment, configured as private service secrets:

| Setting | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your PostgreSQL connection URL; URL-encode special characters in the password |
| `DB_SSL` | `true` |
| `DB_CA_PATH` | Absolute path to the mounted DigitalOcean CA certificate |
| `AUTH_SECRET` | A unique random secret, at least 48 characters; same on all API instances |
| `APP_ORIGINS` | Exact comma-separated HTTPS patient, staff and admin origins; no trailing slash or wildcard |
| `PATIENT_URL` | The patient origin, exactly matching one entry in `APP_ORIGINS` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `lax` for the recommended shared parent domain deployment |
| `TRUST_PROXY` | `true` only when exactly one trusted proxy fronts the API and direct access is prevented |
| `PORT` | Service port, normally `4000` |

Generate the authentication secret locally and put the result in the service secret manager:

```sh
node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('hex'))"
```

Recommended host layout: patient on the primary domain, staff/admin/API on separate subdomains of that same parent domain. All must use HTTPS. Host-only HttpOnly session cookies belong to the API; access is still authorized by the server on every request. Unrelated frontend/API domains can require `SameSite=None` and can be affected by browser third-party cookie restrictions; use the shared parent domain layout.

Run `npm run migrate` as a controlled release command. Run `npm run bootstrap` once with your owner values, then remove the owner password environment variables. Add staff through the owner portal. Staff change temporary passwords at first sign-in. Link doctor/physio user accounts to doctor records before adding schedules.

## 3. Notification and maintenance worker

Deploy a second backend process with the same database and integration environment, command `npm run worker`. It expires unpaid appointment holds, computes queue reminders, creates stock/expiry/supplier alerts and delivers queued WhatsApp messages every 30 seconds. Alerts alone do not send messages to staff WhatsApp numbers: staff and owner see operational alerts in their portals. Patient WhatsApp delivery uses explicit consent and configured templates.

Multiple workers claim notification rows using database locks. Delivery has retry/backoff and status tracking; ambiguous provider timeouts can still produce duplicate messages, so operational monitoring is required. Do not describe notifications as exactly-once delivery.

## 4. Three website builds

In each website set `VITE_API_URL` to the public API URL including `/api`, then run `npm ci && npm run build`. Deploy **only `dist/`**. The included dist builds use relative `/api`; rebuild for a separate API subdomain. Vite values are public build configuration. Never place database URLs, auth secrets, WhatsApp tokens or Razorpay secrets in a `VITE_` variable.

The build script creates host header configuration from the API origin: `_headers` for compatible static hosts, `vercel.json`, and `nginx.conf`. On a host that does not honor these files, copy the generated security header values into that host's settings. The nginx image proxies `/api` to a service named `backend:4000`; adapt that upstream for your network. Its configuration is copied from the completed build so the CSP matches your chosen API origin. Use TLS at the ingress.

The patient CSP permits Razorpay checkout only where relevant. Dynamic catalog images require HTTPS; host your real doctor, test and product images in a controlled image bucket/CDN and enter their public URLs in the owner catalog. Clinical uploads stay private in PostgreSQL and require authenticated access.

## 5. Payments

**Clinic UPI / local QR:** set UPI ID and payee name in Admin → Operations. Each bill can produce a QR with the exact balance and invoice reference. A patient's submitted UTR remains pending. Reception must check the actual bank settlement before approving it. Approval records the payment and issues the token only when the balance reaches zero. A screenshot or QR scan is never payment confirmation. Cash receipts are confirmed by authorized staff after cash is received.

**Optional Razorpay:** configure key ID, secret and separate webhook secret on the backend. Register the public HTTPS endpoint `/api/webhooks/razorpay` for `payment.captured`. The raw body signature, stored provider order, amount and INR currency are verified before recording a payment. The checkout success callback is informational; it does not issue tokens. Test valid and duplicate events in the provider sandbox before live enablement. Late captures after an appointment expires require manual reconciliation/refund through the provider and clinic ledger; they do not revive a cancelled slot. Recording a refund in the clinic ledger does not transfer money: perform the cash/bank/provider refund first.

## 6. Operational acceptance

Verify a real empty PostgreSQL deployment with two simultaneous reception/online bookings and payments; check that one slot cannot be double-booked and that day + token is unique. Complete a visit, test five-patients-ahead reminders, verify OTP on your approved test number, release a paid lab report using a different reviewer, receive a supplier bill/batch, make a pharmacy sale, and reconcile daily cash/UPI totals. Check mobile navigation, keyboard access, print/PDF and all three role portals in real browsers. Configure database backups, restore checks, logs and uptime alerts before public opening.

Provider references: [DigitalOcean PostgreSQL connections](https://docs.digitalocean.com/products/databases/postgresql/how-to/connect/), [Razorpay webhook validation](https://razorpay.com/docs/webhooks/validate-test/).
