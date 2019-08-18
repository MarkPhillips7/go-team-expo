import {PropTypes} from 'prop-types';
import {positionSnapshotPropTypes} from './positionSnapshot';

// SelectionInfo represents the state of the position/player selections
// made by the user pressing one or more player circles.
// When no selections and a user presses a player circle, that player is selected.
// If a pending substitution involves that player/position, then the related pending
// substitution changes are also automatically selected.

export const selectionInfoPropTypes = {
  selectedPlayerId: PropTypes.string,
  selections: PropTypes.arrayOf(positionSnapshotPropTypes),
  hasPlannedSubstitutionAssignments: PropTypes.bool,
};
