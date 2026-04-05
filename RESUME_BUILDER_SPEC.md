# ProfileRoaster — ATS Resume Builder
# Complete Technical Specification

---

## Overview

A complete ATS resume builder integrated into ProfileRoaster. Users who purchase the Pro plan get access to build tailored ATS-optimized resumes using their already-rewritten LinkedIn profile data + any job description they paste.

**Competitive Advantage:** Unlike Teal HQ or other resume builders that start from scratch, we start with AI-optimized content (rewritten headline, about, experience, ATS keywords) from the LinkedIn roast pipeline. This means 80% of the resume is already done before the user touches anything.

---

## Build Sessions

### Session 1 — Core MVP (Deployable)
- Database tables
- Backend API (generate, fetch, save, download)
- AI resume generation with Claude Sonnet
- Pre-generation form page (/resume)
- Resume preview page (/resume/[resumeId])
- Classic template
- PDF download
- ATS score display
- Results page integration button

### Session 2 — Editor & Templates
- Live two-panel editor (edit left, preview right)
- Tab navigation (Contact, Summary, Experience, Education, Skills, Extras)
- Collapsible experience cards
- Add/remove bullets
- Real-time preview updates
- Auto-save with debounce
- Modern template
- Minimal template
- Section regeneration API (regenerate just summary or bullets)

### Session 3 — Polish & Advanced
- DOCX download
- Drag-to-reorder bullets and sections
- Missing keyword quick-add buttons
- Template switching in editor
- Mobile responsive editor
- Pricing tier update
- Share resume link feature

---

## Architecture

### New Files

```
frontend/
  app/
    resume/
      page.tsx                    — Pre-generation form
      [resumeId]/
        page.tsx                  — Resume preview (read-only, Session 1)
        edit/
          page.tsx                — Live editor (Session 2)
  components/
    resume/
      ResumePreview.tsx           — Preview renderer
      ResumeTemplate.tsx          — Template switcher
      ResumeEditor.tsx            — Editor panel (Session 2)
      ATSScoreWidget.tsx          — ATS score circle + keywords
      TemplateClassic.tsx         — Classic template
      TemplateModern.tsx          — Modern template (Session 2)
      TemplateMinimal.tsx         — Minimal template (Session 2)

backend/
  src/
    routes/
      resume.ts                   — All resume API endpoints
    services/
      resume-generator.ts         — Claude AI resume generation
      resume-pdf.ts               — PDF generation
      resume-docx.ts              — DOCX generation (Session 3)
```

### Files NOT Modified
- pipeline.ts
- card-generator.tsx
- Any existing route in index.ts
- Any existing component
- Any existing database table

---

## Database Schema

### Table: resumes

```sql
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  email TEXT NOT NULL,
  job_description TEXT,
  target_role TEXT,
  target_company TEXT,
  template_id TEXT DEFAULT 'classic',
  page_count INTEGER DEFAULT 2,
  resume_data JSONB NOT NULL,
  ats_score INTEGER DEFAULT 0,
  keywords_matched JSONB DEFAULT '[]',
  keywords_missing JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft',
  pdf_url TEXT,
  docx_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_order_id ON resumes(order_id);
CREATE INDEX IF NOT EXISTS idx_resumes_email ON resumes(email);
```

### Table: resume_waitlist

