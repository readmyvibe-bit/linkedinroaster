import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions — Profile Roaster',
  description: 'Terms and conditions for using Profile Roaster LinkedIn analysis service.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen pb-16">
      <div className="max-w-3xl mx-auto px-4 pt-12">
        <a href="/" className="text-sm font-medium mb-8 inline-block" style={{ color: 'var(--li-blue)' }}>
          &larr; Back to Home
        </a>

        <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--li-text-primary)' }}>
          Terms &amp; Conditions
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--li-text-secondary)' }}>
          Last updated: March 29, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--li-text-primary)' }}>

          <section>
            <h2 className="text-lg font-bold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Profile Roaster (&ldquo;profileroaster.in&rdquo;, &ldquo;the Service&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;),
              you agree to be bound by these Terms and Conditions. If you do not agree to all of these terms, you must not use the Service.
            </p>
            <p className="mt-2">
              We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance
              of the modified terms. We will make reasonable efforts to notify users of material changes via email or a notice on the website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">2. Description of Service</h2>
            <p>
              Profile Roaster is an AI-powered LinkedIn profile analysis and optimization service. The Service provides:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Headline analysis and scoring (free teaser)</li>
              <li>Full profile roast with humor-based critique (paid)</li>
              <li>Complete profile rewrite including headline, about section, and experience bullets (paid)</li>
              <li>Before and after score breakdown across headline, about, experience, and completeness (paid)</li>
              <li>Hidden strengths analysis (paid)</li>
              <li>Shareable roast card image (paid)</li>
              <li>Pro plan features: headline variations, ATS keyword optimization, job description matching, and custom cover letter (paid)</li>
            </ul>
            <p className="mt-2">
              The Service uses artificial intelligence (Claude by Anthropic and Gemini by Google) to generate analyses and rewrites.
              AI-generated content is provided as suggestions and should be reviewed by the user before being published on their LinkedIn profile.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">3. User Eligibility</h2>
            <p>
              You must be at least 18 years of age or the age of majority in your jurisdiction to use the Service.
              By using the Service, you represent and warrant that you meet this requirement.
            </p>
            <p className="mt-2">
              You must provide accurate and complete information when using the Service, including a valid email address.
              You are responsible for maintaining the confidentiality of your order information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">4. User Content and Data</h2>
            <p>
              By submitting your LinkedIn profile data to the Service, you represent and warrant that:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>You own the profile data or have the right to submit it for analysis</li>
              <li>The data you provide is your own LinkedIn profile content</li>
              <li>You are not submitting another person&rsquo;s profile data without their explicit consent</li>
              <li>The data does not contain any malicious code, scripts, or content designed to exploit the Service</li>
            </ul>
            <p className="mt-2">
              You retain full ownership of your profile data. We do not claim any intellectual property rights over your submitted content.
              We use your data solely for the purpose of generating your roast, analysis, and rewrite.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">5. Intellectual Property</h2>
            <p>
              The AI-generated roasts, rewrites, analyses, scores, and card images produced by the Service are provided to you for
              your personal use. You are granted a non-exclusive, perpetual license to use, modify, and publish the generated
              content on your LinkedIn profile or any other platform.
            </p>
            <p className="mt-2">
              The Service itself, including its design, algorithms, scoring methodology, branding, logos, and codebase,
              remains the intellectual property of Profile Roaster. You may not copy, reproduce, reverse-engineer, or create
              derivative works based on the Service.
            </p>
            <p className="mt-2">
              Shareable roast card images may be shared on social media platforms with the &ldquo;profileroaster.in&rdquo; watermark intact.
              You may not remove or alter the watermark.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">6. Pricing and Payment</h2>
            <p>
              The Service offers two paid plans:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Standard Plan:</strong> &#8377;299 (INR) &mdash; one-time payment</li>
              <li><strong>Pro Plan:</strong> &#8377;599 (INR) &mdash; one-time payment</li>
            </ul>
            <p className="mt-2">
              All prices are in Indian Rupees (INR) and include applicable taxes. Prices are subject to change without prior notice.
              Any price change will not affect orders that have already been placed and paid for.
            </p>
            <p className="mt-2">
              Payments are processed securely through Razorpay, a PCI-DSS compliant payment gateway. We do not store your credit card,
              debit card, UPI, or net banking credentials on our servers. All payment data is handled directly by Razorpay in accordance
              with their security standards.
            </p>
            <p className="mt-2">
              Standard plan users may upgrade to Pro by paying the difference (&#8377;300). Upgrades are processed immediately and
              the additional Pro features are generated without reprocessing the full pipeline.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">7. Delivery of Service</h2>
            <p>
              Results are typically delivered within 60&ndash;120 seconds after successful payment. Processing involves multiple
              AI stages: parsing, analysis, roasting, rewriting, quality checking, and scoring.
            </p>
            <p className="mt-2">
              In rare cases, processing may take longer due to high demand, AI service availability, or complex profiles.
              If processing fails, the order will be flagged for manual review and either reprocessed or refunded within 48 hours.
            </p>
            <p className="mt-2">
              Results are accessible via a unique URL sent to your email address. Results remain accessible for a minimum of 30 days
              after generation. After 30 days, profile data is deleted but results URLs may continue to work.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">8. Accuracy and Disclaimer</h2>
            <p>
              The Service provides AI-generated analysis and suggestions. While we strive for high quality and accuracy:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Scores are relative assessments based on our proprietary algorithm and are not endorsed by or affiliated with LinkedIn</li>
              <li>AI-generated rewrites are suggestions that should be reviewed and personalized before publishing</li>
              <li>We do not guarantee any specific outcome such as increased profile views, recruiter contacts, or job offers</li>
              <li>The roast is intended as constructive entertainment and should not be taken as professional career advice</li>
              <li>ATS keyword suggestions are based on general industry patterns and may not match specific company ATS systems</li>
            </ul>
            <p className="mt-2">
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Profile Roaster and its owners, operators, employees, and affiliates
              shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your use of or inability to use the Service</li>
              <li>Any errors, inaccuracies, or omissions in the AI-generated content</li>
              <li>Unauthorized access to or alteration of your data</li>
              <li>Any loss of data, revenue, profits, or business opportunities</li>
              <li>Any third-party conduct or content on the Service</li>
            </ul>
            <p className="mt-2">
              Our total liability for any claim arising from the Service shall not exceed the amount you paid for the specific order in question.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">10. Prohibited Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Submit false, misleading, or fraudulent profile data</li>
              <li>Submit another person&rsquo;s profile without their explicit written consent</li>
              <li>Attempt to reverse-engineer, decompile, or extract the AI prompts, scoring algorithms, or any proprietary technology</li>
              <li>Use automated tools, bots, or scripts to access the Service in bulk</li>
              <li>Resell, redistribute, or commercially exploit the Service or its output without written permission</li>
              <li>Interfere with or disrupt the Service, servers, or networks connected to the Service</li>
              <li>Attempt to bypass payment mechanisms or access paid features without payment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">11. Referral Program</h2>
            <p>
              The Service offers a referral program where users can earn &#8377;50 credit for each successful referral.
              Referral credits are subject to the following conditions:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>The referred user must complete a paid order using your unique referral link</li>
              <li>Self-referrals are not permitted and will be voided</li>
              <li>We reserve the right to modify or discontinue the referral program at any time</li>
              <li>Fraudulent or abusive referral activity will result in forfeiture of all credits and possible account suspension</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">12. Third-Party Services</h2>
            <p>
              The Service integrates with the following third-party services:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Razorpay:</strong> Payment processing (governed by Razorpay&rsquo;s terms of service)</li>
              <li><strong>Anthropic (Claude):</strong> AI analysis and content generation</li>
              <li><strong>Google (Gemini):</strong> AI parsing and analysis</li>
              <li><strong>Supabase:</strong> Data storage and card image hosting</li>
              <li><strong>Sentry:</strong> Error monitoring and performance tracking</li>
            </ul>
            <p className="mt-2">
              We are not responsible for the availability, accuracy, or practices of these third-party services.
              Your use of these services is subject to their respective terms and privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">13. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at any time, without prior notice, for
              conduct that we determine violates these Terms, is harmful to other users, or is otherwise objectionable.
            </p>
            <p className="mt-2">
              Upon termination, your right to access the Service ceases immediately. Any provisions of these Terms that by their
              nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">14. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from
              or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.
            </p>
            <p className="mt-2">
              Before initiating any formal legal proceedings, you agree to first attempt to resolve the dispute informally by
              contacting us at the email address provided below. We will attempt to resolve the dispute within 30 business days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">15. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction,
              that provision shall be limited or eliminated to the minimum extent necessary so that the remaining provisions
              of these Terms shall remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">16. Entire Agreement</h2>
            <p>
              These Terms, together with the Privacy Policy and Refund Policy, constitute the entire agreement between you and
              Profile Roaster regarding your use of the Service. These Terms supersede any prior agreements or understandings,
              whether written or oral.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">17. Contact Information</h2>
            <p>
              For any questions, concerns, or disputes regarding these Terms, please contact us at:
            </p>
            <p className="mt-2 font-medium">
              Profile Roaster<br />
              Email: support@profileroaster.in<br />
              Website: profileroaster.in
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
