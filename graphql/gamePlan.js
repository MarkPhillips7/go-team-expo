import gql from "graphql-tag";
import _ from 'lodash';
import {
  playerAvailability,
} from '../constants/Soccer';
import {GAME_TEAM_SEASON_INFO} from '../graphql/game';

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
  $totalSeconds: Int
  $gameSeconds:  Int
){
  createSubstitution (
    gameActivityType: $gameActivityType
    gameActivityStatus: $gameActivityStatus
    gameTeamSeasonId: $gameTeamSeasonId
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

const CREATE_PLAYER_POSITION = gql`
mutation CreatePlayerPosition (
  $playerId: ID!
  $positionId: ID!
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
  $playerPositionId: ID!
  $substitutionId: ID!
){
  createPlayerPositionAssignment(
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

const createPlayerPosition = (client, {
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

const createPlayerPositionAssignment = (client, {
  playerPositionAssignmentType,
  playerPositionId,
  substitutionId,
  // gameTeamSeasonId,
}) => {
  // console.log(`gameTeamSeasonId: ${gameTeamSeasonId}`);
  return client.mutate({
    mutation: CREATE_PLAYER_POSITION_ASSIGNMENT,
    variables: {
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

const getOrCreateFormationSubstitution = (client, {
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

const getOrCreateSubstitution = (client, {
  gameActivityStatus,
  gameActivityType,
  gameTeamSeason,
  totalSeconds,
  gameSeconds,
}) => {
  if (!gameTeamSeason.substitutions || gameTeamSeason.substitutions.length === 0) {
    const gameTeamSeasonId = gameTeamSeason.id;
    return client.mutate({
      mutation: CREATE_SUBSTITUTION,
      variables: {
        gameActivityType,
        gameActivityStatus,
        gameTeamSeasonId,
        totalSeconds,
        gameSeconds,
      }
    })
    .then((result) => result.data.createSubstitution);
  }
  return Promise.resolve(gameTeamSeason.substitutions[0]);
};

const getOrCreatePlayerPositionsAndPlayerPositionAssignments = (client, {
  formationSubstitution,
  substitution,
  gameActivityType,
  gameActivityStatus,
  gameTeamSeason,
  totalSeconds,
  gameSeconds,
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
    // positionWithFilledStatus.needInserts = false;
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
    // availablePositionWithFilledStatus.needInserts = true;
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
        // gameTeamSeasonId: gameTeamSeason.id,
      }));
    } else {
      return Promise.resolve(null);
    }
  })
  .value()
]);
};

// gameTeamSeason is expected to have the shape found in getGameTeamSeasonInfo
export const createInitialLineup = (client, {
  gameActivityType,
  gameActivityStatus,
  gameTeamSeason
}) => {
  // .then(result => console.log(result));
  let formationSubstitution;
  let substitution;

  return getOrCreateFormationSubstitution(client, {
    formationId: "cjqcfvx3167k30128b70ieu58",
    gameActivityType,
    gameActivityStatus,
    gameTeamSeason,
    totalSeconds: 0,
    gameSeconds: 0,
  }).then(result => {formationSubstitution = result; console.log(result)})
  .then(() => getOrCreateSubstitution(client, {
    gameActivityType,
    gameActivityStatus,
    gameTeamSeason,
    totalSeconds: 0,
    gameSeconds: 0,
  })).then(result => {substitution = result; console.log(result)})
  .then(() => getOrCreatePlayerPositionsAndPlayerPositionAssignments(client, {
    formationSubstitution,
    substitution,
    gameActivityType,
    gameActivityStatus,
    gameTeamSeason,
    totalSeconds: 0,
    gameSeconds: 0,
    playerPositionAssignmentType: "INITIAL"
  })).then(result => {console.log(result)})
  // .then(() => refetchGameTeamSeasonInfo(client, {
  //   gameTeamSeasonId: gameTeamSeason.id,
  // })).then(result => {console.log(result)})
  .then(() => console.log("createInitialLineup succeeded"))
  .catch((error) => console.log(`error: ${error}`));
};
