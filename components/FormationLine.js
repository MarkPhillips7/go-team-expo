import React from 'react';
import {PropTypes} from 'prop-types';
import { ScrollView, StyleSheet, View } from 'react-native';

export default class FormationLine extends React.Component {
  static propTypes = {
    lineOrientation: PropTypes.string,
    children: PropTypes.array,
    positionCategory: PropTypes.object.isRequired,
  };
  render() {
    const formationColor = this.props.positionCategory ? this.props.positionCategory.color : "white";
    const horizontal = this.props.lineOrientation === "horizontal";
    const flexDirection = horizontal ? "row" : "column";
    const _formationLineStyle = {
      flex: 1,
      justifyContent: 'center',
      flexDirection: 'row',
      height: "97%",
    }

    let styles = StyleSheet.create({
      containerStyle: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
      },
      playerContainerStyle: {
        flexGrow: 1, // https://medium.com/@peterpme/taming-react-natives-scrollview-with-flex-144e6ff76c08
        flexDirection,
        alignItems: 'center',
        justifyContent: 'space-evenly',
      },
      formationLineStyle: _formationLineStyle,
    });
    const {formationLineStyle, containerStyle} = styles;

    return (
      <View style={containerStyle}>
        <View style={{
          backgroundColor: formationColor,
          width: 10,
          height: "97%",
        }}/>
        <View
          style={formationLineStyle}
        >
          <ScrollView
             horizontal={horizontal}
             contentContainerStyle={styles.playerContainerStyle}
             persistentScrollbar={true}
          >
            {this.props.children}
          </ScrollView>
        </View>
      </View>
    );
  }
}
