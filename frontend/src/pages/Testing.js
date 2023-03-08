
// Naudojamas testavimui su generuotais duomenimis

import {React, useContext} from 'react'
import AuthContext from "../components/AuthContext" 
import uPlot from 'uplot';
// import UplotReact from 'uplot-react';
import 'uplot/dist/uPlot.min.css';
import { useRef, useEffect } from 'react';


function Testing() {
  const auth = useContext(AuthContext);

 const data_orig = [  
{idx: 0, value: 1.9661428050815055, rpeak: ''},
{idx: 1, value: 1.948431710633961, rpeak: ''},
{idx: 2, value: 1.9298691212610537, rpeak: ''},
{idx: 3, value: 1.8826963023959589, rpeak: 'R'},
{idx: 4, value: 1.8241134515310036, rpeak: ''},
{idx: 5, value: 1.778643622516634, rpeak: 'R'},
{idx: 6, value: 1.738623361024586, rpeak: ''},
{idx: 7, value: 1.710183430517471, rpeak: 'R'},
{idx: 8, value: 1.690769346219201, rpeak: ''},
{idx: 9, value: 1.6488757958913551, rpeak: ''},
]

const idxArray = data_orig.map((data) => data.idx);
const valueArray = data_orig.map((data) => data.value);
const rpeaksArray = data_orig.filter(({ rpeak }) => rpeak === 'R'
);
const data = [idxArray, valueArray];   
console.log('cia data',data)
console.log('cia rpeaksArray',rpeaksArray)

const options = {
    width: 600,
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
  
    return (
      <div>
        <h1>Puslapis testavimui</h1>
        <h3>Failo vardas: {auth}</h3>
        <LineChart  options={options} data={data} />
      </div>
    );
    // alert("Analysis Page")
  }
  
  export default Testing;

  function LineChart({ data, options }) {
    const chartRef = useRef(null);
  
    useEffect(() => {
      if (chartRef.current !== null) {
        const chart = new uPlot(options, data, chartRef.current);
        return () => chart.destroy();
      }
    }, [data, options]);
  
    return <div ref={chartRef} />;
  }