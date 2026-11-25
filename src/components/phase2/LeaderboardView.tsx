'use client';

import Link from 'next/link';
import { Wordmark } from '@/components/site/Wordmark';
import { PanelLeaderboards } from './PanelLeaderboards';
import { useJuryConnection } from './juryStore';

export function LeaderboardView() {
  const { state, status, error } = useJuryConnection('admin');

  return (
    <div className="admin-shell p2-app">
      <header className="admin-header">
        <Wordmark />
        <Link href="/mimo" className="button outline small">All portals</Link>
      </header>
      <main id="main" className="section page p2-app-main" tabIndex={-1}>
        <header className="form-intro">
          <h1>Expo <em>leaderboards.</em></h1>
          <p className="muted">Teams are ranked within their panel by average weighted score out of 100.</p>
        </header>
        {status === 'ready' ? (
          <>
            {error && <p className="form-alert" role="alert">{error}</p>}
            <PanelLeaderboards st={state} />
          </>
        ) : (
          <div>
            <p role="status">{status === 'loading' ? 'Checking organiser access…' : error || 'Sign in as an organiser to view the leaderboards.'}</p>
            {status !== 'loading' && <Link href="/admin" className="button small">Open admin dashboard</Link>}
          </div>
        )}
      </main>
    </div>
  );
}
