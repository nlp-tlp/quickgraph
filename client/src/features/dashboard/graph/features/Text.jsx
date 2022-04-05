/* 
  Component for marking up text with entities and relations
*/

import { IoInformationCircle } from "react-icons/io5";
import { useSelector } from "react-redux";
import "../Graph.css";
import { selectText, selectAggregate } from "../graphSlice";

export const Text = () => {
  const text = useSelector(selectText);
  const aggregate = useSelector(selectAggregate);

  if (aggregate) {
    return <></>;
  } else {
    return (
      <div id="graph-info-container" style={{ height: "3rem" }}>
        <IoInformationCircle
          style={{ marginRight: "0.5rem", fontSize: "1.25rem" }}
        />
        <span
          style={{
            whiteSpace: text && "nowrap",
            overflow: text && "hidden",
            textOverflow: text && "ellipsis",
            cursor: "help",
            fontSize: !text && "0.75rem",
          }}
          title={text}
        >
          {text ? text : ""}
        </span>
      </div>
    );
  }
};
