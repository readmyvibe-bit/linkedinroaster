import { describe, it, expect } from 'vitest';
import { validateResumeData } from '../resume-validator';

describe('validateResumeData', () => {
  const VALID_RESUME = {
    contact: { name: 'Rajesh Kumar', email: 'rajesh@gmail.com', phone: '9876543210' },
    summary: 'Senior engineer with 10+ years of experience in distributed systems.',
    experience: [
      {
        title: 'Senior Engineer',
        company: 'Google',
        start_date: 'Jan 2020',
        end_date: 'Present',
        bullets: [
          'Built microservices serving 2M+ requests daily',
          'Led migration from monolith to microservices architecture',
        ],
      },
    ],
    education: [
      { degree: 'B.Tech', field: 'CS', institution: 'IIT Delhi', year: '2010' },
    ],
    skills: ['Java', 'Python', 'Kubernetes', 'AWS'],
    achievements: ['Google Spot Bonus 2022'],
  };

  it('passes valid resume data', () => {
    const result = validateResumeData(VALID_RESUME);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails on null data', () => {
    const result = validateResumeData(null);
    expect(result.valid).toBe(false);
  });

  it('fails on missing contact name', () => {
    const result = validateResumeData({ ...VALID_RESUME, contact: { email: 'test@test.com' } });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('name'))).toBe(true);
  });

  it('fails on experience without company', () => {
    const data = {
      ...VALID_RESUME,
      experience: [{ title: 'Dev', bullets: ['Did stuff'] }],
    };
    const result = validateResumeData(data);
    expect(result.valid).toBe(false);
  });

  it('fails on education without institution', () => {
    const data = {
      ...VALID_RESUME,
      education: [{ degree: 'B.Tech' }],
    };
    const result = validateResumeData(data);
    expect(result.errors.some(e => e.includes('institution'))).toBe(true);
  });

  it('warns on very short bullet', () => {
    const data = {
      ...VALID_RESUME,
      experience: [{ ...VALID_RESUME.experience[0], bullets: ['Short'] }],
    };
    const result = validateResumeData(data);
    expect(result.warnings.some(w => w.includes('too short'))).toBe(true);
  });

  it('warns on very long bullet', () => {
    const data = {
      ...VALID_RESUME,
      experience: [{ ...VALID_RESUME.experience[0], bullets: ['A'.repeat(350)] }],
    };
    const result = validateResumeData(data);
    expect(result.warnings.some(w => w.includes('too long'))).toBe(true);
  });

  it('warns on too many bullets', () => {
    const data = {
      ...VALID_RESUME,
      experience: [{ ...VALID_RESUME.experience[0], bullets: Array(10).fill('Built something important for the company') }],
    };
    const result = validateResumeData(data);
    expect(result.warnings.some(w => w.includes('too many bullets'))).toBe(true);
  });

  it('warns on missing dates', () => {
    const data = {
      ...VALID_RESUME,
      experience: [{ title: 'Dev', company: 'Corp', bullets: ['Did work on things'] }],
    };
    const result = validateResumeData(data);
    expect(result.warnings.some(w => w.includes('missing dates'))).toBe(true);
  });

  it('warns on no skills', () => {
    const result = validateResumeData({ ...VALID_RESUME, skills: [] });
    expect(result.warnings.some(w => w.includes('No skills'))).toBe(true);
  });

  it('warns on no achievements for experienced profile', () => {
    const data = {
      ...VALID_RESUME,
      experience: [
        { title: 'Dev', company: 'A', start_date: '2020', bullets: ['Built stuff for A'] },
        { title: 'Dev', company: 'B', start_date: '2018', bullets: ['Built stuff for B'] },
        { title: 'Dev', company: 'C', start_date: '2016', bullets: ['Built stuff for C'] },
      ],
      achievements: [],
    };
    const result = validateResumeData(data);
    expect(result.warnings.some(w => w.includes('No achievements'))).toBe(true);
  });

  it('handles skills as object format', () => {
    const data = {
      ...VALID_RESUME,
      skills: { technical: ['Java'], soft: ['Leadership'] },
    };
    const result = validateResumeData(data);
    expect(result.valid).toBe(true);
  });

  it('handles skills as category array format', () => {
    const data = {
      ...VALID_RESUME,
      skills: [{ category: 'Tech', skills: ['Java', 'Python'] }],
    };
    const result = validateResumeData(data);
    expect(result.valid).toBe(true);
  });

  it('accepts custom_sections', () => {
    const data = {
      ...VALID_RESUME,
      custom_sections: [{ title: 'Projects', items: ['Built a CRM system'] }],
    };
    const result = validateResumeData(data);
    expect(result.valid).toBe(true);
  });
});
