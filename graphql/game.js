import gql from "graphql-tag";
import _ from 'lodash';
import {
  playerAvailability,
} from '../constants/Soccer';
import {
  getPlayerPositionAssignmentRelatedToPositionSnapshot,
} from '../helpers/game';
import {
  createPlayerPosition,
  createPlayerPositionAssignment,
  createSubstitution,
  // getOrCreateFormationSubstitution,
  updateSubstitution,
  updatePlayerPositionAssignment,
} from './gamePlan';
import {TEAM_SEASON} from '../graphql/games';

export const updateGamePlayerMutation = gql`
mutation UpdateGamePlayer($id: ID!,$availability: Availability!){
  updateGamePlayer(
    id: $id
    availability: $availability
  ) {
    id
    availability
  }
}
`;

export const GAME_TEAM_SEASON_INFO = gql`
query getGameTeamSeasonInfo($gameTeamSeasonId: ID!) {
  allPositionCategories {
    id
    name
    color
    parkLocation
    pitchLocation
  },
  GameTeamSeason(id: $gameTeamSeasonId) {
    id
    teamSeason {
      id
      team {
        league {
          gameDefinition {
            gamePeriods {
              id
              name
              durationSeconds
            }
            numberPlayersPerSide
          }
        }
      }
    }
    lineupSubstitutions (orderBy: gameSeconds_ASC) {
      id
      gameActivityStatus
      gameActivityType
      gameSeconds
      lineup {
        id
        name
        formation {
          id
          name
        }
        playerPositions {
          id
          player {
            id
            name
          }
          position {
            id
            name
          }
        }
      }
    }
    substitutions (orderBy: gameSeconds_ASC) {
      id
      timestamp
      totalSeconds
      gameSeconds
      gameActivityStatus
      gameActivityType
      playerPositionAssignments {
        id
        timestamp
        gameActivityStatus
        playerPositionAssignmentType
        playerPosition {
          id
          player {
            id
            name
            positionCategoryPreferencesAsPlayer {
              positionCategory {
                id
                name
                color
              }
            }
          }
          position {
            id
            name
            leftToRightPercent
            positionCategory {
              id
              name
              color
            }
          }
        }
      }
    }
    formationSubstitutions {
      gameActivityType
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
      },
    }
    game {
      id
      gameActivities {
        gameActivityStatus
        timestamp
        totalSeconds
        gameSeconds
        gamePeriod {
          id
        }
      }
      gameStatus
      name
      location
      scheduledStartTime
    }
    gamePlan {
      id
      secondsBetweenSubs
    }
    gamePlayers {
      id
      availability
      player {
        id
        name
        positionCategoryPreferencesAsPlayer {
          positionCategory {
            id
            name
            color
          }
        }
      }
    }
  }
}
`;

const DELETE_GAME_TEAM_SEASON = gql`
mutation DeleteGameTeamSeason(
  $id: ID!
){
  deleteGameTeamSeason(
    id: $id
  ) {
    id
  }
}
`;

const DELETE_GAME_PLAYER = gql`
mutation DeleteGamePlayer(
  $id: ID!
){
  deleteGamePlayer(
    id: $id
  ) {
    id
  }
}
`;

const CREATE_GAME = gql`
mutation CreateGame(
  $name: String!
){
  createGame(
    name: $name
    gameStatus: SCHEDULED
    location: "Meriwether Lewis Elementary School"
    scheduledStartTime: "2019-02-22T15:00:00.000Z"
  ) {
    id
    name
    gameStatus
    scheduledStartTime
  }
}
`;

const CREATE_GAME_TEAM_SEASON = gql`
mutation CreateGameTeamSeason (
  $name: String!
  $isHomeTeam: Boolean
  $teamSeasonId: ID!
  $gameId: ID!
  $secondsBetweenSubs: Int
){
  createGameTeamSeason(
    name: $name
    isHomeTeam: $isHomeTeam
    teamSeasonId: $teamSeasonId
    gameId: $gameId
    gamePlan: {
      secondsBetweenSubs: $secondsBetweenSubs
    },
  ) {
    id
    gamePlan {
      id
    }
  }
}
`;

