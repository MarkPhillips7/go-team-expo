import gql from "graphql-tag";

export const TEAM_SEASON = gql`
query {
  TeamSeason(id: "ck08dcuph0osf0130xcw56xrk") {
    id
    name
    gameTeamSeasons {
      id
      game {
        id
        scheduledStartTime
        name
        location
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