```sql
CREATE TABLE IF NOT EXISTS resume_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### resume_data JSONB Structure

```json
{
  "contact": {
    "name": "Avinakshi Sharma",
    "email": "avi@gmail.com",
    "phone": "+91 9876543210",
    "location": "Mumbai, Maharashtra",
    "linkedin": "linkedin.com/in/avinakshi",
    "website": ""
  },
  "summary": "7x Hall of Fame winning Customer Success Manager with 6.5+ Crores revenue generation...",
  "experience": [
    {
      "id": "uuid-1",
      "company": "Koenig Solutions Pvt. Ltd.",
      "role": "Senior Customer Success Manager",
      "location": "Delhi, India",
      "start_date": "Jan 2020",
      "end_date": "Present",
      "current": true,
      "bullets": [
        "Managed strategic relationships with 30+ global corporate clients, maintaining 92%+ retention rate",
        "Achieved 7 consecutive Hall of Fame recognitions for exceptional performance",
        "Generated 6.5+ Crores in total revenue through strategic upselling"
      ]
    }
  ],
  "education": [
    {
      "id": "uuid-2",
      "institution": "Delhi University",
      "degree": "Bachelor of Commerce",
      "field": "Commerce",
      "year": "2018",
      "gpa": ""
    }
  ],
  "skills": {
    "technical": ["Salesforce", "HubSpot", "Microsoft Office", "CRM"],
    "soft": ["Client Relationship Management", "Strategic Planning", "Negotiation"],
    "languages": ["English", "Hindi"],
    "certifications": ["AWS Certified", "Google Analytics"]
  },
  "achievements": [
    "7x Hall of Fame Award Winner",
    "Generated 6.5+ Crores cumulative revenue"
  ],
  "custom_sections": []
}
```

---

## API Endpoints

### POST /api/resume/generate

Creates a new resume from order data + job description.

**Request:**
```json
{
  "orderId": "uuid",
  "userDetails": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "website": "string"
  },
  "targetRole": "Senior Customer Success Manager",
  "targetCompany": "Google",
  "jobDescription": "Full JD text...",
  "additionalAchievements": "Won best employee 2023...",
  "certifications": ["AWS", "PMP"],
  "languages": ["English", "Hindi"],
  "noticePeriod": "30 days",
  "experienceYears": "5-8 yr",
  "templateId": "classic",
  "pageCount": 2
}
```

**Response:**
```json
{
  "resumeId": "uuid",
  "ats_score": 84,
  "keywords_matched": ["Client Retention", "CRM", "B2B"],
  "keywords_missing": ["SaaS", "Churn"],
  "status": "generated"
}
```

**Processing Pipeline:**
1. Fetch order from DB → get rewritten content
2. Validate order is Pro plan and processing_status = done
3. Send to Claude Sonnet with resume prompt
4. Parse JSON response
5. Run ATS keyword analysis (JD keywords vs resume content)
6. Save to resumes table
7. Return resumeId

### GET /api/resume/:resumeId

Fetch resume data for viewing/editing.

**Response:** Full resume row from DB including resume_data, ats_score, keywords.

### PATCH /api/resume/:resumeId

Auto-save edits.

**Request:**
```json
{
  "resume_data": { ... updated JSON ... }
}
```

**Response:**
```json
{
  "saved": true,
  "updated_at": "timestamp"
}
```

### POST /api/resume/:resumeId/regenerate-section

Regenerate one section using AI.

**Request:**
```json
{
  "section": "summary" | "bullets" | "skills",
  "jobDescription": "JD text",
  "context": { ... any additional context ... }
}
```

**Response:**
```json
{
  "section": "summary",
  "content": "Regenerated summary text..."
}
```

### GET /api/resume/:resumeId/download/pdf

Generate PDF and return file.

**Response:** PDF file download (Content-Type: application/pdf)

### GET /api/resume/:resumeId/download/docx

Generate DOCX and return file. (Session 3)

**Response:** DOCX file download

### POST /api/resume/:resumeId/ats-check

Re-run ATS analysis after user edits.

**Request:**
```json
{
  "jobDescription": "original JD"
}
```

**Response:**
```json
{
  "score": 87,
  "keywords_matched": [...],
  "keywords_missing": [...],
  "recommendations": [...]
}
```

---

## AI Resume Generation Prompt

```
SYSTEM:
You are an expert ATS resume writer with 15 years experience placing candidates at Fortune 500 companies. You write resumes that score 90%+ on every ATS system.

Return ONLY valid JSON. No markdown. No explanation. Just the JSON object.

USER:
Build a complete ATS optimized resume.

TARGET ROLE: {targetRole}
TARGET COMPANY: {targetCompany}

LINKEDIN REWRITE DATA (already AI-optimized):
Headline: {rewritten_headline}
About: {rewritten_about}
Experience: {JSON.stringify(rewritten_experience)}
ATS Keywords identified: {ats_keywords}

