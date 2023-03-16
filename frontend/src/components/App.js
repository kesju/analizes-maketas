import {useContext, useState, useEffect, React} from 'react';
import { Routes, Route } from "react-router-dom"
import EkgGraph from "../pages/EkgGraph"
import EkgNoises from "../pages/EkgNoises"
import EkgRpeaks from "../pages/EkgRpeaks"
import EkgPrm from "../pages/EkgPrm"
import EkgVal from "../pages/EkgVal"
import Analysis from "../pages/Analysis"
import Filtration from "../pages/Filtration"
import Testing from "../pages/Testing"
import Header from "./ui/Header"
import axios from "axios";
import AuthContext from './AuthContext'
import {DataGrid } from '@mui/x-data-grid';

const AuthProvider = ({ children, value }) => (
  <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
);

function ControlledSelectionGrid({ setAuth }) {
  
  const client = axios.create({
    baseURL: "http://localhost:8000" 
  });
  
  const [arr, updateArr] = useState([]);
  
  useEffect(() => {
    client.get('/').then((response) => {
      updateArr(response.data);
    });
  }, [client]);   
  
  const auth = useContext(AuthContext);

  const onRowSelect = (event) => {
    const Fname = event.row.col2;
    console.log("on row click", Fname);
    setAuth(Fname);
  };

 // Variantas iš failo derinimui:
  // const jsonFile = require('../list_tst.json');
  // let arr = jsonFile.data;

  const columns = [
      { field: 'col1', headerName: 'id', width: 60 },
      { field: 'col2', headerName: 'file_name', width: 150 },
      { field: 'col3', headerName: 'recordingId', width: 250 },
      { field: 'col4', headerName: 'userId', width: 250 },
      { field: 'col5', headerName: 'S', width: 50 },
      { field: 'col6', headerName: 'V', width: 50 },
      { field: 'col7', headerName: 'incl', width: 50 },
      { field: 'col8', headerName: 'flag', width: 50 },
      { field: 'col9', headerName: 'comment', width: 250 },
    ];

  const rows = arr.map((item, index) => ({
           id: index + 1,
           col1: index+1,
           col2: item.file_name,
           col3: item.recordingId,
           col4: item.userId,
           col5: item.S,
           col6: item.V,
           col7: item.incl,
           col8: item.flag,
           col9: item.comment,
  }))
  console.log(rows)

  const [selectedRows, setSelectedRows] = useState([]);
  
  
  return (
    <div style={{ height: 500, width: '100%' }}>
      <DataGrid
          checkboxSelection = {false}
          
          onSelectionModelChange={(ids) => {const selectedIDs = new Set(ids);
          const selectedRows = rows.filter((row) => selectedIDs.has(row.id),);
          setSelectedRows(selectedRows);
        }}

        onRowClick={onRowSelect}
        rows={rows}
        columns={columns} 
      />
      {/* <pre style={{ fontSize: 10 }}>
        {JSON.stringify(selectedRows, null, 4)}
      </pre> */}
      <h4>Selected: {auth}</h4>
      
    </div>
  );
}

function App() {

  const [auth, setAuth] = useState("9999999.999");

  useEffect(() => {
    console.log("auth updated to: " + auth);
  }, [auth]);

  const changeAuth = (value) => {
    setAuth(value);
  };
  
  return (
    <div className="App">
      <AuthProvider value={auth}>
        <Header></Header>
        <Routes>
          <Route path="/" element={ <ControlledSelectionGrid setAuth={changeAuth}/> } />
          <Route path="ekggraph" element={ <EkgGraph/> } />
          <Route path="ekgprm" element={ <EkgPrm/> } />
          <Route path="ekgvalues" element={ <EkgVal/> } />
          <Route path="ekgnoises" element={ <EkgNoises/> } />
          <Route path="ekgrpeaks" element={ <EkgRpeaks/> } />
          <Route path="analysis" element={ <Analysis/> } />
          <Route path="filtration" element={ <Filtration/> } />
          <Route path="testing" element={ <Testing/> } />
        </Routes>
      </AuthProvider>
    </div>
  )
}

export default App;
