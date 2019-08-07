import _ from 'lodash';
import moment from 'moment';
import {playerDisplayModes} from '../constants/Player';

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

const getInGameSecondsSincePreviousEvent = (previousEvent, event, gameSeconds) => {
  switch (previousEvent.eventType) {
    case "INITIAL":
    case "IN":
    case "CHANGE":
      return Math.min(event.timeInfo.gameSeconds, gameSeconds) - previousEvent.timeInfo.gameSeconds;
  }
  return 0;
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

export const getGamePeriodAfter = (gamePeriods, gamePeriodId) => {
  if (!gamePeriods) {
    return null;
  }
  const index = _.findIndex(gamePeriods, (gamePeriod) => gamePeriod.id === gamePeriodId);
  if (index === -1) {
    return null;
  }
  return gamePeriods.length > index ? gamePeriods[index + 1] : null;
};

const getGamePeriod = (mostRecentGameActivity, gameTeamSeason, gameStatus) => {
  if (gameStatus === "SCHEDULED") {
    return gameTeamSeason.teamSeason.team.league.gameDefinition.gamePeriods[0];
  }

  if (gameStatus === "IN_PROGRESS" && mostRecentGameActivity) {
    if (mostRecentGameActivity.gameActivityStatus === "PENDING" ||
      mostRecentGameActivity.gameActivityStatus === "IN_PROGRESS") {
        return _.find(gameTeamSeason.teamSeason.team.league.gameDefinition.gamePeriods,
          (gamePeriod) => gamePeriod.id === mostRecentGameActivity.gamePeriod.id);
    }

    // gameActivityStatus is COMPLETED or STOPPED
    return getGamePeriodAfter(
      gameTeamSeason.teamSeason.team.league.gameDefinition.gamePeriods,
      mostRecentGameActivity.gamePeriod.id);
  }

  // if (gameStatus === "COMPLETED") {
  return null;
};

export const getCurrentTimeInfo = (gameTeamSeason) => {
  const gameStatus = gameTeamSeason &&
  gameTeamSeason.game &&
  gameTeamSeason.game.gameStatus;
  const mostRecentGameActivity = gameTeamSeason &&
  gameTeamSeason.game &&
  _.last(gameTeamSeason.game.gameActivities);
  const now = moment();
  const timestamp = now.toDate();
  let totalSeconds = 0;
  let gameSeconds = 0;
  let isGameOver = gameStatus === "COMPLETED";

  if (gameStatus === "IN_PROGRESS" || gameStatus === "COMPLETED") {
    if (mostRecentGameActivity) {
      totalSeconds = mostRecentGameActivity.totalSeconds;
      gameSeconds = mostRecentGameActivity.gameSeconds;
    }

    if (gameStatus === "IN_PROGRESS") {
      if (mostRecentGameActivity) {
        const secondsSinceMostRecentActivity = Math.round(now.diff(mostRecentGameActivity.timestamp) / 1000);
        //console.log(`getCurrentTimeInfo`, secondsSinceMostRecentActivity, mostRecentGameActivity,timestamp,gameSeconds,totalSeconds);

        if (mostRecentGameActivity.gameActivityStatus === "IN_PROGRESS") {
          gameSeconds += secondsSinceMostRecentActivity;
        }
        if (mostRecentGameActivity.gameActivityStatus === "STOPPED" ||
        mostRecentGameActivity.gameActivityStatus === "COMPLETED" ||
        mostRecentGameActivity.gameActivityStatus === "IN_PROGRESS") {
          totalSeconds += secondsSinceMostRecentActivity;
        }
      }
      //console.log(`getCurrentTimeInfo`,mostRecentGameActivity,timestamp,gameSeconds,totalSeconds)
    }
  }

  return {
    timestamp,
    totalSeconds,
    gameSeconds,
    isGameOver,
  };
};

export const getGameStatusInfo = ({
  gameTeamSeason,
  timestamp,
  totalSeconds,
  gameSeconds,
}) => {
  const gameStatus = gameTeamSeason &&
  gameTeamSeason.game &&
  gameTeamSeason.game.gameStatus;
  const mostRecentGameActivity = gameTeamSeason &&
  gameTeamSeason.game &&
  _.last(gameTeamSeason.game.gameActivities);
  const gamePeriod = getGamePeriod(mostRecentGameActivity, gameTeamSeason, gameStatus);
  const gameDurationSeconds = _.reduce(gameTeamSeason.teamSeason.team.league.gameDefinition.gamePeriods,
  (sum, gamePeriod) => sum + gamePeriod.durationSeconds, 0);
  const gameActivityType =
  gameStatus === "IN_PROGRESS" || gameStatus === "COMPLETED"
  ? "OFFICIAL"
  : "PLAN";
  const gameActivityStatus = mostRecentGameActivity
  ? mostRecentGameActivity.gameActivityStatus
  : "PENDING";

  return {
    gameStatus,
    gamePeriod,
    mostRecentGameActivity,
    gameActivityType,
    gameActivityStatus,
    gameDurationSeconds
  };
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

  // Initialize all players
  _.forEach(gameTeamSeason.gamePlayers, (gamePlayer) => {
    initializePlayerTimeline(gameTimeline, gamePlayer.player);
  });

  // Set initial events for players that are unavailable at the start of the game
  _.chain(gameTeamSeason.gamePlayers)
  .filter((gamePlayer) => gamePlayer.availability === "UNAVAILABLE")
  .forEach((gamePlayer) => {
    const playerTimeline = initializePlayerTimeline(gameTimeline, gamePlayer.player);
    const timeInfo = getTimeInfo(gameTeamSeason.substitutions[0]);
    playerTimeline.events.push({
      eventType: "UNAVAILABLE",
      position: null,
      timeInfo,
    });
  })
  .value();

  _.forEach(gameTeamSeason.substitutions, (substitution) => {
    _.forEach(substitution.playerPositionAssignments, (playerPositionAssignment) => {
      const timeInfo = getTimeInfo(substitution, playerPositionAssignment, {});//gameSeconds, totalSeconds, timestamp});
      const playerTimeline = initializePlayerTimeline(gameTimeline, playerPositionAssignment.playerPosition.player);

      playerTimeline.events.push({
        eventType: playerPositionAssignment.playerPositionAssignmentType,
        position: playerPositionAssignment.playerPosition.position,
        timeInfo,
      });
    });
  });

  // console.log(gameTimeline);
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

const isEventBefore = (eventA, eventB) => {
  return eventA.timeInfo.gameSeconds < eventB.timeInfo.gameSeconds;
};

const updatePositionsSnapshot = (positionsSnapshot, event, playerId) => {
  if (event.position &&
  (!positionsSnapshot[event.position.id] ||
  !positionsSnapshot[event.position.id].playerId ||
  isEventBefore(positionsSnapshot[event.position.id].event, event))) {
    positionsSnapshot[event.position.id] = {
      event,
      playerId,
    };
  }
};

export const getGameSnapshot = ({
  gameTimeline,
  positionCategories,
  gameTeamSeason,
  gameActivityType,
  gameActivityStatus,
  totalSeconds,
  gameSeconds,
  timestamp,
  gameDurationSeconds,
}) => {
  const maxSeconds = gameDurationSeconds;
  const minSeconds = 0.0;
  const positionsSnapshot = {};
  const playersSnapshot = _.mapValues(gameTimeline.players, (playerTimeline, playerId) => {
    let secondsCounter = minSeconds;
    let previousEvent = undefined;
    let pendingMove = undefined;
    let activeEvent = undefined;
    let cumulativeInGameSeconds = 0;
    const piePieces = [];
    _.forEach(playerTimeline.events, (event, index) => {
      const startSecondsSinceGameStart = secondsCounter;
      const endSecondsSinceGameStart = Math.min(event.timeInfo.gameSeconds, gameSeconds);

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
      if (startValue !== endValue) {
        piePieces.push(piePiece);
        if (previousEvent) {
          cumulativeInGameSeconds += getInGameSecondsSincePreviousEvent(previousEvent, event, gameSeconds);
        }
      }

      if (event.timeInfo.gameSeconds > gameSeconds) {
        if (event.timeInfo.gameSeconds - endSecondsSinceGameStart < gameTeamSeason.gamePlan.secondsBetweenSubs) {
          // console.log(`should have a pending move`);
          const pendingMoveSeconds = event.timeInfo.gameSeconds - endSecondsSinceGameStart;
          const pendingMoveTime = moment.utc(pendingMoveSeconds*1000).format("m:ss") || "0:00";
          const percentToMove = (gameTeamSeason.gamePlan.secondsBetweenSubs -
            (event.timeInfo.gameSeconds - endSecondsSinceGameStart)) /
            gameTeamSeason.gamePlan.secondsBetweenSubs * 100;
          const color = getColor({
            event,
            positionCategories,
          });
          pendingMove = {
            color,
            pendingMoveTime,
            percentToMove,
          };
        }
        return false;
      }
      activeEvent = event;
      updatePositionsSnapshot(positionsSnapshot, event, playerId);

      secondsCounter += (endSecondsSinceGameStart - startSecondsSinceGameStart);
      previousEvent = event;

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
        cumulativeInGameSeconds += getInGameSecondsSincePreviousEvent(
          previousEvent,
          {
            ...previousEvent,
            timeInfo: {
              ...previousEvent.timeInfo,
              gameSeconds
            }
          }, gameSeconds);
      }
    });
    // Make sure each position got included in the positionsSnapshot
    if (gameTeamSeason.formationSubstitutions && gameTeamSeason.formationSubstitutions.length) {
      _.forEach(gameTeamSeason.formationSubstitutions[0].formation.positions, (position) => {
        if (!positionsSnapshot[position.id]) {
          const timeInfo = {//getTimeInfo(substitution, playerPositionAssignment, {});//gameSeconds, totalSeconds, timestamp});
            gameSeconds,
            totalSeconds,
            timestamp,
          };
          positionsSnapshot[position.id] = {
            event:{
              eventType: "INITIAL",
              position,
              timeInfo,
            }
          };
        }
      });
    }
    return {
      activeEvent,
      cumulativeInGameSeconds,
      piePieces,
      pendingMove,
    };
  });
  const gameSnapshot = {
    // bench: benchSnapshot,
    players: playersSnapshot,
    positions: positionsSnapshot,
  }
  // console.log(gameSnapshot);
  return gameSnapshot;
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
  const score = 2*getSubOutScore(gameTeamSeason, gameStats, subOutPlayerStats, gameSeconds)
  + 2*getSubInScore(gameTeamSeason, gameStats, subInPlayerStats, gameSeconds)
  + getPlayerPositionScore(gameTeamSeason, gameStats, subInCandidate.player, position);
  console.log(`${subInCandidate.player.name} => ${position.name} (for ${subOutCandidate.player.name}), score = ${score}`);
  return score;
};

const positionSnapshotsMatch = (positionSnapshot1, positionSnapshot2) => {
  if (positionSnapshot1.playerId &&
    positionSnapshot1.playerId === positionSnapshot2.playerId) {
    return true;
  }
  if (positionSnapshot1.event &&
    positionSnapshot1.event.position &&
    positionSnapshot2.event &&
    positionSnapshot2.event.position &&
    positionSnapshot1.event.position.id === positionSnapshot2.event.position.id) {
    return true;
  }
  return false;
};

export const getPlayerDisplayMode = (positionSnapshot, state) => {
  const {selectionInfo} = state;

  if (!positionSnapshot.playerId) {
    if (selectionInfo &&
      _.find(selectionInfo.selections, (selection) => positionSnapshotsMatch(selection, positionSnapshot))) {
      return playerDisplayModes.unassignedSelected;
    }
    return playerDisplayModes.unassigned;
  }

  if (!selectionInfo || selectionInfo.selections.length === 0) {
    return playerDisplayModes.normal;
  }

  if (selectionInfo.selections[0].playerId === positionSnapshot.playerId) {
    return playerDisplayModes.primarySelection;
  }

  if (_.find(selectionInfo.selections, (selection) => positionSnapshotsMatch(selection, positionSnapshot))) {
    return playerDisplayModes.secondarySelection;
  }

  return playerDisplayModes.unselected;
};

// if selectionInfo.selections has 3 position snapshots then
// returns true if can substitute from
//   [position snapshot 1] to [position snapshot 2]
//   [position snapshot 2] to [position snapshot 3]
//   [position snapshot 3] to [position snapshot 1]
export const canSubstitute = (selectionInfo) => {
  const {selections} = selectionInfo;
  if (!selections || selections.length < 2) {
    return false;
  }
  let returnValue = true;
  for (let index = 0;index<selections.length;index++) {
    returnValue = returnValue &&
    canSubstituteFromTo(selections[index], selections[(index + 1) % selections.length]);
  }
  return returnValue;
};

export const canSubstituteFromTo = (positionSnapshotFrom, positionSnapshotTo) => {
  return positionSnapshotFrom &&
    positionSnapshotFrom.playerId &&
    positionSnapshotTo &&
    positionSnapshotTo.playerId &&
    positionSnapshotFrom.playerId !== positionSnapshotTo.playerId;
};

// Returns true when there are exactly two selections and one
// has a player in one does not.
export const canSetLineup = (selectionInfo) => {
  const {selections} = selectionInfo;
  return selections &&
    selections.length === 2 &&
    !selections[0].playerId === !!selections[1].playerId;
};

export const getPlayerPressedSelectionInfo = (
  previousState,
  positionSnapshot
) => {
  const {selectionInfo: previousSelectionInfo} = previousState;

  // ToDo: Add concept of automatic selection (when you press one player
  // the corresponding sub is automatically selected). Clicking automatic
  // selection turns it into a non-automatic selection rather than unselecting it.

  // If no selection info then just return this single selection
  if (!previousSelectionInfo) {
    return {
      selections: [positionSnapshot]
    };
  }

  // If most recent selection matches this selection then unselect
  if (previousSelectionInfo &&
    previousSelectionInfo.selections &&
    previousSelectionInfo.selections.length &&
    positionSnapshotsMatch(previousSelectionInfo.selections[previousSelectionInfo.selections.length - 1], positionSnapshot)) {
    return {
      ...previousSelectionInfo,
      selections: previousSelectionInfo.selections.slice(0, previousSelectionInfo.selections.length - 1),
    };
  }

  // Append this selection
  return {
    ...previousSelectionInfo,
    selections: [...previousSelectionInfo.selections, positionSnapshot]
  };
};

export const getCancelPressedSelectionInfo = (previousState) => {};
