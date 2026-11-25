import { MAX_TOTAL, PANEL_NAMES, totalWeightedScore, type JuryState } from './jury-types';

const PANELS = [1, 2] as const;
const pad = (value: number) => String(value).padStart(2, '0');

export function PanelLeaderboards({
  st,
  onToggleFinalist,
}: {
  st: JuryState;
  onToggleFinalist?: (id: string) => void;
}) {
  return (
    <div className="p2-panels">
      {PANELS.map((p) => {
        const judges = st.jurors.filter((judge) => judge.panel === p);
        const ranked = st.order[p]
          .map((id, index) => {
            const evals = st.evals[id] ?? {};
            const submitted = Object.entries(evals).filter(([judgeId]) => judges.some((judge) => judge.id === judgeId));
            const complete = judges.length > 0 && submitted.length === judges.length;
            const totalCents = submitted.reduce((sum, [, evaluation]) => sum + Math.round(totalWeightedScore(evaluation.scores) * 100), 0);
            return {
              id,
              teamNumber: index + 1,
              average: complete ? totalCents / (100 * judges.length) : null,
              submittedCount: submitted.length,
              complete,
            };
          })
          .sort((a, b) => (b.average ?? -1) - (a.average ?? -1));

        const complete = ranked.filter((row) => row.complete);

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
                  const t = st.teams.find((team) => team.id === r.id)!;
                  const picked = st.finalists.includes(r.id);
                  return (
                    <li key={r.id} className={`${r.complete ? '' : 'is-pending'}${picked ? ' is-picked' : ''}`}>
                      <span className="p2-lb-rank">{r.complete ? pad(i + 1) : '—'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>
                          {t.name || t.title}
                          {i === 0 && r.complete && <em className="p2-leading">Leading</em>}
                        </strong>
                        <p className="p2-meta" style={{ margin: '2px 0 4px', fontSize: '11px' }}>
                          Team {pad(r.teamNumber)} · {t.name && <>{t.title} · </>}{t.code} · {t.college} · {r.submittedCount}/{judges.length} judges
                        </p>
                        <span className="p2-lb-bar" aria-hidden="true">
                          <span style={{ width: `${((r.average ?? 0) / MAX_TOTAL) * 100}%` }} />
                        </span>
                      </div>
                      <span className="p2-lb-score">{r.average?.toFixed(2) ?? '—'}</span>
                      {onToggleFinalist && <label className="p2-pick" title={picked ? 'Remove from final' : 'Send to final'}>
                        <input
                          type="checkbox"
                          checked={picked}
                          disabled={st.finalsLocked || !r.complete}
                          onChange={() => onToggleFinalist(r.id)}
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
