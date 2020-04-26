import React, {Fragment} from 'react';
import {PropTypes} from 'prop-types';
import { Alert, Dimensions, ScrollView, Slider, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-elements';
import {withApollo} from 'react-apollo';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import ChooseLineup from '../components/ChooseLineup';
import GameHeader from '../components/GameHeader';
import Lineup from '../components/Lineup';
import FormationLine from '../components/FormationLine';
import Player from '../components/Player';
import Roster from '../components/Roster';
import moment from 'moment';
import _ from 'lodash';
import {
  playerAvailability,
} from '../constants/Soccer';
import {
  addToLineup,
  createInitialLineup,
  createNextMassSubstitution,
  createSubstitutionForSelections,
  getNextSubstitutionInfo,
  deleteSelectedSubstitutions,
  removeFromLineup,
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
  canRemoveFromLineup,
  canRemoveSelectedSubs,
  canSetLineup,
  canSubstitute,
  getAllFieldPlayersSelectionInfo,
  getCurrentTimeInfo,
  getCancelPressedSelectionInfo,
  getGamePeriodAfter,
  getGameTimeline,
  getGameSnapshot,
  getGameStatusInfo,
  getNextPlannedSubstitution,
  getPlayerDisplayMode,
  getPlayerPressedSelectionInfo,
  playerIsOnBench,
  selectionsPartOfPlannedSubstitution,
} from '../helpers/game';

const millisecondsBeforeSliderAction = 500;

export default withApollo(
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

    this.onLineupChange = this.onLineupChange.bind(this);
    this.onPressAutoSubs = this.onPressAutoSubs.bind(this);
    this.onPressAddToLineup = this.onPressAddToLineup.bind(this);
    this.onPressRemoveFromLineup = this.onPressRemoveFromLineup.bind(this);
    this.onPressSubNow = this.onPressSubNow.bind(this);
    this.onPressSubNextTime = this.onPressSubNextTime.bind(this);
    this.onPressDebug = this.onPressDebug.bind(this);
    this.onPressDelete = this.onPressDelete.bind(this);
    this.onPressManageRoster = this.onPressManageRoster.bind(this);
    this.onPressRemoveSelectedSubs = this.onPressRemoveSelectedSubs.bind(this);
    this.onPressStart = this.onPressStart.bind(this);
    this.onPressStop = this.onPressStop.bind(this);
    this.onPressClearLineup = this.onPressClearLineup.bind(this);
    this.onPressAutomaticLineup = this.onPressAutomaticLineup.bind(this);
    this.onPressManageLineup = this.onPressManageLineup.bind(this);
    this.updateGame = this.updateGame.bind(this);
    this.onPressPlayer = this.onPressPlayer.bind(this);
    this.onPressCancel = this.onPressCancel.bind(this);
    this.onPressGameDetails = this.onPressGameDetails.bind(this);
    this.startOrStopGameTimer = this.startOrStopGameTimer.bind(this);
  }

  getInitialState() {
    const {gameTeamSeason} = this.props;
    const {
      timestamp,
      totalSeconds,
      gameSeconds,
      isGameOver,
    } = getCurrentTimeInfo(gameTeamSeason);
    const gameStatusInfo = getGameStatusInfo({
      gameTeamSeason,
    });
    const {
      isFormationSet
    } = gameStatusInfo;
    const state = {
      clockMultiplier: 1.0,
      isClockRunning: true,
      isGameOver,
      mode: isFormationSet ? modes.default : modes.lineup,
      totalSeconds,
      gameSeconds,
      timestamp,
      selectedLineup: null
    };
    return state;
  }

  componentDidMount() {
    this.startOrStopGameTimer();
    activateKeepAwake();
  }

  startOrStopGameTimer() {
    const {gameTeamSeason} = this.props;
    const gameStatusInfo = getGameStatusInfo({
      gameTeamSeason,
    });

    console.log(`gameStatusInfo`,gameStatusInfo);

    // If the game is in progress we need to update clocks every second
    if (gameStatusInfo.gameStatus === "IN_PROGRESS") {
      if (!this.state.updateGameTimer) {
        const updateGameTimer = setTimeout(this.updateGame, 0);
        this.setState({
          isClockRunning: true,
          updateGameTimer,
        });
      }
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
    deactivateKeepAwake();
  }

  onPressManageRoster() {
    this.setState((previousState) => {
      return {
        ...previousState,
        mode: previousState.mode === modes.roster ? modes.default : modes.roster,
      };
    });
  }

  onPressManageLineup() {
    this.setState((previousState) => {
      return {
        ...previousState,
        mode: previousState.mode === modes.lineup ? modes.default : modes.lineup,
      };
    });
  }

  onPressGameDetails() {
    const {gameTeamSeason, navigation} = this.props;
    navigation.navigate('GameDetails', { gameTeamSeasonId: gameTeamSeason.id });
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

  onPressAutomaticLineup(){
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

  onLineupChange(selectedLineup){
    this.setState((previousState) => {
      // console.log(`selectedLineup`, selectedLineup);
      return {
        ...previousState,
        selectedLineup,
      };
    });
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
    const {
      // timestamp,
      gameSeconds,
      totalSeconds,
    } = getCurrentTimeInfo(gameTeamSeason);
    const {selectionInfo} = this.state;
    if (!selectionInfo.selections || selectionInfo.selections.length !== 2) {
      console.error(`Must have two selections in onPressAddToLineup`);
      return;
    }
    const positionSnapshotFrom = _.find(selectionInfo.selections, (selection) => selection.playerId);
    const positionSnapshotTo = _.find(selectionInfo.selections, (selection) => !selection.playerId);
    const playerPositionAssignmentType = gameSeconds === 0 ? "INITIAL" : "IN";
    addToLineup(client, {
      gameTeamSeason,
      gameActivityType: gameSeconds === 0 ? "PLAN" : "OFFICIAL",
      gameActivityStatus: gameSeconds === 0 ? "PENDING" : "COMPLETED",
      gameSeconds,
      totalSeconds,
      positionSnapshotFrom,
      positionSnapshotTo,
      playerPositionAssignmentType,
    })
    .then(this.props.onSubsChange);
  }

  onPressRemoveFromLineup() {
    const {selectionInfo} = this.state;
    this.handleRemoveFromLineup(selectionInfo);
  }

  handleRemoveFromLineup(selectionInfo) {
    const {client, gameTeamSeason} = this.props;
    const {
      timestamp,
      gameSeconds,
      totalSeconds,
    } = getCurrentTimeInfo(gameTeamSeason);

    removeFromLineup(client, {
      gameTeamSeason,
      selectionInfo,
      totalSeconds,
      gameSeconds,
      timestamp,
    })
    .then(this.props.onSubsChange);
  }

  onPressDelete() {
    const {client, gameTeamSeason} = this.props;
    Alert.alert(
      'Are you sure?',
      'This game will be permanently deleted.',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {text: 'Yes, Delete', onPress: () => {
          console.log('Delete Pressed');
          deleteGameEtc(client, {
            gameTeamSeason
          })
          // .then(this.props.onSubsChange);
          .then(() => {
            this.props.navigation.navigate('Games');
          });
        }},
      ],
      {cancelable: true},
    );
  }

  onPressClearLineup() {
    const {
      gameTeamSeason,
      positionCategories
    } = this.props;
    const {
      timestamp,
      totalSeconds,
      gameSeconds,
    } = this.state;
    const gameStatusInfo = getGameStatusInfo({
      gameTeamSeason,
    });
    const {
      gameStatus,
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
      gameStatus,
    });
    const selectionInfo = getAllFieldPlayersSelectionInfo(gameSnapshot);
    this.handleRemoveFromLineup(selectionInfo);
  }

  onPressDebug() {
    const {
      gameTeamSeason,
      positionCategories
    } = this.props;
    const {
      timestamp,
      totalSeconds,
      gameSeconds,
    } = this.state;
    const gameStatusInfo = getGameStatusInfo({
      gameTeamSeason,
    });
    const {
      gameStatus,
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
      gameStatus,
    });
    console.log(`gameSnapshot`, gameSnapshot);
    // console.log(`gameTimeline`, gameTimeline);
    this.setState((previousState) => {
      return {
        ...previousState,
        mode: previousState.mode === modes.debug ? modes.default : modes.debug,
      };
    });
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

  getFlexValues(gameSnapshot, gamePlayers, multiplier) {
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
    const playerBasis = Math.floor(280 / (fieldFlex + benchFlex)) * multiplier;
    return {
      fieldFlex,
      benchFlex,
      playerBasis,
    };
  }

  getDynamicStyles(gameSnapshot, gamePlayers, multiplier) {
    const {benchFlex, fieldFlex, playerBasis} = this.getFlexValues(gameSnapshot, gamePlayers, multiplier);
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
      selectedLineup,
    } = this.state;
    const gameStatusInfo = getGameStatusInfo({
      gameTeamSeason,
    });
    const {
      gameStatus,
      gamePeriod,
      gameActivityType,
      gameActivityStatus,
      gameDurationSeconds,
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
      gameStatus,
    });
    const playersSelected = selectionInfo &&
      selectionInfo.selections &&
      selectionInfo.selections.length || 0;
    const multiplier = Dimensions.get('window').width / 450;
    const {benchStyles, fieldStyles, playerStyles} = this.getDynamicStyles(gameSnapshot, gamePlayers, multiplier);
    const teamSeasonId = gameTeamSeason.teamSeason.id;
    return (
      <View style={styles.screen}>
        {this.state.mode === modes.debug && (
          <ScrollView>
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
          </ScrollView>
        )}
        {this.state.mode === modes.roster && (
          <Roster
            gameRoster={gamePlayers}
          />
        )}
        {this.state.mode === modes.default && (
        <GameHeader
          style={styles.gameHeader}
          gameSeconds={gameSeconds}
          gameTeamSeason={gameTeamSeason}
        />)}
        {this.state.mode === modes.lineup && (
        <Lineup
          gameSeconds={gameSeconds}
          gamePlan={gamePlan}
          gamePlayers={gamePlayers}
          gameSnapshot={gameSnapshot}
          isGameOver={this.state.isGameOver}
          multiplier={multiplier}
          positionCategories={positionCategories}
          styles={styles}
          benchStyles={benchStyles}
          fieldStyles={fieldStyles}
          playerStyles={playerStyles}
          teamSeasonId={teamSeasonId}
          selectedLineup={selectedLineup}
        />)}
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
                  .map((positionSnapshot, positionSnapshotIndex) => {
                    const gamePlayer = _.find(gamePlayers, (gamePlayer) =>
                      gamePlayer.player.id === positionSnapshot.playerId &&
                      !playerIsOnBench(gamePlayer.player.id, gameSnapshot, gamePlayer.availability));
                    const playerId = gamePlayer && gamePlayer.player.id;
                    return (
                      <Player
                        key={positionSnapshotIndex}
                        style={playerStyles}
                        position={positionSnapshot.event.position}
                        positionCategory={category}
                        player={gamePlayer && gamePlayer.player}
                        gamePlan={gamePlan}
                        gamePlayers={gamePlayers}
                        gameSeconds={gameSeconds}
                        isGameOver={this.state.isGameOver}
                        multiplier={multiplier}
                        playerStats={gameSnapshot.players[playerId]}
                        pendingMove={gameSnapshot.players[playerId] && gameSnapshot.players[playerId].pendingMove}
                        piePieces={gameSnapshot.players[playerId] && gameSnapshot.players[playerId].piePieces}
                        playerDisplayMode={getPlayerDisplayMode(positionSnapshot, this.state)}
                        onPress={() => this.onPressPlayer(positionSnapshot, {gameSnapshot})}
                      />
                    );
                  })
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
                  .filter((gamePlayer) => playerIsOnBench(gamePlayer.player.id, gameSnapshot, gamePlayer.availability))
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
                      isGameOver={this.state.isGameOver}
                      multiplier={multiplier}
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
            {this.state.mode === modes.lineup && (
              <ChooseLineup
                onLineupChange={this.onLineupChange}
                selectedLineup={selectedLineup}
                teamSeasonId={teamSeasonId}
              />
            )}
            {this.state.mode === modes.default &&
              playersSelected === 0 && (
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={Math.min(7200, gameDurationSeconds)}
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
              value={gameSeconds}
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
                {gamePeriod &&
                  gameStatus === "IN_PROGRESS" &&
                  gameActivityType === "OFFICIAL" &&
                  gameActivityStatus === "STOPPED" &&
                  <Button
                    style={styles.button}
                    onPress={this.onPressClearLineup}
                    title="Clear Lineup"
                  />
                }
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
                  onPress={this.onPressGameDetails}
                  title="Edit"
                />
                <Button
                  style={styles.button}
                  onPress={this.onPressManageLineup}
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
                {canRemoveFromLineup(selectionInfo) &&
                  <Button
                    style={styles.button}
                    onPress={this.onPressRemoveFromLineup}
                    title="Remove from lineup"
                  />
                }
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

const modes = {
  "default": "default",
  debug: "debug",
  roster: "roster",
  lineup: "lineup",
};

// let CIRCLE_RADIUS = 30;
let styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameHeader: {
    flex: 1,
    width: '100%',
  },
  park: {
    flex: 12,
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
    flex: 3,
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
    margin: 3,
    //height: 30,
  },
  instructions: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
});
