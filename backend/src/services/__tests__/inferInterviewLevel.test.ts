import { describe, it, expect, vi } from 'vitest';

vi.mock('../../db', () => ({ query: vi.fn().mockResolvedValue({ rows: [] }) }));
vi.mock('@google/generative-ai', () => {
  return { GoogleGenerativeAI: class { getGenerativeModel() { return {}; } } };
});

import { inferInterviewLevel, normalizeCandidateProfile, type CandidateProfile } from '../interview-prep-v2';
import {
  FRESHER_RESUME, SINGLE_JOB_10YR, MANY_SHORT_JOBS, SENIOR_TITLES, INTERN_PROFILE,
  EMPTY_RESUME, RESUME_WITH_JD, RESUME_NO_JD, RESUME_INTERN_JD, RESUME_LEAD_JD,
  ORDER_WITH_JD, ORDER_NO_JD,
} from './fixtures';

// Helper to build profile quickly
function profile(resumeData: any, resume: any = RESUME_NO_JD, order: any = ORDER_NO_JD): CandidateProfile {
  return normalizeCandidateProfile(resumeData, resume, order);
}

describe('inferInterviewLevel', () => {
  // ─── User Override (highest priority) ───

  describe('user override', () => {
    it('respects "entry" override regardless of experience', () => {
      const p = profile(SENIOR_TITLES, RESUME_WITH_JD, ORDER_WITH_JD);
      expect(inferInterviewLevel(p, 'entry')).toBe('entry');
    });

    it('respects "lead" override for a fresher', () => {
      const p = profile(FRESHER_RESUME);
      expect(inferInterviewLevel(p, 'lead')).toBe('lead');
    });

    it('respects "mid" override', () => {
      const p = profile(FRESHER_RESUME);
      expect(inferInterviewLevel(p, 'mid')).toBe('mid');
    });

    it('respects "senior" override', () => {
      const p = profile(FRESHER_RESUME);
      expect(inferInterviewLevel(p, 'senior')).toBe('senior');
    });

    it('ignores invalid override values', () => {
      const p = profile(FRESHER_RESUME);
      expect(inferInterviewLevel(p, 'executive')).toBe('entry'); // falls to auto-detect
    });

    it('ignores empty string override', () => {
      const p = profile(FRESHER_RESUME);
      expect(inferInterviewLevel(p, '')).toBe('entry');
    });

    it('ignores undefined override', () => {
      const p = profile(FRESHER_RESUME);
      expect(inferInterviewLevel(p, undefined)).toBe('entry');
    });
  });

  // ─── JD Signals (second priority) ───

  describe('JD signals', () => {
    it('detects intern/entry-level JD', () => {
      const p = profile(MANY_SHORT_JOBS, RESUME_INTERN_JD, ORDER_NO_JD);
      expect(inferInterviewLevel(p)).toBe('entry');
    });

    it('detects VP/director-level JD', () => {
      const p = profile(SENIOR_TITLES, RESUME_LEAD_JD, ORDER_NO_JD);
      expect(inferInterviewLevel(p)).toBe('lead');
    });

    it('detects senior from JD with "5+ years"', () => {
      const p = profile(SINGLE_JOB_10YR, RESUME_WITH_JD, ORDER_WITH_JD);
      // JD says "5+ years of experience" + "senior" keyword → senior
      expect(inferInterviewLevel(p)).toBe('senior');
    });

    it('returns null from JD when JD is too short', () => {
      const p = profile(SINGLE_JOB_10YR, { ...RESUME_NO_JD, job_description: 'short' }, ORDER_NO_JD);
      // Falls through to experience-based since JD is short
      // SINGLE_JOB_10YR: Jan 2014 → Present = ~132 months > 120 → lead
      expect(inferInterviewLevel(p)).toBe('lead');
    });
  });

  // ─── Fresher Detection (third priority) ───

  describe('fresher detection', () => {
    it('returns entry for zero experience', () => {
      const p = profile(FRESHER_RESUME);
      expect(inferInterviewLevel(p)).toBe('entry');
    });

    it('returns entry for empty resume', () => {
      const p = profile(EMPTY_RESUME);
      expect(inferInterviewLevel(p)).toBe('entry');
    });

    it('returns entry for intern with minimal experience', () => {
      const p = profile(INTERN_PROFILE);
      // Intern with 3 months → entry (0-24 months band)
      expect(inferInterviewLevel(p)).toBe('entry');
    });
  });

  // ─── Title-based Inference ───

  describe('title keywords', () => {
    it('detects lead from senior title + >84 months', () => {
      const p = profile(SENIOR_TITLES);
      // "Senior Engineering Manager" + 12+ years → lead
      expect(inferInterviewLevel(p)).toBe('lead');
    });

    it('detects senior from senior title without long tenure', () => {
      const resumeData = {
        contact: { name: 'Test' },
        experience: [
          { title: 'Senior Developer', company: 'X', start_date: 'Jan 2020', end_date: 'Dec 2023', bullets: [] },
        ],
        skills: [], education: [], summary: '',
      };
      const p = profile(resumeData);
      // Senior title but only ~48 months → senior (not lead)
      expect(inferInterviewLevel(p)).toBe('senior');
    });
  });

  // ─── Experience Band Boundaries ───

  describe('experience bands', () => {
    function makeProfile(months: number): CandidateProfile {
      // Build a profile with exact months
      return {
        name: 'Test',
        targetRole: 'Developer',
        targetCompany: '',
        totalExperienceMonths: months,
        roles: months > 0 ? [{ title: 'Developer', company: 'X', startDate: '', endDate: '', durationMonths: months, bullets: [], level: 'mid' }] : [],
        skills: [], education: [], summary: '',
        jobDescription: '', hasJD: false,
      };
    }

    it('0 months → entry', () => {
      expect(inferInterviewLevel(makeProfile(0))).toBe('entry');
    });

    it('1 month → entry', () => {
      expect(inferInterviewLevel(makeProfile(1))).toBe('entry');
    });

    it('24 months (boundary) → entry', () => {
      expect(inferInterviewLevel(makeProfile(24))).toBe('entry');
    });

    it('25 months → mid', () => {
      expect(inferInterviewLevel(makeProfile(25))).toBe('mid');
    });

    it('60 months (boundary) → mid', () => {
      expect(inferInterviewLevel(makeProfile(60))).toBe('mid');
    });

    it('61 months → senior', () => {
      expect(inferInterviewLevel(makeProfile(61))).toBe('senior');
    });

    it('120 months (boundary) → senior', () => {
      expect(inferInterviewLevel(makeProfile(120))).toBe('senior');
    });

    it('121 months → lead', () => {
      expect(inferInterviewLevel(makeProfile(121))).toBe('lead');
    });

    it('200 months → lead', () => {
      expect(inferInterviewLevel(makeProfile(200))).toBe('lead');
    });
  });

  // ─── Combined Scenarios ───

  describe('real-world scenarios', () => {
    it('many short jobs (2 years total) → entry', () => {
      const p = profile(MANY_SHORT_JOBS);
      // ~24 months across 4 jobs → entry
      expect(inferInterviewLevel(p)).toBe('entry');
    });

    it('single job 10+ years without JD → lead', () => {
      const p = profile(SINGLE_JOB_10YR, RESUME_NO_JD, ORDER_NO_JD);
      // Jan 2014 → Present = ~132 months > 120 → lead
      expect(inferInterviewLevel(p)).toBe('lead');
    });
  });
});
