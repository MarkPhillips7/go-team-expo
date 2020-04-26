import React from 'react';
import { Query , withApollo} from 'react-apollo';
import {PropTypes} from 'prop-types';
import { Picker, Text } from 'react-native';
import _ from 'lodash';
import {RECENT_LINEUPS} from '../graphql/lineup';
import {
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
        query={RECENT_LINEUPS}
        variables={{teamSeasonId}}
        notifyOnNetworkStatusChange
      >
        {({ loading, error, data, /*refetch,*/ networkStatus }) => {
          if (networkStatus === 4) return <Text>Refetching...</Text>;
          if (loading) return <Text>Loading...</Text>;
          if (error) { console.log(JSON.stringify(error)); return <Text>Error</Text>;}

          const lineupOptions = data &&
            data.TeamSeason &&
            data.TeamSeason.gameTeamSeasons &&
            data.TeamSeason.gameTeamSeasons.map(getLineupFromGameTeamSeason);
          return (
            <Picker
              selectedValue={selectedLineup}
              style={{ height: 50, width: 150 }}
              onValueChange={onLineupChange}
            >
              <Picker.Item
                label="Select a formation or lineup"
                value={null} 
              />
              {_.map(lineupOptions, (lineupOption, index) => (
                <Picker.Item
                  label={lineupOption.name}
                  key={index}
                  value={lineupOption}
                />
              ))}

            </Picker>
          );
        }}
      </Query>
    );
  }
});
