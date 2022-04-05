import { useState } from "react";
import history from "../utils/history";
import { Form, Button } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import {
  selectPageLimit,
  setPageLimit,
  setTextsIdle
} from "../../app/dataSlice"
import { selectProject } from "../../features/project/projectSlice";
import {
  IoCheckmarkCircleSharp,
  IoCloseCircle,
  IoContract,
  IoExpan,
} from "react-icons/io5";
import { useParams } from "react-router";

export const Settings = () => {
  const dispatch = useDispatch();
  const pageLimit = useSelector(selectPageLimit);
  const project = useSelector(selectProject);
  const [tempPageLimit, setTempPageLimit] = useState(1);
  const { pageNumber } = useParams();

  return (
    <div>
      <p
        style={{
          fontWeight: "bold",
          padding: "0",
          margin: "0",
          borderBottom: "1px solid #dee2e6",
        }}
      >
        Annotation Settings
      </p>
      <p style={{ fontSize: "0.75rem" }}>
        <strong>Tip:</strong> If you have a large project, use smaller page
        sizes to improve latency.
      </p>
      <Form
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Form.Group
          style={{
            display: "flex",
            // justifyContent: "space-between",
            // marginLeft: "0.25em",
            alignItems: "center",
          }}
        >
          <Form.Label style={{ width: "10rem" }}>Documents per page</Form.Label>
          <Form.Control
            as="select"
            aria-label="Default select example"
            size="sm"
            onChange={(e) => setTempPageLimit(e.target.value)}
          >
            {[1, 2, 5, 10, 20, 30, 40, 50].map((limit) => (
              <option value={limit}>{limit}</option>
            ))}
          </Form.Control>
        </Form.Group>
        <Button
          size="sm"
          variant="dark"
          style={{ height: "100%" }}
          onClick={() => {
            dispatch(setPageLimit(Number(tempPageLimit)));
            if (Number(pageNumber) === 1) {
              dispatch(setTextsIdle());
            } else {
              history.push(`/annotation/${project._id}/page=1`);
            }
          }}
          disabled={Number(tempPageLimit) === Number(pageLimit)}
        >
          Apply
        </Button>
      </Form>
    </div>
  );
};