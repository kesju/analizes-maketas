import {useEffect, useState} from 'react';
import axios from "axios";


const useAxiosPost = (url, param) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [loaded, setLoaded] = useState(false);
  
    useEffect(() => {
      (async () => {
        try {
          const response = await axios.get(
            url,
            param
          );
  
          setData(response.data);
        } catch (error) {
          setError(error.message);
        } finally {
          setLoaded(true);
        }
      })();
    }, []);
  
    return { data, error, loaded };
  };

export default useAxiosPost;  