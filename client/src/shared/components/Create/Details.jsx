/**
 * General component for details
 */

import {
  Grid,
  TextField,
  Box,
  Divider,
  Typography,
  Stack,
  FormGroup,
  Tooltip,
  FormControlLabel,
  Checkbox,
  MenuItem,
  IconButton,
} from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import { generateRandomName } from "../../utils/tools";

const CustomDivider = () => (
  <Box sx={{ width: "100%" }} p="2rem 0rem">
    <Divider />
  </Box>
);

const CustomTextField = ({
  value,
  setValueFunction,
  title,
  caption,
  placeholder,
  showRandomize = false,
}) => (
  <Grid item container xs={12} alignItems="center" spacing={6}>
    <Grid item xs={4}>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="caption">{caption}</Typography>
    </Grid>
    <Grid
      item
      xs={8}
      xl={6}
      sx={{
        display: showRandomize && "flex",
        alignItems: showRandomize && "center",
      }}
    >
      <TextField
        key={`${title}-textfield"`}
        type="text"
        margin="normal"
        fullWidth
        placeholder={placeholder}
        value={value}
        autoComplete="false"
        onChange={(e) => setValueFunction(e.target.value)}
      />
      {showRandomize && (
        <Box p={1}>
          <Tooltip title="Click to generate random name" arrow>
            <IconButton onClick={() => setValueFunction(generateRandomName())}>
              <CasinoIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Grid>
  </Grid>
);

const CustomCheckboxField = ({ title, caption, items }) => (
  <Grid item container xs={12} alignItems="center" spacing={6}>
    <Grid item xs={4}>
      <Stack>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="caption">{caption}</Typography>
      </Stack>
    </Grid>
    <Grid item xs={6} xl={6}>
      <FormGroup>
        {items.map((item) => {
          const { tooltip, value, updateFunction, label } = item;
          const CheckboxForm = (
            <FormControlLabel
              control={
                <Checkbox
                  checked={value}
                  onChange={(e) => {
                    updateFunction(e.target.value);
                  }}
                  name="ea-ra-closed"
                />
              }
              label={label}
            />
          );
          return (
            <>
              {tooltip ? (
                <Tooltip title={tooltip} arrow placement="right">
                  {CheckboxForm}
                </Tooltip>
              ) : (
                CheckboxForm
              )}
            </>
          );
        })}
      </FormGroup>
    </Grid>
  </Grid>
);

const CustomSelectField = ({
  value,
  setValueFunction,
  title,
  caption,
  label,
  options = [],
}) => (
  <Grid item container xs={12} alignItems="center" spacing={6}>
    <Grid item xs={4}>
      <Typography variant="h6" sx={{ textTransform: "capitalize" }}>
        {title}
      </Typography>
      <Typography variant="caption">{caption}</Typography>
    </Grid>
    <Grid item xs={8} xl={6}>
      <TextField
        key={`${title}-textfield-select"`}
        select
        margin="normal"
        fullWidth
        value={value}
        onChange={(e) => setValueFunction(e.target.value)}
        label={label}
        sx={{ textTransform: "capitalize" }}
      >
        {options.map((option, index) => (
          <MenuItem
            key={`${title}-menu-item-${index}`}
            value={option.value}
            title={option.title ?? ""}
          >
            {option.name}
          </MenuItem>
        ))}
      </TextField>
    </Grid>
  </Grid>
);

const Details = ({ components }) => {
  return (
    <Grid item container xs={12}>
      {components
        ?.filter((child) => !child.hidden)
        .map((child, index) => {
          let Component;
          switch (child.type) {
            case "text":
              Component = CustomTextField;
              break;
            case "select":
              Component = CustomSelectField;
              break;
            case "checkbox":
              Component = CustomCheckboxField;
              break;
            default:
              return null;
          }
          return (
            <>
              <Component {...child} key={`details-component-${index}`} />
              {index !== components.length - 1 && <CustomDivider />}
            </>
          );
        })}
    </Grid>
  );
};

export default Details;
