export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProfileInput(data: {
  headline?: string; about?: string;
  experience?: string; raw_paste?: string;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const combined = [data.headline, data.about, data.experience, data.raw_paste]
    .filter(Boolean).join(' ');
  if (combined.length < 30)
    errors.push('Profile too short. Paste at least your headline and about section.');
  if (combined.length > 15000)
    errors.push('Profile too long. Paste only headline, about, and experience.');
  if (!data.headline && !data.raw_paste)
    errors.push('Please paste your LinkedIn profile.');
  const li = /experience|education|skills|about|company|role|manager|engineer|developer|intern|analyst|consultant|lead|head|director|founder|ceo|cto|vp|freelance/i;
  if (combined.length > 100 && !data.raw_paste && !li.test(combined))
    errors.push('This does not look like a LinkedIn profile.');
  if (!data.about && !data.raw_paste?.toLowerCase().includes('about'))
    warnings.push('No About section found. Results will focus on headline and experience.');
  return { valid: errors.length === 0, errors, warnings };
}

export const validateEmail = (e: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
