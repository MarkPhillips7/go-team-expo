import gql from "graphql-tag";
import _ from 'lodash';
import {
  playerAvailability,
} from '../constants/Soccer';
import {
  getGameStats,
  getPlayerPositionAssignmentRelatedToPositionSnapshot,
  getSubOutScore,
  getSubstitutionScore,
  playerIsCurrentlyPlaying
} from '../helpers/game';

const CREATE_FORMATION_SUBSTITUTION = gql`
mutation CreateFormationSubstitution(
  $formationId: ID!
  $gameActivityType: GameActivityType!
  $gameActivityStatus: GameActivityStatus!
  $gameTeamSeasonId: ID!
  $totalSeconds: Int
  $gameSeconds:  Int
){
  createFormationSubstitution (
    gameActivityType: $gameActivityType
    gameActivityStatus: $gameActivityStatus
    formationId: $formationId
    gameTeamSeasonId: $gameTeamSeasonId
    totalSeconds: $totalSeconds
    gameSeconds: $gameSeconds
  ) {
    id
    gameSeconds
    formation {
      id
      name
      positions {
        id
        name
        positionCategory {
          id
          name
          color
        }
      }
    }
  }
}
`;

const CREATE_SUBSTITUTION = gql`
mutation (
  $gameActivityType: GameActivityType!
  $gameActivityStatus: GameActivityStatus!
  $gameTeamSeasonId: ID!
  $timestamp: DateTime
  $totalSeconds: Int
  $gameSeconds:  Int
) {
  createSubstitution (
    gameActivityType: $gameActivityType
    gameActivityStatus: $gameActivityStatus
    gameTeamSeasonId: $gameTeamSeasonId
    timestamp: $timestamp
    totalSeconds: $totalSeconds
    gameSeconds: $gameSeconds
  ) {
    id
    timestamp
    totalSeconds
    gameSeconds
  }
}
`;

const UPDATE_SUBSTITUTION = gql`
mutation (
  $id: ID!
  $gameActivityStatus: GameActivityStatus!
){
  updateSubstitution (
    id: $id
    gameActivityStatus: $gameActivityStatus
  ) {
    id
    gameActivityStatus
  }
}
`;

const UPDATE_PLAYER_POSITION_ASSIGNMENT = gql`
mutation (
  $id: ID!
  $gameActivityStatus: GameActivityStatus!
){
  updatePlayerPositionAssignment (
    id: $id
    gameActivityStatus: $gameActivityStatus
  ) {
    id
    gameActivityStatus
  }
}
`;

const CREATE_PLAYER_POSITION = gql`
mutation CreatePlayerPosition (
  $playerId: ID!
  $positionId: ID
){
  createPlayerPosition(
    playerId: $playerId
    positionId: $positionId
  ) {
    id
  }
}
`;

const CREATE_PLAYER_POSITION_ASSIGNMENT = gql`
mutation CreatePlayerPositionAssignment (
  $playerPositionAssignmentType: PlayerPositionAssignmentType!
  $gameActivityStatus: GameActivityStatus
  $playerPositionId: ID!
  $substitutionId: ID!
){
  createPlayerPositionAssignment(
    gameActivityStatus: $gameActivityStatus
    playerPositionAssignmentType: $playerPositionAssignmentType
    playerPositionId: $playerPositionId
    substitutionsIds: [
      $substitutionId
		]
  ) {
    id
  }
}
`;

const DELETE_PLAYER_POSITION_ASSIGNMENT = gql`
mutation DeletePlayerPositionAssignment (
  $id: ID!
){
  deletePlayerPositionAssignment(
    id: $id
  ) {
    id
  }
}
`;

const DELETE_PLAYER_POSITION = gql`
mutation DeletePlayerPosition (
  $id: ID!
){
  deletePlayerPosition(
    id: $id
  ) {
    id
  }
}
`;

const DELETE_SUBSTITUTION = gql`
mutation deleteSubstitution (
  $id: ID!
){
  deleteSubstitution(
    id: $id
  ) {
    id
  }
}
`;

