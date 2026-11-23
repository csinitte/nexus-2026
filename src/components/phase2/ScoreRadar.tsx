import { CRITERIA, MAX_PER_CRITERION, type Scores } from './jury-types';

/** The judge's scores as a 7-point radar polygon (heptagon) */
export function ScoreRadar({ scores, size = 200 }: { scores: Scores; size?: number }) {
  const n = CRITERIA.length;
  const radius = 32;
  const pt = (i: number, k: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [50 + Math.cos(a) * radius * k, 50 + Math.sin(a) * radius * k] as const;
  };

  const poly = (k: (i: number) => number) =>
    CRITERIA.map((_, i) => pt(i, k(i)).map((v) => v.toFixed(2)).join(',')).join(' ');

  const filled = CRITERIA.some((c) => scores[c.id] > 0);

  // Short labels for clean radar layout
  const shortLabels: Record<string, string> = {
    problem_relevance: 'Problem',
    innovation: 'Innovation',
    technical_depth: 'Tech Depth',
    functionality: 'Function',
    feasibility: 'Feasibility',
    presentation: 'Presentation',
    scalability_impact: 'Impact',
  };

  return (
    <svg
      className="p2-radar"
      viewBox="-16 -16 132 132"
      width={size}
      height={size}
      role="img"
      aria-label="7-Criteria Score radar chart"
    >
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon key={r} points={poly(() => r)} className="grid" />
      ))}
      {CRITERIA.map((c, i) => {
        const [x, y] = pt(i, 1);
        const [lx, ly] = pt(i, 1.28);
        const val = scores[c.id] || 0;
        return (
          <g key={c.id}>
            <line x1="50" y1="50" x2={x} y2={y} className="axis" />
            <text
              x={lx}
              y={ly}
              className={val > 0 ? 'lbl is-on' : 'lbl'}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="4.8"
            >
              {shortLabels[c.id] || c.shortLabel}
            </text>
          </g>
        );
      })}
      {filled && (
        <>
          <polygon
            points={poly((i) => Math.max(0, Math.min(10, scores[CRITERIA[i].id] || 0)) / MAX_PER_CRITERION)}
            className="shape"
          />
          {CRITERIA.map((c, i) => {
            const val = scores[c.id] || 0;
            if (!val) return null;
            const [x, y] = pt(i, Math.max(0, Math.min(10, val)) / MAX_PER_CRITERION);
            return (
              <rect
                key={c.id}
                x={x - 1.8}
                y={y - 1.8}
                width="3.6"
                height="3.6"
                transform={`rotate(45 ${x} ${y})`}
                className="node"
              />
            );
          })}
        </>
      )}
    </svg>
  );
}
