import React from 'react';
import { Button, ScrollView, Slider, StyleSheet, Switch, Text, View } from 'react-native';
import {withApollo} from 'react-apollo';
import gql from "graphql-tag";
import FormationLine from '../components/FormationLine';
import Player from '../components/Player';
import Roster from '../components/Roster';
import moment from 'moment';
import _ from 'lodash';
import {
  // gameRoster as theGameRoster,
  playerAvailability,
  specialPositions,
  // positionCategories,
} from '../constants/Soccer';
import {
  createInitialLineup,
  createNextSubstitution,
  getNextSubstitutionInfo,
} from '../graphql/gamePlan';
import {
  deleteGameEtc,
} from '../graphql/game';
import {
  getGameTimeline,
  getGameSnapshot,
  getPlayerDisplayMode,
  getPlayerPressedSelectionInfo,
} from '../helpers/game';

const millisecondsBeforeSliderAction = 500;

export default withApollo(
// export default
class SoccerField extends React.Component {
  static navigationOptions = {
    title: 'Game',
  }

  constructor(props) {
    super(props);
    // Don't call this.setState() here!
    this.state = this.getInitialState();

    this.onPressSubs = this.onPressSubs.bind(this);
    this.onPressDebug = this.onPressDebug.bind(this);
    this.onPressDelete = this.onPressDelete.bind(this);
    this.onPressManageRoster = this.onPressManageRoster.bind(this);
    this.onPressStartPauseResume = this.onPressStartPauseResume.bind(this);
    this.onPressReset = this.onPressReset.bind(this);
    this.onPressLineup = this.onPressLineup.bind(this);
    this.updateGame = this.updateGame.bind(this);
  }

  getInitialState() {

    const state = {
      assignmentsIndex: 0,
      clockMultiplier: 1.0,
      currentGameTime: undefined,
      gameDurationSeconds: 50.0*60,
      gameStartTime: undefined,
      gameSeconds: 0,
      // gamePlan: undefined,
      // gameRoster: this.props.gamePlayers || [],
      // gamePositions: this.props.//this.getGamePositions(this.props.gamePlayers || []),
      // assignmentsHistory: [],
      isClockRunning: false,
      isGameOver: false,
      mode: modes.default,
    };
    // state.gamePlan = this.getGamePlan(state);
    return state;
  }
  //
  // getGamePositions() {
  //   let positionIndex = 0;
  //   return this.props.gamePlayers.map((gamePlayer) => {
  //     if (gamePlayer.availability === playerAvailability.unavailable) {
  //       return specialPositions.unavailable;
  //     }
  //
  //     if (this.props.positions && this.props.positions.length > positionIndex) {
  //       return this.props.positions[positionIndex++];
  //     }
  //     return specialPositions.substitute;
  //     // switch (positionIndex++) {
  //     //   case 0:
  //     //     return specialPositions.keeper;
  //     //   case 1:
  //     //     return specialPositions.leftBack;
  //     //   case 2:
  //     //     return specialPositions.rightBack;
  //     //   case 3:
  //     //     return specialPositions.leftMid;
  //     //   case 4:
  //     //     return specialPositions.rightMid;
  //     //   case 5:
  //     //     return specialPositions.leftForward;
  //     //   case 6:
  //     //     return specialPositions.rightForward;
  //     //   default:
  //     //     return specialPositions.substitute;
  //     // }
  //   });
  // }

  // getAssignments() {
  //   const gamePositions = this.props.gameTeamSeason &&
  //     this.props.gameTeamSeason.formationSubstitutions &&
  //     this.props.gameTeamSeason.formationSubstitutions.length &&
  //     this.props.gameTeamSeason.formationSubstitutions[0] &&
  //     this.props.gameTeamSeason.formationSubstitutions[0].formation &&
  //     this.props.gameTeamSeason.formationSubstitutions[0].formation.positions || [];
  //   let positions = gamePositions.map((gamePosition) => ({
  //     filled: false,
  //     gamePosition: gamePosition,
  //   }));
  //   const getAvailablePosition = (gamePlayer) => {
  //     const availablePosition = _.find(positions,
  //       (position) => !position.filled &&
  //       ((gamePlayer.availability === playerAvailability.unavailable &&
  //         position.gamePosition.name === specialPositions.unavailable.name) ||
  //       (gamePlayer.availability !== playerAvailability.unavailable &&
  //         position.gamePosition.name !== specialPositions.unavailable.name))
  //     );
  //     if (!availablePosition) {
  //       return specialPositions.unavailable;
  //     }
  //
  //     availablePosition.filled = true;
  //     return availablePosition.gamePosition;
  //   };
  //   return {
  //     assignments: _.chain(this.props.gamePlayers)
  //       .shuffle()
  //       .map((gamePlayer) => {
  //         const position = getAvailablePosition(gamePlayer);
  //         return {
  //           gamePlayer,
  //           position,
  //         };
  //       })
  //       .value(),
  //     startTime: undefined,
  //     endTime: undefined
  //   };
  // }

  // getGamePlan() {
  //   let totalGameSeconds = _.reduce(this.props.gameTeamSeason &&
  //     this.props.gameTeamSeason.teamSeason &&
  //     this.props.gameTeamSeason.teamSeason.team &&
  //     this.props.gameTeamSeason.teamSeason.team.league &&
  //     this.props.gameTeamSeason.teamSeason.team.league.gameDefinition &&
  //     this.props.gameTeamSeason.teamSeason.team.league.gameDefinition.gamePeriods || [],
  //     (sum, gamePeriod) => sum + gamePeriod.durationSeconds, 0
  //   );
  //   const secondsBetweenSubs = this.props.gameDurationSeconds / numberOfLineups;
  //   const assignmentsList = [];
  //   for (var i = 0; i < numberOfLineups; i++) {
  //     assignmentsList.push(this.getAssignments());
  //   }
  //   return {
  //     numberOfLineups,
  //     secondsBetweenSubs,
  //     assignmentsList,
  //   };
  // }

  onPressManageRoster() {
    this.setState((previousState) => {
      return {
        ...previousState,
        mode: previousState.mode === modes.roster ? modes.default : modes.roster,
      };
    });
  }

  onPressPlayer(gamePlayer) {
    this.setState((previousState) => {
      const selectionInfo = getPlayerPressedSelectionInfo(previousState, gamePlayer);
      return {
        ...previousState,
        selectionInfo,
      };
    });
  }

  onPressLineup(){
    const {client, gameTeamSeason} = this.props;
    createInitialLineup(client, {
      gameTeamSeason,
      gameActivityType: "PLAN",
      gameActivityStatus: "PENDING",
    })
    .then(this.props.onLineupChange);
  }

  onPressSubs(){
    const {client, gameTeamSeason} = this.props;
    const {totalSeconds, gameSeconds} = getNextSubstitutionInfo(gameTeamSeason);
    console.log(`totalSeconds: ${totalSeconds}, gameSeconds: ${gameSeconds}`);
    createNextSubstitution(client, {
      gameTeamSeason,
      gameActivityType: "PLAN",
      gameActivityStatus: "PENDING",
      gameSeconds,
      totalSeconds,
    })
    .then(this.props.onSubsChange);
  }

  onPressDelete() {
    const {client, gameTeamSeason} = this.props;
      deleteGameEtc(client, {
      gameTeamSeason
    });
  }

  onPressReset() {
    this.setState(() => {
      return this.getInitialState();
    });
  }
  //
  // onPlayerAvailableChange(rosterPlayer, playerIsAvailable) {
  //   console.log(JSON.stringify(rosterPlayer));
  //   this.setState((previousState) => {
  //     const gameRoster = [...previousState.gameRoster];
  //     const gamePlayer = _.find(gameRoster, (_gamePlayer) => rosterPlayer.player.name === _gamePlayer.player.name);
  //     console.log('gamePlayer: ' + JSON.stringify(gamePlayer));
  //     gamePlayer.availability = playerIsAvailable ? playerAvailability.active : playerAvailability.unavailable;
  //     const newState = {
  //       ...previousState,
  //       gameRoster,
  //       gamePositions: this.getGamePositions(gameRoster),
  //     };
  //     newState.gamePlan = this.getGamePlan(newState);
  //     return newState;
  //   });
  // }

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
      // const gamePlan = previousState.gamePlan;
      const assignmentsIndex = 0;
      // gamePlan.assignmentsList[assignmentsIndex].startTime = gameStartTime;
      return {
        ...previousState,
        gameStartTime,
        // gamePlan,
        assignmentsIndex,
        isClockRunning: true,
        isGameOver: false,
      };
    });
  }

  onSliderMove(gameSeconds) {
    if (moment().diff(this.state.lastSliderMoveTime) < millisecondsBeforeSliderAction) {
      return;
    }
    this.setState((previousState) => {
      return {
        ...previousState,
        gameSeconds
      };
    });
  }

  updateGame() {
    // this.setState((previousState) => {
    //   if (!this.state.isClockRunning) {
    //     return;
    //   }
    //
    //   const now = moment();
    //   // const demoTimeMultiplier = previousState.gameDurationSeconds / totalDemoSeconds;
    //   const actualMillisecondsSinceGameStart = now.diff(previousState.gameStartTime);
    //   const currentGameTime = moment(previousState.gameStartTime).add(
    //     actualMillisecondsSinceGameStart*this.props.gameState.clockMultiplier, "milliseconds").toDate();
    //   const gamePlan = previousState.gamePlan && {
    //     ...previousState.gamePlan,
    //   };
    //   const assignmentsList = gamePlan && gamePlan.assignmentsList;
    //   let assignmentsIndex = previousState.assignmentsIndex;
    //   let isGameOver = previousState.isGameOver;
    //   const currentAssignments = assignmentsList[assignmentsIndex];
    //
    //   // check whether current game position assignments have expired and should be substituted
    //   if (currentAssignments
    //     && currentAssignments.startTime
    //     && moment(currentGameTime).diff(currentAssignments.startTime, 'seconds')
    //     > previousState.gamePlan.secondsBetweenSubs) {
    //     console.log("substitution time");
    //     currentAssignments.endTime = currentGameTime;
    //     if (assignmentsIndex + 1 >= numberOfLineups) {
    //       isGameOver = true;
    //     } else {
    //       assignmentsIndex += 1;
    //       assignmentsList[assignmentsIndex].startTime = currentGameTime;
    //     }
    //   }
    //
    //   if (!isGameOver) {
    //     setTimeout(this.updateGame, 200);
    //   }
    //
    //   return {
    //     ...previousState,
    //     currentGameTime,
    //     gamePlan,
    //     assignmentsIndex,
    //     isGameOver,
    //   };
    // });
  }

  getCurrentLineup() {
    return this.props.gameTeamSeason &&
      this.props.gameTeamSeason.substitutions &&
      this.props.gameTeamSeason.substitutions.length &&
      this.props.gameTeamSeason.substitutions[0] &&
      this.props.gameTeamSeason.substitutions[0].playerPositionAssignments || [];
  }

  render() {
    const {gameTeamSeason, positionCategories} = this.props;
    const {gameDurationSeconds} = this.state;
    const gameActivityType = "PLAN";
    const gameActivityStatus = "PENDING";
    const {gameSeconds} = this.state;// = 1111;//this.state.gameDurationSeconds;
    const totalSeconds = gameSeconds;
    const timestamp = undefined;
    // const currentLineup = this.getCurrentLineup();
    const gameTimeline = getGameTimeline({
      gameTeamSeason,
      gameActivityType,
      gameActivityStatus,
      totalSeconds,
      gameSeconds,
      timestamp,
      gameDurationSeconds,
    });
    const gameSnapshot = getGameSnapshot({
      gameTimeline,
      positionCategories,
      gameTeamSeason,
      gameActivityType,
      gameActivityStatus,
      totalSeconds,
      gameSeconds,
      timestamp,
      gameDurationSeconds,
    });
    // console.log("Rendering SoccerField");
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
              value={this.props.gameState.clockMultiplier}
            />
            <Button
              style={styles.button}
              onPress={() => {
                console.log(JSON.stringify(this.state));
              }}
              title="State"
            />
            <Button
              style={styles.button}
              onPress={() => {
                const gamePlayers = this.props.client.readQuery({
  query: gql`
    query {
      allGamePlayers(
        filter: {
          gameTeamSeason: {
            id: ${this.props.gameTeamSeasonId}
          }
        }
      ) {
        id
        availability
        player {
          id
          name
        }
      }
    }
  `,
});
                console.log("cache: " + JSON.stringify(gamePlayers));
              }}
              title="GamePlayers Cache"
            />
          </ScrollView>
        )}
        {this.state.mode === modes.roster && (
          <Roster
            gameRoster={this.props.gamePlayers}
          />
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
                  _.chain(gameSnapshot.positions)
                  .filter((positionSnapshot) =>
                  positionSnapshot.event.position.positionCategory.name === category.name)
                  .map((positionSnapshot, positionSnapshotIndex) => (
                    <Player
                      key={positionSnapshotIndex}
                      style={styles.player}
                      position={positionSnapshot.event.position}
                      positionCategory={category}
                      player={_.find(this.props.gamePlayers, (gamePlayer) => gamePlayer.player.id === positionSnapshot.playerId).player}
                      gamePlan={this.props.gamePlan}
                      gamePlayers={this.props.gamePlayers}
                      gameStartTime={this.state.gameStartTime}
                      gameSeconds={gameSeconds}
                      gameDurationSeconds={this.state.gameDurationSeconds}
                      currentGameTime={this.state.currentGameTime}
                      assignmentsIndex={this.state.assignmentsIndex}
                      isGameOver={this.state.isGameOver}
                      playerStats={gameSnapshot.players[positionSnapshot.playerId]}
                      pendingMove={gameSnapshot.players[positionSnapshot.playerId].pendingMove}
                      piePieces={gameSnapshot.players[positionSnapshot.playerId].piePieces}
                      playerDisplayMode={getPlayerDisplayMode(positionSnapshot.playerId, this.state)}
                      onPress={() => this.onPressPlayer(positionSnapshot.playerId)}
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
                  _.chain(this.props.gamePlayers)
                  .filter((gamePlayer) =>
                  gamePlayer.availability === playerAvailability.active &&
                  gameSnapshot.players[gamePlayer.player.id] &&
                  (!gameSnapshot.players[gamePlayer.player.id].activeEvent ||
                  !gameSnapshot.players[gamePlayer.player.id].activeEvent.position))
                  .map((gamePlayer, gamePlayerIndex) => (
                    <Player
                      key={gamePlayerIndex}
                      style={styles.player}
                      position={undefined}
                      positionCategory={category}
                      player={gamePlayer.player}
                      gamePlan={this.props.gamePlan}
                      gamePlayers={this.props.gamePlayers}
                      gameStartTime={this.state.gameStartTime}
                      gameDurationSeconds={this.state.gameDurationSeconds}
                      currentGameTime={this.state.currentGameTime}
                      assignmentsIndex={this.state.assignmentsIndex}
                      isGameOver={this.state.isGameOver}
                      playerStats={gameSnapshot.players[gamePlayer.player.id]}
                      pendingMove={gameSnapshot.players[gamePlayer.player.id].pendingMove}
                      piePieces={gameSnapshot.players[gamePlayer.player.id].piePieces}
                      playerDisplayMode={getPlayerDisplayMode(gamePlayer.player.id, this.state)}
                      onPress={() => this.onPressPlayer(gamePlayer.player.id)}
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
        {this.state.mode === modes.default && (
        <View style={styles.slider}>
          <Slider
            minimumValue={0}
            maximumValue={this.state.gameDurationSeconds}
            onValueChange={(gameSeconds) => {
              console.log(`hello ${gameSeconds}`);
              // only update gameSeconds after so much time since last slider move
              this.setState((previousState) => {
                return {
                  ...previousState,
                  lastSliderMoveTime: moment(),
                }
              });
              setTimeout(() => this.onSliderMove(gameSeconds), millisecondsBeforeSliderAction);
            }}
            value={this.state.gameSeconds}
          />
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
            <Button
              style={styles.button}
              onPress={this.onPressSubs}
              title="Sub"
            />
          }
          <Button
            style={styles.button}
            onPress={this.onPressDelete}
            title="Delete"
          />
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
          <Button
            style={styles.button}
            onPress={this.onPressLineup}
            title="Lineup"
          />
        </View>
      </View>
    );
  }
});

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
    paddingTop: 0,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // roster: {
  //   paddingTop: 15,
  // },
  park: {
    flex: 1,
    backgroundColor: '#ccffcc',//'lightgreen',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: '100%',
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
  slider: {
    height: 30,
    width: '100%',
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
  // switch: {
  //   marginRight: 10,
  // },
  // playerAvailability: {
  //   alignItems: 'center',
  //   flexDirection: 'row',
  //   margin: 10,
  // }
});
// player: {
//   width: CIRCLE_RADIUS * 2 + 40,
//   height: CIRCLE_RADIUS * 2 + 40,
//   margin: 10,
// },
