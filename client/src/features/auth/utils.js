import { logout, setIsAuthenticated } from "./userSlice";
import store from "../../app/store";
import { persistStore } from "redux-persist";
import history from "../utils/history";
let persistor = persistStore(store);

export const logoutUser = () => {
  store.dispatch(setIsAuthenticated(false));
  store.dispatch(logout()); // Clears users cookie
  persistor.purge(); // Purges redux persist store
  history.push("/"); // redirect to landing
};
