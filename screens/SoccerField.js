import React from 'react';
import { Button, FlatList, ScrollView, Slider, StyleSheet, Switch, Text, View } from 'react-native';
import FormationLine from '../components/FormationLine';
import Player from '../components/Player';
import moment from 'moment';
import _ from 'lodash';
import {
  // gameRoster as theGameRoster,
  playerAvailability,
  specialPositions,
  // positionCategories,
} from '../constants/Soccer';

export default class SoccerField extends React.Component {
  static navigationOptions = {
    title: 'Game',
  }

  constructor(props) {
    super(props);
    // Don't call this.setState() here!
    this.state = this.getInitialState();

    this.onPressSubstituteNow = this.onPressSubstituteNow.bind(this);
    this.onPressDebug = this.onPressDebug.bind(this);
    this.onPressManageRoster = this.onPressManageRoster.bind(this);
    this.onPlayerAvailableChange = this.onPlayerAvailableChange.bind(this);
    this.onPressStartPauseResume = this.onPressStartPauseResume.bind(this);
    this.onPressReset = this.onPressReset.bind(this);
    this.updateGame = this.updateGame.bind(this);
  }

  getInitialState() {
    const state = {
      assignmentsIndex: 0,
      clockMultiplier: 1.0,
      currentGameTime: undefined,
      gameDurationSeconds: 50.0*60,
      gameStartTime: undefined,
      gamePlan: undefined,
      gameRoster: this.props.players || [],
      gamePositions: this.getGamePositions(this.props.players || []),
      // assignmentsHistory: [],
      isClockRunning: false,
      isGameOver: false,
      mode: modes.default,
    };
    state.gamePlan = this.getGamePlan(state);
    return state;
  }

  getGamePositions(gameRoster) {
    let positionIndex = 0;
    return gameRoster.map((player) => {
      if (player.availability === playerAvailability.unavailable) {
        return specialPositions.unavailable;
      }

      if (this.props.positions && this.props.positions.length > positionIndex) {
        return this.props.positions[positionIndex++];
      }
      return specialPositions.substitute;
      // switch (positionIndex++) {
      //   case 0:
      //     return specialPositions.keeper;
      //   case 1:
      //     return specialPositions.leftBack;
      //   case 2:
      //     return specialPositions.rightBack;
      //   case 3:
      //     return specialPositions.leftMid;
      //   case 4:
      //     return specialPositions.rightMid;
      //   case 5:
      //     return specialPositions.leftForward;
      //   case 6:
      //     return specialPositions.rightForward;
      //   default:
      //     return specialPositions.substitute;
      // }
    });
  }

  getAssignments({gamePositions, gameRoster}) {
    let positions = gamePositions.map((gamePosition) => ({
      filled: false,
      gamePosition: gamePosition,
    }));
    const getAvailablePosition = (player) => {
      const availablePosition = _.find(positions,
        (position) => !position.filled &&
        ((player.availability === playerAvailability.unavailable &&
          position.gamePosition.name === specialPositions.unavailable.name) ||
        (player.availability !== playerAvailability.unavailable &&
          position.gamePosition.name !== specialPositions.unavailable.name))
      );
      if (!availablePosition) {
        return specialPositions.unavailable;
      }

      availablePosition.filled = true;
      return availablePosition.gamePosition;
    };
    return {
      assignments: _.chain(gameRoster)
        .shuffle()
        .map((player) => {
          const position = getAvailablePosition(player);
          return {
            player,
            position,
          };
        })
        .value(),
      startTime: undefined,
      endTime: undefined
    };
  }

  getGamePlan(state) {
    const secondsBetweenSubs = state.gameDurationSeconds / numberOfLineups;
    const assignmentsList = [];
    for (var i = 0; i < numberOfLineups; i++) {
      assignmentsList.push(this.getAssignments(state));
    }
    return {
      numberOfLineups,
      secondsBetweenSubs,
      assignmentsList,
    };
  }

  onPressSubstituteNow() {
  }

  onPressManageRoster() {
    this.setState((previousState) => {
      return {
        ...previousState,
        mode: previousState.mode === modes.roster ? modes.default : modes.roster,
      };
    });
  }

  onPressReset() {
    this.setState(() => {
      return this.getInitialState();
    });
  }

  onPlayerAvailableChange(rosterPlayer, playerIsAvailable) {
    console.log(JSON.stringify(rosterPlayer));
    this.setState((previousState) => {
      const gameRoster = [...previousState.gameRoster];
      const player = _.find(gameRoster, (_player) => rosterPlayer.name === _player.name);
      console.log('player: ' + JSON.stringify(player));
      player.availability = playerIsAvailable ? playerAvailability.active : playerAvailability.unavailable;
      const newState = {
        ...previousState,
        gameRoster,
        gamePositions: this.getGamePositions(gameRoster),
      };
      newState.gamePlan = this.getGamePlan(newState);
      return newState;
    });
  }

