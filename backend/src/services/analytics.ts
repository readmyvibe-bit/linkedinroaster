import { PostHog } from 'posthog-node';

const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY || 'dummy', {
  host: 'https://app.posthog.com',
  flushAt: 1,
  flushInterval: 0,
});

export function trackEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, any>,
): void {
  try {
    posthog.capture({ distinctId, event, properties });
  } catch (err) {
    console.error('[Analytics] Failed to track:', event, (err as Error).message);
  }
}

export function trackPaymentInitiated(email: string, plan: string, amount: number): void {
  trackEvent(email, 'payment_initiated', { plan, amount });
}

export function trackPaymentCompleted(email: string, plan: string, amount: number): void {
  trackEvent(email, 'payment_completed', { plan, amount });
}

export function trackUpgradeCompleted(email: string, orderId: string): void {
  trackEvent(email, 'upgrade_completed', { order_id: orderId });
}

export function trackProcessingCompleted(
  email: string,
  plan: string,
  beforeScore: number,
  afterScore: number,
  orderId: string,
): void {
  trackEvent(email, 'processing_completed', {
    plan,
    before_score: beforeScore,
    after_score: afterScore,
    order_id: orderId,
  });
}

export function trackRefundIssued(email: string, orderId: string, reason: string): void {
  trackEvent(email, 'refund_issued', { order_id: orderId, reason });
}

export async function shutdown(): Promise<void> {
  await posthog.shutdown();
}
