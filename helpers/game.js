import _ from 'lodash';
import moment from 'moment';
import {playerDisplayModes} from '../constants/Player';
import {
  playerAvailability,
} from '../constants/Soccer';

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
  let eventGameSeconds;
  switch (previousEvent.eventType) {
    case "INITIAL":
    case "IN":
    case "CHANGE":
      eventGameSeconds = event.isOverdue
      ? gameSeconds
      : Math.min(event.timeInfo.gameSeconds, gameSeconds);
      return eventGameSeconds - previousEvent.timeInfo.gameSeconds;
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
    // if (substitution.gameActivityType === "PLAN" &&
    // substitution.gameActivityStatus === "COMPLETED") {
    //   return;
    // }
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

  _.forEach(gameStats.players, (playerStats) => {
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

const getGamePeriodInfo = (mostRecentGameActivity, gameTeamSeason, gameStatus) => {
  let gameTimeframeSummary = "Waiting for kickoff";
  let isFirstPeriod = true;
  let gamePeriod;
  if (!gameTeamSeason) {
    return {};
  }
  if (gameStatus === "SCHEDULED") {
    if (gameTeamSeason.game.scheduledStartTime) {
      const format =
      moment(gameTeamSeason.game.scheduledStartTime).startOf('day')
      .isSame(moment().startOf('day'))
      ? `LT`
      : `M/D, LT`;
      gameTimeframeSummary = moment(gameTeamSeason.game.scheduledStartTime).format(format);
    }
    gamePeriod = gameTeamSeason.teamSeason.team.league.gameDefinition.gamePeriods[0];
    return {
      isFirstPeriod,
      gamePeriod,
      gameTimeframeSummary,
    };
  }

  if (gameStatus === "IN_PROGRESS" && mostRecentGameActivity) {
    if (mostRecentGameActivity.gameActivityStatus === "PENDING" ||
      mostRecentGameActivity.gameActivityStatus === "IN_PROGRESS") {
        const gamePeriod =  _.find(gameTeamSeason.teamSeason.team.league.gameDefinition.gamePeriods,
        (gamePeriod) => gamePeriod.id === mostRecentGameActivity.gamePeriod.id);
        isFirstPeriod = gamePeriod &&
          gamePeriod.id === gameTeamSeason.teamSeason.team.league.gameDefinition.gamePeriods[0].id,
        gameTimeframeSummary = gamePeriod.name;
        return {
          isFirstPeriod,
          gamePeriod,
          gameTimeframeSummary,
        };
    }

    // gameActivityStatus is COMPLETED or STOPPED
    isFirstPeriod = false;
    gamePeriod = getGamePeriodAfter(
      gameTeamSeason.teamSeason.team.league.gameDefinition.gamePeriods,
      mostRecentGameActivity.gamePeriod.id);
    gameTimeframeSummary = "Halftime";
    return {
      isFirstPeriod,
      gamePeriod,
      gameTimeframeSummary,
    };
  }

  gameTimeframeSummary = "Full time";
  // if (gameStatus === "COMPLETED") {
  return {
    gameTimeframeSummary,
  };
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

        if (mostRecentGameActivity.gameActivityStatus === "IN_PROGRESS") {
          gameSeconds += secondsSinceMostRecentActivity;
        }
        if (mostRecentGameActivity.gameActivityStatus === "STOPPED" ||
        mostRecentGameActivity.gameActivityStatus === "COMPLETED" ||
        mostRecentGameActivity.gameActivityStatus === "IN_PROGRESS") {
          totalSeconds += secondsSinceMostRecentActivity;
        }
      }
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
}) => {
  const gameStatus = gameTeamSeason &&
  gameTeamSeason.game &&
  gameTeamSeason.game.gameStatus;
  const mostRecentGameActivity = gameTeamSeason &&
  gameTeamSeason.game &&
  _.last(gameTeamSeason.game.gameActivities);
  const {isFirstPeriod, gamePeriod, gameTimeframeSummary} = getGamePeriodInfo(mostRecentGameActivity, gameTeamSeason, gameStatus);
  const gameDurationSeconds = gameTeamSeason
  ? _.reduce(gameTeamSeason.teamSeason.team.league.gameDefinition.gamePeriods,
  (sum, gamePeriod) => sum + gamePeriod.durationSeconds, 0)
  : 0;
  const gameActivityType =
  gameStatus === "IN_PROGRESS" || gameStatus === "COMPLETED"
  ? "OFFICIAL"
  : "PLAN";
  const gameActivityStatus = mostRecentGameActivity
  ? mostRecentGameActivity.gameActivityStatus
  : "PENDING";

  return {
    isFirstPeriod,
    gameStatus,
    gamePeriod,
    mostRecentGameActivity,
    gameActivityType,
    gameActivityStatus,
    gameDurationSeconds,
    gameTimeframeSummary,
  };
};

export const getGameTimeline = ({
  gameStatus,
  gameTeamSeason,
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
      isOverdue: false,
    });
  })
  .value();

  _.forEach(gameTeamSeason.substitutions, (substitution) => {
    if (gameStatus === "IN_PROGRESS" &&
    substitution.gameActivityType === "PLAN" &&
    substitution.gameActivityStatus === "COMPLETED") {
      return;
    }
    _.forEach(substitution.playerPositionAssignments, (playerPositionAssignment) => {
      if (gameStatus === "IN_PROGRESS" &&
      substitution.gameActivityType === "PLAN" &&
      playerPositionAssignment.gameActivityStatus === "COMPLETED") {
        return;
      }
      // Do not alter times if substitution is overdue (isOverdue on event will help determine what to do with events)
      const isOverdue = gameStatus === "IN_PROGRESS" &&
      substitution.gameActivityType === "PLAN" &&
      substitution.gameSeconds < gameSeconds;
      const timeInfo = getTimeInfo(substitution, playerPositionAssignment, {});
      const playerTimeline = initializePlayerTimeline(gameTimeline, playerPositionAssignment.playerPosition.player);

      playerTimeline.events.push({
        eventType: playerPositionAssignment.playerPositionAssignmentType,
        position: playerPositionAssignment.playerPosition.position,
        timeInfo,
        isOverdue,
      });
    });
  });

  return gameTimeline;
};