const CREATE_GAME_PLAYER = gql`
mutation CreateGamePlayer (
  $gameTeamSeasonId: ID!
  $playerId: ID!
  $availability: Availability!
){
  createGamePlayer(
    gameTeamSeasonId: $gameTeamSeasonId
    playerId: $playerId
    availability: $availability
  ) {
    id
  }
}
`;

export const UPDATE_GAME = gql`
mutation UpdateGame(
  $id: ID!
  $name: String!
  $gameStatus: GameStatus!
  $location: String
  $scheduledStartTime: DateTime
){
  updateGame(
    id: $id
    name: $name
    gameStatus: $gameStatus
    location: $location
    scheduledStartTime: $scheduledStartTime
  ) {
    id
    name
    gameStatus
    location
    scheduledStartTime
  }
}
`;

const CREATE_GAME_ACTIVITY = gql`
mutation CreateGameActivity(
  $gameId: ID!
  $gamePeriodId: ID!
  $timestamp: DateTime!
  $gameActivityStatus: GameActivityStatus!
  $gameActivityType: GameActivityType!
  $gameSeconds: Int
  $totalSeconds: Int
){
  createGameActivity (
    gameActivityStatus: $gameActivityStatus
    gameActivityType: $gameActivityType
    gameSeconds: $gameSeconds
    timestamp: $timestamp
    totalSeconds: $totalSeconds
    gameId: $gameId
    gamePeriodId: $gamePeriodId
  ) {
    id
  }
}
`;

const deleteGameTeamSeason = (client, {
  id,
}) => {
  return client.mutate({
    mutation: DELETE_GAME_TEAM_SEASON,
    variables: {
      id,
    },
    refetchQueries: [{query: TEAM_SEASON}],
  })
  .then((result) => result.data.deleteGameTeamSeason);
};

const deleteGamePlayer = (client, {
  id,
}) => {
  return client.mutate({
    mutation: DELETE_GAME_PLAYER,
    variables: {
      id,
    },
  })
  .then((result) => result.data.deleteGamePlayer);
};

const createGameActivity = (client, {
  gameTeamSeasonId,
  gameId,
  gamePeriodId,
  timestamp,
  gameActivityStatus,
  gameActivityType,
  gameSeconds,
  totalSeconds,
}) => {
  return client.mutate({
    mutation: CREATE_GAME_ACTIVITY,
    variables: {
      gameId,
      gamePeriodId,
      timestamp,
      gameActivityStatus,
      gameActivityType,
      gameSeconds,
      totalSeconds,
    },
    refetchQueries: [{
      query: GAME_TEAM_SEASON_INFO,
      variables:{gameTeamSeasonId}
    }],
  }).then((result) => result.data.createGameActivity);
};

const updateGameIfAppropriate = (client, {
  gameBeforeUpdate,
  gameAfterUpdate,
}) => {
  if (_.isEqual(gameBeforeUpdate, gameAfterUpdate)) {
    return Promise.resolve(gameAfterUpdate);
  }
  return client.mutate({
    mutation: UPDATE_GAME,
    variables: gameAfterUpdate
  })
};

const copyPlayerAssignments = (client, {
  sourcePlayerPositionAssignments,
  destinationSubstitution,
  markSourcePlayerPositionAssignmentsCompleted,
}) => {
  let playerPosition;
  return Promise.all(_.map(sourcePlayerPositionAssignments,
    (playerPositionAssignment) => {
      return createPlayerPosition(client, {
        playerId: playerPositionAssignment.playerPosition.player.id,
        positionId: playerPositionAssignment.playerPosition.position &&
          playerPositionAssignment.playerPosition.position.id,
      })
      .then(result => {playerPosition = result; console.log(result)})
      .then(() => createPlayerPositionAssignment(client, {
        playerPositionAssignmentType: playerPositionAssignment.playerPositionAssignmentType,
        playerPositionId: playerPosition.id,
        substitutionId: destinationSubstitution.id,
      }))
      .then(() => {
        if (markSourcePlayerPositionAssignmentsCompleted) {
          return updatePlayerPositionAssignment(client, {
            ...playerPositionAssignment,
            gameActivityStatus: "COMPLETED",
          });
        }
      });
    }));
};