export const createPlayerPosition = (client, {
  playerId,
  positionId,
}) => {
  return client.mutate({
    mutation: CREATE_PLAYER_POSITION,
    variables: {
      playerId,
      positionId,
    }
  })
  .then((result) => result.data.createPlayerPosition);
};

export const createPlayerPositionAssignment = (client, {
  gameActivityStatus,
  playerPositionAssignmentType,
  playerPositionId,
  substitutionId,
  // gameTeamSeasonId,
}) => {
  // console.log(`gameTeamSeasonId: ${gameTeamSeasonId}`);
  return client.mutate({
    mutation: CREATE_PLAYER_POSITION_ASSIGNMENT,
    variables: {
      gameActivityStatus,
      playerPositionAssignmentType,
      playerPositionId,
      substitutionId,
    },
    // refetchQueries: ["getGameTeamSeasonInfo"],//[{query: GAME_TEAM_SEASON_INFO, variables: {gameTeamSeasonId}}],
  })
  .then((result) => result.data.createPlayerPositionAssignment);
};

const deletePlayerPositionAssignment = (client, {
  id,
}) => {
  return client.mutate({
    mutation: DELETE_PLAYER_POSITION_ASSIGNMENT,
    variables: {
      id,
    },
  });
};

export const updatePlayerPositionAssignment = (client, {
  id,
  gameActivityStatus,
}) => {
  return client.mutate({
    mutation: UPDATE_PLAYER_POSITION_ASSIGNMENT,
    variables: {
      id,
      gameActivityStatus,
    }
  })
  .then((result) => result.data.updatePlayerPositionAssignment);
};

const deletePlayerPosition = (client, {
  id,
}) => {
  return client.mutate({
    mutation: DELETE_PLAYER_POSITION,
    variables: {
      id,
    },
  });
};

const deleteSubstitution = (client, {
  id,
}) => {
  return client.mutate({
    mutation: DELETE_SUBSTITUTION,
    variables: {
      id,
    },
  });
};

const deleteSubstitutionIfAppropriate = (client, {
  shouldDeleteSubstitution,
  id,
}) => {
  if (!shouldDeleteSubstitution) {
    return Promise.resolve();
  }
  return deleteSubstitution(client, {
    id,
  });
};

// const refetchGameTeamSeasonInfo = (client, {
//   gameTeamSeasonId,
// }) => {
//   console.log(`hello gameTeamSeasonId: ${gameTeamSeasonId}`);
//   return client.query({
//     query: GAME_TEAM_SEASON_INFO,
//     variables: {
//       gameTeamSeasonId,
//     },
//     fetchPolicy: "no-cache",
//   })
//   .then((result) => result.data);
// };

export const getOrCreateFormationSubstitution = (client, {
  formationId,
  gameActivityStatus,
  gameActivityType,
  gameTeamSeason,
  totalSeconds,
  gameSeconds,
}) => {
  if (!gameTeamSeason.formationSubstitutions || gameTeamSeason.formationSubstitutions.length === 0) {
    const gameTeamSeasonId = gameTeamSeason.id;
    return client.mutate({
      mutation: CREATE_FORMATION_SUBSTITUTION,
      variables: {
        formationId,
        gameActivityType,
        gameActivityStatus,
        gameTeamSeasonId,
        totalSeconds,
        gameSeconds,
      }
    })
    .then((result) => result.data.createFormationSubstitution);
  }
  return Promise.resolve(gameTeamSeason.formationSubstitutions[0]);
};

export const createSubstitution = (client, {
  gameActivityStatus,
  gameActivityType,
  gameTeamSeason,
  timestamp,
  totalSeconds,
  gameSeconds,
}) => {
  const gameTeamSeasonId = gameTeamSeason.id;
  return client.mutate({
    mutation: CREATE_SUBSTITUTION,
    variables: {
      gameActivityType,
      gameActivityStatus,
      gameTeamSeasonId,
      timestamp,
      totalSeconds,
      gameSeconds,
    }
  })
  .then((result) => result.data.createSubstitution);
};

export const updateSubstitution = (client, {
  id,
  gameActivityStatus,
}) => {
  return client.mutate({
    mutation: UPDATE_SUBSTITUTION,
    variables: {
      id,
      gameActivityStatus,
    }
  })
  .then((result) => result.data.updateSubstitution);
};

