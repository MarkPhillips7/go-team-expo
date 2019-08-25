import React from 'react';
import { Query , withApollo} from 'react-apollo';
import SoccerField from './SoccerField';
import { Text } from 'react-native';
import {GAME_TEAM_SEASON_INFO} from '../graphql/game';

export default  withApollo(
class Game extends React.Component {
  constructor(props) {
    super(props);
    // Don't call this.setState() here!
    this.state = {};

    // this.onPressNewGame = this.onPressNewGame.bind(this);
  }

  render() {
    const gameTeamSeasonId = this.props.navigation.getParam('gameTeamSeasonId');
    return (
      <Query
        query={GAME_TEAM_SEASON_INFO}
        variables={{gameTeamSeasonId}}
        notifyOnNetworkStatusChange
      >
        {({ loading, error, data, refetch, networkStatus }) => {
          if (networkStatus === 4) return <Text>Refetching...</Text>;
          if (loading) return <Text>Loading...</Text>;
          if (error) { console.log(JSON.stringify(error)); return <Text>Error</Text>;}

          // console.log(`rendering game`);//data && JSON.stringify(data));
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
              onLineupChange={refetch}
              onSubsChange={refetch}
              navigation={this.props.navigation}
            />
          );
        }}
      </Query>
    );
  }
});
