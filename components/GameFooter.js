import React, {Fragment} from 'react';
import {PropTypes} from 'prop-types';
import { Slider, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-elements';
import ChooseLineup from '../components/ChooseLineup';
import moment from 'moment';
import {
  canApplyPlannedSubstitution,
  canRemoveFromLineup,
  canRemoveSelectedSubs,
  canSetLineup,
  canSubstitute,
} from '../helpers/game';
import {gameManagerModes} from '../constants/Game';
const millisecondsBeforeSliderAction = 500;

export default class GameFooter extends React.Component {
  static propTypes = {
    gameTeamSeason: PropTypes.object.isRequired,
    gameState: PropTypes.object,
    gameStatusInfo: PropTypes.object.isRequired,
    onLineupChange: PropTypes.func.isRequired,
    onPressStart: PropTypes.func.isRequired,
    onPressStop: PropTypes.func.isRequired,
    onPressSubNow: PropTypes.func.isRequired,
    onPressClearLineup: PropTypes.func.isRequired,
    onPressAutoSubs: PropTypes.func.isRequired,
    onSliderMove: PropTypes.func.isRequired,
    onPressDelete: PropTypes.func.isRequired,
    onPressDebug: PropTypes.func.isRequired,
    onPressGameDetails: PropTypes.func.isRequired,
    onPressManageLineup: PropTypes.func.isRequired,
    onPressCancel: PropTypes.func.isRequired,
    onPressRemoveFromLineup: PropTypes.func.isRequired,
    onPressSubNextTime: PropTypes.func.isRequired,
    onPressRemoveSelectedSubs: PropTypes.func.isRequired,
    onPressAddToLineup: PropTypes.func.isRequired,
  }

  render() {
    const {
      gameState,
      gameStatusInfo,
      gameTeamSeason,
      onLineupChange,
      onPressStart,
      onPressStop,
      onPressSubNow,
      onPressClearLineup,
      onPressAutoSubs,
      onSliderMove,
      onPressDelete,
      onPressDebug,
      onPressGameDetails,
      onPressManageLineup,
      onPressCancel,
      onPressRemoveFromLineup,
      onPressSubNextTime,
      onPressRemoveSelectedSubs,
      onPressAddToLineup,
    } = this.props;
    const {
      gameSeconds,
      selectionInfo,
      selectedLineup,
    } = gameState;
    const {
      gameStatus,
      gamePeriod,
      gameActivityType,
      gameActivityStatus,
      gameDurationSeconds,
    } = gameStatusInfo;
    const playersSelected = selectionInfo &&
      selectionInfo.selections &&
      selectionInfo.selections.length || 0;
    const teamSeasonId = gameTeamSeason.teamSeason.id;
    return (
      <View style={styles.inputArea}>
        <View style={styles.instructions}>
          {playersSelected === 1 && (
            <Text>
              Select another player for substitution
            </Text>
          )}
        </View>
        <View style={styles.buttons}>
          {gameState.mode === gameManagerModes.lineup && (
            <ChooseLineup
              onLineupChange={onLineupChange}
              selectedLineup={selectedLineup}
              teamSeasonId={teamSeasonId}
            />
          )}
          {gameState.mode === gameManagerModes.default &&
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
                setTimeout(() => onSliderMove(gameSeconds), millisecondsBeforeSliderAction);
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
                  onPress={onPressStart}
                  title={`Start ${gamePeriod.name}`}
                />
              }
              {gamePeriod &&
                (gameStatus === "IN_PROGRESS" &&
                gameActivityType === "OFFICIAL" &&
                gameActivityStatus === "IN_PROGRESS") &&
                <Button
                  style={styles.button}
                  onPress={onPressStop}
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
                  onPress={onPressSubNow}
                  title="Sub Now"
                />
              }
              {gamePeriod &&
                gameStatus === "IN_PROGRESS" &&
                gameActivityType === "OFFICIAL" &&
                gameActivityStatus === "STOPPED" &&
                <Button
                  style={styles.button}
                  onPress={onPressClearLineup}
                  title="Clear Lineup"
                />
              }
              <Button
                style={styles.button}
                onPress={onPressAutoSubs}
                title="Auto Subs"
              />
              <Button
                style={styles.button}
                onPress={onPressDelete}
                title="Delete"
              />
              <Button
                style={styles.button}
                onPress={onPressDebug}
                title="Debug"
              />
              <Button
                style={styles.button}
                onPress={onPressGameDetails}
                title="Edit"
              />
              <Button
                style={styles.button}
                onPress={onPressManageLineup}
                title="Lineup"
              />
            </Fragment>
          )}
          {playersSelected > 0 && (
            <Fragment>
              <Button
                style={styles.button}
                onPress={onPressDelete}
                title="Delete"
              />
              <Button
                style={styles.button}
                onPress={onPressCancel}
                title="Cancel"
              />
              {canRemoveFromLineup(selectionInfo) &&
                <Button
                  style={styles.button}
                  onPress={onPressRemoveFromLineup}
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
                  onPress={onPressSubNow}
                  title="Sub Now"
                />
              )}
              {canSubstitute({selectionInfo, gameActivityType: "PLAN"}) && (
                <Button
                  style={styles.button}
                  onPress={onPressSubNextTime}
                  title="Sub Next Time"
                />
              )}
              {canRemoveSelectedSubs(selectionInfo) && (
                <Button
                  style={styles.button}
                  onPress={onPressRemoveSelectedSubs}
                  title="Remove Selected Sub"
                />
              )}
              {canSetLineup(selectionInfo) && (
                <Button
                  style={styles.button}
                  onPress={onPressAddToLineup}
                  title="Add to Lineup"
                />
              )}
            </Fragment>
          )}
        </View>
      </View>
    );
  }
}

let styles = StyleSheet.create({
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
