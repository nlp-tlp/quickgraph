import history from "../utils/history";
import { logout, setIsAuthenticated, selectIsAuthenticated } from "./userSlice";
import { useDispatch, useSelector } from "react-redux";
import store from "../../app/store";
import { persistStore } from "redux-persist";
let persistor = persistStore(store);

export const AuthButton = ({ style, variant }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const logoutHandler = () => {
    dispatch(setIsAuthenticated(false));
    dispatch(logout()); // Clears users cookie
    persistor.purge(); // Purges redux persist store
    history.push("/"); // redirect to landing
  };

  const loginHandler = () => {
    history.push("/login");
  };

  let textLogin;
  let textLogout;
  if (variant && isAuthenticated) {
    textLogout = variant;
  } else if (variant && !isAuthenticated) {
    textLogin = variant;
  } else {
    textLogin = "login";
    textLogout = "logout";
  }

  return (
    <p onClick={isAuthenticated ? logoutHandler : loginHandler} style={style}>
      {isAuthenticated ? textLogout : textLogin}
    </p>
  );
};
