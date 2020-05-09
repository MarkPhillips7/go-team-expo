import React from 'react';
import {PropTypes} from 'prop-types';
import { Alert, Dimensions, StyleSheet, View } from 'react-native';
import {withApollo} from 'react-apollo';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import GameHeader from '../components/GameHeader';
import GameFooter from '../components/GameFooter';
import DebugGame from '../components/DebugGame';
import Lineup from '../components/Lineup';
import ActiveGame from '../components/ActiveGame';
import Roster from '../components/Roster';
import moment from 'moment';
import _ from 'lodash';
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
  getAllFieldPlayersSelectionInfo,
  getCurrentTimeInfo,
  getCancelPressedSelectionInfo,
  getGamePeriodAfter,
  getGameTimeline,
  getGameSnapshot,
  getGameStatusInfo,
  getNextPlannedSubstitution,
  getPlayerPressedSelectionInfo,
  selectionsPartOfPlannedSubstitution,
} from '../helpers/game';
import {
  addToSelectedLineup,
} from '../helpers/lineup';
import {gameManagerModes} from '../constants/Game';
const millisecondsBeforeSliderAction = 500;

export default withApollo(
class GameManager extends React.Component {
  static propTypes = {
    gameDefinition: PropTypes.object,
    gameTeamSeasonId: PropTypes.string.isRequired,
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
      isClockRunning: true,
      isGameOver,
      mode: isFormationSet ? gameManagerModes.default : gameManagerModes.lineup,
      totalSeconds,
      gameSeconds,
      timestamp,
      selectedLineup: null,
      selectionInfo: undefined
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

    // If the game is in progress we need to update clock every second
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
        mode: previousState.mode === gameManagerModes.roster ? gameManagerModes.default : gameManagerModes.roster,
      };
    });
  }

  onPressManageLineup() {
    this.setState((previousState) => {
      return {
        ...previousState,
        mode: previousState.mode === gameManagerModes.lineup ? gameManagerModes.default : gameManagerModes.lineup,
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
    const {client, gamePlayers, gameTeamSeason} = this.props;
    const {mode, selectedLineup} = this.state;
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
    if (mode === gameManagerModes.lineup) {
      const newSelectedLineup = addToSelectedLineup({
        gamePlayers,
        selectedLineup,
        positionSnapshotFrom,
        positionSnapshotTo,
      });
      this.setState((previousState) => {
        return {
          ...previousState,
          selectedLineup: newSelectedLineup,
          selectionInfo: undefined
        };
      });
    } else {
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
        mode: previousState.mode === gameManagerModes.debug ? gameManagerModes.default : gameManagerModes.debug,
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

  render() {
    const {
      gamePlan,
      gamePlayers,
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
      selectedLineup,
    } = this.state;
    const gameStatusInfo = getGameStatusInfo({
      gameTeamSeason,
    });
    const {
      gameStatus,
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
    const multiplier = Dimensions.get('window').width / 450;
    return (
      <View style={styles.screen}>
        {this.state.mode === gameManagerModes.debug && (
          <DebugGame
            gameState={this.state}
          />
        )}
        {this.state.mode === gameManagerModes.roster && (
          <Roster
            gameRoster={gamePlayers}
          />
        )}
        {(this.state.mode === gameManagerModes.default ||
          this.state.mode === gameManagerModes.lineup) && (
          <GameHeader
            gameSeconds={gameSeconds}
            gameTeamSeason={gameTeamSeason}
          />
        )}
        {this.state.mode === gameManagerModes.lineup && (
        <Lineup
          gameState={this.state}
          gameSnapshot={gameSnapshot}
          gamePlan={gamePlan}
          gamePlayers={gamePlayers}
          multiplier={multiplier}
          positionCategories={positionCategories}
          onPressPlayer={this.onPressPlayer}
          styles={styles}
          selectedLineup={selectedLineup}
        />)}
        {this.state.mode === gameManagerModes.default && (
        <ActiveGame
          gameState={this.state}
          gameSnapshot={gameSnapshot}
          gamePlan={gamePlan}
          gameTeamSeason={gameTeamSeason}
          gamePlayers={gamePlayers}
          multiplier={multiplier}
          positionCategories={positionCategories}
          onPressPlayer={this.onPressPlayer}
          styles={styles}
        />
        )}
        <GameFooter
          gameState={this.state}
          gameStatusInfo={gameStatusInfo}
          gameTeamSeason={gameTeamSeason}
          onLineupChange={this.onLineupChange}
          onPressStart={this.onPressStart}
          onPressStop={this.onPressStop}
          onPressSubNow={this.onPressSubNow}
          onPressClearLineup={this.onPressClearLineup}
          onPressAutoSubs={this.onPressAutoSubs}
          onSliderMove={this.onSliderMove}
          onPressDelete={this.onPressDelete}
          onPressDebug={this.onPressDebug}
          onPressGameDetails={this.onPressGameDetails}
          onPressManageLineup={this.onPressManageLineup}
          onPressCancel={this.onPressCancel}
          onPressRemoveFromLineup={this.onPressRemoveFromLineup}
          onPressSubNextTime={this.onPressSubNextTime}
          onPressRemoveSelectedSubs={this.onPressRemoveSelectedSubs}
          onPressAddToLineup={this.onPressAddToLineup}
        />
      </View>
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
  },
  button: {
    margin: 3,
  },
});
