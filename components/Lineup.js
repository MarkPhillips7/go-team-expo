import React from 'react';
import {PropTypes} from 'prop-types';
import { View } from 'react-native';
import FormationLine from '../components/FormationLine';
import Player from '../components/Player';
import _ from 'lodash';
import {
  getDynamicStylesForFormation,
  getPlayerDisplayMode,
} from '../helpers/game';
import {
  playerAvailability,
} from '../constants/Soccer';

export default class Lineup extends React.Component {
  static propTypes = {
    gameState: PropTypes.object,
    gameSnapshot: PropTypes.object,
    gamePlan: PropTypes.object,
    gamePlayers: PropTypes.array,
    multiplier: PropTypes.number,
    positionCategories: PropTypes.array,
    onPressPlayer: PropTypes.func.isRequired,
    styles: PropTypes.object,
    selectedLineup: PropTypes.object,
  }

  render() {
    const {
      gamePlan,
      gamePlayers,
      gameSnapshot,
      gameState,
      multiplier,
      onPressPlayer,
      positionCategories,
      selectedLineup,
      styles,
    } = this.props;
    const {
      gameSeconds,
      isGameOver,
    } = gameState;
    const formation = selectedLineup && selectedLineup.formation;
    const {benchStyles, fieldStyles, playerStyles} = getDynamicStylesForFormation(formation, multiplier, styles);
    // console.log(selectedLineup);
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
                _.chain(selectedLineup && selectedLineup.formation && selectedLineup.formation.positions)
                .filter((position) => position.positionCategory.name === category.name)
                .sortBy((position) => position.leftToRightPercent)
                .map((position, positionIndex) => {
                  const playerPosition = _.find(selectedLineup.playerPositions, (playerPosition) => playerPosition.position.id == position.id);
                  const gamePlayer = playerPosition && _.find(gamePlayers, (gamePlayer) =>
                    gamePlayer.availability !== playerAvailability.unavailable &&
                    gamePlayer.player.id === playerPosition.player.id);
                  const playerId = gamePlayer && gamePlayer.player.id;
                  const positionSnapshot = _.find(gameSnapshot.positions, (positionSnapshot) => positionSnapshot.playerId && positionSnapshot.playerId == playerId)
                    || {
                      playerId,
                      event: {
                        position
                      }
                    };
                  return (
                    <Player
                      key={positionIndex}
                      style={playerStyles}
                      position={position}
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
                .filter((gamePlayer) => gamePlayer.availability !== playerAvailability.unavailable && selectedLineup &&
                  !_.find(selectedLineup.playerPositions, (playerPosition) => playerPosition.player.id == gamePlayer.player.id))
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
}//);
