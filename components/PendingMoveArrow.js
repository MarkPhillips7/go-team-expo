import React, {
    Component
} from 'react';
import _ from 'lodash';
import * as ReactNativeSvg from 'react-native-svg';
const {
    Path,
    Svg,
} = ReactNativeSvg;

const arrowStrokeWidth = 0.2;

export default class PendingMoveArrow extends Component {
  render() {
    const full = 1 - (arrowStrokeWidth / 2);
    const half = full / 2;
    const outlinePathData = [
      `M -${full} -${half}`, //Move to arrow mid-upper left vertex
      `l ${full} 0`, // mid-upper middle vertex
      `l 0 -${half}`, // upper middle vertex
      `l ${full} ${full}`, // middle right vertex
      `l -${full} ${full}`, // lower middle vertex
      `l 0 -${half}`, // mid-lower middle vertex
      `l -${full} 0`, // mid-lower left vertex
      `l 0 -${full}`, // Back to mid-upper left vertex
      `l ${full} 0`, // retrace mid-upper middle vertex
    ].join(' ');
    const progressFull = full - (arrowStrokeWidth / 2);
    const progressHalf = half - (arrowStrokeWidth / 2);
    let progressPathData = [];
    const width = progressFull * 2 * this.props.percent / 100;
    if (width >= 0) {
      progressPathData.push(`M -${progressFull} -${progressHalf}`); //Move to arrow mid-upper left vertex
      const arrowStemProgressWidth = Math.min(full, width);
      progressPathData.push(`l ${arrowStemProgressWidth} 0`); // arrow stem progress mid-upper vertex
      if (width > full) {
        // The progress width in the stem is a little more than the arrowhead width
        // to include the stroke width of the base of the arrowhead.
        // Draw the rhombus representing the progress of the arrowhead.
        const hackMultiplier = 0.90;// for arrowStrokeWidth = 0.1 use 0.95;
        const maxArrowheadWidth = progressFull * 2 - full;
        const arrowHeadProgressWidth = Math.min(maxArrowheadWidth, width - full);
        const arrowheadProgressHeightChange = arrowHeadProgressWidth;//Math.sqrt(Math.pow(progressHalf,2) + Math.pow(arrowHeadProgressWidth,2));
        progressPathData.push(`l 0 -${progressHalf*hackMultiplier}`); // upper middle vertex
        progressPathData.push(`l ${arrowHeadProgressWidth} ${arrowheadProgressHeightChange}`); // upper arrowhead progress
        progressPathData.push(`l 0 ${2*progressHalf + 2*progressHalf*hackMultiplier - (2 * arrowheadProgressHeightChange)}`); // lower arrowhead progress
        progressPathData.push(`l -${arrowHeadProgressWidth} ${arrowheadProgressHeightChange}`); // lower middle vertex
        progressPathData.push(`l 0 -${progressHalf*hackMultiplier}`); // mid-lower middle vertex
      } else {
        // just move down to form the right side of the rectangle that is part of the arrow stem
        progressPathData.push(`l 0 ${2*progressHalf}`); // arrow stem progress mid-lower vertex
      }
      progressPathData.push(`l -${arrowStemProgressWidth} 0`); // mid-lower left vertex
      progressPathData.push(`l 0 -${progressFull}`); // Back to mid-upper left vertex
    }

    progressPathData = progressPathData.join(' ');

    // transform={[{rotateZ: '45deg'}]}
    // <Path
    //   d={progressPathData}
    //   fill={this.props.color}
    //   stroke="transparent"
    //   strokeWidth={0.0}
    // />
    return (
      <Svg
        style={this.props.style}
        viewBox="-1 -1 2 2"
      >
        <Path
          d={outlinePathData}
          fill="white"
          stroke={this.props.color}
          strokeWidth={arrowStrokeWidth}
        />
        <Path
          d={progressPathData}
          fill={this.props.color}
          stroke={this.props.color}
          strokeWidth={0.01}
        />
      </Svg>
    );
  }
}
