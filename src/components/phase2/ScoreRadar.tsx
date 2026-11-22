import { CRITERIA, MAX_PER_CRITERION, type Scores } from './mock';

/** The judge's scores as a 5-point shape — it grows as each criterion is tapped. */
export function ScoreRadar({ scores, size = 200 }: { scores: Scores; size?: number }) {
  const n = CRITERIA.length;
  const pt = (i: number, k: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [50 + Math.cos(a) * 38 * k, 50 + Math.sin(a) * 38 * k] as const;
  };
  const poly = (k: (i: number) => number) =>
    CRITERIA.map((_, i) => pt(i, k(i)).map((v) => v.toFixed(2)).join(',')).join(' ');
  const filled = CRITERIA.some((c) => scores[c.id] > 0);

  return (
    <svg className="p2-radar" viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="Score shape">
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon key={r} points={poly(() => r)} className="grid" />
      ))}
      {CRITERIA.map((c, i) => {
        const [x, y] = pt(i, 1);
        const [lx, ly] = pt(i, 1.24);
        return (
          <g key={c.id}>
            <line x1="50" y1="50" x2={x} y2={y} className="axis" />
            <text x={lx} y={ly} className={scores[c.id] ? 'lbl is-on' : 'lbl'} textAnchor="middle" dominantBaseline="middle">
              {c.label.split(' ')[0]}
            </text>
          </g>
        );
      })}
      {filled && (
        <>
          <polygon points={poly((i) => scores[CRITERIA[i].id] / MAX_PER_CRITERION)} className="shape" />
          {CRITERIA.map((c, i) => {
            if (!scores[c.id]) return null;
            const [x, y] = pt(i, scores[c.id] / MAX_PER_CRITERION);
            return <rect key={c.id} x={x - 1.6} y={y - 1.6} width="3.2" height="3.2" transform={`rotate(45 ${x} ${y})`} className="node" />;
          })}
        </>
      )}
    </svg>
  );
}
