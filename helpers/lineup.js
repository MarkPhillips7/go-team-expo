import _ from 'lodash';

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

export const addToSelectedLineup = ({
  gamePlayers,
  selectedLineup,
  positionSnapshotFrom,
  positionSnapshotTo,
}) => {
  const id =  selectedLineup.isCustom ? selectedLineup.id : `CustomFrom${selectedLineup.id}`;
  const name =  selectedLineup.isCustom ? selectedLineup.name : `Custom from ${selectedLineup.name}`;
  const {player} = _.find(gamePlayers, (gamePlayer) => gamePlayer.player.id === positionSnapshotFrom.playerId);
  const position = positionSnapshotTo.event.position;
  const playerPositionToRemoveIndex = _.findIndex(selectedLineup.playerPositions,
    (playerPosition) => playerPosition.position.id === positionSnapshotTo.event.position.id);
  const newPlayerPosition = {
    player,
    position,
  };
  const playerPositions = playerPositionToRemoveIndex === -1
  ? [
    ...selectedLineup.playerPositions,
    newPlayerPosition,
  ]
  : [
    ..._.slice(selectedLineup.playerPositions, 0, playerPositionToRemoveIndex),
    newPlayerPosition,
    ..._.slice(selectedLineup.playerPositions, playerPositionToRemoveIndex + 1),
  ]
  console.log(`playerPositionToRemoveIndex`, playerPositionToRemoveIndex, playerPositions);//positionSnapshotTo, selectedLineup);
  return {
    ...selectedLineup,
    id,
    name,
    playerPositions,
    isCustom: true,
  };
}

export const isFullLineup = (lineup) => {
  const isLineupFull = lineup &&
  lineup.formation &&
  lineup.formation.positions &&
  lineup.playerPositions &&
  lineup.formation.positions.length === lineup.playerPositions.length;
  console.log(isLineupFull,
    lineup &&
    lineup.formation &&
    lineup.formation.positions && lineup.formation.positions.length,
    lineup &&
    lineup.playerPositions &&
    lineup.playerPositions.length
  );
  return isLineupFull;
}
