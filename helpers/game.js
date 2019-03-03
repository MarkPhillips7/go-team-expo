import _ from 'lodash';

const initializeGameTimeline = ({
  totalSeconds,
  gameSeconds,
  timestamp,
}) => {
  return {
    timeInfo: {
      totalSeconds,
      gameSeconds,
      timestamp,
    },
    players: {},
  };
};

const initializePlayerTimeline = (gameTimeline, player) => {
  const playerTimeline = gameTimeline.players[player.id] || {
    name: player.name,
    events: [],
  };
  gameTimeline.players[player.id] = playerTimeline;
  return playerTimeline;
};

const initializeGameStats = ({
  totalSeconds,
  gameSeconds,
  timestamp,
}) => {
  return {
    timeInfo: {
      totalSeconds,
      gameSeconds,
      timestamp,
    },
    players: {},
  };
};

const initializePlayerStats = (gameStats, player) => {
  const playerStats = gameStats.players[player.id] || {
    name: player.name,
    currentPositionId: undefined,
    positions: {},
    positionCategories: {},
    lastEventType: undefined,
    lastEventTimestamp: undefined,
    lastEventGameSeconds: 0,
    lastEventTotalSeconds: 0,
    cumulativeInGameSeconds: 0,
    // cumulativeOutGameSeconds: 0,
    cumulativeInTotalSeconds: 0,
    // cumulativeOutTotalSeconds: 0,
  };
  gameStats.players[player.id] = playerStats;
  return playerStats;
};

const initializePositionStats = (gameStats, position, playerStats) => {
  if (!position) {
    return null;
  }
  const positionStats = playerStats.positions[position.id] || {
    lastEventType: undefined,
    lastEventTimestamp: undefined,
    lastEventGameSeconds: 0,
    lastEventTotalSeconds: 0,
    cumulativeInGameSeconds: 0,
    // cumulativeOutGameSeconds: 0,
    cumulativeInTotalSeconds: 0,
    // cumulativeOutTotalSeconds: 0,
  };
  playerStats.positions[position.id] = positionStats;
  return positionStats;
};

const getTimeInfo = (substitution, playerPositionAssignment, maxTimeInfo) => {
  if (!substitution) {
    return {};
  }
  const timeInfo = {
    gameSeconds: playerPositionAssignment && typeof playerPositionAssignment.gameSeconds === "number"
    ? playerPositionAssignment.gameSeconds
    : substitution.gameSeconds,
    totalSeconds: playerPositionAssignment && typeof playerPositionAssignment.totalSeconds === "number"
    ? playerPositionAssignment.totalSeconds
    : substitution.totalSeconds,
    timestamp: playerPositionAssignment && playerPositionAssignment.timestamp || substitution.timestamp,
    limitedByMax: false,
  };
  if (maxTimeInfo) {
    timeInfo.limitedByMax = timeInfo.gameSeconds > maxTimeInfo.gameSeconds
    || timeInfo.totalSeconds > maxTimeInfo.totalSeconds
    || timeInfo.timestamp > maxTimeInfo.timestamp;
    if (timeInfo.limitedByMax) {
      timeInfo.gameSeconds = Math.min(timeInfo.gameSeconds, maxTimeInfo.gameSeconds);
      timeInfo.totalSeconds = Math.min(timeInfo.totalSeconds, maxTimeInfo.totalSeconds);
      timeInfo.timestamp = Math.min(timeInfo.timestamp, maxTimeInfo.timestamp);
    }
  }
  return timeInfo;
};

const updateCumulativeTimeStatsSinceLastEvent = (playerStats, positionStats, timeInfo) => {
  switch (playerStats.lastEventType) {
    case "INITIAL":
    case "IN":
    case "CHANGE":
      if (positionStats) {
        positionStats.cumulativeInGameSeconds += timeInfo.gameSeconds - positionStats.lastEventGameSeconds;
        positionStats.cumulativeInTotalSeconds += timeInfo.totalSeconds - positionStats.lastEventTotalSeconds;
      }
      playerStats.cumulativeInGameSeconds += timeInfo.gameSeconds - playerStats.lastEventGameSeconds;
      playerStats.cumulativeInTotalSeconds += timeInfo.totalSeconds - playerStats.lastEventTotalSeconds;
      break;
    // case "OUT":
    // case "UNAVAILABLE":
    //   // positionStats.cumulativeOutGameSeconds += timeInfo.gameSeconds - positionStats.lastEventGameSeconds;
    //   // positionStats.cumulativeOutTotalSeconds += timeInfo.totalSeconds - positionStats.lastEventTotalSeconds;
    //   break;
  }
};

