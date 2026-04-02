'use client';

import { useState } from 'react';
import Link from 'next/link';

// ─── Types ───
type Tab = 'roast' | 'build';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  features: PlanFeature[];
  highlighted?: boolean;
  ctaLabel: string;
  ctaHref: string;
}

// ─── Plan Data ───
const roastPlans: Plan[] = [
  {
    name: 'Standard',
    price: '\u20B9299',
    features: [
      { text: 'Complete LinkedIn Roast + Rewrite', included: true },
      { text: 'ATS Resume Builder (any job, 15 templates, PDF + TXT)', included: true },
      { text: '1 Cover Letter', included: true },
      { text: 'Free rescore anytime', included: true },
      { text: 'Shareable roast card', included: true },
    ],
    ctaLabel: 'Get Standard \u2192',
    ctaHref: '/?plan=standard',
  },
  {
    name: 'Pro',
    price: '\u20B9799',
    highlighted: true,
    features: [
      { text: 'Everything in Standard', included: true },
      { text: '5 Headline Variations', included: true },
      { text: 'All 25 premium templates', included: true },
      { text: '3 Cover Letters (one per target job)', included: true },
      { text: 'Advanced ATS keyword matching', included: true },
      { text: 'Priority processing', included: true },
    ],
    ctaLabel: 'Get Pro \u2192',
    ctaHref: '/?plan=pro',
  },
];

const buildPlans: Plan[] = [
  {
    name: 'Profile Starter',
    price: '\u20B9199',
    features: [
      { text: 'AI-generated headline (3 variations)', included: true },
      { text: 'Professional About section', included: true },
      { text: 'Experience bullets from projects & internships', included: true },
      { text: 'Skills list ranked by industry', included: true },
      { text: '10-step LinkedIn setup guide', included: true },
      { text: 'Connection request templates', included: true },
      { text: 'Free rescore anytime', included: true },
      { text: 'ATS Resume', included: false },
      { text: 'Cover Letter', included: false },
      { text: 'Premium templates', included: false },
    ],
    ctaLabel: 'Get Started \u2192',
    ctaHref: '/build/form?plan=starter',
  },
  {
    name: 'Profile + Resume',
    price: '\u20B9399',
    highlighted: true,
    features: [
      { text: 'Everything in Starter', included: true },
      { text: 'ATS Resume Builder (any job, 15 templates, PDF + TXT)', included: true },
      { text: '1 Cover Letter', included: true },
      { text: 'Job description targeting', included: true },
    ],
    ctaLabel: 'Get Started \u2192',
    ctaHref: '/build/form?plan=plus',
  },
  {
    name: 'Profile Pro',
    price: '\u20B9699',
    features: [
      { text: 'Everything in Profile + Resume', included: true },
      { text: '3 Cover Letters (one per target job)', included: true },
      { text: 'All 25 premium templates', included: true },
      { text: 'Priority processing', included: true },
    ],
    ctaLabel: 'Get Started \u2192',
    ctaHref: '/build/form?plan=pro',
  },
];

// ─── FAQ Data ───
const faqs = [
  {
    q: "What's the difference between Roast and Build?",
    a: 'Roast is for people who already have LinkedIn. Build is for creating a profile from scratch.',
  },
  {
    q: 'Can I upgrade from Standard to Pro later?',
    a: 'Yes. Pay \u20B9500 difference anytime from your results page.',
  },
  {
    q: 'Is this a subscription?',
    a: 'No. One-time payment. No recurring charges.',
  },
  {
    q: "What if I'm not satisfied?",
    a: 'We offer refunds within 7 days. See our refund policy.',
  },
];

// ─── PlanCard Component ───
function PlanCard({ plan }: { plan: Plan }) {
  const isHighlighted = plan.highlighted;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        borderRadius: 12,
        border: isHighlighted ? '2px solid #0B69C7' : '1px solid #E0E0E0',
        padding: 28,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {isHighlighted && (
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0B69C7',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            padding: '4px 14px',
            borderRadius: 20,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          Most Popular
        </div>
      )}

      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: isHighlighted ? '#0B69C7' : '#666666',
          marginBottom: 4,
        }}
      >
        {plan.name}
      </div>

      <div
        style={{
          fontSize: 36,
          fontWeight: 800,
          color: '#191919',
          marginBottom: 20,
        }}
      >
        {plan.price}
      </div>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginBottom: 24,
        }}
      >
        {plan.features.map((f, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: 14,
              color: f.included ? '#191919' : '#999999',
              lineHeight: '1.45',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                marginTop: 1,
                color: f.included ? '#057642' : '#999999',
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              {f.included ? '\u2713' : '\u2717'}
            </span>
            {f.text}
          </li>
        ))}
      </ul>

      <Link
        href={plan.ctaHref}
        style={{
          display: 'block',
          width: '100%',
          padding: '14px 0',
          borderRadius: 24,
          border: 'none',
          fontSize: 15,
          fontWeight: 600,
          textAlign: 'center',
          textDecoration: 'none',
          cursor: 'pointer',
          color: isHighlighted ? '#FFFFFF' : '#FFFFFF',
          background: isHighlighted
            ? '#0B69C7'
            : plan.name === 'Standard'
              ? '#E16B00'
              : '#666666',
          boxSizing: 'border-box',
        }}
      >
        {plan.ctaLabel}
      </Link>

      <p
        style={{
          fontSize: 12,
          color: '#666666',
          textAlign: 'center',
          marginTop: 12,
          marginBottom: 0,
        }}
      >
        One-time payment &mdash; results in 60-90 seconds
      </p>
    </div>
  );
}

