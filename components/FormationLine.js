import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default class FormationLine extends React.Component {
  render() {
    const formationColor = this.props.positionCategory ? this.props.positionCategory.color : "white";
    // const containerStyle = {
    //   ...(this.props.style || {}),
    //   ...(styles.formationContainer || {})
    // };
    const flexDirection = "row";//this.props.lineOrientation === "horizontal" ? "row" : "column";
    const _formationLineStyle = {
      flex: 1,
      flexWrap: 'wrap',
      //alignItems: 'flex-start',//'center',
      justifyContent: 'center',
      flexDirection,
      height: "97%",
    }

    let styles = StyleSheet.create({
      containerStyle: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
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
          {this.props.children}
        </View>
      </View>
    );
  }
}
