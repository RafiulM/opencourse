# Transactions and Payments — Provider‑Agnostic Plan

Goal: Enable users to make payments for community‑related features and platform purchases, supporting one‑off charges and subscriptions with clear entitlements and revenue sharing — using a provider‑agnostic architecture. Initial target gateway: Xendit, but the design must support multiple providers.

## Outcomes
- Users can pay to: create a community, join a community, tip/donate to community owners, purchase access to courses/materials, or subscribe (community scope or platform‑wide).
- Community owners can receive revenue (minus platform fees). Platform collects fees and may sell own subscriptions.
- Access is granted via entitlements and/or membership creation after successful payment.
- Provider‑agnostic core with pluggable gateways; initial adapter: Xendit.

## Use Cases
- Community creation fee: user pays a one‑time fee to create a community.
- Paid membership: user pays to join a community (recurring or one‑off).
- Donations/tips: user tips a community owner (one‑off, optional message).
- Course/material purchase: user buys access to a course or a specific material.
- Subscriptions: user subscribes for features (a) within a specific community or (b) platform‑wide.

## Key Concepts
- Transaction: a payment attempt (intent → success/failure), contains one or more line items.
- Product/Price: catalog objects describing what’s sold and for how much (for subscriptions too).
- Subscription: recurring billing with lifecycle events (trialing, active, past_due, canceled, unpaid).
- Entitlement: records the right to access a scope (community/course/material or platform feature) with validity window.
- Revenue share: split of gross amount between platform and beneficiary (e.g., community owner).

## Assumptions (to validate)
- Gateways: provider‑agnostic adapters. Initial: Xendit. Future: other regional/global providers.
- Currency: multi‑currency supported; store amounts in minor units (integer) to avoid rounding issues.
- Taxes: out of scope initially; leverage provider tax helpers later or manual tax for MVP.
- Refunds/disputes: supported via provider webhooks; we mirror state consistently across providers.

## Data Model (Proposed, Drizzle/Postgres)

Enums (illustrative):
- payment_provider: ['xendit','other']
- transaction_status: ['initiated','requires_action','pending','succeeded','failed','canceled','refunded','partially_refunded','disputed']
- price_interval: ['one_time','day','week','month','year']
- subscription_status: ['trialing','active','past_due','canceled','unpaid','incomplete']
- payout_status: ['pending','in_transit','paid','failed','canceled']
- scope_type: ['platform','community','course','material']
- beneficiary_type: ['platform','community','user']
- payment_method: ['card','bank_transfer','ewallet','qris','retail_outlet','paylater','direct_debit','balance']
- payment_channel: text (provider‑specific channel label; keep as text to avoid frequent enum migrations)

Tables (sketch):

1) products
- id (uuid, pk)
- name, description
- scope_type, scope_id (nullable; e.g., course‑specific price) — for discovery
- metadata (jsonb), active (bool)

2) prices
- id (uuid, pk)
- product_id (fk products)
- currency (char(3)), unit_amount (bigint, minor units)
- interval (price_interval), interval_count (int, default 1)
- trial_days (int, nullable)
- provider (payment_provider), provider_price_id (text)
- active (bool), metadata (jsonb)

3) subscriptions
- id (uuid, pk)
- user_id (fk user)
- price_id (fk prices)
- scope_type, scope_id (to apply entitlement)
- status (subscription_status)
- current_period_start (timestamptz), current_period_end (timestamptz)
- cancel_at (timestamptz, nullable), canceled_at (timestamptz, nullable)
- provider, provider_subscription_id (text), metadata (jsonb)
  
4) entitlements
- id (uuid, pk)
- user_id (fk user)
- scope_type, scope_id
- source_type ['transaction','subscription','admin_grant']
- source_id (uuid, ref to transactions/subscriptions)
- starts_at, ends_at (timestamptz, nullable)
- active (bool), metadata (jsonb)

