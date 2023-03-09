// buildIndicator.js
import $ from 'jquery';

export const buildIndicator = ({
  relativeOffsetX = 100,
  relativeOffsetY = 100,
  content = 'ERROR',
  placement = 'SW',
  background = 'lightgray',
  onClick = () => {},
}) => {
  let wrapperRotation;
  let indicatorRotation;

  switch (placement) {
    case 'NW':
      wrapperRotation = 45;
      indicatorRotation = -45;
      break;
    case 'SW':
      wrapperRotation = -45;
      indicatorRotation = 45;
      break;
    case 'NE':
      wrapperRotation = 135;
      indicatorRotation = -135;
      break;
    case 'SE':
      wrapperRotation = -135;
      indicatorRotation = 135;
      break;
    case 'N':
      wrapperRotation = 90;
      indicatorRotation = -90;
      break;
    default:
      break;
  }

  const wrapper = $(`<div></div>`).css({
    position: 'absolute',
    left: relativeOffsetX,
    top: relativeOffsetY,
    display: 'flex',
    alignItems: 'center',
    // outline: '1px dashed green',
    transform: `translate(-100%, -50%) rotate(${wrapperRotation}deg)`,
    transformOrigin: 'right',
  });

  const indicator = $(`<div>
    <div>${content}</div>
  </div>`)
    .css({
      transform: `rotate(${indicatorRotation}deg)`,
      background,
      border: '1px solid purple',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      display: 'flex',
      alignContent: 'space-around',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
    })
    .on('click', onClick);

  const handle = $(`<div></div>`).css({
    width: 25,
    height: 2,
    background: 'purple',
  });

  wrapper.append(indicator);
  wrapper.append(handle);

  wrapper.addClass('uplot-additional-element');

  return wrapper;
};

// Chart.js with uplot
const uplotOptions = {
  hooks: {
    drawAxes: [
      (u) => {
        const { ctx } = u;
        const { top, height } = u.bbox;
  
    
        ctx.save();
    
        ctx.strokeStyle = interpolatedColorWithAlpha;
        ctx.beginPath();
    
        const [i0, i1] = u.series[0].idxs;
    
        $(u.root.querySelector('.u-over')).find('.uplot-additional-element').remove();
  
        const visibleRpeaks = rpeaks.filter(
          ({ sampleIndex }) => sampleIndex > plotScale[0] && sampleIndex < plotScale[1],
        );
               
          visibleRpeaks.forEach(({ sampleIndex, annotationValue }) => {
            if (sampleIndex < i0 || sampleIndex > i1) {
              return;
            }
        
            // Value of the current sample
            const sampleValue = u.data[1][sampleIndex];
            // X position of the current sample
            const samplePosX = Math.round(u.valToPos(sampleIndex, 'x', false));
            // Y position of the current sample
            const samplePosY = Math.round(u.valToPos(sampleValue, 'y', false));
        
        
            $(u.root.querySelector('.u-over')).append(
              buildIndicator({
                relativeOffsetX: samplePosX,
                relativeOffsetY: samplePosY,
                content: 'R',
                placement: 'NW',
              }),
            );
          });
      }
  ]
}
  

// App.css
.u-cursor-pt {
  pointer-events: auto !important;
}

.annotation-edit {
  position: absolute;
  width: 40px;
  height: 20px;
  border: 1px solid red;
  background: white;
  margin-left: -20px;
  margin-top: -20px;
}

.annotation-gap {
  text-align: center;
  position: absolute;
  width: 100px;
  height: 20px;
  background: white;
  margin-left: -50px;
  margin-top: -20px;
  font-size: 12px;
}

tr.chartRendered {
  background: lightpink;
}

.annotation-edit[annotation-value="N"] {
  border-color: lightgray;
  z-index: 1000;
}

.annotation-edit[annotation-value="S"] {
  border-color: red;
  z-index: 1001;
}
.annotation-edit[annotation-value="V"] {
  border-color: red;
  z-index: 1001;
}
.annotation-edit[annotation-value="F"] {
  border-color: red;
  z-index: 1001;
}
.annotation-edit[annotation-value="U"] {
  border-color: red;
  z-index: 1001;
}

.ruler {
  display: flex;
  height: 100%;
  align-items: center;
  opacity: 0.5;
}

.u-annotate {
  background: rgba(255, 0, 0, 0.3);
}
