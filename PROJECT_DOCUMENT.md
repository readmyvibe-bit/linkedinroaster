# ProfileRoaster — Complete Project Document

**Website:** profileroaster.in
**Tech Stack:** Next.js 16 + Express.js + TypeScript
**Status:** Live in Production
**Created:** March 2026

---

## 1. Project Overview

ProfileRoaster is an AI-powered SaaS platform that analyzes LinkedIn profiles, delivers brutally honest roasts, rewrites the entire profile for maximum impact, and generates ATS-optimized resumes — all through a single purchase flow.

Users paste their LinkedIn profile text, receive a detailed before/after score, a 6-point comedic roast, a complete professional rewrite, and can then build custom resumes with 20 premium templates.

---

## 2. Lines of Code

| Area | Files | Lines |
|------|-------|-------|
| Backend (TypeScript) | 22 | 5,522 |
| Frontend (TypeScript/TSX) | 16 | 11,731 |
| Database (SQL) | 1 | 107 |
| Stylesheets (CSS) | — | 37 |
| Configuration (JSON, JS, MJS) | — | 244 |
| **Total** | **39+ source files** | **~17,641 lines of application code** |

### Largest Files
- `frontend/components/resume/ResumeTemplates.tsx` — 2,614 lines (20 resume templates)
- `frontend/app/results/[orderId]/page.tsx` — 2,528 lines (full results dashboard)
- `backend/src/ai/pipeline.ts` — 1,562 lines (5-stage AI pipeline)
- `frontend/app/page.tsx` — 1,567 lines (landing page)
- `frontend/app/admin/page.tsx` — 1,196 lines (admin dashboard)
- `frontend/app/resume/[resumeId]/edit/page.tsx` — 1,065 lines (live resume editor)

---

## 3. Project Complexity Rating

### Overall: Advanced

| Dimension | Rating | Justification |
|-----------|--------|---------------|
| **Architecture** | Advanced | Full-stack monorepo with async job queue (BullMQ + Redis), webhook-driven payment flow, multi-stage AI pipeline, server-side image generation, PDF/DOCX export |
| **AI Integration** | Advanced | Multi-model orchestration (Gemini + Claude), 5-stage chained pipeline with retry logic, prompt engineering with safety guardrails, quality control loop, profile fingerprinting to avoid redundant API calls |
| **Frontend** | Advanced | Complex state management, real-time preview editors, drag-to-reorder, smart PDF auto-fit with iframe measurement, 20 template renderers with dual output (JSX + HTML print), responsive 3-column layouts |
| **Backend** | Advanced | Express with typed routes, BullMQ job processing, cron jobs, Satori-based image generation (React.createElement → SVG → PNG), Razorpay webhook verification, OTP recovery flow |
| **Database** | Intermediate | PostgreSQL (Supabase) with JSONB columns for flexible AI output storage, proper indexes, auto-update triggers, referral tracking |
| **DevOps** | Intermediate | Vercel (frontend) + Railway (backend), Upstash Redis, Supabase PostgreSQL, Sentry error tracking, PostHog analytics |
| **Security** | Intermediate-Advanced | HMAC webhook verification, SHA-256 profile fingerprinting, session-based admin auth, OTP email verification, rate limiting (IP + localStorage + content hash), input validation |

---

## 4. AI Usage — Advanced Level

### Multi-Model Architecture
ProfileRoaster uses **two different AI providers** strategically:

- **Google Gemini (gemini-2.0-flash)** — Used for structured data extraction tasks:
  - Stage 1: Profile parsing (raw text → structured JSON)
  - Stage 2: Deep analysis (scoring, ATS intelligence, buzzword detection)
  - Stage 5: Quality control (safety check, content validation)

- **Anthropic Claude (claude-sonnet)** — Used for creative and professional writing:
  - Stage 3: Roast generation (6 comedic roast points + hidden strength + closing compliment)
  - Stage 4/4b: Profile rewrite (headline, about, experience — standard and pro variants)
  - Resume generation (merging LinkedIn data + uploaded resume + job description)
  - Cover letter generation
  - Teaser analysis (free headline scoring)

### 5-Stage AI Pipeline

```
Raw Text → [Stage 1: Parse] → [Stage 2: Analyze] → [Stage 3: Roast] → [Stage 4: Rewrite] → [Stage 5: QC]
              Gemini              Gemini              Claude              Claude              Gemini
```

Each stage has:
- **Exponential backoff retry** with up to 3 attempts
- **Timeout protection** (per-stage limits)
- **JSON repair** (jsonrepair library for malformed AI responses)
- **Processing status tracking** (queued → parsing → analyzing → roasting → rewriting → checking → done)
- **Error monitoring** via Sentry