ADDITIONAL INFO FROM USER:
Name: {name}
Email: {email}
Phone: {phone}
Location: {location}
LinkedIn: {linkedin}
Achievements: {additionalAchievements}
Certifications: {certifications}
Languages: {languages}
Total Experience: {experienceYears}

JOB DESCRIPTION:
{jobDescription}

STRICT ATS RULES:
1. No tables, no columns, no text boxes, no graphics
2. Standard section headers ONLY: PROFESSIONAL SUMMARY, WORK EXPERIENCE, EDUCATION, SKILLS, CERTIFICATIONS
3. All dates in MMM YYYY format (e.g., Jan 2020 — Present)
4. Every bullet starts with a strong action verb (Managed, Achieved, Generated, Led, Built, Reduced, Increased, Delivered, Designed, Implemented)
5. Every bullet must include a metric, number, or measurable outcome
6. Keywords from JD must appear naturally in summary, bullets, and skills — not forced
7. Summary is 3-4 sentences maximum, written in first person without "I"
8. Skills grouped by category (Technical, Soft Skills, Languages, Certifications)
9. Maximum {pageCount} pages of content
10. Use exact company names and job titles from the LinkedIn data — never change them
11. If a metric is missing, use a realistic industry estimate with a note format

KEYWORD ANALYSIS:
Extract ALL important keywords and phrases from the job description.
For each, note whether it appears in the resume content.
Calculate match percentage.
Provide 3-5 specific recommendations to improve the score.

OUTPUT FORMAT (strict JSON):
{
  "contact": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "website": ""
  },
  "summary": "3-4 sentence professional summary...",
  "experience": [
    {
      "id": "generate-uuid",
      "company": "exact company name",
      "role": "exact role title",
      "location": "city, country",
      "start_date": "MMM YYYY",
      "end_date": "Present or MMM YYYY",
      "current": true/false,
      "bullets": ["Strong verb + metric + outcome", ...]
    }
  ],
  "education": [
    {
      "id": "generate-uuid",
      "institution": "",
      "degree": "",
      "field": "",
      "year": "YYYY",
      "gpa": ""
    }
  ],
  "skills": {
    "technical": [],
    "soft": [],
    "languages": [],
    "certifications": []
  },
  "achievements": [],
  "custom_sections": [],
  "ats_analysis": {
    "score": 0-100,
    "keywords_matched": ["keyword1", "keyword2"],
    "keywords_missing": ["keyword3", "keyword4"],
    "recommendations": [
      "Add 'Client Retention' to your skills section",
      "Mention 'B2B Sales' in your professional summary"
    ]
  }
}
```

---

## Template Specifications

### Template 1 — Classic

```
Page: A4 (794px wide for screen, 210mm for print)
Margins: 40px all sides (screen), 20mm all sides (print)
Font: Inter or Arial fallback

HEADER:
  Name: 28px, bold, #111827, left aligned
  Contact row: 11px, #555, flex row with bullet separators
    email • phone • location • linkedin

DIVIDER: 1px solid #D1D5DB, margin 12px 0

SECTION HEADER:
  Text: 11px, bold, #374151, uppercase, letterSpacing 2px
  Bottom border: 1px solid #E5E7EB
  Margin: 20px 0 8px 0

PROFESSIONAL SUMMARY:
  Text: 11px, #374151, lineHeight 1.6
  Margin bottom: 4px

EXPERIENCE ENTRY:
  Role + Company row: flex space-between
    Left: "Role — Company" 12px, bold, #111827
    Right: "MMM YYYY — Present" 11px, italic, #666
  Location: 11px, #888, margin bottom 4px
  Bullets: 11px, #374151, lineHeight 1.5
    Bullet char: • (standard)
    Indent: 16px
    Margin: 2px 0

EDUCATION ENTRY:
  Degree + Institution: 12px, bold, #111827
  Field + Year: 11px, #666
  GPA if present: 11px, #666

SKILLS:
  Category label: 11px, bold, #374151
  Skills: 11px, #374151, comma separated
  One line per category

ACHIEVEMENTS:
  Bullet list: 11px, #374151
```

### Template 2 — Modern (Session 2)

```
Same page/margin specs as Classic.