  onPressDebug() {
    this.setState((previousState) => {
      return {
        ...previousState,
        mode: previousState.mode === modes.debug ? modes.default : modes.debug,
      };
    })
  }

  onPressStartPauseResume() {
    this.setState((previousState) => {
      if (previousState.isClockRunning) {
        return {
          ...previousState,
          isClockRunning: false,
        };
      }

      setTimeout(this.updateGame, 200);

      const gameStartTime = previousState.gameStartTime || new Date();
      const gamePlan = previousState.gamePlan;
      const assignmentsIndex = 0;
      gamePlan.assignmentsList[assignmentsIndex].startTime = gameStartTime;
      return {
        ...previousState,
        gameStartTime,
        gamePlan,
        assignmentsIndex,
        isClockRunning: true,
        isGameOver: false,
      };
    });
  }

  updateGame() {
    this.setState((previousState) => {
      if (!this.state.isClockRunning) {
        return;
      }

      const now = moment();
      // const demoTimeMultiplier = previousState.gameDurationSeconds / totalDemoSeconds;
      const actualMillisecondsSinceGameStart = now.diff(previousState.gameStartTime);
      const currentGameTime = moment(previousState.gameStartTime).add(
        actualMillisecondsSinceGameStart*previousState.clockMultiplier, "milliseconds").toDate();
      const gamePlan = previousState.gamePlan && {
        ...previousState.gamePlan,
      };
      const assignmentsList = gamePlan && gamePlan.assignmentsList;
      let assignmentsIndex = previousState.assignmentsIndex;
      let isGameOver = previousState.isGameOver;
      const currentAssignments = assignmentsList[assignmentsIndex];

      // check whether current game position assignments have expired and should be substituted
      if (currentAssignments
        && currentAssignments.startTime
        && moment(currentGameTime).diff(currentAssignments.startTime, 'seconds')
        > previousState.gamePlan.secondsBetweenSubs) {
        console.log("substitution time");
        currentAssignments.endTime = currentGameTime;
        if (assignmentsIndex + 1 >= numberOfLineups) {
          isGameOver = true;
        } else {
          assignmentsIndex += 1;
          assignmentsList[assignmentsIndex].startTime = currentGameTime;
        }
      }

      if (!isGameOver) {
        setTimeout(this.updateGame, 200);
      }

      return {
        ...previousState,
        currentGameTime,
        gamePlan,
        assignmentsIndex,
        isGameOver,
      };
    });
  }