export const makePlannedSubstitutionOfficial = (client, {
  selectionInfo,
  gameTeamSeason,
  timestamp,
  gameSeconds,
  totalSeconds,
  plannedSubstitution,
}) => {
  let substitution;
  if (!plannedSubstitution) {
    console.log(`no plannedSubstitution in makePlannedSubstitutionOfficial???`);
    return Promise.resolve();
  }

  const plannedPlayerPositionAssignments =
  _.filter(plannedSubstitution.playerPositionAssignments,
    (playerPositionAssignment) => playerPositionAssignment.gameActivityStatus !== "COMPLETED");
  const selectedPlayerPositionAssignments = selectionInfo &&
  _.map(selectionInfo.selections, (positionSnapshot) =>
  getPlayerPositionAssignmentRelatedToPositionSnapshot(
    plannedSubstitution,
    positionSnapshot,
  ));
  const sourcePlayerPositionAssignments = selectionInfo
  ? selectedPlayerPositionAssignments
  : plannedPlayerPositionAssignments;

  const allPlayerPositionAssignmentsIncluded = !selectionInfo ||
  (selectionInfo.selections &&
    selectionInfo.selections.length === plannedPlayerPositionAssignments.length);

  const markSourcePlayerPositionAssignmentsCompleted =
  !allPlayerPositionAssignmentsIncluded;

  console.log(`sourcePlayerPositionAssignments, markSourcePlayerPositionAssignmentsCompleted)`, sourcePlayerPositionAssignments, markSourcePlayerPositionAssignmentsCompleted);

  // update planned substitution to COMPLETED if all player position assignments included
  return (allPlayerPositionAssignmentsIncluded
  ? updateSubstitution(client, {
    id: plannedSubstitution.id,
    gameActivityStatus: "COMPLETED",
  })
  : Promise.resolve())
  // create official substitution
  .then(() => createSubstitution(client, {
    gameActivityType: "OFFICIAL",
    gameActivityStatus: "COMPLETED",
    gameTeamSeason,
    timestamp,
    totalSeconds,
    gameSeconds,
  })).then(result => {substitution = result; console.log(result)})
  .then(() => copyPlayerAssignments(client, {
    sourcePlayerPositionAssignments,
    destinationSubstitution: substitution,
    markSourcePlayerPositionAssignmentsCompleted
  })).then(result => {console.log(result)});
};

export const startPeriod = (client, {
  gameTeamSeasonId,
  game,
  gamePeriodId,
  timestamp,
  gameSeconds,
  totalSeconds,
}) => {
  return createGameActivity(client, {
    gameTeamSeasonId,
    gameId: game.id,
    gamePeriodId,
    timestamp,
    gameActivityStatus: "IN_PROGRESS",
    gameActivityType: "OFFICIAL",
    gameSeconds,
    totalSeconds,
  })
  .then(() => console.log("startPeriod succeeded"))
  .catch((error) => console.log(`error: ${error}`));
};

export const startGame = (client, {
  gameTeamSeason,
  gameTeamSeasonId,
  game,
  gamePeriodId,
  timestamp,
  gameSeconds,
  totalSeconds,
  plannedSubstitution,
}) => {
  const gameStatus = "IN_PROGRESS";
  return updateGameIfAppropriate(client, {
    gameBeforeUpdate: game,
    gameAfterUpdate: {
      ...game,
      gameStatus,
    },
  }).then(result => {console.log(result)})
  .then(() => createGameActivity(client, {
    gameTeamSeasonId,
    gameId: game.id,
    gamePeriodId,
    timestamp,
    gameActivityStatus: "IN_PROGRESS",
    gameActivityType: "OFFICIAL",
    gameSeconds,
    totalSeconds,
  }))
  .then(() => makePlannedSubstitutionOfficial(client, {
    gameTeamSeason,
    timestamp,
    gameSeconds,
    totalSeconds,
    plannedSubstitution,
  }))
  .then(() => console.log("startGame succeeded"))
  .catch((error) => console.log(`error: ${error}`));
};

