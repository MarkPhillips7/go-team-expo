import _ from 'lodash';

const initializeGameStats = () => {
  return {
    players: {}
  };
};

const initializePlayerStats = (gameStats, playerPositionAssignment) => {
  const playerStats = gameStats.players[playerPositionAssignment.playerPosition.player.id] || {
    name: playerPositionAssignment.playerPosition.player.name,
    currentPositionId: undefined,
    positions: {},
    positionCategories: {},
  };
  gameStats.players[playerPositionAssignment.playerPosition.player.id] = playerStats;
  return playerStats;
};

const initializePositionStats = (gameStats, playerPositionAssignment, playerStats) => {
  const positionStats = playerStats.positions[playerPositionAssignment.playerPosition.position.id] || {
    lastEventType: undefined,
    lastEventTimestamp: undefined,
    lastEventGameSeconds: 0,
    lastEventTotalSeconds: 0,
    cumulativeInGameSeconds: 0,
    cumulativeOutGameSeconds: 0,
    cumulativeInTotalSeconds: 0,
    cumulativeOutTotalSeconds: 0,
  };
  playerStats.positions[playerPositionAssignment.playerPosition.position.id] = positionStats;
  return positionStats;
};

// Get game statistics at a certain point in time
export const getGameStats = ({
  gameTeamSeason,
  gameActivityType,
  gameActivityStatus,
  totalSeconds,
  gameSeconds,
  timestamp,
}) => {
  const gameStats = initializeGameStats();
  _.forEach(gameTeamSeason.substitutions, (substitution) => {
    _.forEach(substitution.playerPositionAssignments, (playerPositionAssignment) => {
      const wentTooFar =
      ((playerPositionAssignment.timestamp && timestamp && playerPositionAssignment.timestamp > timestamp) ||
      (playerPositionAssignment.totalSeconds && totalSeconds && playerPositionAssignment.totalSeconds > totalSeconds) ||
      (playerPositionAssignment.gameSeconds && gameSeconds && playerPositionAssignment.gameSeconds > gameSeconds));
      const assignmentTotalSeconds = wentTooFar ? totalSeconds : playerPositionAssignment.totalSeconds || 0;
      const assignmentGameSeconds = wentTooFar ? gameSeconds : playerPositionAssignment.gameSeconds || 0;
      const assignmentTimestamp = wentTooFar ? timestamp : playerPositionAssignment.timestamp || null;
      const playerStats = initializePlayerStats(gameStats, playerPositionAssignment);
      const positionStats = initializePositionStats(gameStats, playerPositionAssignment, playerStats);

      switch (positionStats.lastEventType) {
        case "IN":
          positionStats.cumulativeInGameSeconds += assignmentGameSeconds - positionStats.lastEventGameSeconds;
          positionStats.cumulativeInTotalSeconds += assignmentTotalSeconds - positionStats.lastEventTotalSeconds;
          break;
        case "OUT":
          positionStats.cumulativeOutGameSeconds += assignmentGameSeconds - positionStats.lastEventGameSeconds;
          positionStats.cumulativeOutTotalSeconds += assignmentTotalSeconds - positionStats.lastEventTotalSeconds;
          break;
      }

      positionStats.lastEventGameSeconds = assignmentGameSeconds;
      positionStats.lastEventTotalSeconds = assignmentTotalSeconds;
      positionStats.lastEventTimestamp = assignmentTimestamp;

      switch (playerPositionAssignment.playerPositionAssignmentType) {
        case "INITIAL":
        case "IN":
          playerStats.currentPositionId = playerPositionAssignment.playerPosition.position.id;
          positionStats.lastEventType = "IN";
          break;
        case "OUT":
          playerStats.currentPositionId = null;
          positionStats.lastEventType = "OUT";
          break;
      }
    });
  });
  return gameStats;
}