const getSubstitutionAtSpecificTime = ({
  gameActivityType,
  gameTeamSeason,
  // timestamp,
  // totalSeconds,
  gameSeconds,
}) => {
  return gameTeamSeason.substitutions &&
    _.find(gameTeamSeason.substitutions, (sub) =>
    sub.gameActivityType === gameActivityType &&
    sub.gameActivityStatus !== "COMPLETED" &&
    sub.gameSeconds === gameSeconds);
};

const getOrCreateSubstitutionAtSpecificTime = (client, {
  gameActivityStatus,
  gameActivityType,
  gameTeamSeason,
  timestamp,
  totalSeconds,
  gameSeconds,
}) => {
  const substitution = getSubstitutionAtSpecificTime({
    gameActivityType,
    gameTeamSeason,
    // timestamp,
    // totalSeconds,
    gameSeconds,
  });
  if (!substitution) {
    return createSubstitution(client, {
      gameActivityStatus,
      gameActivityType,
      gameTeamSeason,
      timestamp,
      totalSeconds,
      gameSeconds,
    });
  }
  return Promise.resolve(substitution);
};

const getOrCreateInitialSubstitution = (client, {
  gameActivityStatus,
  gameActivityType,
  gameTeamSeason,
  timestamp,
  totalSeconds,
  gameSeconds,
}) => {
  if (!gameTeamSeason.substitutions || gameTeamSeason.substitutions.length === 0) {
    return createSubstitution(client, {
      gameActivityStatus,
      gameActivityType,
      gameTeamSeason,
      timestamp,
      totalSeconds,
      gameSeconds,
    });
  }
  return Promise.resolve(gameTeamSeason.substitutions[0]);
};

const getOrCreatePlayerPositionsAndPlayerPositionAssignments = (client, {
  formationSubstitution,
  substitution,
  gameTeamSeason,
  playerPositionAssignmentType,
}) => {
  const gamePositions = formationSubstitution &&
    formationSubstitution.formation &&
    formationSubstitution.formation.positions || [];
  let positionsWithFilledStatus = gamePositions.map((position) => ({
    filled: false,
    position,
  }));
  const deletionPromises = [];

  // Identify the existing player position assignments
  const playerPositionAssignments = substitution.playerPositionAssignments || [];
  _.each(playerPositionAssignments, (playerPositionAssignment) => {
    const positionWithFilledStatus = _.find(positionsWithFilledStatus, (positionWithFilledStatus) =>
    positionWithFilledStatus.position &&
    playerPositionAssignment.playerPosition.position &&
    positionWithFilledStatus.position.id === playerPositionAssignment.playerPosition.position.id);
    const gamePlayer = _.find(gameTeamSeason.gamePlayers, (gamePlayer) =>
    gamePlayer.player.id === playerPositionAssignment.playerPosition.player.id);
    if (gamePlayer.availability === playerAvailability.unavailable) {
      // delete player position assignment
      deletionPromises.push(
        deletePlayerPositionAssignment(client, {
          id: playerPositionAssignment.id,
        })
        .then(() => deletePlayerPosition(client, {
          id: playerPositionAssignment.playerPosition.id,
        })));
    } else {
      positionWithFilledStatus.filled = true;
    }
  });

  // Determine additional player position assignments that still need to be created
  const getAvailablePositionWithFilledStatus = (gamePlayer) => {
    const availablePositionWithFilledStatus = _.find(positionsWithFilledStatus,
      (positionWithFilledStatus) => !positionWithFilledStatus.filled &&
      gamePlayer.availability !== playerAvailability.unavailable);
    if (!availablePositionWithFilledStatus) {
      return null;
    }

    availablePositionWithFilledStatus.filled = true;
    return availablePositionWithFilledStatus.position;
  };

  return Promise.all([
    ...deletionPromises,
    ..._.chain(gameTeamSeason.gamePlayers)
  .shuffle()
  // just include players that are not already assigned a position
  .filter((gamePlayer) => !_.find(substitution.playerPositionAssignments || [],
    (playerPositionAssignment) =>
    playerPositionAssignment.playerPosition.player.id === gamePlayer.player.id)
  )
  .map((gamePlayer) => {
    const position = getAvailablePositionWithFilledStatus(gamePlayer);
    if (position) {
      const playerId = gamePlayer.player.id;
      const positionId = position.id;
      let playerPosition;
      console.log(`playerId=${playerId}, positionId=${positionId}`);
      return createPlayerPosition(client, {
        playerId,
        positionId,
      })
      .then(result => {playerPosition = result; console.log(result)})
      .then(() => createPlayerPositionAssignment(client, {
        playerPositionAssignmentType,
        playerPositionId: playerPosition.id,
        substitutionId: substitution.id,
      }));
    } else {
      return Promise.resolve(null);
    }
  })
  .value()
]);
};

