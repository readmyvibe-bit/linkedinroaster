# ATS Layout Contract v1.0

## What "ATS-Friendly" Means

Our ATS-friendly templates ensure that **Applicant Tracking Systems** (Workday, Greenhouse, Lever, Taleo, etc.) can correctly parse resume content by following these rules:

1. **Linear reading order** — content extracted via PDF text select or `pdftotext` matches visual reading order
2. **No layout tables** — section content uses stacked divs/flex, not HTML `<table>` elements
3. **No multi-column content** where column ordering breaks in linearized text extraction
4. **No text-as-image** — all resume text is real HTML text, not embedded in SVG/images
5. **Standard section headers** — recognizable by common ATS parsers

## What We Don't Guarantee

- Specific ATS parser compatibility (each vendor has proprietary logic)
- Perfect formatting in all PDF viewers (we optimize for Chrome print)
- Photo parsing (photos are decorative; ATS ignores them)
- Custom section parsing (ATS may not recognize non-standard section names)

## Layout Rules

### L1 — Reading Order
Plain-text extraction order must match: **Header (name/contact) → Summary → Experience (reverse chrono) → Education → Skills → Achievements → Custom Sections**

### L2 — Forbidden in Print HTML
- `<table>` for primary content sections (education, experience, skills)
- Multi-column layouts where column 2 text appears before column 1 in DOM order
- Essential content only inside `<img>` tags
- Text rendered only as SVG paths

### L3 — Allowed
- `display:flex` / CSS grid if reading order verified
- Decorative colors, borders, accent bars, skill pills
- Photos (campus/skylight) — documented as visual-only, not ATS-parsed

### L4 — Section Headers
Fixed public labels mapped from internal names:

| Internal | Print Label |
|----------|-------------|
| summary | Summary / Career Objective / Professional Summary |
| experience | Experience / Professional Experience |
| education | Education |
| skills | Skills / Skills & Competencies / Technical Skills |
| achievements | Achievements / Key Achievements |
| custom_sections | User-defined title |

## Per-Template Sign-Off

| ID | Name | Layout | Tables | Multi-col | Photo | Reading Order | ATS Status |
|----|------|--------|--------|-----------|-------|---------------|------------|
| classic | Classic Professional | Single column | None | No | No | Verified | ATS High |
| modern | Modern Accent | Single column + left border | None | No | No | Verified | ATS High |
| minimal | Minimalist | Single column centered header | None | No | No | Verified | ATS High |
| compact | Compact Dense | Single column dense | None | No | No | Verified | ATS High |
| technical | Technical Developer | Single column + code style | None | No | No | Verified | ATS High |
| bold | Bold Statement | Single column + green bar | None | No | No | Verified | ATS High |
| monochrome | Monochrome Prestige | Single column b/w | None | No | No | Verified | ATS High |
| headline | Headline Impact | Single column + summary box | None | No | No | Verified | ATS High |
| campus | Campus Placement | Single column + photo header | None (fixed v1.0) | No | Yes (decorative) | Verified | ATS High |
| salesbd | Sales & BD | Single column metrics-forward | None | No | No | Verified | ATS High |
| skylight | Aviation & Hospitality | Single column + photo | None | No | Yes (decorative) | Verified | ATS High |

### Notes
- **Campus**: Education section was previously rendered as `<table>`. Fixed in v1.0 to use stacked divs.
- **Skylight/Campus photos**: Photos are `<img>` tags but contain no resume text. ATS parsers skip images. Photo URL resolved to absolute for print.
- All templates use `buildExpHTML` with `class="entry"` for experience blocks, enabling consistent print spacing.

## Testing

Automated layout sniff tests verify per template:
1. No `<table>` tags in print HTML
2. Section markers appear in correct order in text content
3. Template ID exists in TEMPLATES array

Run: `npm test` in `frontend/` directory.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-05 | Initial contract. 11 templates audited. Campus table fixed. |
