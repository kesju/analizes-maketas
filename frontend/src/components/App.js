import {useContext, useState, React} from 'react';
import { Routes, Route } from "react-router-dom"
import EkgGraph from "../pages/EkgGraph"
import EkgNoises from "../pages/EkgNoises"
import EkgRpeaks from "../pages/EkgRpeaks"
import EkgPrm from "../pages/EkgPrm"
import CompareAnalysis from "../pages/CompareAnalysis"
import Analysis from "../pages/Analysis"
import Filtration from "../pages/Filtration"
import Testing from "../pages/Testing"
import Header from "./ui/Header"
import useAxiosGet from './useAxiosGet'
import SegmParamContext from './SegmParamContext'
import {DataGrid } from '@mui/x-data-grid';

const columns = [
  { field: 'col1', headerName: 'id', width: 60 },
  { field: 'col2', headerName: 'file_name', width: 150 },
  { field: 'col3', headerName: 'recordingId', width: 250 },
  { field: 'col4', headerName: 'userId', width: 250 },
  { field: 'col5', headerName: 'S', width: 50 },
  { field: 'col6', headerName: 'V', width: 50 },
  { field: 'col7', headerName: 'Tr', width: 50 },
  { field: 'col8', headerName: 'incl', width: 50 },
  { field: 'col9', headerName: 'flag', width: 50 },
  { field: 'col10', headerName: 'comment', width: 250 },
];

function GridShow({initialValues}) {

  const { data: data_lst, error: error_lst, loaded: loaded_lst } = useAxiosGet(
      "http://localhost:8000", {}
      );
        
  if (loaded_lst) {
      console.log('lst:',data_lst)

      return(
          <div>
              <ControlledSelectionGrid initialValues = {initialValues} data_lst = {data_lst}/>
          </div>
      )
  }
  return <span>Loading...</span>;        
}

function ControlledSelectionGrid({initialValues, data_lst }) {
  
  const {segmParam, setSegmParam} = useContext(SegmParamContext);
  const [searchQuery, setSearchQuery] = useState('');
  
  // const [initialValues, setInitialValues] = useState({
  //   at: segmParam.at,
  //   length: segmParam.length});

  
        console.log('lst:',data_lst)
        console.log('segmParam:', segmParam)
        
        const [rows, setRows] = useState(data_lst.map((item, index) => ({
          id: index + 1,
          col1: index+1,
          col2: item.file_name,
          col3: item.recordingId,
          col4: item.userId,
          col5: item.S,
          col6: item.V,
          col7: item.Tr,
          col8: item.incl,
          col9: item.flag,
          col10: item.comment,
          })));
        
        
        console.log('columns:', columns)
        console.log('rows:',rows)
        
        const onRowSelect = (params, event) => {
              setSegmParam({
                ...segmParam,    // copy all the properties of the existing object
                fname: params.row.col2, // set the new value for fname
                at: initialValues.at,
                length: initialValues.length  
              });
            console.log('segmParam selected:', segmParam)
        };

        // const jsonFile = require('./list_tst.json');
        // let arr = jsonFile.data;
        
        const handleSearchInputChange = (event) => {
            const query = event.target.value;
            setSearchQuery(query);
            const filteredRows = data_lst.filter((item) => item.file_name.includes(query));
            setRows(filteredRows.map((item, index) => ({
              id: index + 1,
              col1: index+1,
              col2: item.file_name,
              col3: item.recordingId,
              col4: item.userId,
              col5: item.S,
              col6: item.V,
              col7: item.Tr,
              col8: item.incl,
              col9: item.flag,
              col10: item.comment,
            })));
        };
        
        return (
            <div style={{ height: 400, width: '100%' }}>
            <input type="text" value={searchQuery} onChange={handleSearchInputChange} placeholder="Search file name..." />
            <DataGrid
                justifyContent="end"
                rows={rows}
                columns={columns}
                disableSelectionOnClick={true}
                onRowClick={onRowSelect}
            />
                <h4>&nbsp;&nbsp;fname: {segmParam.fname} &nbsp;at:{segmParam.at}  &nbsp;length:{segmParam.length}</h4>
            </div>
        );
}

function App() {

  // const SegmParamProvider = ({ children, value }) => (
  //   <SegmParamContext.Provider value={value}>{children}</SegmParamContext.Provider>
  // );
  
  const initialValues = { fname: '9999999.999', at: 0, length: 1000 };
  
  const [segmParam, setSegmParam] = useState({
    fname: initialValues.fname,
    at: initialValues.at,
    length: initialValues.length
  });

  return (
    <div className="App">
      <SegmParamContext.Provider value={{
        segmParam,
        setSegmParam
      }}>

      <Header></Header>
        <Routes>
          <Route path="/" element={ <GridShow initialValues = {initialValues}/> } />
          <Route path="ekggraph" element={ <EkgGraph/> } />
         <Route path="ekgprm" element={ <EkgPrm/> } />
          <Route path="ekgrpeaks" element={ <EkgRpeaks/> } />
          <Route path="filtration" element={ <Filtration/> } />
          <Route path="analysis" element={ <Analysis/> } />
          <Route path="ekgnoises" element={ <EkgNoises/> } />
          <Route path="compareanalysis" element={ <CompareAnalysis/> } />
          <Route path="testing" element={ <Testing/> } />
        </Routes>
      </SegmParamContext.Provider>
    </div>
  )
}

export default App;