const positionSnapshotRepresentsBench = (positionSnapshot) => {
  // Currently the bench is represented by there not being a position
  return !positionSnapshot.event ||
    !positionSnapshot.event.position;
};

const substituteSelectedPlayers = (client, {
  selectionInfo,
  substitution,
  forceOut,
}) => {
  let playerPosition;

  return Promise.all(_.map(selectionInfo.selections, (positionSnapshotFrom, index) => {
    // If only one selection, then just sub player OUT
    const positionSnapshotTo = forceOut || selectionInfo.selections.length === 1
    ? {}
    : selectionInfo.selections[(index + 1) % selectionInfo.selections.length];
    let playerPositionAssignmentType;
    if (positionSnapshotRepresentsBench(positionSnapshotFrom)) {
      playerPositionAssignmentType = "IN";
    } else if (positionSnapshotRepresentsBench(positionSnapshotTo)) {
      playerPositionAssignmentType = "OUT";
    } else {
      playerPositionAssignmentType = "CHANGE";
    }
    const playerId = positionSnapshotFrom.playerId;
    const positionId = positionSnapshotTo &&
      positionSnapshotTo.event &&
      positionSnapshotTo.event.position &&
      positionSnapshotTo.event.position.id;
    return createPlayerPosition(client, {
      playerId,
      positionId,
    })
    .then(result => {playerPosition = result; console.log(result)})
    .then(() => createPlayerPositionAssignment(client, {
      playerPositionAssignmentType,
      playerPositionId: playerPosition.id,
      substitutionId: substitution.id,
    }));
  }));
};

const deleteSelectedPlayerPositionAssignments = (client, {
  selectionInfo,
  substitution,
}) => {
  return Promise.all(_.map(selectionInfo.selections, (positionSnapshot) => {
    const playerPositionAssignment =
    getPlayerPositionAssignmentRelatedToPositionSnapshot(
      substitution,
      positionSnapshot,
    );
    return deletePlayerPositionAssignment(client, {
      id: playerPositionAssignment.id,
    })
    .then(() => deletePlayerPosition(client, {
      id: playerPositionAssignment.playerPosition.id,
    }));
  }));
};

