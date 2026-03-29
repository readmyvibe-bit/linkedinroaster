import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Profile Roaster',
  description: 'Privacy policy for Profile Roaster LinkedIn analysis service. How we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen pb-16">
      <div className="max-w-3xl mx-auto px-4 pt-12">
        <a href="/" className="text-sm font-medium mb-8 inline-block" style={{ color: 'var(--li-blue)' }}>
          &larr; Back to Home
        </a>

        <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--li-text-primary)' }}>
          Privacy Policy
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--li-text-secondary)' }}>
          Last updated: March 29, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--li-text-primary)' }}>

          <section>
            <h2 className="text-lg font-bold mb-3">1. Introduction</h2>
            <p>
              Profile Roaster (&ldquo;profileroaster.in&rdquo;, &ldquo;the Service&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
              is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, share, and protect your personal
              information when you use our Service.
            </p>
            <p className="mt-2">
              By using the Service, you consent to the data practices described in this policy. If you do not agree with any part of this
              policy, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">2. Information We Collect</h2>

            <h3 className="font-semibold mt-4 mb-2">2.1 Information You Provide Directly</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Email address:</strong> Required for order creation and delivery of results</li>
              <li><strong>LinkedIn headline:</strong> Submitted for free teaser analysis</li>
              <li><strong>LinkedIn profile data:</strong> Raw text pasted from your LinkedIn profile page including headline, about section, experience, education, skills, and certifications</li>
              <li><strong>Job description:</strong> Optionally submitted by Pro plan users for job matching analysis</li>
              <li><strong>Feedback and ratings:</strong> Optional feedback you provide after receiving results</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Order metadata:</strong> Order ID, plan type, payment status, timestamps</li>
              <li><strong>Payment information:</strong> Razorpay order ID and payment ID (we do NOT store card numbers, UPI IDs, or banking credentials)</li>
              <li><strong>Referral data:</strong> Referral codes and conversion tracking</li>
              <li><strong>Usage data:</strong> Page views, teaser attempts, and conversion events for analytics</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">2.3 Information We Do NOT Collect</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>We do NOT access your LinkedIn account directly</li>
              <li>We do NOT require LinkedIn login or OAuth authentication</li>
              <li>We do NOT scrape or crawl LinkedIn profiles</li>
              <li>We do NOT store credit card, debit card, or banking credentials</li>
              <li>We do NOT use cookies for advertising or third-party tracking</li>
              <li>We do NOT collect your IP address for profiling purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Service delivery:</strong> To parse, analyze, roast, rewrite, and score your LinkedIn profile</li>
              <li><strong>Result delivery:</strong> To send you a unique results URL and optional email notifications</li>
              <li><strong>Card generation:</strong> To create a shareable roast card image from your scores and top roast</li>
              <li><strong>Payment processing:</strong> To create and verify Razorpay payment orders</li>
              <li><strong>Quality improvement:</strong> To monitor AI output quality and improve our prompts and scoring algorithms</li>
              <li><strong>Customer support:</strong> To respond to your inquiries, feedback, or refund requests</li>
              <li><strong>Fraud prevention:</strong> To detect and prevent fraudulent orders or abuse of the referral program</li>
              <li><strong>Analytics:</strong> To understand usage patterns, conversion rates, and improve the Service (aggregated, non-personal data)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">4. Data Processing by AI</h2>
            <p>
              Your LinkedIn profile data is processed by the following AI services to generate your results:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Google Gemini:</strong> Used for initial profile parsing (Stage 1) to extract structured data from raw text</li>
              <li><strong>Anthropic Claude:</strong> Used for profile analysis (Stage 2), roast generation (Stage 3), profile rewrite (Stage 4), and quality checking (Stage 5)</li>
            </ul>
            <p className="mt-2">
              Your profile data is sent to these AI providers via their APIs for processing. Both Anthropic and Google have data
              processing agreements in place. Your data is used solely for generating your results and is not used to train AI models,
              as per the API terms of both providers.
            </p>
            <p className="mt-2">
              We do not send any identifying information (such as your name or email) to AI providers. Only the profile text content
              is transmitted for analysis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">5. Data Storage and Security</h2>

            <h3 className="font-semibold mt-4 mb-2">5.1 Where Your Data is Stored</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Database:</strong> Supabase (PostgreSQL) hosted on AWS ap-south-1 (Mumbai, India)</li>
              <li><strong>Card images:</strong> Supabase Storage (S3-compatible object storage)</li>
              <li><strong>Queue system:</strong> Upstash Redis for job processing</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">5.2 Security Measures</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>All data is transmitted over HTTPS/TLS encryption</li>
              <li>Database connections use SSL encryption</li>
              <li>Payment processing is handled by PCI-DSS compliant Razorpay</li>
              <li>API keys and secrets are stored as environment variables, never in source code</li>
              <li>Error monitoring via Sentry with personal data scrubbing enabled</li>
              <li>No human reads your profile data during normal operations &mdash; processing is fully automated by AI</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">5.3 Data Retention</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Profile data (raw paste):</strong> Deleted after 30 days via automated daily cleanup</li>
              <li><strong>Parsed profile data:</strong> Deleted after 30 days</li>
              <li><strong>Results (roast, rewrite, scores):</strong> Retained for up to 90 days to allow user access</li>
              <li><strong>Card images:</strong> Retained indefinitely (public shareable images)</li>
              <li><strong>Email addresses:</strong> Retained for customer support and communication purposes</li>
              <li><strong>Payment records:</strong> Retained as required by Indian tax and accounting regulations (minimum 7 years for financial records)</li>
              <li><strong>Teaser data (headline only):</strong> Deleted after 30 days for non-converted users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">6. Data Sharing</h2>
            <p>We do NOT sell, rent, or trade your personal information. We share data only with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Razorpay:</strong> Email address and order amount for payment processing</li>
              <li><strong>Anthropic:</strong> Profile text content (anonymized) for AI analysis and generation</li>
              <li><strong>Google:</strong> Profile text content (anonymized) for AI parsing</li>
              <li><strong>Supabase:</strong> All order data for database storage</li>
              <li><strong>Sentry:</strong> Error data with personal information scrubbed</li>
              <li><strong>Upstash:</strong> Order IDs for job queue processing</li>
            </ul>
            <p className="mt-2">
              We may disclose your information if required by law, court order, or government request, or to protect the rights,
              property, or safety of Profile Roaster, its users, or the public.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">7. Your Rights</h2>
            <p>You have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Right to access:</strong> Request a copy of all personal data we hold about you</li>
              <li><strong>Right to correction:</strong> Request correction of inaccurate personal data</li>
              <li><strong>Right to deletion:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
              <li><strong>Right to data portability:</strong> Request your data in a structured, machine-readable format</li>
              <li><strong>Right to withdraw consent:</strong> Withdraw your consent for data processing at any time</li>
              <li><strong>Right to object:</strong> Object to the processing of your personal data for specific purposes</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact us at support@profileroaster.in with your email address and order ID.
              We will respond within 30 business days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">8. Cookies and Tracking</h2>
            <p>
              The Service uses minimal cookies and does not use third-party advertising trackers.
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Essential cookies:</strong> Used by Next.js framework for page routing and session management</li>
              <li><strong>Razorpay cookies:</strong> Set by Razorpay during payment processing for security and fraud prevention</li>
              <li><strong>No advertising cookies:</strong> We do not use Google Analytics, Facebook Pixel, or any ad tracking cookies</li>
              <li><strong>No cross-site tracking:</strong> We do not track your activity on other websites</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">9. Children&rsquo;s Privacy</h2>
            <p>
              The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from
              children under 18. If we become aware that we have collected data from a child under 18, we will take steps to delete
              that information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">10. International Data Transfers</h2>
            <p>
              Your data is primarily stored and processed in India (AWS Mumbai region). However, AI processing may involve
              data transfer to servers operated by Anthropic (United States) and Google (global infrastructure) via their APIs.
            </p>
            <p className="mt-2">
              These transfers are necessary for the performance of the Service. Both providers maintain appropriate data
              protection measures and comply with applicable data protection regulations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">11. Data Breach Notification</h2>
            <p>
              In the event of a data breach that affects your personal information, we will:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Notify affected users via email within 72 hours of becoming aware of the breach</li>
              <li>Provide details about the nature of the breach, the data affected, and steps taken to mitigate it</li>
              <li>Report the breach to relevant authorities as required by applicable law</li>
              <li>Take immediate steps to contain and remediate the breach</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify users of material changes by posting a notice
              on the website and updating the &ldquo;Last updated&rdquo; date at the top of this page. We encourage you to review
              this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">13. Contact Information</h2>
            <p>
              For any questions, concerns, or requests regarding this Privacy Policy or your personal data, contact us at:
            </p>
            <p className="mt-2 font-medium">
              Profile Roaster<br />
              Email: support@profileroaster.in<br />
              Website: profileroaster.in
            </p>
            <p className="mt-2">
              If you are not satisfied with our response, you may lodge a complaint with the relevant data protection authority in your jurisdiction.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
