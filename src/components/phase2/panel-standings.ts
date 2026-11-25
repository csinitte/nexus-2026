import { totalWeightedScore, type JuryState, type PanelId } from './jury-types';

type Standing = {
  id?: string;
  code?: string;
  teamNumber: number;
  name: string | null;
  title: string;
  college: string;
  average: number | null;
  submittedCount: number;
  finalist: boolean;
};

export type PanelStandings = {
  panel: PanelId;
  judgeCount: number;
  ranked: Standing[];
};

export function getPanelStandings(
  state: Pick<JuryState, 'teams' | 'jurors' | 'order' | 'evals' | 'finalists' | 'finalsLocked'>,
  publicView = false,
): PanelStandings[] {
  const teams = new Map(state.teams.map((team) => [team.id, team]));
  return ([1, 2] as const).map((panel) => {
    const judges = state.jurors.filter((judge) => judge.panel === panel);
    const ranked = state.order[panel].flatMap((id, index) => {
      const team = teams.get(id);
      if (!team) return [];
      const evaluations = state.evals[id] ?? {};
      const submitted = judges.flatMap((judge) => evaluations[judge.id] ? [evaluations[judge.id]] : []);
      const totalCents = submitted.reduce((sum, evaluation) => sum + Math.round(totalWeightedScore(evaluation.scores) * 100), 0);
      const complete = judges.length > 0 && submitted.length === judges.length;
      return [{
        ...(publicView ? {} : { id, code: team.code }),
        teamNumber: index + 1,
        name: team.name,
        title: team.title,
        college: team.college,
        average: complete ? totalCents / (100 * judges.length) : null,
        submittedCount: submitted.length,
        finalist: (!publicView || state.finalsLocked) && state.finalists.includes(id),
      }];
    }).sort((a, b) => (b.average ?? -1) - (a.average ?? -1));

    return { panel, judgeCount: judges.length, ranked };
  });
}
