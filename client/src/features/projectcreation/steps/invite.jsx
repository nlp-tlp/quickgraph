import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import "../Create.css";
import {
  selectActiveStep,
  selectSteps,
  setStepData,
  setStepValid,
} from "../createStepSlice";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  FormControl,
  OutlinedInput,
  InputLabel,
  MenuItem,
  Select,
  Grid,
  Chip,
  Card,
  CardContent,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Slider,
} from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Checkbox from "@mui/material/Checkbox";
import Avatar from "@mui/material/Avatar";

import axios from "../../utils/api-interceptor";

export const Invite = () => {
  const dispatch = useDispatch();
  const steps = useSelector(selectSteps);
  const activeStep = useSelector(selectActiveStep);

  const [usersLoaded, setUsersLoaded] = useState(false);
  const [users, setUsers] = useState([]);
  const [checked, setChecked] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!usersLoaded) {
        const response = await axios.get("/api/user/management/users");
        if (response.status === 200) {
          setUsers(response.data);
          setUsersLoaded(true);
        }
      }
    };
    fetchUsers();
  }, [usersLoaded]);

  const handleToggle = (value) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  //   useEffect(() => {
  //     const valid = steps[activeStep].valid;
  //     const data = steps[activeStep].data;

  //     if (!valid && data.name !== "" && data.description !== "") {
  //       dispatch(setStepValid(true));
  //     }
  //     if (valid && (data.name === "" || data.description === "")) {
  //       dispatch(setStepValid(false));
  //     }
  //   }, [steps]);

  return (
    <Grid item container xs={12} spacing={2}>
      <Grid item xs={6}>
        <Card variant="outlined">
          <CardContent>
            <span>List of public users</span>
            <FormLabel component="legend">
              Select users to invite to this project
            </FormLabel>
            <List
              dense
              sx={{
                width: "100%",
                bgcolor: "background.paper",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {users.map((user, idx) => {
                const labelId = `checkbox-list-secondary-label-${idx}`;
                return (
                  <ListItem
                    key={idx}
                    secondaryAction={
                      <Checkbox
                        edge="end"
                        onChange={handleToggle(idx)}
                        checked={checked.indexOf(idx) !== -1}
                        inputProps={{ "aria-labelledby": labelId }}
                      />
                    }
                    disablePadding
                  >
                    <ListItemButton>
                      <ListItemAvatar>
                        <Avatar
                          alt={`Avatar n°${idx + 1}`}
                          sx={{ bgColor: user.colour }}
                        >
                          {user.username[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText id={labelId} primary={`${user.username}`} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
            <FormLabel component="legend">
              Users selected: {checked.length}
            </FormLabel>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6}>
        <Card variant="outlined">
          <CardContent>
            <span>Document Distribution</span>
            <FormLabel component="legend">
              Select the number of annotators per document
            </FormLabel>
            <Slider
              aria-label="Temperature"
              defaultValue={steps[activeStep].data.annotatorsPerDoc}
              valueLabelDisplay="auto"
              getAriaValueText={value => value}
              step={1}
              marks
              min={1}
              max={checked.length > 0 ? checked.length + 1 : 1} // Accounts for PM too
              disabled={checked.length === 0}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
