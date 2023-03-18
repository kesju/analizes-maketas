export function generateChartConfig(idxArray, valueArray, idxRpeaks, annotationValues, noiseIntervals) {

    const data = {
      labels: idxArray,
      datasets: [{
      // label: 'įrašas nefiltruotas',
      fill: false,
      lineTension: 0.1,
      borderColor: 'blue',
      borderWidth: 1, // <--- Line thickness is defined here
      pointRadius: 0, // <--- Set to 0 to remove markers
      data: valueArray,
    }]
    };      
  
    const valueRpeaks = [];
    for (let i = 0; i < idxRpeaks.length; i++) {  
      valueRpeaks.push(valueArray[idxRpeaks[i]]);        
    }
  
    const annotations = [];
  
    for (let i = 0; i < idxRpeaks.length; i++) {
    const point = {
      type: 'point',
      xValue: idxRpeaks[i],
      yValue: valueRpeaks[i],
      radius: 2,
      pointStyle: 'circle',
    };
    annotations.push(point);
  
    if (annotationValues[i] !== 'N') {
        const point2 = {
              type: 'label',
              xValue: idxRpeaks[i],
              yValue: valueRpeaks[i],
              enabled: true,
              xAdjust: -10, // pixels
              yAdjust: -10, // pixels
              content: [annotationValues[i]],
              font: {
                size: 14,
                color: 'red', // set the font color of the label here
              },
        };
        annotations.push(point2);
      };
    }
  
    const options = {
      responsive: false,
      maintainAspectRatio: true,
      animation: false, // <--- disable animation
      // legend: {   neveikia
      //   display: false //This will do the task
      // },
      // colors: { neveikia
      //   forceOverride: true
      // },
      // title: {
      //   display: true,
      //   text: 'My Chart Title',
      //   fontSize: 18,
      //   fontColor: '#333',
      //   fontFamily: 'Arial, sans-serif',
      //   padding: 10,
      //   position: 'top',
      // },
      // legend: {
      //   labels: {
      //     // fontColor: 'black',
      //     // fontSize: 14,
      //     // fontStyle: 'bold',
      //     // usePointStyle: false,
      //     boxWidth: 0,
      //   }
      // },
      scales: {
        x: {
          ticks: {  // Nuįma x ašies ticks
            display: true
          },  
        grid: {
          display: false
        },
        //   ticks: {
        //     stepSize: 5
        },
        //   // autoSkip: true, // <--- enable auto-skipping of labels
        //   maxTicksLimit: 50, // <--- maximum number of labels to show
        // },
        y: {
          type: 'linear',
          grace: '10%'
            // max: 5,
            // min: 0,
            // ticks: {
            //     stepSize: 0.1
            // }
  
        }
      },  
      plugins: {
        legend: {
          display: false,
        //   position: 'top',
        },
        title: {
          display: true,
        },
      }
    };
  
    const yScaleConfig = options.scales.y;
  
    for (let i = 0; i < noiseIntervals.length; i++) {
      const box = {
        type: 'box',
        xMin: noiseIntervals[i].startIndex,
        xMax: noiseIntervals[i].endIndex,
        yMin: yScaleConfig.min,
        yMax: yScaleConfig.max,
        backgroundColor: 'rgba(255, 0, 0, 0.2)'
      }
      annotations.push(box);  
    }
  
    options.plugins.annotation = {annotations:annotations};
  
    return {data, options}
  }
  