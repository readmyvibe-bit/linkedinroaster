import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import * as Sentry from '@sentry/node';
import { query } from '../db';
import { runBuildPipeline } from '../ai/build-pipeline';

// --- Redis connection for BullMQ ---
const connection = new Redis(process.env.UPSTASH_REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// QUEUE: Build profile processing
export const buildQueue = new Queue('process-build', { connection });

// WORKER: Process build orders
export const buildWorker = new Worker(
  'process-build',
  async (job: Job) => {
    const { razorpay_order_id, order_id } = job.data;
    let orderId = order_id;
    if (!orderId && razorpay_order_id) {
      const orderResult = await query('SELECT id FROM build_orders WHERE razorpay_order_id=$1', [razorpay_order_id]);
      if (!orderResult.rows[0]) throw new Error('Build order not found: ' + razorpay_order_id);
      orderId = orderResult.rows[0].id;
    }
    if (!orderId) throw new Error('No order_id or razorpay_order_id provided');
    await runBuildPipeline(orderId);
  },
  { connection, concurrency: 4 },
);

// Error handlers
buildWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[WORKER] process-build failed job ${job?.id}:`, err.message);
  Sentry.captureException(err, { extra: { job_id: job?.id } });
});

buildWorker.on('completed', (job: Job) => {
  console.log(`[WORKER] process-build completed job ${job.id}`);
});
