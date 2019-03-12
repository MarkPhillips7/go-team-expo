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
    let gameTimeSeconds = this.props.gameSeconds;
    let percentToMove;
    let pendingMoveTime = "";
    console.log(`gameDurationSeconds = ${this.props.gameDurationSeconds},gameStartTime=${this.props.gameStartTime}`);
    // const piePieces =
    // this.props.gameDurationSeconds &&
    // this.props.gameStartTime &&
    // this.props.gamePlan &&
    // this.props.gamePlan.assignmentsList &&
    // _.chain(this.props.gamePlan.assignmentsList)
    // .filter((assignments) => assignments.startTime)
    // .map((assignments) => {

      // const assignment = this.props.player && _.find(this.props.currentLineup, (_assignment) =>
      //   _assignment.playerPosition.player.id === this.props.player.id);

      // const startSecondsSinceGameStart =
      //   moment(assignments.startTime).diff(this.props.gameStartTime) / 1000.0;
      // const endTime = assignments.endTime || this.props.currentGameTime;
      // const endSecondsSinceGameStart = moment(endTime).diff(this.props.gameStartTime) / 1000.0;
      // const totalSeconds = Math.max(this.props.gameDurationSeconds, endSecondsSinceGameStart);
      // const startValue = startSecondsSinceGameStart / totalSeconds;
      // const endValue = endSecondsSinceGameStart / totalSeconds;
      // if (assignment.position !== specialPositions.unavailable &&
      // assignment.position !== specialPositions.substitute) {
      //   gameTimeSeconds += endSecondsSinceGameStart - startSecondsSinceGameStart;
      // }
      // const pendingMoveSeconds = this.props.gamePlan.secondsBetweenSubs - (endSecondsSinceGameStart - startSecondsSinceGameStart);
      // pendingMoveTime = moment.utc(pendingMoveSeconds*1000).format("m:ss") || "0:00";
      // percentToMove = (endSecondsSinceGameStart - startSecondsSinceGameStart) / this.props.gamePlan.secondsBetweenSubs * 100;
    // const piePieces = [ {
    //     color: this.props.positionCategory.color,
    //     startValue: 0,
    //     endValue: 0,
    //   }
    // ];
    const piePieces = this.props.piePieces;
    const playTime = moment.utc(gameTimeSeconds*1000).format("m:ss") || "0:00";
    const playerNameStyle = {
      ...styles.playerName,
      backgroundColor: this.props.player.positionCategoryPreferencesAsPlayer &&
      this.props.player.positionCategoryPreferencesAsPlayer.length &&
      this.props.player.positionCategoryPreferencesAsPlayer[0].positionCategory.color || "gray",
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
            player={this.props.player}
            radius={30}
            piePieces={piePieces}
            positionColor={this.props.positionCategory.color}
          />
          {this.props.pendingMove &&
            <View
              style={styles.arrowAndCountdown}
            >
              <PendingMoveArrow
                style={styles.arrow}
                percent={this.props.pendingMove.percentToMove}
                color={this.props.pendingMove.color}
              />
              <Text style={styles.pendingMoveTime}>
                {this.props.pendingMove.pendingMoveTime}
              </Text>
            </View>
          }
        </View>
        <Text style={playerNameStyle}>
          {this.props.player && this.props.player.name}
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
