import { MAX_TOTAL, PANEL_NAMES } from './jury-types';
import type { PanelStandings } from './panel-standings';
const pad = (value: number) => String(value).padStart(2, '0');

export function PanelLeaderboards({
  panels,
  finalsLocked = true,
  onToggleFinalist,
}: {
  panels: PanelStandings[];
  finalsLocked?: boolean;
  onToggleFinalist?: (id: string) => void;
}) {
  return (
    <div className="p2-panels">
      {panels.map(({ panel: p, judgeCount, ranked }) => {
        const complete = ranked.filter((row) => row.average !== null);
        return (
          <section key={p} className="p2-panelcol">
            <header>
              <span className="p2-panel-no">0{p}</span>
              <div>
                <h3>{PANEL_NAMES[p]}</h3>
                <p className="p2-meta">
                  {complete.length} of {ranked.length} teams fully scored · average out of {MAX_TOTAL}
                </p>
              </div>
            </header>

            {ranked.length === 0 ? (
              <div className="p2-empty-col">
                <p>No teams assigned yet</p>
              </div>
            ) : (
              <ol className="p2-lb">
                {ranked.map((r, i) => {
                  const picked = r.finalist;
                  const complete = r.average !== null;
                  const teamId = r.id;
                  return (
                    <li key={r.teamNumber} className={`${complete ? '' : 'is-pending'}${picked ? ' is-picked' : ''}`}>
                      <span className="p2-lb-rank">{complete ? pad(i + 1) : '—'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>
                          {r.name || r.title}
                          {i === 0 && complete && <em className="p2-leading">Leading</em>}
                        </strong>
                        <p className="p2-meta" style={{ margin: '2px 0 4px', fontSize: '11px' }}>
                          Team {pad(r.teamNumber)} · {r.name && <>{r.title} · </>}{r.code && <>{r.code} · </>}{r.college} · {r.submittedCount}/{judgeCount} judges
                        </p>
                        <span className="p2-lb-bar" aria-hidden="true">
                          <span style={{ width: `${((r.average ?? 0) / MAX_TOTAL) * 100}%` }} />
                        </span>
                      </div>
                      <span className="p2-lb-score">{r.average?.toFixed(2) ?? '—'}</span>
                      {onToggleFinalist && teamId && <label className="p2-pick" title={picked ? 'Remove from final' : 'Send to final'}>
                        <input
                          type="checkbox"
                          checked={picked}
                          disabled={finalsLocked || !complete}
                          onChange={() => onToggleFinalist(teamId)}
                        />
                        <span>{picked ? '✓ Final' : 'Final'}</span>
                      </label>}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}
