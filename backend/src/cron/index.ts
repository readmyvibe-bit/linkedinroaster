import cron from 'node-cron';
import { query } from '../db';
import { sendTeaserFollowUp } from '../services/email';

// ═══════════════════════════════════════════════════════
// CRON 1 — DATA CLEANUP (DPDPA compliance)
// Schedule: daily 20:30 UTC = 2:00 AM IST
// ═══════════════════════════════════════════════════════
export async function runDataCleanup(): Promise<{ ordersRedacted: number; teasersDeleted: number; eventsDeleted: number }> {
  console.log('[CRON] Data cleanup started');

  // Redact orders older than 30 days
  const orders = await query(`
    UPDATE orders SET
      profile_input = '{"redacted":true}'::jsonb,
      parsed_profile = NULL, roast = NULL, rewrite = NULL, quality_check = NULL,
      email = regexp_replace(email, '(.).+(@.+)', '\\1***\\2'),
      ip_address = NULL
    WHERE created_at < NOW() - INTERVAL '30 days'
      AND profile_input->>'redacted' IS NULL
  `);

  // Delete old teaser attempts
  const teasers = await query(
    `DELETE FROM teaser_attempts WHERE created_at < NOW() - INTERVAL '30 days'`,
  );

  // Delete old events
  const events = await query(
    `DELETE FROM events WHERE created_at < NOW() - INTERVAL '90 days'`,
  );

  const result = {
    ordersRedacted: orders.rowCount || 0,
    teasersDeleted: teasers.rowCount || 0,
    eventsDeleted: events.rowCount || 0,
  };

  console.log('[CRON] Data cleanup complete:', result);
  return result;
}

export function startDataCleanupCron(): void {
  cron.schedule('30 20 * * *', async () => {
    try {
      await runDataCleanup();
    } catch (err) {
      console.error('[CRON] Data cleanup failed:', (err as Error).message);
    }
  });
  console.log('[CRON] Data cleanup scheduled: daily 20:30 UTC');
}

// ═══════════════════════════════════════════════════════
// CRON 2 — ABANDONED TEASER FOLLOW-UP
// Schedule: daily 04:30 UTC = 10:00 AM IST
// ═══════════════════════════════════════════════════════
export async function runTeaserFollowUp(): Promise<{ sent: number; failed: number }> {
  console.log('[CRON] Teaser follow-up started');

  const result = await query(`
    SELECT id, email, headline_text, score, issues_found
    FROM teaser_attempts
    WHERE email IS NOT NULL
      AND converted = FALSE
      AND follow_up_sent = FALSE
      AND created_at BETWEEN NOW() - INTERVAL '48 hours'
                        AND NOW() - INTERVAL '24 hours'
  `);

  let sent = 0;
  let failed = 0;

  for (const row of result.rows) {
    try {
      const issues = Array.isArray(row.issues_found)
        ? row.issues_found.map((i: any) => i.issue || i)
        : [];

      await sendTeaserFollowUp(
        row.email,
        row.score || 0,
        row.headline_text,
        issues,
      );

      await query(
        'UPDATE teaser_attempts SET follow_up_sent=TRUE WHERE id=$1',
        [row.id],
      );

      sent++;
      console.log(`[CRON] Follow-up sent to ${row.email}`);
    } catch (err) {
      failed++;
      console.error(`[CRON] Follow-up failed for ${row.email}:`, (err as Error).message);
    }
  }

  const summary = { sent, failed };
  console.log('[CRON] Teaser follow-up complete:', summary);
  return summary;
}

export function startTeaserFollowUpCron(): void {
  cron.schedule('30 4 * * *', async () => {
    try {
      await runTeaserFollowUp();
    } catch (err) {
      console.error('[CRON] Teaser follow-up failed:', (err as Error).message);
    }
  });
  console.log('[CRON] Teaser follow-up scheduled: daily 04:30 UTC');
}

// ═══════════════════════════════════════════════════════
// CRON 3 — AUTO-CANCEL STUCK ORDERS
// Schedule: every 10 minutes
// ═══════════════════════════════════════════════════════
export async function runStuckOrderCleanup(): Promise<number> {
  const result = await query(`
    UPDATE orders SET processing_status='failed',
      processing_error='timeout_auto_cancelled',
      processing_done_at=NOW()
    WHERE payment_status='paid'
      AND processing_status NOT IN ('done', 'failed')
      AND paid_at < NOW() - INTERVAL '30 minutes'
    RETURNING id, email
  `);

  if (result.rows.length > 0) {
    console.log(`[CRON] Auto-cancelled ${result.rows.length} stuck orders:`, result.rows.map((r: any) => r.id));
  }

  return result.rows.length;
}

export function startStuckOrderCron(): void {
  cron.schedule('*/10 * * * *', async () => {
    try {
      await runStuckOrderCleanup();
    } catch (err) {
      console.error('[CRON] Stuck order cleanup failed:', (err as Error).message);
    }
  });
  console.log('[CRON] Stuck order cleanup scheduled: every 10 minutes');
}

// Start all crons
export function startAllCrons(): void {
  startDataCleanupCron();
  startTeaserFollowUpCron();
  startStuckOrderCron();
}
