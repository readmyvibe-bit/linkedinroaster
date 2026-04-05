# Interview Prep System — Internal Specification

## Overview

Generates personalized interview prep from a saved resume: 15 STAR-format questions, company brief, 5 interviewer questions, cheat sheet, and 10 MCQs. Shown at `/interview-prep/[prepId]`.

## Architecture

```
POST /api/interview-prep { resume_id, interview_level? }
  → Insert row (status: queued)
  → Background: generateInterviewPrepV2(prepId, resumeId, level)
    → Phase 1: Plan (question mix + themes)
    → Phase 2: Company Brief
    → Phase 3: Question Skeleton (15 questions, no answers)
    → Phase 4: STAR Answers (batches of 5)
    → Phase 5: Ask-them + Cheat Sheet
    → Phase 6: MCQs (10)
    → Phase 7: Merge + Validate → status: ready
```

## Interview Level Bands

| Level | Experience | Focus | STAR Depth | MCQ Type |
|-------|-----------|-------|------------|----------|
| **entry** | 0-24 months | Learning ability, projects, internships | College projects, coursework ok | Conceptual, foundational |
| **mid** | 25-60 months | Role-specific scenarios, process improvement | Specific work achievements + metrics | Applied, scenario-based |
| **senior** | 61-120 months | Leadership, strategic decisions, scaling | Revenue, team growth, org-level changes | Advanced decision-making |
| **lead** | 121+ months | Org strategy, P&L, stakeholder management | Business impact in crores/headcount | Strategic, leadership-oriented |

## Level Inference (order of precedence)

1. **User override** — `POST body.interview_level` (entry/mid/senior/lead)
2. **JD signals** — keyword detection:
   - `intern|trainee|fresher|entry-level` → entry
   - `senior|principal|staff|lead` → senior
   - `director|VP|head of|chief` → lead
   - `manager|team lead|supervisor` → lead
   - Years extraction: `N+ years of experience` → band mapping
3. **Fresher detection** — 0 roles or 0 months → entry
4. **Title keywords** — from most recent 2 roles
5. **Experience bands** — total months (see table above)

## Question Mix

Target: exactly 15 questions per prep.

| Category | Count | Description |
|----------|-------|-------------|
| behavioral | 5 | Teamwork, conflict, failure, leadership |
| role_specific | 5 | Technical depth, domain knowledge |
| situational | 3 | Hypothetical scenarios |
| culture | 2 | Values, motivation, fit |

Distribution is dynamically adjusted by Phase 1 based on level + role + JD themes.

## Validation Thresholds

| Metric | Full Pass | Degraded Pass | Hard Fail |
|--------|-----------|---------------|-----------|
| Questions | >= 12 valid | >= 10 valid | < 10 |
| MCQs | >= 8 valid | >= 6 valid | < 6 |
| Ask-them | >= 3 valid | (no min) | (no min) |
| Company Brief | present | (flagged) | (flagged) |
| Cheat Sheet | present | (flagged) | (flagged) |

**Valid question**: `question.length > 15`, no `...` placeholders, `situation.length > 10`, `action.length > 10`.
**Valid MCQ**: `question.length > 15`, exactly 4 options, each option `length > 2` and not `...`, numeric `correct`.

When degraded: `generation_meta.degraded = true` + `degraded_reason`. Frontend shows warning banner.

## Quota Enforcement

| Plan | Preps per Resume |
|------|-----------------|
| Starter | 0 (not available) |
| Standard | 1 |
| Plus | 1 |
| Pro | 3 |

Failed preps don't count against quota.

## Gemini Configuration

