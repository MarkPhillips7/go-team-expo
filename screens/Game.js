import React from 'react';
import { Query } from "react-apollo";
import gql from "graphql-tag";
import SoccerField from './SoccerField';
import { Text } from 'react-native';

const query = gql`
query AllGamePlayers($gameTeamSeasonId: ID!) {
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
  },
  allPositionCategories {
    id
    name
    color
    parkLocation
    pitchLocation
  },
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
              gameTeamSeasonId={gameTeamSeasonId}
              positions={data && data.Formation && data.Formation.positions}
              gamePlayers={data && data.allGamePlayers}
              positionCategories={data && data.allPositionCategories}
            />
          );
        }}
      </Query>
    );
  }
};
