import { Resend } from 'resend';
import { query } from '../db';
import ResultsEmail from '../emails/ResultsEmail';
import RefundEmail from '../emails/RefundEmail';
import TeaserFollowUpEmail from '../emails/TeaserFollowUpEmail';

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');
const FROM = `Profile Roaster <${process.env.FROM_EMAIL || 'roast@profileroaster.in'}>`;
const EMAIL_ENABLED = !!process.env.RESEND_API_KEY;

export async function sendResultsEmail(order: any): Promise<void> {
  if (!EMAIL_ENABLED) {
    console.log(`[EMAIL DISABLED] Would send results email to ${order.email}`);
    return;
  }
  const beforeScore = order.before_score || { overall: 0 };
  const afterScore = order.after_score || { overall: 0 };

  const subject = `Your LinkedIn Roast is Ready 🔥 Score: ${beforeScore.overall}→${afterScore.overall}`;

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
