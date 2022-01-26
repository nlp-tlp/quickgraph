import ReactDOM from "react-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  selectAlertActive,
  selectAlertContent,
  setAlertActive,
} from "./alertSlice";
import { Alert } from "react-bootstrap";

export const AlertPortal = () => {
  const dispatch = useDispatch();
  const alertActive = useSelector(selectAlertActive);
  const alertContent = useSelector(selectAlertContent);

  if (!alertActive) return null;

  return ReactDOM.createPortal(
    <Alert
      variant={alertContent.level}
      onClose={() => dispatch(setAlertActive(false))}
      dismissible
    >
      <Alert.Heading>{alertContent.title}</Alert.Heading>
      <p>{alertContent.body}</p>
    </Alert>,
    document.body
  );
};
