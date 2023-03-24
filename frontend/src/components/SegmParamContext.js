import React from "react";

const SegmParamContext = React.createContext({
  fname: '9999999.999',
  at: 0,
  length: 1000,
  setSegmParam: () => {}
});

export default SegmParamContext;