// ─── FAQ Item ───
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        borderBottom: '1px solid #E0E0E0',
        padding: '16px 0',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontSize: 15,
          fontWeight: 600,
          color: '#191919',
          textAlign: 'left',
          lineHeight: '1.4',
        }}
      >
        {q}
        <span
          style={{
            flexShrink: 0,
            marginLeft: 12,
            fontSize: 18,
            color: '#666666',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          +
        </span>
      </button>
      {open && (
        <p
          style={{
            margin: '10px 0 0',
            fontSize: 14,
            color: '#666666',
            lineHeight: '1.5',
          }}
        >
          {a}
        </p>
      )}
    </div>
  );
}

// ─── Main Page ───
export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('roast');

  const plans = activeTab === 'roast' ? roastPlans : buildPlans;

  return (
    <div style={{ minHeight: '100vh', background: '#F3F2EF' }}>
      {/* Top bar */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E0E0E0',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 14,
            color: '#0B69C7',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          &larr; Home
        </Link>
        <Link
          href="/dashboard"
          style={{
            fontSize: 14,
            color: '#0B69C7',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Dashboard
        </Link>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '48px 20px 64px',
        }}
      >
        {/* Header */}
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: '#191919',
            textAlign: 'center',
            margin: '0 0 8px',
          }}
        >
          Simple, transparent pricing
        </h1>
        <p
          style={{
            fontSize: 16,
            color: '#666666',
            textAlign: 'center',
            margin: '0 0 32px',
          }}
        >
          Choose the plan that fits your career stage
        </p>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 40,
          }}
        >
          <button
            onClick={() => setActiveTab('roast')}
            style={{
              padding: '10px 24px',
              borderRadius: 24,
              border: activeTab === 'roast' ? 'none' : '1px solid #E0E0E0',
              background: activeTab === 'roast' ? '#0B69C7' : '#FFFFFF',
              color: activeTab === 'roast' ? '#FFFFFF' : '#191919',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Roast &amp; Rewrite
          </button>
          <button
            onClick={() => setActiveTab('build')}
            style={{
              padding: '10px 24px',
              borderRadius: 24,
              border: activeTab === 'build' ? 'none' : '1px solid #E0E0E0',
              background: activeTab === 'build' ? '#0B69C7' : '#FFFFFF',
              color: activeTab === 'build' ? '#FFFFFF' : '#191919',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Build from Scratch
          </button>
        </div>

        {/* Plan Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            marginBottom: 48,
          }}
        >
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>

        {/* Comparison line */}
        <p
          style={{
            textAlign: 'center',
            fontSize: 15,
            color: '#666666',
            margin: '0 0 16px',
            fontStyle: 'italic',
          }}
        >
          Resume writers charge &#8377;3,000&ndash;15,000 and take days. We do it in 90 seconds.
        </p>

        {/* Trust strip */}
        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#666666',
            margin: '0 0 56px',
            lineHeight: '1.6',
          }}
        >
          &#128274; Secure UPI/Card via Razorpay &bull;{' '}
          <Link href="/refund" style={{ color: '#0B69C7', textDecoration: 'none' }}>
            Refund policy
          </Link>{' '}
          &bull; 100% private &bull; Data deleted in 30 days
        </p>

        {/* FAQ */}
        <div
          style={{
            maxWidth: 680,
            margin: '0 auto',
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#191919',
              textAlign: 'center',
              margin: '0 0 24px',
            }}
          >
            Frequently Asked Questions
          </h2>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #E0E0E0',
              padding: '4px 24px',
            }}
          >
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid #E0E0E0',
          background: '#FFFFFF',
          padding: '24px 16px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <Link href="/terms" style={{ fontSize: 13, color: '#666666', textDecoration: 'none' }}>
            Terms &amp; Conditions
          </Link>
          <Link href="/privacy" style={{ fontSize: 13, color: '#666666', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
          <Link href="/refund" style={{ fontSize: 13, color: '#666666', textDecoration: 'none' }}>
            Refund Policy
          </Link>
        </div>
        <p style={{ fontSize: 12, color: '#666666', margin: 0 }}>
          &copy; 2026 Profile Roaster. Not affiliated with LinkedIn Corporation.
        </p>
      </div>
    </div>
  );
}
