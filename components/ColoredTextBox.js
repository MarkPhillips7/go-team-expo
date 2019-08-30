import React, {
    Component
} from 'react';
import _ from 'lodash';
import { Svg } from 'expo';
const {
    Path,
    Rect,
    Text
} = Svg;

export default class ColoredTextBox extends Component {
  state = {rootWidth: 100};
  onTextLayout = e => {
    const textLayout = e.nativeEvent.layout;
    const { height, width, x } = textLayout;
    const { textWidth } = this.state;
    if (height && (!textWidth || Math.abs(textWidth - width) > 0.001)) {
      this.setState({
        textWidth: width,
        rootWidth: width + 6,
      });
    }
  };

  render() {
    const { rootWidth, textWidth = 0 } = this.state;
    const {multiplier} = this.props;
    const viewBox = `0 0 ${rootWidth} 20`;
    //console.log(`viewBox: `, viewBox);
    const fontSize = multiplier > 0.9 ? "11" : "10";
    return (
      <Svg
        color="white"
        width={rootWidth}
        height={20}
        viewBox={viewBox}
      >
        {
          this.props.colors &&
          _.map(this.props.colors, (color, index) => {
            const colorBoxWidth = rootWidth / this.props.colors.length;
            const colorBoxHeight = 20*multiplier;
            const roundedCornerRadius = 8*multiplier;
            if (this.props.colors.length === 1) {
              // Return a rectangle with rounded corners on all sides
              return (
                <Rect
                  key={index}
                  rx={roundedCornerRadius}
                  x={index * colorBoxWidth}
                  y="0"
                  width={colorBoxWidth}
                  height={colorBoxHeight}
                  fill={color}
                  strokeWidth="0.00001"
                  stroke={color}
                />
              );
            }
            if (index === 0) {
              const d=
`M${(index + 1) * colorBoxWidth},0
h-${colorBoxWidth-roundedCornerRadius}
a${roundedCornerRadius},${roundedCornerRadius} 90 0 0 ${-roundedCornerRadius},${roundedCornerRadius}
v${colorBoxHeight-(roundedCornerRadius*2)}
a${roundedCornerRadius},${roundedCornerRadius} 90 0 0 ${roundedCornerRadius},${roundedCornerRadius}
h${colorBoxWidth-roundedCornerRadius}
z`;
              // Return a left-side rectangle with rounded corners on the left side
              return (
                <Path
                  fill={color}
                  strokeWidth="0.00001"
                  stroke={color}
                  key={index}
                  d={d}
                />
              );
            }
            if (index === this.props.colors.length - 1) {
              const d=
`M${index * colorBoxWidth},${colorBoxHeight}
h${colorBoxWidth-roundedCornerRadius}
a${roundedCornerRadius},${roundedCornerRadius} 90 0 0 ${roundedCornerRadius},${-roundedCornerRadius}
v-${colorBoxHeight-(roundedCornerRadius*2)}
a${roundedCornerRadius},${roundedCornerRadius} 90 0 0 ${-roundedCornerRadius},${-roundedCornerRadius}
h-${colorBoxWidth-roundedCornerRadius}
z`;
              // Return a right-side rectangle with rounded corners on the right side
              return (
                <Path
                  fill={color}
                  strokeWidth="0.00001"
                  stroke={color}
                  key={index}
                  d={d}
                />
              );
            }
            // Return a middle rectangle with no rounded corners
            return (
              <Rect
                key={index}
                x={index * colorBoxWidth}
                y="0"
                width={colorBoxWidth}
                height={colorBoxHeight}
                fill={color}
                strokeWidth="0.00001"
                stroke={color}
              />
            );
          })
        }
        <Text
          onLayout={this.onTextLayout}
          x={(rootWidth - textWidth)/2 + textWidth/2}
          y="12"
          fontSize={fontSize}
          stroke="white"
          textAnchor="middle">
          {this.props.text}
        </Text>
      </Svg>
    );
  }
}
