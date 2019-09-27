import React from 'react';
import {PropTypes} from 'prop-types';
import { StyleSheet, View } from 'react-native';
import { Button, Input } from 'react-native-elements';
import {withApollo} from 'react-apollo';
import Roster from '../components/Roster';
import { Mutation } from "react-apollo";
import {
  UPDATE_GAME,
} from '../graphql/game';
import { Formik } from 'formik';

export default withApollo(
class GameDetails extends React.Component {
  static propTypes = {
    gameTeamSeason: PropTypes.object,
    gamePlayers: PropTypes.array,
  }

  render() {
    const {
      gamePlayers,
      gameTeamSeason,
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
              });
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
            }) => (
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
            )}
          </Formik>
        )}
      </Mutation>
    );
  }
});

let styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
  },
});
