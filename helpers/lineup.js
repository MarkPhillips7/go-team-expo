
export const getLineupFromGameTeamSeason = (gameTeamSeason) => {
  const lineupName = `${gameTeamSeason && gameTeamSeason.name} starting lineup`;
  const gameTeamSeasonId = gameTeamSeason && gameTeamSeason.id;
  const formation = gameTeamSeason &&
    gameTeamSeason.formationSubstitutions &&
    gameTeamSeason.formationSubstitutions[0] &&
    gameTeamSeason.formationSubstitutions[0].formation;
  const playerPositions = gameTeamSeason &&
    gameTeamSeason.substitutions &&
    gameTeamSeason.substitutions[0] &&
    gameTeamSeason.substitutions[0].playerPositionAssignments &&
    gameTeamSeason.substitutions[0].playerPositionAssignments.map((playerPositionAssignment) =>
      playerPositionAssignment && playerPositionAssignment.playerPosition);
  return {
    id: `starting${gameTeamSeasonId}`,
    name: lineupName,
    formation,
    playerPositions,
  };
}

export const getBlankLineupFromFormation = (formation) => {
  const lineupName = `Blank ${formation && formation.name} lineup`;
  const formationId = formation && formation.id;
  const playerPositions = [];
  return {
    id: `blank${formationId}`,
    name: lineupName,
    formation,
    playerPositions,
  };
}
