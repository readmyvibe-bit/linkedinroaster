# ProfileRoaster — Complete Product Document

**Website:** profileroaster.in
**Tech Stack:** Next.js 16 + Express.js + TypeScript
**Status:** Live in Production
**Last Updated:** March 31, 2026

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Product 1: LinkedIn Roast & Rewrite](#2-product-1-linkedin-roast--rewrite)
3. [Product 2: Build My LinkedIn](#3-product-2-build-my-linkedin)
4. [ATS Resume Builder](#4-ats-resume-builder)
5. [User Dashboard](#5-user-dashboard)
6. [How It Works — Technical Flow](#6-how-it-works--technical-flow)
7. [AI Technology](#7-ai-technology)
8. [Scoring Algorithm](#8-scoring-algorithm)
9. [Complete Feature List](#9-complete-feature-list)
10. [Pricing & Plans](#10-pricing--plans)
11. [User Benefits](#11-user-benefits)
12. [Infrastructure & Security](#12-infrastructure--security)
13. [Admin Panel](#13-admin-panel)
14. [Project Metrics](#14-project-metrics)

---

## 1. Product Overview

ProfileRoaster is an AI-powered SaaS platform that helps professionals optimise their LinkedIn presence and build job-winning resumes. The platform serves two distinct audiences:

1. **Users with an existing LinkedIn profile** — Get a brutally honest AI roast, a complete professional rewrite, and ATS-optimised resumes.
2. **Users without a LinkedIn profile** — Build a complete LinkedIn profile from scratch using AI, with a step-by-step setup guide.

Both flows include ATS resume generation, cover letters, and a personal dashboard to access all results.

---

## 2. Product 1: LinkedIn Roast & Rewrite

### What It Does
Users paste their LinkedIn profile text. AI analyses it, delivers a 6-point comedic roast exposing weaknesses, then rewrites the entire profile for maximum recruiter impact. A before/after score shows the measurable improvement.

### User Journey
1. User lands on profileroaster.in
2. Pastes LinkedIn headline for free teaser score (0-100)
3. Sees their score and preview roast — gets curious
4. Selects Standard (Rs 299) or Pro (Rs 799) plan
5. Pastes full LinkedIn profile text (headline + about + experience)
6. Pays via Razorpay (UPI, card, net banking, wallet)
7. AI processes in 60-120 seconds (5 stages)
8. Results page shows:
   - Before/After score with breakdown
   - 6-point roast with humor
   - Hidden strength discovery
   - Complete profile rewrite (headline, about, experience)
   - Shareable roast card for social media
   - ATS Resume Builder access

### Standard Plan (Rs 299)
- Full 6-point roast with comedic critique
- Before/After score across 5 dimensions (headline, about, experience, completeness, ATS)
- Complete profile rewrite (headline + about + all experience bullets)
- Hidden strength discovery with evidence
- Closing compliment
- Shareable roast card (PNG image for social media)
- Downloadable roast sheet (6-point report as PNG)
- 1 ATS resume with 12 templates
- PDF + DOCX download
- Results email to inbox
- Dashboard access

### Pro Plan (Rs 799)
Everything in Standard, plus:
- 5 headline variations ranked by impact and style
- 10+ ATS keywords specific to industry
- Job description targeting (upload a JD for tailored rewrite)
- 3 ATS resumes for different roles
- 3 tailored cover letters
- All 21 premium resume templates
- Priority processing

### Upgrade Path
Standard users can upgrade to Pro for Rs 500 (difference payment) at any time from the results page. The upgrade reprocesses only the Pro-specific features without re-running the full pipeline.

---

## 3. Product 2: Build My LinkedIn

### What It Does
For users who don't have a LinkedIn profile yet — students, freshers, career changers. AI builds a complete LinkedIn profile from scratch using information they provide in a simple form.

### User Journey
1. User clicks "Don't have LinkedIn? Build one from scratch" on homepage (or visits /build directly)
2. Selects a plan: Starter (Rs 199), Plus (Rs 399), or Pro (Rs 699)
3. Fills a multi-section form:
   - Personal info (name, email, location, career stage)
   - Education (institution, degree, field, year)
   - Experience (company, role, dates, description — including internships, projects, volunteering)
   - Skills & certifications
   - Target role and industry
   - Tone preference (professional, friendly, bold)
   - Optional: upload existing resume (PDF/DOCX) to auto-fill form
4. Pays via Razorpay
5. AI generates complete LinkedIn profile in 60-90 seconds
6. Results page shows:
   - 3 headline variations with different styles (achievement-focused, role-focused, skills-focused)
   - Full About section (250-400 words, hook format)
   - Experience bullets with action verbs and metrics per role
   - Categorised skills (technical, soft, tools)
   - 10-step LinkedIn setup guide with exact menu paths, common mistakes, and time estimates
   - Each section has a Copy button for easy paste to LinkedIn
   - Progress tracker with checkboxes for setup guide steps

### Starter Plan (Rs 199)
- 3 AI-generated headline variations
- Professional About section
- Experience bullets with action verbs and metrics
- Skills list (technical, soft, tools)
- 10-step LinkedIn setup guide
- Copy buttons for every section
- Results email to inbox
- Dashboard access

### Plus Plan (Rs 399)
Everything in Starter, plus:
- 1 ATS-optimised resume
- 1 tailored cover letter
- 12 professional resume templates
- PDF + DOCX download

### Pro Plan (Rs 699)
Everything in Plus, plus:
- 3 ATS resumes for different roles
- 3 cover letters
- All 21 premium resume templates
- Priority AI processing

### Target Audience
- Final year students
- Recent graduates (0-1 year experience)
- Professionals creating LinkedIn for the first time
- Career changers starting fresh
- Anyone who has been avoiding LinkedIn

---

## 4. ATS Resume Builder

### What It Does
Generates ATS-optimised resumes from LinkedIn profile data (roast flow) or build profile data (build flow). Users select a template, paste a job description, and get a complete resume with cover letter in 30-45 seconds.

### Features
- **21 Professional Templates:** Classic, Modern, Executive, Creative, Technical, Minimalist, Bold, Elegant, Corporate, Professional, Academic, Startup, Impact, Luxe, Nordic, Sidebar, Metro, Chronicle, Cascade, Zenith, and more
- **Template Categories:** ATS-Friendly, Professional, Premium, Visual
- **12 Standard + 9 Pro-exclusive** templates
- **Live Editor:** 6-tab interface (Personal, Summary, Experience, Education, Skills, Certifications)
- **Drag-to-Reorder:** Rearrange experience and education entries
- **Auto-Fill from Upload:** Upload existing resume (PDF/DOCX) and auto-populate fields via AI parsing
- **Template Preview:** Real-time preview with instant template switching
- **ATS Score Widget:** Real-time ATS compatibility score with keyword analysis
- **Smart PDF Auto-Fit:** Hidden iframe measurement and CSS spacing adjustment to fit content perfectly on 1-2 pages
- **Two-Column Templates:** Absolute-positioned sidebar backgrounds for clean PDF export
- **DOCX Generation:** Template-specific styling with proper formatting
- **Cover Letter:** Auto-generated alongside resume, targeted to the job description

### ATS Intelligence
- Keyword extraction from job description
- Match rate against resume content
- Missing keyword identification
- Specific recommendations for improvement
- Weak verb detection and replacement suggestions
- Quantification analysis (percentage of bullets with numbers)

---

## 5. User Dashboard

### What It Does
A personal dashboard where users can view all their past orders, results, and resumes in one place. Accessible via OTP email verification.

### Access
- URL: profileroaster.in/dashboard
- Login: Enter email → receive 6-digit OTP → verify → dashboard loads
- Sessions persist for 7 days (stored in Redis)
- Available to any user with at least one paid order

### Dashboard Features
- **Stats bar:** Total orders, LinkedIn Roasts, Profile Builds, Resumes
- **Tabbed view:** All | Roasts | Builds | Resumes
- **Roast order cards:** Title, plan, date, before→after score with improvement badge
- **Build order cards:** Headline preview, plan badge, completion status
- **Resume cards:** Target role, template, ATS score, View + Edit links
- All items open in new tabs (user stays on dashboard)
- Quick action links: "Get another roast" and "Build new LinkedIn"
- Error handling with retry and logout options

### Navigation
Dashboard links are available from:
- Homepage top bar
- Build landing page header
- Roast results page header
- Build results page header
- Resume preview page

---

## 6. How It Works — Technical Flow

### Roast & Rewrite Pipeline (5 Stages)

```
Raw LinkedIn Text → Stage 1 → Stage 2 → Stage 3 → Stage 4 → Stage 5 → Results
                    Parse     Analyse    Roast     Rewrite    QC
                   (Gemini)  (Gemini)   (Claude)  (Claude)  (Gemini)
```

| Stage | AI Model | Purpose | Output |
|-------|----------|---------|--------|
| 1. Parse | Gemini 2.5 Flash | Extract structured data from raw text | headline, about, experience, education, skills |
| 2. Analyse | Gemini 2.5 Pro | Score each section, detect buzzwords, ATS intelligence | headline_score, about_score, weak_verbs, keywords |
| 3. Roast | Claude Sonnet | Generate 6-point comedic roast + hidden strength | 6 roast points, closing compliment, hidden strengths |
| 4. Rewrite | Claude Sonnet | Rewrite entire profile | new headline, about, experience bullets, suggested skills |
| 5. QC | Gemini 2.5 Flash | Validate safety, accuracy, quality | safety_passed, quality_score |

Each stage has: exponential backoff retry (3 attempts), timeout protection, JSON repair, processing status tracking.

### Build My LinkedIn Pipeline (2 Stages)

```
Form Data → Stage 1 → Stage 2 → Results
            Generate    QC
           (Claude)   (Gemini)
```

| Stage | AI Model | Purpose | Output |
|-------|----------|---------|--------|
| 1. Generate | Claude Sonnet | Build complete LinkedIn profile from form data | 3 headlines, about, experience bullets, skills, setup guide |
| 2. QC | Gemini 2.5 Flash | Check for fabrication, verify quality | verdict (APPROVE/REVISE), issues, score |

If QC returns REVISE, the pipeline retries Stage 1 with revision instructions appended (max 3 attempts).

### Resume Generation

```
Order Data + Job Description → Claude Sonnet → Resume JSON → Template Render → PDF/DOCX
```

The resume generator merges 3 data sources:
1. LinkedIn rewrite data (from roast) or generated profile data (from build)
2. Original profile/form data (education, full career history)
3. Uploaded resume text (if provided)

---

## 7. AI Technology

### Multi-Model Architecture
ProfileRoaster strategically uses two AI providers:

**Google Gemini** (structured data tasks):
- Profile parsing (raw text → structured JSON)
- Deep analysis (scoring, ATS intelligence, buzzword detection)
- Quality control (safety check, fabrication detection)

**Anthropic Claude** (creative and professional writing):
- Roast generation (6 comedic points + hidden strength)
- Profile rewriting (headline, about, experience)
- LinkedIn profile building from scratch
- Resume generation (ATS-optimised)
- Cover letter generation
- Resume upload parsing

### Safety Guardrails
- Prohibited content regex checks (profanity, identity-based language)
- QC stage validates tone, checks for fabricated data
- Resume generation explicitly prohibited from fabricating education/certifications
- Score capping prevents unrealistic improvements (max 97, never exceeds 100)
- Industry estimates allowed but exact fabricated numbers rejected

### Cost Optimisation
- **Profile fingerprinting:** SHA-256 hash of normalised profile text — duplicates reuse previous results
- **Teaser caching:** Identical headlines return cached results from Redis
- **3-layer rate limiting:** localStorage + IP-based Redis + content hash prevents free teaser abuse

---

## 8. Scoring Algorithm

### Five Weighted Dimensions

| Dimension | Weight | Factors |
|-----------|--------|---------|
| Headline | 23% | Length, structure separators (|, •), non-generic opener, AI quality score |
| About | 32% | Length, metrics presence, formatting, AI quality score, buzzword density penalty |
| Experience | 27% | Entry count, description quality, quantification, passive voice penalty |
| Completeness | 8% | Presence of headline, about, experience, skills, education |
| ATS | 10% | Keyword match rate, weak verb count, quantification percentage |

### Score Capping Rules
- `calculateScore`: Overall capped at 100
- `capAfterScore`: Maximum 97 for after scores
- Maximum 60-point improvement in a single rewrite
- Before score >= 65: ceiling is 97. Below 65: ceiling is 90
- Natural variance of +/-3 for realism
- Guaranteed minimum improvement (capped at 97)

---

## 9. Complete Feature List

### Free (No Payment)
- LinkedIn headline analysis with AI score (0-100)
- Quick roast preview (teaser)
- Landing page experience with Hinglish roast quotes
- Score transformation examples

### Roast — Standard (Rs 299)
- Full 6-point roast
- Before/After score (5 dimensions)
- Complete profile rewrite
- Hidden strength discovery
- Closing compliment
- Shareable roast card (PNG)
- Downloadable roast sheet
- 1 ATS resume (12 templates)
- PDF + DOCX export
- Results email
- Dashboard access
- Result recovery via OTP

### Roast — Pro (Rs 799)
- Everything in Standard
- 5 headline variations
- 10+ ATS keywords
- Job description targeting
- 3 ATS resumes
- 3 cover letters
- All 21 templates
- Priority processing

### Build — Starter (Rs 199)
- 3 headline variations
- Professional About section
- Experience bullets with metrics
- Skills list (technical, soft, tools)
- 10-step LinkedIn setup guide
- Copy buttons for every section
- Results email
- Dashboard access

### Build — Plus (Rs 399)
- Everything in Starter
- 1 ATS resume + 1 cover letter
- 12 resume templates
- PDF + DOCX download

### Build — Pro (Rs 699)
- Everything in Plus
- 3 ATS resumes + 3 cover letters
- All 21 templates
- Priority processing

### Platform Features
- **User Dashboard:** OTP login, view all orders/results/resumes
- **Result Recovery:** OTP-based email recovery for lost result links
- **Admin Panel:** Order management, build orders, analytics, manual actions
- **Async Processing:** BullMQ job queue for non-blocking order processing
- **3 Cron Jobs:** Data cleanup (daily), teaser follow-up (daily), stuck order auto-cancel (10 min)
- **Payment:** Razorpay (UPI, cards, net banking, wallets), webhook verification
- **Email:** Resend-powered transactional emails (results, OTP, follow-ups, refunds)
- **Error Tracking:** Sentry integration
- **Analytics:** PostHog event tracking

---

## 10. Pricing & Plans

### LinkedIn Roast & Rewrite

| Feature | Standard (Rs 299) | Pro (Rs 799) |
|---------|:------------------:|:------------:|
| 6-point roast | Yes | Yes |
| Before/After score | Yes | Yes |
| Profile rewrite | Yes | Yes |
| Hidden strength | Yes | Yes |
| Shareable card | Yes | Yes |
| 5 headline variations | No | Yes |
| ATS keywords | No | Yes |
| JD targeting | No | Yes |
| Resumes | 1 | 3 |
| Cover letters | No | Yes |
| Templates | 12 | 21 |
| Upgrade available | Rs 500 → Pro | — |

### Build My LinkedIn

| Feature | Starter (Rs 199) | Plus (Rs 399) | Pro (Rs 699) |
|---------|:-----------------:|:-------------:|:------------:|
| 3 headline variations | Yes | Yes | Yes |
| About section | Yes | Yes | Yes |
| Experience bullets | Yes | Yes | Yes |
| Skills list | Yes | Yes | Yes |
| Setup guide | Yes | Yes | Yes |
| ATS resumes | 0 | 1 | 3 |
| Cover letters | 0 | 1 | 3 |
| Templates | — | 12 | 21 |

---

## 11. User Benefits

1. **Honest Feedback:** Most LinkedIn users never get real feedback — ProfileRoaster delivers it with humour and actionable fixes
2. **Complete Rewrites:** Not just criticism — fully rewritten headline, about, and experience sections ready to copy-paste
3. **Build from Scratch:** Users without LinkedIn get a complete professional profile with a step-by-step setup guide
4. **ATS Optimisation:** Score, keyword recommendations, and resumes built to pass ATS systems
5. **Time Savings:** Full profile analysis + rewrite + resume in under 2 minutes (vs. hours with a human consultant)
6. **Affordable:** Rs 199-799 vs. Rs 5,000-15,000 for LinkedIn optimisation services
7. **Multiple Resumes:** Build role-specific resumes for different job applications
8. **21 Templates:** Professional designs covering every industry and aesthetic preference
9. **Shareable Results:** Branded cards for social media sharing
10. **Privacy-First:** No LinkedIn login required — paste text or fill a form
11. **Personal Dashboard:** All results, resumes, and orders in one place, accessible anytime
12. **India-Focused:** Pricing in INR, Hinglish content, Indian recruiter insights, UPI payments

---

## 12. Infrastructure & Security

### Architecture

```
Frontend (Vercel)  ←→  Backend (Railway)  ←→  Database (Supabase PostgreSQL)
                                           ←→  Redis (Upstash) — queue, sessions, cache
                                           ←→  AI (Claude + Gemini)
                                           ←→  Payments (Razorpay)
                                           ←→  Email (Resend)
                                           ←→  Storage (Supabase S3)
                                           ←→  Errors (Sentry)
```

### Database (5 Tables)
1. **orders** — Roast orders: payment, processing, AI results (JSONB), scores, UTM tracking
2. **build_orders** — Build orders: payment, processing, form input, generated profile
3. **resumes** — Generated resumes with data, ATS scores, templates
4. **teaser_attempts** — Free headline submissions with conversion tracking
5. **users** — Dashboard users (email + last login)
6. **referrals** — Referral codes with earnings tracking
7. **events** — Analytics event log

### Security
- HTTPS/TLS encryption on all data
- Razorpay HMAC-SHA256 webhook verification
- PCI-DSS compliant payment processing (via Razorpay)
- OTP authentication with 10-minute expiry
- Dashboard sessions in Redis with 7-day TTL (256-bit random tokens)
- Rate limiting: IP + localStorage + content hash
- Profile fingerprinting (SHA-256)
- No passwords stored — OTP-only authentication
- Sentry error tracking with PII scrubbing
- API keys in environment variables, never in code

### Dependencies
- **Backend:** 34+ production packages (Express, BullMQ, Anthropic SDK, Google AI, Razorpay, Sentry, Satori, Resend, PostHog)
- **Frontend:** 13+ production packages (Next.js 16, React, Razorpay)

---

## 13. Admin Panel

### Overview Dashboard
- Today/Week/Month order counts and revenue (both Roast + Build)
- Conversion funnel: teasers → emails → payments → results
- Active jobs, pipeline stages, average processing time
- Refund rate, emails sent, auto-cancelled orders

### Roast Orders Tab
- Full order list with pagination
- Click to view detailed order: scores, roast points, rewrite, resume management
- Actions: approve, cancel, send email, manual operations

### Build Orders Tab
- Full build order list with plan, status, email
- Click to view: form input details, generated headlines, profile data
- Actions: approve (queue for processing), cancel, send results email

### Quality Tab
- AI output quality monitoring
- User ratings with email addresses

### Revenue Tab
- Daily revenue chart, plan breakdown, refund tracking

---

## 14. Project Metrics

| Metric | Value |
|--------|-------|
| Total Lines of Code | ~20,350 |
| Frontend (TypeScript/TSX) | ~13,800 lines |
| Backend (TypeScript) | ~6,550 lines |
| Frontend Pages | 14 |
| Backend Route Files | 4 |
| Git Commits | 110 |
| Database Tables | 7 |
| AI Models Used | 2 (Gemini + Claude) |
| Roast Pipeline Stages | 5 |
| Build Pipeline Stages | 2 |
| Resume Templates | 21 |
| API Endpoints | 30+ |
| Cron Jobs | 3 |
| External Services | 8 (Supabase, Upstash, Razorpay, Resend, Sentry, PostHog, Google AI, Anthropic) |

---

*Document generated on March 31, 2026*
*profileroaster.in — AI-powered LinkedIn optimisation platform*
