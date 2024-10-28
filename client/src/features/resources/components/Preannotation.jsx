import { Grid, Box, Stack, Button, Paper, Divider } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const Preannotation = ({ values, setValues }) => {
  console.log("values", values);

  const columns = [
    { field: "id", hide: true },
    {
      field: "surface_form",
      headerName: "Surface Form",
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "label",
      headerName: "Label",
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
  ];
  const rows = values.content.map((i, index) => ({ ...i, id: index }));

  return (
    <Grid item xs={12} p={2}>
      <Stack direction="row" alignItems="center" justifyContent="right" p={2}>
        <Button>Download</Button>
        <Button>Upload</Button>
        <Divider flexItem orientation="vertical" />
        <Button>Reset</Button>
        <Button>Update</Button>
      </Stack>
      <Box>
        <DataGrid columns={columns} rows={rows} />
      </Box>
    </Grid>
  );
};

export default Preannotation;
