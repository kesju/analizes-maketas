// Čia išveda originalaus EKG įrašo grafiką

import {useState, useContext, React} from 'react';
import SegmParamContext from '../components/SegmParamContext'
import './MyChart.css';
import "chartjs-plugin-annotation";
import useAxiosGet from "../components/useAxiosGet"
import {mlAnnotationCounts} from '../components/utils/mlAnnotationCounts'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(
  annotationPlugin,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function generateChartConfig(idxArray, valueArray, idxRpeaks, annotationValues, noiseIntervals) {

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
            xAdjust: 10, // pixels
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
    
    scales: {
      x: {
        ticks: {  
          display: true  // Nuįma x ašies ticks
        },  
        grid: {
          display: false // Nuįma x ašies tinkl1ą
        },
      },
      y: {
        type: 'linear',
        grace: '10%'
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

const AnalysisShow = () => {

  const {segmParam, setSegmParam} = useContext(SegmParamContext);

  const { data: data_rec, error: error_rec, loaded: loaded_rec } = useAxiosGet(
    "http://localhost:8000/record",
          {
            params: {
              fname:segmParam.fname,
            }
          }
  );


  const { data: data_rsl, error: error_rsl, loaded: loaded_rsl } = useAxiosGet(
    "http://localhost:8000/analysis",
            {
              params: {
                fname:segmParam.fname,
              }
            }
  );

  function handleInputChange(event) {
    const { name, value } = event.target;
    setSegmParam(prevState => ({
      ...prevState,
        [name]: parseInt(value)
    }));
  };
  
  
  function handleArrowKey(event) {
    const step = Math.max(1, Math.floor(segmParam.length / 10));
    
    switch (event.keyCode) {
      case 37: // left arrow key - atgal
      setSegmParam({ ...segmParam, at: (segmParam.at - step) >= 0 ? segmParam.at - step : 0});
      break;
      case 40: // up arrow key - išplečia
      setSegmParam({ ...segmParam, length: (segmParam.length + 100) <= data_rec.length ? segmParam.length + 100 : data_rec.length });
      break;
      case 39: // right arrow key - pirmyn
      setSegmParam({ ...segmParam, at: (segmParam.at + step) <= data_rec.length ? segmParam.at + step : segmParam.at });
      break;
      case 38: // down arrow key - suglaudžia
      setSegmParam({ ...segmParam, length: Math.max(segmParam.length - 100, 100) });
      break;
      default:
        break;
      }
    }
    
  if (loaded_rec && loaded_rsl) {
    
    if (data_rsl.hasOwnProperty("error")) {
        return <span>{data_rsl.error}</span>;
    }
        
    const segmentData = data_rec.slice(segmParam.at, segmParam.at + segmParam.length);
    // console.log("segmentData:", segmentData)
    const idxVisualArray = segmentData.map((data) => data.idx);
    const valueVisualArray = segmentData.map((data) => data.value);
    // console.log('data_rsl:', data_rsl)

    const idxMlVisualRpeaks = data_rsl.automatic_classification.filter((rpeak) => rpeak.sample >= segmParam.at && rpeak.sample < segmParam.at + segmParam.length)
    .map((rpeak) => rpeak.sample - segmParam.at);
    // console.log(idxVisualRpeaks);
  
    const annotationMlVisualValues = data_rsl.automatic_classification.filter((rpeak) => rpeak.sample >= segmParam.at && rpeak.sample < segmParam.at + segmParam.length)
    .map((rpeak) => rpeak.annotation);
    // console.log(annotationVisualValues);
    
    const noiseMlIntervals = [];
    const mlAnnotationNumbers = mlAnnotationCounts(data_rsl.automatic_classification);
    // console.log('annotationNumbers:', annotationNumbers)
    const {data, options} = generateChartConfig(idxVisualArray, valueVisualArray, idxMlVisualRpeaks, annotationMlVisualValues, noiseMlIntervals);

    return (
      // <div onKeyDown={handleKeyDown} tabIndex="0" style={{ display: 'flex' }}>
      <div onKeyDown={handleArrowKey} tabIndex="0" >
        
        <label>
            at:
            <input type="number" name="at" value={segmParam.at} onChange={handleInputChange} />
          </label>
          <label>
            length:
            <input type="number" name="length" value={segmParam.length} onChange={handleInputChange} />
          </label>
          
          &nbsp;&nbsp;&nbsp;&nbsp;Failo vardas: {segmParam.fname}&nbsp;&nbsp;&nbsp;&nbsp;
          Reikšmių: {data_rec.length} &nbsp;&nbsp;&nbsp; ML annot.:&nbsp;&nbsp; N:{mlAnnotationNumbers.N}
          &nbsp;S:{mlAnnotationNumbers.S} &nbsp;V:{mlAnnotationNumbers.V} &nbsp; U:{mlAnnotationNumbers.U}
        <Line width={1200} height={400} options={options} data={data} />;
      </div>
    );
  }
    
  return <span>Loading...</span>;
};
const Analysis = () => {

  const {segmParam, setSegmParam} = useContext(SegmParamContext);

  if (segmParam.fname === '9999999.999') { 
    return(
      <div>
      <h1>Pasirink įrašą!</h1>
      </div>
    ); 
  } else { 
    return(
      <div>
      <AnalysisShow />
      </div>
    );
  }

}
  
export default Analysis