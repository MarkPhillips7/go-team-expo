import React from 'react';
import {PropTypes} from 'prop-types';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from 'react-native-elements';

export default class DebugGame extends React.Component {
  static propTypes = {
    gameState: PropTypes.object,
  }

  render() {
    const {gameState} = this.props;
    return (
      <ScrollView>
        <Text>
          gameDurationSeconds {gameState && gameState.gameDurationSeconds}
        </Text>
        <Text>
          isGameOver {gameState && gameState.isGameOver}
        </Text>
        <Button
          style={styles.button}
          onPress={() => {
            console.log(JSON.stringify(gameState));
          }}
          title="State"
        />
      </ScrollView>
    )
  }
}

let styles = StyleSheet.create({
  button: {
    margin: 3,
  },
});
