import { Resend } from 'resend';
import { query } from '../db';
import ResultsEmail from '../emails/ResultsEmail';
import RefundEmail from '../emails/RefundEmail';
import TeaserFollowUpEmail from '../emails/TeaserFollowUpEmail';

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');
const FROM = `ProfileRoaster <${process.env.FROM_EMAIL || 'support@profileroaster.in'}>`;
const EMAIL_ENABLED = !!process.env.RESEND_API_KEY;

export async function sendResultsEmail(order: any): Promise<void> {
  if (!EMAIL_ENABLED) {
    console.log(`[EMAIL DISABLED] Would send results email to ${order.email}`);
    return;
  }
  const beforeScore = order.before_score || { overall: 0 };
  const afterScore = order.after_score || { overall: 0 };

  const subject = `Your Resume + LinkedIn Rewrite is Ready — Score: ${beforeScore.overall} → ${afterScore.overall}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: order.email,
    subject,
    react: ResultsEmail({
      beforeScore,
      afterScore,
      rewrite: order.rewrite,
      cardImageUrl: order.card_image_url,
      orderId: order.id,
      plan: order.plan,
    }),
  });

  if (error) throw error;

  await query(
    'UPDATE orders SET email_sent=TRUE, email_sent_at=NOW() WHERE id=$1',
    [order.id],
  );
}

export async function sendBuildResultsEmail(order: any): Promise<void> {
  if (!EMAIL_ENABLED) {
    console.log(`[EMAIL DISABLED] Would send build results email to ${order.email}`);
    return;
  }

  const headline = order.generated_profile?.headline_variations?.[0]?.text || 'Your LinkedIn profile';
  const subject = `Your LinkedIn Profile is Ready — ${headline.slice(0, 50)}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: order.email,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:20px;font-weight:800;color:#0A66C2">Profile</span>
          <span style="font-size:20px;font-weight:800;color:#191919">Roaster</span>
        </div>
        <h1 style="font-size:22px;color:#191919;text-align:center;margin-bottom:8px">Your LinkedIn Profile is Ready!</h1>
        <p style="color:#666;text-align:center;margin-bottom:24px">AI has built your complete LinkedIn profile. Copy-paste each section and you're done.</p>
        <div style="background:#F0F7FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px;margin-bottom:16px">
          <div style="font-size:12px;font-weight:600;color:#0A66C2;margin-bottom:4px">YOUR HEADLINE</div>
          <div style="font-size:15px;font-weight:600;color:#191919">${headline}</div>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="https://profileroaster.in/build/results/${order.id}" style="display:inline-block;background:#0A66C2;color:white;padding:14px 32px;border-radius:50px;font-size:15px;font-weight:700;text-decoration:none">
            View Full Profile &rarr;
          </a>
        </div>
        <p style="font-size:12px;color:#999;text-align:center">Bookmark the link above to access your results anytime.</p>
        <hr style="border:none;border-top:1px solid #E0E0E0;margin:24px 0" />
        <p style="font-size:11px;color:#999;text-align:center">Profile Roaster &bull; profileroaster.in</p>
      </div>
    `,
  });

  if (error) throw error;

  await query(
    'UPDATE build_orders SET email_sent=TRUE, email_sent_at=NOW() WHERE id=$1',
    [order.id],
  );
}

export async function sendRefundEmail(email: string, orderId: string): Promise<void> {
  if (!EMAIL_ENABLED) {
    console.log(`[EMAIL DISABLED] Would send refund email to ${email}`);
    return;
  }
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Your refund has been processed — Profile Roaster',
    react: RefundEmail({ orderId }),
  });

  if (error) {
    console.error('Failed to send refund email:', error);
  }
}

export async function sendTeaserFollowUp(
  email: string,
  score: number,
  headline: string,
  issues: string[],
): Promise<void> {
  if (!EMAIL_ENABLED) {
    console.log(`[EMAIL DISABLED] Would send teaser follow-up to ${email}`);
    return;
  }
  const ctaUrl = `https://profileroaster.in/?utm_source=email&utm_medium=followup&utm_campaign=teaser`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Your LinkedIn score was ${score}/100 — here is how to fix it`,
    react: TeaserFollowUpEmail({ score, headline, issues, ctaUrl }),
  });

  if (error) {
    console.error('Failed to send teaser follow-up:', error);
  }
}

