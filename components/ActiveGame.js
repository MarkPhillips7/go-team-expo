import React from 'react';
import {PropTypes} from 'prop-types';
import { View } from 'react-native';
import FormationLine from '../components/FormationLine';
import Player from '../components/Player';
import _ from 'lodash';
import {
  getDynamicStylesForFormation,
  getPlayerDisplayMode,
  playerIsOnBench,
} from '../helpers/game';

export default class ActiveGame extends React.Component {
  static propTypes = {
    gameState: PropTypes.object,
    gameSnapshot: PropTypes.object,
    gamePlan: PropTypes.object,
    gameTeamSeason: PropTypes.object,
    gamePlayers: PropTypes.array,
    multiplier: PropTypes.number,
    positionCategories: PropTypes.array,
    onPressPlayer: PropTypes.func.isRequired,
    styles: PropTypes.object,
  }

  render() {
    const {
      gamePlan,
      gamePlayers,
      gameSnapshot,
      gameState,
      multiplier,
      gameTeamSeason,
      onPressPlayer,
      positionCategories,
      styles,
    } = this.props;
    if (!gameTeamSeason) {
      return <View></View>;
    }
    const {
      gameSeconds,
      isGameOver,
    } = gameState;
    const {benchStyles, fieldStyles, playerStyles} = getDynamicStylesForFormation(gameSnapshot.formation, multiplier, styles);
    return (
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
                      isGameOver={isGameOver}
                      multiplier={multiplier}
                      playerStats={gameSnapshot.players[playerId]}
                      pendingMove={gameSnapshot.players[playerId] && gameSnapshot.players[playerId].pendingMove}
                      piePieces={gameSnapshot.players[playerId] && gameSnapshot.players[playerId].piePieces}
                      playerDisplayMode={getPlayerDisplayMode(positionSnapshot, gameState)}
                      onPress={() => onPressPlayer(positionSnapshot, {gameSnapshot})}
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
                    isGameOver={isGameOver}
                    multiplier={multiplier}
                    playerStats={gameSnapshot.players[gamePlayer.player.id]}
                    pendingMove={gameSnapshot.players[gamePlayer.player.id].pendingMove}
                    piePieces={gameSnapshot.players[gamePlayer.player.id].piePieces}
                    playerDisplayMode={getPlayerDisplayMode({playerId:gamePlayer.player.id}, gameState)}
                    onPress={() => onPressPlayer({playerId:gamePlayer.player.id}, {gameSnapshot})}
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
    );
  }
}
