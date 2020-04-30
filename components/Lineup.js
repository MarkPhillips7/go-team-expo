import React from 'react';
import {PropTypes} from 'prop-types';
import { View } from 'react-native';
import FormationLine from '../components/FormationLine';
import Player from '../components/Player';
import _ from 'lodash';
// import {withApollo} from 'react-apollo';
import {
  getPlayerDisplayMode,
} from '../helpers/game';
import {
  playerAvailability,
} from '../constants/Soccer';

export default //withApollo(
class Lineup extends React.Component {
  static propTypes = {
    gameSnapshot: PropTypes.object,
    gamePlan: PropTypes.object,
    gamePlayers: PropTypes.array,
    gameSeconds: PropTypes.number,
    isGameOver: PropTypes.bool,
    multiplier: PropTypes.number,
    positionCategories: PropTypes.array,
    // onLineupChange: PropTypes.func.isRequired,
    styles: PropTypes.object,
    benchStyles: PropTypes.object,
    fieldStyles: PropTypes.object,
    playerStyles: PropTypes.object,
    selectedLineup: PropTypes.object,
  }

  constructor(props) {
    super(props);
    // Don't call this.setState() here!
    this.state = {}//this.getInitialState();

    this.onPressPlayer = this.onPressPlayer.bind(this);
  }

  onPressPlayer() {//(positionSnapshot, {gameSnapshot}) {
    // this.setState((previousState) => {
    //   const {gameTeamSeason} = this.props;
    //   const selectionInfo = getPlayerPressedSelectionInfo(previousState, positionSnapshot, {gameTeamSeason, gameSnapshot});
    //   return {
    //     ...previousState,
    //     selectionInfo,
    //   };
    // });
  }

  render() {
    const {
      styles,
      playerStyles,
      gameSeconds,
      gamePlan,
      gamePlayers,
      gameSnapshot,
      isGameOver,
      multiplier,
      positionCategories,
      selectedLineup,
    } = this.props;
    const benchStyles = {
      ...styles.bench,
      flex: 1,
    };
    const fieldStyles = {
      ...styles.field,
      flex: 3,
    };
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
                  const positionSnapshot = _.find(gameSnapshot.positions, (positionSnapshot) => positionSnapshot.playerId == playerId)
                    || {playerId};
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
                      playerDisplayMode={getPlayerDisplayMode(positionSnapshot, this.state)}
                      onPress={() => this.onPressPlayer(positionSnapshot, {gameSnapshot})}
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
                    playerDisplayMode={getPlayerDisplayMode({playerId:gamePlayer.player.id}, this.state)}
                    onPress={() => this.onPressPlayer({playerId:gamePlayer.player.id}, {gameSnapshot})}
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
