'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Wordmark } from '@/components/site/Wordmark';
import { PanelLeaderboards } from './PanelLeaderboards';
import type { PanelStandings } from './panel-standings';

export function LeaderboardView() {
  const [panels, setPanels] = useState<PanelStandings[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let nextRefresh: ReturnType<typeof setTimeout>;

    async function refresh() {
      try {
        const response = await fetch('/api/jury/leaderboard', { signal: controller.signal });
        if (!response.ok) throw new Error();
        const standings: PanelStandings[] = await response.json();
        if (!controller.signal.aborted) {
          setPanels(standings);
          setError('');
        }
      } catch {
        if (!controller.signal.aborted) setError('Could not refresh the leaderboards. Retrying shortly.');
      } finally {
        if (!controller.signal.aborted) nextRefresh = setTimeout(refresh, 5000);
      }
    }

    void refresh();
    return () => {
      controller.abort();
      clearTimeout(nextRefresh);
    };
  }, []);

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
        {error && <p className="form-alert" role="alert">{error}</p>}
        {panels ? <PanelLeaderboards panels={panels} /> : !error && <p role="status">Loading leaderboards…</p>}
      </main>
    </div>
  );
}
