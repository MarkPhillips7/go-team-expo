import React, {
    Component
} from 'react';
import _ from 'lodash';
import { Svg } from 'expo';
const {
    Circle,
    Path,
    Text
} = Svg;

const circleBorderWidth = 0.08;

export default class CirclePie extends Component {
  render() {
    const getCoordinatesPieSlice = (percent) => {
      const quarterTurnOffset = -1/4*2 * Math.PI;
      const x = Math.cos(quarterTurnOffset + 2 * Math.PI * percent) * (1 - circleBorderWidth);
      const y = Math.sin(quarterTurnOffset + 2 * Math.PI * percent) * (1 - circleBorderWidth);
      return [x, y];
    };

    return (
      <Svg
        height={this.props.radius*2}
        width={this.props.radius*2}
        style={this.props.style}
        viewBox="-1 -1 2 2"
      >
        <Circle
            r={1 - (circleBorderWidth / 2)}
            fill="#fff"
            stroke={this.props.positionColor}
            strokeWidth={circleBorderWidth}
        />
        {
          this.props.piePieces &&
          _.chain(this.props.piePieces)
          .filter((piePiece) => typeof piePiece.startValue === 'number')
          .map((piePiece, index) => {
            const [startX, startY] = getCoordinatesPieSlice(piePiece.startValue);
            const [endX, endY] = getCoordinatesPieSlice(piePiece.endValue);

            // if the slice is more than 50%, take the large arc (the long way around)
            const largeArcFlag = piePiece.endValue - piePiece.startValue > .5 ? 1 : 0;

          	// create an array and join it just for code readability
            const pathData = [
              `M ${startX} ${startY}`, // Move
              `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc
              `L 0 0`, // Line
            ].join(' ');
            // console.log(`pathData: ${pathData}, color: ${piePiece.color}`)

            return (
              <Path
                key={index}
                d={pathData}
                fill={piePiece.color}
                stroke={piePiece.color}
                strokeWidth={circleBorderWidth / 4}
              />
            );
          })
          .value()
        }
      </Svg>
    );
  }
}
