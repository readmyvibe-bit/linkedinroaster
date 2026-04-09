import type { Metadata } from 'next';
import { LegalPageShell } from '../../components/saas/LegalPageShell';

export const metadata: Metadata = {
  title: 'Privacy Policy — ProfileRoaster',
  description: 'Privacy policy for Profile Roaster — AI profile rewrite, resume, and interview prep services.',
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" updated="March 31, 2026">
      <div className="space-y-8">

          <section>
            <h2 className="text-lg font-bold mb-3">1. Introduction</h2>
            <p>
              Profile Roaster (&ldquo;profileroaster.in&rdquo;, &ldquo;the Service&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
              is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, share, and protect your personal
              information when you use our Service, including the LinkedIn Profile Rewrite, ATS Resume Builder, and User Dashboard features.
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
              <li><strong>Email address:</strong> Required for order creation, delivery of results, dashboard login, and OTP verification</li>
              <li><strong>LinkedIn headline:</strong> Submitted for free teaser analysis</li>
              <li><strong>LinkedIn profile data:</strong> Raw text pasted from your LinkedIn profile including headline, about section, experience, education, skills, and certifications (Profile Rewrite)</li>
              <li><strong>Personal details:</strong> Full name, phone number, location, career stage, target role, target industry</li>
              <li><strong>Education data:</strong> Institution, degree, field of study, year, GPA</li>
              <li><strong>Experience data:</strong> Company names, roles, dates, descriptions</li>
              <li><strong>Skills and certifications:</strong> Technical skills, soft skills, professional certifications</li>
              <li><strong>Resume uploads:</strong> PDF or DOCX files uploaded for auto-fill or reference (ATS Resume Builder)</li>
              <li><strong>Job description:</strong> Target job descriptions submitted for resume targeting and JD matching</li>
              <li><strong>Feedback and ratings:</strong> Optional feedback and 1&ndash;5 star ratings you provide after receiving results</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Order metadata:</strong> Order ID, plan type, payment status, processing status, timestamps</li>
              <li><strong>Payment information:</strong> Razorpay order ID and payment ID (we do NOT store card numbers, UPI IDs, or banking credentials)</li>
              <li><strong>Session tokens:</strong> Encrypted session identifiers stored in Redis for dashboard authentication (7-day expiry)</li>
              <li><strong>IP address:</strong> Collected for rate limiting and fraud prevention only; not used for profiling or tracking</li>
              <li><strong>Referral data:</strong> Referral codes and conversion tracking</li>
              <li><strong>Usage data:</strong> Page views, teaser attempts, and conversion events for internal analytics</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">2.3 Information We Do NOT Collect</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>We do NOT access your LinkedIn account directly</li>
              <li>We do NOT require LinkedIn login or OAuth authentication</li>
              <li>We do NOT scrape or crawl LinkedIn profiles</li>
              <li>We do NOT store credit card, debit card, or banking credentials</li>
              <li>We do NOT store passwords (authentication is OTP-based only)</li>
              <li>We do NOT use cookies for advertising or third-party tracking</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Service delivery:</strong> To parse, analyse, rewrite, and score your LinkedIn profile; to build ATS-optimized resumes and cover letters</li>
              <li><strong>Result delivery:</strong> To send you unique results URLs, email notifications, and downloadable documents</li>
              <li><strong>Dashboard access:</strong> To authenticate you via OTP and display your order history, results, and resumes</li>
              <li><strong>Card generation:</strong> To create shareable score card images from your profile scores</li>
              <li><strong>Payment processing:</strong> To create and verify Razorpay payment orders</li>
              <li><strong>Quality improvement:</strong> To monitor AI output quality and improve our prompts, scoring algorithms, and resume templates</li>
              <li><strong>Customer support:</strong> To respond to your inquiries, feedback, or refund requests</li>
              <li><strong>Fraud prevention:</strong> To detect and prevent fraudulent orders, rate limit abuse, or referral programme abuse</li>
              <li><strong>Analytics:</strong> To understand usage patterns, conversion rates, and improve the Service (aggregated, non-personal data)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">4. Data Processing by AI</h2>
            <p>
              Your data is processed by the following AI services:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Google Gemini:</strong> Used for profile parsing (extracting structured data from raw text), analysis scoring, and quality checking</li>
              <li><strong>Anthropic Claude:</strong> Used for profile analysis, profile rewriting, resume generation, and cover letter creation</li>
            </ul>
            <p className="mt-2">
              Your data is sent to these AI providers via their APIs for processing. Both Anthropic and Google have data
              processing agreements in place. Your data is used solely for generating your results and is not used to train AI models,
              as per the API terms of both providers.
            </p>
            <p className="mt-2">
              For Profile Rewrite, profile text content is transmitted. For Resume Builder, your profile data is sent to generate the resume.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">5. Data Storage and Security</h2>

            <h3 className="font-semibold mt-4 mb-2">5.1 Where Your Data is Stored</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Database:</strong> Supabase (PostgreSQL) hosted on AWS ap-south-1 (Mumbai, India)</li>
              <li><strong>Card images:</strong> Supabase Storage (S3-compatible object storage)</li>
              <li><strong>Queue and sessions:</strong> Upstash Redis for job processing and dashboard session management</li>
              <li><strong>Backend server:</strong> Railway (cloud hosting)</li>
              <li><strong>Frontend:</strong> Vercel (global CDN)</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">5.2 Security Measures</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>All data is transmitted over HTTPS/TLS encryption</li>
              <li>Database connections use SSL encryption</li>
              <li>Payment processing is handled by PCI-DSS compliant Razorpay</li>
              <li>API keys and secrets are stored as environment variables, never in source code</li>
              <li>Dashboard authentication uses cryptographically secure OTP codes with 10-minute expiry</li>
              <li>Session tokens are stored in Redis with 7-day TTL and are cryptographically random (256-bit)</li>
              <li>Razorpay webhooks are verified using HMAC-SHA256 signature verification</li>
              <li>Error monitoring via Sentry with personal data scrubbing enabled</li>
              <li>No human reads your profile data during normal operations &mdash; processing is fully automated by AI</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">5.3 Data Retention</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Profile data (raw paste / form input):</strong> Retained for 30 days, then deleted via automated daily cleanup</li>
              <li><strong>Generated results (rewrite, profiles):</strong> Retained for up to 90 days to allow user access via dashboard</li>
              <li><strong>Resumes and cover letters:</strong> Retained indefinitely until deleted by user or admin</li>
              <li><strong>Uploaded resume files:</strong> Text extracted for processing; original files are not stored permanently</li>
              <li><strong>Card images:</strong> Retained indefinitely (public shareable images)</li>
              <li><strong>Email addresses:</strong> Retained for customer support, dashboard access, and communication purposes</li>
              <li><strong>Payment records:</strong> Retained as required by Indian tax and accounting regulations (minimum 7 years)</li>
              <li><strong>Dashboard sessions:</strong> Automatically expire after 7 days</li>
              <li><strong>OTP codes:</strong> Automatically expire after 10 minutes</li>
              <li><strong>Teaser data (headline only):</strong> Deleted after 30 days for non-converted users</li>
            </ul>
            <p className="mt-2">
              Users can delete their results at any time by visiting{' '}
              <a href="https://profileroaster.in/recover" className="text-blue-600 underline">profileroaster.in/recover</a>{' '}
              and using the &ldquo;Delete my data&rdquo; option after OTP verification.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">6. Data Sharing</h2>
            <p>We do NOT sell, rent, or trade your personal information. We share data only with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Razorpay:</strong> Email address and order amount for payment processing</li>
              <li><strong>Anthropic:</strong> Profile text, form data, and resume data for AI generation</li>
              <li><strong>Google:</strong> Profile text content for AI parsing and quality checking</li>
              <li><strong>Supabase:</strong> All order data for database storage</li>
              <li><strong>Resend:</strong> Email address for transactional email delivery (results, OTP, follow-ups)</li>
              <li><strong>Sentry:</strong> Error data with personal information scrubbed</li>
              <li><strong>Upstash:</strong> Order IDs and session tokens for queue processing and authentication</li>
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
              <li><strong>Right to deletion:</strong> Request deletion of your personal data (subject to legal retention requirements). Use the /recover page or contact support.</li>
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
            <h2 className="text-lg font-bold mb-3">8. Cookies and Local Storage</h2>
            <p>
              The Service uses minimal cookies and local storage:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Essential cookies:</strong> Used by Next.js framework for page routing</li>
              <li><strong>Razorpay cookies:</strong> Set by Razorpay during payment processing for security and fraud prevention</li>
              <li><strong>Dashboard session:</strong> Authentication token stored in browser localStorage (7-day expiry)</li>
              <li><strong>Rate limiting:</strong> Teaser attempt count stored in localStorage to prevent abuse</li>
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
              Your data is primarily stored and processed in India (AWS Mumbai region). However, AI processing involves
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
              <li>Report the breach to relevant authorities as required by applicable law including CERT-In</li>
              <li>Take immediate steps to contain and remediate the breach</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify users of material changes by posting a notice
              on the website and updating the &ldquo;Last updated&rdquo; date at the top of this page.
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
    </LegalPageShell>
  );
}
