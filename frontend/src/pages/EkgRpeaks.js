// Čia išveda originalaus EKG įrašo grafiką

import {useState, useContext, React} from 'react';
// import AuthContext from '../components/AuthContext'
import SegmParamContext from '../components/SegmParamContext'
// import {noiseAnnotations} from '../components/utils/noiseAnnotations'
// import {generateChartConfig} from '../components/utils/generateChartConfig'
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
    radius: 3,
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


const ShowGraph = ({data, options, width, height}) => {

      return(
        // <div className="my-chart-container">
        <div>
        <Line width={width} height={height} options={options} data={data} />;
        </div>
      );
  } 

const EkgRpeaksShow = () => {

  const {segmParam, setSegmParam} = useContext(SegmParamContext);
  
  // loading ECG record
  const { data: data_rec, error: error_rec, loaded: loaded_rec } = useAxiosGet(
    "http://localhost:8000/record",
          {
            params: {
              fname:segmParam.fname,
            }
          }
  );
 
  // loading json with rpeaks and beat and noise annotations edited mannually 
  const { data: annot_js, error: error_js, loaded: loaded_js } = useAxiosGet(
    "http://localhost:8000/annotations",
            {
              params: {
                fname:segmParam.fname,
              }
            }
  );

// loading rpeaks determined fully automatically by Neurokit 2 
  const { data: nk_rpeaks, error: error_nk, loaded: loaded_nk } = useAxiosGet(
    "http://localhost:8000/nk_rpeaks",
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
  
  if (loaded_rec && loaded_js && loaded_nk) {
    // segment of original record 
    const segmentData = data_rec.slice(segmParam.at, segmParam.at + segmParam.length);
    const idxVisualArray = segmentData.map((data) => data.idx);
    const valueVisualArray = segmentData.map((data) => data.value);
 
    // edited rpeaks of original record
    const idxVisualRpeaks = annot_js.rpeaks.filter((rpeak) => rpeak.sampleIndex >= segmParam.at && rpeak.sampleIndex < segmParam.at + segmParam.length)
    .map((rpeak) => rpeak.sampleIndex - segmParam.at);
    const annotationVisualValues = annot_js.rpeaks.filter((rpeak) => rpeak.sampleIndex >= segmParam.at && rpeak.sampleIndex < segmParam.at + segmParam.length)
    .map((rpeak) => rpeak.annotationValue);

    // not edited rpeaks of original record (Neurokit2)
    const idxVisualNkRpeaks = nk_rpeaks.filter((rpeak) => rpeak >= segmParam.at && rpeak < segmParam.at + segmParam.length)
    .map((rpeak) => rpeak - segmParam.at);
    const annotationVisualValuesNk = idxVisualNkRpeaks.map(() => "N");
    // console.log(annotationVisualValuesNk);
    
    // noise annotations of original record 
    // const noiseVisualAnnotations = noiseAnnotations(annot_js.noises, segmParam.at, segmParam.length);
    const noiseVisualAnnotations = [];

    //chart.js data & options for original record with edited rpeaks
    const {data, options} = generateChartConfig(idxVisualArray, valueVisualArray,
        idxVisualRpeaks, annotationVisualValues, noiseVisualAnnotations);

    //chart.js data & options for original record with not edited rpeaks
    const {data:data_nk, options:options_nk} = generateChartConfig(idxVisualArray, valueVisualArray,
          idxVisualNkRpeaks, annotationVisualValuesNk, noiseVisualAnnotations);
    options_nk.scales.x.ticks.display = false;

    return (
      <div onKeyDown={handleArrowKey} tabIndex="0" >
        
        <label>
            at:
            <input type="number" name="at" value={segmParam.at} onChange={handleInputChange} />
          </label>
          <label>
            length:
            <input type="number" name="length" value={segmParam.length} onChange={handleInputChange} />
          </label>

          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Failo vardas: {segmParam.fname}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Reikšmių: {data_rec.length}
          &nbsp;&nbsp;&nbsp;&nbsp;Viršuje - rpeaks koreguoti rankomis  
          <ShowGraph data={data} options={options} width={1200} height={300}/>
          <ShowGraph data={data_nk} options={options_nk} width={1200} height={300}/>
      
      </div>
    );
  }
  return <span>Loading...</span>;
};

const EkgRpeaks = () => {

  const {segmParam, setSegmParam} = useContext(SegmParamContext);
  
  console.log("segmParam.fname:", segmParam.fname)
  if (segmParam.fname === '9999999.999') { 
    return(
      <div>
      <h1>Pasirink įrašą!</h1>
      </div>
    ); 
  } else { 
    return(
      <div>
      <EkgRpeaksShow />
      </div>
    );
  }
}

export default EkgRpeaks