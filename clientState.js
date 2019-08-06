import gql from 'graphql-tag';

export const defaults = {
  isConnected: true,
  gameState: {
    // __typename: 'GameTeamSeason',
    clockMultiplier: 5.0,
    // currentGameTime: undefined,
    // gameDurationSeconds: 50.0*60,
    // gameStartTime: undefined,
    // gamePlan: undefined,
    // // gameRoster: this.props.gamePlayers || [],
    // gamePositions: this.getGamePositions(this.props.gamePlayers || []),
    // // assignmentsHistory: [],
    isClockRunning: false,
    // isGameOver: false,
    mode: "default"
  },
};

export const typeDefs = `
  type Mutation {
    updateClockMultiplier(clockMultiplier: Float!): Float
  }
  type Query {
    getGameState {
      clockMultiplier: Float
      isClockRunning: Boolean
      mode: String
    }
  }
`;

const query = gql`
  query getGameState {
    gameState @client {
      clockMultiplier
      isClockRunning
      mode
    }
  }
`;

export const resolvers = {
  Query: {
    getGameState: (_, __, {cache }) => {
      return cache.readData({ data: { gameState } });
    }
  },
  Mutation: {
    updateNetworkStatus: (_, { isConnected }, { cache }) => {
      cache.writeData({ data: { isConnected }});
      return null;
    },
    updateMode: (_, { mode }, { cache }) => {
      cache.writeData({ data: { mode }});
      return null;
    },
    updateClockMultiplier: (_, { clockMultiplier }, { cache }) => {
      cache.writeData({ data: { clockMultiplier }});
      return null;
    },
  }
}