5) transactions
- id (uuid, pk)
- user_id (payer, fk user)
- beneficiary_type, beneficiary_id (platform/community/user)
- status (transaction_status)
- currency (char(3)), amount_total (bigint), amount_subtotal (bigint)
- amount_fee_platform (bigint), amount_fee_provider (bigint), amount_net (bigint)
- provider, provider_reference_id (text)  // invoice/charge/payment id from gateway
- payment_method (payment_method), payment_channel (text)
- authorization_url (text, nullable), checkout_url (text, nullable)
- expires_at (timestamptz, nullable)
- created_at, updated_at, finalized_at (timestamptz)
- metadata (jsonb)

6) transaction_items
- id (uuid, pk)
- transaction_id (fk transactions)
- product_id (fk products)
- price_id (fk prices)
- scope_type, scope_id (what access this item grants)
- quantity (int), unit_amount (bigint), amount (bigint)
- metadata (jsonb)

7) payment_sessions (provider interaction snapshots)
- id (uuid, pk)
- transaction_id (fk transactions)
- provider (payment_provider)
- provider_session_id (text) // invoice id / token / session identifier
- status (text) // raw provider status we map into transaction_status
- payload_req (jsonb), payload_res (jsonb) // request/response snapshots (PII‑safe)
- checkout_url (text, nullable), authorization_url (text, nullable)
- qr_string (text, nullable), va_number (text, nullable), deeplink_url (text, nullable)
- expires_at (timestamptz, nullable), created_at, updated_at

8) refunds
- id (uuid, pk)
- transaction_id (fk transactions)
- amount (bigint), status ['pending','succeeded','failed']
- reason (text), provider_refund_id (text), created_at (timestamptz), metadata (jsonb)

9) payment_events (audit/webhooks)
- id (uuid, pk)
- provider, event_type (text), payload (jsonb), received_at (timestamptz)
- transaction_id (nullable fk), subscription_id (nullable fk), idempotency_key (text)

10) payout_accounts
- id (uuid, pk)
- owner_user_id (fk user) — owner/community operator
- provider, provider_account_id (text), default_currency (char(3))
- onboarding_status (text/json), created_at/updated_at

11) settlements (optional v1.1)
- id (uuid, pk)
- transaction_id (fk), beneficiary_type/id
- amount_gross (bigint), amount_platform_fee (bigint), amount_provider_fee (bigint), amount_net (bigint)
- payout_status, payout_id (nullable), created_at

Notes:
- We keep scope_type/scope_id consistently to relate items/entitlements to communities/courses/materials or platform.
- Amounts are stored as integer minor units for correctness and easy provider mapping.
- Provider‑specific surfaces (invoice URL, QR string, VA number, deeplinks) live on transactions/payment_sessions.

## Flows

One‑off purchase (e.g., course purchase)
1) Client requests checkout for course → backend creates transaction + line item(s) and a provider session/charge (invoice or payment request via adapter).
2) Return checkout fields based on method: checkout_url/authorization_url or qr_string/va_number/deeplink; status=initiated/pending.
3) Provider confirms payment via redirect or webhook → webhook updates transaction to succeeded and records fees.
4) Backend issues entitlement for (scope=course, user=user_id) and/or side‑effect (e.g., increment enrollmentCount, create enrollment row if paid gate is used).

Community creation fee
1) Create transaction (beneficiary=platform or split with future owner if applicable).
2) On success, create the community row and initial membership/role.

Paid membership (join community)
1) One‑off or recurring: use price.interval to determine.
2) On success, create `community_members` row or entitlement with scope=community.
3) On subscription cancel/expire, remove membership or mark as inactive based on policy.

Donations/tips
1) Create simple transaction with beneficiary=community (or owner user).
2) No entitlement by default unless donor perk is configured (optional entitlement).

Subscriptions
1) Provider‑managed recurring (if supported): create subscription via adapter; record provider_subscription_id.
2) Platform‑managed recurring (fallback): schedule recurring invoices and collect via the chosen method each period.
3) On activation/renewal webhooks: upsert subscription, extend/create entitlement. On cancel/failed renewal: update status; end entitlements at period end.

Refunds/Disputes
- Webhook updates refund table and adjusts entitlements (revoke or shorten) according to policy.

## Entitlement Mapping
- Community membership: either continue using `community_members` or back it with `entitlements` and sync.
- Course access: entitlement with scope=course and enrollment side‑effect.
- Material access: entitlement with scope=material.
- Platform features: entitlement with scope=platform and feature flag checks.

