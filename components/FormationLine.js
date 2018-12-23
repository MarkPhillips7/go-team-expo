import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default class FormationLine extends React.Component {
  render() {
    const formationColor = this.props.positionCategory ? this.props.positionCategory.color : "white";
    // const containerStyle = {
    //   ...(this.props.style || {}),
    //   ...(styles.formationContainer || {})
    // };
    const flexDirection = this.props.lineOrientation === "horizontal" ? "row" : "column";
    const containerStyle = styles.formationContainer;
    const formationLineStyle = {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      width: "100%",
      flexDirection,
    }
    return (
      <View style={containerStyle}>
        <View style={{
          backgroundColor: formationColor,
          width: 10,
          height: "100%",
        }}/>
        <View
          style={formationLineStyle}
        >
          {this.props.children}
        </View>
      </View>
    );
  }
}

let styles = StyleSheet.create({
  formationContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 5,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  formationColorColumn: {
    backgroundColor: 'white',
    width: 10,
  },
  formationLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: "100%",
  },
});
