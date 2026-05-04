import React, { createContext, useContext, useState } from "react";
import { setAuthToken } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);

  const login = (accessToken, user) => {
    setToken(accessToken);
    setUsername(user);
    setAuthToken(accessToken);
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
