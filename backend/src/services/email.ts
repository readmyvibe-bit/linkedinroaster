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
      roast: order.roast,
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