LEFT ACCENT: 4px solid #0A66C2 running full page height (left edge)

HEADER:
  Name: 26px, bold, #0A66C2
  Contact: 11px, flex row, separators: " | "

SECTION HEADER:
  Text: 12px, bold, #0A66C2
  No border, color only differentiates

SKILLS:
  Shown as pill tags:
    background: #EFF6FF
    color: #1D4ED8
    borderRadius: 4px
    padding: 2px 8px
    fontSize: 10px
    display: inline-flex, gap 4px, flexWrap

Everything else same structure as Classic.
```

### Template 3 — Minimal (Session 2)

```
Same page/margin specs, extra whitespace.

HEADER:
  Name: 24px, bold, #111827, CENTER aligned
  Contact: 11px, #888, CENTER aligned

SECTION HEADER:
  Text: 10px, #9CA3AF, uppercase, letterSpacing 4px
  Divider: 0.5px solid #E5E7EB

SPACING:
  Section gap: 28px (vs 20px in Classic)
  Entry gap: 16px (vs 12px in Classic)
  Overall feeling: very airy

Everything else same structure.
```

---

## Pre-Generation Form Design

### Page: /resume?orderId=xxx

```
Background: #F3F2EF
Max width: 680px, centered
Card: white, rounded 12px, li-shadow

HEADER:
  background: #004182
  padding: 16px 24px
  borderRadius: 12px 12px 0 0
  Title: "Build Your ATS Resume" — white, 18px, bold
  Subtitle: "Tailored to your target job" — white/70%, 13px

FORM SECTIONS (inside white card):

Section 1 — Your Details
  Heading: "Your Details" — 14px, bold, #191919
  Subtitle: "Pre-filled from your LinkedIn" — 12px, #888

  Fields (2 column grid on desktop, 1 on mobile):
  - Full Name (text, required)
  - Email (email, required, pre-filled)
  - Phone Number (tel, required)
  - Location (text, required, placeholder: "Mumbai, Maharashtra")
  - LinkedIn URL (url, pre-filled)
  - Portfolio/Website (url, optional)

Section 2 — Target Job
  Heading: "Target Job" — 14px, bold, #191919

  Fields:
  - Target Role (text, required)
    placeholder: "What role are you applying for?"
  - Target Company (text, optional)
    placeholder: "Company name (optional)"
  - Job Description (textarea, required, min 100 chars)
    placeholder: "Paste the complete job description here..."
    Show character count below
    rows: 8

Section 3 — Additional Info (collapsible, optional)
  Heading: "Additional Details (Optional)" — 14px, bold, #191919
  Click to expand/collapse

  Fields:
  - Key Achievements (textarea, optional)
    placeholder: "Any achievements not on your LinkedIn?"
  - Certifications (tag input — type + Enter to add, click to remove)
  - Languages Known (tag input)
  - Total Experience (dropdown: 0-1, 1-3, 3-5, 5-8, 8-12, 12+)
  - Notice Period (dropdown: Immediate, 15d, 30d, 45d, 60d, 90d)

Section 4 — Preferences
  Template: 3 radio cards with preview thumbnails
    - Classic (selected by default)
    - Modern
    - Minimal

  Resume Length: Radio — 1 Page / 2 Pages (default)

GENERATE BUTTON:
  "Generate My ATS Resume →"
  width: 100%
  background: #0A66C2
  color: white
  padding: 14px
  borderRadius: 50px
  fontSize: 16px, fontWeight: 700

  Loading state: "Generating... (30-45 seconds)"
  Show progress: Analyzing JD → Matching keywords → Building resume → Scoring ATS
```

---

## Resume Preview Page Design

### Page: /resume/[resumeId]

```
Background: var(--bg-canvas) / #F4F6F9

