import {PropTypes} from 'prop-types';

// A Position Snapshot represents a position on the soccer field or
// on the bench (which has no position and why position is optional)

// An event typically comes from playerTimeline.events
export const positionSnapshotPropTypes = {
    event: PropTypes.shape({
      eventType: PropTypes.string.isRequired,
      position: PropTypes.shape({
        id: PropTypes.string.isRequired,
      }),
      timeInfo: PropTypes.shape({
        gameSeconds: PropTypes.number.isRequired,
        totalSeconds: PropTypes.number.isRequired,
        timestamp: PropTypes.date
      }),
      isOverdue: PropTypes.bool,
    }),
    playerId: PropTypes.string.isRequired,
};
