// Čia išveda originalaus EKG įrašo grafiką

import {useState, useContext, React} from 'react';
import AuthContext from '../components/AuthContext'
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

const Analysis = () => {

  const auth = useContext(AuthContext);
  console.log(auth)

  const [param, setParam] = useState({
    at: 0,
    length: 1000,
  })
  
  const { data: data_rec, error: error_rec, loaded: loaded_rec } = useAxiosGet(
    "http://localhost:8000/record",
          {
            params: {
              fname:auth,
            }
          }
  );


  const { data: data_rsl, error: error_rsl, loaded: loaded_rsl } = useAxiosGet(
    "http://localhost:8000/analysis",
            {
              params: {
                fname:auth,
              }
            }
  );

  function handleInputChange(event) {
    const { name, value } = event.target;
    setParam({ ...param, [name]: parseInt(value) }); // include atStep in updated state
  }
  
  function handleKeyDown(event) {
    const step = Math.max(1, Math.floor(param.length / 10));
    
    switch (event.keyCode) {
      case 37: // left arrow key - atgal
      setParam({ ...param, at: (param.at - step) >= 0 ? param.at - step : 0});
      break;
      case 40: // up arrow key - išplečia
      setParam({ ...param, length: (param.length + 100) <= data_rec.length ? param.length + 100 : data_rec.length });
      break;
      case 39: // right arrow key - pirmyn
      setParam({ ...param, at: (param.at + step) <= data_rec.length ? param.at + step : param.at });
      break;
      case 38: // down arrow key - suglaudžia
      setParam({ ...param, length: Math.max(param.length - 100, 100) });
      break;
      default:
        break;
      }
    }
  
  if (loaded_rec && loaded_rsl) {
    
    if (data_rsl.hasOwnProperty("error")) {
        return <span>{data_rsl.error}</span>;
    }
        
    const segmentData = data_rec.slice(param.at, param.at + param.length);
    // console.log("segmentData:", segmentData)
    const idxVisualArray = segmentData.map((data) => data.idx);
    const valueVisualArray = segmentData.map((data) => data.value);
    // console.log('data_rsl:', data_rsl)

    const idxMlVisualRpeaks = data_rsl.automatic_classification.filter((rpeak) => rpeak.sample >= param.at && rpeak.sample < param.at + param.length)
    .map((rpeak) => rpeak.sample - param.at);
    // console.log(idxVisualRpeaks);
  
    const annotationMlVisualValues = data_rsl.automatic_classification.filter((rpeak) => rpeak.sample >= param.at && rpeak.sample < param.at + param.length)
    .map((rpeak) => rpeak.annotation);
    // console.log(annotationVisualValues);
    
    const noiseMlIntervals = [];
    const mlAnnotationNumbers = mlAnnotationCounts(data_rsl.automatic_classification);
    // console.log('annotationNumbers:', annotationNumbers)
    const {data, options} = generateChartConfig(idxVisualArray, valueVisualArray, idxMlVisualRpeaks, annotationMlVisualValues, noiseMlIntervals);

    return (
      // <div onKeyDown={handleKeyDown} tabIndex="0" style={{ display: 'flex' }}>
      <div onKeyDown={handleKeyDown} tabIndex="0" >
        
        {/* <form> */}
          <label>
            at:
            <input type="number" name="at" value={param.at} onChange={handleInputChange} />
          </label>
          {/* <br /> */}
          <label>
            length:
            <input type="number" name="length" value={param.length} onChange={handleInputChange} />
          </label>
          &nbsp;&nbsp;&nbsp;&nbsp;Failo vardas: {auth}&nbsp;&nbsp;&nbsp;&nbsp;
          Reikšmių: {data_rec.length} &nbsp;&nbsp;&nbsp; ML annot.:&nbsp;&nbsp; N:{mlAnnotationNumbers.N}
          &nbsp;S:{mlAnnotationNumbers.S} &nbsp;V:{mlAnnotationNumbers.V} &nbsp; U:{mlAnnotationNumbers.U}
        <Line width={1200} height={400} options={options} data={data} />;
      </div>
    );
  }
    
  return <span>Loading...</span>;
};

export default Analysis