### AI Safety Guardrails
- Prohibited content regex checks (profanity, identity-based language)
- Quality control stage validates roast tone, checks for fabricated data
- Resume generation explicitly instructed not to fabricate education/certifications
- ATS score capping prevents unrealistic score jumps
- Industry estimates allowed but exact fabricated numbers rejected

### Cost Optimization
- **Profile fingerprinting**: SHA-256 hash of normalized profile text — if duplicate found, reuses previous AI results (saves ~$0.15-0.30 per duplicate)
- **Teaser caching**: Identical headlines return cached results from Redis
- **3-layer rate limiting**: Prevents abuse of the free teaser feature

---

## 5. Complete Feature List

### Free Tier (No Payment)
- LinkedIn headline analysis with AI score (0-100)
- Quick roast preview (teaser)
- Full landing page experience with Hinglish roast quotes
- Score transformation examples

### Standard Plan (Rs 299)
- **Full 6-Point Roast**: Brutally honest, comedic analysis of the entire profile
- **Before/After Score**: Weighted scoring across headline (23%), about (32%), experience (27%), completeness (8%), ATS (10%)
- **Complete Profile Rewrite**: Rewritten headline, about section, and experience bullets
- **Hidden Strength Discovery**: AI identifies one overlooked strength with evidence
- **Closing Compliment**: Genuine encouragement after the roast
- **Shareable Roast Card**: Branded PNG image for social sharing
- **Downloadable Roast Sheet**: 6-point roast report as PNG
- **ATS Resume Builder**: 1 resume generation with 12 templates
- **PDF & DOCX Export**: Smart auto-fit for 1-2 page resumes
- **Results Email**: Complete results delivered to inbox
- **Result Recovery**: OTP-based access recovery if link is lost

### Pro Plan (Rs 799)
Everything in Standard, plus:
- **5 Headline Variations**: Multiple rewritten headline options ranked by impact
- **10+ ATS Keywords**: Industry-specific keyword recommendations
- **Job-Description Targeting**: Upload a JD for tailored rewrite
- **3 Resume Generations**: Build resumes for different roles
- **All 20 Templates**: Access to 8 additional Pro-exclusive premium templates
- **Cover Letter**: Auto-generated cover letter alongside each resume
- **Priority Processing**: Faster queue position

### Resume Builder Features (Both Plans)
- **20 Professional Templates**: Classic, Modern, Executive, Creative, Technical, Minimalist, Bold, Elegant, Corporate, Professional, Academic, Startup, Impact, Luxe, Nordic, Sidebar, Metro, Chronicle, Cascade, Zenith
- **Live Editor**: 6-tab interface (Personal, Summary, Experience, Education, Skills, Certifications)
- **Drag-to-Reorder**: Rearrange experience and education entries
- **Auto-Fill from Upload**: Upload existing resume (PDF/DOCX) and auto-populate fields
- **Template Preview**: Real-time preview with template switching
- **ATS Score Widget**: Real-time ATS compatibility check
- **Smart PDF Auto-Fit**: Hidden iframe measurement → CSS spacing adjustment for page fitting
- **Two-Column Templates**: Absolute-positioned sidebar backgrounds for clean PDF export

### Admin Panel
- Secure login with session tokens
- Full order management (view, approve, cancel, refund)
- Resume management (list, send email, delete)
- Conversion funnel analytics
- Pipeline stage monitoring
- Average processing time dashboard
- User ratings with email addresses
- Manual order operations

### Infrastructure Features
- **Async Job Queue**: BullMQ + Redis for non-blocking order processing
- **3 Cron Jobs**: Data cleanup (daily), teaser follow-up emails (daily), stuck order auto-cancel (every 10 min)
- **Payment Integration**: Razorpay with webhook verification, upgrade flow (Standard → Pro for Rs 500 difference)
- **Email System**: Resend-powered transactional emails (results, follow-up, refund)
- **Error Tracking**: Sentry integration for backend errors
- **Analytics**: PostHog event tracking, custom analytics service
- **Image Generation**: Satori (React → SVG) + Resvg (SVG → PNG) for shareable cards
- **File Storage**: Supabase Storage for generated card images

---

## 6. Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│              Next.js 16 (Vercel)                     │
│                                                      │
│  Landing Page ──→ Razorpay Checkout ──→ Results Page │
│                                                      │
│  Resume Form ──→ Resume Preview ──→ Live Editor      │
│                                                      │
│  Admin Panel   Recovery Page   Terms/Privacy/Refund  │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────┐
│                    BACKEND                           │
│             Express.js (Railway)                     │
│                                                      │
│  Routes: /api/orders, /api/admin, /api/resume        │
│  Webhook: /api/razorpay-webhook                      │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐   │
│  │  BullMQ  │  │  Cron    │  │  Card Generator  │   │
│  │  Queue   │  │  Jobs    │  │  (Satori+Resvg)  │   │
│  └────┬─────┘  └──────────┘  └─────────────────┘   │
│       │                                              │
│  ┌────▼──────────────────────────────────────────┐  │
│  │           5-STAGE AI PIPELINE                  │  │
│  │  Parse → Analyze → Roast → Rewrite → QC       │  │
│  │  (Gemini)  (Gemini) (Claude) (Claude) (Gemini) │  │
│  └───────────────────────────────────────────────┘  │
└──────────┬──────────┬──────────┬────────────────────┘
           │          │          │
     ┌─────▼──┐  ┌───▼───┐  ┌──▼────┐
     │Supabase│  │Upstash│  │Resend │
     │PostgreS│  │ Redis │  │ Email │
     │  + S3  │  │       │  │       │
     └────────┘  └───────┘  └───────┘
