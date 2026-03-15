# [APP_NAME] — Product Requirements Document

> **Bangladesh's Trusted Review & Ratings Platform**
> Version 1.0 | Status: Draft | Last Updated: March 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users & Personas](#3-target-users--personas)
4. [Feature Specification](#4-feature-specification)
   - 4.1 [MVP — Phase 1](#41-mvp--phase-1-months-14)
   - 4.2 [Growth — Phase 2](#42-growth-features--phase-2-months-58)
   - 4.3 [Premium — Phase 3](#43-premium-features--phase-3-months-912)
5. [Review Integrity System](#5-review-integrity-system)
6. [Sector-Specific Review Attributes](#6-sector-specific-review-attributes)
7. [Bangladesh-Specific Design Requirements](#7-bangladesh-specific-design-requirements)
8. [Tech Stack](#8-tech-stack)
9. [Database Schema](#9-database-schema)
10. [API Design](#10-api-design)
11. [Business Model](#11-business-model)
12. [Go-to-Market Strategy](#12-go-to-market-strategy)
13. [Competitive Landscape](#13-competitive-landscape)
14. [MVP Development Timeline](#14-mvp-development-timeline)
15. [Success Metrics](#15-success-metrics)
16. [Risks & Mitigations](#16-risks--mitigations)

---

## 1. Executive Summary

**[APP_NAME]** is Bangladesh's first dedicated consumer review and business ratings platform — the country's equivalent of Trustpilot. It enables consumers to post verified reviews of businesses and products, and gives businesses structured tools to manage their reputation and publicly respond to customers.

### Core Positioning

> Trustpilot for Bangladesh — verified, bilingual, and built for the local market.

### Why Now

- Bangladesh has 60M+ internet users but zero centralized, trustworthy review infrastructure
- The F-commerce (Facebook commerce) market is estimated at $1B+ with near-zero consumer protection
- Businesses currently have no formal way to earn or display verified trust
- The four highest-friction sectors — e-commerce, food, banking, and healthcare — all lack public accountability mechanisms

### Monetization

Freemium. Any business can claim a free profile. Revenue comes from paid tiers: verified badge, enhanced analytics, priority placement, and review invitation tools.

### Domain Status

> ⚠️ Domain name TBD. The following are under consideration: `bdpurchase.com`, `review-bd.com`, `deshireviews.com`, `bhalomondo.com`, `DekheNin.com`, `reviewdekhun.com`, `biswasbd.com`, `provebd.com`. Development proceeds independently of the domain decision.

---

## 2. Problem Statement

### 2.1 Consumer Pain Points

| Pain Point | Detail |
|---|---|
| No central review platform | Consumers rely on Facebook comments, word-of-mouth, and unmoderated Facebook Groups |
| Facebook fraud | Fake product pages, fake reviews, and disappearing sellers cost consumers money daily |
| No recourse | There is nowhere to publicly document a bad experience that holds a business accountable |
| Healthcare opacity | Patients have no structured way to evaluate a clinic or doctor before committing |
| Banking opacity | Bank and MFS customers cannot compare service quality across providers |

### 2.2 Business Pain Points

| Pain Point | Detail |
|---|---|
| No verifiable reputation | Honest businesses can't distinguish themselves from fraudulent competitors |
| No feedback loop | Businesses can't systematically collect, analyze, or respond to customer sentiment |
| Trust is invisible | There's no formal credential a business can earn to signal trustworthiness |

### 2.3 Market Opportunity

| Indicator | Data |
|---|---|
| Internet users in BD | 60M+, growing ~15% YoY |
| F-commerce market size | ~$1B+ with near-zero consumer protection |
| Banks regulated by Bangladesh Bank | 60+ — none have a formal public review system |
| Registered restaurants in Dhaka | ~30,000, predominantly unreviewed online |
| Registered clinics & diagnostics | 13,000+ across Bangladesh |

---

## 3. Target Users & Personas

### 3.1 Primary — Consumers (Reviewers)

**Persona A: The Online Shopper**
- Age 20–35, urban, smartphone-first
- Shops on Facebook, Instagram, and Daraz
- Has been burned by a fake seller at least once
- Wants to check reviews before sending bKash to a stranger

**Persona B: The Healthcare Seeker**
- Age 25–50, middle class
- Needs to evaluate a private clinic or specialist
- Has no trusted source beyond "a friend said"
- Values privacy — doesn't want their name on a medical review

**Persona C: The Young Professional**
- Age 22–35, urban professional
- Opening a bank account, choosing an MFS
- Wants to compare service quality across providers
- Comfortable writing reviews in English or Bengali

### 3.2 Secondary — Businesses

**Persona D: The Legitimate F-Commerce Seller**
- Runs a Facebook shop with 5,000–50,000 followers
- Competes with fraudulent pages that look identical
- Wants a verified badge to prove legitimacy
- Would pay ৳2,500/month for a trust signal that converts

**Persona E: The Restaurant Owner**
- Runs 1–3 locations in Dhaka
- Gets feedback via Facebook comments, hard to track
- Wants structured reviews and a way to respond publicly
- Interested in trend data: what are customers complaining about?

**Persona F: The Enterprise Brand Manager**
- Works at a bank, hospital chain, or national retailer
- Manages reputation across multiple branches
- Needs competitor benchmarking and sentiment analytics
- Budget for ৳6,000–custom/month

### 3.3 Tertiary — Platform Operators

- **Moderators** — review flagged content, verify business documents
- **Admins** — manage platform health, pricing, feature flags

---

## 4. Feature Specification

### 4.1 MVP — Phase 1 (Months 1–4)

> Goal: A working review platform for Dhaka, covering all 4 priority sectors, with verified reviews and basic business claim flow.

---

#### 4.1.1 Consumer Features

##### Search & Discovery

- Search businesses by name, category, or district/upazila
- Filter results by: star rating, category, location, review count
- Sort results by: most reviewed, highest rated, newest
- Autocomplete with Bengali + English keyword support
- Business listing cards showing: name, category, avg rating, review count, verified badge (if applicable)

##### Business Profile Page

- Business name, logo, category, address, phone, website
- Overall star rating (1 decimal place) + total review count
- Review breakdown bar chart (5★ → 1★ distribution)
- Sector-specific sub-rating scores (see Section 6)
- Paginated review feed (newest first by default)
- Map embed (Google Maps / OpenStreetMap) showing location
- Claim status badge — "Claimed & Verified" | "Claimed" | "Unclaimed"

##### Review Submission Flow

```
Step 1: Select star rating (1–5)
Step 2: Select sector-specific sub-ratings (e.g. Delivery Speed, Food Quality)
Step 3: Write review body (min 20 chars, max 1000 chars)
Step 4: Optional — upload up to 3 photos (max 5MB each, JPEG/PNG/WEBP)
Step 5: OTP verification (if not already verified in session)
Step 6: Submit → pending state → published after basic automated checks
```

- **Language**: Review body accepts Bengali Unicode, English, or mixed
- **Edit window**: Reviewer may edit their review within 48 hours of submission; locked after that
- **One review per business per verified phone number** — enforced at submission
- Reviewer sees own review immediately in pending state with note it will be visible shortly

##### Reviewer Account

- Registration: phone number + OTP only — no email or social login required
- Profile: display name (not real name), avatar (optional), join date
- Review history: all reviews written, with edit/delete options within window
- Notification: SMS when business responds to a review

##### Review Reporting

- Any user can flag a review: "Fake review", "Offensive content", "Irrelevant", "Conflict of interest", "Other"
- Flagged reviews stay visible until moderator takes action
- Reporter gets no further feedback (prevents weaponized reporting)

---

#### 4.1.2 Business Features (Free Tier)

##### Claim a Business Profile

```
Step 1: Search for business — if not listed, submit new business request
Step 2: Enter business name, category, address, phone
Step 3: Upload verification document (Trade License OR NID)
Step 4: Admin reviews within 48 hours
Step 5: Claim approved → business owner gets dashboard access
```

- One claim per phone number per business
- Business owner cannot edit or delete reviews — only respond or flag

##### Business Dashboard (Free)

- Overall rating and total review count
- Last 5 reviews with quick-respond CTA
- Rating trend: 30-day rolling average chart
- Review breakdown by star rating
- Profile completeness checklist (logo, description, hours, website, socials)

##### Respond to Reviews

- One public response per review, written by the claimed business owner
- Response appears nested under the original review, labeled "Business Response"
- Response can be edited within 24 hours, then locked
- Character limit: 500 chars
- No rich text — plain text only

##### Business Profile Editing

- Logo upload (square, min 200×200px)
- Cover image (optional, 1200×400px)
- Short description (max 300 chars)
- Business hours (per day of week, open/closed toggle)
- Website URL, Facebook page URL, phone number

---

#### 4.1.3 Admin Panel

##### Review Moderation

- Queue of all flagged reviews, sorted by flag count
- Actions: Approve (keep visible) | Remove (hide with reason) | Escalate
- Removal reasons: Fake/spam | Offensive | Off-topic | Business request (with reason required)
- Removed reviews are soft-deleted — stored but hidden from public
- Moderator notes field (internal only)

##### Business Verification Queue

- Queue of all pending business claims
- View uploaded document (Trade License / NID)
- Actions: Approve | Reject (with reason) | Request more info
- Approved claims trigger SMS to business owner

##### Platform Analytics (Basic)

- Daily new reviews, new registrations, new business claims
- Top businesses by review count
- Flagged review rate %
- Pending verification queue depth

---

### 4.2 Growth Features — Phase 2 (Months 5–8)

| Feature | Description | Priority |
|---|---|---|
| **Verified Purchase Tag** | Integration with e-commerce platforms to confirm buyer status; reviews from verified buyers shown with badge | High |
| **Sector Sub-ratings** | Expanded category-specific attribute ratings displayed prominently on profiles | High |
| **Reviewer Badges & Reputation** | "Top Reviewer", "Verified Buyer", "Helpful" badges earned through activity | Medium |
| **Business Review Widgets** | Embeddable HTML widget showing live rating + count + link, for use on business websites | High |
| **Review Invitation Links** | Businesses generate unique short links to send to customers via SMS/WhatsApp to request reviews | High |
| **Trending Feed** | Homepage and category pages show algorithmically trending businesses based on review velocity | Medium |
| **Android App (Flutter)** | Native Android app with push notifications, Bengali-first UI | High |
| **Review Helpfulness Voting** | "Was this review helpful?" thumbs up/down on each review | Low |
| **Similar Businesses** | "You might also want to check" section on business profiles | Low |

---

### 4.3 Premium Features — Phase 3 (Months 9–12)

| Feature | Tier | Description |
|---|---|---|
| **Verified Business Badge** | Verified+ | Paid badge displayed on profile and search results after document verification |
| **Enhanced Profile** | Verified+ | Cover photo, service catalogue, FAQs section, promo banner |
| **Review Invitations** | Verified+ | Send up to 500 review-request SMS/links per month |
| **Analytics Dashboard (Advanced)** | Verified+ | 30/60/90-day trends, keyword frequency, response rate tracking |
| **Priority Search Placement** | Verified+ | Featured position within category search for their district |
| **Competitor Benchmarking** | Pro | Compare own rating, review volume, and response rate against category competitors |
| **Embeddable Widget** | Pro | Live rating widget for embedding on their own website |
| **Unlimited Review Invitations** | Pro | No monthly cap on review-request links |
| **AI-Assisted Responses** | Pro | Suggested response drafts for new reviews based on content |
| **Multi-location Management** | Pro | One dashboard, up to 5 branch profiles |
| **Monthly Report (PDF)** | Pro | Auto-generated monthly reputation summary |
| **API Access** | Enterprise | REST API to pull own review data, webhook support |
| **Unlimited Locations** | Enterprise | Manage unlimited branches from one account |
| **White-label Option** | Enterprise | Custom-branded review widget and report exports |
| **Dedicated Account Manager** | Enterprise | Human support with SLA |

---

## 5. Review Integrity System

This is the **core value proposition** of the platform. A review platform is worthless without trust in its reviews. Every design decision here must prioritize integrity over engagement.

### 5.1 Anti-Fraud Measures

| Layer | Mechanism | Detail |
|---|---|---|
| **Identity** | Phone OTP | Every reviewer must verify a Bangladesh mobile number. Supported: Grameenphone, Robi, Banglalink, Teletalk, Airtel |
| **Uniqueness** | One review per number per business | A single phone number can only review a given business once. Enforced at DB level with unique constraint |
| **Pattern detection** | NLP similarity check | Reviews with >70% lexical similarity to other recent reviews for the same business are auto-flagged |
| **Coordination detection** | IP + device fingerprinting | Multiple reviews from same IP or device fingerprint within short window are flagged |
| **Spike detection** | Temporal anomaly | A business receiving more reviews in 24h than their 90-day daily average ×3 triggers a review freeze and admin alert |
| **Human review** | Moderation queue | All auto-flagged reviews go to human moderators; target resolution within 24h |
| **Business limitation** | No delete, only flag | Businesses cannot remove reviews. They can only flag for moderation with a stated reason. Moderators decide |
| **Purchase validation** | Verified buyer tag | Phase 2: Reviews from users with confirmed purchase receive a "Verified Purchase" tag and higher trust weight |

### 5.2 Trust Score Algorithm

The platform Trust Score is a weighted composite used to rank businesses in search results and calculate their displayed rating. It is **not** shown to users directly — only the resulting star rating is shown.

```
Trust Score =
  (Average Star Rating × 0.40)
  + (Recency Score × 0.20)        // reviews in last 6 months weighted 2× older reviews
  + (Verified Buyer Ratio × 0.20) // % of reviews from verified buyers
  + (Volume Score × 0.10)         // log-scaled review count vs category average
  + (Response Rate × 0.10)        // % of reviews the business has responded to
```

**Displayed Rating** = Bayesian average (to prevent new businesses with 1 review showing 5.0★)

```
Displayed Rating = (C × m + Σ ratings) / (C + n)

Where:
  m = global mean rating across all businesses (~3.5)
  C = confidence constant (default: 10 reviews)
  n = total reviews for this business
```

### 5.3 Reviewer Trust Levels

Reviewers earn trust levels based on activity and verification. Higher trust = lower likelihood of their review being flagged.

| Level | Requirements | Benefit |
|---|---|---|
| **New** | Phone verified | Reviews enter basic check queue |
| **Active** | 3+ approved reviews, 30+ days old | Reviews bypass basic queue |
| **Trusted** | 10+ approved reviews, none removed, 0 flags | Reviews go live immediately |
| **Top Reviewer** | 25+ helpful votes, consistently high quality | Badge displayed on profile |

### 5.4 Business Review Policy (Public-Facing)

The platform must publish a clear, public review policy. Key rules:

- Reviews must be based on a genuine experience with the business
- Reviews cannot contain personal attacks, hate speech, or unrelated political content
- Businesses cannot incentivize positive reviews (offering discounts for 5★)
- Businesses cannot threaten reviewers or use legal pressure to remove reviews
- The platform moderates based on policy, not business pressure

---

## 6. Sector-Specific Review Attributes

Each sector has a primary star rating (1–5) plus sub-ratings (1–5). Sub-ratings are averaged and displayed as a breakdown on the business profile.

### 6.1 E-Commerce / Online Shops

| Sub-rating | What it measures |
|---|---|
| Product accuracy | Did the product match the description/photos? |
| Delivery speed | Was the order delivered on time? |
| Packaging quality | Was the product well packaged? |
| Customer service | How responsive and helpful was the seller? |
| Return / refund | How easy was it to return or get a refund? |

### 6.2 Restaurants & Food Delivery

| Sub-rating | What it measures |
|---|---|
| Food quality | Taste, freshness, and presentation |
| Value for money | Was the price fair for the portion/quality? |
| Delivery speed | (If delivery) Was it on time and food arrived hot? |
| Hygiene | Cleanliness of the environment or packaging |
| Staff behavior | Courtesy and professionalism of staff |

### 6.3 Banks & Financial Services

| Sub-rating | What it measures |
|---|---|
| App / digital quality | Stability and usability of mobile app or online banking |
| Branch service speed | Wait time and efficiency at physical branches |
| Fee transparency | Were charges clearly communicated upfront? |
| Customer support | How helpful was support when problems arose? |
| Product availability | Ease of getting loans, cards, or accounts |

### 6.4 Healthcare & Clinics

| Sub-rating | What it measures |
|---|---|
| Doctor quality | Consultation thoroughness and professionalism |
| Wait time | Time from appointment to being seen |
| Staff behavior | Receptionists, nurses — courtesy and efficiency |
| Facility cleanliness | Hygiene of the clinic / hospital environment |
| Pricing transparency | Were costs disclosed before treatment? |
| Appointment access | How easy was it to get an appointment? |

---

## 7. Bangladesh-Specific Design Requirements

### 7.1 Language

- **Default language: Bengali (বাংলা)**. English is a toggle, not the default.
- All UI strings must be translated into Bengali. No machine translation — use a native Bengali speaker for review.
- Review body text: accepts Bengali Unicode (UTF-8), English, or mixed
- Search: supports Bengali Unicode input AND romanized transliteration (e.g. "kachchi" finds "কাচ্চি")
- Star rating labels in Bengali:
  - 5★ → অসাধারণ (Excellent)
  - 4★ → খুব ভালো (Very Good)
  - 3★ → গড় (Average)
  - 2★ → খারাপ (Bad)
  - 1★ → অত্যন্ত খারাপ (Very Bad)
- Error messages, notifications, and onboarding flows must all be available in Bengali

### 7.2 Business Verification

| Method | Detail |
|---|---|
| Trade License | Scanned/photo upload. Admin manually verifies issuing authority and business name match |
| NID (National ID) | Front + back photo upload. Admin verifies identity. Used for sole traders and F-commerce sellers |
| NID API | Future: integrate with Bangladesh Election Commission NID verification API when available |

- Verification status must be clearly communicated to the business during and after the process
- Target turnaround: 48 hours for standard verification

### 7.3 Identity for Reviewers

- Phone OTP is the only identity requirement — no email, no NID, no social login
- This is a deliberate choice: email penetration is lower than mobile in BD; social login risks fake accounts
- Display name only — reviewers never show their real name publicly
- For healthcare and banking reviews specifically: remind users their display name is shown, not their real identity
- bKash/Nagad number cross-reference: if a reviewer's phone is a registered bKash/Nagad account, this adds to their trust score (Phase 2)

### 7.4 Payment for Premium Tiers

- **Primary**: bKash and Nagad (mobile money) — not credit/debit cards
- **Secondary**: Bank transfer (for enterprise clients)
- **Currency**: BDT (৳) only — no USD pricing
- **Billing cycles**: Monthly or annual (annual at 20% discount)
- **Invoice**: Auto-generated PDF in Bengali, compliant with Bangladesh VAT requirements

### 7.5 SMS / OTP Provider

- **Primary**: SSL Wireless (local BD provider, supports all BD operators)
- **Fallback**: Infobip (international, BD coverage)
- OTP validity: 5 minutes
- Rate limiting: max 3 OTP requests per phone number per hour
- OTP message template (Bengali): `আপনার [APP_NAME] যাচাই কোড: {CODE}। ৫ মিনিটের মধ্যে ব্যবহার করুন।`

### 7.6 BD-Specific Business Categories

Categories must be tuned to the BD market — not copied from Trustpilot's Western category list.

**Priority categories (launch):**
- E-commerce & Online Shops
- F-commerce (Facebook/Instagram sellers) — distinct from e-commerce
- Restaurants & Cafes
- Food Delivery Services
- Banks
- Mobile Financial Services (MFS) — bKash, Nagad, Rocket, Upay
- Hospitals & Clinics
- Diagnostic Centers
- Pharmacies

**Phase 2 categories:**
- Courier & Delivery Services — Pathao, Paperfly, Sundarban, SA Paribahan
- Real Estate Developers
- Travel Agencies
- Hajj & Umrah Operators
- Universities & Colleges
- Coaching Centers
- ISPs & Telecom Operators
- Home Services (plumbers, electricians, AC repair)

### 7.7 Location Data

- Location hierarchy: Division → District → Upazila → Union/Ward
- Use Bangladesh's official BARD (Bangladesh Administrative Region Data) dataset
- All 8 divisions, 64 districts, and 495 upazilas must be in the database at launch
- Businesses must select their district/upazila — not just a text field
- Future: GPS-based "near me" search using browser geolocation

---

## 8. Tech Stack

### 8.1 Frontend

| Layer | Technology | Reason |
|---|---|---|
| Web framework | **Next.js 15** (App Router) | SSR for SEO, React ecosystem, familiar |
| Styling | **Tailwind CSS** | Fast, utility-first, no CSS-in-JS overhead |
| Component library | **shadcn/ui** | Accessible, unstyled by default, easy to theme |
| State management | **Zustand** | Lightweight, no boilerplate |
| Server state / cache | **TanStack Query (React Query)** | Data fetching, caching, background sync |
| Forms | **React Hook Form + Zod** | Performant validation, type-safe schemas |
| Internationalization | **next-intl** | Next.js-native i18n, Bengali + English |
| Charts (dashboard) | **Recharts** | Simple, React-native charting |
| Mobile app (Phase 2) | **Flutter** | Android-first, single codebase for iOS later |

### 8.2 Backend

| Layer | Technology | Reason |
|---|---|---|
| Runtime | **Node.js 22 LTS** | Familiar, large ecosystem |
| Framework | **Fastify** | 2× faster than Express, built-in schema validation |
| Validation | **Zod** | Shared schemas with frontend (monorepo) |
| ORM | **Prisma** | Type-safe, BD-friendly migration workflow |
| Database | **PostgreSQL 16** | Primary data store, ACID, JSON support for flexible fields |
| Cache | **Redis 7** | Sessions, rate limiting, OTP storage, search result cache |
| Search | **MeiliSearch** | Self-hostable, fast, supports Bengali stemming |
| File storage | **Cloudflare R2** | S3-compatible, no egress fees, Cloudflare CDN included |
| Job queue | **BullMQ** | Redis-backed, review processing, SMS dispatch, analytics jobs |
| Email (admin) | **Resend** | Simple API, reliable delivery for internal notifications |
| SMS / OTP | **SSL Wireless API** | Local BD provider, all operators, cheapest rates |

### 8.3 Infrastructure

| Layer | Technology | Reason |
|---|---|---|
| Hosting | **VPS** (Contabo or Hetzner) | Cost-effective, full control, Docker-native |
| CDN | **Cloudflare** (free tier) | DDoS protection, caching, R2 integration |
| Reverse proxy | **Nginx** | Routing, SSL termination, static serving |
| Containerization | **Docker + Docker Compose** | Reproducible environments, easy deployment |
| Process manager | **PM2** (inside containers) | Node process management, zero-downtime reload |
| CI/CD | **GitHub Actions** | Push-to-deploy pipeline |
| Monitoring | **Grafana + Prometheus** | Metrics, alerts |
| Error tracking | **Sentry** | Production error monitoring |
| Logging | **Winston + Loki** | Structured logging, queryable via Grafana |

### 8.4 Development Tooling

| Tool | Purpose |
|---|---|
| **pnpm workspaces** | Monorepo: `apps/web`, `apps/api`, `packages/shared` |
| **TypeScript** | Strict mode across all packages |
| **ESLint + Prettier** | Code style enforcement |
| **Husky + lint-staged** | Pre-commit hooks |
| **Vitest** | Unit and integration tests |
| **Playwright** | E2E tests for critical flows |

---

## 9. Database Schema

### 9.1 Core Tables

```sql
-- ──────────────────────────────────────────────
-- USERS
-- ──────────────────────────────────────────────
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           VARCHAR(15) UNIQUE NOT NULL,  -- BD format: +8801XXXXXXXXX
  display_name    VARCHAR(50) NOT NULL,
  avatar_url      TEXT,
  trust_level     SMALLINT NOT NULL DEFAULT 0,  -- 0=New, 1=Active, 2=Trusted, 3=Top
  reviewer_score  INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- BUSINESSES
-- ──────────────────────────────────────────────
CREATE TABLE businesses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  slug            VARCHAR(220) UNIQUE NOT NULL,
  description     TEXT,
  category_id     UUID NOT NULL REFERENCES categories(id),
  district_id     UUID NOT NULL REFERENCES districts(id),
  upazila_id      UUID REFERENCES upazilas(id),
  address         TEXT,
  phone           VARCHAR(20),
  website         TEXT,
  facebook_url    TEXT,
  logo_url        TEXT,
  cover_url       TEXT,
  hours           JSONB,  -- { mon: {open: "09:00", close: "21:00"}, ... }
  is_claimed      BOOLEAN NOT NULL DEFAULT false,
  claimed_by      UUID REFERENCES users(id),
  verified_tier   VARCHAR(20) NOT NULL DEFAULT 'none',  -- none | basic | verified | pro | enterprise
  verified_at     TIMESTAMPTZ,
  avg_rating      DECIMAL(3,2),  -- denormalized, recalculated on each new review
  review_count    INTEGER NOT NULL DEFAULT 0,
  trust_score     DECIMAL(5,4),  -- internal, used for search ranking
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_businesses_category ON businesses(category_id);
CREATE INDEX idx_businesses_district ON businesses(district_id);
CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_trust_score ON businesses(trust_score DESC);

-- ──────────────────────────────────────────────
-- REVIEWS
-- ──────────────────────────────────────────────
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body            TEXT NOT NULL CHECK (char_length(body) BETWEEN 20 AND 1000),
  language        VARCHAR(5) NOT NULL DEFAULT 'bn',  -- bn | en | mixed
  photo_urls      TEXT[],  -- max 3 items
  sub_ratings     JSONB,   -- { "delivery_speed": 4, "food_quality": 5, ... }
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  status          VARCHAR(20) NOT NULL DEFAULT 'published',  -- published | flagged | removed | pending
  removal_reason  VARCHAR(100),
  flag_count      INTEGER NOT NULL DEFAULT 0,
  helpful_count   INTEGER NOT NULL DEFAULT 0,
  edited_at       TIMESTAMPTZ,
  edit_locked_at  TIMESTAMPTZ,  -- 48h after creation
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (business_id, user_id)  -- one review per user per business
);

CREATE INDEX idx_reviews_business ON reviews(business_id, status, created_at DESC);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_status ON reviews(status);

-- ──────────────────────────────────────────────
-- RESPONSES (business replies to reviews)
-- ──────────────────────────────────────────────
CREATE TABLE responses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id    UUID UNIQUE NOT NULL REFERENCES reviews(id),
  business_id  UUID NOT NULL REFERENCES businesses(id),
  body         TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  is_edited    BOOLEAN NOT NULL DEFAULT false,
  edit_locked_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- FLAGS (user-reported reviews)
-- ──────────────────────────────────────────────
CREATE TABLE flags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id    UUID NOT NULL REFERENCES reviews(id),
  reporter_id  UUID NOT NULL REFERENCES users(id),
  reason       VARCHAR(50) NOT NULL,  -- fake | offensive | irrelevant | conflict | other
  detail       TEXT,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | reviewed | dismissed
  resolved_by  UUID REFERENCES users(id),  -- moderator user id
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (review_id, reporter_id)  -- one flag per user per review
);

-- ──────────────────────────────────────────────
-- CLAIMS (business ownership requests)
-- ──────────────────────────────────────────────
CREATE TABLE claims (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID NOT NULL REFERENCES businesses(id),
  user_id        UUID NOT NULL REFERENCES users(id),
  doc_type       VARCHAR(20) NOT NULL,  -- trade_license | nid
  doc_url        TEXT NOT NULL,
  doc_url_back   TEXT,  -- for NID back side
  status         VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  rejection_reason TEXT,
  reviewed_by    UUID REFERENCES users(id),
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- SUBSCRIPTIONS
-- ──────────────────────────────────────────────
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID UNIQUE NOT NULL REFERENCES businesses(id),
  plan            VARCHAR(20) NOT NULL,  -- free | verified | pro | enterprise
  billing_cycle   VARCHAR(10) NOT NULL DEFAULT 'monthly',  -- monthly | annual
  price_bdt       INTEGER,
  payment_method  VARCHAR(20),  -- bkash | nagad | bank_transfer
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- CATEGORIES
-- ──────────────────────────────────────────────
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en     VARCHAR(100) NOT NULL,
  name_bn     VARCHAR(100) NOT NULL,
  slug        VARCHAR(110) UNIQUE NOT NULL,
  parent_id   UUID REFERENCES categories(id),  -- for subcategories
  icon        VARCHAR(50),  -- icon name or emoji
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

-- ──────────────────────────────────────────────
-- LOCATION TABLES
-- ──────────────────────────────────────────────
CREATE TABLE divisions (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en VARCHAR(50) NOT NULL,
  name_bn VARCHAR(50) NOT NULL
);

CREATE TABLE districts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id UUID NOT NULL REFERENCES divisions(id),
  name_en     VARCHAR(80) NOT NULL,
  name_bn     VARCHAR(80) NOT NULL
);

CREATE TABLE upazilas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id),
  name_en     VARCHAR(100) NOT NULL,
  name_bn     VARCHAR(100) NOT NULL
);

-- ──────────────────────────────────────────────
-- OTP STORE (Redis preferred, DB as fallback)
-- ──────────────────────────────────────────────
CREATE TABLE otp_attempts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      VARCHAR(15) NOT NULL,
  code_hash  VARCHAR(64) NOT NULL,  -- bcrypt hash of OTP
  purpose    VARCHAR(20) NOT NULL,  -- login | claim | review
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_phone ON otp_attempts(phone, created_at DESC);
```

### 9.2 Key Constraints & Business Rules (enforced at DB level)

```sql
-- Prevent business owner from reviewing their own business
CREATE OR REPLACE FUNCTION prevent_self_review()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM businesses
    WHERE id = NEW.business_id AND claimed_by = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Business owner cannot review their own business';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_self_review
BEFORE INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION prevent_self_review();

-- Auto-lock reviews for editing after 48 hours
CREATE OR REPLACE FUNCTION set_edit_lock()
RETURNS TRIGGER AS $$
BEGIN
  NEW.edit_locked_at = NEW.created_at + INTERVAL '48 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_edit_lock
BEFORE INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION set_edit_lock();
```

---

## 10. API Design

### 10.1 Conventions

- Base URL: `/api/v1/`
- Authentication: `Authorization: Bearer <jwt_token>` header
- All responses: `{ success: boolean, data?: any, error?: { code, message } }`
- Pagination: `?page=1&limit=20` with response `{ items, total, page, totalPages }`
- Language preference: `Accept-Language: bn` or `en` header
- All timestamps: ISO 8601 UTC

### 10.2 Auth Endpoints

```
POST   /api/v1/auth/otp/request     — Request OTP for phone number
POST   /api/v1/auth/otp/verify      — Verify OTP, returns JWT + user object
POST   /api/v1/auth/token/refresh   — Refresh access token
DELETE /api/v1/auth/session         — Logout (invalidate token)
```

### 10.3 User Endpoints

```
GET    /api/v1/users/me             — Get own profile
PATCH  /api/v1/users/me             — Update display name / avatar
GET    /api/v1/users/me/reviews     — Paginated list of own reviews
DELETE /api/v1/users/me             — Delete account (soft delete, anonymise reviews)
```

### 10.4 Business Endpoints

```
GET    /api/v1/businesses           — Search/list businesses (query: q, category, district, sort)
POST   /api/v1/businesses           — Submit new business listing (any user)
GET    /api/v1/businesses/:slug     — Get business profile + sub-ratings + review summary
PATCH  /api/v1/businesses/:id       — Update business profile (claimed owner only)

POST   /api/v1/businesses/:id/claim — Submit a claim request (with doc upload)
GET    /api/v1/businesses/:id/stats — Rating trend, breakdown (claimed owner only)
```

### 10.5 Review Endpoints

```
GET    /api/v1/businesses/:id/reviews          — Paginated reviews for a business (sort: newest|top)
POST   /api/v1/businesses/:id/reviews          — Submit a review (auth required)
PATCH  /api/v1/reviews/:id                     — Edit review (author only, within edit window)
DELETE /api/v1/reviews/:id                     — Delete review (author only, within edit window)

POST   /api/v1/reviews/:id/flag                — Flag a review
POST   /api/v1/reviews/:id/response            — Business owner posts response
PATCH  /api/v1/reviews/:id/response            — Edit response (within 24h)
POST   /api/v1/reviews/:id/helpful             — Mark review as helpful (auth required)
```

### 10.6 Admin Endpoints (role-gated)

```
GET    /api/v1/admin/flags               — Flagged review queue
PATCH  /api/v1/admin/flags/:id           — Resolve flag (approve/remove/dismiss)
GET    /api/v1/admin/claims              — Pending business claim queue
PATCH  /api/v1/admin/claims/:id          — Approve or reject claim
GET    /api/v1/admin/analytics           — Platform-level stats
GET    /api/v1/admin/reviews/flagged     — Reviews with flag_count >= threshold
```

### 10.7 Error Codes

| Code | Meaning |
|---|---|
| `AUTH_REQUIRED` | No valid JWT provided |
| `FORBIDDEN` | Valid JWT but insufficient permissions |
| `OTP_INVALID` | OTP code incorrect or expired |
| `OTP_RATE_LIMITED` | Too many OTP requests for this number |
| `REVIEW_EXISTS` | User has already reviewed this business |
| `REVIEW_LOCKED` | Edit window has passed |
| `SELF_REVIEW` | Business owner cannot review own business |
| `BUSINESS_NOT_FOUND` | No business with this slug/id |
| `VALIDATION_ERROR` | Request body failed schema validation |

---

## 11. Business Model

### 11.1 Pricing Tiers

| Feature | Free | Verified (৳2,500/mo) | Pro (৳6,000/mo) | Enterprise (Custom) |
|---|:---:|:---:|:---:|:---:|
| Claim 1 business profile | ✅ | ✅ | ✅ | ✅ |
| Respond to reviews | ✅ | ✅ | ✅ | ✅ |
| Basic dashboard | ✅ | ✅ | ✅ | ✅ |
| Verified badge | ❌ | ✅ | ✅ | ✅ |
| Enhanced profile | ❌ | ✅ | ✅ | ✅ |
| Review invitations | ❌ | 500/mo | Unlimited | Unlimited |
| Priority search placement | ❌ | ✅ | ✅ | ✅ |
| Advanced analytics (90-day) | ❌ | ✅ | ✅ | ✅ |
| Competitor benchmarking | ❌ | ❌ | ✅ | ✅ |
| Embeddable widget | ❌ | ❌ | ✅ | ✅ |
| AI-assisted responses | ❌ | ❌ | ✅ | ✅ |
| Multi-location (branches) | ❌ | ❌ | 5 | Unlimited |
| Monthly PDF report | ❌ | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ❌ | ✅ |
| Dedicated account manager | ❌ | ❌ | ❌ | ✅ |

### 11.2 Revenue Projections (Conservative — Year 1)

| Quarter | Paid Businesses | Avg Revenue/Business (BDT) | MRR (BDT) |
|---|---|---|---|
| Q1 | 50 | ৳2,500 | ৳125,000 |
| Q2 | 150 | ৳2,500 | ৳375,000 |
| Q3 | 350 | ৳2,500 | ৳875,000 |
| Q4 | 700 | ৳2,500 | ৳1,750,000 |

**Break-even estimate**: ~120 Verified subscribers covers basic operational costs (VPS, SMS, moderation).

---

## 12. Go-to-Market Strategy

### 12.1 Pre-launch — Seed Content (Month 0)

Before launch, the platform must not be empty. Strategy:

- Manually seed the top 200 businesses in Dhaka across all 4 sectors
- Recruit 50–100 beta reviewers from Facebook consumer complaint groups and university students
- Target: every seeded business has at least 3–5 reviews before public launch
- Beta reviewers get "Early Reviewer" badge permanently on their profile

### 12.2 Phase 1 — Consumer Acquisition (Months 1–3)

- Facebook & Instagram campaigns targeting BD consumers aged 18–40
  - Ad concept: "এখন সৎ রিভিউ দিন" (Give honest reviews now)
  - Ad concept: "এটা কি legit? চেক করুন।" (Is this legit? Check.)
- YouTube SEO content: "Top 10 hospitals in Dhaka reviewed", "Best courier services in BD"
- Referral program: reviewers earn badges + monthly prize draw entry
- Organic community seeding: Reddit r/bangladesh, Facebook Groups, Discord BD servers

### 12.3 Phase 2 — Business Acquisition (Months 3–6)

- Outreach to top-rated free-tier businesses to convert to Verified tier
- WhatsApp Business API campaigns to business owners
- Partnership with F-commerce Facebook Groups (200k+ member groups)
- Media: Prothom Alo Tech, The Daily Star Business, TechJuice BD

### 12.4 Phase 3 — Platform Growth (Months 6–12)

- API partnership talks: Daraz, Chaldal (verified purchase data)
- Integration discussions: Pathao Food, Shohoz (restaurant review cross-posting)
- Enterprise sales: banks, hospital chains, national retailers
- B2B white-label product for enterprise clients

---

## 13. Competitive Landscape

| Platform | BD Presence | Strength | Core Weakness |
|---|---|---|---|
| Google Reviews | Partial | Large user base, trusted brand | Not BD-focused, easily gamed, no business tools |
| Facebook Ratings | Widespread | Already where BD users are | Reviews deletable, no verification, no structured analytics |
| Daraz Product Reviews | E-commerce only | Verified purchase | Limited to Daraz sellers, no cross-category |
| Zomato | Very limited | Good UX | Restaurants only, low BD penetration, English-first |
| **[APP_NAME]** | **BD-first** | **Verified, bilingual, all sectors, local payment** | New entrant, cold start challenge |

**Sustainable moat**: The platform's value compounds with each review added. A competitor starting today would need years to match the review volume. First-mover advantage is significant in a market where trust infrastructure doesn't yet exist.

---

## 14. MVP Development Timeline

> This timeline assumes a single full-stack developer (you) working on the project with Claude Code assistance.

| Week | Milestone | Deliverables |
|---|---|---|
| 1 | **Project setup** | Monorepo (pnpm workspaces), Next.js + Fastify scaffolding, Docker Compose (PG + Redis + MeiliSearch), CI pipeline |
| 2 | **Auth system** | Phone OTP flow (SSL Wireless integration), JWT issue/refresh, user registration, session management |
| 3 | **Location & category data** | Seed all 8 divisions, 64 districts, 495 upazilas; seed initial category tree |
| 4 | **Business listings** | Business CRUD, slug generation, search indexing (MeiliSearch), basic search API |
| 5 | **Business profile page** | Public-facing profile page, rating display, category sub-ratings display |
| 6 | **Review submission** | Review form, photo upload to R2, OTP gate, one-review-per-business enforcement |
| 7 | **Review integrity** | Duplicate detection, flag system, basic NLP similarity check, moderation queue |
| 8 | **Business claim flow** | Claim request form, doc upload (R2), admin claim review queue, approval flow |
| 9 | **Business dashboard** | Rating overview, review feed, trend chart, profile edit |
| 10 | **Review responses** | Business response form, response display on review, edit lock |
| 11 | **Bengali UI** | Full i18n pass (next-intl), Bengali translations for all strings, RTL/font testing |
| 12 | **Admin panel** | Flag queue, claim queue, basic platform analytics, user management |
| 13 | **Search & discovery** | Homepage, category landing pages, search results with filters, autocomplete |
| 14 | **Performance & SEO** | Metadata, sitemap, robots.txt, image optimization, Core Web Vitals audit |
| 15 | **Testing & hardening** | E2E tests for critical flows, rate limiting, security headers, load testing |
| 16 | **Soft launch** | Deploy to production VPS, seed Dhaka data, invite beta users, monitor |

**Estimated MVP: 16 weeks (4 months)**

### Post-MVP Immediate Priorities (Week 17+)

Based on beta feedback:
1. Performance bottlenecks identified from real usage
2. Bengali UI edge cases (font rendering, input handling)
3. OTP delivery issues with specific operators
4. Category taxonomy refinement

---

## 15. Success Metrics

### 15.1 Year 1 Targets

| Metric | Target |
|---|---|
| Registered reviewers | 50,000 |
| Verified reviews published | 200,000 |
| Business profiles listed | 10,000 |
| Claimed business profiles | 2,000 |
| Paid business subscriptions | 700 |
| Monthly active users | 100,000 |
| Average session duration | 3+ minutes |
| Review flag rate | < 5% |
| Average OTP delivery time | < 10 seconds |
| Android app store rating | 4.2+ |

### 15.2 Health Metrics (Monitor Weekly)

| Metric | Healthy Range |
|---|---|
| Reviews submitted per day | Growing week-over-week |
| Fake review flag rate | < 5% of all reviews |
| Moderation queue depth | < 48h backlog |
| Claim approval time | < 48 hours |
| OTP success rate | > 95% |
| Business response rate | > 30% of reviews get a response |
| p95 API response time | < 300ms |
| Uptime | > 99.5% |

---

## 16. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Fake review campaigns** by businesses trying to game ratings | High | High | OTP + device fingerprinting + temporal anomaly detection + human moderation |
| **Legal threats** from businesses unhappy with negative reviews | Medium | High | Public review policy, moderation SLA, legal disclaimer, "Right to Respond" (not delete) |
| **Cold start problem** — no reviews means no users | High | High | Pre-seed 200 businesses with beta reviewer program before launch |
| **SMS OTP cost at scale** | Medium | Medium | Bulk SMS deal with SSL Wireless, strict rate limiting, cache OTP in Redis |
| **Bengali search quality** | Medium | Medium | MeiliSearch with Bengali tokenizer; manual QA pass with native speakers |
| **NID verification fraud** | Medium | High | Human review of all documents, cross-reference with business name |
| **Large platform enters BD market** | Low | High | First-mover + local depth (language, categories, payment) they won't invest in |
| **Server downtime during peak** (e.g., viral moment) | Low | Medium | Cloudflare caching, Redis query cache, horizontal scaling plan ready |
| **Bengali NLP for fake detection accuracy** | Medium | Medium | Start rule-based (lexical similarity), improve with ML as review volume grows |
| **bKash/Nagad API changes** | Low | Medium | Abstract payment layer, keep manual bank transfer as fallback |

---

## Appendix A — Folder Structure

```
/
├── apps/
│   ├── web/                    # Next.js 15 frontend
│   │   ├── app/
│   │   │   ├── [locale]/       # bn / en routing
│   │   │   │   ├── page.tsx    # Homepage
│   │   │   │   ├── business/
│   │   │   │   │   └── [slug]/page.tsx
│   │   │   │   ├── search/page.tsx
│   │   │   │   ├── dashboard/  # Business owner dashboard (protected)
│   │   │   │   └── admin/      # Admin panel (protected)
│   │   ├── components/
│   │   ├── lib/
│   │   └── messages/
│   │       ├── bn.json         # Bengali translations
│   │       └── en.json         # English translations
│   │
│   └── api/                    # Fastify backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth/
│       │   │   ├── businesses/
│       │   │   ├── reviews/
│       │   │   └── admin/
│       │   ├── plugins/        # Fastify plugins (auth, db, redis)
│       │   ├── services/       # Business logic
│       │   ├── jobs/           # BullMQ job handlers
│       │   └── lib/            # Utilities
│       └── prisma/
│           ├── schema.prisma
│           └── migrations/
│
├── packages/
│   └── shared/                 # Shared types and Zod schemas
│       ├── schemas/
│       └── types/
│
├── docker-compose.yml          # PostgreSQL, Redis, MeiliSearch
├── docker-compose.prod.yml
└── .github/
    └── workflows/
        └── deploy.yml
```

---

## Appendix B — Environment Variables

```env
# App
NODE_ENV=production
PORT=3001
APP_URL=https://[your-domain]

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/appdb

# Redis
REDIS_URL=redis://localhost:6379

# MeiliSearch
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_KEY=your-master-key

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=https://cdn.[your-domain]

# JWT
JWT_SECRET=your-256-bit-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# SSL Wireless (OTP)
SSL_WIRELESS_API_KEY=
SSL_WIRELESS_SID=

# Sentry
SENTRY_DSN=
```

---

## Appendix C — Review Submission State Machine

```
                    ┌─────────────┐
                    │   PENDING   │  ← auto-checks running
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │                             │
       passes checks               fails checks
            │                             │
            ▼                             ▼
     ┌─────────────┐              ┌─────────────┐
     │  PUBLISHED  │              │   FLAGGED   │ ← human moderation
     └──────┬──────┘              └──────┬──────┘
            │                           │
       user flags it           moderator decides
            │                    ┌──────┴──────┐
            ▼                    ▼             ▼
     ┌─────────────┐     ┌─────────────┐ ┌─────────────┐
     │   FLAGGED   │     │  PUBLISHED  │ │   REMOVED   │
     └─────────────┘     └─────────────┘ └─────────────┘
```

---

*[APP_NAME] PRD — Version 1.0*
*Stack: Next.js 15 · Node.js (Fastify) · PostgreSQL · Redis · MeiliSearch · Cloudflare R2*
*Domain: TBD — see Section 1 for candidates*