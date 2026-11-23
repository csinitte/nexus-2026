'use client';

import { useState, type FormEvent } from 'react';
import { Wordmark } from '@/components/site/Wordmark';
import { WaveField } from './WaveField';
import { Icon } from './Icons';
import {
  PANEL_NAMES,
  SLOT,
  SLOT_TOTAL,
  type PanelId,
  type Team,
} from './jury-types';
import {
  signInVolunteer,
  signOutVolunteer,
  useVolunteer,
  useVolunteerConnection,
  volunteerTimer,
} from './juryStore';
import {
  PHASE_LABEL,
  beep,
  clock,
  remainingOf,
  unlockAudio,
  usePhaseAlerts,
  type Phase,
} from './juryTimer';

const pad = (n: number) => String(n).padStart(2, '0');

export function VolunteerPortal() {
  const { state, status, error } = useVolunteerConnection();
  const [signOutError, setSignOutError] = useState('');
  const volunteer = state.volunteerMe;

  async function signOut() {
    try {
      await signOutVolunteer();
      setSignOutError('');
    } catch {
      setSignOutError('Could not sign out. Please try again.');
    }
  }

  return (
    <div className="admin-shell p2-app">
      <header className="admin-header">
        <Wordmark />
        <span className="admin-role">
          Volunteer Timer {volunteer ? ` · ${volunteer.name}` : ''}{' '}
          {volunteer && <em>{PANEL_NAMES[volunteer.panel]}</em>}
        </span>
        {volunteer && (
          <button type="button" className="button outline small" onClick={signOut}>
            Sign out
          </button>
        )}
      </header>
      <main id="main" className="section page p2-app-main" tabIndex={-1}>
        {(error || signOutError) && (
          <p className="form-alert" role="alert">
            {signOutError || error}
          </p>
        )}
        {status === 'loading' ? (
          <p role="status">Checking volunteer session…</p>
        ) : volunteer ? (
          <VolunteerDashboard panel={volunteer.panel} volunteerName={volunteer.name} />
        ) : (
          <VolunteerSignIn />
        )}
      </main>
    </div>
  );
}

/* ---------- Volunteer Sign In ---------- */

function VolunteerSignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    unlockAudio();
    setBusy(true);
    setError('');
    try {
      await signInVolunteer(username, password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed. Check credentials with the admin.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="p2-art-hero p2-login-hero">
        <div className="p2-art-hero-copy">
          <p className="p2-art-kicker">Stage Management · Volunteer Portal</p>
          <h1>
            Volunteer <em>timer.</em>
          </h1>
          <p>
            Official venue stage timer controller. Assigned volunteers manage the 10-minute presentation &amp;
            Q&amp;A slots for their panel. All actions synchronize in real-time with judges.
          </p>
        </div>
        <WaveField />
      </section>

      <div className="p2-access">
        <form className="p2-access-fields" onSubmit={submit}>
          <div className="field wide">
            <label htmlFor="volunteer-user">
              <Icon name="user" size={15} /> Volunteer Username
            </label>
            <input
              id="volunteer-user"
              autoComplete="username"
              autoCapitalize="none"
              placeholder="e.g. rahul"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="field wide">
            <label htmlFor="volunteer-password">
              <Icon name="lock" size={15} /> Password
            </label>
            <input
              id="volunteer-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in to Volunteer Timer'} <span aria-hidden="true">↗</span>
          </button>
        </form>

        <ol className="p2-how" aria-label="Volunteer Guidelines">
          <li>
            <span className="p2-how-icon">
              <Icon name="timer" size={26} />
            </span>
            <div>
              <h3>10-Minute Total Slot</h3>
              <p>5 minutes Presentation + 5 minutes Q&amp;A. Alerts fire automatically at 5:00 and 10:00.</p>
            </div>
          </li>
          <li>
            <span className="p2-how-icon">
              <Icon name="bell" size={26} />
            </span>
            <div>
              <h3>Acoustic &amp; Visual Alerts</h3>
              <p>Turn phone/tablet volume up. The app plays chime tones to signal speakers and judges.</p>
            </div>
          </li>
          <li>
            <span className="p2-how-icon">
              <Icon name="user" size={26} />
            </span>
            <div>
              <h3>Panel Isolation</h3>
              <p>You can only control your assigned panel. Panel 1 and Panel 2 operate completely independently.</p>
            </div>
          </li>
        </ol>
      </div>
    </>
  );
}

