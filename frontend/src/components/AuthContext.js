import React from "react";

const AuthContext = React.createContext({
  auth: '',
  at: 0,
  length: 1000,
  setAuth: () => {}
});

export default AuthContext;