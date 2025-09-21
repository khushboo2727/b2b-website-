# B2B LeadGen E‑commerce (MERN) – Scalable System Design

**Goal:** India‑focused exporter marketplace that connects verified suppliers to global buyers. MVP = lead generation + paid seller access; later = richer trade features (escrow, logistics, chat, AI matchmaking).

---

## 1) Architecture Overview (Scale‑ready, maintainable)

### 1.1 Deployment Topology
- **Frontend:**
  - **Public Marketing + Blog:** Next.js (SSR/ISR for SEO, multilingual).
  - **Web App (Dashboards):** React (Vite) SPA for Buyer, Seller, Super Admin.
- **Backend:** Node.js (Express) as a **modular monolith** initially → with clear **domain modules** so we can split to microservices later.
- **DB:** MongoDB Atlas (global clusters later). Separate databases or collections per domain.
- **Search:** OpenSearch/Elasticsearch for product & supplier search, filters, and comparisons.
- **Cache/Queues:** Redis (caching, rate limits, job queues via BullMQ), optional RabbitMQ for high‑throughput notifications.
- **Storage/CDN:** Object storage (S3/R2) + CDN (CloudFront/Cloudflare) for images/docs.
- **Observability:** Sentry (errors), OpenTelemetry traces → Grafana/Prometheus; central logs (ELK).

### 1.2 Domain Modules (Node/Express)
- **Auth & RBAC** (JWT access/refresh, roles: buyer, seller, superadmin; device/session mgmt).
- **Users & Companies** (profiles, verification badge status; KYC/Docs).
- **Products** (specs, images, pricing range, MOQ, certifications linkage).
- **Leads & RFQs** (buyer enquiries; routing to category‑matched sellers; “locked” vs “unlocked” details based on plan).
- **Memberships & Billing** (plans, limits, entitlements, invoices, GST; Razorpay/Stripe/PayPal webhooks).
- **Search Indexer** (ETL workers to index products/suppliers to OpenSearch).
- **Messaging** (internal chat for later; for MVP only email/WhatsApp notifications and contact reveal after unlock).
- **Notifications** (email/SMS/WhatsApp; templating, throttling, digest jobs).
- **Ratings & Reviews** (buyer→seller ratings, moderation queue).
- **Content/Blog** (Headless CMS or internal module; SEO tags, categories).
- **AI Matchmaking** (offline/near‑real‑time jobs: scoring buyer enquiries to best sellers).
- **Admin Console API** (user moderation, plan mgmt, category taxonomy, featured listings, audits).

### 1.3 Evolution Path
- Phase 1: Modular monolith (shared DB).
- Phase 2: Extract **Payments**, **Leads**, **Search** into separate services; use an event bus (Kafka/NATS) for decoupling.
- Phase 3: Regional shards (EU/US/IN) + data residency; multi‑tenant partitioning if needed.

---

## 2) Data Model (Mongo) – Key Collections

**users**
- _id, email, phone, password_hash, roles[], status (active/blocked), lastLoginAt
- buyerProfileId?, sellerProfileId?, adminFlags

**companies**
- _id, name, country, state, city, address, website, gstNumber, cin?, yearFounded, employeeCount
- verification: { status: pending|verified|rejected, badges: ["KYC", "FSSAI", "ISO"], reviewedBy, reviewedAt }
- contacts: [{ name, role, email, phone }]

**sellerProfiles**
- _id, userId, companyId, categories[], exportMarkets[], logisticsPartners[], paymentTerms[]
- certifications: [{ type: 'FSSAI|CE|FDA|ISO', number, issuer, validFrom, validTo, files:[fileId] }]
- membership: { planId, status, startedAt, expiresAt }
- limits: { maxProducts, maxRFQResponsesPerMonth }

**buyerProfiles**
- _id, userId, companyId, preferredMarkets[], languages[], annualSpendRange

**products**
- _id, sellerId, companyId, title, slug, description, images:[fileId], categoryId, attributes: { key:value },
- pricing: { priceMin, priceMax, currency, moq }
- certifications: [certificationId]
- indexing: { searchableText, status }

**rfqs** (buyer enquiries/leads)
- _id, buyerId, companyId, categoryId, productTitle, specs, quantity, unit, targetPrice?, notes, country
- routing: { matchedSellerIds:[sellerId], createdAt }
- visibility: per seller: { sellerId, unlocked: true|false, unlockedAt, viaPlanId }
- status: open|closed|convertedOffPlatform

**plans**
- _id, name (Free/Premium), price, currency, periodMonths, entitlements: { maxProducts, rfqUnlocks, priorityRank, supportLevel }

**subscriptions**
- _id, sellerId, planId, status (active|expired|canceled), startedAt, expiresAt, paymentProvider, invoiceIds[]

**payments**
- _id, provider (razorpay|stripe|paypal), intentId, status, amount, currency, userId, sellerId, planId, meta

**reviews**
- _id, authorBuyerId, sellerId, rating(1–5), title, text, photos[], status(pending|approved|rejected)

**files**
- _id, url, storageProvider, mime, size, uploadedBy, usage (product|cert|kyc), checksum

