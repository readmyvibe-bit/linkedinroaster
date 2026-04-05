import { describe, it, expect } from 'vitest';
import { TEMPLATES, buildPrintHTML } from '../ResumeTemplates';
import { DENSE, SPARSE, FRESHER } from '../__fixtures__/resume-data';

/**
 * ATS Layout Sniff Tests
 * Validates that all 11 templates comply with ATS_LAYOUT_CONTRACT.md
 */

// Expected template IDs — must match ATS_LAYOUT_CONTRACT.md sign-off table
const EXPECTED_ATS_TEMPLATES = [
  'classic', 'modern', 'minimal', 'compact', 'technical',
  'bold', 'monochrome', 'headline', 'campus', 'salesbd', 'skylight',
];

// Section markers in expected reading order
const SECTION_ORDER = ['Summary', 'Experience', 'Education', 'Skills'];

describe('ATS Layout Contract', () => {

  // ─── Contract versioning: all expected templates exist ───
  it('all 11 ATS template IDs exist in TEMPLATES array', () => {
    const ids = TEMPLATES.map(t => t.id);
    for (const expected of EXPECTED_ATS_TEMPLATES) {
      expect(ids).toContain(expected);
    }
    expect(TEMPLATES.length).toBe(11);
  });

  // ─── L2: No HTML tables in print output ───
  describe('L2 — No table tags in print HTML', () => {
    for (const tid of EXPECTED_ATS_TEMPLATES) {
      it(`${tid}: no <table> in print HTML`, () => {
        const html = buildPrintHTML(DENSE as any, tid);
        expect(html).not.toMatch(/<table[\s>]/i);
      });
    }
  });

  // ─── L1: Reading order — sections appear in correct sequence ───
  describe('L1 — Section reading order', () => {
    for (const tid of EXPECTED_ATS_TEMPLATES) {
      it(`${tid}: name appears before Experience section`, () => {
        const html = buildPrintHTML(DENSE as any, tid);
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        const nameIdx = text.indexOf('Rajesh Kumar');
        const expIdx = text.search(/experience|professional experience/i);
        if (nameIdx > -1 && expIdx > -1) {
          expect(nameIdx).toBeLessThan(expIdx);
        }
      });

      it(`${tid}: Experience appears before Skills section`, () => {
        const html = buildPrintHTML(DENSE as any, tid);
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        const expIdx = text.search(/experience|professional experience/i);
        const skillIdx = text.search(/skills|competencies|technical skills/i);
        if (expIdx > -1 && skillIdx > -1) {
          expect(expIdx).toBeLessThan(skillIdx);
        }
      });
    }
  });

  // ─── L2: No two-col in template body (shared CSS wrapper excluded) ───
  describe('L2 — No two-col in template body HTML', () => {
    for (const tid of EXPECTED_ATS_TEMPLATES) {
      it(`${tid}: no two-col class in template body`, () => {
        const html = buildPrintHTML(DENSE as any, tid);
        // Extract body content inside print-content-root, skip shared CSS
        const bodyMatch = html.match(/<div class="print-content-root">([\s\S]*)<\/body>/);
        const body = bodyMatch ? bodyMatch[1] : '';
        expect(body).not.toContain('two-col');
      });
    }
  });

  // ─── Sparse content doesn't break ───
  describe('Sparse resume handling', () => {
    for (const tid of EXPECTED_ATS_TEMPLATES) {
      it(`${tid}: renders without error for sparse data`, () => {
        expect(() => buildPrintHTML(SPARSE as any, tid)).not.toThrow();
      });
    }
  });

  // ─── Fresher with photo (campus) ───
  it('campus: renders fresher with photo without table', () => {
    const html = buildPrintHTML(FRESHER as any, 'campus');
    expect(html).not.toMatch(/<table[\s>]/i);
    // Photo should be present as img tag (decorative)
    expect(html).toContain('<img');
  });
});