| Phase | Model | Temperature | Max Tokens | Notes |
|-------|-------|-------------|------------|-------|
| P1 Plan | gemini-2.5-flash | 0.3 | 1024 | Small JSON |
| P2 Brief | gemini-2.5-flash | 0.3 | 2048 | |
| P3 Skeleton | gemini-2.5-flash | 0.5 | 4096 | |
| P4 STAR | gemini-2.5-flash | 0.5 | 6144 | Batches of 5 |
| P5 Extras | gemini-2.5-flash | 0.4 | 3072 | |
| P6 MCQ | gemini-2.5-flash | 0.5 | 4096 | |

**Retry policy**: On `MAX_TOKENS` or JSON parse failure, retry once with `gemini-2.5-pro` and +2048 tokens.

## Feature Flag

```env
INTERVIEW_PREP_PIPELINE=v2   # default: v2. Set to "v1" to use legacy single-call pipeline.
```

## Rollback Steps

1. Set `INTERVIEW_PREP_PIPELINE=v1` in environment
2. Deploy — all new preps use v1 pipeline
3. Existing v2 preps continue to work (data format is compatible)
4. No migration needed — v1 code path is fully intact

## Database Schema

```sql
CREATE TABLE interview_preps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(id),
  order_id TEXT,
  source TEXT DEFAULT 'resume',
  target_role TEXT,
  target_company TEXT,
  career_stage TEXT DEFAULT 'mid',
  interview_level TEXT DEFAULT 'mid',        -- v2
  pipeline_version TEXT DEFAULT 'v1',        -- v2
  generation_meta JSONB,                     -- v2
  status TEXT DEFAULT 'queued',
  prep_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_interview_preps_resume ON interview_preps(resume_id);
CREATE INDEX idx_interview_preps_order ON interview_preps(order_id);
CREATE INDEX idx_interview_preps_status ON interview_preps(status);
CREATE INDEX idx_interview_preps_resume_status ON interview_preps(resume_id, status);
CREATE INDEX idx_interview_preps_created ON interview_preps(created_at DESC);
```

## API Endpoints

### POST /api/interview-prep
Create or return existing prep.

**Body**: `{ resume_id: UUID, interview_level?: "entry"|"mid"|"senior"|"lead" }`
**Response**: `{ id: UUID, status: "queued"|"ready"|"processing" }`
**Errors**: 400 (invalid input), 403 (quota/plan), 404 (resume not found)

### GET /api/interview-prep/:id
Fetch prep by ID.

**Response**: Full prep object with `prep_data`, `generation_meta`, etc.

### GET /api/interview-prep/by-resume/:resumeId
List all preps for a resume.

**Response**: `{ preps: [...] }`

### GET /api/admin/interview-preps
Admin view with pagination and filters.

**Query**: `?status=ready&level=mid&pipeline=v2&page=1&limit=50`
**Response**: `{ preps: [...], stats: { total, ready, failed, success_rate_pct, avg_duration_ms }, pagination }`

## Files

| File | Purpose |
|------|---------|
| `backend/src/services/interview-prep-v2.ts` | V2 phased pipeline, normalization, inference, validation |
| `backend/src/services/interview-prep.ts` | V1 legacy single-call pipeline |
| `backend/src/routes/interview-prep.ts` | HTTP endpoints with quota + UUID validation |
| `backend/src/routes/admin.ts` | Admin stats + preps endpoint |
| `frontend/app/interview-prep/[prepId]/page.tsx` | 5-tab UI with polling |
| `backend/src/services/__tests__/*.test.ts` | Unit tests (102 tests) |
| `backend/src/services/__tests__/fixtures.ts` | Test fixtures (8 profiles) |

## Test Coverage

```
npm test
# 102 tests across 5 test files:
# - normalizeCandidateProfile: 20 tests
# - inferInterviewLevel: 27 tests  
# - validatePrepData: 16 tests
# - extractJdSignals: 23 tests
# - route tests: 16 tests
```

Test matrix covers: fresher, single-job-10yr, many-short-jobs, senior-titles, intern, empty-resume, missing-dates, nested-skills, with-JD, no-JD, short-JD, intern-JD, lead-JD.
