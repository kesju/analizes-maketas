// Čia bus EKG grafikas su pažymėtais triukšmais

import {useEffect, useState, useContext, React} from 'react';
import AuthContext from '../components/AuthContext'
import UPlotReact from 'uplot-react';
import 'uplot/dist/uPlot.min.css';
import './MyChart.css';
import 'uplot/dist/uPlot.min.css';
import axios from "axios";

const ShowGraph = ({data, options, className}) => {

  const auth = useContext(AuthContext);

    if (auth === '9999999.999') { 
      return(
        <h1>Pasirink įrašą!</h1>
      ); 
    } else { 

    return(
      // <div>
        <UPlotReact data={data} options={options} className={className}/>
      // </div>
    );
  } 
}

const fetchRecord = async (auth) => {
try {
  const { data } = await axios.get(
    "http://localhost:8000/record",
    {
      params: {
        fname:auth,
      }
    }
  );
  console.log("cia record",data)
  return { status: "success", response: data };    
  } catch (error) {
  return { status: "failure", response: error };
  }
};

const EkgNoises = () => {

  const auth = useContext(AuthContext);
  const [chartData, setChartData] = useState([]);
  const [record, setRecord] = useState([]);
  const [error, setError] = useState("");
  const [param, setParam] = useState({
    at: 0,
    length: 1000,
  })

  const fetchData = async (auth) => {
    const { status, response } = await fetchRecord(auth);
    if (status === "success") {
      // const chartData = response.map(({ idx, value }) => [idx, value]);
      setRecord(response);
      console.log('cia record', response)
      // console.log('cia auth',auth)
    } else if (status === "failure") {
      setError("Failed to fetch data!");
    }
  };

  // Čia originaus EKG įrašo grafikas 
  
  function handleInputChange(event) {
    const { name, value } = event.target;
    // let step = Math.max(1, Math.floor(param.length / 10));
    setParam({ ...param, [name]: parseInt(value) }); // include atStep in updated state
  }

  useEffect(() => {
    async function getData() {
      await fetchData(auth);
    }
    getData();
  }, [auth]);
  
  function handleKeyDown(event) {
    const step = Math.max(1, Math.floor(param.length / 10));

    switch (event.keyCode) {
      case 37: // left arrow key
      setParam({ ...param, at: (param.at - step) >= 0 ? param.at - step : 0});
      break;
      case 38: // up arrow key
      setParam({ ...param, length: (param.length + 100) <= record.length ? param.length + 100 : record.length });
      break;
      case 39: // right arrow key
      setParam({ ...param, at: (param.at + step) <= record.length ? param.at + step : param.at });
      break;
      case 40: // down arrow key
      setParam({ ...param, length: Math.max(param.length - 100, 100) });
      break;
      default:
        break;
      }
    }
    
  const options = {
    width: 1400,
    height: 400,
    series: [
      {},
      {
        label: 'Values',
        stroke: 'blue',
      },
  ],
    scales: {
      x: {
        time: false,
      },
    },
  };

  useEffect(() => {
    const generateChartData = () => {
      const segmentData = record.slice(param.at, param.at + param.length);
      const idxArray = segmentData.map((data) => data.idx);
      const valueArray = segmentData.map((data) => data.value);
      const chartData = [idxArray, valueArray]; 
      setChartData(chartData);
    };  
    generateChartData();
  }, [record, param]);

  return (
    // <div onKeyDown={handleKeyDown} tabIndex="0" style={{ display: 'flex' }}>
    <div onKeyDown={handleKeyDown} tabIndex="0" >
      
      {/* <form> */}
        <label>
          at:
          {/* <input type="number" name="at" value={param.at} onChange={handleInputChange} /> */}
          <input type="number" name="at" value={param.at} onChange={handleInputChange} />
        </label>
        {/* <br /> */}
        <label>
          length:
          <input type="number" name="length" value={param.length} onChange={handleInputChange} />
        </label>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Failo vardas: {auth}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Reikšmių: {record.length}  
      {/* </form> */}
      {/* <br /> */}
      
      <ShowGraph data={chartData} options={options} className={"my-chart"}/>
    </div>
  );
}

export default EkgNoises