const updateStatsForPlayerAssignment = ({
  playerStats, positionStats, timeInfo, eventType, newPosition
}) => {
  if (positionStats) {
    positionStats.lastEventGameSeconds = timeInfo.gameSeconds;
    positionStats.lastEventTotalSeconds = timeInfo.totalSeconds;
    positionStats.lastEventTimestamp = timeInfo.timestamp;
    positionStats.lastEventType = eventType;
  }
  playerStats.lastEventGameSeconds = timeInfo.gameSeconds;
  playerStats.lastEventTotalSeconds = timeInfo.totalSeconds;
  playerStats.lastEventTimestamp = timeInfo.timestamp;
  playerStats.lastEventType = eventType;

  switch (eventType) {
    case "INITIAL":
    case "IN":
    case "CHANGE":
      playerStats.currentPositionId = newPosition.id;
      break;
    case "OUT":
    case "UNAVAILABLE":
      playerStats.currentPositionId = null;
      break;
  }
};

export const playerIsCurrentlyPlaying = (gameStats, gamePlayer) => {
  const playerStats = gameStats.players[gamePlayer.player.id];
  return playerStats &&
  (playerStats.lastEventType === "INITIAL" ||
  playerStats.lastEventType === "IN" ||
  playerStats.lastEventType === "CHANGE");
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
  const gameStats = initializeGameStats({
    totalSeconds,
    gameSeconds,
    timestamp,
  });

  _.chain(gameTeamSeason.gamePlayers)
  .filter((gamePlayer) => gamePlayer.availability === "UNAVAILABLE")
  .forEach((gamePlayer) => {
    const playerStats = initializePlayerStats(gameStats, gamePlayer.player);
    const timeInfo = getTimeInfo(gameTeamSeason.substitutions[0]);
    playerStats.lastEventGameSeconds = timeInfo.gameSeconds;
    playerStats.lastEventTotalSeconds = timeInfo.totalSeconds;
    playerStats.lastEventTimestamp = timeInfo.timestamp;
    playerStats.lastEventType = "UNAVAILABLE";
  });

  _.forEach(gameTeamSeason.substitutions, (substitution) => {
    _.forEach(substitution.playerPositionAssignments, (playerPositionAssignment) => {
      const timeInfo = getTimeInfo(substitution, playerPositionAssignment, {gameSeconds, totalSeconds, timestamp});
      const playerStats = initializePlayerStats(gameStats, playerPositionAssignment.playerPosition.player);
      const positionStats = initializePositionStats(gameStats, playerPositionAssignment.playerPosition.position, playerStats);

      updateCumulativeTimeStatsSinceLastEvent(playerStats, positionStats, timeInfo);
      updateStatsForPlayerAssignment({
        playerStats, positionStats, timeInfo,
        eventType: playerPositionAssignment.playerPositionAssignmentType,
        newPosition: playerPositionAssignment.playerPosition.position,
      });
    });
  });

  _.forEach(gameStats.players, (playerStats, playerId) => {
    const positionStats = playerStats.currentPositionId && playerStats.positions[playerStats.currentPositionId];
    updateCumulativeTimeStatsSinceLastEvent(playerStats, positionStats, {gameSeconds, totalSeconds, timestamp});
  });

  return gameStats;
};

export const getGameTimeline = ({
  gameTeamSeason,
  gameActivityType,
  gameActivityStatus,
  totalSeconds,
  gameSeconds,
  timestamp,
}) => {
  const gameTimeline = initializeGameTimeline({
    totalSeconds,
    gameSeconds,
    timestamp,
  });

  // Set initial events for players that are unavailable at the start of the game
  _.chain(gameTeamSeason.gamePlayers)
  .filter((gamePlayer) => gamePlayer.availability === "UNAVAILABLE")
  .forEach((gamePlayer) => {
    const playerTimeline = initializePlayerTimeline(gameTimeline, gamePlayer.player);
    // const playerStats = initializePlayerStats(gameStats, gamePlayer.player);
    const timeInfo = getTimeInfo(gameTeamSeason.substitutions[0]);
    // playerStats.lastEventGameSeconds = timeInfo.gameSeconds;
    // playerStats.lastEventTotalSeconds = timeInfo.totalSeconds;
    // playerStats.lastEventTimestamp = timeInfo.timestamp;
    // playerStats.lastEventType = "UNAVAILABLE";
    playerTimeline.events.push({
      eventType: "UNAVAILABLE",
      position: null,
      timeInfo,
    });
  });

  _.forEach(gameTeamSeason.substitutions, (substitution) => {
    _.forEach(substitution.playerPositionAssignments, (playerPositionAssignment) => {
      const timeInfo = getTimeInfo(substitution, playerPositionAssignment, {gameSeconds, totalSeconds, timestamp});
      const playerTimeline = initializePlayerTimeline(gameTimeline, playerPositionAssignment.playerPosition.player);
      // const playerStats = initializePlayerStats(gameStats, playerPositionAssignment.playerPosition.player);
      // const positionStats = initializePositionStats(gameStats, playerPositionAssignment.playerPosition.position, playerStats);

      // updateCumulativeTimeStatsSinceLastEvent(playerStats, positionStats, timeInfo);
      playerTimeline.events.push({
        eventType: playerPositionAssignment.playerPositionAssignmentType,
        position: playerPositionAssignment.playerPosition.position,
        timeInfo,
      });
      // updateStatsForPlayerAssignment({
      //   playerStats, positionStats, timeInfo,
      //   eventType: playerPositionAssignment.playerPositionAssignmentType,
      //   newPosition: playerPositionAssignment.playerPosition.position,
      // });
    });
  });
  //
  // _.forEach(gameStats.players, (playerStats, playerId) => {
  //   const positionStats = playerStats.currentPositionId && playerStats.positions[playerStats.currentPositionId];
  //   updateCumulativeTimeStatsSinceLastEvent(playerStats, positionStats, {gameSeconds, totalSeconds, timestamp});
  // });

  console.log(gameTimeline);
  return gameTimeline;
};

