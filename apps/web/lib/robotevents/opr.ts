export type OprMatch = {
  scored: boolean;
  round: number;
  alliances: {
    score: number;
    teams: {
      sitting?: boolean;
      team?: { name: string };
    }[];
  }[];
};

export type OprStats = {
  opr: number;
  dpr: number;
  ccwm: number;
};

function solve(matrix: number[][], values: number[]): number[] {
  const size = values.length;
  const augmented = matrix.map((row, index) => [...row, values[index]]);

  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) {
        pivot = row;
      }
    }

    [augmented[column], augmented[pivot]] = [
      augmented[pivot],
      augmented[column],
    ];

    const divisor = augmented[column][column];
    if (Math.abs(divisor) < 1e-10) continue;

    for (let row = column + 1; row < size; row += 1) {
      const factor = augmented[row][column] / divisor;
      for (let index = column; index <= size; index += 1) {
        augmented[row][index] -= factor * augmented[column][index];
      }
    }
  }

  const result = Array<number>(size).fill(0);
  for (let row = size - 1; row >= 0; row -= 1) {
    const divisor = augmented[row][row];
    if (Math.abs(divisor) < 1e-10) continue;

    let value = augmented[row][size];
    for (let column = row + 1; column < size; column += 1) {
      value -= augmented[row][column] * result[column];
    }
    result[row] = value / divisor;
  }

  return result;
}

export function calculateOpr(matches: OprMatch[]): Map<string, OprStats> {
  const equations = matches
    .filter(
      (match) =>
        match.scored &&
        match.round === 2 &&
        match.alliances.length === 2,
    )
    .flatMap((match) =>
      match.alliances.map((alliance, index) => ({
        teams: alliance.teams
          .filter(({ sitting }) => !sitting)
          .map(({ team }) => team?.name.trim().toUpperCase())
          .filter((team): team is string => Boolean(team)),
        score: alliance.score,
        opponentScore: match.alliances[1 - index].score,
      })),
    )
    .filter(({ teams }) => teams.length > 0);

  const teamNumbers = [...new Set(equations.flatMap(({ teams }) => teams))];
  const teamIndex = new Map(teamNumbers.map((team, index) => [team, index]));
  const size = teamNumbers.length;
  const ata = Array.from({ length: size }, () => Array<number>(size).fill(0));
  const offense = Array<number>(size).fill(0);
  const defense = Array<number>(size).fill(0);

  for (const equation of equations) {
    const indices = equation.teams.flatMap((team) => {
      const index = teamIndex.get(team);
      return index === undefined ? [] : [index];
    });

    for (const row of indices) {
      offense[row] += equation.score;
      defense[row] += equation.opponentScore;
      for (const column of indices) ata[row][column] += 1;
    }
  }

  // ponytail: tiny ridge keeps early-event singular systems solvable.
  for (let index = 0; index < size; index += 1) ata[index][index] += 1e-8;

  const opr = solve(ata, offense);
  const dpr = solve(ata, defense);

  return new Map(
    teamNumbers.map((team, index) => [
      team,
      {
        opr: opr[index],
        dpr: dpr[index],
        ccwm: opr[index] - dpr[index],
      },
    ]),
  );
}
