# Feature map and operating rules

| Area | Connected implementation |
| --- | --- |
| Patient | OTP registration/login/reset, profile and consent, live doctor availability/fees/qualifications, appointment hold and billing, tokens and queue count, lab/clinic/home collection, pharmacy cart/wishlist/delivery requests, prescriptions, rehab plans, bills, paid released reports and notification status |
| Reception | Unified online/offline registration, purpose/referral, payment collection, QR reference review, daily queue and token actions, patient records, refreshments with cash/UPI receipts |
| Doctor / physio | Assigned patients, separate schedule/CRM with counts and recorded collections, signed encounters, prescriptions with stock visibility, lab orders, referrals, rehab sessions, fee editing only when admin enables it |
| Laboratory | Test/order workflow, collection windows and capacity, inward/outward partner labs and partner prices, sample handover ledger, private partner report attachments, independent review, payment-gated release |
| Pharmacy / inventory | Bill-backed stock receipts, quantity, batch, purchase/selling price and expiry, supplier balances/payments, expiry and low-stock alerts, FEFO dispensing, prescription review, order tracking, referring-person notes and separate doctor-buyer discount tracking |
| Owner / accounts | Actual collections by service/day/doctor, receivables, supplier balances, stock at cost, expenses, cash movement, doctor buyers, catalogs/users/fees/schedules, UPI/queue configuration, partner setup, notifications and audit/CSV exports |
| Shared interface | SVG logo, responsive navigation, sticky headers, dark mode, loading/empty/error/success states, confirmation dialogs, password visibility, copy controls, print styles, skip links, search, back-to-top and scroll progress; cookie choice and optional UTM capture on patient site |

The patient home has 15 sections, including five exploded scroll illustrations using the provided medical image assets. Doctor/test/medicine/service-program cards are populated from the API. No invented team members, stock, activity or testimonials are shown. About text is a neutral editable starting description, not a claim about unprovided qualifications or clinic history.

## Queue and appointment semantics

An appointment reserves an administrator-created slot for 30 minutes pending payment. Reception uses the same slot and invoice service as online patients. Full payment issues one global clinic token for the **visit's IST date**, shared by consultation, physio and lab; the next date begins at 1. Day + token number is unique. Numbers are never reused after cancellation, so gaps are expected. A future visit can already have its own future-day number; the queue is ordered by scheduled time, then number. Existing bills retain their fee snapshot when a doctor fee changes.

Reminders use the patient's actual doctor/service queue. Five patients ahead with a five-minute visit estimate produces approximately 25 minutes; different durations/schedules produce different estimates. The worker sends one near-turn reminder per token, plus token-issued and called updates. It does not promise that a global token difference equals waiting time. Cash/UPI staff approval and verified provider captures are the only payment confirmation paths. Free invoices can issue tokens immediately because nothing is due.

Expired or patient-cancelled unpaid visits are voided. Cancellations with a received payment create a refund-review alert; staff must reconcile the refund. A full recorded refund closes the cancelled bill. Rescheduling a paid visit is an explicit reception cancellation/refund and new booking, not a silent change to an existing token or price.

## Accounting and inventory semantics

All money is stored as integer paise. Collections and refunds use the date money was recorded, while doctor schedule counts use visit date; these totals can legitimately differ. Cash movement deducts recorded supplier payments and expenses and is **not accounting profit**. Purchase cost valuation and outstanding liabilities are shown separately. Tax/discount configuration and invoice legal content must be reviewed by the clinic's accountant.

Stock is accepted only against a supplier document and explicit batch data. Sale price follows the allocated batch; the public catalog price is an estimate until pharmacist acceptance. Stock is allocated when an online order is accepted. A pharmacy invoice refund does not automatically restock medicine: returned medicines require a controlled clinic-approved inventory procedure. Outward partner test costs can be recorded as an expense; this edition does not implement a separate partner settlement ledger or partner login portal.

There are 81 alert definitions. Operational events emit relevant alerts; the catalog also includes definitions for future integrations. Expiry alerts are generated daily from 30 days before expiry, with 7-day, 1-day and expired severity stages. Staff and owner role audiences see them in the alert center.

## Release scope

This is a source implementation with automated local checks. The zip contains no working production credentials or public deployment. WhatsApp messages and OTP require Meta configuration. Optional Razorpay checkout requires its account and verified webhooks. No production patient data or live messages were used in testing. Native mobile apps, insurer claims, automated tax filing, partner self-service and SMS/email delivery are outside this edition.