const getPositionCategory = (position, positionCategories) => {
  if (!position || !position.positionCategory) {
    return null;
  }
  return position.positionCategory;//positionCategories[position.positionCategory.id];
};

const getColor = ({
  event,
  positionCategories,
}) => {
  if (!event) {
    // no event means started as a substitute
    return "gray";
  }

  switch (event.eventType) {
    case "OUT":
      return "gray";
    case "UNAVAILABLE":
      return "black";
    // case "INITIAL":
    // case "IN":
    // case "CHANGE":
    default:
      const positionCategory = getPositionCategory(event.position, positionCategories);
      return positionCategory && positionCategory.color || "white";
  }
};

export const getPiePieces = ({
  gameTimeline,
  positionCategories,
  gameTeamSeason,
  gameActivityType,
  gameActivityStatus,
  totalSeconds,
  gameSeconds,
  timestamp,
}) => {
  const maxSeconds = gameSeconds;
  const minSeconds = 0.0;
  const allPiePieces = _.mapValues(gameTimeline.players, (playerTimeline) => {
    let secondsCounter = minSeconds;
    let previousEvent = undefined;
    const piePieces = [];
    _.forEach(playerTimeline.events, (event, index) => {
      const startSecondsSinceGameStart = secondsCounter;
        // moment(assignments.startTime).diff(this.props.gameStartTime) / 1000.0;
      const endSecondsSinceGameStart = Math.min(event.timeInfo.gameSeconds, gameSeconds);
      // const endSecondsSinceGameStart = moment(endTime).diff(this.props.gameStartTime) / 1000.0;
      // const totalSeconds = Math.max(this.props.gameDurationSeconds, endSecondsSinceGameStart);
      const startValue = startSecondsSinceGameStart / maxSeconds;
      const endValue = endSecondsSinceGameStart / maxSeconds;
      const color = getColor({
        event: previousEvent,
        positionCategories,
      });
      const piePiece =  {
        color,
        startValue,
        endValue,
      };
      secondsCounter += (endSecondsSinceGameStart - startSecondsSinceGameStart);
      previousEvent = event;

      if (startValue !== endValue) {
        piePieces.push(piePiece);
      }

      if (index === playerTimeline.events.length - 1 &&
        endSecondsSinceGameStart < gameSeconds
      ) {
        piePieces.push({
          color: getColor({
            event: previousEvent,
            positionCategories,
          }),
          startValue: endValue,
          endValue: gameSeconds / maxSeconds,
        });
      }
    });
    return piePieces;
  });
  console.log(allPiePieces);
  return allPiePieces;
};

// Return a numerical score (highest score most likely to get subbed out)
export const getSubOutScore = (gameTeamSeason, gameStats, playerStats, gameSeconds) => {
  return playerStats.cumulativeInGameSeconds / gameSeconds;
};

// Return a numerical score (highest score most likely to get subbed in)
export const getSubInScore = (gameTeamSeason, gameStats, playerStats, gameSeconds) => {
  return -playerStats.cumulativeInGameSeconds / gameSeconds;
};

export const getPlayerPositionScore = (gameTeamSeason, gameStats, player, position) => {
  if (player.positionCategoryPreferencesAsPlayer) {
    const preferenceIndex = _.findIndex(player.positionCategoryPreferencesAsPlayer,
    (positionCategoryPreference) =>
    positionCategoryPreference.positionCategory.id === position.positionCategory.id);
    if (preferenceIndex === -1) {
      return -1; // this position category is not a preference
    }
    // return 1 for first preference, .5 for second, .25 for third, etc
    return 1 / (preferenceIndex + 1);
  }
  return 0;
};

export const getSubstitutionScore = (
  gameTeamSeason,
  gameStats,
  subInCandidate,
  subOutCandidate,
  formation,
  gameSeconds
) => {
  const subInPlayerStats = initializePlayerStats(gameStats, subInCandidate.player);
  const subOutPlayerStats = initializePlayerStats(gameStats, subOutCandidate.player);
  const positionId = subOutPlayerStats.currentPositionId;
  const position = _.find(formation.positions, (position) => position.id === positionId);
  const score = getSubOutScore(gameTeamSeason, gameStats, subOutPlayerStats, gameSeconds)
  + getSubInScore(gameTeamSeason, gameStats, subInPlayerStats, gameSeconds)
  + getPlayerPositionScore(gameTeamSeason, gameStats, subInCandidate.player, position);
  console.log(`${subInCandidate.player.name} => ${position.name} (for ${subOutCandidate.player.name}), score = ${score}`);
};
