import React, {
    Component
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {PropTypes} from 'prop-types';
import moment from 'moment';
import {
  getGameStatusInfo,
} from '../helpers/game';

export default class GameHeader extends Component {
  static propTypes = {
    gameTeamSeason: PropTypes.object.isRequired,
    gameSeconds: PropTypes.number.isRequired,
  }

  render() {
    const {
      gameSeconds,
      gameTeamSeason
    } = this.props;
    const {
      gameStatus,
      gameTimeframeSummary,
    } = getGameStatusInfo({
      gameTeamSeason,
    });
    const gameTime = moment.utc(gameSeconds*1000).format("m:ss") || "0:00";

    return (
      <View style={styles.gameHeader}>
        <Text>{gameTime}</Text>
        <Text>{gameTimeframeSummary}</Text>
      </View>
    );
  }
}

let styles = StyleSheet.create({
  gameHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    height: '100%',
    width: '100%',
  },
});
