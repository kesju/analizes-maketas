import React from "react";

const SegmParamContext = React.createContext({
  fname: '',
  param: {
    at: 0,
    length: 1000,
  },
  setSegmParam: () => {}
});

export default SegmParamContext;