
export const getLineupFromGameTeamSeason = (gameTeamSeason) => {
  const lineupName = `${gameTeamSeason && gameTeamSeason.name} starting lineup`;
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
    name: lineupName,
    formation,
    playerPositions,
  };
}
