// Čia išveda originalaus EKG įrašo grafiką: yra funkcija window, kuriama - context ir paieska

import {useState, useContext, useEffect, React} from 'react';
import SegmParamContext from '../components/SegmParamContext'
import {noiseAnnotations} from '../components/utils/noiseAnnotations'
import {generateChartConfig} from '../components/utils/generateChartConfig'
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
  
  const {segmParam, setSegmParam} = useContext(SegmParamContext);
  // const fname = useContext(AuthContext);

    if (segmParam.fname === '9999999.999') { 
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

const EkgGraph = () => {

  const {segmParam, setSegmParam} = useContext(SegmParamContext);
  // const fname = "1642627.410";
  console.log('segmParam:', segmParam.fname, segmParam.param.at, segmParam.param.length)

  const [showWindow, setShowWindow] = useState(false);
  const [windowValues, setWindowValues] = useState(null);

  // const [param, setParam] = useState({
  //   at: 0,
  //   length: 1000,
  // })
  
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
        setWindowValues('Langas vaizdavimui');
      } else {
        setShowWindow(false);
        // setShowWindow(true);
        setWindowValues(null);
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
      param: {
        ...prevState.param,
        [name]: parseInt(value)
      }
    }));
  };
  
  
  function handleArrowKey(event) {
    const step = Math.max(1, Math.floor(segmParam.param.length / 10));
    
    console.log("KLAVISO PASPAUDIMAS", event.keyCode)
    console.log("step", step)

    switch (event.keyCode) {
      case 37: // left arrow key - atgal
      setSegmParam({ ...segmParam.param, at: (segmParam.param.at - step) >= 0 ? segmParam.param.at - step : 0});
      break;
      case 40: // up arrow key - išplečia
      setSegmParam({ ...segmParam.param, length: (segmParam.param.length + 100) <= data_rec.length ? segmParam.param.length + 100 : data_rec.length });
      break;
      case 39: // right arrow key - pirmyn
      setSegmParam({ ...segmParam.param, at: (segmParam.param.at + step) <= data_rec.length ? segmParam.param.at + step : segmParam.param.at });
      break;
      case 38: // down arrow key - suglaudžia
      setSegmParam({ ...segmParam.param, length: Math.max(segmParam.param.length - 100, 100) });
      break;
      default:
        break;
      }
    }
  
  if (loaded_rec && loaded_js && loaded_prm) {
    const segmentData = data_rec.slice(segmParam.param.at, segmParam.param.at + segmParam.param.length);
    // console.log("segmentData:", segmentData)
    const idxVisualArray = segmentData.map((data) => data.idx);
    const valueVisualArray = segmentData.map((data) => data.value);
 
    const idxVisualRpeaks = annot_js.rpeaks.filter((rpeak) => rpeak.sampleIndex >= segmParam.param.at && rpeak.sampleIndex < segmParam.param.at + segmParam.param.length)
    .map((rpeak) => rpeak.sampleIndex - segmParam.param.at);
    // console.log(idxVisualRpeaks);
  
    const annotationVisualValues = annot_js.rpeaks.filter((rpeak) => rpeak.sampleIndex >= segmParam.param.at && rpeak.sampleIndex < segmParam.param.at + segmParam.param.length)
    .map((rpeak) => rpeak.annotationValue);
    // console.log(annotationVisualValues);

    const noiseVisualAnnotations = noiseAnnotations(annot_js.noises, segmParam.param.at, segmParam.param.length);

    const {data, options} = generateChartConfig(idxVisualArray, valueVisualArray,
      idxVisualRpeaks, annotationVisualValues, noiseVisualAnnotations);
  
    console.log('showWindow:',showWindow)
          
    return (
      <div onKeyDown={handleArrowKey} tabIndex="0" >
        {/* <form> */}
          <label>
            at:
            <input type="number" name="at" value={segmParam.param.at} onChange={handleInputChange} />
          </label>
          {/* <br /> */}
          <label>
            length:
            <input type="number" name="length" value={segmParam.param.length} onChange={handleInputChange} />
          </label>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Failo vardas: {segmParam.fname}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Reikšmių: {data_rec.length}  
          <ShowGraph data={data} options={options} width={1200} height={400}/>
      
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
        </div>
      )}


      </div>
    );
  }
    
  return <span>Loading...</span>;
};

export default EkgGraph