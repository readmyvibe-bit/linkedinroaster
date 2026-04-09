'use client';

import type { ReactNode } from 'react';
import { SaasMarketingHeader } from './SaasMarketingHeader';

export function LegalPageShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="saas-app-canvas">
      <SaasMarketingHeader />
      <main className="saas-legal-main">
        <article className="saas-legal-card">
          <h1 className="saas-legal-title">{title}</h1>
          <p className="saas-legal-updated">Last updated: {updated}</p>
          <div className="saas-legal-prose">{children}</div>
        </article>
      </main>
    </div>
  );
}
