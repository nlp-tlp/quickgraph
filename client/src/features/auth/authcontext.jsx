import { useEffect, createContext } from "react";
import {
  setIsAuthenticated,
  selectIsAuthenticated,
  validateToken,
} from "./userSlice";
import { useDispatch, useSelector } from "react-redux";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    dispatch(validateToken());
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={[isAuthenticated, setIsAuthenticated]}>
      {children}
    </AuthContext.Provider>
  );
};
