import React from 'react';
import {PropTypes} from 'prop-types';
import { StyleSheet, View } from 'react-native';
import { Button, ButtonGroup, Input } from 'react-native-elements';
import {withApollo} from 'react-apollo';
import Roster from '../components/Roster';
import { Mutation, Query } from "react-apollo";
import {
  UPDATE_GAME,
} from '../graphql/game';
import { Formik } from 'formik';
import { Text } from 'react-native';
import {GAME_TEAM_SEASON_INFO} from '../graphql/game';
import DateTimePicker from "react-native-modal-datetime-picker";
import moment from 'moment';

export default withApollo(
class GameDetails extends React.Component {
  static propTypes = {
    gameTeamSeason: PropTypes.object,
    gamePlayers: PropTypes.array,
  }

  constructor(props) {
    super(props);
    this.state = {
      isDateTimePickerVisible: false,
      dateTimeIndex: 2,
    }
    this.updateIndex = this.updateIndex.bind(this)
  }

  showDateTimePicker = () => {
    this.setState({ isDateTimePickerVisible: true });
  };

  hideDateTimePicker = () => {
    this.setState({ isDateTimePickerVisible: false });
  };

  // handleDatePicked = date => {
  //   console.log("A date has been picked: ", date);
  //   this.hideDateTimePicker();
  // };

  updateIndex (dateTimeIndex) {
    this.setState({dateTimeIndex});
    this.showDateTimePicker();
  }

  render() {
    const gameTeamSeasonId = this.props.navigation.getParam('gameTeamSeasonId');
    return (
      <Query
        query={GAME_TEAM_SEASON_INFO}
        variables={{gameTeamSeasonId}}
        notifyOnNetworkStatusChange
      >
        {({ loading, error, data, networkStatus }) => {
          if (networkStatus === 4) return <Text>Refetching...</Text>;
          if (loading) return <Text>Loading...</Text>;
          if (error) { console.log(JSON.stringify(error)); return <Text>Error</Text>;}

          const gameTeamSeason = data && data.GameTeamSeason;
          const gamePlayers = gameTeamSeason && gameTeamSeason.gamePlayers;
          const {
            navigation,
          } = this.props;
          const game = gameTeamSeason &&
          gameTeamSeason.game;
          if (!game) {
            return <View></View>;
          }
          //onChangeText={text => onChangeText(text)}
          return (
            <Mutation
              mutation={UPDATE_GAME}
            >
              {(updateGame) => (
                <Formik
                  initialValues={game}
                  onSubmit={(values, formikBag) => {
                    formikBag.setSubmitting(true);
                    // console.log(`values`, values);
                    updateGame({ variables: values })
                    .then(() => {
                      formikBag.setSubmitting(false);
                    })
                    .then(() => {
                      navigation.navigate('Game', { gameTeamSeasonId: gameTeamSeason.id });
                    }
                  );
                  }}
                >
                  {({
                    values,
                    handleSubmit,
                    setFieldValue,
                    touched,
                    errors,
                    setFieldTouched,
                    isSubmitting
                  }) => {
                    const scheduledDate = () => <Text>{moment(values.scheduledStartTime).format("M/D/Y")}</Text>
                    const scheduledTime = () => <Text>{moment(values.scheduledStartTime).format("LT")}</Text>
                    const buttons = [{ element: scheduledDate }, { element: scheduledTime }];
                    const { dateTimeIndex } = this.state;
                    const handleDatePicked = date => {
                      // console.log("A date has been picked: ", date);
                      setFieldValue("scheduledStartTime", date);
                      this.hideDateTimePicker();
                    };
                    return (
                      <View style={styles.screen}>
                        <Input
                          label='Opponent'
                          autoCapitalize="none"
                          value={values.name}
                          onChangeText={value => setFieldValue("name", value)}
                          onBlur={() => setFieldTouched("name")}
                          editable={!isSubmitting}
                          errorMessage={touched.name && errors.name ? errors.name : undefined}
                        />
                        <Input
                          label='Location'
                          autoCapitalize="none"
                          value={values.location}
                          onChangeText={value => setFieldValue("location", value)}
                          onBlur={() => setFieldTouched("location")}
                          editable={!isSubmitting}
                          errorMessage={touched.location && errors.location ? errors.location : undefined}
                        />
                        <ButtonGroup
                          onPress={this.updateIndex}
                          selectedIndex={dateTimeIndex}
                          buttons={buttons}
                          containerStyle={{height: 40}} />
                        <DateTimePicker
                          date={new Date(values.scheduledStartTime)}
                          mode={dateTimeIndex === 0 ? `date` : `time`}
                          isVisible={this.state.isDateTimePickerVisible}
                          onConfirm={handleDatePicked}
                          onCancel={this.hideDateTimePicker}
                        />
                        <Roster
                          gameRoster={gamePlayers}
                        />
                        <Button
                          title="Save"
                          onPress={handleSubmit}
                          disabled={isSubmitting}
                          loading={isSubmitting}
                        />
                      </View>
                    );
                  }}
                </Formik>
              )}
            </Mutation>
          );
        }}
      </Query>
    );
  }
});

let styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
  },
});