  render() {
    return (
      <View style={styles.screen}>
        {this.state.mode === modes.debug && (
          <ScrollView>
            <Text>
              gameStartTime {this.state && this.state.gameStartTime && moment(this.state.gameStartTime).format("hh:mm:ss")}
            </Text>
            <Text>
              currentGameTime {this.state && this.state.currentGameTime && moment(this.state.currentGameTime).format("hh:mm:ss")}
            </Text>
            <Text>
              gameDurationSeconds {this.state && this.state.gameDurationSeconds}
            </Text>
            <Text>
              assignmentsIndex {this.state && this.state.assignmentsIndex}
            </Text>
            <Text>
              numberOfLineups {this.state && this.state.gamePlan && this.state.gamePlan.numberOfLineups}
            </Text>
            <Text>
              secondsBetweenSubs {this.state && this.state.gamePlan && this.state.gamePlan.secondsBetweenSubs}
            </Text>
            <Text>
              isGameOver {this.state && this.state.isGameOver}
            </Text>
            <Slider
              minimumValue={1}
              maximumValue={200}
              onValueChange={(clockMultiplier) => {
                console.log(`hello ${clockMultiplier}`);
                this.setState((previousState) => {
                  return {
                    ...previousState,
                    clockMultiplier
                  }
                });
              }}
              value={this.state.clockMultiplier}
            />
            <Button
              style={styles.button}
              onPress={() => {
                console.log(JSON.stringify(this.state));
              }}
              title="State"
            />
          </ScrollView>
        )}
        {this.state.mode === modes.roster && (
          <View style={styles.roster}>
            <FlatList
              data={this.state.gameRoster}
              renderItem={({item}) => {
                // console.log(JSON.stringify(player));
                return (
                  <View style={styles.playerAvailability}>
                    <Switch
                      style={styles.switch}
                      value={item.availability !== playerAvailability.unavailable}
                      onValueChange={(playerIsAvailable) => {
                        console.log(`hello ${playerIsAvailable}`);
                        this.onPlayerAvailableChange(item, playerIsAvailable);
                      }}
                    />
                    <Text>{item.name}</Text>
                  </View>
                );
              }}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
        )}
        {this.state.mode === modes.default && (
        <View style={styles.park}>
          <View style={styles.field}>
          {
            _.chain(this.props.positionCategories)
            .filter((category) => category.parkLocation === "FIELD")
            .reverse()
            .map((category, categoryIndex) => (
              <FormationLine
                key={categoryIndex}
                style={{}}
                lineOrientation="horizontal"
                positionCategory={category}
              >
                {
                  _.chain(this.state.gamePlan.assignmentsList[this.state.assignmentsIndex].assignments)
                  .filter((positionAssignment) =>
                  positionAssignment.position.positionCategory.name === category.name)
                  .map((positionAssignment, positionAssignmentIndex) => (
                    <Player
                      key={positionAssignmentIndex}
                      style={styles.player}
                      position={positionAssignment.position}
                      player={positionAssignment.player}
                      radius={100}
                      gameStartTime={this.state.gameStartTime}
                      gameDurationSeconds={this.state.gameDurationSeconds}
                      currentGameTime={this.state.currentGameTime}
                      gamePlan={this.state.gamePlan}
                      assignmentsIndex={this.state.assignmentsIndex}
                      isGameOver={this.state.isGameOver}
                    />
                  ))
                  .value()
                }
              </FormationLine>
            ))
            .value()
          }
          </View>
          <View style={styles.bench}>
          {
            _.chain(this.props.positionCategories)
            .filter((category) => category.parkLocation === "BENCH")
            .reverse()
            .map((category, categoryIndex) => (
              <FormationLine
                key={categoryIndex}
                style={{}}
                lineOrientation="vertical"
                positionCategory={category}
              >
                {
                  _.chain(this.state.gamePlan.assignmentsList[this.state.assignmentsIndex].assignments)
                  .filter((positionAssignment) =>
                  positionAssignment.position.positionCategory.name === category.name)
                  .map((positionAssignment, positionAssignmentIndex) => (
                    <Player
                      key={positionAssignmentIndex}
                      style={styles.player}
                      position={positionAssignment.position}
                      player={positionAssignment.player}
                      radius={100}
                      gameStartTime={this.state.gameStartTime}
                      gameDurationSeconds={this.state.gameDurationSeconds}
                      currentGameTime={this.state.currentGameTime}
                      gamePlan={this.state.gamePlan}
                      assignmentsIndex={this.state.assignmentsIndex}
                      isGameOver={this.state.isGameOver}
                    />
                  ))
                  .value()
                }
              </FormationLine>
            ))
            .value()
          }
          </View>
        </View>
        )}
        <View style={styles.buttons}>
          <Button
            style={styles.button}
            onPress={this.onPressStartPauseResume}
            title={this.state.gameStartTime ? (this.state.isClockRunning ? "Pause" : "Resume") : "Start"}
          />
          <Button
            style={styles.button}
            onPress={this.onPressReset}
            title="Reset"
          />
          {
            // <Button
            //   style={styles.button}
            //   onPress={this.onPressSubstituteNow}
            //   title="Sub"
            // />
          }
          <Button
            style={styles.button}
            onPress={this.onPressDebug}
            title="Debug"
          />
          <Button
            style={styles.button}
            onPress={this.onPressManageRoster}
            title="Roster"
          />
        </View>
      </View>
    );
  }
}

const numberOfLineups = 8;
// const totalDemoSeconds = 15;

const modes = {
  "default": "default",
  debug: "debug",
  roster: "roster",
};
//
// let gamePositions = this.props.players.map((player, index) => {
//   switch (index) {
//     case 0:
//       return specialPositions.keeper;
//     case 1:
//       return specialPositions.leftBack;
//     case 2:
//       return specialPositions.rightBack;
//     case 3:
//       return specialPositions.leftMid;
//     case 4:
//       return specialPositions.rightMid;
//     case 5:
//       return specialPositions.leftForward;
//     case 6:
//       return specialPositions.rightForward;
//     default:
//       return specialPositions.substitute;
//   }
// });

let CIRCLE_RADIUS = 30;
let styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roster: {
    paddingTop: 15,
  },
  park: {
    flex: 1,
    backgroundColor: '#ccffcc',//'lightgreen',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  field: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bench: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  player: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 40,
    width: '100%',
  },
  button: {
    margin: 10,
  },
  switch: {
    marginRight: 10,
  },
  playerAvailability: {
    alignItems: 'center',
    flexDirection: 'row',
    margin: 10,
  }
});
// player: {
//   width: CIRCLE_RADIUS * 2 + 40,
//   height: CIRCLE_RADIUS * 2 + 40,
//   margin: 10,
// },
