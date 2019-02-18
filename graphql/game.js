import gql from "graphql-tag";
import _ from 'lodash';
import {
  playerAvailability,
} from '../constants/Soccer';
import {TEAM_SEASON} from '../graphql/games';

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
      team {
        league {
          gameDefinition {
            gamePeriods {
              durationSeconds
            }
            numberPlayersPerSide
          }
        }
      }
    }
    substitutions (
      filter: {
        gameActivityType: PLAN
      }
    ) {
      id
      timestamp
      totalSeconds
      gameSeconds
      playerPositionAssignments {
        timestamp
        playerPositionAssignmentType
        playerPosition {
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
            positionCategory {
              id
              name
              color
            }
          }
        }
      }
    }
    formationSubstitutions (
      filter: {
        gameActivityType: PLAN
      }
    ) {
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

export const createGameEtc = (client, {
  name,
  isHomeTeam,
  teamSeason,
  secondsBetweenSubs,
}) => {
  let game;
  let gameTeamSeason;

  createGame(client, {
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
  .then(() => console.log("createGameEtc succeeded"))
  .catch((error) => console.log(`error: ${error}`));
};
