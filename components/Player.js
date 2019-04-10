import React from 'react'
import CirclePie from '../components/CirclePie'
import ColoredTextBox from '../components/ColoredTextBox'
import PendingMoveArrow from '../components/PendingMoveArrow'
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
    const {cumulativeInGameSeconds, pendingMove, piePieces} = this.props.playerStats;
    const playTime = moment.utc(cumulativeInGameSeconds*1000).format("m:ss") || "0:00";
    const colors = this.props.player.positionCategoryPreferencesAsPlayer &&
    this.props.player.positionCategoryPreferencesAsPlayer.length &&
    _.map(this.props.player.positionCategoryPreferencesAsPlayer, (positionCategoryPreference) =>
      positionCategoryPreference.positionCategory.color)
    || ["gray"];
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
          {pendingMove &&
            <View
              style={styles.arrowAndCountdown}
            >
              <PendingMoveArrow
                style={styles.arrow}
                percent={pendingMove.percentToMove}
                color={pendingMove.color}
              />
              <Text style={styles.pendingMoveTime}>
                {pendingMove.pendingMoveTime}
              </Text>
            </View>
          }
        </View>
        <ColoredTextBox
          style={styles.playerName}
          colors={colors}
          text={this.props.player && this.props.player.name}
        />
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
