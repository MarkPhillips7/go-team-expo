import React, {
    Component
} from 'react';
import _ from 'lodash';
import { Svg } from 'expo';
const {
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
    const viewBox = `0 0 ${rootWidth} 20`;
    return (
      <Svg
        width={rootWidth}
        height={20}
        viewBox={viewBox}
      >
        {
          this.props.colors &&
          _.map(this.props.colors, (color, index) => (
            <Rect
              key={index}
              x={index * rootWidth / this.props.colors.length}
              y="0"
              width={rootWidth / this.props.colors.length}
              height={20}
              fill={color}
              strokeWidth="0.00001"
              stroke={color}
            />
          ))
        }
        <Text
          onLayout={this.onTextLayout}
          x={(rootWidth - textWidth)/2 + textWidth/2}
          y="14"
          fill="white"
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle">
          {this.props.text}
        </Text>
      </Svg>
    );
  }
}
