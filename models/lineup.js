import {PropTypes} from 'prop-types';

// A Lineup represents a formation and player positions in that formation

// A lineup can come from a Lineup object or get transformed from a gameTeamSeason
export const lineupPropTypes = {
  id: PropTypes.string, // May not actually be a saved lineup, so not required
  name: PropTypes.string.isRequired,
  formation: PropTypes.object,
  playerPositions: PropTypes.array,
  isCustom: PropTypes.bool,
};