HEADER (sticky, two rows):
  Row 1 — breadcrumb + primary actions
    Left: ← Results › Resume · ATS badge (score)
    Right: [Download PDF] [Edit] [TXT]
           [Interview Prep ▼]  — opens level picker (Auto-detect, Entry, Mid, Senior, Lead)
           [Dashboard]
    Behavior: Prep uses prepLoading ("Starting…") to avoid double window.open on rapid clicks.
              Level picker wrapped in [data-level-picker-root]; mousedown outside closes it.

  Row 2 — target role + print controls
    Left: target_role (+ target_company when set)
    Right: [Template ▼] opens modal (categories, recommended, Pro lock)
           <select> Compact | Standard | Spacious  — PATCH resume_data.printSize
           <select> 1 Page | 2 Pages               — PATCH resume_data.fitOnePage
    PDF: density + fitOnePage applied in buildPrintHTML injection (spacious: body line-height
         + .print-content-root .entry margin; avoid broad div[style*="margin-bottom"] selectors)

MAIN (max-width ~1320, padding; flex row from md+):
  LEFT COLUMN (hidden on small screens — md:flex, sticky ~top 120):
    Card: ATS Insights — score ring, label, match bar, checklist, [View keywords] toggle
          → Matched / Missing keyword pills when expanded
    Card: Cover Letter — Copy, Cover Letter PDF (or "No cover letter" callout)
    Card: Details — Role, Company, Template name, Density (print size label)

  RIGHT — preview well:
    Gray well, white surface, shadow; renderResumeHTML(resume_data, templateId)
    Pro-only template: overlay + upgrade CTA
    resume_data includes achievements[] → templates render Key achievements / KEY ACHIEVEMENTS

OPTIONAL BAND:
  Full-width cover letter card below main when cover_letter present

FOOTER:
  [Generate Another Resume] [Back to Results] [Dashboard]

MOBILE (sm and below):
  Sticky bottom bar: Download PDF | Edit | Prep ▼ (same level picker pattern)
  No left rail — ATS + cover stack in scroll or rely on header only (see page.tsx)
```

Animated demo wireframe: `profileroaster-demo.html` scene 8 mirrors this layout (including Key achievements in the mock resume and control labels).

---

## Live Editor Page Design (Session 2)

### Page: /resume/[resumeId]/edit

```
Full viewport, no scroll on body.

TWO PANEL LAYOUT:
  Left: 45% — Editor panel (scrollable)
  Right: 55% — Live preview (scrollable independently)
  Divider: 1px solid #E0E0E0 (draggable in future)

TOP BAR:
  Same as preview page but with:
  [Save Status] "Saved" / "Saving..." / "Unsaved changes"
  [Template: Classic ▼] dropdown
  [Download PDF]
  [Back to Preview]

LEFT PANEL — EDITOR:
  background: white
  padding: 16px

  TAB BAR:
    [Contact] [Summary] [Experience] [Education] [Skills] [Extras]
    Active tab: blue underline
    Each tab shows relevant form fields

  TAB: Contact
    Same fields as pre-generation form contact section
    All editable, auto-save on change

  TAB: Summary
    Large textarea (rows 6)
    Character count: "342 / 500 recommended"
    [AI: Regenerate Summary] button
      Calls POST /api/resume/:id/regenerate-section
      Shows loading, replaces content

  TAB: Experience
    Each job as a collapsible card:
      Header: Role at Company (click to expand/collapse)
      Expanded:
        - Role (input)
        - Company (input)
        - Location (input)
        - Start Date (input, MMM YYYY)
        - End Date (input or "Present" toggle)
        - Bullets section:
          Each bullet: textarea (auto-height)
          [×] remove button on hover
          Drag handle on left (Session 3)
          [+ Add Bullet] button at bottom
        [AI: Improve Bullets] button

    [+ Add New Position] button at bottom of all jobs
    [Delete Position] red text link in each card

  TAB: Education
    Similar card layout
    Institution, Degree, Field, Year, GPA
    [+ Add Education] button
    [Delete] option

  TAB: Skills
    4 sections with tag inputs:
      Technical Skills: [React] [Node.js] [+]
      Soft Skills: [Leadership] [Communication] [+]
      Languages: [English] [Hindi] [+]
      Certifications: [AWS] [PMP] [+]

    [AI: Suggest Skills from JD] button
    Shows suggested skills as gray pills
    Click to add to resume

  TAB: Extras
    Achievements: bullet text inputs
    Custom Sections: title + textarea pairs
    [+ Add Section] button

