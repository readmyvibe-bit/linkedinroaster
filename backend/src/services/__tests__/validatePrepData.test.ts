import { describe, it, expect, vi } from 'vitest';

vi.mock('../../db', () => ({ query: vi.fn().mockResolvedValue({ rows: [] }) }));
vi.mock('@google/generative-ai', () => {
  return { GoogleGenerativeAI: class { getGenerativeModel() { return {}; } } };
});

import { validatePrepData } from '../interview-prep-v2';
import {
  PERFECT_PREP_DATA, DEGRADED_PREP_DATA, INVALID_PREP_DATA_TOO_FEW,
  PREP_DATA_WITH_PLACEHOLDERS, PREP_DATA_NO_BRIEF, PREP_DATA_BAD_MCQS,
  PREP_DATA_SHORT_STAR,
} from './fixtures';

describe('validatePrepData', () => {
  // ─── Perfect Data ───

  it('passes validation for perfect prep data', () => {
    const result = validatePrepData(PERFECT_PREP_DATA);
    expect(result.valid).toBe(true);
    expect(result.degraded).toBe(false);
    expect(result.errors).toHaveLength(0);
    expect(result.questionCount).toBe(15);
    expect(result.mcqCount).toBe(10);
  });

  // ─── Degraded State ───

  it('marks as degraded when between min and full thresholds', () => {
    const result = validatePrepData(DEGRADED_PREP_DATA);
    expect(result.valid).toBe(true); // still valid (degraded || valid)
    expect(result.degraded).toBe(true);
    expect(result.questionCount).toBe(11);
    expect(result.mcqCount).toBe(7);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  // ─── Hard Failure ───

  it('fails when too few valid questions', () => {
    const result = validatePrepData(INVALID_PREP_DATA_TOO_FEW);
    expect(result.valid).toBe(false);
    expect(result.questionCount).toBe(5);
    expect(result.mcqCount).toBe(3);
    expect(result.errors).toContain('Only 5/15 valid questions');
    expect(result.errors).toContain('Only 3/10 valid MCQs');
  });

  // ─── Placeholder Detection ───

  it('rejects questions with "..." placeholders', () => {
    const result = validatePrepData(PREP_DATA_WITH_PLACEHOLDERS);
    // 8 valid questions, 7 with "..." → only 8 pass
    expect(result.questionCount).toBe(8);
    expect(result.valid).toBe(false); // 8 < 10 minimum
  });

  // ─── Missing Sections ───

  it('flags missing company_brief', () => {
    const result = validatePrepData(PREP_DATA_NO_BRIEF);
    expect(result.errors).toContain('Missing company brief');
  });

  it('flags missing cheat_sheet', () => {
    const data = { ...PERFECT_PREP_DATA, cheat_sheet: undefined };
    const result = validatePrepData(data);
    expect(result.errors).toContain('Missing cheat sheet');
  });

  // ─── MCQ Validation ───

  it('rejects MCQs with wrong option count', () => {
    const result = validatePrepData(PREP_DATA_BAD_MCQS);
    // Only 4 valid MCQs out of 10
    expect(result.mcqCount).toBeLessThan(6);
    expect(result.errors.some(e => e.includes('valid MCQs'))).toBe(true);
  });

  // ─── Short STAR Fields ───

  it('rejects questions with short STAR answers', () => {
    const result = validatePrepData(PREP_DATA_SHORT_STAR);
    // First 5 are valid, next 10 have short STAR fields
    expect(result.questionCount).toBe(5);
    expect(result.valid).toBe(false);
  });

  // ─── Empty Data ───

  it('handles completely empty data', () => {
    const result = validatePrepData({});
    expect(result.valid).toBe(false);
    expect(result.questionCount).toBe(0);
    expect(result.mcqCount).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('handles null/undefined fields', () => {
    const result = validatePrepData({ questions: null, mcq: undefined, ask_them: null });
    expect(result.valid).toBe(false);
    expect(result.questionCount).toBe(0);
    expect(result.mcqCount).toBe(0);
  });

  // ─── Boundary Cases ───

  it('12 questions + 8 MCQs = full valid (not degraded)', () => {
    const data = {
      ...PERFECT_PREP_DATA,
      questions: PERFECT_PREP_DATA.questions.slice(0, 12),
      mcq: PERFECT_PREP_DATA.mcq.slice(0, 8),
      ask_them: PERFECT_PREP_DATA.ask_them.slice(0, 3),
    };
    const result = validatePrepData(data);
    expect(result.valid).toBe(true);
    expect(result.degraded).toBe(false);
    expect(result.questionCount).toBe(12);
    expect(result.mcqCount).toBe(8);
  });

  it('10 questions + 6 MCQs = degraded but valid', () => {
    const data = {
      ...PERFECT_PREP_DATA,
      questions: PERFECT_PREP_DATA.questions.slice(0, 10),
      mcq: PERFECT_PREP_DATA.mcq.slice(0, 6),
      ask_them: PERFECT_PREP_DATA.ask_them.slice(0, 3),
    };
    const result = validatePrepData(data);
    expect(result.valid).toBe(true);
    expect(result.degraded).toBe(true);
  });

  it('9 questions = invalid (below degraded threshold)', () => {
    const data = {
      ...PERFECT_PREP_DATA,
      questions: PERFECT_PREP_DATA.questions.slice(0, 9),
    };
    const result = validatePrepData(data);
    expect(result.valid).toBe(false);
    expect(result.questionCount).toBe(9);
  });

  it('5 MCQs = invalid (below degraded threshold)', () => {
    const data = {
      ...PERFECT_PREP_DATA,
      mcq: PERFECT_PREP_DATA.mcq.slice(0, 5),
    };
    const result = validatePrepData(data);
    expect(result.valid).toBe(false);
    expect(result.mcqCount).toBe(5);
  });

  // ─── Ask-them Validation ───

  it('flags too few ask-them questions', () => {
    const data = {
      ...PERFECT_PREP_DATA,
      ask_them: [{ question: 'One?', why_it_matters: 'test' }],
    };
    const result = validatePrepData(data);
    expect(result.errors.some(e => e.includes('valid ask-them'))).toBe(true);
  });

  it('rejects ask-them with placeholder text', () => {
    const data = {
      ...PERFECT_PREP_DATA,
      ask_them: [
        { question: '...', why_it_matters: 'test' },
        { question: '...', why_it_matters: 'test' },
        { question: '...', why_it_matters: 'test' },
        { question: 'Real question here?', why_it_matters: 'test' },
        { question: 'Another real question?', why_it_matters: 'test' },
      ],
    };
    const result = validatePrepData(data);
    expect(result.errors.some(e => e.includes('ask-them'))).toBe(true);
  });
});