export const stopGame = (client, {
  gameTeamSeasonId,
  game,
  gamePeriodId,
  timestamp,
  gameSeconds,
  totalSeconds,
  nextGamePeriod,
}) => {
  const gameStatus = nextGamePeriod
  ? "IN_PROGRESS"
  : "COMPLETED";
  return updateGameIfAppropriate(client, {
    gameBeforeUpdate: game,
    gameAfterUpdate: {
      ...game,
      gameStatus,
    },
  }).then(result => {console.log(result)})
  .then(() => createGameActivity(client, {
    gameTeamSeasonId,
    gameId: game.id,
    gamePeriodId,
    timestamp,
    gameActivityStatus: "STOPPED",
    gameActivityType: "OFFICIAL",
    gameSeconds,
    totalSeconds,
  }))
  .then(() => console.log("stopGame succeeded"))
  .catch((error) => console.log(`error: ${error}`));
};

const createGamePlayer = (client, {
  gameTeamSeasonId,
  playerId,
  availability,
}) => {
  return client.mutate({
    mutation: CREATE_GAME_PLAYER,
    variables: {
      gameTeamSeasonId,
      playerId,
      availability,
    }
  })
  .then((result) => result.data.createGamePlayer);
};

const createGameTeamSeason = (client, {
  name,
  isHomeTeam,
  teamSeasonId,
  gameId,
  secondsBetweenSubs,
}) => {
  return client.mutate({
    mutation: CREATE_GAME_TEAM_SEASON,
    variables: {
      name,
      isHomeTeam,
      teamSeasonId,
      gameId,
      secondsBetweenSubs,
    },
    refetchQueries: [{query: TEAM_SEASON}],
  })
  .then((result) => result.data.createGameTeamSeason);
};

const createGame = (client, {
  name,
}) => {
  return client.mutate({
    mutation: CREATE_GAME,
    variables: {
      name,
    }
  })
  .then((result) => result.data.createGame);
};

const createGamePlayers = (client, {
  gameTeamSeason,
  teamSeason,
}) => {
  return Promise.all(
    _.map(teamSeason.players,
      (player) => createGamePlayer(client, {
        gameTeamSeasonId: gameTeamSeason.id,
        playerId: player.id,
        availability: playerAvailability.active,
      })
    )
  );
};

const deleteGamePlayers = (client, {
  gameTeamSeason,
}) => {
  return Promise.all(
    _.map(gameTeamSeason.gamePlayers,
      (gamePlayer) => deleteGamePlayer(client, {
        id: gamePlayer.id,
      })
    )
  );
};

export const createGameEtc = (client, {
  name,
  isHomeTeam,
  teamSeason,
  secondsBetweenSubs,
}) => {
  let game;
  let gameTeamSeason;

  return createGame(client, {
    name
  }).then(result => {game = result; console.log(result)})
  .then(() => createGameTeamSeason(client, {
    name,
    isHomeTeam,
    teamSeasonId: teamSeason.id,
    gameId: game.id,
    secondsBetweenSubs,
  })).then(result => {gameTeamSeason = result; console.log(result)})
  .then(() => createGamePlayers(client, {
    gameTeamSeason,
    teamSeason,
  })).then(result => {console.log(result)})
  // .then(() => getOrCreateFormationSubstitution(client, {
  //   formationId: "cjqcfvx3167k30128b70ieu58",
  //   gameActivityType: "PLAN",
  //   gameActivityStatus: "PENDING",
  //   gameTeamSeason,
  //   totalSeconds: 0,
  //   gameSeconds: 0,
  // }))
  .then(() => console.log("createGameEtc succeeded"))
  .then(() => gameTeamSeason)
  .catch((error) => console.log(`error: ${error}`));
};

export const deleteGameEtc = (client, {
  gameTeamSeason,
}) => {
  // ToDo: delete formation substitutions and substitutions!!!
  return deleteGamePlayers(client, {
    gameTeamSeason,
  })
  .then(() => deleteGameTeamSeason(client, {
    id: gameTeamSeason.id
  })).then(result => {console.log(result)})
  .catch((error) => console.log(`error: ${error}`));
};
