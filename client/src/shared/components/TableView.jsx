/** General component for rendering a table with create functionality; primarily used for Resources and Datasets. */

import { useEffect } from "react";
import { Grid, Button } from "@mui/material";
import { Link } from "react-router-dom";
import RichTable from "../../shared/components/RichTable";
import LoadingAlert from "../../shared/components/LoadingAlert";
import ErrorAlert from "../../shared/components/ErrorAlert";

const TableView = ({
  name,
  loading,
  error,
  data,
  fetchFunction,
  loadingMessage,
  columns,
  noRowsMessage,
  createURL,
}) => {
  useEffect(() => {
    if (loading) {
      fetchFunction();
    }
  }, [loading]);

  return (
    <>
      <Grid item container xs={12}>
        <Grid
          item
          xs={12}
          p={2}
          sx={{ display: "flex", justifyContent: "right" }}
        >
          <Button
            as={Link}
            variant="contained"
            to={createURL}
            sx={{ textDecoration: "none" }}
          >
            Create
          </Button>
        </Grid>
        <Grid item xs={12}>
          {loading ? (
            <LoadingAlert message={loadingMessage} />
          ) : error ? (
            <ErrorAlert />
          ) : (
            <RichTable
              cols={columns}
              rows={data.map((d) => ({ ...d, id: d._id || d.id }))}
              noRowsMessage={noRowsMessage}
            />
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default TableView;