**audits**
- _id, actorId, action, entityType, entityId, diff, ip, ua, at

---

## 3) Search & Compare
- **Indexer service** normalizes products + companies into OpenSearch docs with analyzers for multilingual text.
- **Facets/Filters:** category, price range, MOQ, certifications, country, verified badge, rating, membership tier.
- **Supplier Compare:** fetch product/company docs by ids → materialize compare view (attributes diff, pricing range, certifications).

---

## 4) Lead Routing & Monetization Logic
- On RFQ creation: classify category → fetch eligible sellers (approved + category match + region rules).
- Insert records in `rfqs.visibility[]` for each seller with `unlocked=false`.
- Notify sellers: “New lead in your category – contact locked”.
- **Free plan:** can see summary only (redacted contact).
- **Premium plan:** auto‑unlock or require “spend unlock credits” (configurable in `plans.entitlements.rfqUnlocks`).
- Audit each unlock (who, when, via plan/credit).

---

## 5) Membership & Payments
- Plans managed by Super Admin.
- Checkout flows:
  - Razorpay/Stripe/PayPal → create checkout session → webhook to confirm → create/extend `subscriptions`.
- Entitlement middleware checks plan before actions: product create, RFQ unlock, visibility of contacts.
- Invoices & GST fields stored in `payments`; downloadable invoice PDF via job.

**Optional Trust/Escrow (later):** evaluate **Razorpay Route / Stripe Connect** to hold funds and release on milestone; requires stricter KYC and T&Cs.

---

## 6) Verification & Compliance
- Seller KYC upload (GST, CIN, PAN, address proof) → review queue → badge on approval.
- Certifications module to attach FSSAI/CE/FDA/ISO to products & company.
- Badge logic: Verified Supplier = KYC approved + min_docs + no active blocks.
- Periodic re‑verification jobs for expiring docs.

---

## 7) Messaging & Integrations
- **MVP:** Email and WhatsApp notifications when matched leads arrive; reveal buyer contact after unlock. (No in‑app chat initially.)
- **Email:** Provider (Brevo/SendGrid/Postmark). Templates with Handlebars; per‑seller daily/instant digests.
- **WhatsApp:** Meta Cloud API or Twilio WhatsApp for templated messages (“You have a new lead”).
- **Webhooks:** Accept CMS webhooks for blog; payment webhooks; future logistics webhooks.

---

## 8) AI‑based Matchmaking (Roadmap‑ready)
- **Phase 1:** Heuristics scoring: category match + location + capacity + response time + membership tier.
- **Phase 2:** Embedding model for product/spec similarity (e.g., sentence embeddings). Offline batch jobs score sellers per RFQ; store top‑N in `rfqs.routing`.
- **Phase 3:** Learning‑to‑rank from outcomes (reply rates, unlocks, conversions, ratings).

---

## 9) UI/UX Surfaces

### Public (Next.js)
- Home, Categories, Product pages, Supplier directory, Success stories, Blog, Pricing (membership), About, Contact.

### Seller App (React SPA)
- Dashboard (stats, plan status, unlock credits)
- Company Profile (verification steps)
- Products (CRUD, bulk import CSV)
- Leads (summary list, unlock flow, filters, reminders)
- Membership (upgrade, invoices)
- Certifications (upload/manage)

### Buyer App (React SPA)
- Dashboard (recent RFQs, recommended suppliers)
- Company Profile
- RFQ Create (guided form with specs templates)
- RFQ List/Status
- Compare Suppliers

### Super Admin
- Overview analytics, queues (seller approvals, reviews moderation)
- Users/Companies (block/unblock)
- Plans & Pricing
- Taxonomy (categories/attributes)
- Content (success stories, featured suppliers)
- Audits & System health

---

## 10) I18n & Localization
- **Web:** i18next (Next.js SSR + React SPA). Namespaces per page/module.
- **Content:** CMS fields per locale (en, es, ar, fr). RTL support for Arabic.
- **Data:** country/currency formatting via Intl APIs.

---

## 11) Blog & SEO
- Headless CMS (Strapi/Sanity) or internal `posts` collection.
- Next.js ISR pages for posts, categories, author bios.
- Rich snippets (Product, Organization, FAQ), sitemap, robots, canonical URLs.

---

## 12) Security, Privacy, Compliance
- Password: bcrypt, JWT rotation + refresh revocation list (Redis).
- 2FA (TOTP) for sellers and admins (phase 2).
- Rate limiting + bot protection (hCaptcha on forms).
- File scanning (ClamAV) for uploads.
- PII minimization in logs; per‑field encryption for phone/email if needed.
- Consent + privacy policy; cookie banner for tracking; unsubscribe for emails; WhatsApp opt‑in.

---

## 13) DevEx, Testing, CI/CD
- Monorepo (Nx/Turborepo) with apps: `marketing`, `seller`, `buyer`, `admin`, `api`, `workers`.
- Code style: TypeScript everywhere; Zod for runtime validation; ESLint/Prettier; Husky + lint‑staged.
- Tests: Jest + Supertest (API), React Testing Library (UI), Cypress (E2E) with test data seeds.
- CI/CD: GitHub Actions → build, test, dockerize; deploy to Render/Fly.io/AWS; Infra as Code (Pulumi/Terraform) later.