RIGHT PANEL — LIVE PREVIEW:
    Same as preview page resume rendering
    Updates in real-time (no delay)
    ATS score mini-widget at top (just number + color)
    Scroll independent of editor
    Template matches selected template
```

---

## PDF Generation

### Technical Approach

Use HTML → PDF conversion. Render the resume template as HTML string, convert to PDF using a library.

**Option A: Browser print (client-side)**
- window.print() with @media print CSS
- Simplest, no backend needed
- User controls print settings

**Option B: Puppeteer (server-side)**
- Launch headless Chrome
- Render HTML page
- Generate PDF with exact styling
- More control over output

**Option C: React-pdf (server-side)**
- @react-pdf/renderer
- JSX-based PDF generation
- No browser needed
- Good for structured content like resumes

**Recommendation:** Option A for Session 1 (fastest), Option B or C for Session 2+ (better quality).

### PDF Specifications

```
Size: A4 (210mm × 297mm)
Margins: 20mm all sides
Font: Arial / Helvetica (universal ATS compatibility)
Font sizes:
  Name: 18pt
  Section headers: 11pt
  Body: 10pt
  Contact: 9pt
Line height: 1.4
Color: #000000 for all text (ATS safe)
No images, no color blocks, no borders in print
Page numbers: "Page 1 of 2" bottom center, 8pt
Footer: "Generated by profileroaster.in" 7pt, gray, bottom right
```

---

## ATS Score Algorithm

```javascript
function calculateATSScore(resumeText, jobDescription) {
  // 1. Extract keywords from JD
  const jdKeywords = extractKeywords(jobDescription);
  // Remove common words (the, and, or, etc.)
  // Keep: skills, tools, technologies, qualifications
  // Keep: action verbs, industry terms

  // 2. Check which keywords appear in resume
  const matched = jdKeywords.filter(kw =>
    resumeText.toLowerCase().includes(kw.toLowerCase())
  );
  const missing = jdKeywords.filter(kw =>
    !resumeText.toLowerCase().includes(kw.toLowerCase())
  );

  // 3. Calculate base score
  const matchRate = matched.length / jdKeywords.length;
  let score = Math.round(matchRate * 70); // keywords = 70% of score

  // 4. Format bonuses (30% of score)
  const formatScore = checkFormat(resumeText);
  // +5: Has quantified bullets (numbers/percentages)
  // +5: Uses action verbs
  // +5: Has proper section headers
  // +5: Summary present and concise
  // +5: Skills section present
  // +5: Proper date formatting
  score += formatScore;

  return {
    score: Math.min(score, 100),
    keywords_matched: matched,
    keywords_missing: missing,
    total_keywords: jdKeywords.length,
    match_rate: Math.round(matchRate * 100),
    recommendations: generateRecommendations(missing)
  };
}
```

---

## Results Page Integration

### For Pro Users (plan === 'pro')

Add after rewrite section, before share section:

```jsx
<div style={{
  background: '#EFF6FF',
  border: '1px solid #BFDBFE',
  borderLeft: '4px solid #0A66C2',
  borderRadius: 12,
  padding: '20px 24px',
  marginTop: 24,
  marginBottom: 24,
}}>
  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1E40AF', marginBottom: 8 }}>
    Build Your ATS Resume
  </h3>
  <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, marginBottom: 16 }}>
    Your profile rewrite is ready. Turn it into an ATS-optimized resume
    for any job. Paste a job description and get a complete, downloadable
    resume in 60 seconds.
  </p>
  <a
    href={`/resume?orderId=${orderId}`}
    style={{
      display: 'inline-block',
      background: '#0A66C2',
      color: 'white',
      padding: '12px 28px',
      borderRadius: 50,
      fontSize: 15,
      fontWeight: 700,
      textDecoration: 'none',
    }}
  >
    Build My Resume →
  </a>
  <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
    Included in your Pro plan
  </p>
