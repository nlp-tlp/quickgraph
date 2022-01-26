/* 
  Component for marking up text with entities and relations
*/

import "react-complex-tree/lib/style.css";
import { IoInformationCircle } from "react-icons/io5";
import "../Graph.css";

import { useSelector } from "react-redux";
import { selectText, selectTextId } from "../graphSlice";

export const Text = () => {
  const text = useSelector(selectText);
  const textId = useSelector(selectTextId);

  // {/* {textId && <p style={{ fontSize: "0.8rem", padding: "0" }}>{textId}</p>} */}
  return (
    <div id="graph-info-container" style={{ marginTop: "1rem" }}>
      <span id="graph-info-icon">
        <IoInformationCircle />
      </span>
      <span id="graph-info-content">
        {/* <p id="graph-info-title">Quick Information</p> */}
        {text}
      </span>
    </div>
  );
};
