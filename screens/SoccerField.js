import React, {Fragment} from 'react';
import {PropTypes} from 'prop-types';
import { Button, ScrollView, Slider, StyleSheet, Text, View } from 'react-native';
import {withApollo} from 'react-apollo';
// import gql from "graphql-tag";
import FormationLine from '../components/FormationLine';
import Player from '../components/Player';
import Roster from '../components/Roster';
import moment from 'moment';
import _ from 'lodash';
import {
  // gameRoster as theGameRoster,
  playerAvailability,
  // specialPositions,
  // positionCategories,
} from '../constants/Soccer';
import {
  addToLineup,
  createInitialLineup,
  createNextMassSubstitution,
  createSubstitutionForSelections,
  getNextSubstitutionInfo,
  deleteSelectedSubstitutions,
} from '../graphql/gamePlan';
import {
  deleteGameEtc,
  makePlannedSubstitutionOfficial,
  startGame,
  startPeriod,
  stopGame,
} from '../graphql/game';
import {
  canApplyPlannedSubstitution,
  canRemoveSelectedSubs,
  canSetLineup,
  canSubstitute,
  getCurrentTimeInfo,
  getCancelPressedSelectionInfo,
  getGamePeriodAfter,
  getGameTimeline,
  getGameSnapshot,
  getGameStatusInfo,
  getNextPlannedSubstitution,
  getPlayerDisplayMode,
  getPlayerPressedSelectionInfo,
  selectionsPartOfPlannedSubstitution,
} from '../helpers/game';

const millisecondsBeforeSliderAction = 500;

