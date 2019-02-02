import React from 'react';
import { Query } from "react-apollo";
import gql from "graphql-tag";
import SoccerField from './SoccerField';
import { Text } from 'react-native';

// getGameState @client {
//   clockMultiplier
//   mode
// },

const query = gql`
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

export default class Game extends React.Component {

  constructor(props) {
    super(props);
    // Don't call this.setState() here!
    this.state = {};

    // this.onPressNewGame = this.onPressNewGame.bind(this);
  }

  render() {
    // console.log(`Game render`);
    const gameTeamSeasonId = this.props.navigation.getParam('gameTeamSeasonId');
    console.log(`gameTeamSeasonId: ${gameTeamSeasonId}`);
    return (
      <Query
        query={query}
        variables={{gameTeamSeasonId}}
      >
        {({ loading, error, data }) => {
          if (loading) return <Text>Loading...</Text>;
          if (error) return <Text>Error</Text>;

          console.log(data && JSON.stringify(data));
          return (
            <SoccerField
              gameDefinition={data && data.GameTeamSeason && data.GameTeamSeason.teamSeason &&
                data.GameTeamSeason.teamSeason && data.GameTeamSeason.teamSeason.team &&
                data.GameTeamSeason.teamSeason.team.league && data.GameTeamSeason.teamSeason.team.league.gameDefinition}
              gameTeamSeasonId={gameTeamSeasonId}
              gameState={{clockMultiplier: 5.0}}
              gamePlan={data && data.GameTeamSeason && data.GameTeamSeason.gamePlan}
              gameTeamSeason={data && data.GameTeamSeason}
              gamePlayers={data && data.GameTeamSeason && data.GameTeamSeason.gamePlayers}
              positionCategories={data && data.allPositionCategories}
            />
          );
        }}
      </Query>
    );
  }
};
