# ProfileRoaster — Complete Product Documentation

**Version:** 1.0  
**Last Updated:** April 2026  
**Website:** https://profileroaster.in

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Products & Services](#2-products--services)
3. [Plans & Pricing](#3-plans--pricing)
4. [User Journeys — Step by Step](#4-user-journeys)
5. [Resume Templates (28)](#5-resume-templates)
6. [Interview Prep](#6-interview-prep)
7. [Email Sequences](#7-email-sequences)
8. [Dashboard](#8-dashboard)
9. [Admin Panel](#9-admin-panel)
10. [Referral Codes & Influencer System](#10-referral-codes--influencer-system)
11. [Technical Architecture](#11-technical-architecture)
12. [AI Models & Cost](#12-ai-models--cost)
13. [Security & Privacy](#13-security--privacy)

---

## 1. Product Overview

ProfileRoaster is an AI-powered LinkedIn profile optimization and resume building platform targeting the Indian job market — students, freshers, mid-career professionals, and career changers.

**Three core products:**

| Product | What It Does | Who It's For |
|---------|-------------|-------------|
| **LinkedIn Roast & Rewrite** | Scores, roasts, and rewrites an existing LinkedIn profile | People who already have LinkedIn |
| **Build My LinkedIn** | Creates a complete LinkedIn profile from scratch | People without LinkedIn (students, freshers) |
| **ATS Resume Builder** | Generates job-targeted resumes from LinkedIn/profile data | Everyone — included in paid plans |

**Additional features (included free with every resume):**
- Cover Letter generation
- Interview Prep (15 questions + quiz + cheat sheet)
- AI Enhance button for editing
- TXT export for ATS portals (TCS, Infosys, Wipro)

---

## 2. Products & Services

### 2.1 LinkedIn Roast & Rewrite

**Input:** User pastes their LinkedIn headline (free teaser) and full profile (paid).

**Output:**
- **Score:** Before and after scores (0-100) across 5 dimensions: Headline, About, Experience, Completeness, ATS
- **Roast:** 3 humorous but accurate roast points about what's wrong with the profile (Indian Hinglish humor style)
- **Rewrite:** Complete rewrite of headline (Pro: 5 variations), about section, experience bullets
- **Skills:** Suggested skills ranked by relevance
- **Shareable Card:** Downloadable PNG with score and compliment
- **What AI Loved:** Closing compliment + hidden strengths

**Results Page Layout (LinkedIn-style):**
- Banner with score (before → after)
- Avatar + headline + location
- Roast highlight (expandable to 3)
- Two-column: Left (About, Experience, Skills, Headline Variations, Feedback) | Right (Resume Builder, Quick Actions, What AI Loved, Upgrade)

### 2.2 Build My LinkedIn

**Input:** User fills a form with education, experience, projects, skills, target role.

**Output:**
- **3 Headline Variations** (with style label and "best for" description)
- **Full About Section** (250-400 words, optimized for Indian recruiters)
- **Experience Bullets** (rewritten with action verbs and metrics)
- **Skills** (Technical, Interpersonal, Tools & Platforms)
- **10-Step LinkedIn Setup Guide** (exact menu paths, common mistakes, time estimates)
- **Connection Request Templates** (6 templates: Alumni, Recruiters, Hiring Managers, College Seniors, Internship Coordinators, After Hackathon)
- **Copy Full Profile** button (one-click copy of everything)

**Build Results Page Layout (LinkedIn-style):**
- Banner with first headline variation
- Avatar + name + target role + location
- Two-column: Left (About, Experience, Skills, Headlines, Setup Guide, Feedback) | Right (Resume Builder with count, Copy Full Profile, Connection Templates, Upgrade)

### 2.3 ATS Resume Builder

**Input:** Target role, company (optional), job description (optional — "No specific JD" checkbox available), template selection.

**Output:**
- **ATS-optimized resume** matching the JD keywords
- **ATS Score** with keyword match percentage
- **Keywords Matched / Missing** breakdown
- **Cover Letter** tailored to the same JD
- **28 template designs** to choose from

**Resume Preview Page Layout:**
- Sticky top bar: [PDF] [TXT] [Edit] [Results]
- Template switcher (horizontal pills)
- Two-column: Left sidebar (ATS Score, Keywords, Print Settings, Download, Interview Prep, Cover Letter) | Right (resume preview)
- Cover letter section (full-width below)
- Bottom actions: Generate Another, Back to Results, Dashboard

**Resume Editor Features:**
- Live preview (split panel: edit left, preview right)
- Auto-save (1-second debounce)
- Tabs: Contact, Summary, Experience, Education, Skills, Extras
- Drag-reorder experience entries and bullets
- AI Enhance button (sparkle icon) on Summary, Experience bullets, Achievements
- Campus template: Photo upload, DOB, Gender, Nationality, Father's Name, Declaration fields
- Print Settings: Compact / Standard / Spacious + 1 Page / 2 Pages
- Missing keywords quick-add

### 2.4 Interview Prep

**Input:** Generated automatically from resume data (JD + resume + target role + company).

**Output:**
- **Company Brief:** What JD emphasizes, interview style, what they value, red flags
- **15 Questions:** 5 behavioral + 5 role-specific + 3 situational + 2 culture/motivation
  - Each with: Question, Why they ask, Suggested STAR answer (from resume data), Common mistakes, Follow-up questions
- **5 Questions to Ask Them:** Smart questions for the end of the interview
- **Cheat Sheet:** Key numbers to memorize, 3 power stories, JD keywords, phrases to avoid
- **Quiz:** 10 MCQs with explanations and score

**Adapts to career stage:**
- Fresher (0 jobs): Focus on projects, education, learning ability
- Early career (1-2 jobs): Impact, initiative, growth
- Mid-level (3-5 jobs): Leadership, metrics, strategy
- Senior (5+ jobs): Business outcomes, team building, vision

---

## 3. Plans & Pricing

### 3.1 Roast & Rewrite Plans

| Feature | Standard (Rs 299) | Pro (Rs 799) |
|---------|-------------------|-------------|
| LinkedIn Roast + Rewrite | Full | Full |
| ATS Resume Builder | Any job, 18 templates, PDF + TXT | Any job, all 28 templates |
| Cover Letters | 1 | 3 (one per target job) |
| Headline Variations | 1 | 5 |
| ATS Keyword Matching | Basic | Advanced (15+ keywords) |
| Interview Prep | 1 per resume | 3 per resume |
| Free Rescore | Anytime | Anytime |
| Shareable Roast Card | Yes | Yes |
| Priority Processing | No | Yes |
| **Resume Quota** | 1 resume | 3 resumes |

**Upgrade:** Standard to Pro for Rs 500 (difference payment via Razorpay).

### 3.2 Build Plans

| Feature | Profile Starter (Rs 199) | Profile + Resume (Rs 399) | Profile Pro (Rs 699) |
|---------|--------------------------|--------------------------|---------------------|
| AI-generated headline (3 variations) | Yes | Yes | Yes |
| Professional About section | Yes | Yes | Yes |
| Experience bullets | Yes | Yes | Yes |
| Skills list | Yes | Yes | Yes |
| 10-step setup guide | Yes | Yes | Yes |
| Connection templates | Yes | Yes | Yes |
| Free rescore | Yes | Yes | Yes |
| ATS Resume Builder | No | 18 templates, PDF + TXT | All 28 templates |
| Cover Letter | No | 1 | 3 |
| Interview Prep | No | 1 per resume | 3 per resume |
| **Resume Quota** | 0 | 1 resume | 3 resumes |

### 3.3 Payment

- **Gateway:** Razorpay (UPI, Cards, Net Banking, Wallets)
- **Type:** One-time payment. No subscription. No recurring charges.
- **Currency:** INR (Indian Rupees)
- **Refund:** Available within 7 days per refund policy

---

## 4. User Journeys

### 4.1 Roast & Rewrite Journey

```
profileroaster.in
    |
    v
Paste LinkedIn headline (free)
    |
    v
See teaser: Score + Mini roast (free)
    |
    v
Choose plan: Standard Rs 299 / Pro Rs 799
    |
    v
Paste full LinkedIn profile (Ctrl+A from LinkedIn)
Enter email
    |
    v
Pay via Razorpay (UPI/Card)
    |
    v
Processing page (~90-150 seconds)
Stages: Parsing → Analyzing → Roasting → Rewriting → Quality Check
    |
    v
Results page (LinkedIn-style layout)
- Banner with score
- Roast points
- Full rewrite (copy-paste ready)
    |
    v
Click "Build ATS Resume" (sidebar)
    |
    v
Resume generator form
- Pre-filled from LinkedIn data
- Enter target role + JD (or check "No specific JD")
- Pick template
    |
    v
Resume preview page
- Download PDF / TXT
- Edit in live editor
- AI Enhance (sparkle button)
    |
    v
Click "Prepare for Interview"
    |
    v
Interview prep page (5 tabs)
- 15 questions + answers
- Quiz
- Cheat sheet
```

### 4.2 Build Journey

```
profileroaster.in/build
    |
    v
Choose plan: Starter Rs 199 / Plus Rs 399 / Pro Rs 699
    |
    v
Fill form:
- Name, email, phone, location
- Career stage, target role, industry, tone
- Education (multiple entries)
- Experience / internships
- Projects & portfolio
- Skills, certifications, achievements
- Optional: Upload existing resume (PDF/DOCX) for auto-fill
    |
    v
Pay via Razorpay
    |
    v
Processing page (~60 seconds)
    |
    v
Build results page (LinkedIn-style)
- 3 headline variations
- About section
- Experience bullets
- Skills
- Connection templates
- Setup guide
    |
    v
Click "Build My Resume" (sidebar, Plus/Pro only)
    |
    v
Resume generator → Preview → Edit → Download → Interview Prep
(same flow as Roast)
```

### 4.3 Dashboard Journey

```
profileroaster.in/dashboard
    |
    v
Enter email → Receive OTP → Verify
    |
    v
Dashboard shows:
- Stats: Total orders, Roasts, Builds, Resumes
- Tabs: All | Roasts | Builds | Resumes | Interview Preps
- Each order card with status, score, dates
- Resume cards with role, company, ATS score, JD preview, cover letter badge
- Interview prep cards with role, company, status
- Click any card → opens results/resume/prep page
```

### 4.4 Recovery Journey

```
profileroaster.in/recover
    |
    v
Enter email → See all past orders
- Roast orders with results link
- Build orders with results link
- Click to access results without OTP
```

---

## 5. Resume Templates (28)

### Standard Templates (18 — available to all paid users)

| # | ID | Name | Category | Design |
|---|-----|------|----------|--------|
| 1 | classic | Classic Professional | ATS-Friendly | Single column, clean, horizontal rules, conservative |
| 2 | modern | Modern Accent | ATS-Friendly | Blue accent headers, skill tags |
| 3 | minimal | Minimalist | ATS-Friendly | Ultra-clean, maximum whitespace, centered |
| 4 | compact | Compact Dense | ATS-Friendly | Tight spacing, fits maximum content on 1 page |
| 5 | technical | Technical Developer | ATS-Friendly | Monospace-inspired, code-style headers |
| 6 | bold | Bold Statement | Professional | Large name, green accent bar, high impact |
| 7 | elegant | Elegant Refined | Professional | Serif fonts, diamond separators |
| 8 | executive | Executive Premium | Professional | Formal, centered, gold rule accent |
| 9 | monochrome | Monochrome Prestige | Premium | Pure black and white, strong typography |
| 10 | serif | Professional Serif | Premium | Georgia serif throughout, traditional |
| 11 | headline | Headline Impact | Premium | Oversized summary section |
| 12 | divider | Modern Divider | Premium | Diamond dividers between sections |
| 13 | campus | Campus Placement | India | Photo, DOB, education table, declaration — Indian campus hiring |
| 14 | fresher | Fresher & Intern | India | Purple gradient header, projects-first, education sidebar |
| 15 | salesbd | Sales & BD | India | Dark header, orange accents, metrics-forward |
| 16 | skylight | Skylight Cabin | India | Navy + gold, cabin crew / aviation — photo, languages, certifications first |
| 17 | ramp | Ramp & Terminal | India | Grey sidebar, orange accents — airport ground staff, operations |
| 18 | clinical | Clinical Care | India | Teal accents, certification box — healthcare, nursing, allied health |

### Pro Templates (10 — Pro plan only)

| # | ID | Name | Category | Design |
|---|-----|------|----------|--------|
| 19 | crimson | Crimson Authority | Premium | Deep red accents, commanding |
| 20 | ocean | Ocean Professional | Premium | Teal accents, calm trustworthy |
| 21 | slategold | Slate & Gold | Premium | Dark slate + gold, luxury corporate |
| 22 | indigo | Indigo Modern | Premium | Purple accents, tech/startup |
| 23 | sidebar | Modern Sidebar | Visual | Dark sidebar + clean main content |
| 24 | splitmodern | Split Modern | Visual | Light grey sidebar + skills/education |
| 25 | highlight | Highlight Sections | Visual | Navy header + blue side panel |
| 26 | corporate | Corporate Formal | Visual | Navy header + narrow sidebar |
| 27 | operator | Operator Grid | Visual | Slate header, cyan accents, gridded skills — PMs, founders |
| 28 | editorial | Editorial Canvas | Visual | Warm paper, terracotta accents — marketing, creative roles |

### Template Features

- **Photo upload:** Campus, Skylight Cabin templates support photo upload in editor
- **Personal details:** Campus template has DOB, gender, nationality, father's name, declaration
- **Print Settings:** Compact / Standard / Spacious controls font size and spacing
- **Page control:** 1 Page / 2 Pages setting
- **PDF download:** Opens in new tab → Save as PDF via browser print
- **TXT download:** Plain text for ATS portal paste (TCS, Infosys, Wipro)
- **Live editor:** Auto-save, drag-reorder, AI enhance button

---

## 6. Interview Prep

### How It Works

1. User generates a resume (with target role + JD)
2. Clicks "Prepare for Interview" on resume preview page
3. AI (Gemini 2.5 Flash) generates in ~30 seconds
4. 5-tab report appears

### Tabs

| Tab | Content |
|-----|---------|
| **Company Brief** | What JD emphasizes, interview style (inferred), values, red flags |
| **Questions (15)** | 5 behavioral + 5 role-specific + 3 situational + 2 culture. Each with STAR answer, mistakes, follow-ups |
| **Your Questions (5)** | Smart questions to ask the interviewer at the end |
| **Cheat Sheet** | Key numbers from resume, 3 power stories, JD keywords, avoid/use phrases |
| **Quiz (10 MCQs)** | One-at-a-time, green/red feedback, explanations, final score |

### Rules

- Suggested answers use ONLY facts from the user's resume — no fabrication
- Career stage adapts question difficulty (fresher vs senior)
- Questions reference specific JD phrases
- Free with every resume (no separate payment)

### Quota

| Plan | Interview Preps |
|------|----------------|
| Standard / Plus | 1 per resume generated |
| Pro | 3 (one per resume) |
| Starter (Build) | Not available (no resume) |

---

## 7. Email Sequences

Automated follow-up emails sent to paid users after order completion.

| Day | Email | Purpose | CTA |
|-----|-------|---------|-----|
| 3 | "Did you update your LinkedIn?" | Nudge to paste rewrite | Open My Results |
| 7 | "Your ATS resume is waiting" | Remind about resume builder | Build My Resume |
| 14 | "5 things to do after updating" | Tips + re-engage | View My Results |
| 25 | "Results expire in 5 days" | Urgency (data deletion) | Save My Results Now |
| 30 | "Last chance" | Final push + re-roast CTA | Save Everything Now |

### Controls (Admin Panel)

- **Global pause/resume:** Toggle all sequences on/off
- **Per-user opt-out:** Block specific emails
- **Manual send:** Send specific email to specific order
- **Run now:** Trigger sequence processor manually

---

## 8. Dashboard

**URL:** profileroaster.in/dashboard

### Access

- Enter email → receive OTP via email → verify → see dashboard

### Sections

| Tab | Shows |
|-----|-------|
| **All** | Combined view of all orders |
| **Roasts** | Roast orders with score, title, plan, status, date |
| **Builds** | Build orders with headline, plan, status, date |
| **Resumes** | Resume cards with role, company, template, ATS score, JD preview, cover letter badge |
| **Interview Preps** | Prep cards with role, company, status, date |

### Stats Bar

- Total Orders
- LinkedIn Roasts
- Profile Builds
- Resumes

---

## 9. Admin Panel

**URL:** profileroaster.in/admin

### Tabs

| Tab | Features |
|-----|----------|
| **Overview** | Total orders, revenue, conversion rate, recent orders |
| **Roast Orders** | Order list with detail modal, Reprocess button, Send Email, Approve, Cancel |
| **Build Orders** | Same as roast orders but for build orders, Reprocess button |
| **Teasers** | Free teaser attempts with scores and conversion tracking |
| **Quality** | AI output quality metrics |
| **Revenue** | Revenue breakdown by plan and period |
| **Referrals** | Referral tracking |
| **Emails** | Email sequence controls: global toggle, opt-out list, manual send, run now, recent sends |
| **Codes** | Generate one-time referral codes (Roast/Build, any plan), list all codes, deactivate |
| **Influencers** | Create influencers (name, slug, email), view referral stats, commission tracking |

### Order Actions

- **Reprocess:** Re-enqueue stuck orders (both roast and build)
- **Approve:** Manually mark unpaid orders as paid + process
- **Send Email:** Resend results email
- **Cancel:** Cancel order

---

## 10. Referral Codes & Influencer System

### One-Time Referral Codes

**Purpose:** Give influencers/testers free access to experience the product.

**Flow:**
1. Admin generates code from Admin Panel → Codes tab
2. Code format: `ROAST-PRO-XXXXX` or `BUILD-PLU-XXXXX`
3. User enters code on landing page or build page ("Have a referral code?")
4. Order created as "paid" → processes normally
5. Code marked as redeemed (one-time use only)

**For Roast codes:** User enters email + code + LinkedIn headline → redirects to results page.

**For Build codes:** User enters email + code → redirects to build form → fills form → processes.

### Influencer Referral Links

**Purpose:** Track sales from influencer promotions.

**Flow:**
1. Admin creates influencer: name, slug, email
2. Influencer gets link: `profileroaster.in/?ref=SLUG`
3. Followers click link → purchase normally via Razorpay
4. System tracks: which influencer, which plan, commission earned
5. Influencer gets email notification on each conversion

**Commission (default, editable per influencer):**

| Plan | Commission |
|------|-----------|
| Standard (Rs 299) | Rs 50 |
| Pro (Rs 799) | Rs 100 |
| Build Starter (Rs 199) | Rs 25 |
| Build Plus (Rs 399) | Rs 50 |
| Build Pro (Rs 699) | Rs 100 |

---

## 11. Technical Architecture

### Frontend

- **Framework:** Next.js 16 (App Router)
- **Hosting:** Vercel
- **Styling:** Inline styles (no CSS framework)
- **State:** React useState/useEffect (no Redux)

### Backend

- **Runtime:** Node.js + Express
- **Hosting:** Railway
- **Queue:** BullMQ with Upstash Redis
- **Concurrency:** 8 for roast, 4 for build

### Database

- **Provider:** Supabase PostgreSQL
- **Storage:** Supabase Storage (card images, resume photos)
- **Row Level Security:** Enabled on all tables

### AI Models

| Feature | Model | Provider |
|---------|-------|----------|
| Profile parsing | Gemini 2.5 Flash | Google |
| Analysis, Roast, Rewrite, Quality Check | Claude Sonnet | Anthropic |
| Resume generation | Claude Sonnet | Anthropic |
| Cover letter | Claude Sonnet | Anthropic |
| Build profile generation | Gemini + Claude | Google + Anthropic |
| Teaser (free headline check) | Gemini 2.5 Flash | Google |
| Interview Prep | Gemini 2.5 Flash | Google |
| AI Enhance button | Gemini 2.5 Flash | Google |

### Payments

- **Provider:** Razorpay
- **Methods:** UPI, Credit/Debit Cards, Net Banking, Wallets
- **Webhook:** HMAC-verified webhook for payment confirmation
- **Refunds:** Via Razorpay API from admin panel

### Email

- **Provider:** Resend
- **From:** support@profileroaster.in
- **Templates:** React Email (ResultsEmail, TeaserFollowUpEmail, RefundEmail) + inline HTML for sequences

---

## 12. AI Models & Cost

### Cost Per Plan

| Plan | Revenue | AI Cost | Razorpay Fee | Total Cost | Profit | Margin |
|------|---------|---------|-------------|-----------|--------|--------|
| Standard Rs 299 | Rs 299 | Rs 26 | Rs 6 | Rs 32 | Rs 267 | 89% |
| Pro Rs 799 | Rs 799 | Rs 43 | Rs 16 | Rs 59 | Rs 740 | 93% |
| Build Starter Rs 199 | Rs 199 | Rs 8 | Rs 4 | Rs 12 | Rs 187 | 94% |
| Build Plus Rs 399 | Rs 399 | Rs 16 | Rs 8 | Rs 24 | Rs 375 | 94% |
| Build Pro Rs 699 | Rs 699 | Rs 34 | Rs 14 | Rs 48 | Rs 651 | 93% |

### Interview Prep Cost

- Gemini 2.5 Flash: ~Rs 0.33 per generation
- Free with every resume — negligible impact on margins

### AI Enhance Cost

- Gemini 2.5 Flash: ~Rs 0.002 per enhancement
- Unlimited use — effectively free

---

## 13. Security & Privacy

### Data Protection

- **Row Level Security (RLS):** Enabled on all database tables
- **Data Retention:** Profile data deleted after 30 days (DPDPA compliance)
- **No LinkedIn Login:** Users paste text manually — no OAuth connection
- **AI Processing:** 100% AI — no humans read user profiles
- **Payment Security:** Razorpay PCI-DSS compliant, HMAC webhook verification

### Automated Cleanup (Daily Cron)

- Orders older than 30 days: email masked, sensitive data nullified
- Teaser attempts older than 30 days: deleted
- Events older than 90 days: deleted

### Admin Access

- Session-based authentication with 24-hour TTL
- All admin routes protected by middleware

---

## Appendix: Page URLs

| Page | URL | Description |
|------|-----|-------------|
| Landing | / | Roast & rewrite entry point |
| Build | /build | Build from scratch entry point |
| Build Form | /build/form?plan=xxx | Build form with plan selection |
| Build Results | /build/results/[orderId] | Generated LinkedIn profile |
| Roast Results | /results/[orderId] | Roast + rewrite results |
| Resume Generator | /resume?orderId=xxx | Resume form |
| Resume Preview | /resume/[resumeId] | Resume with templates + download |
| Resume Editor | /resume/[resumeId]/edit | Live editor with AI enhance |
| Interview Prep | /interview-prep/[prepId] | 15 questions + quiz + cheat sheet |
| Pricing | /pricing | Both Roast + Build plans |
| Dashboard | /dashboard | User's orders, resumes, preps |
| Recover | /recover | Find past orders by email |
| Admin | /admin | Admin panel |
| Terms | /terms | Terms of service |
| Privacy | /privacy | Privacy policy |
| Refund | /refund | Refund policy |

---

*End of document.*