const substituteMaxPlayersFromBench = (client, {
  formationSubstitution,
  substitution,
  gameTeamSeason,
  totalSeconds,
  gameSeconds,
  timestamp,
}) => {
  const gameStats = getGameStats({
    gameTeamSeason,
    totalSeconds,
    gameSeconds,
    timestamp,
  });
  console.log(JSON.stringify(gameStats, {indent: true}));

  // Identify the players that are on the bench (either no stats yet or currently OUT)
  const subInCandidates = _.filter(gameTeamSeason.gamePlayers,
  (gamePlayer) => !gameStats.players[gamePlayer.player.id]
  || !gameStats.players[gamePlayer.player.id].lastEventType
  || gameStats.players[gamePlayer.player.id].lastEventType === "OUT");

  console.log(`subInCandidates: ${JSON.stringify(subInCandidates)}`);

  // If three on the bench then pick five candidates to sub out
  const subOutCandidates = _.chain(gameTeamSeason.gamePlayers)
  .filter((gamePlayer) => playerIsCurrentlyPlaying(gameStats, gamePlayer))
  .sortBy((gamePlayer) => -getSubOutScore(gameTeamSeason, gameStats,
    gameStats.players[gamePlayer.player.id], gameSeconds))
  .take(subInCandidates.length + 2)
  .value();

  console.log(`subOutCandidates: ${JSON.stringify(subOutCandidates)}`);

  let subOutCandidatesWithFilledStatus = subOutCandidates.map((subOutCandidate) => ({
    filled: false,
    subOutCandidate,
  }));

  let playerPosition;
  const getAvailableSubOutCandidate = (subInCandidate) => {
    const availableSubOutCandidateWithFilledStatus =
    _.chain(subOutCandidatesWithFilledStatus)
    .filter((subOutCandidateWithFilledStatus) => !subOutCandidateWithFilledStatus.filled)
    .sortBy((subOutCandidateWithFilledStatus) => getSubstitutionScore(
      gameTeamSeason, gameStats, subInCandidate,
      subOutCandidateWithFilledStatus.subOutCandidate,
      formationSubstitution.formation,
      gameSeconds
    ))
    .last()
    .value();

    if (!availableSubOutCandidateWithFilledStatus) {
      return null;
    }

    availableSubOutCandidateWithFilledStatus.filled = true;
    return availableSubOutCandidateWithFilledStatus.subOutCandidate;
  };

  return Promise.all(_.chain(subInCandidates)
  .shuffle()
  .map((subInCandidate) => {
    const subOutCandidate = getAvailableSubOutCandidate(subInCandidate);
    if (subOutCandidate) {
      return createPlayerPosition(client, {
        playerId:subInCandidate.player.id,
        positionId: gameStats.players[subOutCandidate.player.id].currentPositionId,
      })
      .then(result => {playerPosition = result; console.log(result)})
      .then(() => createPlayerPositionAssignment(client, {
        playerPositionAssignmentType: "IN",
        playerPositionId: playerPosition.id,
        substitutionId: substitution.id,
      }))
      .then(() => createPlayerPosition(client, {
        playerId:subOutCandidate.player.id,
        positionId: null,
      }))
      .then(result => {playerPosition = result; console.log(result)})
      .then(() => createPlayerPositionAssignment(client, {
        playerPositionAssignmentType: "OUT",
        playerPositionId: playerPosition.id,
        substitutionId: substitution.id,
      }));
    } else {
      return Promise.resolve(null);
    }
  })
  .value()
  );
};

export const createSubstitutionForSelections = (client, {
  selectionInfo,
  gameActivityType,
  gameActivityStatus,
  gameTeamSeason,
  timestamp,
  gameSeconds,
  totalSeconds,
  forceOut,
}) => {
  // ToDo: Get formation substitution based on the gameSeconds
  // const formationSubstitution =
  // gameTeamSeason.formationSubstitutions[gameTeamSeason.formationSubstitutions.length - 1];
  let substitution;

  return getOrCreateSubstitutionAtSpecificTime(client, {
    gameActivityType,
    gameActivityStatus,
    gameTeamSeason,
    timestamp,
    totalSeconds,
    gameSeconds,
  }).then(result => {substitution = result; console.log(result)})
  .then(() => substituteSelectedPlayers(client, {
    selectionInfo,
    substitution,
    forceOut,
  })).then(result => {console.log(result)})
  .then(() => console.log("createSubstitutionForSelections succeeded"))
  .catch((error) => console.log(`error: ${error}`));
};

// Delete the selected player/position assignments. If the substitution
// no longer has any player/position assignments then also delete the substitution.
export const deleteSelectedSubstitutions = (client, {
  selectionInfo,
  gameActivityType,
  gameTeamSeason,
  // timestamp,
  // totalSeconds,
  gameSeconds,
}) => {
  const substitution = getSubstitutionAtSpecificTime({
    gameActivityType,
    gameTeamSeason,
    // timestamp,
    // totalSeconds,
    gameSeconds,
  });
  const shouldDeleteSubstitution =
  selectionInfo &&
  selectionInfo.selections &&
  substitution &&
  substitution.playerPositionAssignments &&
  selectionInfo.selections.length === substitution.playerPositionAssignments.length;
  return deleteSelectedPlayerPositionAssignments(client, {
    selectionInfo,
    substitution,
  }).then(result => {console.log(result)})
  .then(() => deleteSubstitutionIfAppropriate(client, {
    shouldDeleteSubstitution,
    id: substitution.id,
  }))
  .then(() => console.log("deleteSelectedSubstitutions succeeded"))
  .catch((error) => console.log(`error: ${error}`));
};

