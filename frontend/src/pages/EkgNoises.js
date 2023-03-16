// Čia išveda originalaus EKG įrašo grafiką

import {useState, useContext, React} from 'react';
import AuthContext from '../components/AuthContext'
// import './MyChart.css';
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
// import { red, yellow } from '@mui/material/colors';

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

const ShowGraph = ({data, options, width, height}) => {

  const auth = useContext(AuthContext);

    if (auth === '9999999.999') { 
      return(
        <h1>Pasirink įrašą!</h1>
      ); 
    } else { 
      return(
        <div>
        <Line width={width} height={height} options={options} data={data} />;
        </div>
      );
  } 
}



const GenerateChartData = (idxArray, valueArray, idxRpeaks, annotationValues, noiseIntervals) => {

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

  const valueRpeaks = [];
  for (let i = 0; i < idxRpeaks.length; i++) {  
    valueRpeaks.push(valueArray[idxRpeaks[i]]);        
  }

  const annotations_point = [];
  const annotations_label = [];

  for (let i = 0; i < idxRpeaks.length; i++) {
  const point = {
    type: 'point',
    xValue: idxRpeaks[i],
    yValue: valueRpeaks[i],
    radius: 2,
    pointStyle: 'circle',
  };
  annotations_point.push(point);
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
      annotations_label.push(point2);
    };
  }

  // eisime per idxRpeaks ir surasime box pradžias xMin[i] ir pabaigas xMax[i]
  //po to eisime per visus box ir konstruosime box objektus
  
  
  const annotations_box = [];
  for (let i = 0; i < idxRpeaks.length; i++) {
    const box = {
      type: 'box',
      xScaleID: 'x-axis-0',
      yScaleID: 'y-axis-0',
      xMin: 0,
      xMax: 5,
      backgroundColor: 'rgba(255, 0, 0, 0.2)'
    }
    annotations_box.push(box);  
  }

  const annotations = annotations_point.concat(annotations_label);

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
      display: false
    },
    // legend: {
    //   position: 'top',
    // },
    // title: {
    //   display: true,
    // },
    annotation: {
      annotations: annotations
      }
    }
  };
  return {data, options}
}

const EkgNoises = () => {

  const auth = useContext(AuthContext);
  // const auth = "1642627.410";
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
          
  const { data: annot_js, error: error_js, loaded: loaded_js } = useAxiosGet(
    "http://localhost:8000/annotations",
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
    const idxVisualArray = segmentData.map((data) => data.idx);
    const valueVisualArray = segmentData.map((data) => data.value);
 
    const idxVisualRpeaks = annot_js.rpeaks.filter((rpeak) => rpeak.sampleIndex >= param.at && rpeak.sampleIndex < param.at + param.length)
    .map((rpeak) => rpeak.sampleIndex - param.at);
    console.log(idxVisualRpeaks);
  
    const annotationVisualValues = annot_js.rpeaks.filter((rpeak) => rpeak.sampleIndex >= param.at && rpeak.sampleIndex < param.at + param.length)
    .map((rpeak) => rpeak.annotationValue);
    console.log(annotationVisualValues);

    const {data, options} = GenerateChartData(idxVisualArray, valueVisualArray, idxVisualRpeaks, annotationVisualValues);
    
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
          <ShowGraph data={data} options={options} width={1200} height={500}/>
      
      </div>
    );
  }
    
  return <span>Loading...</span>;
};

export default EkgNoises