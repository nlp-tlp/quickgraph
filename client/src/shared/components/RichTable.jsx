import { Alert, Grid } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const RichTable = ({
  cols,
  rows,
  noRowsMessage,
  disableMultipleSelection = false,
  checkboxSelection = false,
  selectionModel,
  setSelectionModel,
  pageSize = 5,
  rowsPerPageOptions = [5],
}) => {
  return (
    <Grid item container justifyContent="center">
      {rows.length === 0 ? (
        <Grid item xs={12} sx={{ textAlign: "center" }}>
          <Alert severity="info" variant="outlined">
            {noRowsMessage}
          </Alert>
        </Grid>
      ) : (
        <div style={{ height: 500, width: "100%" }}>
          <DataGrid
            autoHeight
            density={"comfortable"}
            rows={rows}
            columns={cols}
            pageSize={pageSize}
            rowsPerPageOptions={[rowsPerPageOptions]}
            disableColumnSelector
            disableMultipleSelection={disableMultipleSelection}
            disableSelectionOnClick
            checkboxSelection={checkboxSelection}
            onSelectionModelChange={(newSelectionModel) => {
              setSelectionModel(newSelectionModel);
            }}
            selectionModel={selectionModel}
          />
        </div>
      )}
    </Grid>
  );
};

export default RichTable;
