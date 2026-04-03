import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions — Profile Roaster',
  description: 'Terms and conditions for using Profile Roaster LinkedIn analysis, profile building, and resume services.',
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
          Last updated: March 31, 2026
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
              Profile Roaster is an AI-powered platform offering three categories of services:
            </p>

            <h3 className="font-semibold mt-4 mb-2">2.1 LinkedIn Profile Profile Rewrite</h3>
            <p>For users who already have a LinkedIn profile:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Headline analysis and scoring (free teaser)</li>
              <li>Full comprehensive profile analysis and scoring</li>
              <li>Complete profile rewrite including headline, about section, and experience bullets</li>
              <li>Before and after score breakdown across headline, about, experience, completeness, and ATS readiness</li>
              <li>Hidden strengths analysis and closing compliment</li>
              <li>Shareable profile score card</li>
              <li>Pro plan: 5 headline variations, ATS keyword optimization, job description matching</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">2.2 Build My LinkedIn</h3>
            <p>For users who do not yet have a LinkedIn profile:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>AI-generated complete LinkedIn profile from user-provided information (education, experience, skills)</li>
              <li>3 headline variations with different styles</li>
              <li>Professional About section (250&ndash;400 words)</li>
              <li>Experience bullets with action verbs and metrics</li>
              <li>Categorised skills list (technical, soft, tools)</li>
              <li>10-step LinkedIn setup guide with menu paths and common mistakes</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">2.3 ATS Resume Builder</h3>
            <p>Available as part of paid plans:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>AI-generated ATS-optimized resume from LinkedIn profile data or build data</li>
              <li>25 professional resume templates (15 standard + 10 Pro-exclusive)</li>
              <li>Cover letter generation</li>
              <li>PDF and TXT download</li>
              <li>Live resume editor with drag-to-reorder</li>
              <li>ATS score and keyword analysis</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">2.4 User Dashboard</h3>
            <p>
              Registered users can access a dashboard at profileroaster.in/dashboard via OTP email verification to view all past orders,
              results, and resumes. Dashboard access is available to any user who has completed a paid order.
            </p>

            <p className="mt-4">
              The Service uses artificial intelligence (Claude by Anthropic and Gemini by Google) to generate all analyses, profiles, rewrites, and resumes.
              AI-generated content is provided as suggestions and should be reviewed by the user before being published or used professionally.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">3. User Eligibility</h2>
            <p>
              You must be at least 18 years of age or the age of majority in your jurisdiction to use the Service.
              By using the Service, you represent and warrant that you meet this requirement.
            </p>
            <p className="mt-2">
              You must provide accurate and complete information when using the Service, including a valid email address,
              and truthful education, experience, and skills data for the Build My LinkedIn and Resume Builder services.
              You are responsible for maintaining the confidentiality of your account and order information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">4. User Content and Data</h2>
            <p>
              By submitting data to the Service (LinkedIn profile text, personal details, education, experience, skills, or resume uploads), you represent and warrant that:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>You own the data or have the right to submit it for processing</li>
              <li>For Rewrite orders: the LinkedIn profile data is your own or you have the profile owner&rsquo;s explicit consent</li>
              <li>For Build orders: the education, experience, and skills information you provide is truthful and accurate</li>
              <li>For Resume uploads: you own the resume or have the right to submit it</li>
              <li>The data does not contain any malicious code, scripts, or content designed to exploit the Service</li>
            </ul>
            <p className="mt-2">
              You retain full ownership of your submitted data. We do not claim any intellectual property rights over your content.
              We use your data solely for the purpose of generating your ordered results.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">5. Intellectual Property</h2>
            <p>
              All AI-generated content produced by the Service &mdash; including rewrites, analyses, LinkedIn profiles, headlines, about sections,
              experience bullets, resumes, cover letters, scores, and card images &mdash; is provided to you for your personal and professional use.
              You are granted a non-exclusive, perpetual license to use, modify, and publish the generated content on LinkedIn, resumes, job applications, or any other platform.
            </p>
            <p className="mt-2">
              The Service itself, including its design, algorithms, scoring methodology, AI prompts, resume templates, branding, logos, and codebase,
              remains the intellectual property of Profile Roaster. You may not copy, reproduce, reverse-engineer, or create
              derivative works based on the Service.
            </p>
            <p className="mt-2">
              Shareable profile score cards may be shared on social media with the &ldquo;profileroaster.in&rdquo; watermark intact.
              You may not remove or alter the watermark.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">6. Pricing and Payment</h2>
            <p>
              The Service offers the following paid plans:
            </p>

            <h3 className="font-semibold mt-4 mb-2">6.1 LinkedIn Profile Rewrite</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Standard Plan:</strong> &#8377;499 (INR) &mdash; AI profile analysis + complete rewrite, ATS resume builder (18 templates), cover letter generator, interview prep</li>
              <li><strong>Pro Plan:</strong> &#8377;999 (INR) &mdash; everything in Standard + all 28 premium templates, priority processing</li>
              <li><strong>Upgrade (Standard to Pro):</strong> &#8377;500 (INR) &mdash; difference payment</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">6.2 Build My LinkedIn</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Standard:</strong> &#8377;499 (INR) &mdash; AI-generated profile, setup guide, connection templates, ATS resume builder (18 templates), cover letter, interview prep</li>
              <li><strong>Pro:</strong> &#8377;999 (INR) &mdash; everything in Standard + all 28 premium templates, priority processing</li>
              <li><strong>Upgrade (Standard to Pro):</strong> &#8377;500 (INR) &mdash; difference payment</li>
            </ul>

            <p className="mt-4">
              All prices are in Indian Rupees (INR) and include applicable taxes. Prices are subject to change without prior notice.
              Any price change will not affect orders that have already been placed and paid for.
            </p>
            <p className="mt-2">
              All payments are one-time. There are no subscriptions, recurring charges, or hidden fees. Payments are processed securely
              through Razorpay, a PCI-DSS compliant payment gateway. We do not store your credit card, debit card, UPI, or
              net banking credentials on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">7. Delivery of Service</h2>
            <p>
              <strong>Profile Rewrite:</strong> Results are typically delivered within 60&ndash;120 seconds after successful payment.
              Processing involves multiple AI stages: parsing, analysis, rewriting, quality checking, and scoring.
            </p>
            <p className="mt-2">
              <strong>Build My LinkedIn:</strong> Results are typically delivered within 60&ndash;90 seconds after payment.
              Processing involves AI profile generation followed by a quality check. Revision retries may add 30&ndash;60 seconds.
            </p>
            <p className="mt-2">
              <strong>ATS Resume:</strong> Resume generation typically takes 30&ndash;45 seconds after form submission.
            </p>
            <p className="mt-2">
              In rare cases, processing may take longer due to high demand or AI service availability.
              If processing fails after 3 attempts, the order will be flagged for manual review and either reprocessed or refunded within 48 hours.
            </p>
            <p className="mt-2">
              Results are accessible via a unique URL sent to your email address and via the user dashboard.
              Results remain accessible for a minimum of 30 days. After 30 days, raw profile data is deleted but generated results may continue to be accessible.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">8. Resume Builder Terms</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Resume limits:</strong> Standard plans include up to 10 resumes per order. Pro plans include up to 25 resumes per order. Limits are enforced per order, not per user.</li>
              <li><strong>Template access:</strong> 18 templates are available to all plans. 10 additional premium templates are exclusive to Pro plans. Attempting to use a Pro template on a non-Pro plan will be blocked.</li>
              <li><strong>Resume editing:</strong> Users may edit generated resumes at any time via the live editor. Edits are saved automatically.</li>
              <li><strong>Data accuracy:</strong> The AI generates resume content based on the data you provide. We do not fabricate education, certifications, or employment history. Users must verify all content for accuracy before using it in job applications.</li>
              <li><strong>PDF/TXT download:</strong> Users may download resumes in PDF (via browser print) and TXT format. Downloaded files are yours to use without restriction.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">9. Accuracy and Disclaimer</h2>
            <p>
              The Service provides AI-generated analysis and suggestions. While we strive for high quality and accuracy:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Scores are relative assessments based on our proprietary algorithm and are not endorsed by or affiliated with LinkedIn</li>
              <li>AI-generated content (rewrites, profiles, resumes, cover letters) are suggestions that should be reviewed and personalised before publishing or using</li>
              <li>We do not guarantee any specific outcome such as increased profile views, recruiter contacts, interview calls, or job offers</li>
              <li>The analysis is intended as constructive guidance and should not be taken as professional career advice</li>
              <li>ATS keyword suggestions are based on general industry patterns and may not match specific company ATS systems</li>
              <li>The Build My LinkedIn setup guide provides general instructions based on LinkedIn&rsquo;s interface at the time of writing; LinkedIn may change its interface at any time</li>
            </ul>
            <p className="mt-2">
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">10. AI-Generated Content Disclaimer</h2>
            <p>
              All content produced by the Service &mdash; including profile rewrites, LinkedIn profiles, headlines, about sections,
              experience bullets, resumes, cover letters, ATS keyword recommendations, and scoring &mdash; is generated by artificial
              intelligence and is provided as suggestions only.
            </p>
            <p className="mt-2">
              Users are strongly advised to review all AI-generated content for accuracy before applying it to their LinkedIn profile,
              resume, job application, or any professional document. Profile Roaster is not responsible for any inaccuracies, omissions,
              or consequences arising from the use of AI-generated content.
            </p>
            <p className="mt-2">
              Specifically, users should verify that: company names, job titles, employment dates, metrics, educational qualifications,
              certifications, and claimed achievements are factually correct before publishing. AI may occasionally generate details
              that were not present in the original input or that are inaccurate.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">11. User Accounts and Dashboard</h2>
            <p>
              Users who have completed a paid order can access a personal dashboard via OTP (one-time password) email verification.
              The dashboard provides access to all past orders, generated results, and resumes associated with the user&rsquo;s email address.
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Dashboard sessions are valid for 7 days before requiring re-authentication</li>
              <li>You are responsible for maintaining the security of your email account, as it serves as your sole authentication method</li>
              <li>We reserve the right to suspend dashboard access if we detect suspicious activity</li>
              <li>Dashboard access does not grant any additional rights beyond viewing your own order data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">12. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Profile Roaster and its owners, operators, employees, and affiliates
              shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your use of or inability to use the Service</li>
              <li>Any errors, inaccuracies, or omissions in the AI-generated content including resumes, profiles, or cover letters</li>
              <li>Any consequences of using AI-generated content in job applications, interviews, or professional settings</li>
              <li>Unauthorized access to or alteration of your data</li>
              <li>Any loss of data, revenue, profits, or business opportunities</li>
              <li>Any third-party conduct or content on the Service</li>
            </ul>
            <p className="mt-2">
              Our total liability for any claim arising from the Service shall not exceed the amount you paid for the specific order in question.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">13. Prohibited Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Submit false, misleading, or fraudulent data (including fabricated education, experience, or credentials)</li>
              <li>Submit another person&rsquo;s profile or personal information without their explicit written consent</li>
              <li>Use AI-generated resumes or profiles to misrepresent your qualifications to employers</li>
              <li>Attempt to reverse-engineer, decompile, or extract the AI prompts, scoring algorithms, resume templates, or any proprietary technology</li>
              <li>Use automated tools, bots, or scripts to access the Service in bulk</li>
              <li>Resell, redistribute, or commercially exploit the Service or its output without written permission</li>
              <li>Interfere with or disrupt the Service, servers, or networks connected to the Service</li>
              <li>Attempt to bypass payment mechanisms, resume limits, or template locks</li>
              <li>Share or distribute login credentials or dashboard access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">14. Referral Program</h2>
            <p>
              The Service offers a referral program where users can earn &#8377;50 credit for each successful referral.
              Referral credits are subject to the following conditions:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>The referred user must complete a paid order using your unique referral link</li>
              <li>Referral credits apply to Profile Rewrite orders only</li>
              <li>Self-referrals are not permitted and will be voided</li>
              <li>We reserve the right to modify or discontinue the referral program at any time</li>
              <li>Fraudulent or abusive referral activity will result in forfeiture of all credits and possible account suspension</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">15. Third-Party Services</h2>
            <p>
              The Service integrates with the following third-party services:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Razorpay:</strong> Payment processing (governed by Razorpay&rsquo;s terms of service)</li>
              <li><strong>Anthropic (Claude):</strong> AI content generation (rewrites, analyses, profiles, resumes, cover letters)</li>
              <li><strong>Google (Gemini):</strong> AI parsing, analysis, and quality checking</li>
              <li><strong>Supabase:</strong> Data storage and card image hosting</li>
              <li><strong>Resend:</strong> Transactional email delivery</li>
              <li><strong>Sentry:</strong> Error monitoring and performance tracking</li>
              <li><strong>Upstash:</strong> Redis caching and session management</li>
            </ul>
            <p className="mt-2">
              We are not responsible for the availability, accuracy, or practices of these third-party services.
              Your use of these services is subject to their respective terms and privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">16. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at any time, without prior notice, for
              conduct that we determine violates these Terms, is harmful to other users, or is otherwise objectionable.
            </p>
            <p className="mt-2">
              Upon termination, your right to access the Service and dashboard ceases immediately. Already-generated content
              (resumes, profiles) that you have downloaded remains yours to use. Any provisions of these Terms that by their
              nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">17. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, including the Information Technology Act, 2000
              and the Consumer Protection Act, 2019. Any disputes arising from or relating to these Terms or the Service shall be subject
              to the exclusive jurisdiction of the courts in New Delhi, India.
            </p>
            <p className="mt-2">
              Before initiating any formal legal proceedings, you agree to first attempt to resolve the dispute informally by
              contacting us at the email address provided below. We will attempt to resolve the dispute within 30 business days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">18. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction,
              that provision shall be limited or eliminated to the minimum extent necessary so that the remaining provisions
              of these Terms shall remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">19. Entire Agreement</h2>
            <p>
              These Terms, together with the Privacy Policy and Refund Policy, constitute the entire agreement between you and
              Profile Roaster regarding your use of the Service. These Terms supersede any prior agreements or understandings,
              whether written or oral.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">20. Contact Information</h2>
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
