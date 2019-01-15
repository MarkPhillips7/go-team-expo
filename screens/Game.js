import React from 'react';
import { Query } from "react-apollo";
import gql from "graphql-tag";
import SoccerField from './SoccerField';
import { Text } from 'react-native';

const positionCategoriesQuery = gql`
query {
  allPositionCategories {
    id
    name
    color
    parkLocation
    pitchLocation
  }
}
`;

// TeamSeason "cjpt1epj50ijp0119511ogsg6"
// const gamePlayersQuery = gql`
// query GameTeamSeason($gameTeamSeasonId: ID!) {
//   GameTeamSeason(id: $gameTeamSeasonId) {
//     gamePlayers {
//       id
//       availability
//       player {
//         id
//         name
//         positionCategoryPreferencesAsPlayer {
//           positionCategory {
//             name
//             color
//           }
//         }
//       }
//     }
//   }
// }
// `;
const gamePlayersQuery = gql`
query AllGamePlayers($gameTeamSeasonId: ID!) {
  allGamePlayers(
    filter: {
      gameTeamSeason: {
        id: $gameTeamSeasonId
      }
    }
  ) {
    id
    availability
    player {
      id
      name
      positionCategoryPreferencesAsPlayer {
        positionCategory {
          name
          color
        }
      }
    }
  }
}
`;

// teamSeason {
//   id
//   name
//   players {
//     id
//     name
//     positionCategoryPreferencesAsPlayer {
//       positionCategory {
//         name
//         color
//       }
//     }
//   }
// }

const formationQuery = gql`
query {
  Formation(id: "cjqcfvx3167k30128b70ieu58") {
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
}`;

export default class Game extends React.Component {

  constructor(props) {
    super(props);
    // Don't call this.setState() here!
    this.state = {};

    // this.onPressNewGame = this.onPressNewGame.bind(this);
  }

  render() {
    console.log(`Game render`);
    const gameTeamSeasonId = this.props.navigation.getParam('gameTeamSeasonId');
    console.log(`gameTeamSeasonId: ${gameTeamSeasonId}`);
    return (
      <Query
        query={positionCategoriesQuery}
      >
        {({ loading: loading1, error: error1, data: positionCategoriesData }) => (
          <Query
            query={gamePlayersQuery}
            variables={{gameTeamSeasonId}}
          >
            {({ loading: loading2, error: error2, data: gamePlayersData }) => (
              <Query
                query={formationQuery}
              >
                {({ loading: loading3, error: error3, data: formationData }) => {
                  if (loading1 || loading2 || loading3) return <Text>Loading...</Text>;
                  if (error1 || error2 || error3) return <Text>Error</Text>;

                  console.log(gamePlayersData && JSON.stringify(gamePlayersData));
                  return (
                    <SoccerField
                      gameTeamSeasonId={gameTeamSeasonId}
                      positions={formationData && formationData.Formation && formationData.Formation.positions}
                      gamePlayers={gamePlayersData && gamePlayersData.allGamePlayers}
                      positionCategories={positionCategoriesData && positionCategoriesData.allPositionCategories}
                    />
                  );
                }}
              </Query>
            )}
          </Query>
        )}
      </Query>
    );
  }
};
