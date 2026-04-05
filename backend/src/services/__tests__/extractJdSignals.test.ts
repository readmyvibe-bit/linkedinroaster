import { describe, it, expect, vi } from 'vitest';

vi.mock('../../db', () => ({ query: vi.fn().mockResolvedValue({ rows: [] }) }));
vi.mock('@google/generative-ai', () => {
  return { GoogleGenerativeAI: class { getGenerativeModel() { return {}; } } };
});

import { extractJdSignals } from '../interview-prep-v2';

describe('extractJdSignals', () => {
  // ─── Empty / Short JD ───

  it('returns nulls for empty JD', () => {
    const result = extractJdSignals('');
    expect(result.suggestedLevel).toBeNull();
    expect(result.yearsRequired).toBeNull();
  });

  it('returns nulls for short JD (< 50 chars)', () => {
    const result = extractJdSignals('Looking for a developer with good skills.');
    expect(result.suggestedLevel).toBeNull();
    expect(result.yearsRequired).toBeNull();
  });

  it('returns nulls for undefined/null JD', () => {
    expect(extractJdSignals(undefined as any).suggestedLevel).toBeNull();
    expect(extractJdSignals(null as any).suggestedLevel).toBeNull();
  });

  // ─── Years Extraction ───

  it('extracts "5+ years of experience"', () => {
    const jd = 'We are looking for a candidate with 5+ years of experience in software engineering. Must have strong problem-solving skills.';
    const result = extractJdSignals(jd);
    expect(result.yearsRequired).toBe(5);
  });

  it('extracts "3 years experience"', () => {
    const jd = 'Requirements: 3 years experience in React and TypeScript. Strong understanding of frontend architecture and testing.';
    const result = extractJdSignals(jd);
    expect(result.yearsRequired).toBe(3);
  });

  it('extracts "10+ yrs of exp"', () => {
    const jd = 'Looking for a seasoned leader with 10+ yrs of exp in engineering management and cross-functional leadership.';
    const result = extractJdSignals(jd);
    expect(result.yearsRequired).toBe(10);
  });

  // ─── Title Keywords → Entry ───

  it('detects "intern" as entry', () => {
    const jd = 'Software Engineering Intern position. Join our team for a summer internship program with training and mentorship. No experience needed.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBe('entry');
  });

  it('detects "fresher" as entry', () => {
    const jd = 'We are hiring freshers for our graduate development program. If you are a recent graduate looking for your first role, apply now.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBe('entry');
  });

  it('detects "entry-level" as entry', () => {
    const jd = 'This is an entry-level position for candidates with 0-1 years of experience. Training will be provided for the right candidate.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBe('entry');
  });

  it('detects "graduate" as entry', () => {
    const jd = 'Graduate Software Engineer role. We welcome new graduates from computer science or related fields to join our engineering team.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBe('entry');
  });

  // ─── Title Keywords → Senior ───

  it('detects "senior" as senior', () => {
    const jd = 'Senior Software Engineer needed to build and scale distributed systems. Must have deep understanding of system design principles.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBe('senior');
  });

  it('detects "principal" as senior', () => {
    const jd = 'Principal Engineer to drive technical strategy across the platform team. You will set architectural direction for the whole org.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBe('senior');
  });

  it('detects "staff" as senior', () => {
    const jd = 'Staff Engineer role requiring deep technical expertise and cross-team influence. You will solve the hardest problems across the company.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBe('senior');
  });

  // ─── Title Keywords → Lead ───

  it('detects "director" as lead', () => {
    const jd = 'Engineering Director to oversee the payments infrastructure team. You will manage multiple teams and report to the VP of Engineering.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBe('lead');
  });

  it('detects "VP" as lead', () => {
    const jd = 'Vice President of Engineering needed to lead the entire product engineering organization of 100+ engineers across multiple offices.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBe('lead');
  });

  it('detects "head of" as lead', () => {
    const jd = 'Head of Engineering for our India office. Build and grow the engineering team from 10 to 50 engineers over the next two years.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBe('lead');
  });

  it('detects "manager" as lead', () => {
    // Note: "lead" keyword in "to lead a team" matches senior regex (\blead\b) before manager regex
    // Use a JD without "lead" as a verb
    const jd = 'Engineering Manager required for the core platform team of 8-12 engineers. Previous people management experience and team supervision required.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBe('lead');
  });

  // ─── Years-only Inference (no title keywords) ───

  it('infers entry from 2 years required (no title keywords)', () => {
    const jd = 'Software developer position. Requirements include 2 years of experience with modern web technologies and agile development practices.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBe('entry');
    expect(result.yearsRequired).toBe(2);
  });

  it('infers mid from 4 years required', () => {
    const jd = 'Full stack developer needed. Candidates must have 4 years of experience building web applications with React and Node.js backends.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBe('mid');
    expect(result.yearsRequired).toBe(4);
  });

  it('infers senior from 7 years required', () => {
    const jd = 'Backend engineer with 7 years of experience required. Must have expertise in distributed systems and database optimization techniques.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBe('senior');
    expect(result.yearsRequired).toBe(7);
  });

  it('infers lead from 12 years required', () => {
    const jd = 'Technology leader with 12 years of experience in software development. Must have experience building and scaling engineering organizations.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBe('lead');
    expect(result.yearsRequired).toBe(12);
  });

  // ─── Priority: title keywords > years ───

  it('title keyword wins over years when both present', () => {
    const jd = 'Intern position for students with 0 years of experience. Summer internship in our engineering team with projects in data science.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBe('entry'); // "intern" keyword takes priority
  });

  // ─── No Signals ───

  it('returns null when JD has no signals', () => {
    const jd = 'We are building something great and need talented people to join our team. If you are passionate about technology, we want to hear from you.';
    const result = extractJdSignals(jd);
    expect(result.suggestedLevel).toBeNull();
    expect(result.yearsRequired).toBeNull();
  });
});
