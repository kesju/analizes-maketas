//  Parodo pagrindinę informaciją apie ekstrasistoles (iš json)

import {useEffect, useState, useContext, React} from 'react';
import AuthContext from '../components/AuthContext'
import axios from "axios";

const ShowPrm = (prm) => {
    const auth = useContext(AuthContext);

    if (auth === '9999999.999') { 
      return(
        <h1>Pasirink įrašą!</h1>
      ); 
    } else { 
      // const datetime_at = prm.recorded_at;
      // const date_at = datetime_at.slice(0, 10);
      // console.log("date_at:", date_at)

      return(
        <ul>
           <h1>Ekg parametrai:</h1>
           <li>File Name: {prm.file_name}</li>
           <li>UserId: {prm.userId}</li>
           <li>RecordingId: {prm.recordingId}</li>
           <li>N: {prm.N}</li>
           <li>S: {prm.S}</li>
           <li>V: {prm.V}</li>
           <li>flag: {prm.flag}</li>
           <li>incl: {prm.incl}</li>
           <li>comment: {prm.comment}</li>
           {/* <li>recorded_at: {date_at}</li> */}
        </ul>
        );
      } 
  }

const fetchRecordPrm = async (id) => {
  try {
    const { data } = await axios.get(`http://localhost:8000/ekgprm/${id}`);
      return { status: "success", response: data };
    } catch (error) {
      return { status: "failure", response: error };
    }
};

const EkgPrm = () => {
    const auth = useContext(AuthContext);

    const [prm, setPrm] = useState({});
    const [error, setError] = useState("");
    
    useEffect(() => {
      const fetchData = async () => {
        const { status, response } = await fetchRecordPrm(auth);
        if (status === "success") {
          setPrm(response);
          console.log('cia response',response)
          // console.log('cia auth',auth)
        } else if (status === "failure") {
          setError("Failed to fetch data!");
        }
      };
      fetchData();
    }, [auth]);
    console.log('cia error',error)

    return(
      <div>
        {/* <h1>{prm.userId}</h1> */}
        {ShowPrm(prm)} 
     </div>
    )
}

export default EkgPrm;