export default withApollo(
// export default
class SoccerField extends React.Component {
  static propTypes = {
    gameDefinition: PropTypes.object,
    gameTeamSeasonId: PropTypes.string.isRequired,
    gameState: PropTypes.object,
    gamePlan: PropTypes.object,
    gameTeamSeason: PropTypes.object,
    gamePlayers: PropTypes.array,
    positionCategories: PropTypes.array,
    onLineupChange: PropTypes.func.isRequired,
    onSubsChange: PropTypes.func.isRequired,
  }
  static navigationOptions = {
    title: 'Game',
  }

  constructor(props) {
    super(props);
    // Don't call this.setState() here!
    this.state = this.getInitialState();

    this.onPressAutoSubs = this.onPressAutoSubs.bind(this);
    this.onPressAddToLineup = this.onPressAddToLineup.bind(this);
    this.onPressSubNow = this.onPressSubNow.bind(this);
    this.onPressSubNextTime = this.onPressSubNextTime.bind(this);
    this.onPressDebug = this.onPressDebug.bind(this);
    this.onPressDelete = this.onPressDelete.bind(this);
    this.onPressManageRoster = this.onPressManageRoster.bind(this);
    this.onPressRemoveSelectedSubs = this.onPressRemoveSelectedSubs.bind(this);
    this.onPressStart = this.onPressStart.bind(this);
    this.onPressStop = this.onPressStop.bind(this);
    this.onPressReset = this.onPressReset.bind(this);
    this.onPressLineup = this.onPressLineup.bind(this);
    this.updateGame = this.updateGame.bind(this);
    this.onPressPlayer = this.onPressPlayer.bind(this);
    this.onPressCancel = this.onPressCancel.bind(this);
    this.startOrStopGameTimer = this.startOrStopGameTimer.bind(this);
  }

  getInitialState() {
    const {
      timestamp,
      totalSeconds,
      gameSeconds,
      isGameOver,
    } = getCurrentTimeInfo(this.props.gameTeamSeason);
    const state = {
      clockMultiplier: 1.0,
      currentGameTime: undefined,
      gameStartTime: undefined,
      isClockRunning: true,
      isGameOver,
      mode: modes.default,
      totalSeconds,
      gameSeconds,
      timestamp,
    };
    return state;
  }

  componentDidMount() {
    this.startOrStopGameTimer();
  }

  startOrStopGameTimer() {
    const {gameTeamSeason} = this.props;
    const gameStatusInfo = getGameStatusInfo({
      gameTeamSeason,
    });

    console.log(`gameStatusInfo`,gameStatusInfo);

    // If the game is in progress we need to update clocks every second
    if (gameStatusInfo.gameStatus === "IN_PROGRESS") {
      const updateGameTimer = setTimeout(this.updateGame, 0);
      this.setState({
        isClockRunning: true,
        updateGameTimer,
      });
    } else {
      if (this.state.updateGameTimer) {
        clearTimeout(this.state.updateGameTimer);
      }
    }
  }

  componentWillUnmount() {
    if (this.state.updateGameTimer) {
      clearTimeout(this.state.updateGameTimer);
    }
  }

  onPressManageRoster() {
    this.setState((previousState) => {
      return {
        ...previousState,
        mode: previousState.mode === modes.roster ? modes.default : modes.roster,
      };
    });
  }

  onPressPlayer(positionSnapshot, {gameSnapshot}) {
    this.setState((previousState) => {
      const {gameTeamSeason} = this.props;
      const selectionInfo = getPlayerPressedSelectionInfo(previousState, positionSnapshot, {gameTeamSeason, gameSnapshot});
      return {
        ...previousState,
        selectionInfo,
      };
    });
  }

  onPressCancel() {
    this.setState((previousState) => {
      const selectionInfo = getCancelPressedSelectionInfo(previousState);
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

  onPressSubNow(){
    const {client, gameTeamSeason} = this.props;
    const {selectionInfo} = this.state;
    const {timestamp, gameSeconds, totalSeconds} = getCurrentTimeInfo(gameTeamSeason);
    const gameStatusInfo = getGameStatusInfo({
      gameTeamSeason,
    });
    const {
      gameActivityType,
    } = gameStatusInfo;
    const gameActivityStatus = gameActivityType === "OFFICIAL"
    ? "COMPLETED"
    : "PENDING";

    console.log(`onPressSubNow`,gameStatusInfo, selectionInfo);
    if (selectionInfo && selectionInfo.selections &&
    !selectionsPartOfPlannedSubstitution(selectionInfo, gameTeamSeason)) {
      createSubstitutionForSelections(client, {
        selectionInfo,
        gameTeamSeason,
        gameActivityType,
        gameActivityStatus,
        timestamp,
        gameSeconds,
        totalSeconds,
      })
      .then(this.props.onSubsChange);
    } else if (canApplyPlannedSubstitution(gameTeamSeason)) {
      // Make the planned substitutions official
      const plannedSubstitution = getNextPlannedSubstitution({
        gameTeamSeason,
        excludeInitial: true
      });
      makePlannedSubstitutionOfficial(client, {
        selectionInfo,
        plannedSubstitution,
        gameTeamSeason,
        timestamp,
        gameSeconds,
        totalSeconds,
      })
      .then(this.props.onSubsChange);
    }
  }

  onPressSubNextTime() {
    const {client, gameTeamSeason} = this.props;
    const {selectionInfo} = this.state;
    const nextPlannedSubstitution = getNextPlannedSubstitution({
      gameTeamSeason,
      excludeInitial: true
    });
    // ToDo: Fix this; currently not right because getNextSubstitutionInfo
    // does not consider current time or time of last official substitution
    const {totalSeconds, gameSeconds} =
      nextPlannedSubstitution || getNextSubstitutionInfo(gameTeamSeason);
    createSubstitutionForSelections(client, {
      selectionInfo,
      gameTeamSeason,
      gameActivityType: "PLAN",
      gameActivityStatus: "PENDING",
      gameSeconds,
      totalSeconds,
    })
    .then(this.props.onSubsChange);
  }

  onPressRemoveSelectedSubs() {
    const {client, gameTeamSeason} = this.props;
    const {selectionInfo} = this.state;
    const nextPlannedSubstitution = getNextPlannedSubstitution({
      gameTeamSeason,
      excludeInitial: true
    });
    const {totalSeconds, gameSeconds} =
      nextPlannedSubstitution || getNextSubstitutionInfo(gameTeamSeason);
    deleteSelectedSubstitutions(client, {
      selectionInfo,
      gameTeamSeason,
      gameActivityType: "PLAN",
      //gameActivityStatus: "PENDING",
      gameSeconds,
      totalSeconds,
    })
    .then(this.props.onSubsChange);
  }

  onPressAutoSubs(){
    const {client, gameTeamSeason} = this.props;
    const {totalSeconds, gameSeconds} = getNextSubstitutionInfo(gameTeamSeason);
    createNextMassSubstitution(client, {
      gameTeamSeason,
      gameActivityType: "PLAN",
      gameActivityStatus: "PENDING",
      gameSeconds,
      totalSeconds,
    })
    .then(this.props.onSubsChange);
  }

  onPressAddToLineup() {
    const {client, gameTeamSeason} = this.props;
    const {gameSeconds, totalSeconds} = this.state;
    const {selectionInfo} = this.state;
    if (!selectionInfo.selections || selectionInfo.selections.length !== 2) {
      console.error(`Must have two selections in onPressAddToLineup`);
      return;
    }
    const positionSnapshotFrom = _.find(selectionInfo.selections, (selection) => selection.playerId);
    const positionSnapshotTo = _.find(selectionInfo.selections, (selection) => !selection.playerId);
    const playerPositionAssignmentType = "INITIAL";
    addToLineup(client, {
      gameTeamSeason,
      gameActivityType: "PLAN",
      gameActivityStatus: "PENDING",
      gameSeconds,
      totalSeconds,
      positionSnapshotFrom,
      positionSnapshotTo,
      playerPositionAssignmentType,
    })
    .then(this.props.onSubsChange);
  }

  onPressDelete() {
    const {client, gameTeamSeason} = this.props;
    deleteGameEtc(client, {
      gameTeamSeason
    })
    // .then(this.props.onSubsChange);
    .then(() => {
      this.props.navigation.navigate('Games');
    });
  }

  onPressReset() {
    this.setState(() => {
      return this.getInitialState();
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


  onPressStart() {
    const {client, gameTeamSeason} = this.props;
    const {game} = gameTeamSeason;
    const gameTeamSeasonId = gameTeamSeason && gameTeamSeason.id;
    const {gamePeriod: {id: gamePeriodId}, isFirstPeriod} = getGameStatusInfo({
      gameTeamSeason,
    });
    const {
      timestamp,
      gameSeconds,
      totalSeconds,
    } = getCurrentTimeInfo(gameTeamSeason);
    if (isFirstPeriod) {
      const initialLineupSubstitution = getNextPlannedSubstitution({
        gameTeamSeason,
        excludeInitial: false
      });
      startGame(client, {
        gameTeamSeason,
        gameTeamSeasonId,
        game,
        gamePeriodId,
        timestamp,
        gameSeconds,
        totalSeconds,
        plannedSubstitution: initialLineupSubstitution,
      })
      .then(this.startOrStopGameTimer)
      .then(this.props.onSubsChange);
    } else {
      startPeriod(client, {
        gameTeamSeasonId,
        game,
        gamePeriodId,
        timestamp,
        gameSeconds,
        totalSeconds,
      })
      .then(this.startOrStopGameTimer)
      .then(this.props.onSubsChange);
    }
  }

  onPressStop() {
    const {client, gameTeamSeason} = this.props;
    const {game} = gameTeamSeason;
    const gameTeamSeasonId = gameTeamSeason && gameTeamSeason.id;
    const {gamePeriod: {id: gamePeriodId}} = getGameStatusInfo({
      gameTeamSeason,
    });
    const {gamePeriods} = gameTeamSeason.teamSeason.team.league.gameDefinition;
    const {
      timestamp,
      gameSeconds,
      totalSeconds,
    } = getCurrentTimeInfo(gameTeamSeason);
    const nextGamePeriod = getGamePeriodAfter(gamePeriods, gamePeriodId);
    console.log(`onPressStop`,
      gamePeriods,
      gameTeamSeasonId,
      game,
      gamePeriodId,
      timestamp,
      gameSeconds,
      totalSeconds,
      nextGamePeriod,
    );
    stopGame(client, {
      gameTeamSeasonId,
      game,
      gamePeriodId,
      timestamp,
      gameSeconds,
      totalSeconds,
      nextGamePeriod,
    })
    .then(this.startOrStopGameTimer)
    .then(this.props.onSubsChange);
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
    // Don't do anything if no updateGameTimer since that means the component was unmounted
    if (!this.state.updateGameTimer) {
      console.log(`Doing nothing in updateGame because no updateGameTimer`);
      return;
    }
    this.setState((previousState) => {
      let {isClockRunning, updateGameTimer} = this.state;

      if (!isClockRunning) {
        return previousState;
      }

      const {gameTeamSeason} = this.props;
      const {
        timestamp,
        totalSeconds,
        gameSeconds,
        isGameOver,
      } = getCurrentTimeInfo(gameTeamSeason);

      isClockRunning = !isGameOver;

      if (!isGameOver) {
        updateGameTimer = setTimeout(this.updateGame, 1000);
      }

      return {
        ...previousState,
        timestamp,
        totalSeconds,
        gameSeconds,
        isClockRunning,
        updateGameTimer,
      };
    });
  }

  getFlexValues(gameSnapshot, gamePlayers) {
    const positionCount = _.keys(gameSnapshot.positions).length;
    const benchCount =
    _.filter(gamePlayers, (gamePlayer) =>
      gamePlayer.availability === playerAvailability.active &&
      gameSnapshot.players[gamePlayer.player.id] &&
      (!gameSnapshot.players[gamePlayer.player.id].activeEvent ||
      !gameSnapshot.players[gamePlayer.player.id].activeEvent.position)).length;

    // Intention is that the flex value would match max number of players from left right.
    // Currently using 1-2-2-2 formation and fieldFlex is 2 as desired.
    // This approximation would not work for 1-3-2-1 formation though.
    const fieldFlex = Math.floor((positionCount - 1) / 4) + 1;
    const benchFlex = Math.floor((benchCount - 1) / 4) + 1;
    const playerBasis = Math.floor(280 / (fieldFlex + benchFlex));
    return {
      fieldFlex,
      benchFlex,
      playerBasis,
    };
  }

  getDynamicStyles(gameSnapshot, gamePlayers) {
    const {benchFlex, fieldFlex, playerBasis} = this.getFlexValues(gameSnapshot, gamePlayers);
    const benchStyles = {
      ...styles.bench,
      flex: benchFlex,
    };
    const fieldStyles = {
      ...styles.field,
      flex: fieldFlex,
    };
    const playerStyles = {
      ...styles.player,
      flexBasis: playerBasis,
    };
    return {benchStyles, fieldStyles, playerStyles};
}

  render() {
    const {
      gamePlan,
      gamePlayers,
      gameState,
      gameTeamSeason,
      positionCategories
    } = this.props;
    if (!gameTeamSeason) {
      return <View></View>;
    }
    const {
      timestamp,
      totalSeconds,
      gameSeconds,
      selectionInfo,
    } = this.state;
    const gameStatusInfo = getGameStatusInfo({
      gameTeamSeason,
    });
    const {
      gameStatus,
      gamePeriod,
      gameActivityType,
      gameActivityStatus,
      gameDurationSeconds
    } = gameStatusInfo;
    const gameTimeline = getGameTimeline({
      gameStatus,
      gameTeamSeason,
      totalSeconds,
      gameSeconds,
      timestamp,
    });
    const gameSnapshot = getGameSnapshot({
      gameTimeline,
      positionCategories,
      gameTeamSeason,
      totalSeconds,
      gameSeconds,
      timestamp,
      gameDurationSeconds,
    });
    const playersSelected = selectionInfo &&
      selectionInfo.selections &&
      selectionInfo.selections.length || 0;
    const {benchStyles, fieldStyles, playerStyles} = this.getDynamicStyles(gameSnapshot, gamePlayers);
    // console.log(`gameSnapshot:`, gameSnapshot);
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
              isGameOver {this.state && this.state.isGameOver}
            </Text>
            <Slider
              minimumValue={1}
              maximumValue={200}
              onValueChange={(clockMultiplier) => {
                // console.log(`hello ${clockMultiplier}`);
                this.setState((previousState) => {
                  return {
                    ...previousState,
                    clockMultiplier
                  }
                });
              }}
              value={gameState.clockMultiplier}
            />
            <Button
              style={styles.button}
              onPress={() => {
                console.log(JSON.stringify(this.state));
              }}
              title="State"
            />
{
//             <Button
//               style={styles.button}
//               onPress={() => {
//                 const gamePlayers = this.props.client.readQuery({
//   query: gql`
//     query {
//       allGamePlayers(
//         filter: {
//           gameTeamSeason: {
//             id: ${this.props.gameTeamSeasonId}
//           }
//         }
//       ) {
//         id
//         availability
//         player {
//           id
//           name
//         }
//       }
//     }
//   `,
// });
//                 console.log("cache: " + JSON.stringify(gamePlayers));
//               }}
//               title="GamePlayers Cache"
//             />
}
          </ScrollView>
        )}
        {this.state.mode === modes.roster && (
          <Roster
            gameRoster={gamePlayers}
          />
        )}
        {this.state.mode === modes.default && (
        <View style={styles.park}>
          <View style={fieldStyles}>
          {
            _.chain(positionCategories)
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
                  .sortBy((positionSnapshot) => positionSnapshot.event.position.leftToRightPercent)
                  .map((positionSnapshot, positionSnapshotIndex) => (
                    <Player
                      key={positionSnapshotIndex}
                      style={playerStyles}
                      position={positionSnapshot.event.position}
                      positionCategory={category}
                      player={_.find(gamePlayers, (gamePlayer) => gamePlayer.player.id === positionSnapshot.playerId) &&
                        _.find(gamePlayers, (gamePlayer) => gamePlayer.player.id === positionSnapshot.playerId).player}
                      gamePlan={gamePlan}
                      gamePlayers={gamePlayers}
                      gameStartTime={this.state.gameStartTime}
                      gameSeconds={gameSeconds}
                      currentGameTime={this.state.currentGameTime}
                      isGameOver={this.state.isGameOver}
                      playerStats={gameSnapshot.players[positionSnapshot.playerId]}
                      pendingMove={gameSnapshot.players[positionSnapshot.playerId] && gameSnapshot.players[positionSnapshot.playerId].pendingMove}
                      piePieces={gameSnapshot.players[positionSnapshot.playerId] && gameSnapshot.players[positionSnapshot.playerId].piePieces}
                      playerDisplayMode={getPlayerDisplayMode(positionSnapshot, this.state)}
                      onPress={() => this.onPressPlayer(positionSnapshot, {gameSnapshot})}
                    />
                  ))
                  .value()
                }
              </FormationLine>
            ))
            .value()
          }
          </View>
          <View style={benchStyles}>
          {
            _.chain(positionCategories)
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
                  _.chain(gamePlayers)
                  .filter((gamePlayer) =>
                  gamePlayer.availability === playerAvailability.active &&
                  gameSnapshot.players[gamePlayer.player.id] &&
                  (!gameSnapshot.players[gamePlayer.player.id].activeEvent ||
                  !gameSnapshot.players[gamePlayer.player.id].activeEvent.position))
                  .sortBy((gamePlayer) => gameSnapshot.players[gamePlayer.player.id].cumulativeInGameSeconds)
                  .map((gamePlayer, gamePlayerIndex) => (
                    <Player
                      key={gamePlayerIndex}
                      style={playerStyles}
                      position={undefined}
                      positionCategory={category}
                      player={gamePlayer.player}
                      gamePlan={gamePlan}
                      gamePlayers={gamePlayers}
                      gameStartTime={this.state.gameStartTime}
                      currentGameTime={this.state.currentGameTime}
                      isGameOver={this.state.isGameOver}
                      playerStats={gameSnapshot.players[gamePlayer.player.id]}
                      pendingMove={gameSnapshot.players[gamePlayer.player.id].pendingMove}
                      piePieces={gameSnapshot.players[gamePlayer.player.id].piePieces}
                      playerDisplayMode={getPlayerDisplayMode({playerId:gamePlayer.player.id}, this.state)}
                      onPress={() => this.onPressPlayer({playerId:gamePlayer.player.id}, {gameSnapshot})}
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
        <View style={styles.inputArea}>
          <View style={styles.instructions}>
            {playersSelected === 1 && (
              <Text>
                Select another player for substitution
              </Text>
            )}
          </View>
          <View style={styles.buttons}>
            {this.state.mode === modes.default &&
              playersSelected === 0 && (
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={gameDurationSeconds}
              onValueChange={(gameSeconds) => {
                // console.log(`hello ${gameSeconds}`);
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
            )}
            {playersSelected === 0 && (
              <Fragment>
                {gamePeriod &&
                  ((gameStatus === "SCHEDULED" && gameActivityType === "PLAN") ||
                  (gameStatus === "IN_PROGRESS" && gameActivityType === "OFFICIAL" &&
                  gameActivityStatus === "STOPPED")) &&
                  <Button
                    style={styles.button}
                    onPress={this.onPressStart}
                    title={`Start ${gamePeriod.name}`}
                  />
                }
                {gamePeriod &&
                  (gameStatus === "IN_PROGRESS" &&
                  gameActivityType === "OFFICIAL" &&
                  gameActivityStatus === "IN_PROGRESS") &&
                  <Button
                    style={styles.button}
                    onPress={this.onPressStop}
                    title={`End ${gamePeriod.name}`}
                  />
                }
                {gamePeriod &&
                  gameStatus === "IN_PROGRESS" &&
                  gameActivityType === "OFFICIAL" &&
                  // gameActivityStatus === "IN_PROGRESS" &&
                  canApplyPlannedSubstitution(gameTeamSeason) &&
                  <Button
                    style={styles.button}
                    onPress={this.onPressSubNow}
                    title="Sub Now"
                  />
                }
                <Button
                  style={styles.button}
                  onPress={this.onPressReset}
                  title="Reset"
                />
                <Button
                  style={styles.button}
                  onPress={this.onPressAutoSubs}
                  title="Auto Subs"
                />
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
              </Fragment>
            )}
            {playersSelected > 0 && (
              <Fragment>
                <Button
                  style={styles.button}
                  onPress={this.onPressDelete}
                  title="Delete"
                />
                <Button
                  style={styles.button}
                  onPress={this.onPressCancel}
                  title="Cancel"
                />
              </Fragment>
            )}
            {playersSelected > 1 && (
              <Fragment>
                {gameStatus === "IN_PROGRESS" &&
                canSubstitute({selectionInfo, gameActivityType: "OFFICIAL"}) && (
                  <Button
                    style={styles.button}
                    onPress={this.onPressSubNow}
                    title="Sub Now"
                  />
                )}
                {canSubstitute({selectionInfo, gameActivityType: "PLAN"}) && (
                  <Button
                    style={styles.button}
                    onPress={this.onPressSubNextTime}
                    title="Sub Next Time"
                  />
                )}
                {canRemoveSelectedSubs(selectionInfo) && (
                  <Button
                    style={styles.button}
                    onPress={this.onPressRemoveSelectedSubs}
                    title="Remove Selected Sub"
                  />
                )}
                {canSetLineup(selectionInfo) && (
                  <Button
                    style={styles.button}
                    onPress={this.onPressAddToLineup}
                    title="Add to Lineup"
                  />
                )}
              </Fragment>
            )}
          </View>
        </View>
      </View>
    );
  }
});

// const numberOfLineups = 8;
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

// let CIRCLE_RADIUS = 30;
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
    flex: 2.5,
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
    flexBasis: 70,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    width: 100,
  },
  slider: {
    width: 100,
  },
  inputArea: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '100%',
    width: '100%',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
    width: '100%',
  },
  button: {
    margin: 10,
  },
  instructions: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
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
