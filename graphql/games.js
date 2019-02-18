import gql from "graphql-tag";

export const TEAM_SEASON = gql`
query {
  TeamSeason(id: "cjpt1epj50ijp0119511ogsg6") {
    id
    name
    gameTeamSeasons {
      id
      game {
        scheduledStartTime
        name
      }
      name
    }
    players {
      id
      name
    }
  }
}
`;
