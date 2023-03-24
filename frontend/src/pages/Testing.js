
// Naudojamas testavimui su generuotais duomenimis

import {React, useContext} from 'react'
import SegmParamContext from '../components/SegmParamContext'
import uPlot from 'uplot';
// import UplotReact from 'uplot-react';
import 'uplot/dist/uPlot.min.css';
import { useRef, useEffect } from 'react';


function Testing() {
  const {segmParam, setSegmParam} = useContext(SegmParamContext);

// EKG įrašo reikšmės, atsisiunčiama iš backend
 const data_orig = [  
  {idx: 0, value: 1.96},
  {idx: 1, value: 1.94},
  {idx: 2, value: 1.92},
  {idx: 3, value: 1.88},
  {idx: 4, value: 1.82},
  {idx: 5, value: 1.77},
  {idx: 6, value: 1.73},
  {idx: 7, value: 1.71},
  {idx: 8, value: 1.69},
  {idx: 9, value: 1.64},
 ];

 const idxData = data_orig.map((data) => data.idx);
 const valueData = data_orig.map((data) => data.value);
 const data = [idxData, valueData];
 console.log('cia data',data)
 
// rpeaks vietos ir anotacijos iš json, atsisiunčiama iš backend
// Vaizdavimas: 'R': case 'NW', annot: case 'SW'
const data_annot = [
  {idx: 2, annot: 'N'},
  {idx: 3, annot: 'S'},
  {idx: 5, annot: 'V'},
  {idx: 8, annot: 'U'},
];

const idxAnnot = data_annot.map((data) => data.idx);
const valueAnnot = data_annot.map((data) => data.annot);
const annot = [idxAnnot, valueAnnot];
console.log('cia annot', annot)


// rpeaks vietos ir ML anotacijos, atsisiunčiama iš backend
// Vaizdavimas: ml: case 'NE'
const data_ml = [
  {idx: 2, ml: 'N'},
  {idx: 5, ml: 'S'},
  {idx: 8, ml: 'V'},
]

const idxMl = data_ml.map((data) => data.idx);
const valueMl = data_ml.map((data) => data.ml);
const ml = [idxMl, valueMl];
console.log('cia ml', ml)


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
        <h3>Failo vardas: {segmParam.fname}</h3>
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