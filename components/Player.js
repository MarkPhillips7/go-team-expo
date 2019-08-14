import React from 'react'
import {PropTypes} from 'prop-types';
import CirclePie from '../components/CirclePie'
import ColoredTextBox from '../components/ColoredTextBox'
import PendingMoveArrow from '../components/PendingMoveArrow'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import _ from 'lodash';
import moment from 'moment';

export default class Player extends React.Component {
  static propTypes = {
    playerStats: PropTypes.object,
    player: PropTypes.object,
    style: PropTypes.object.isRequired,
    onPress: PropTypes.func.isRequired,
    playerDisplayMode: PropTypes.object.isRequired,
    positionCategory: PropTypes.object.isRequired,
  };
  render() {
    const applyMultiplier = (styleObject, multiplier) => {
      const newStyleObject = {...styleObject};
      _.each(["fontSize","lineHeight", "height", "width"], (style) => {
        if (newStyleObject[style]) {
          newStyleObject[style]  = newStyleObject[style] * multiplier;
        }
      });
      return newStyleObject;
    };
    const {cumulativeInGameSeconds, pendingMove, piePieces} = this.props.playerStats || {cumulativeInGameSeconds:0};
    const playTime = moment.utc(cumulativeInGameSeconds*1000).format("m:ss") || "0:00";
    const colors = this.props.player &&
    this.props.player.positionCategoryPreferencesAsPlayer &&
    this.props.player.positionCategoryPreferencesAsPlayer.length &&
    _.map(this.props.player.positionCategoryPreferencesAsPlayer, (positionCategoryPreference) =>
      positionCategoryPreference.positionCategory.color)
    || ["gray"];
    return (
      <TouchableOpacity
        style={this.props.style}
        onPress={this.props.onPress}
      >
        {this.props.player && this.props.player.name &&
          <Text style={applyMultiplier(styles.playTime, this.props.playerDisplayMode.multiplier)}>
            {playTime}
          </Text>
        }
        {
          // why pointerEvents: https://github.com/react-native-community/react-native-svg/issues/794
        }
        <View
          pointerEvents="none"
          style={applyMultiplier(styles.pieAndArrow, this.props.playerDisplayMode.multiplier)}
        >
          <CirclePie
            player={this.props.player}
            circleDisplayMode={this.props.playerDisplayMode}
            piePieces={piePieces}
            positionColor={this.props.positionCategory.color}
          />
          {pendingMove &&
            <View
              style={applyMultiplier(styles.arrowAndCountdown, this.props.playerDisplayMode.multiplier)}
            >
              <PendingMoveArrow
                style={applyMultiplier(styles.arrow, this.props.playerDisplayMode.multiplier)}
                percent={pendingMove.percentToMove}
                color={pendingMove.color}
              />
              <Text style={applyMultiplier(styles.pendingMoveTime, this.props.playerDisplayMode.multiplier)}>
                {pendingMove.pendingMoveTime}
              </Text>
            </View>
          }
        </View>
        {this.props.player && this.props.player.name &&
          <ColoredTextBox
            style={applyMultiplier(styles.playerName, this.props.playerDisplayMode.multiplier)}
            colors={colors}
            text={this.props.player && this.props.player.name || ""}
          />
        }
      </TouchableOpacity>
    );
  }
}

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
    textAlign: 'left',
    width: 28,
  },
  arrow: {
    height: 18,
    width: 18,
    marginBottom: 3,
  },
  pieAndArrow: {
    height: 65,
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
