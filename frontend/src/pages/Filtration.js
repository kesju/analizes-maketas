// Čia išveda originalaus EKG įrašo grafiką

import {useEffect, useState, useContext, React} from 'react';
import SegmParamContext from '../components/SegmParamContext'
import {generateChartConfig} from '../components/utils/generateChartConfig'
import {noiseAnnotations} from '../components/utils/noiseAnnotations'

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

function MyAnnotations(props) {
  const {annotation, data } = props;
  
  if (data.length === 0) {
    return <div>&nbsp;{annotation}: nėra</div>;
  }

  return (
    <div>
      <span >&nbsp;{annotation}: </span>
      {data.map((element, index) => (
        <span key={index}>
        {`${element.sampleIndex}`}
        {index < data.length - 1 ? ", " : ""}
        </span>
      ))}
    </div>
  );
}

function MyNoises(props) {
const {noiseAnnotations} = props;

if (noiseAnnotations.length === 0) {
  return <div>&nbsp;Pažymėtų triukšmų nėra</div>;
}

return (
  <div>  
     <div>
      <>Pažymėtų triukšmų intervalų: {noiseAnnotations.length} </>
     </div>
      {noiseAnnotations.map((noise, index) => (
        <span key={index}>
          {`(${noise.startIndex}, ${noise.endIndex})`}
          {index < noiseAnnotations.length - 1 ? ", " : ""}
        </span>
      ))}
    </div>
  );
}


const ShowGraph = ({data, options, width, height}) => {

      return(
        <div>
        <Line width={width} height={height} options={options} data={data} />;
        </div>
      );
  } 

const FiltrationShow = () => {

  const {segmParam, setSegmParam} = useContext(SegmParamContext);
  const [showWindow, setShowWindow] = useState(false);

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

  const { data: data_prm, error: error_prm, loaded: loaded_prm } = useAxiosGet(
    "http://localhost:8000/ekgprm",
          {
            params: {
              fname:segmParam.fname,
            }
          }
  );

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.ctrlKey && event.key === 'v') {
        setShowWindow(true);
      } else {
        setShowWindow(false);
      }
    }
    // console.log('showWindow:',showWindow)

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);



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
  
  if (loaded_rec && loaded_flt && loaded_js && loaded_prm) {

    // segment of original record 
    const segmentData = data_rec.slice(segmParam.at, segmParam.at + segmParam.length);
    const idxVisualArray = segmentData.map((data) => data.idx);
    const valueVisualArray = segmentData.map((data) => data.value);

    // segment of filtered record 
    const segmentDataFlt = filtered.values.slice(segmParam.at, segmParam.at + segmParam.length);
    const idxVisualArrayFlt = segmentDataFlt.map((data) => data.idx);
    const valueVisualArrayFlt = segmentDataFlt.map((data) => data.value);

    // edited rpeaks of original record
    const idxVisualRpeaks = annot_js.rpeaks.filter((rpeak) => rpeak.sampleIndex >= segmParam.at && rpeak.sampleIndex < segmParam.at + segmParam.length)
    .map((rpeak) => rpeak.sampleIndex - segmParam.at);
    const annotationVisualValues = annot_js.rpeaks.filter((rpeak) => rpeak.sampleIndex >= segmParam.at && rpeak.sampleIndex < segmParam.at + segmParam.length)
    .map((rpeak) => rpeak.annotationValue);

    // noise annotations of original record 
    // const noiseVisualAnnotations = []; - užblokuotas
    const noiseVisualAnnotations = noiseAnnotations(annot_js.noises, segmParam.at, segmParam.length);

    //chart.js data & options
    const {data, options} = generateChartConfig(idxVisualArray, valueVisualArray, idxVisualRpeaks,
           annotationVisualValues, noiseVisualAnnotations);
    const {data: data_flt, options: options_flt} = generateChartConfig(idxVisualArrayFlt, valueVisualArrayFlt, idxVisualRpeaks,
           annotationVisualValues,noiseVisualAnnotations);
    
    // options_flt.scales.x.ticks.display = true;
    options_flt.scales.x.ticks.display = false;

    // pop-up window 
    const sElements = annot_js.rpeaks.filter(element => element.annotationValue === 'S');
    const vElements = annot_js.rpeaks.filter(element => element.annotationValue === 'V'); 

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
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Apačioje po filtro {filtered.flt_param.type} &nbsp;{filtered.flt_param.lowcut}&nbsp;Hz
          <ShowGraph data={data} options={options} width={1200} height={300} />
          <ShowGraph data={data_flt} options={options_flt} width={1200} height={300} />
      
      {/* pop-up window */}
      {showWindow && (
            <div className="window">
               <ul>
           <h1>File Name: {data_prm.file_name}</h1>
           <li>N: {data_prm.N} S: {data_prm.S} V: {data_prm.V} U: {data_prm.U}</li>
           <li>Tr: {data_prm.Tr}</li>
           <li>flag: {data_prm.flag}</li>
           <li>incl: {data_prm.incl}</li>
           <li>comment: {data_prm.comment}</li>
        </ul>
            <MyAnnotations annotation= 'S' data={sElements} />
            <MyAnnotations annotation= 'V' data={vElements} />
            <MyNoises noiseAnnotations = {annot_js.noises} />
        </div>
        )}
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