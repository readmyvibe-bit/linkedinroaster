import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import * as Sentry from '@sentry/node';
import { query } from '../db';
import { runPipeline, stage4b_proRewrite } from '../ai/pipeline';

// --- Redis connection for BullMQ ---
const connection = new Redis(process.env.UPSTASH_REDIS_URL!, {
  maxRetriesPerRequest: null, // required for BullMQ
});

// QUEUE 1: Normal AI processing
export const profileQueue = new Queue('process-profile', { connection });

// QUEUE 2: Upgrade processing (Stage 4b only)
export const upgradeQueue = new Queue('process-upgrade', { connection });

// WORKER 1: Process new orders
export const profileWorker = new Worker(
  'process-profile',
  async (job: Job) => {
    const { razorpay_order_id } = job.data;
    const orderResult = await query(
      'SELECT id FROM orders WHERE razorpay_order_id=$1',
      [razorpay_order_id],
    );
    if (!orderResult.rows[0])
      throw new Error('Order not found: ' + razorpay_order_id);
    await runPipeline(orderResult.rows[0].id);
  },
  { connection, concurrency: 3 },
);

// WORKER 2: Process upgrades (only Stage 4b — no full pipeline)
export const upgradeWorker = new Worker(
  'process-upgrade',
  async (job: Job) => {
    const { order_id } = job.data;
    const orderResult = await query('SELECT * FROM orders WHERE id=$1', [order_id]);
    const o = orderResult.rows[0];
    if (!o) throw new Error('Order not found: ' + order_id);

    // Reuse saved parsed_profile + analysis — only run stage4b
    const proRewrite = await stage4b_proRewrite(
      o.parsed_profile,
      o.analysis,
      o.job_description,
    );

    // Update order with Pro rewrite
    await query(
      'UPDATE orders SET rewrite=$1, plan=$2 WHERE id=$3',
      [JSON.stringify(proRewrite), 'pro', order_id],
    );

    // Stub: re-send results email with Pro content
    console.log(`[STUB] sendResultsEmail for upgraded order ${order_id}`);
  },
  { connection, concurrency: 3 },
);

// Error handlers
profileWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[WORKER] process-profile failed job ${job?.id}:`, err.message);
  Sentry.captureException(err, { extra: { job_id: job?.id } });
});

upgradeWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[WORKER] process-upgrade failed job ${job?.id}:`, err.message);
  Sentry.captureException(err, { extra: { job_id: job?.id } });
});

profileWorker.on('completed', (job: Job) => {
  console.log(`[WORKER] process-profile completed job ${job.id}`);
});

upgradeWorker.on('completed', (job: Job) => {
  console.log(`[WORKER] process-upgrade completed job ${job.id}`);
});
