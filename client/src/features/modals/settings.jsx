import { useState } from "react";
import history from "../utils/history";
import { useSelector, useDispatch } from "react-redux";
import {
  selectPageLimit,
  setPageLimit,
  setTextsIdle,
} from "../../app/dataSlice";
import { selectProject } from "../../features/project/projectSlice";
import { useParams } from "react-router";

import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { grey } from "@mui/material/colors";

export const Settings = () => {
  const dispatch = useDispatch();
  const pageLimit = useSelector(selectPageLimit);
  const project = useSelector(selectProject);
  const [tempPageLimit, setTempPageLimit] = useState(pageLimit);
  const { pageNumber } = useParams();

  return (
    <Grid
      item
      xs={12}
      container
      alignItems="center"
      justifyContent="space-between"
    >
      <Grid
        item
        xs={12}
        container
        alignItems="center"
        justifyContent="space-around"
      >
        <FormControl sx={{ m: 1, width: 300 }}>
          <InputLabel id="demo-multiple-name-label">
            Documents per page
          </InputLabel>
          <Select
            labelId="demo-multiple-name-label"
            id="demo-multiple-name"
            value={tempPageLimit}
            onChange={(e) => setTempPageLimit(e.target.value)}
          >
            {[1, 2, 5, 10, 20, 30, 40, 50].map((limit) => (
              <MenuItem key={limit} value={limit}>
                {limit}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
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
      </Grid>
      <Grid item xs={12}>
        <span style={{ fontSize: "0.75rem", color: grey[700] }}>
          <strong>Tip:</strong> If you have a large project, use smaller page
          sizes to improve latency.
        </span>
      </Grid>
    </Grid>
  );
};
