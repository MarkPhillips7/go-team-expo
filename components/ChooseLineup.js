import React from 'react';
import { Query , withApollo} from 'react-apollo';
import {PropTypes} from 'prop-types';
import { Picker, Text } from 'react-native';
import _ from 'lodash';
import {RECENT_FORMATIONS_AND_LINEUPS} from '../graphql/lineup';
// import {RECENT_FORMATIONS} from '../graphql/formation';
import {
  getBlankLineupFromFormation,
  getLineupFromGameTeamSeason,
} from '../helpers/lineup';

export default withApollo(
class ChooseLineup extends React.Component {
  static propTypes = {
    onLineupChange: PropTypes.func.isRequired,
    selectedLineup: PropTypes.object,
    teamSeasonId: PropTypes.string,
  }

  render() {
    const {
      onLineupChange,
      selectedLineup,
      teamSeasonId,
    } = this.props;
    return (
      <Query
        query={RECENT_FORMATIONS_AND_LINEUPS}
        variables={{teamSeasonId}}
        notifyOnNetworkStatusChange
      >
        {({ loading, error, data, /*refetch,*/ networkStatus }) => {
          if (networkStatus === 4) return <Text>Refetching...</Text>;
          if (loading) return <Text>Loading...</Text>;
          if (error) { console.log(JSON.stringify(error)); return <Text>Error</Text>;}

          const recentLineupOptions = data &&
            data.TeamSeason &&
            data.TeamSeason.gameTeamSeasons &&
            data.TeamSeason.gameTeamSeasons.map(getLineupFromGameTeamSeason);
          const recentBlankFormationOptions = data &&
            data.allFormations &&
            data.allFormations.map(getBlankLineupFromFormation);
          const lineupOptions = [
            ...recentLineupOptions,
            ...recentBlankFormationOptions,
          ]
          return (
            <Picker
              prompt="Select a lineup"
              selectedValue={selectedLineup && selectedLineup.id}
              style={{ height: 50, width: 250 }}
              onValueChange={(lineupId) => onLineupChange(_.find(lineupOptions, (lineupOption) => lineupOption.id == lineupId))}
            >
              {_.map(lineupOptions, (lineupOption, index) => (
                <Picker.Item
                  label={lineupOption.name}
                  key={index}
                  value={lineupOption.id}
                />
              ))}

            </Picker>
          );
        }}
      </Query>
    );
  }
});
