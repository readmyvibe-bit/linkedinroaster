import { Resend } from 'resend';
import { query } from '../db';

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');
const FROM = `Profile Roaster <${process.env.FROM_EMAIL || 'support@profileroaster.in'}>`;
const EMAIL_ENABLED = !!process.env.RESEND_API_KEY;
const BASE_URL = 'https://profileroaster.in';

// ═══ Sequence definitions ═══
interface SequenceEmail {
  day: number;
  key: string;
  subject: (data: OrderData) => string;
  body: (data: OrderData) => string;
}

interface OrderData {
  id: string;
  email: string;
  plan: string;
  before_score: number;
  after_score: number;
  roast_title: string;
  rewritten_headline: string;
  has_resume: boolean;
}

const ROAST_SEQUENCE: SequenceEmail[] = [
  {
    day: 3,
    key: 'day3_update_nudge',
    subject: (d) => `Did you update your LinkedIn? (Score: ${d.before_score}→${d.after_score})`,
    body: (d) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
        <div style="background:#004182;padding:20px 24px;border-radius:8px 8px 0 0">
          <span style="color:white;font-size:18px;font-weight:700">Profile Roaster</span>
        </div>
        <div style="background:white;padding:24px;border:1px solid #E0E0E0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:16px;font-weight:700;color:#191919">Hey! Your rewritten profile is waiting 👋</p>
          <p style="font-size:14px;line-height:1.6;color:#555">
            3 days ago, your LinkedIn score went from <strong style="color:#CC1016">${d.before_score}</strong> to
            <strong style="color:#057642">${d.after_score}</strong>. That's a +${d.after_score - d.before_score} point improvement.
          </p>
          <p style="font-size:14px;line-height:1.6;color:#555">
            But the improvement only counts if you actually paste the rewrite into LinkedIn. It takes 5 minutes:
          </p>
          <ol style="font-size:14px;line-height:1.8;color:#555;padding-left:20px">
            <li>Open your results: <a href="${BASE_URL}/results/${d.id}" style="color:#0A66C2">View Results</a></li>
            <li>Click "Copy" next to each section</li>
            <li>Paste into LinkedIn (Headline → About → Experience)</li>
          </ol>
          <div style="text-align:center;margin:24px 0">
            <a href="${BASE_URL}/results/${d.id}" style="display:inline-block;padding:12px 32px;background:#0A66C2;color:white;border-radius:50px;font-size:15px;font-weight:700;text-decoration:none">
              Open My Results →
            </a>
          </div>
          <p style="font-size:13px;color:#888">Your new headline: "${d.rewritten_headline?.slice(0, 80) || ''}"</p>
        </div>
        <p style="font-size:11px;color:#999;text-align:center;margin-top:16px">Profile Roaster · <a href="${BASE_URL}" style="color:#999">profileroaster.in</a></p>
      </div>
    `,
  },
  {
    day: 7,
    key: 'day7_resume_nudge',
    subject: (d) => `Your ATS resume is waiting — don't just fix LinkedIn`,
    body: (d) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
        <div style="background:#004182;padding:20px 24px;border-radius:8px 8px 0 0">
          <span style="color:white;font-size:18px;font-weight:700">Profile Roaster</span>
        </div>
        <div style="background:white;padding:24px;border:1px solid #E0E0E0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:16px;font-weight:700;color:#191919">Your LinkedIn rewrite also makes a great resume 📄</p>
          <p style="font-size:14px;line-height:1.6;color:#555">
            ${d.has_resume
              ? 'You already built a resume — nice! Make sure you download it in PDF and DOCX before applying.'
              : `Your ${d.plan === 'pro' ? '3 resume slots' : '1 resume slot'} are included in your plan. Don't let them go to waste.`
            }
          </p>
          <p style="font-size:14px;line-height:1.6;color:#555">
            Paste any job description and AI builds a targeted, ATS-optimized resume in 60 seconds. 23 templates, PDF + DOCX + TXT downloads.
          </p>
          <div style="text-align:center;margin:24px 0">
            <a href="${BASE_URL}/results/${d.id}" style="display:inline-block;padding:12px 32px;background:#057642;color:white;border-radius:50px;font-size:15px;font-weight:700;text-decoration:none">
              Build My Resume →
            </a>
          </div>
        </div>
        <p style="font-size:11px;color:#999;text-align:center;margin-top:16px">Profile Roaster · <a href="${BASE_URL}" style="color:#999">profileroaster.in</a></p>
      </div>
    `,
  },
  {
    day: 14,
    key: 'day14_tips',
    subject: () => `5 things to do after updating your LinkedIn`,
    body: (d) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
        <div style="background:#004182;padding:20px 24px;border-radius:8px 8px 0 0">
          <span style="color:white;font-size:18px;font-weight:700">Profile Roaster</span>
        </div>
        <div style="background:white;padding:24px;border:1px solid #E0E0E0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:16px;font-weight:700;color:#191919">Updated your profile? Here's what to do next 🚀</p>
          <ol style="font-size:14px;line-height:2;color:#555;padding-left:20px">
            <li><strong>Turn on "Open to Work"</strong> — Settings → Job seeking preferences</li>
            <li><strong>Connect with 50 people this week</strong> — Alumni, recruiters, hiring managers</li>
            <li><strong>Comment on 3 posts daily</strong> — Gets you visible in feeds</li>
            <li><strong>Update your profile photo</strong> — Professional headshot, plain background</li>
            <li><strong>Apply to 5 jobs using Easy Apply</strong> — Your new profile + resume combo is ready</li>
          </ol>
          <div style="text-align:center;margin:24px 0">
            <a href="${BASE_URL}/results/${d.id}" style="display:inline-block;padding:12px 32px;background:#0A66C2;color:white;border-radius:50px;font-size:15px;font-weight:700;text-decoration:none">
              View My Results →
            </a>
          </div>
        </div>
        <p style="font-size:11px;color:#999;text-align:center;margin-top:16px">Profile Roaster · <a href="${BASE_URL}" style="color:#999">profileroaster.in</a></p>
      </div>
    `,
  },
  {
    day: 25,
    key: 'day25_expiry_warning',
    subject: (d) => `⚠️ Your roast results expire in 5 days`,
    body: (d) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
        <div style="background:#CC1016;padding:20px 24px;border-radius:8px 8px 0 0">
          <span style="color:white;font-size:18px;font-weight:700">Profile Roaster</span>
        </div>
        <div style="background:white;padding:24px;border:1px solid #E0E0E0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:16px;font-weight:700;color:#CC1016">Your results will be deleted in 5 days ⏰</p>
          <p style="font-size:14px;line-height:1.6;color:#555">
            For privacy, we delete all profile data 30 days after your order. That means your roast, rewrite, and resume data will be permanently removed on day 30.
          </p>
          <p style="font-size:14px;line-height:1.6;color:#555"><strong>Before that happens, make sure you:</strong></p>
          <ul style="font-size:14px;line-height:1.8;color:#555;padding-left:20px">
            <li>Paste your rewrite into LinkedIn</li>
            <li>Download your resume (PDF + DOCX + TXT)</li>
            <li>Download your cover letter</li>
            <li>Save your roast card</li>
          </ul>
          <div style="text-align:center;margin:24px 0">
            <a href="${BASE_URL}/results/${d.id}" style="display:inline-block;padding:12px 32px;background:#CC1016;color:white;border-radius:50px;font-size:15px;font-weight:700;text-decoration:none">
              Save My Results Now →
            </a>
          </div>
        </div>
        <p style="font-size:11px;color:#999;text-align:center;margin-top:16px">Profile Roaster · <a href="${BASE_URL}" style="color:#999">profileroaster.in</a></p>
      </div>
    `,
  },
  {
    day: 30,
    key: 'day30_final',
    subject: () => `Last chance: your profile data is being deleted today`,
    body: (d) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
        <div style="background:#CC1016;padding:20px 24px;border-radius:8px 8px 0 0">
          <span style="color:white;font-size:18px;font-weight:700">Profile Roaster</span>
        </div>
        <div style="background:white;padding:24px;border:1px solid #E0E0E0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:16px;font-weight:700;color:#CC1016">Final reminder — data deletion today 🗑️</p>
          <p style="font-size:14px;line-height:1.6;color:#555">
            Your roast results, rewritten profile, and resume data will be permanently deleted today as part of our 30-day privacy policy.
          </p>
          <p style="font-size:14px;line-height:1.6;color:#555">
            If you haven't saved everything yet, this is your last chance.
          </p>
          <div style="text-align:center;margin:24px 0">
            <a href="${BASE_URL}/results/${d.id}" style="display:inline-block;padding:12px 32px;background:#CC1016;color:white;border-radius:50px;font-size:15px;font-weight:700;text-decoration:none">
              Save Everything Now →
            </a>
          </div>
          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:16px;margin-top:16px">
            <p style="font-size:14px;font-weight:700;color:#057642;margin:0 0 4px">Want to get roasted again?</p>
            <p style="font-size:13px;color:#555;margin:0">Your profile has changed since last time. Get a fresh roast to see how you've improved. <a href="${BASE_URL}" style="color:#0A66C2">Start over →</a></p>
          </div>
        </div>
        <p style="font-size:11px;color:#999;text-align:center;margin-top:16px">Profile Roaster · <a href="${BASE_URL}" style="color:#999">profileroaster.in</a></p>
      </div>
    `,
  },
];

