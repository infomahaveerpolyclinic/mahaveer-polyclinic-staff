# Validation record — 14 October 2026

## Executed checks

- 27 backend integration tests passed using Node's test runner, Supertest and an isolated in-memory PGlite database. Test data is created only inside the test process and is not seeded into an installed clinic database.
- All five SQL migrations executed in those tests. The public catalog begins with no operational records. The schema has 55 tables and three aggregate views.
- Production builds passed for patient, staff and admin websites using Vite 8.3.4. Build output contains no source maps. Package versions and lockfiles are supplied.
- `npm audit` returned zero known vulnerabilities for backend, patient, staff and admin dependency trees at validation time. This is a registry result for these versions, not a guarantee against undiscovered flaws or hosting-image vulnerabilities.
- The supplied logo was converted to SVG paths, rendered to a PNG for visual inspection, and installed in every portal and print view. It contains no embedded bitmap or external link.
- Release archives exclude local database data, actual environment files, private keys, dependencies and caches. Only `.env.example` is included. Static hosts must serve the built dist folder.

## Tested scenarios

1. Dynamic catalog and public/private field boundaries; 81 alert definitions.
2. Authentication, role authorization, CSRF and trusted origins.
3. Online/reception slot collision and invoice-before-token ordering.
4. Partial payment, full payment and retry idempotency.
5. Same-day token uniqueness and next-day reset.
6. Patient isolation for private routes and bills.
7. Pending UPI reference and staff-only verification.
8. Fee-change permission and existing invoice price snapshots.
9. Assigned clinician access and signed-note completion.
10. Independent lab review, full payment and hidden draft results.
11. Home collection capacity and time validation.
12. Bill-backed inventory and private file-type restrictions.
13. Supplier balances and payment replay handling.
14. Cart/wishlist/order ownership, stock allocation and delivery payment gate.
15. Daily stock-expiry/supplier alert deduplication.
16. Paid refreshments, stock decrement and walk-in receipts.
17. Server-controlled doctor buyer discount and attribution.
18. Authorized real-data analytics and receipt-date accounting.
19. No false WhatsApp delivery without credentials and consent withdrawal.
20. Forged webhook signature rejection.
21. OTP attempt tracking and consumed-code replay rejection.
22. Cancelled/expired unpaid bill voiding and paid cancellation refund review.
23. Unreleased partner attachment isolation.
24. Valid captured-payment webhook signature and duplicate replay.
25. WhatsApp OTP payload structure using a mocked fetch; no real message was sent.
26. Lab lookup by exact patient identifier.
27. Patient sign-in after a staff session and retained role isolation.

## Not yet verified

No real DigitalOcean PostgreSQL cluster, production domain, WhatsApp account or payment account was supplied. Tests use a PostgreSQL-compatible embedded engine; they do not replace real multi-process PostgreSQL contention/load tests, backup/restore testing, actual provider delivery or settlement reconciliation.

Browser visual and interaction QA was not run: the Sites workflow for this managed environment requires the designated browser-control capability, which was unavailable. Production compilation and the SVG render were checked; responsive layout, print/PDF, accessibility and complete click-through flows still need real browser acceptance on desktop and mobile. No public deployment has been made.

This source delivery is not a penetration-test certificate, legal/tax validation or a claim that a website cannot be hacked. Follow the deployment guide, complete the outstanding acceptance checks and maintain the application.