// gameTeamSeason is expected to have the shape found in getGameTeamSeasonInfo
export const createNextMassSubstitution = (client, {
  gameActivityType,
  gameActivityStatus,
  gameTeamSeason,
  timestamp,
  gameSeconds,
  totalSeconds,
}) => {
  const formationSubstitution =
  gameTeamSeason.formationSubstitutions[gameTeamSeason.formationSubstitutions.length - 1];
  let substitution;

  return createSubstitution(client, {
    gameActivityType,
    gameActivityStatus,
    gameTeamSeason,
    timestamp,
    totalSeconds,
    gameSeconds,
  }).then(result => {substitution = result; console.log(result)})
  .then(() => substituteMaxPlayersFromBench(client, {
    formationSubstitution,
    substitution,
    gameTeamSeason,
    totalSeconds,
    gameSeconds,
    timestamp,
  })).then(result => {console.log(result)})
  .then(() => console.log("createNextMassSubstitution succeeded"))
  .catch((error) => console.log(`error: ${error}`));
};

// gameTeamSeason is expected to have the shape found in getGameTeamSeasonInfo
export const addToLineup = (client, {
  gameActivityType,
  gameActivityStatus,
  gameTeamSeason,
  gameSeconds,
  totalSeconds,
  positionSnapshotFrom,
  positionSnapshotTo,
  playerPositionAssignmentType,
}) => {
  let substitution;
  let playerPosition;

  return getOrCreateFormationSubstitution(client, {
    formationId: "cjqcfvx3167k30128b70ieu58",
    gameActivityType,
    gameActivityStatus,
    gameTeamSeason,
    totalSeconds,
    gameSeconds,
  }).then(result => {console.log(result)})
  .then(() => getOrCreateSubstitutionAtSpecificTime(client, {
    gameActivityType,
    gameActivityStatus,
    gameTeamSeason,
    totalSeconds,
    gameSeconds,
  })).then(result => {substitution = result; console.log(result)})
  .then(() => createPlayerPosition(client, {
    playerId: positionSnapshotFrom.playerId,
    positionId: positionSnapshotTo.event.position.id,
  }))
  .then(result => {playerPosition = result; console.log(result)})
  .then(() => createPlayerPositionAssignment(client, {
    playerPositionAssignmentType,
    playerPositionId: playerPosition.id,
    substitutionId: substitution.id,
  }))
  .then(result => {console.log(result)})
  .then(() => console.log("addToLineup succeeded"))
  .catch((error) => console.log(`error: ${error}`));
};

export const removeFromLineup = (client, {
  gameTeamSeason,
  selectionInfo,
  totalSeconds,
  gameSeconds,
  timestamp,
}) => {
  // For each selected player
  //   Either delete INITIAL player position assignment if currently exists
  //   or add substitution with only OUT player position assignment
  return deleteInitialPlayerPositionAssignments(client, {
    gameTeamSeason,
    selectionInfo,
    totalSeconds,
    gameSeconds,
    timestamp,
  })
  .then(() => {
    addOutPlayerPositionAssignments(client, {
      gameTeamSeason,
      selectionInfo,
      totalSeconds,
      gameSeconds,
      timestamp,
    });
  });
};

const isInitialLineupThatCanBeDeleted = (gameStats, selection, gameSeconds) => {
  return gameStats.players[selection.playerId]
  && gameStats.players[selection.playerId].lastEventType
  && gameStats.players[selection.playerId].lastEventType === "INITIAL"
  && gameStats.players[selection.playerId].lastEventGameSeconds === gameSeconds;
};