// ═══ Process sequences ═══
// Check if a specific email key should be sent for an order
export async function sendSingleSequenceEmail(orderId: string, emailKey: string): Promise<{ success: boolean; error?: string }> {
  if (!EMAIL_ENABLED) return { success: false, error: 'Email disabled' };

  const seq = ROAST_SEQUENCE.find(s => s.key === emailKey);
  if (!seq) return { success: false, error: `Unknown email key: ${emailKey}` };

  const result = await query(`
    SELECT o.id, o.email, o.plan,
           o.before_score->'overall' as before_score,
           o.after_score->'overall' as after_score,
           o.roast->'roast_title' as roast_title,
           o.rewrite->'rewritten_headline' as rewritten_headline,
           o.sequence_emails_sent,
           EXISTS(SELECT 1 FROM resumes r WHERE r.order_id=o.id) as has_resume
    FROM orders o WHERE o.id=$1
  `, [orderId]);

  if (!result.rows.length) return { success: false, error: 'Order not found' };
  const order = result.rows[0];

  const data: OrderData = {
    id: order.id, email: order.email, plan: order.plan,
    before_score: order.before_score || 0, after_score: order.after_score || 0,
    roast_title: order.roast_title || '', rewritten_headline: order.rewritten_headline || '',
    has_resume: order.has_resume || false,
  };

  try {
    await resend.emails.send({ from: FROM, to: data.email, subject: seq.subject(data), html: seq.body(data) });
    const alreadySent = order.sequence_emails_sent || {};
    alreadySent[emailKey] = true;
    await query('UPDATE orders SET sequence_emails_sent=$1 WHERE id=$2', [JSON.stringify(alreadySent), orderId]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Get available sequence email keys
export function getSequenceKeys(): { key: string; day: number }[] {
  return ROAST_SEQUENCE.map(s => ({ key: s.key, day: s.day }));
}

export async function processEmailSequences(): Promise<{ sent: number; errors: number }> {
  if (!EMAIL_ENABLED) { console.log('[SEQUENCES] Email disabled — skipping'); return { sent: 0, errors: 0 }; }

  // Check global pause
  const settings = await query("SELECT value FROM email_settings WHERE key='sequences_enabled'");
  if (settings.rows[0]?.value !== 'true') {
    console.log('[SEQUENCES] Globally paused — skipping');
    return { sent: 0, errors: 0 };
  }

  // Get opt-out list
  const optouts = await query('SELECT email FROM email_optouts');
  const optoutSet = new Set(optouts.rows.map((r: any) => r.email.toLowerCase()));

  let sent = 0;
  let errors = 0;

  // Get all completed roast orders from last 30 days
  const orders = await query(`
    SELECT o.id, o.email, o.plan,
           o.before_score->'overall' as before_score,
           o.after_score->'overall' as after_score,
           o.roast->'roast_title' as roast_title,
           o.rewrite->'rewritten_headline' as rewritten_headline,
           o.processing_done_at, o.sequence_emails_sent,
           EXISTS(SELECT 1 FROM resumes r WHERE r.order_id=o.id) as has_resume
    FROM orders o
    WHERE o.payment_status='paid'
      AND o.processing_status='done'
      AND o.processing_done_at IS NOT NULL
      AND o.processing_done_at > NOW() - INTERVAL '31 days'
      AND o.email IS NOT NULL
      AND o.email != ''
  `);

  for (const order of orders.rows) {
    // Skip opted-out users
    if (optoutSet.has(order.email.toLowerCase())) continue;

    const doneAt = new Date(order.processing_done_at);
    const daysSinceDone = Math.floor((Date.now() - doneAt.getTime()) / (1000 * 60 * 60 * 24));
    const alreadySent: Record<string, boolean> = order.sequence_emails_sent || {};

    for (const seq of ROAST_SEQUENCE) {
      // Check if it's time for this email and it hasn't been sent
      if (daysSinceDone >= seq.day && !alreadySent[seq.key]) {
        // Don't send if we're too late (more than 2 days past the target day)
        if (daysSinceDone > seq.day + 2) {
          alreadySent[seq.key] = true; // Mark as skipped
          continue;
        }

        const data: OrderData = {
          id: order.id,
          email: order.email,
          plan: order.plan,
          before_score: order.before_score || 0,
          after_score: order.after_score || 0,
          roast_title: order.roast_title || '',
          rewritten_headline: order.rewritten_headline || '',
          has_resume: order.has_resume || false,
        };

        try {
          await resend.emails.send({
            from: FROM,
            to: data.email,
            subject: seq.subject(data),
            html: seq.body(data),
          });
          alreadySent[seq.key] = true;
          sent++;
          console.log(`[SEQUENCES] Sent ${seq.key} to ${data.email} (order ${data.id})`);
        } catch (err: any) {
          console.error(`[SEQUENCES] Failed ${seq.key} for ${data.email}: ${err.message}`);
          errors++;
        }
      }
    }

    // Update tracking
    await query(
      'UPDATE orders SET sequence_emails_sent=$1 WHERE id=$2',
      [JSON.stringify(alreadySent), order.id]
    );
  }

  console.log(`[SEQUENCES] Done: ${sent} sent, ${errors} errors`);
  return { sent, errors };
}