const getPositionCategory = (position) => {
  if (!position || !position.positionCategory) {
    return null;
  }
  return position.positionCategory;
};

const getColor = ({
  event,
  positionCategories,
}) => {
  if (!event) {
    // no event means started as a substitute
    return "gray";
  }

  let positionCategory;
  switch (event.eventType) {
    case "OUT":
      return "gray";
    case "UNAVAILABLE":
      return "black";
    // case "INITIAL":
    // case "IN":
    // case "CHANGE":
    default:
      positionCategory = getPositionCategory(event.position, positionCategories);
      return positionCategory && positionCategory.color || "white";
  }
};

const isEventBefore = (eventA, eventB) => {
  return eventA.timeInfo.gameSeconds <= eventB.timeInfo.gameSeconds;
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
  totalSeconds,
  gameSeconds,
  timestamp,
  gameDurationSeconds,
}) => {
  const maxSeconds = gameDurationSeconds;
  const minSeconds = 0.0;
  const positionsSnapshot = {};
  // Only show pending moves for the next substitution. Identify it by futureEventGameSeconds.
  const nextPlannedSubstitution = getNextPlannedSubstitution({
    gameTeamSeason,
    excludeInitial: true
  });
  let nextPlannedSubstitutionGameSeconds = nextPlannedSubstitution ? nextPlannedSubstitution.gameSeconds : Number.MAX_SAFE_INTEGER;
  const playersSnapshot = _.mapValues(gameTimeline.players, (playerTimeline, playerId) => {
    let secondsCounter = minSeconds;
    let previousEvent = undefined;
    let pendingMove = undefined;
    let activeEvent = undefined;
    let cumulativeInGameSeconds = 0;
    const piePieces = [];
    _.forEach(playerTimeline.events, (event, index) => {
      const startSecondsSinceGameStart = secondsCounter;
      const endSecondsSinceGameStart = event.isOverdue
      ? gameSeconds
      : Math.min(event.timeInfo.gameSeconds, gameSeconds);
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

      if (event.eventType !== "INITIAL" &&
      (event.isOverdue || event.timeInfo.gameSeconds > gameSeconds) &&
      event.timeInfo.gameSeconds <= nextPlannedSubstitutionGameSeconds) {
        const pendingMoveSeconds = event.timeInfo.gameSeconds - endSecondsSinceGameStart;
        const pendingMoveTime = pendingMoveSeconds < 0
        ? `-${moment.utc(-pendingMoveSeconds*1000).format("m:ss")}`
        : moment.utc(pendingMoveSeconds*1000).format("m:ss") || "0:00";

        // percentToMove should be 0 up to secondsBetweenSubs away and 100 from sub time thereafter
        // So if secondsBetweenSubs is 1000 expect pendingMoveSeconds/percentToMove...
        // 2000/0   1000/0   750/25   500/50   250/75   0/100   -1000/100
        let percentToMove;
        if (pendingMoveSeconds > gameTeamSeason.gamePlan.secondsBetweenSubs) {
          percentToMove = 0;
        } else if (pendingMoveSeconds <= 0) {
          percentToMove = 100;
        } else {
          percentToMove = (gameTeamSeason.gamePlan.secondsBetweenSubs -
            pendingMoveSeconds) /
            gameTeamSeason.gamePlan.secondsBetweenSubs * 100;
        }
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

      // Returning false here essentially prevents event from being included in snapshot
      if (event.eventType !== "INITIAL" &&
      (event.isOverdue || event.timeInfo.gameSeconds > gameSeconds)) {
          return false;
      }

      activeEvent = event;
      updatePositionsSnapshot(positionsSnapshot, event, playerId);

      secondsCounter += (endSecondsSinceGameStart - startSecondsSinceGameStart);
      previousEvent = event;

      if (index === playerTimeline.events.length - 1 &&
        endSecondsSinceGameStart <= gameSeconds
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
          const timeInfo = {
            gameSeconds,
            totalSeconds,
            timestamp,
          };
          positionsSnapshot[position.id] = {
            event:{
              eventType: "INITIAL",
              position,
              timeInfo,
              isOverdue: false,
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
  let gameSnapshot = {
    players: playersSnapshot,
    positions: positionsSnapshot,
  }
  // positionSnapshot can indicate a player that is actually on the bench, so fix that
  _.each(positionsSnapshot, (positionSnapshot) => {
    if (positionSnapshot.playerId && playerIsOnBench(
    positionSnapshot.playerId, gameSnapshot, playerAvailability.active)) {
      positionSnapshot.playerId = null;
    }
  });
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

export const getNextPlannedSubstitution = ({
  gameTeamSeason,
  excludeInitial = true
}) => {
  return gameTeamSeason &&
  gameTeamSeason.substitutions &&
  _.find(gameTeamSeason.substitutions, (sub) =>
    sub.gameActivityType === "PLAN" &&
    sub.gameActivityStatus === "PENDING" &&
    (!excludeInitial ||
      !_.find(sub.playerPositionAssignments, (playerPositionAssignment =>
      playerPositionAssignment.playerPositionAssignmentType === "INITIAL")))
  );
};

export const canApplyPlannedSubstitution = (gameTeamSeason) => {
  const nextPlannedSubstitution = getNextPlannedSubstitution({
    gameTeamSeason,
    excludeInitial: true
  });
  //console.log(`canApplyPlannedSubstitution`, nextPlannedSubstitution);
  // ToDo: Make sure the player position assignments are allowed
  // console.log(`nextPlannedSubstitution`, nextPlannedSubstitution);
  return !!nextPlannedSubstitution;
};

export const selectionsPartOfPlannedSubstitution = (selectionInfo, gameTeamSeason) => {
  const nextPlannedSubstitution = getNextPlannedSubstitution({
    gameTeamSeason,
    excludeInitial: true
  });
  return selectionInfo &&
  selectionInfo.selections &&
  _.every(selectionInfo.selections, (positionSnapshot) =>
  getPlayerPositionAssignmentRelatedToPositionSnapshot(
      nextPlannedSubstitution,
      positionSnapshot,
    ));
};

export const canRemoveSelectedSubs = (selectionInfo) => {
  return selectionInfo.hasPlannedSubstitutionAssignments;
};


// if selectionInfo.selections has 3 position snapshots then
// returns true if !hasPlannedSubstitutionAssignments and can substitute from
//   [position snapshot 1] to [position snapshot 2]
//   [position snapshot 2] to [position snapshot 3]
//   [position snapshot 3] to [position snapshot 1]
export const canSubstitute = ({
  selectionInfo,
  gameActivityType,
}) => {
  const {hasPlannedSubstitutionAssignments, selections} = selectionInfo;
  if (gameActivityType === "PLAN" && hasPlannedSubstitutionAssignments) {
    return false;
  }
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

export const playerIsOnBench = (playerId, gameSnapshot, availability) => {
  return availability === playerAvailability.active &&
    gameSnapshot.players[playerId] &&
    (!gameSnapshot.players[playerId].activeEvent ||
    !gameSnapshot.players[playerId].activeEvent.position);
};

export const canSubstituteFromTo = (positionSnapshotFrom, positionSnapshotTo) => {
  return positionSnapshotFrom &&
    positionSnapshotFrom.playerId &&
    positionSnapshotTo &&
    positionSnapshotTo.playerId &&
    positionSnapshotFrom.playerId !== positionSnapshotTo.playerId;
};

// Returns true when there are exactly two selections and one
// has a player and one does not.
export const canSetLineup = (selectionInfo) => {
  const {selections} = selectionInfo;
  return selections &&
    selections.length === 2 &&
    !selections[0].playerId === !!selections[1].playerId;
};

// Returns true when all selections are currently in positions.
export const canRemoveFromLineup = (selectionInfo) => {
  const {selections} = selectionInfo;
  return selections &&
    _.every(selections, (selection) => selection.event
      && selection.event.position
      && selection.playerId);
};

export const getPlayerPositionAssignmentRelatedToPositionSnapshot = (
  nextPlannedSubstitution,
  positionSnapshot,
) => {
  const selectedPlayerId = positionSnapshot.playerId;
  return nextPlannedSubstitution &&
  _.find(nextPlannedSubstitution.playerPositionAssignments,
    (playerPositionAssignment) =>
    (!selectedPlayerId &&
      playerPositionAssignment.playerPosition.position &&
      // playerPositionAssignment.playerPositionAssignmentType === "CHANGE"
      //   CHANGE # change position on the field
      //   INITIAL # starting lineup position
      //   IN # change from bench to position on the field
      //   OUT
    positionSnapshot &&
    positionSnapshot.event &&
    positionSnapshot.event.position &&
    playerPositionAssignment.playerPosition.position.id === positionSnapshot.event.position.id) ||
    (selectedPlayerId &&
      playerPositionAssignment.playerPosition &&
      playerPositionAssignment.playerPosition.player &&
      positionSnapshot.playerId === playerPositionAssignment.playerPosition.player.id));
};

const getPlannedSubstitutionPositionsFor = (
  nextPlannedSubstitution,
  positionSnapshot,
  {
    //gameTeamSeason,
    gameSnapshot
  }
) => {
  let playerPositionAssignmentRelatedToPositionSnapshot =
  getPlayerPositionAssignmentRelatedToPositionSnapshot(
    nextPlannedSubstitution,
    positionSnapshot,
  );
  if (!playerPositionAssignmentRelatedToPositionSnapshot) {
    return null;
  }
  const positionSnapshots = [positionSnapshot];
  let done;
  do {
    console.log(`done, playerPositionAssignmentRelatedToPositionSnapshot`, done, playerPositionAssignmentRelatedToPositionSnapshot);
    const nextRelatedPositionSnapshot =
    playerPositionAssignmentRelatedToPositionSnapshot.playerPosition &&
    playerPositionAssignmentRelatedToPositionSnapshot.playerPosition.position
    ? _.find(gameSnapshot.positions, (_positionSnapshot) =>
      _positionSnapshot.event &&
      _positionSnapshot.event.position &&
      _positionSnapshot.event.position.id === playerPositionAssignmentRelatedToPositionSnapshot.playerPosition.position.id &&
      positionSnapshots.indexOf(_positionSnapshot) === -1)
    : _.find(gameSnapshot.positions, (_positionSnapshot) =>
      playerPositionAssignmentRelatedToPositionSnapshot.playerPosition &&
      playerPositionAssignmentRelatedToPositionSnapshot.playerPosition.player &&
      _positionSnapshot.playerId === playerPositionAssignmentRelatedToPositionSnapshot.playerPosition.player.id &&
      positionSnapshots.indexOf(_positionSnapshot) === -1);

    done = !nextRelatedPositionSnapshot ||
    positionSnapshotsMatch(nextRelatedPositionSnapshot, positionSnapshot);

    if (!done) {
      positionSnapshots.push(nextRelatedPositionSnapshot);
      playerPositionAssignmentRelatedToPositionSnapshot =
      getPlayerPositionAssignmentRelatedToPositionSnapshot(
        nextPlannedSubstitution,
        nextRelatedPositionSnapshot,
      );
    }
  } while (!done);
  return positionSnapshots;
};

export const getPlayerPressedSelectionInfo = (
  previousState,
  positionSnapshot,
  {
    gameTeamSeason,
    gameSnapshot,
  }
) => {
  const {selectionInfo: previousSelectionInfo} = previousState;

  // If no selection info then just return this single selection or all
  // of the positions related to a pending substitution involving this position
  if (!previousSelectionInfo) {
    // When you press one player the corresponding sub(s) is automatically selected.
    const nextPlannedSubstitution = getNextPlannedSubstitution({
      gameTeamSeason,
      excludeInitial: true
    });
    const plannedSubstitutionPositions = getPlannedSubstitutionPositionsFor(
      nextPlannedSubstitution,
      positionSnapshot,
      {
        gameTeamSeason,
        gameSnapshot
      }
    );
    if (plannedSubstitutionPositions) {
      return {
        selectedPlayerId: positionSnapshot.playerId,
        selections: plannedSubstitutionPositions,
        hasPlannedSubstitutionAssignments: true,
      };
    }
    return {
      selectedPlayerId: positionSnapshot.playerId,
      selections: [positionSnapshot],
      hasPlannedSubstitutionAssignments: false,
    };
  }

  // If most recent selection matches this selection then unselect
  if (previousSelectionInfo &&
    previousSelectionInfo.selections &&
    previousSelectionInfo.selections.length &&
    positionSnapshotsMatch(previousSelectionInfo.selections[previousSelectionInfo.selections.length - 1], positionSnapshot)) {
    const selections = previousSelectionInfo.selections.slice(0, previousSelectionInfo.selections.length - 1);
    const selectedPlayerId = selections.length === 1 ? selections[0].playerId : null;
    return {
      ...previousSelectionInfo,
      selectedPlayerId,
      selections,
    };
  }

  // Append this selection
  return {
    ...previousSelectionInfo,
    selectedPlayerId: null,
    selections: [...previousSelectionInfo.selections, positionSnapshot]
  };
};

export const getCancelPressedSelectionInfo = () => {};
