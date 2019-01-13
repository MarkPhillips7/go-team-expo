import React from 'react';
import { Mutation, Query } from "react-apollo";
import gql from "graphql-tag";
import { Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Game from './Game';

const teamSeasonQuery = gql`
query {
  TeamSeason(id: "cjpt1epj50ijp0119511ogsg6") {
    id
    name
    gameTeamSeasons {
      id
      game {
        scheduledStartTime
        name
      }
      name
    }
  }
}
`;

const createGameMutation = gql`
mutation CreateGame($name: String!){
  createGame(
    name: $name
    gameStatus: SCHEDULED
    location: "Meriwether Lewis Elementary School"
    scheduledStartTime: "2018-11-22T15:00:00.000Z"
  ) {
    id
    name
    gameStatus
    scheduledStartTime
  }
}
`;

export default class Games extends React.Component {

  constructor(props) {
    super(props);
    // Don't call this.setState() here!
    this.state = {};

    // this.onPressManageRoster = this.onPressManageRoster.bind(this);
    this.onPressNewGame = this.onPressNewGame.bind(this);
  }

  // onPressManageRoster() {
  //   this.setState((previousState) => {
  //     return {
  //       ...previousState,
  //       mode: previousState.mode === modes.roster ? modes.default : modes.roster,
  //     };
  //   });
  // }

  onPressNewGame(){
    console.log("hello");
  }

  render() {
    return (
      <Query
        query={teamSeasonQuery}
      >
        {({ loading: loading1, error: error1, data: teamSeasonData }) => {
          if (loading1) return <Text>Loading...</Text>;
          if (error1) return <Text>Error</Text>;

          // console.log(positionCategoriesData && JSON.stringify(positionCategoriesData));
          return (
            <View style={styles.screen}>
              {teamSeasonData && teamSeasonData.TeamSeason &&
                <View>
                  <FlatList
                    data={teamSeasonData.TeamSeason.gameTeamSeasons}
                    keyExtractor={(item) => item.id}
                    renderItem={({item}) => (
                      <TouchableOpacity
                        onPress={() => {
                          console.log(`Navigating to game ${item.id}, ${typeof this.props.navigation.navigate}`);
                          this.props.navigation.navigate('Game', { gameTeamSeasonId: item.id });
                        }}
                      >
                        <View>
                          <Text style={{ color: "blue" }}>
                            {item.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                  <Button
                    onPress={this.onPressNewGame}
                    title="New Game"
                    accessibilityLabel="Create new game"
                  />
                </View>
              }
            </View>
          );
        }}
      </Query>
    );
  }
};

let styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
