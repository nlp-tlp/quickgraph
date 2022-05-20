import React, { useState } from "react";
import "./Paginator.css";
import { Button, OverlayTrigger, Pagination, Popover } from "react-bootstrap";
import { useSelector } from "react-redux";
import history from "../../utils/history";
import { selectProject } from "../projectSlice";
import {
  selectPage,
  selectTotalPages,
  selectPageLimit,
  setPage,
  selectTexts,
} from "../../../app/dataSlice"; //"../text/textSlice";

export const Paginator = () => {
  const project = useSelector(selectProject);
  const totalPages = useSelector(selectTotalPages);
  const page = useSelector(selectPage);
  const pageLimit = useSelector(selectPageLimit);
  const texts = useSelector(selectTexts);
  const [pageSelected, setPageSelected] = useState("");

  const routeChange = (page) => {
    setPage(page);
    history.push(`/annotation/${project._id}/page=${page}`);
  };

  const ellipsisGo = (
    <OverlayTrigger
      trigger="click"
      rootClose
      placement="bottom"
      overlay={
        <Popover style={{ maxWidth: "100%", margin: "auto" }}>
          <Popover.Title style={{ margin: "0em" }}>
            <p style={{ textAlign: "center", margin: "0em" }}>
              <strong>Page</strong> (1 -{totalPages})
            </p>
          </Popover.Title>
          <Popover.Content>
            <div style={{ display: "flex", margin: "auto" }}>
              <input
                style={{ maxWidth: "100%", marginRight: "0.5rem" }}
                type="number"
                min="1"
                max={totalPages}
                step="1"
                placeholder={page}
                value={pageSelected}
                onChange={(e) => setPageSelected(e.target.value)}
              />
              <Button
                id="action-btn"
                size="sm"
                variant="secondary"
                onClick={() => routeChange(pageSelected)}
              >
                Go
              </Button>
            </div>
          </Popover.Content>
        </Popover>
      }
    >
      <Pagination.Ellipsis />
    </OverlayTrigger>
  );

  return (
    <div id="paginator-container">
      <PaginatorDetail
        totalPages={totalPages}
        textsCount={Object.keys(texts).length}
        page={page}
        pageLimit={pageLimit}
      />
      <Pagination className="paginator">
        {page > 2 && (
          <>
            <Pagination.First onClick={() => routeChange(1)} />
            <Pagination.Prev onClick={() => routeChange(page - 1)} />
          </>
        )}
        {page <= 2
          ? [...Array(totalPages < 3 ? totalPages : 3).keys()].map((number) => {
              return (
                <Pagination.Item
                  key={number + 1}
                  active={number + 1 === page}
                  onClick={() => routeChange(number + 1)}
                >
                  {number + 1}
                </Pagination.Item>
              );
            })
          : page < totalPages
          ? [page - 2, page - 1, page].map((number) => {
              return (
                <Pagination.Item
                  key={number + 1}
                  active={number + 1 === page}
                  onClick={() => routeChange(number + 1)}
                >
                  {number + 1}
                </Pagination.Item>
              );
            })
          : [totalPages - 2, totalPages - 1].map((number) => {
              return (
                <Pagination.Item
                  key={number + 1}
                  active={number + 1 === page}
                  onClick={() => routeChange(number + 1)}
                >
                  {number + 1}
                </Pagination.Item>
              );
            })}
        {page < totalPages - 2 && (
          <>
            {ellipsisGo}
            <Pagination.Next onClick={() => routeChange(page + 1)} />
            <Pagination.Last onClick={() => routeChange(totalPages)} />
          </>
        )}
      </Pagination>
    </div>
  );
};

const PaginatorDetail = ({ totalPages, textsCount, page, pageLimit }) => {
  if (totalPages !== 0) {
    return (
      <p id="paginator-detail">
        {totalPages === 1 && textsCount === 1
          ? "1 of 1"
          : totalPages === 1
          ? `1-${textsCount}`
          : `${(page - 1) * pageLimit + 1}-${page * pageLimit} of ${
              pageLimit * totalPages
            }`}
      </p>
    );
  } else {
    return <p id="paginator-detail">Loading...</p>;
  }
};
