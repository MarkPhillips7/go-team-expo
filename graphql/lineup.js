import gql from "graphql-tag";

// export const RECENT_LINEUPS = gql`
// query getRecentLineups($teamSeasonId: ID!) {
//   TeamSeason(id: $teamSeasonId) {
//     id
//     name
//     gameTeamSeasons(
//       last: 4
//       filter: {
//         game: {
//           gameStatus: COMPLETED
//         }
//       }
//     ) {
//       id
//       name
//       substitutions (
//       filter: {
//         gameSeconds: 0
//         gameActivityType: OFFICIAL
//       }) {
//         id
//         playerPositionAssignments (
//           filter: {
//             playerPositionAssignmentType: INITIAL
//           }
//         ){
//           id
//           playerPosition {
//             player {
//               id
//               name
//             }
//             position {
//               id
//               name
//             }
//           }
//         }
//       }
//       formationSubstitutions(
//       filter: {
//         gameSeconds: 0
//       }) {
//         gameActivityType
//         gameSeconds
//         formation {
//           id
//           name
//           formationCode
//           positions {
//             id
//             name
//             positionCategory {
//               id
//               name
//               color
//             }
//           }
//         }
//       }
//     }
//   }
// }
// `;

export const RECENT_FORMATIONS_AND_LINEUPS = gql`
query getRecentFormationsAndLineups($teamSeasonId: ID!) {
  allFormations(
    filter: {
      formationSubstitution_every: {
        gameTeamSeason: {
          teamSeason: {
            id: $teamSeasonId
          }
        }
      }
    }
  ) {
    id
    name
    formationCode
    positions {
      id
      name
      positionCategory {
        id
        name
        color
      }
    }
  }
  TeamSeason(id: $teamSeasonId) {
    id
    name
    gameTeamSeasons(
      last: 4
      filter: {
        game: {
          gameStatus: COMPLETED
        }
      }
    ) {
      id
      name
      substitutions (
      filter: {
        gameSeconds: 0
        gameActivityType: OFFICIAL
      }) {
        id
        playerPositionAssignments (
          filter: {
            playerPositionAssignmentType: INITIAL
          }
        ){
          id
          playerPosition {
            player {
              id
              name
            }
            position {
              id
              name
            }
          }
        }
      }
      formationSubstitutions(
      filter: {
        gameSeconds: 0
      }) {
        gameActivityType
        gameSeconds
        formation {
          id
          name
          formationCode
          positions {
            id
            name
            positionCategory {
              id
              name
              color
            }
          }
        }
      }
    }
  }
}
`;
