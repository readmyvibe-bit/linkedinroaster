import { z } from 'zod';

/**
 * ATS Content Contract — Resume Data Validator
 * Validates AI-generated resume_data before saving.
 * Run after generation, retry on failure, hard fail if unfixable.
 */

// ─── Schema ───

const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
}).passthrough();

const ExperienceSchema = z.object({
  title: z.string().optional(),
  role: z.string().optional(),
  company: z.string().min(1, 'Company name required'),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  dates: z.string().optional(),
  current: z.boolean().optional(),
  bullets: z.array(z.string().min(5, 'Bullet too short')).optional(),
}).refine(
  d => (d.title && d.title.length > 0) || (d.role && d.role.length > 0),
  { message: 'Experience entry must have title or role' }
).passthrough();

const EducationSchema = z.object({
  institution: z.string().optional(),
  school: z.string().optional(),
  degree: z.string().optional(),
  field: z.string().optional(),
  year: z.string().optional(),
  dates: z.string().optional(),
  gpa: z.string().optional(),
}).refine(
  d => (d.institution || d.school),
  { message: 'Education entry must have institution or school' }
).passthrough();

const SkillsSchema = z.union([
  z.array(z.string()),
  z.array(z.object({ category: z.string().optional(), skills: z.array(z.string()).optional() }).passthrough()),
  z.object({
    technical: z.array(z.string()).optional(),
    soft: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
  }).passthrough(),
]);

const CustomSectionSchema = z.object({
  title: z.string().min(1),
  items: z.array(z.string().min(1)),
});

export const ResumeDataSchema = z.object({
  contact: ContactSchema.optional(),
  summary: z.string().optional(),
  experience: z.array(ExperienceSchema).optional(),
  education: z.array(EducationSchema).optional(),
  skills: SkillsSchema.optional(),
  achievements: z.array(z.string()).optional(),
  custom_sections: z.array(CustomSectionSchema).optional(),
  photo: z.string().optional(),
}).passthrough();

// ─── Validation Result ───

export interface ResumeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ─── Validator ───

export function validateResumeData(data: any): ResumeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Schema validation
  const result = ResumeDataSchema.safeParse(data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`${issue.path.join('.')}: ${issue.message}`);
    }
  }

  // 2. Content quality checks
  if (!data) {
    errors.push('Resume data is null/undefined');
    return { valid: false, errors, warnings };
  }

  // Contact
  if (!data.contact?.name || data.contact.name.length < 2) {
    errors.push('Missing or too short contact name');
  }

  // Summary
  if (data.summary && data.summary.length < 20) {
    warnings.push('Summary is very short (< 20 chars)');
  }

  // Experience
  const experience = data.experience || [];
  if (experience.length === 0) {
    warnings.push('No experience entries');
  }
  for (let i = 0; i < experience.length; i++) {
    const exp = experience[i];
    const bullets = exp.bullets || [];

    // Bullet length check
    for (let j = 0; j < bullets.length; j++) {
      if (bullets[j].length > 300) {
        warnings.push(`experience[${i}].bullets[${j}]: bullet too long (${bullets[j].length} chars, max 300)`);
      }
      if (bullets[j].length < 10) {
        warnings.push(`experience[${i}].bullets[${j}]: bullet too short (${bullets[j].length} chars)`);
      }
    }

    // Max bullets per role
    if (bullets.length > 8) {
      warnings.push(`experience[${i}]: too many bullets (${bullets.length}, recommend max 6-8)`);
    }

    // Date check
    if (!exp.dates && !exp.start_date) {
      warnings.push(`experience[${i}]: missing dates for ${exp.title || exp.role || 'unknown role'}`);
    }
  }

  // Education
  const education = data.education || [];
  for (let i = 0; i < education.length; i++) {
    if (!education[i].institution && !education[i].school) {
      errors.push(`education[${i}]: missing institution`);
    }
  }

  // Skills
  if (!data.skills || (Array.isArray(data.skills) && data.skills.length === 0)) {
    warnings.push('No skills listed');
  }

  // Achievements (not required, but warn if empty in non-fresher profiles)
  if (experience.length >= 3 && (!data.achievements || data.achievements.length === 0)) {
    warnings.push('No achievements listed for experienced profile');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
