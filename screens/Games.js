import React from 'react';
import { Mutation, Query } from "react-apollo";
import { Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Game from './Game';
import {TEAM_SEASON} from '../graphql/games';
import {createGameEtc} from '../graphql/game';
import {withApollo} from 'react-apollo';

export default withApollo(
// export default
class Games extends React.Component {

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

  onPressNewGame(teamSeason) {
    const {client} = this.props;
    createGameEtc(client, {
      name: this.state.newGameName,
      teamSeason,
      secondsBetweenSubs: 500,
    });
  }

  render() {
    return (
      <Query
        query={TEAM_SEASON}
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
                  <TextInput
                    style={{height: 40, borderColor: 'gray', borderWidth: 1}}
                    onChangeText={(newGameName) => this.setState({newGameName})}
                    value={this.state.newGameName}
                  />
                  <Button
                    onPress={() => this.onPressNewGame(teamSeasonData.TeamSeason)}
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
});

let styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