## Integration Points
- Webhooks: `/api/webhooks/payments/:provider` handling payment/charge/refund/subscription events.
- Checkout endpoints: `POST /api/billing/checkout` (one‑off), `POST /api/billing/subscriptions` (recurring).
- Responses return dynamic fields depending on method: `checkoutUrl`, `authorizationUrl`, `qrString`, `vaNumber`, `deeplinkUrl`, `expiresAt`.
- Admin/owner dashboards: revenue, payouts, subscriber lists.

## Indexing (per table highlights)
- transactions: (user_id), (status), (created_at DESC), (provider, provider_reference_id UNIQUE)
- transaction_items: (transaction_id), (scope_type, scope_id)
- subscriptions: (user_id,status), (scope_type,scope_id), (provider_subscription_id UNIQUE)
- entitlements: (user_id,scope_type,scope_id,ends_at) with partial index on active=true
- refunds: (transaction_id)
- payment_events: (provider,event_type,received_at)
- payout_accounts: (owner_user_id), (provider,provider_account_id UNIQUE)

## Access Control
- Only payer can read their transactions; admins can read all; community owners can read revenues where they are beneficiary.
- Entitlement checks are read‑only and cached where possible (e.g., `active AND now() BETWEEN starts_at AND COALESCE(ends_at, 'infinity')`).

## Reporting
- Basic metrics: GMV, net revenue by community, platform fees, refunds rate, ARPU, MRR (subscriptions).
- Export: CSV via async job; keep audit trail via `payment_events`.

## Security/Compliance
- Do not store card data; use provider tokens/sessions only.
- Sign and verify webhooks per provider; store idempotency keys.
- Handle 3DS/redirect flows via authorization_url where applicable.
- PCI scope minimized by using hosted/redirect or tokenized flows.

## Provider Adapters
- Adapter interface: createPayment(params) → { providerReferenceId, checkoutUrl|qrString|vaNumber|deeplinkUrl, expiresAt }, getPayment(id), refund(id, amount), createSubscription(params), cancelSubscription(id), parseWebhook(payload, headers) → { type, data }.
- Map provider statuses into transaction_status consistently.
- Xendit‑specific notes (kept generic in implementation): depending on method, you may get invoice URLs, VA numbers, QR strings, or deeplinks — store them on transaction/payment_session for the client to render.

## Migration Plan (Phased)
Phase 1 — One‑off payments + entitlements
- products, prices, transactions, transaction_items, entitlements, payment_events
Phase 2 — Subscriptions
- subscriptions; webhook handling; entitlement sync on renew/cancel
Phase 3 — Payouts/settlements
- payout_accounts, settlements; revenue share logic; owner dashboards

## API Sketch
- POST `/api/billing/checkout` → { items: [{priceId, quantity, scope}], beneficiary, method, channel? } → { transactionId, checkoutUrl|authorizationUrl|qrString|vaNumber|deeplinkUrl, expiresAt }
- POST `/api/billing/subscriptions` → { priceId, scope, method? } → { subscriptionId, checkoutUrl|authorizationUrl? }
- GET `/api/billing/transactions` (me/admin)
- POST `/api/webhooks/payments/:provider` → no auth; signature verified per provider

## Open Questions (decide together)
- Pricing model for community creation and membership: flat vs tiered? currency constraints?
- Do we gate `community_members` directly on payment success, or exclusively via entitlements and a background sync?
- Refund policy: pro‑rated refunds for subscriptions? window for course purchases?
- Revenue share: fixed platform fee (e.g., 10%) or configurable per community? handle instructor splits?
- Multi‑currency strategy: restrict per tenant/community or allow mixed carts?
- Tax: Stripe Tax now vs manual later? need tax IDs/invoices?
- Donation receipts: do we need receipt templates per community?
- Ledger: do we want double‑entry accounting now or defer with simple settlements rows?

## Next Steps
- Confirm use cases and revenue share rules.
- Lock enums and minimal V1 tables (transactions, items, entitlements, products, prices).
- Implement Stripe checkout intent endpoint and webhook handler.
- Ship a small UI to test flow with course purchase and community join.
