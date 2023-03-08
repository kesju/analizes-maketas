// laikinai naudojamas EKG įrašo reikšmėms parodyti

import {useEffect, useState, useContext, React} from 'react';
import AuthContext from '../components/AuthContext'
import { useHotkeys } from 'react-hotkeys-hook';
import axios from "axios";

const ShowValues = ({at, length, prm}) => {
  const auth = useContext(AuthContext);

    if (auth === '9999999.999') { 
      return(
        <h1>Pasirink įrašą!</h1>
      ); 
    } else { 

    return(
    <div>
     
      <ol>
          {prm.map(function (item) {
            return <li key={item.idx}>&nbsp; {item.idx}&nbsp;&nbsp;&nbsp;&nbsp;{Math.round(item.value*100)/100}</li>;
          })}
      </ol>
    </div>
    );
  } 
}

const fetchRecordVal = async (auth,at,length) => {
try {
  const { data } = await axios.get(
    "http://localhost:8000/values",
    {
      params: {
        fname:auth,
        at,
        length
      }
    }
  );
  console.log(data)
  return { status: "success", response: data };    
  } catch (error) {
  return { status: "failure", response: error };
  }
};

const EkgVal = () => {

  const auth = useContext(AuthContext);
  const [prm, setPrm] = useState([]);
  const [error, setError] = useState("");
  const [segment, setSegment] = useState({
    at: 0,
    length: 10,
    offset: 0,
    mult:1
  })
  // const [at, setAt] = useState(0)
  // const [length, setLength] = useState(10)

  // const handleSegment = (event) => {
  //   setSegment({at: event.target.value});
  //   };

    function handleSegment(evt) {
      const value = evt.target.value;
      console.log(value)
      setSegment({
        ...segment,
        [evt.target.name]: value
      });
    }  

  useEffect(() => {
  const fetchData = async (auth,at,offset,length) => {
    const { status, response } = await fetchRecordVal(auth,at+offset,length);
    if (status === "success") {
      setPrm(response);
      console.log('cia response',response)
      // console.log('cia auth',auth)
    } else if (status === "failure") {
      setError("Failed to fetch data!");
    }
  };
  fetchData(auth,segment.at,segment.offset,segment.length);
  }, [auth,segment.at,segment.offset,segment.length]);

  const handlePrev = () => {
    setSegment((prevStatus) => ({
      ...prevStatus,
      offset:  (prevStatus.offset > 0 ? prevStatus.offset - 1 : 0),
      // offset: prevStatus.offset - 1,
    }));
  };

  const handleNext = () => {
    setSegment((prevStatus) => ({
      ...prevStatus,
      offset:  (prevStatus.offset < 29 ? prevStatus.offset + 1 : 30),
      // offset: prevStatus.offset + 1,
    }));
  };

  useHotkeys('left', handlePrev);
  useHotkeys('right', handleNext);

  return(
  <div>
    {/* <AuthProvider value={auth}> */}
    <h1>Ekg reikšmės</h1>
      <h3>Failo vardas: {auth}</h3>
      <h3>Nuo: {segment.at+segment.offset} &nbsp; Reikšmių skaičius: {segment.length}</h3>
     <SetSegment at = {segment.at+segment.offset} length = {segment.length} onSegment = {handleSegment} ></SetSegment> 
     <ShowValues at = {segment.at+segment.offset} length = {segment.length} prm = {prm} /> 
     <button onClick={handlePrev}>Previous</button>
     <button onClick={handleNext}>Next</button>
     {/* <ShowValues at, length, prm = {at, length, prm} />  */}
    {/* </AuthProvider> */}
  </div>
  )
}

const SetSegment = (props) => (
  <form>
     <label>
        At:
        <input
          type="text"
          name="at"
          value={props.at}
          onChange={props.onSegment}
        />
      </label>
      <label>
        Length:
        <input
          type="text"
          name="length"
          value={props.length}
          onChange={props.onSegment}
        />
      </label>
  </form>
);


export default EkgVal;