</div>
```

### For Standard Users

```jsx
<div style={{
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: '20px 24px',
  marginTop: 24,
  textAlign: 'center',
}}>
  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
    Want an ATS Resume?
  </h3>
  <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
    Upgrade to Pro to build ATS-optimized resumes for any job description.
  </p>
  <button onClick={handleUpgrade} style={{
    background: '#0A66C2', color: 'white',
    padding: '10px 24px', borderRadius: 50,
    fontSize: 14, fontWeight: 600,
  }}>
    Upgrade to Pro — ₹799
  </button>
</div>
```

---

## Pricing Changes (Session 3)

### Current Pricing
| Plan | Price | Features |
|------|-------|----------|
| Standard | ₹299 | Roast + Rewrite |
| Pro | ₹599 | Standard + Headline Variations + ATS Keywords |

### New Pricing (implement in Session 3)
| Plan | Price | Features |
|------|-------|----------|
| Standard | ₹299 | Roast + Rewrite + Card |
| Pro | ₹799 | Standard + ATS Resume (1 JD) + 5 Headlines + ATS Keywords + Cover Letter |
| Pro Plus | ₹1499 | Pro + 3 additional resumes for different JDs + Priority |

### Implementation Notes
- Update Razorpay amount in backend order creation
- Update frontend pricing cards
- Update NEXT_PUBLIC_RAZORPAY amounts
- Do NOT change pricing until resume builder is fully working
- Grandfather existing Pro users at ₹599

---

## Security & Access Control

- Resume generation requires valid orderId with plan === 'pro'
- Resume endpoints validate ownership (email match)
- No public access to resume data
- PDFs stored in Supabase with signed URLs (not public)
- Rate limit: 5 resume generations per order per day

---

## Error Handling

| Error | User Message | Action |
|-------|-------------|--------|
| Order not found | "Order not found. Please check your link." | Show error page |
| Not Pro plan | "Resume builder is available for Pro users." | Show upgrade button |
| JD too short | "Please paste the complete job description." | Highlight field |
| AI generation fails | "Resume generation failed. Retrying..." | Auto-retry once |
| PDF generation fails | "PDF download failed. Try again." | Retry button |

---

## Mobile Responsiveness

### Form Page (/resume)
- 2-column grid → 1 column below 768px
- Full width inputs
- Textarea full width

### Preview Page (/resume/[resumeId])
- ATS score card stacks vertically
- Resume preview scrollable horizontally on small screens
- Download buttons full width

### Editor Page (Session 2)
- Two-panel → single panel with toggle button
- [Edit] / [Preview] toggle at top
- Shows one panel at a time on mobile

---

## Performance Notes

- Claude Sonnet call: ~10-20 seconds
- PDF generation: ~2-3 seconds
- Show loading state during generation
- Cache generated resume in DB (no re-generation on page refresh)
- Auto-save debounced at 1 second

---

## Future Enhancements (Post Session 3)

- Cover letter generator (same JD, same profile data)
- Multiple resume versions per JD
- Resume comparison (before/after ATS score)
- LinkedIn import button (paste URL, auto-fetch)
- Resume sharing (public link with password)
- Resume analytics (views, downloads)
- AI interview prep (from same JD)
- Bulk resume generation (multiple JDs at once)

---

## File Size Estimates

| File | Lines (est.) |
|------|-------------|
| resume.ts (backend routes) | ~250 |
| resume-generator.ts | ~150 |
| resume-pdf.ts | ~100 |
| /resume/page.tsx (form) | ~400 |
| /resume/[resumeId]/page.tsx (preview) | ~350 |
| ResumePreview.tsx | ~200 |
| TemplateClassic.tsx | ~250 |
| ATSScoreWidget.tsx | ~100 |
| **Session 1 Total** | **~1800** |
| /resume/[resumeId]/edit/page.tsx | ~500 |
| ResumeEditor.tsx | ~400 |
| TemplateModern.tsx | ~250 |
| TemplateMinimal.tsx | ~250 |
| **Session 2 Total** | **~1400** |
| resume-docx.ts | ~150 |
| Drag-reorder + polish | ~300 |
| **Session 3 Total** | **~450** |
| **Grand Total** | **~3650** |

---

*Document created: March 2026*
*Product: ProfileRoaster (profileroaster.in)*
*Author: Development Team*