/* ---------- Volunteer Dashboard ---------- */

function VolunteerDashboard({ panel, volunteerName }: { panel: PanelId; volunteerName: string }) {
  const st = useVolunteer();
  const session = st.session[panel];
  const order = st.order[panel] ?? [];
  const teams = st.teams ?? [];

  const [alertMsg, setAlertMsg] = useState('');

  const { phase, elapsed } = usePhaseAlerts(session, (to) => {
    if (to === 'qa') {
      setAlertMsg('Presentation time ended (5:00). Switch to Q&A!');
    } else if (to === 'over') {
      setAlertMsg('TIME COMPLETED (10:00). Conclude presentation and Q&A!');
    }
  });

  const team = session.teamId ? teams.find((t) => t.id === session.teamId) ?? null : null;
  const currentIdx = team ? order.indexOf(team.id) : -1;
  const nextTeamId = currentIdx >= 0 && currentIdx + 1 < order.length ? order[currentIdx + 1] : null;
  const nextTeam = nextTeamId ? teams.find((t) => t.id === nextTeamId) ?? null : null;

  // Progress percentage of the 10 min slot
  const pct = Math.min(100, (elapsed / SLOT_TOTAL) * 100);

  function handleSelectTeam(id: string) {
    unlockAudio();
    setAlertMsg('');
    volunteerTimer.selectTeam(panel, id);
  }

  function handleStart() {
    unlockAudio();
    setAlertMsg('');
    volunteerTimer.start(panel);
  }

  function handlePause() {
    volunteerTimer.pause(panel);
  }

  function handleReset() {
    setAlertMsg('');
    volunteerTimer.resetTimer(panel);
  }

  function handleNext() {
    unlockAudio();
    setAlertMsg('');
    volunteerTimer.next(panel);
  }

  return (
    <div className="p2-volunteer-desk">
      {/* Top Banner */}
      <div className="p2-volunteer-head">
        <div>
          <p className="p2-art-kicker">
            Stage Volunteer: <strong>{volunteerName}</strong>
          </p>
          <h1>
            {PANEL_NAMES[panel]} <em>Timer Control.</em>
          </h1>
        </div>
        <div className="p2-volunteer-meta">
          <span className="p2-livechip is-running">
            <i aria-hidden="true" />
            Panel {panel} Active
          </span>
          <button
            type="button"
            className="text-link"
            onClick={() => {
              unlockAudio();
              beep(1);
            }}
          >
            🔔 Test Speaker Chime
          </button>
        </div>
      </div>

      {/* Prominent Stage Alert Notification */}
      {alertMsg && (
        <div className={`p2-toast-big ${phase === 'over' ? 'is-over' : 'is-qa'}`} role="alert">
          <span className="p2-bell" aria-hidden="true">
            <Icon name="bell" size={32} />
          </span>
          <div>
            <strong>{phase === 'over' ? 'TIME UP — 10 MINUTES' : 'PRESENTATION ENDED — 5 MINUTES'}</strong>
            <p>{alertMsg}</p>
          </div>
          <button type="button" className="p2-copy" onClick={() => setAlertMsg('')}>
            Dismiss
          </button>
        </div>
      )}

      {/* Main Large Stage Timer Card */}
      <section className={`p2-stage-hero is-${phase}`}>
        <div className="p2-stage-hero-head">
          <span className="p2-stage-badge">
            {session.running && <i className="p2-live-dot" aria-hidden="true" />}
            {PHASE_LABEL[phase]}
            {!session.running && elapsed > 0 && phase !== 'over' ? ' (PAUSED)' : ''}
          </span>
          <span className="p2-stage-order">
            {team ? `Team ${pad(currentIdx + 1)} of ${pad(order.length)}` : `${order.length} teams in panel`}
          </span>
        </div>

        {team ? (
          <div className="p2-stage-team-details">
            <p className="p2-label">
              {team.code} · {team.category}
            </p>
            <h2 className="p2-stage-title">{team.title}</h2>
            <p className="p2-stage-college">{team.college}</p>
            <p className="p2-stage-members muted">{team.members.join(', ')}</p>
          </div>
        ) : (
          <div className="p2-stage-empty">
            <h2>No Team Selected</h2>
            <p className="muted">Choose a team from the presentation queue below to begin the timer.</p>
          </div>
        )}

        {/* 10-Minute Clock Display */}
        <div className="p2-stage-clock-large">
          <div className="p2-clock-digits" role="timer">
            {clock(remainingOf(phase, elapsed))}
          </div>
          <p className="p2-clock-sub">
            {phase === 'present' || phase === 'ready'
              ? `Presentation Phase (${clock(Math.max(0, SLOT.presentSeconds - elapsed))} remaining)`
              : phase === 'qa'
              ? `Q&A Phase (${clock(Math.max(0, SLOT_TOTAL - elapsed))} remaining)`
              : 'Slot Duration Completed'}
          </p>

          {/* Dual Segment Progress Bar (5m + 5m) */}
          <div className="p2-split-bar large" aria-hidden="true">
            <span className="p2-split-fill" style={{ width: `${pct}%` }} />
            <i style={{ left: '50%' }} title="5:00 min Q&A transition mark" />
          </div>
          <div className="p2-bar-markers">
            <span>0:00 Start</span>
            <span style={{ color: 'var(--accent, #00ff88)' }}>5:00 Switch to Q&amp;A</span>
            <span style={{ color: '#ff4d4f' }}>10:00 End</span>
          </div>
        </div>

        {/* Big Touch-Friendly Action Controls */}
        <div className="p2-stage-action-buttons">
          {session.running ? (
            <button type="button" className="p2-btn-ctrl p2-btn-pause" onClick={handlePause}>
              <Icon name="pause" size={24} /> Pause
            </button>
          ) : (
            <button
              type="button"
              className="p2-btn-ctrl p2-btn-start"
              onClick={handleStart}
              disabled={!team || elapsed >= SLOT_TOTAL}
            >
              <Icon name="play" size={24} /> {elapsed > 0 ? 'Resume' : 'Start Timer'}
            </button>
          )}

          <button
            type="button"
            className="p2-btn-ctrl p2-btn-reset"
            onClick={handleReset}
            disabled={!team || elapsed === 0}
          >
            <Icon name="reset" size={22} /> Reset (10:00)
          </button>

          <button
            type="button"
            className="p2-btn-ctrl p2-btn-next"
            onClick={handleNext}
            disabled={currentIdx < 0 || currentIdx >= order.length - 1}
          >
            <Icon name="next" size={22} /> Next Team
          </button>
        </div>

        {nextTeam && (
          <div className="p2-upnext-banner">
            <span className="p2-upnext-tag">UP NEXT:</span>
            <strong>{nextTeam.title}</strong>
            <span>({nextTeam.college})</span>
          </div>
        )}
      </section>

      {/* Presentation Queue Section */}
      <section className="p2-volunteer-queue">
        <div className="p2-queue-head">
          <h3>Presentation Queue · {PANEL_NAMES[panel]}</h3>
          <p className="muted">Tap any team to load it onto the stage timer.</p>
        </div>

        {order.length === 0 ? (
          <p className="empty">No teams have been assigned to {PANEL_NAMES[panel]} yet.</p>
        ) : (
          <div className="p2-team-selector-grid">
            {order.map((id, i) => {
              const t = teams.find((item) => item.id === id);
              if (!t) return null;
              const isCurrent = session.teamId === id;
              const evals = st.evals[id] ?? {};
              const scoredCount = Object.keys(evals).length;

              return (
                <button
                  key={id}
                  type="button"
                  className={`p2-volunteer-team-btn ${isCurrent ? 'is-selected' : ''}`}
                  onClick={() => handleSelectTeam(id)}
                >
                  <span className="p2-team-btn-idx">{pad(i + 1)}</span>
                  <div className="p2-team-btn-body">
                    <strong>{t.title}</strong>
                    <small>
                      {t.code} · {t.college}
                    </small>
                  </div>
                  <div className="p2-team-btn-status">
                    {isCurrent ? (
                      <span className="p2-status-pill is-live">ON STAGE</span>
                    ) : scoredCount > 0 ? (
                      <span className="p2-status-pill is-scored">{scoredCount} judges scored</span>
                    ) : (
                      <span className="p2-status-pill">Pending</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
