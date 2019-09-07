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
      gameTimeframeSummary,
    } = getGameStatusInfo({
      gameTeamSeason,
    });
    const gameTimeMoment = moment.utc(gameSeconds*1000);
    // For soccer we should display 87:45 instead of 1:27:45
    const gameTime = `${gameTimeMoment.hours() * 60 + gameTimeMoment.minutes()}:${gameTimeMoment.format("ss")}` || "0:00";

    return (
      <View style={styles.gameHeader}>
        {gameTeamSeason && gameTeamSeason.game && <Text>{gameTeamSeason.game.name}</Text>}
        <Text style={styles.gameTime}>{gameTime}</Text>
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
  gameTime: {
    fontSize: 19,
  }
});
