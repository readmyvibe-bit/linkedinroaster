import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy — Profile Roaster',
  description: 'Refund policy for Profile Roaster LinkedIn analysis, profile building, and resume services.',
};

export default function RefundPage() {
  return (
    <main className="min-h-screen pb-16">
      <div className="max-w-3xl mx-auto px-4 pt-12">
        <a href="/" className="text-sm font-medium mb-8 inline-block" style={{ color: 'var(--li-blue)' }}>
          &larr; Back to Home
        </a>

        <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--li-text-primary)' }}>
          Refund Policy
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--li-text-secondary)' }}>
          Last updated: March 31, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--li-text-primary)' }}>

          <section>
            <h2 className="text-lg font-bold mb-3">1. Overview</h2>
            <p>
              At Profile Roaster, we want you to be completely satisfied with your results. This Refund Policy outlines the
              conditions under which we offer refunds for all our paid services:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>LinkedIn Profile Rewrite:</strong> Standard (&#8377;499) and Pro (&#8377;999)</li>
              <li><strong>Build My LinkedIn:</strong> Standard (&#8377;499) and Pro (&#8377;999)</li>
              <li><strong>Upgrades:</strong> Standard to Pro (&#8377;500)</li>
            </ul>
            <p className="mt-2">
              Because our Service involves AI processing that consumes computational resources upon order fulfilment,
              refund eligibility depends on the specific circumstances described below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">2. Automatic Refund (Processing Failure)</h2>
            <p>
              You are entitled to a <strong>full automatic refund</strong> if:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Our AI pipeline fails to process your order and does not deliver results after 3 retry attempts</li>
              <li>The order gets stuck in processing for more than 10 minutes without completion</li>
              <li>A system error prevents delivery of your roast, rewrite, profile, resume, or scores</li>
              <li>Payment was captured but the order was not created in our system</li>
            </ul>
            <p className="mt-2">
              In these cases, our system automatically detects the failure and initiates a refund
              via Razorpay. You will receive the refund to your original payment method within 5&ndash;7 business days.
            </p>
            <p className="mt-2">
              You will also receive an email notification confirming the refund and the reason for the processing failure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">3. Quality-Based Refund</h2>
            <p>
              You may request a refund if you believe the results are <strong>significantly below acceptable quality</strong>. This includes:
            </p>

            <h3 className="font-semibold mt-4 mb-2">3.1 For Roast &amp; Rewrite Orders</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>The rewrite contains fabricated information not present in your original profile (invented company names, fake metrics, false credentials)</li>
              <li>The roast contains offensive, discriminatory, or personally attacking content beyond intended humor</li>
              <li>The results are clearly for a different person&rsquo;s profile (data mix-up)</li>
              <li>The rewrite is substantially incomplete (missing headline, about, or experience sections that were present in the original)</li>
              <li>The scores or analysis are clearly nonsensical</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">3.2 For Build My LinkedIn Orders</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>The generated profile contains fabricated education, companies, or certifications not provided in your form input</li>
              <li>The generated profile is substantially incomplete (missing headline, about section, or experience bullets)</li>
              <li>The setup guide is missing or contains clearly incorrect instructions</li>
              <li>The generated content is in the wrong language or for a completely different profession than requested</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">3.3 For ATS Resume Orders</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>The resume contains fabricated education, certifications, or work history</li>
              <li>The resume is substantially incomplete or clearly broken in formatting</li>
              <li>The PDF or DOCX download is non-functional</li>
            </ul>

            <p className="mt-4">
              To request a quality-based refund, email us at <strong>support@profileroaster.in</strong> within <strong>7 days</strong> of
              your order with:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your order ID (found in your results URL or dashboard)</li>
              <li>Your email address used during checkout</li>
              <li>A brief description of the quality issue</li>
            </ul>
            <p className="mt-2">
              We will review your request within 48 hours and issue a full refund if the quality concern is valid.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">4. Situations Where Refunds Are NOT Provided</h2>
            <p>
              Refunds will <strong>not</strong> be issued in the following cases:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Subjective dissatisfaction:</strong> You disagree with the roast humour, tone, or severity (the roast is intentionally direct by design)</li>
              <li><strong>Score disagreement:</strong> You disagree with the scores assigned (scores are based on our proprietary algorithm and AI analysis)</li>
              <li><strong>Style preferences:</strong> You prefer a different writing style, headline format, or resume template style than what was generated</li>
              <li><strong>Insufficient input:</strong> You provided minimal data (e.g., only a headline, or empty experience fields) and received limited results as a consequence</li>
              <li><strong>Duplicate orders:</strong> You placed multiple orders for the same profile or the same details (contact us to resolve duplicates before requesting a refund)</li>
              <li><strong>Change of mind:</strong> You no longer want the Service after results have been delivered</li>
              <li><strong>Profile updates:</strong> Your LinkedIn profile or career details changed after submitting and the results no longer match</li>
              <li><strong>Upgrade dissatisfaction:</strong> You upgraded from Standard to Pro and are unsatisfied with the additional Pro features only (the Standard results were already delivered)</li>
              <li><strong>Resume template preference:</strong> You want a different template style (you can switch templates and re-download at any time)</li>
              <li><strong>Plan selection regret:</strong> You chose Standard when you wanted Pro (contact support for an upgrade instead)</li>
              <li><strong>Late request:</strong> Refund requested more than 7 days after the order was completed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">5. Refund Process</h2>

            <h3 className="font-semibold mt-4 mb-2">5.1 Automatic Refunds (Processing Failure)</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Detected automatically during quality check or pipeline monitoring</li>
              <li>Refund initiated via Razorpay within 1 hour of failure detection</li>
              <li>Email notification sent to you confirming the refund</li>
              <li>Refund amount: Full order amount</li>
              <li>Refund timeline: 5&ndash;7 business days to reflect in your account</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">5.2 Manual Refunds (Quality-Based)</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Submit request to support@profileroaster.in with order ID and description</li>
              <li>We review the request and your results within 48 hours</li>
              <li>If approved, refund is initiated via Razorpay</li>
              <li>Refund amount: Full order amount</li>
              <li>Refund timeline: 5&ndash;10 business days after approval</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">5.3 Refund Method</h3>
            <p>
              All refunds are processed through Razorpay and returned to the original payment method:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Credit/Debit cards:</strong> 5&ndash;7 business days</li>
              <li><strong>UPI:</strong> 3&ndash;5 business days</li>
              <li><strong>Net banking:</strong> 5&ndash;7 business days</li>
              <li><strong>Wallets:</strong> 3&ndash;5 business days</li>
            </ul>
            <p className="mt-2">
              We cannot process refunds to a different payment method or account than the one used for the original transaction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">6. Partial Refunds</h2>
            <p>
              In some cases, we may offer a partial refund or service credit instead of a full refund:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Partial delivery:</strong> If some sections were delivered correctly but others had issues, we may offer a 50% refund or free reprocessing</li>
              <li><strong>Pro upgrade issues:</strong> If the Standard results were satisfactory but additional Pro features had issues, we may refund only the upgrade amount</li>
              <li><strong>Resume-only issues:</strong> If the LinkedIn profile/roast was satisfactory but the resume had issues, we may offer free resume reprocessing</li>
              <li><strong>Reprocessing:</strong> In lieu of a refund, we may offer to reprocess your order through the pipeline at no additional cost</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">7. Cancellation Before Processing</h2>
            <p>
              If you wish to cancel your order <strong>before</strong> processing begins:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Contact us immediately at support@profileroaster.in with your order ID</li>
              <li>If processing has not started (status is still &ldquo;queued&rdquo; or &ldquo;pending&rdquo;), we will issue a full refund</li>
              <li>If processing has already begun, cancellation is not possible as AI resources have already been consumed</li>
            </ul>
            <p className="mt-2">
              Due to the speed of our pipeline (typically 60&ndash;120 seconds), the window for cancellation is very short.
              In most cases, results will be delivered before a cancellation request can be processed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">8. Dispute Resolution</h2>
            <p>
              If you are dissatisfied with our refund decision:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Reply to the refund decision email with additional details or evidence</li>
              <li>We will escalate the case for a second review within 72 hours</li>
              <li>If still unresolved, you may raise a dispute through Razorpay&rsquo;s dispute resolution mechanism</li>
              <li>As a last resort, disputes are subject to the jurisdiction of courts in New Delhi, India, as per the Consumer Protection Act, 2019</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">9. Abuse Prevention</h2>
            <p>
              We reserve the right to deny refund requests if we detect patterns of abuse, including but not limited to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Repeatedly placing orders and requesting refunds</li>
              <li>Using the results (copying profile content, downloading resumes) and then requesting a refund</li>
              <li>Sharing or publishing the results before requesting a refund</li>
              <li>Filing chargebacks or payment disputes without first contacting us</li>
              <li>Creating multiple accounts to exploit refund policies</li>
            </ul>
            <p className="mt-2">
              Users who abuse the refund policy may be blocked from future use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Refund Policy from time to time. Changes will be posted on this page with an updated
              &ldquo;Last updated&rdquo; date. The refund policy in effect at the time of your order will apply to that order.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">11. Contact Us</h2>
            <p>
              For refund requests, questions, or concerns:
            </p>
            <p className="mt-2 font-medium">
              Profile Roaster<br />
              Email: support@profileroaster.in<br />
              Website: profileroaster.in
            </p>
            <p className="mt-2">
              Please include your order ID and email address in all correspondence to help us resolve your request quickly.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
