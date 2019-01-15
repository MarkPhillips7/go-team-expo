import React from 'react'
import CirclePie from '../components/CirclePie'
import PendingMoveArrow from '../components/PendingMoveArrow'
// import {ART} from 'react-native'
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import _ from 'lodash';
import moment from 'moment';
import {
  specialPositions,
} from '../constants/Soccer';

export default class Player extends React.Component {
  render() {
    // const playTime = this.props.currentGameTime &&
    // this.props.gameStartTime &&
    // moment.utc(moment(this.props.currentGameTime).diff(this.props.gameStartTime)).format("mm:ss") || "";
    let gameTimeSeconds = 0;
    let percentToMove;
    let pendingMoveTime = "";
    const piePieces =
    this.props.gameDurationSeconds &&
    this.props.gameStartTime &&
    this.props.gamePlan &&
    this.props.gamePlan.assignmentsList &&
    _.chain(this.props.gamePlan.assignmentsList)
    .filter((assignments) => assignments.startTime)
    .map((assignments) => {
      const assignment = _.find(assignments.assignments, (_assignment) => _assignment.gamePlayer === this.props.gamePlayer);
      const startSecondsSinceGameStart =
        moment(assignments.startTime).diff(this.props.gameStartTime) / 1000.0;
      const endTime = assignments.endTime || this.props.currentGameTime;
      const endSecondsSinceGameStart = moment(endTime).diff(this.props.gameStartTime) / 1000.0;
      const totalSeconds = Math.max(this.props.gameDurationSeconds, endSecondsSinceGameStart);
      const startValue = startSecondsSinceGameStart / totalSeconds;
      const endValue = endSecondsSinceGameStart / totalSeconds;
      if (assignment.position !== specialPositions.unavailable &&
      assignment.position !== specialPositions.substitute) {
        gameTimeSeconds += endSecondsSinceGameStart - startSecondsSinceGameStart;
      }
      const pendingMoveSeconds = this.props.gamePlan.secondsBetweenSubs - (endSecondsSinceGameStart - startSecondsSinceGameStart);
      pendingMoveTime = moment.utc(pendingMoveSeconds*1000).format("m:ss") || "0:00";
      percentToMove = (endSecondsSinceGameStart - startSecondsSinceGameStart) / this.props.gamePlan.secondsBetweenSubs * 100;
      return {
        color: assignment.position.positionCategory.color,
        startValue,
        endValue,
      }
    })
    .value()
    || [];
    const nextAssignments =
    this.props.gameDurationSeconds &&
    this.props.gameStartTime &&
    this.props.gamePlan &&
    this.props.gamePlan.assignmentsList &&
    _.find(this.props.gamePlan.assignmentsList, (assignments) => !assignments.startTime);
    const nextAssignment = nextAssignments &&
    _.find(nextAssignments.assignments, (_assignment) => _assignment.gamePlayer === this.props.gamePlayer);
    const playTime = moment.utc(gameTimeSeconds*1000).format("m:ss") || "0:00";
    const playerNameStyle = {
      ...styles.playerName,
      backgroundColor: this.props.gamePlayer.player.positionCategoryPreferencesAsPlayer &&
      this.props.gamePlayer.player.positionCategoryPreferencesAsPlayer.length &&
      this.props.gamePlayer.player.positionCategoryPreferencesAsPlayer[0].positionCategory.color || "gray",
    };
    return (
      <View
        style={this.props.style}
      >
        <Text style={styles.playTime}>
          {playTime}
        </Text>
        <View
          style={styles.pieAndArrow}
        >
          <CirclePie
            player={this.props.gamePlayer}
            radius={30}
            piePieces={piePieces}
            positionColor={this.props.position.positionCategory.color}
          />
          {nextAssignment && nextAssignment.position !== this.props.position &&
            <View
              style={styles.arrowAndCountdown}
            >
              <PendingMoveArrow
                style={styles.arrow}
                percent={percentToMove}
                color={nextAssignment.position.positionCategory.color}
              />
              <Text style={styles.pendingMoveTime}>
                {pendingMoveTime}
              </Text>
            </View>
          }
        </View>
        <Text style={playerNameStyle}>
          {this.props.gamePlayer && this.props.gamePlayer.player.name}
        </Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  playerName: {
    fontSize: 13,
    color: 'white',
    lineHeight: 16,
    textAlign: 'center',
    margin: 3,
    padding: 3,
  },
  playTime: {
    fontSize: 14,
    color: 'black',
    lineHeight: 16,
    textAlign: 'center',
  },
  pendingMoveTime: {
    fontSize: 12,
    color: 'black',
    lineHeight: 16,
    textAlign: 'center',
    width: 30,
  },
  arrow: {
    height: 20,
    width: 20,
    margin: 3,
  },
  pieAndArrow: {
    height: 60,
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowAndCountdown: {
    flexDirection: "column",
    alignItems: 'center',
    justifyContent: 'center',
  },
});