export async function sendStudentWelcomeEmails(
  students: Array<{ email: string; code: string; name: string }>,
  collegeName: string,
): Promise<void> {
  if (!EMAIL_ENABLED) {
    console.log(`[EMAIL DISABLED] Would send ${students.length} student welcome emails for ${collegeName}`);
    return;
  }

  for (const student of students) {
    try {
      await resend.emails.send({
        from: FROM,
        to: student.email,
        subject: `Your FREE resume + LinkedIn profile is ready — ${collegeName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
            <div style="background:#057642;padding:24px;border-radius:8px 8px 0 0;text-align:center">
              <div style="color:white;font-size:20px;font-weight:700">ProfileRoaster</div>
              <div style="color:rgba(255,255,255,0.85);font-size:14px;margin-top:4px">Student Plan — ${collegeName}</div>
            </div>
            <div style="background:white;padding:28px;border:1px solid #E0E0E0;border-top:none;border-radius:0 0 8px 8px">
              <p style="font-size:16px;font-weight:700;color:#191919;margin:0 0 8px">
                Hi${student.name ? ' ' + student.name.split(' ')[0] : ''}! Your placement toolkit is ready.
              </p>
              <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px">
                Your college (${collegeName}) has arranged free access to ProfileRoaster for you. This includes a professional ATS resume, LinkedIn profile content, interview prep, and a step-by-step LinkedIn setup guide.
              </p>

              <div style="background:#F0FDF4;border:2px solid #057642;border-radius:10px;padding:20px;text-align:center;margin:0 0 24px">
                <div style="font-size:12px;font-weight:700;color:#057642;letter-spacing:2px;margin:0 0 8px">YOUR REFERRAL CODE</div>
                <div style="font-size:28px;font-weight:800;color:#191919;letter-spacing:3px;font-family:monospace">${student.code}</div>
              </div>

              <p style="font-size:15px;font-weight:700;color:#191919;margin:0 0 14px">How to redeem (takes 2 minutes):</p>

              <div style="margin:0 0 24px">
                <div style="display:flex;gap:12px;margin:0 0 14px;align-items:flex-start">
                  <div style="width:28px;height:28px;border-radius:50%;background:#0B69C7;color:white;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">1</div>
                  <div>
                    <div style="font-size:14px;font-weight:600;color:#191919">Go to profileroaster.in</div>
                    <div style="font-size:13px;color:#666">Open in any browser (phone or laptop)</div>
                  </div>
                </div>
                <div style="display:flex;gap:12px;margin:0 0 14px;align-items:flex-start">
                  <div style="width:28px;height:28px;border-radius:50%;background:#0B69C7;color:white;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">2</div>
                  <div>
                    <div style="font-size:14px;font-weight:600;color:#191919">Click "Student" tab</div>
                    <div style="font-size:13px;color:#666">You'll see 4 tabs: Resume, LinkedIn, No File, Student. Click Student.</div>
                  </div>
                </div>
                <div style="display:flex;gap:12px;margin:0 0 14px;align-items:flex-start">
                  <div style="width:28px;height:28px;border-radius:50%;background:#0B69C7;color:white;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">3</div>
                  <div>
                    <div style="font-size:14px;font-weight:600;color:#191919">Fill your details (4 quick steps)</div>
                    <div style="font-size:13px;color:#666">Name, college, degree, target role, skills, projects. Takes 2 minutes.</div>
                  </div>
                </div>
                <div style="display:flex;gap:12px;margin:0 0 14px;align-items:flex-start">
                  <div style="width:28px;height:28px;border-radius:50%;background:#0B69C7;color:white;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">4</div>
                  <div>
                    <div style="font-size:14px;font-weight:600;color:#191919">Click "Have a referral code?" below the Pay button</div>
                    <div style="font-size:13px;color:#666">Enter your code <strong>${student.code}</strong> and click Redeem. Use email: <strong>${student.email}</strong></div>
                  </div>
                </div>
                <div style="display:flex;gap:12px;align-items:flex-start">
                  <div style="width:28px;height:28px;border-radius:50%;background:#057642;color:white;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">5</div>
                  <div>
                    <div style="font-size:14px;font-weight:600;color:#057642">Done! AI builds everything in 90 seconds</div>
                    <div style="font-size:13px;color:#666">Resume (PDF), LinkedIn profile, setup guide, 5 interview questions</div>
                  </div>
                </div>
              </div>

              <div style="text-align:center;margin:0 0 20px">
                <a href="https://profileroaster.in/?tab=student" style="display:inline-block;padding:14px 36px;background:#057642;color:white;border-radius:50px;font-size:16px;font-weight:700;text-decoration:none">
                  Redeem Now — profileroaster.in
                </a>
              </div>

              <div style="background:#F9FAFB;border-radius:8px;padding:14px;margin:0 0 16px">
                <div style="font-size:13px;font-weight:600;color:#191919;margin:0 0 6px">What you get (FREE):</div>
                <div style="font-size:13px;color:#555;line-height:1.8">
                  ✓ Professional ATS resume (11 templates, PDF download)<br>
                  ✓ LinkedIn headline + about + experience content<br>
                  ✓ 10-step LinkedIn account setup guide<br>
                  ✓ 5 interview questions with STAR answers<br>
                  ✓ Connection message templates
                </div>
              </div>

              <p style="font-size:12px;color:#999;text-align:center;margin:16px 0 0">
                This code is valid for one use only. Use the email ${student.email} to redeem.<br>
                Questions? Contact support@profileroaster.in
              </p>
            </div>
          </div>
        `,
      });
      // Small delay between emails to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`Failed to send welcome email to ${student.email}:`, (err as Error).message);
    }
  }
}
