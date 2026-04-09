'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

export function SaasMarketingHeader({ trailing }: { trailing?: ReactNode }) {
  return (
    <header className="saas-marketing-header">
      <div className="saas-marketing-header-inner">
        <Link href="/" className="saas-marketing-logo">
          <span className="saas-marketing-logo-accent">Profile</span>
          <span className="saas-marketing-logo-text">Roaster</span>
        </Link>
        <nav className="saas-marketing-nav" aria-label="Site">
          <Link href="/pricing">Pricing</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/recover">Recover</Link>
        </nav>
        {trailing ? <div className="saas-marketing-trailing">{trailing}</div> : null}
      </div>
    </header>
  );
}
