import { createContext } from "react";
import { setIsAuthenticated, selectIsAuthenticated } from "./userSlice";
import { useSelector } from "react-redux";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return (
    <AuthContext.Provider value={[isAuthenticated, setIsAuthenticated]}>
      {children}
    </AuthContext.Provider>
  );
};
