// Čia išveda originalaus EKG įrašo grafiką

import {useState, useContext, React} from 'react';
import AuthContext from '../components/AuthContext'
import './MyChart.css';
import "chartjs-plugin-annotation";
import useAxiosGet from "../components/useAxiosGet"

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

const GenerateChartData = (idxArray, valueArray, idxRpeaks, valueRpeaks) => {

  const data = {
    labels: idxArray,
    datasets: [{
    label: 'EKG reikšmės',
    fill: false,
    lineTension: 0.1,
    borderColor: 'blue',
    borderWidth: 1, // <--- Line thickness is defined here
    pointRadius: 0, // <--- Set to 0 to remove markers
    data: valueArray,
  }]
  };      

  const annotations1 = [];
  const annotations2 = [];

  for (let i = 0; i < idxRpeaks.length; i++) {
  const point = {
    type: 'point',
    xValue: idxRpeaks[i],
    yValue: valueRpeaks[i],
    radius: 3,
    pointStyle: 'circle',
  };
  annotations1.push(point);
  const label = {
        type: 'label',
        xValue: idxRpeaks[i],
        yValue: valueRpeaks[i],
        enabled: true,
        // xAdjust: -20, // pixels
        yAdjust: -10, // pixels
        content: ['R'],
        font: {size: 10},
  };
  annotations2.push(label);
  }
  const annotations = annotations1.concat(annotations2);

  const options = {
  responsive: false,
  maintainAspectRatio: true,
  animation: false, // <--- disable animation
  scales: {
    // x: {
    //   ticks: {
    //     stepSize: 5
    // },
    //   // autoSkip: true, // <--- enable auto-skipping of labels
    //   maxTicksLimit: 50, // <--- maximum number of labels to show
    // },
    // y: {
        // max: 5,
        // min: 0,
        // ticks: {
        //     stepSize: 0.1
        // }
    // }
  },  
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
    },
    annotation: {
      annotations: annotations
      }
    }
  };
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
          
  const { data: data_js, error: error_js, loaded: loaded_js } = useAxiosGet(
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
      case 37: // left arrow key
      setParam({ ...param, at: (param.at - step) >= 0 ? param.at - step : 0});
      break;
      case 38: // up arrow key
      setParam({ ...param, length: (param.length + 100) <= data_rec.length ? param.length + 100 : data_rec.length });
      break;
      case 39: // right arrow key
      setParam({ ...param, at: (param.at + step) <= data_rec.length ? param.at + step : param.at });
      break;
      case 40: // down arrow key
      setParam({ ...param, length: Math.max(param.length - 100, 100) });
      break;
      default:
        break;
      }
    }
  
  if (loaded_rec && loaded_js) {
    const segmentData = data_rec.slice(param.at, param.at + param.length);
    // console.log("segmentData:", segmentData)
    const idxArray = segmentData.map((data) => data.idx);
    const valueArray = segmentData.map((data) => data.value);
 
    const rpeaks = data_js.rpeaks;
    // console.log("rpeaks:", rpeaks)
  
    const idxRpeaks = rpeaks
    .filter((sampleIndex) => sampleIndex > param.at && sampleIndex < param.at + param.length)
    .map((sampleIndex) => sampleIndex - param.at);
    // console.log("idxRpeaks:", idxRpeaks)
    
    const valueRpeaks = [];
    for (let i = 0; i < idxRpeaks.length; i++) {  
      valueRpeaks.push(valueArray[idxRpeaks[i]]);        
    }
    const {data, options} = GenerateChartData(idxArray, valueArray, idxRpeaks, valueRpeaks);
    
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
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Failo vardas: {auth}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Reikšmių: {data_rec.length}  
        <Line width={1200} height={400} options={options} data={data} />;
      </div>
    );
  }
    
  return <span>Loading...</span>;
};

export default Analysis