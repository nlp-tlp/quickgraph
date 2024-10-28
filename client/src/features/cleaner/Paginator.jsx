import { useContext } from "react";
import { TablePagination, Skeleton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ProjectContext } from "../../shared/context/ProjectContext";

const Paginator = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useContext(ProjectContext);

  const handleChangePage = (event, newPage) => {
    dispatch({ type: "SET_PAGE", payload: newPage + 1 });
    navigate(`/project/${state.projectId}/page=${newPage + 1}`);
  };

  const handleChangeRowsPerPage = (event) => {
    dispatch({
      type: "SET_VALUE",
      payload: { pageLimit: parseInt(event.target.value, 10) },
    });
    dispatch({ type: "SET_PAGE", payload: 1 });

    if (Number(state.pageNumber) !== 1) {
      navigate(`/project/${state.projectId}/page=1`);
    }
  };

  if (!state.totalTexts) {
    return <Skeleton variant="rectangular" width={300} height={40} />;
  } else {
    return (
      // Note: component indexes from 0
      <TablePagination
        component="div"
        count={state.totalTexts}
        page={state.pageNumber - 1}
        onPageChange={handleChangePage}
        rowsPerPage={state.pageLimit}
        rowsPerPageOptions={[1, 2, 5, 10, 20]}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    );
  }
};

export default Paginator;
