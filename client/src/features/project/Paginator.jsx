import { useContext } from "react";
import {
  useNavigate,
  useSearchParams,
  createSearchParams,
} from "react-router-dom";
import { TablePagination } from "@mui/material";
import { ProjectContext } from "../../shared/context/ProjectContext";

const Paginator = () => {
  const { state } = useContext(ProjectContext);
  const navigate = useNavigate();
  let [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 10;

  const handleChangePage = (event, newPage) => {
    // component indexes from 0...
    searchParams.set("page", newPage + 1);
    setSearchParams(searchParams);
    navigate({
      pathName: `/annotation/${state.projectId}`,
      search: `?${createSearchParams(searchParams)}`,
    });
  };

  const handleChangeRowsPerPage = (event) => {
    searchParams.set("page", page);
    searchParams.set("limit", parseInt(event.target.value));
    setSearchParams(searchParams);
  };

  return (
    <TablePagination
      component="div"
      count={state?.totalTexts ?? 0}
      page={page - 1}
      onPageChange={handleChangePage}
      rowsPerPage={limit}
      rowsPerPageOptions={[1, 2, 5, 10, 20]}
      onRowsPerPageChange={handleChangeRowsPerPage}
    />
  );
  // }
};

export default Paginator;