```

### Database Schema (4 Tables)
1. **orders** — 40+ columns: payment, processing status, AI results (JSONB), scoring, UTM tracking, upgrade flow
2. **teaser_attempts** — Free headline submissions with conversion tracking
3. **referrals** — Referral code system with earnings tracking
4. **events** — Analytics event log

### Dependencies
- **Backend**: 34 production dependencies (Express, BullMQ, Anthropic SDK, Google AI, Razorpay, Sentry, Satori, Resend, PostHog, etc.)
- **Frontend**: 13 production dependencies (Next.js, React, Razorpay)

---

## 7. Scoring Algorithm

The profile score is calculated across 5 weighted dimensions:

| Dimension | Weight | Factors |
|-----------|--------|---------|
| Headline | 23% | Length, structure separators, non-generic opener, AI score |
| About | 32% | Length, metrics presence, formatting, AI score, buzzword penalty |
| Experience | 27% | Entry count, description quality, quantification, passive voice penalty |
| Completeness | 8% | Presence of headline, about, experience, skills, education |
| ATS | 10% | Keyword match rate, weak verb count, quantification percentage |

**After-score capping**: Maximum 60-point improvement, ceiling of 97, natural variance of +/-3 for realism, guaranteed minimum 10-point improvement.

---

## 8. User Benefits

1. **Honest Feedback**: Most LinkedIn users never get real feedback — ProfileRoaster delivers it with humor
2. **Actionable Rewrites**: Not just criticism — complete rewritten sections ready to copy-paste
3. **ATS Optimization**: Score and keyword recommendations based on industry standards
4. **Resume Generation**: Skip hours of formatting — AI generates role-targeted resumes from existing profile data
5. **Multiple Templates**: 20 professional designs covering every industry and aesthetic preference
6. **Time Savings**: Full profile analysis + rewrite + resume in under 90 seconds (vs. hours with a human consultant)
7. **Affordable**: Rs 299-799 vs. Rs 5,000-15,000 for LinkedIn optimization services
8. **Shareable Results**: Branded cards for social media sharing (organic marketing for users)
9. **Privacy-First**: No LinkedIn login required — just paste text

---

## 9. Revenue Model

| Plan | Price | Features |
|------|-------|----------|
| Standard | Rs 299 (~$3.50) | Full roast + rewrite + 1 resume (12 templates) |
| Pro | Rs 799 (~$9.50) | Everything + 5 headlines + ATS keywords + 3 resumes (20 templates) + cover letter |
| Upgrade | Rs 500 (~$6.00) | Standard → Pro upgrade (difference payment) |

**Monetization levers**: Referral system (built but available for activation), UTM tracking for campaign ROI.

---

## 10. Project Metrics Summary

| Metric | Value |
|--------|-------|
| Total Lines of Code | ~17,600 |
| Source Files | 39+ |
| Git Commits | 93 |
| Database Tables | 4 |
| AI Models Used | 2 (Gemini + Claude) |
| AI Pipeline Stages | 5 |
| Resume Templates | 20 |
| API Endpoints | 25+ |
| Cron Jobs | 3 |
| External Services | 8 (Supabase, Upstash, Razorpay, Resend, Sentry, PostHog, Google AI, Anthropic) |
| E2E Test Gates | 18 |

---

## 11. Project Rating

| Category | Score (out of 10) |
|----------|:-----------------:|
| Code Quality | 8/10 |
| Architecture Design | 8.5/10 |
| AI Sophistication | 9/10 |
| Feature Completeness | 9/10 |
| User Experience | 8.5/10 |
| Security | 7.5/10 |
| Testing | 6.5/10 |
| Documentation | 6/10 |
| Scalability | 7.5/10 |
| **Overall** | **8/10** |

**Verdict**: This is a production-grade, commercially viable SaaS product with advanced AI integration. The multi-model pipeline, async job processing, and comprehensive feature set place it well above typical side projects. The codebase demonstrates strong architectural decisions (separation of concerns, typed interfaces, safety guardrails) while maintaining rapid development velocity (93 commits across ~17,600 lines in a short timeframe).

---

*Document generated on March 31, 2026*
