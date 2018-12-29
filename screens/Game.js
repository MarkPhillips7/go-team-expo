import React from 'react';
import { Query } from "react-apollo";
import gql from "graphql-tag";
import SoccerField from './SoccerField';
import { Text } from 'react-native';

const positionCategoriesQuery = gql`
query {
  allPositionCategories {
    id
    name
    color
    parkLocation
    pitchLocation
  }
}
`;

const teamSeasonQuery = gql`
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
`;

export default () => (
  <Query
    query={positionCategoriesQuery}
  >
    {({ loading: loading1, error: error1, data: positionCategoriesData }) => (
      <Query
        query={teamSeasonQuery}
      >
        {({ loading: loading2, error: error2, data: teamSeasonData }) => {
          if (loading1 || loading2) return <Text>Loading...</Text>;
          if (error1 || error2) return <Text>Error</Text>;

          console.log(positionCategoriesData && JSON.stringify(positionCategoriesData));
          return (
            <SoccerField
              players={teamSeasonData && teamSeasonData.TeamSeason && teamSeasonData.TeamSeason.players}
              positionCategories={positionCategoriesData && positionCategoriesData.allPositionCategories}
            />
          );
        }}
      </Query>
    )}
  </Query>
);
