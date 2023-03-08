import React from "react";

const AuthContext = React.createContext({
  auth: '',
  setAuth: () => {}
});

export default AuthContext;