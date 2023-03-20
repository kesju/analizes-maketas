// Čia išveda originalaus EKG įrašo grafiką

import {useState, useContext, React} from 'react';
import AuthContext from '../components/AuthContext'
import {noiseAnnotations} from '../components/utils/noiseAnnotations'
import {generateChartConfig} from '../components/utils/generateChartConfig'
import {mlAnnotationCounts} from '../components/utils/mlAnnotationCounts'
import {annotationCounts} from '../components/utils/annotationCounts'
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

const ShowGraph = ({data, options, width, height}) => {

  const auth = useContext(AuthContext);

    if (auth === '9999999.999') { 
      return(
        <h1>Pasirink įrašą!</h1>
      ); 
    } else { 
      return(
        // <div className="my-chart-container">
        <div>
        <Line width={width} height={height} options={options} data={data} />;
        </div>
      );
  } 
}

const CompareAnalysis = () => {

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
  
  if (loaded_rec && loaded_js && loaded_rsl) {

    const segmentData = data_rec.slice(param.at, param.at + param.length);
    // console.log("segmentData:", segmentData)
    const idxVisualArray = segmentData.map((data) => data.idx);
    const valueVisualArray = segmentData.map((data) => data.value);
 
    const idxVisualRpeaks = annot_js.rpeaks.filter((rpeak) => rpeak.sampleIndex >= param.at && rpeak.sampleIndex < param.at + param.length)
    .map((rpeak) => rpeak.sampleIndex - param.at);
    // console.log(idxVisualRpeaks);
  
    const annotationVisualValues = annot_js.rpeaks.filter((rpeak) => rpeak.sampleIndex >= param.at && rpeak.sampleIndex < param.at + param.length)
    .map((rpeak) => rpeak.annotationValue);
    // console.log(annotationVisualValues);

    const noiseIntervals = noiseAnnotations(annot_js.noises, param.at, param.length);

    const {data, options} = generateChartConfig(idxVisualArray, valueVisualArray,
       idxVisualRpeaks, annotationVisualValues, noiseIntervals);
    
    const annotationNumbers = annotationCounts(annot_js.rpeaks);
    

    const idxMlVisualRpeaks = data_rsl.automatic_classification.filter((rpeak) => rpeak.sample >= param.at && rpeak.sample < param.at + param.length)
    .map((rpeak) => rpeak.sample - param.at);
    // console.log(idxVisualRpeaks);
  
    const annotationMlVisualValues = data_rsl.automatic_classification.filter((rpeak) => rpeak.sample >= param.at && rpeak.sample < param.at + param.length)
    .map((rpeak) => rpeak.annotation);
    // console.log(annotationVisualValues);
    
    const noiseMlIntervals = [];

    const {data:data_ml, options:options_ml} = generateChartConfig(idxVisualArray, valueVisualArray,
      idxMlVisualRpeaks, annotationMlVisualValues, noiseMlIntervals);
    options_ml.scales.x.ticks.display = false;
    
    const mlAnnotationNumbers = mlAnnotationCounts(data_rsl.automatic_classification);
    
    
    return (
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
          &nbsp;&nbsp;&nbsp;Failas: {auth}&nbsp;&nbsp;
          &nbsp;Reikšmių: {data_rec.length} &nbsp;Viršuje - anot.
          &nbsp;Annot.:&nbsp;&nbsp; N:{annotationNumbers.N}
          &nbsp;S:{annotationNumbers.S} &nbsp;V:{annotationNumbers.V} &nbsp; U:{annotationNumbers.U} 
          &nbsp;&nbsp;ML:&nbsp;&nbsp; N:{mlAnnotationNumbers.N}
          &nbsp;S:{mlAnnotationNumbers.S} &nbsp;V:{mlAnnotationNumbers.V} &nbsp; U:{mlAnnotationNumbers.U} 
          <ShowGraph data={data} options={options} width={1200} height={300}/>
          <ShowGraph data={data_ml} options={options_ml} width={1200} height={300}/>
      
      </div>
    );
  }
    
  return <span>Loading...</span>;
};

export default CompareAnalysis