---

## 14) Suggested Directory Structure (Monorepo)
```
/ (repo)
  /apps
    /marketing-next
    /buyer-spa
    /seller-spa
    /admin-spa
    /api (express)
    /workers (queue jobs, indexers)
  /packages
    /ui (shared React components)
    /config (eslint, tsconfig, tailwind)
    /lib (auth, http, logger, i18n)
    /types (zod schemas, TS types)
  /infra (docker, compose, k8s manifests later)
```

---

## 15) API Surface (Illustrative)
**Auth**
- POST /auth/register (role)
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

**Company & Profiles**
- GET/PUT /companies/:id
- GET/PUT /seller-profiles/:id
- GET/PUT /buyer-profiles/:id
- POST /seller-profiles/:id/verify (admin)

**Products**
- GET /products?query=&filters
- POST /products (seller)
- PUT /products/:id (seller)
- DELETE /products/:id (seller)
- POST /products/bulk-import (seller)

**RFQs & Leads**
- POST /rfqs (buyer)
- GET /rfqs (buyer owns)
- GET /leads (seller view summaries)
- POST /leads/:rfqId/unlock (seller, checks plan/credits)

**Memberships**
- GET /plans
- POST /subscriptions/checkout (provider)
- POST /webhooks/payments (provider callbacks)
- GET /subscriptions/me

**Search**
- GET /search/products
- GET /search/suppliers

**Admin**
- GET /admin/users
- POST /admin/sellers/:id/approve
- POST /admin/users/:id/block
- POST /admin/plans
- GET /admin/audits

---

## 16) Limits & Entitlements (Examples)
- **Free Seller**: maxProducts=10, rfqUnlocks=5/month, priorityRank=low.
- **Premium Seller**: maxProducts=unlimited, rfqUnlocks=unlimited (or high), priorityRank=high, badge.
- Middleware enforces limits; cron resets monthly counters.

---

## 17) Logistics & Payments Terms (Placeholders)
- Store seller‑declared **payment terms** (Advance/LC/TT/Net30) and **logistics partners** for display & filtering.
- No shipment APIs in MVP; add later (Shiprocket/Delhivery integrations) as separate module.

---

## 18) Success Stories / Case Studies
- Content type with fields: buyer market, product, problem, solution, outcome metrics; images/video; featured flag.
- Surfaces on marketing site and seller profile.

---

## 19) Roadmap (Phased)

### MVP (Month 1)
- Auth/RBAC; Seller approval & verification badge
- Product listings; Certifications; Pricing range & MOQ
- Buyer RFQ; lead routing; seller unlock flow
- Membership checkout (Razorpay/Stripe/PayPal) + webhooks
- Email/WhatsApp notifications; Admin console (basic)
- Public SEO pages (Next.js): Home, Categories, Supplier Directory, Pricing, Blog

### Phase 2 (Months 2–3)
- Ratings/Reviews + moderation
- AI match v1 (heuristics + embeddings); recommendation widgets
- In‑app chat (Socket.io) with attachment support + abuse controls
- Supplier compare tool; advanced filters; OpenSearch roll‑out
- CMS workflows for success stories; multilingual (ES/AR/FR)

### Phase 3 (Months 4–6)
- Buyer protection/escrow (Stripe Connect/Razorpay Route evaluation)
- Logistics partner integrations; proforma invoice generator
- Analytics dashboards; cohort & funnel tracking
- Service extraction (Payments, Leads, Search) + event bus

---

## 20) Non‑Functional Requirements
- **Performance:** P95 < 300ms for API with cache; image optimization; lazy‑load.
- **Availability:** 99.9% target; multi‑AZ for DB; health checks & auto‑restart.
- **Scalability:** stateless API; horizontal scale; queue‑backed jobs.
- **Security:** OWASP top‑10, secret rotation, least privilege IAM.
- **Compliance:** data retention policy; audit trails for admin actions.

---

## 21) Implementation Notes & Best Practices
- Use **TypeScript** end‑to‑end; Zod for request validation; Controller‑Service‑Repo pattern.
- DTOs separate from persistence models; no raw objects across layers.
- Feature flags (ConfigCat/Unleash) for gradual roll‑out.
- Seed scripts for categories/attributes; migration scripts for Mongo (migrate-mongo).
- Image pipeline: presigned S3 upload; process (resize, webp) via worker.

---

## 22) Open Questions (to finalize)
1. Exact **plan pricing** (INR/USD) and tax handling (GST invoices).
2. Category taxonomy depth (2 vs 3+ levels) and attribute schema per category.
3. WhatsApp provider choice (Meta Cloud vs Twilio) and template approvals.
4. CMS pick (Strapi/Sanity/internal) and editorial workflow needs.
5. Review policy (who can review, verification of purchase/interaction).

---

**This document is designed for immediate build while staying flexible for future scale.**

