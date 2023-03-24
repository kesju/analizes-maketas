//  Parodo pagrindinę informaciją apie ekstrasistoles (iš json)

import {useContext, React} from 'react';
import useAxiosGet from "../components/useAxiosGet";
import SegmParamContext from '../components/SegmParamContext'


const ShowPrm = ({prm}) => {

    // const fname = useContext(SegmParamContext);
    // const {segmParam, setSegmParam} = useContext(SegmParamContext);

    return(
        <ul>
           <h1>File Name: {prm.file_name},  įrašo parametrai:</h1>
           <li>UserId: {prm.userId}</li>
           <li>RecordingId: {prm.recordingId}</li>
           <li>N: {prm.N}</li>
           <li>S: {prm.S}</li>
           <li>V: {prm.V}</li>
           <li>U: {prm.U}</li>
           <li>Tr: {prm.Tr}</li>
           <li>flag: {prm.flag}</li>
           <li>incl: {prm.incl}</li>
           <li>comment: {prm.comment}</li>
           {/* <li>recorded_at: {date_at}</li> */}
        </ul>
        );
    } 

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

const EkgPrmShow = () => {
    // const {fname} = useContext(SegmParamContext);
    const {segmParam, setSegmParam} = useContext(SegmParamContext);
    
       // const [prm, setPrm] = useState({});
    // const [error, setError] = useState("");

    const { data: data_prm, error: error_prm, loaded: loaded_prm } = useAxiosGet(
      "http://localhost:8000/ekgprm",
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
  

    if (loaded_prm && loaded_js) {
    
      const sElements = annot_js.rpeaks.filter(element => element.annotationValue === 'S');
      const vElements = annot_js.rpeaks.filter(element => element.annotationValue === 'V');
      console.log('sElements:',sElements)
      console.log('vElements:',vElements)
      console.log('annot_js.noises:',annot_js.noises)
      
      return(
        <div>
            {/* <h1>{data_prm.userId}</h1> */}
            <ShowPrm prm = {data_prm} /> 
            <MyAnnotations annotation= 'S' data={sElements} />
            <MyAnnotations annotation= 'V' data={vElements} />
            <MyNoises noiseAnnotations = {annot_js.noises} />
        </div>
        );
      }
    return <span>Loading...</span>;
}

const EkgPrm = () => {
  // const {fname} = useContext(SegmParamContext);
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
      <EkgPrmShow />
      </div>
    );
  }
}
export default EkgPrm;