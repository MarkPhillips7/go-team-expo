import React from 'react';
import { Query } from "react-apollo";
import gql from "graphql-tag";
import SoccerField from './SoccerField';
import { Text } from 'react-native';

export default () => (
  <Query
    query={gql`
query {
  TeamSeason(id: "cjpt1epj50ijp0119511ogsg6") {
    id
    name
    players {
      id
      name
      positionCategoryPreferencesAsPlayer {
        positionCategory {
          name
          color
        }
      }
    }
  }
}
    `}
  >
    {({ loading, error, data }) => {
      if (loading) return <Text>Loading...</Text>;
      if (error) return <Text>Error :(</Text>;

      console.log(data && JSON.stringify(data));
      return (
        <SoccerField
          players={data && data.TeamSeason && data.TeamSeason.players}
        />
      );
    }}
  </Query>
);
