// Čia bus EKG grafikas su ML rezultatais

import {React, useContext} from 'react'
import AuthContext from "../components/AuthContext" 

function Analysis() {
  const auth = useContext(AuthContext);

    return (
      <div>
        <h1>Puslapis analizės rezultatams</h1>
        <h3>Failo vardas: {auth}</h3>
      </div>
    );
    // alert("Analysis Page")
  }
  
  export default Analysis;