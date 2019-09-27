import React from 'react'
import {PropTypes} from 'prop-types';
import {
  FlatList,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  playerAvailability,
} from '../constants/Soccer';
import { Mutation } from "react-apollo";
import {updateGamePlayerMutation} from '../graphql/game';

export default class Roster extends React.Component {
  static propTypes = {
    gameRoster: PropTypes.array,
  };
  // constructor(props) {
  //   super(props);
  //   // Don't call this.setState() here!
  //   this.state = {};
  //
  //   this.onPlayerAvailableChange = this.onPlayerAvailableChange.bind(this);
  // }
  //
  // onPlayerAvailableChange(rosterPlayer, playerIsAvailable) {
  //   // console.log(JSON.stringify(rosterPlayer));
  //   // this.setState((previousState) => {
  //   //   const gameRoster = [...previousState.gameRoster];
  //   //   const gamePlayer = _.find(gameRoster, (_gamePlayer) => rosterPlayer.player.name === _gamePlayer.player.name);
  //   //   console.log('gamePlayer: ' + JSON.stringify(gamePlayer));
  //   //   gamePlayer.availability = playerIsAvailable ? playerAvailability.active : playerAvailability.unavailable;
  //   //   const newState = {
  //   //     ...previousState,
  //   //     gameRoster,
  //   //     gamePositions: this.getGamePositions(gameRoster),
  //   //   };
  //   //   newState.gamePlan = this.getGamePlan(newState);
  //   //   return newState;
  //   // });
  // }

  render() {
    return (
      <View style={styles.roster}>
        <Text>Available Roster</Text>
        <FlatList
          data={this.props.gameRoster}
          renderItem={({item}) => {
            // console.log(JSON.stringify(player));
            const {id} = item;
            // console.log(`Rendering Roster`);
            return (
              <Mutation
                mutation={updateGamePlayerMutation}
                key={id}
              >
                {(updateGamePlayer) => (
                  <View style={styles.playerAvailability}>
                    <Switch
                      style={styles.switch}
                      value={item.availability !== playerAvailability.unavailable}
                      onValueChange={(playerIsAvailable) => {
                        console.log(`hello ${playerIsAvailable}`);
                        const availability = playerIsAvailable ? playerAvailability.active : playerAvailability.unavailable;
                        updateGamePlayer({ variables: { id, availability } });
                        item.availability = availability;
                        // this.onPlayerAvailableChange(item, playerIsAvailable);
                      }}
                    />
                    <Text>{item.player.name}</Text>
                  </View>
                )}
              </Mutation>
            );
          }}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>
    );
  }
}

let styles = StyleSheet.create({
  playerAvailability: {
    alignItems: 'center',
    flexDirection: 'row',
    margin: 10,
  },
  roster: {
    flex: 1,
    paddingTop: 0,
  },
  switch: {
    marginRight: 10,
  },
});
