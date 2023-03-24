// Čia išveda originalaus EKG įrašo grafiką

import {useState, useContext, React} from 'react';
import SegmParamContext from '../components/SegmParamContext'
import {generateChartConfig} from '../components/utils/generateChartConfig'

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

      return(
        <div>
        <Line width={width} height={height} options={options} data={data} />;
        </div>
      );
  } 

const FiltrationShow = () => {

  const {segmParam, setSegmParam} = useContext(SegmParamContext);

  const { data: data_rec, error: error_rec, loaded: loaded_rec } = useAxiosGet(
    "http://localhost:8000/record",
          {
            params: {
              fname:segmParam.fname,
            }
          }
  );

  const { data: filtered, error: error_flt, loaded: loaded_flt } = useAxiosGet(
    "http://localhost:8000/filtered",
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

  function handleInputChange(event) {
    const { name, value } = event.target;
    setSegmParam(prevState => ({
      ...prevState,
        [name]: parseInt(value)
    }));
  };
  
  
  function handleArrowKey(event) {
    const step = Math.max(1, Math.floor(segmParam.length / 10));
    
    console.log("KLAVISO PASPAUDIMAS", event.keyCode)
    console.log("step", step)

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
  
  if (loaded_rec && loaded_flt && loaded_js) {
    

    console.log("filtered.flt_param:", filtered.flt_param);
    console.log("filtered.values:", filtered.values);
    console.log("data_rec:", data_rec);
    console.log("annot_js.rpeaks:", annot_js.rpeaks);

    const segmentData = data_rec.slice(segmParam.at, segmParam.at + segmParam.length);
    console.log("segmentData:", segmentData)
    const idxVisualArray = segmentData.map((data) => data.idx);
    const valueVisualArray = segmentData.map((data) => data.value);

    const segmentDataFlt = filtered.values.slice(segmParam.at, segmParam.at + segmParam.length);
    console.log("segmentDataFlt:", segmentDataFlt)
    const idxVisualArrayFlt = segmentDataFlt.map((data) => data.idx);
    const valueVisualArrayFlt = segmentDataFlt.map((data) => data.value);

    const idxVisualRpeaks = annot_js.rpeaks.filter((rpeak) => rpeak.sampleIndex >= segmParam.at && rpeak.sampleIndex < segmParam.at + segmParam.length)
    .map((rpeak) => rpeak.sampleIndex - segmParam.at);
    console.log('idxVisualRpeaks:', idxVisualRpeaks);
  
    const annotationVisualValues = annot_js.rpeaks.filter((rpeak) => rpeak.sampleIndex >= segmParam.at && rpeak.sampleIndex < segmParam.at + segmParam.length)
    .map((rpeak) => rpeak.annotationValue);
    console.log('annotationVisualValues:', annotationVisualValues);

    const noiseVisualAnnotations = [];

    const {data, options} = generateChartConfig(idxVisualArray, valueVisualArray, idxVisualRpeaks,
           annotationVisualValues, noiseVisualAnnotations);
    const {data: data_flt, options: options_flt} = generateChartConfig(idxVisualArrayFlt, valueVisualArrayFlt, idxVisualRpeaks,
           annotationVisualValues,noiseVisualAnnotations);
    // options_flt.scales.x.ticks.display = true;
    options_flt.scales.x.ticks.display = false;

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

          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Failo vardas: {segmParam.fname}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Reikšmių: {filtered.values.length} 
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Viršuje po filtro: {filtered.flt_param.type} &nbsp;&nbsp;{filtered.flt_param.lowcut}Hz
          <ShowGraph data={data_flt} options={options_flt} width={1200} height={300} />
          <ShowGraph data={data} options={options} width={1200} height={300} />
      
      </div>
    );
  }
    
  return <span>Loading...</span>;
};

const Filtration = () => {

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
      <FiltrationShow />
      </div>
    );
  }
}
export default Filtration