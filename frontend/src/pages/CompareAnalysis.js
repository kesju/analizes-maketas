// Čia išveda originalaus EKG įrašo grafiką

import {useContext, React} from 'react';
import SegmParamContext from '../components/SegmParamContext'
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

      return(
        // <div className="my-chart-container">
        <div>
        <Line width={width} height={height} options={options} data={data} />;
        </div>
      );
} 


const CompareAnalysisShow = () => {

  const {segmParam, setSegmParam} = useContext(SegmParamContext);
  
  const { data: data_rec, error: error_rec, loaded: loaded_rec } = useAxiosGet(
    "http://localhost:8000/record",
          {
            params: {
              fname:segmParam.fname,
            }
          }
  );
          
  const { data: annot_js, error: error_js, loaded: loaded_js } = useAxiosGet(
    "http://localhost:8000/annotations",
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
  
  if (loaded_rec && loaded_js && loaded_rsl) {

    // segment of original record 
    const segmentData = data_rec.slice(segmParam.at, segmParam.at + segmParam.length);
    const idxVisualArray = segmentData.map((data) => data.idx);
    const valueVisualArray = segmentData.map((data) => data.value);
 
    // edited rpeaks of original record
    const idxVisualRpeaks = annot_js.rpeaks.filter((rpeak) => rpeak.sampleIndex >= segmParam.at && rpeak.sampleIndex < segmParam.at + segmParam.length)
    .map((rpeak) => rpeak.sampleIndex - segmParam.at);
    const annotationVisualValues = annot_js.rpeaks.filter((rpeak) => rpeak.sampleIndex >= segmParam.at && rpeak.sampleIndex < segmParam.at + segmParam.length)
    .map((rpeak) => rpeak.annotationValue);

    // noise annotations of original record 
    const noiseIntervals = noiseAnnotations(annot_js.noises, segmParam.at, segmParam.length);
    
    // annotation numbers of original record
    const annotationNumbers = annotationCounts(annot_js.rpeaks);

    //chart.js data & options for original record
    const {data, options} = generateChartConfig(idxVisualArray, valueVisualArray,
       idxVisualRpeaks, annotationVisualValues, noiseIntervals);
    
    // not edited rpeaks of analysed record 
    const idxMlVisualRpeaks = data_rsl.automatic_classification.filter((rpeak) => rpeak.sample >= segmParam.at && rpeak.sample < segmParam.at + segmParam.length)
    .map((rpeak) => rpeak.sample - segmParam.at);
    const annotationMlVisualValues = data_rsl.automatic_classification.filter((rpeak) => rpeak.sample >= segmParam.at && rpeak.sample < segmParam.at + segmParam.length)
    .map((rpeak) => rpeak.annotation);
      
    // automatic noise annotations of analysed record 
    const noiseMlIntervals = []; // Automatic algorithm is absent
    
    // annotation numbers of analysed record
    const mlAnnotationNumbers = mlAnnotationCounts(data_rsl.automatic_classification);
    
    //chart.js data & options for analysed record
    const {data:data_ml, options:options_ml} = generateChartConfig(idxVisualArray, valueVisualArray,
    idxMlVisualRpeaks, annotationMlVisualValues, noiseMlIntervals);
    options_ml.scales.x.ticks.display = false;
    
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

          &nbsp;&nbsp;&nbsp;Failas: {segmParam.fname}&nbsp;&nbsp;
          &nbsp;Reikšmių: {data_rec.length} &nbsp;Viršuje - anot.
          &nbsp;Annot.:&nbsp;&nbsp; N:{annotationNumbers.N}
          &nbsp;S:{annotationNumbers.S} &nbsp;V:{annotationNumbers.V} &nbsp; U:{annotationNumbers.U} 
          &nbsp;&nbsp;ML:&nbsp;&nbsp; N:{mlAnnotationNumbers.N}
          &nbsp;S:{mlAnnotationNumbers.S} &nbsp;V:{mlAnnotationNumbers.V} &nbsp; U:{mlAnnotationNumbers.U} 
          <ShowGraph data={data} options={options} width={1200} height={250}/>
          <ShowGraph data={data_ml} options={options_ml} width={1200} height={250}/>
      
      </div>
    );
  }
    
  return <span>Loading...</span>;
};

const CompareAnalysis = () => {

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
      <CompareAnalysisShow />
      </div>
    );
  }

}  

export default CompareAnalysis