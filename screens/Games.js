import React from 'react';
import { Query } from "react-apollo";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Icon } from 'react-native-elements';
import {TEAM_SEASON} from '../graphql/games';
import {createGameEtc} from '../graphql/game';
import {withApollo} from 'react-apollo';
import moment from 'moment';

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
      name: "New Game",
      teamSeason,
      secondsBetweenSubs: 500,
    })
    .then((gameTeamSeason) => {
      this.props.navigation.navigate('Game', { gameTeamSeasonId: gameTeamSeason.id });
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
                  <Text style={{ padding: 12, color: "black", fontSize: 17, fontWeight: "bold" }}>
                    {teamSeasonData.TeamSeason.name}
                  </Text>
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
                        <View style={styles.gameItem}>
                          <View style={styles.gameDateTime}>
                            {item.game.scheduledStartTime && (
                              <Text style={styles.gameDate}>
                                {moment(item.game.scheduledStartTime).format("M/D")}
                              </Text>
                            )}
                            {item.game.scheduledStartTime && (
                              <Text style={styles.gameTime}>
                                {moment(item.game.scheduledStartTime).format("LT")}
                              </Text>
                            )}
                          </View>
                          <View style={styles.gameName}>
                            <Text style={styles.gameNameText}>
                              {item.game.name}
                            </Text>
                          </View>
                          <View style={styles.gameLocation}>
                            {item.game.location && (
                              <Text style={styles.gameLocationText}>
                                {item.game.location}
                              </Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                  <Button
                    type="clear"
                    onPress={() => this.onPressNewGame(teamSeasonData.TeamSeason)}
                    icon={
                      <Icon
                        name="add-circle"
                        size={35}
                        color="blue"
                      />
                    }
                    iconRight={true}
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
  gameItem: {
    margin: 10,
    // marginRight: 18,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: "95%",
  },
  gameDateTime: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: "20%",
  },
  gameDate: {
    color: "black",
    // fontWeight: "bold"
  },
  gameTime: {
    color: "green",
    fontWeight: "bold",
    fontSize: 12
  },
  gameName: {
    width: "45%",
  },
  gameNameText: {
    color: "black",
    fontSize: 15
  },
  gameLocation: {
    width: "35%",
  },
  gameLocationText: {
    color: "green",
    fontSize: 12
  },
});