const addOutPlayerPositionAssignments = (client, {
  gameTeamSeason,
  selectionInfo,
  totalSeconds,
  gameSeconds,
  timestamp,
}) => {
  const gameStats = getGameStats({
    gameTeamSeason,
    totalSeconds,
    gameSeconds,
    timestamp,
  });

  const selectionInfoForAddingOutPlayerPositionAssignments = {
    ...selectionInfo,
    selections: _.filter(selectionInfo.selections, (selection) =>
      !isInitialLineupThatCanBeDeleted(gameStats, selection, gameSeconds)),
  };
  return createSubstitutionForSelections(client, {
    selectionInfo: selectionInfoForAddingOutPlayerPositionAssignments,
    gameActivityType: "OFFICIAL",
    gameActivityStatus: "COMPLETED",
    gameTeamSeason,
    timestamp,
    gameSeconds,
    totalSeconds,
    forceOut: true,
  });
};

const deleteInitialPlayerPositionAssignments = (client, {
  gameTeamSeason,
  selectionInfo,
  totalSeconds,
  gameSeconds,
  timestamp,
}) => {
  const gameStats = getGameStats({
    gameTeamSeason,
    totalSeconds,
    gameSeconds,
    timestamp,
  });

  const selections = _.filter(selectionInfo.selections, (selection) =>
    isInitialLineupThatCanBeDeleted(gameStats, selection, gameSeconds));
  if (selections.length === 0) {
    console.log(`No initial lineup that can be deleted`);
    return Promise.resolve();
  }

  const selectionInfoForDeleting = {
    ...selectionInfo,
    selections,
  };
  return deleteSelectedSubstitutions(client, {
    selectionInfo: selectionInfoForDeleting,
    gameActivityType: "PLAN",
    gameTeamSeason,
    // timestamp,
    // totalSeconds,
    gameSeconds,
  });
};

// gameTeamSeason is expected to have the shape found in getGameTeamSeasonInfo
export const createInitialLineup = (client, {
  gameActivityType,
  gameActivityStatus,
  gameTeamSeason
}) => {
  let formationSubstitution;
  let substitution;
  const gameSeconds = 0;
  const totalSeconds = gameSeconds;
  return getOrCreateFormationSubstitution(client, {
    formationId: "cjqcfvx3167k30128b70ieu58",
    gameActivityType,
    gameActivityStatus,
    gameTeamSeason,
    totalSeconds,
    gameSeconds,
  }).then(result => {formationSubstitution = result; console.log(result)})
  .then(() => getOrCreateInitialSubstitution(client, {
    gameActivityType,
    gameActivityStatus,
    gameTeamSeason,
    totalSeconds,
    gameSeconds,
  })).then(result => {substitution = result; console.log(result)})
  .then(() => getOrCreatePlayerPositionsAndPlayerPositionAssignments(client, {
    formationSubstitution,
    substitution,
    gameTeamSeason,
    playerPositionAssignmentType: "INITIAL"
  })).then(result => {console.log(result)})
  .then(() => console.log("createInitialLineup succeeded"))
  .catch((error) => console.log(`error: ${error}`));
};

export const getNextSubstitutionInfo = (gameTeamSeason) => {
  if (!gameTeamSeason) {
    return {
      gameSeconds: 0,
      totalSeconds: 0,
    };
  }
  const lastSubstitution = gameTeamSeason.substitutions[gameTeamSeason.substitutions.length - 1];
  const maxGameSeconds = lastSubstitution.gameSeconds + gameTeamSeason.gamePlan.secondsBetweenSubs;
  const {gameSeconds, totalSeconds} = gameTeamSeason.teamSeason.team.league.gameDefinition.gamePeriods.reduce(
    (totals, gamePeriod) => {
      let newTotals = {...totals};
      if (newTotals.gameSeconds + gamePeriod.durationSeconds < maxGameSeconds) {
        newTotals.gameSeconds += gamePeriod.durationSeconds;
        newTotals.totalSeconds += gamePeriod.durationSeconds;
        if (gamePeriod.postDurationSeconds) {
          newTotals.totalSeconds += gamePeriod.postDurationSeconds;
        }
      } else {
        const additionalSeconds = maxGameSeconds - newTotals.gameSeconds;
        newTotals.gameSeconds += additionalSeconds;
        newTotals.totalSeconds += additionalSeconds;
      }
      return newTotals;
    }, {
      gameSeconds: 0,
      totalSeconds: 0,
    }
  );
  return {
    gameSeconds,
    totalSeconds,
  }
};
