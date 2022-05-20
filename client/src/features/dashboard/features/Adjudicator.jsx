import { useEffect, useState } from "react";
import { Badge, Pagination } from "react-bootstrap";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import { HiSortAscending, HiSortDescending } from "react-icons/hi";
import { IoInformationCircle, IoTimer } from "react-icons/io5";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { selectFlatOntology, selectProject } from "../../project/projectSlice";
import { getSpanLabelPosition } from "../../project/spans/utils";
import { getFontColour, hasMarkup, markupPosition } from "../../project/utils";
import axios from "../../utils/api-interceptor";
import "../Dashboard.css";

import { Grid, Avatar, Stack } from "@mui/material";
import { Loader } from "../../common/Loader";

/*
  Component for reviewing annotator agreement.
  Notes:
    - Pagination is performed one document at a time
*/
export const Adjudicator = () => {
  const { projectId } = useParams();
  const [totalPages, setTotalPages] = useState();
  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState(-1); // Default descending (hi-lo)
  const [doc, setDoc] = useState();
  const [docLoaded, setDocLoaded] = useState(false);

  useEffect(() => {
    const fetchTotalPages = async () => {
      if (!totalPages) {
        const response = await axios.post(
          "/api/text/filter",
          {
            projectId: projectId,
            getPages: true,
            filters: {},
          },
          {
            params: {
              limit: 1,
            },
          }
        );
        if (response.status === 200) {
          setTotalPages(response.data.totalPages);
        }
      }
    };
    fetchTotalPages();
  }, [totalPages]);

  useEffect(() => {
    const fetchAdjDoc = async () => {
      if (!docLoaded) {
        const response = await axios.post(
          "/api/project/dashboard/adjudication",
          {
            projectId: projectId,
            filters: {},
          },
          {
            params: {
              page: page,
              limit: 1,
              sort: sortDirection,
            },
          }
        );
        if (response.status === 200) {
          setDoc(response.data);
          setDocLoaded(true);
        }
      }
    };
    fetchAdjDoc();
  }, [docLoaded, page, sortDirection]);

  if (!docLoaded) {
    return <Loader message="Loading Document" />;
  } else {
    return (
      <Grid item xs={12} container spacing={2}>
        <Grid
          item
          xs={12}
          container
          alignItems="center"
          justifyContent="space-between"
        >
          <Grid item xs={10}>
            <h5 style={{ fontWeight: "bold" }}>Document</h5>
            <Text tokens={doc.content.tokens} />
          </Grid>
          <Grid
            item
            xs={2}
            container
            justifyContent="center"
            alignItems="center"
          >
            <div
              style={{
                display: "flex",
                margin: "auto",
                marginBottom: "0.25rem",
              }}
            >
              {Object.keys(doc.content.iaa)
                .filter((measure) => doc.content.iaa[measure] !== null)
                .map((measure) => (
                  <span
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      margin: "0rem 0.25rem",
                    }}
                  >
                    <span>{doc.content.iaa[measure]}%</span>
                    <span style={{ fontSize: "0.7rem" }}>{measure}</span>
                  </span>
                ))}
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Paginator
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                setDocLoaded={setDocLoaded}
              />
              {sortDirection === -1 ? (
                <HiSortDescending
                  onClick={() => {
                    setSortDirection(1);
                    setDocLoaded(false);
                  }}
                  id="adj-sort"
                />
              ) : (
                <HiSortAscending
                  onClick={() => {
                    setSortDirection(-1);
                    setDocLoaded(false);
                  }}
                  id="adj-sort"
                />
              )}
              {/* <IoEllipsisVertical id="adj-settings" /> */}
            </div>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          {/* doc.triples includes singlular entities  */}
          {doc.content.saved.length > 0 && doc.triples.length > 0 ? (
            <AdjTable doc={doc} />
          ) : (
            <div
              style={{
                height: "25vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#607d8b",
              }}
            >
              {doc.content.saveCount !== 0 ? (
                <>
                  <IoInformationCircle
                    style={{ marginRight: "0.5rem", fontSize: "2.5rem" }}
                  />
                  <span>No annotations saved</span>
                </>
              ) : (
                <>
                  <IoTimer
                    style={{ marginRight: "0.5rem", fontSize: "2.5rem" }}
                  />
                  <span>No annotations saved yet</span>
                </>
              )}
            </div>
          )}
        </Grid>
      </Grid>
    );
  }
};

const Paginator = ({ page, setPage, totalPages, setDocLoaded }) => {
  const routeChange = (page) => {
    setPage(page);
    setDocLoaded(false);
  };

  return (
    <Pagination>
      {page > 1 && (
        <>
          <Pagination.First onClick={() => routeChange(1)} />
          <Pagination.Prev onClick={() => routeChange(page - 1)} />
        </>
      )}
      <Pagination.Item key={page}>{page}</Pagination.Item>
      {page < totalPages && (
        <>
          <Pagination.Next onClick={() => routeChange(page + 1)} />
          <Pagination.Last onClick={() => routeChange(totalPages)} />
        </>
      )}
    </Pagination>
  );
};

const Text = ({ tokens }) => {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        textAlign: "justify",
        textJustify: "inter-word",
        fontSize: "1.125rem",
      }}
    >
      {tokens.map((t) => t.value).join(" ")}
    </div>
  );
};

const AdjTable = ({ doc }) => {
  const project = useSelector(selectProject);
  const hasRelationAnnotation = project.tasks.relationAnnotation;

  const annotatorFormatter = (cell, row) => {
    return (
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        alignItems="center"
      >
        {row.createdBy
          .filter((a) =>
            doc.content.saved.map((a2) => a2.createdBy).includes(a)
          )
          .map((annotatorId) => {
            const userDetail = doc.content.saved.filter(
              (a) => a.createdBy == annotatorId
            )[0];

            return (
              <Avatar
                sx={{
                  bgcolor: userDetail.colour,
                  width: 24,
                  height: 24,
                }}
                title={`User: ${userDetail.username}`}
              >
                {userDetail.username[0]}
              </Avatar>
            );
          })}
      </Stack>
    );
  };

  const entityFormatter = (cell, row, rowIndex, formatExtraData) => {
    const triplePart = formatExtraData.part;

    // console.log("cell", cell, "row", row);

    let label;
    switch (triplePart) {
      case "source":
        label = doc.ontology.filter(
          (label) => label._id.toString() === row.sourceLabelId
        )[0];
        return (
          <div
            id="token-container"
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span id="token">{row.sourceToken}</span>
            <span
              id="label"
              style={{
                backgroundColor: label.colour,
                color: getFontColour(label.colour),
              }}
            >
              {label.name}
            </span>
          </div>
        );

      case "target":
        if (row.targetLabelId) {
          label = doc.ontology.filter(
            (label) => label._id.toString() === row.targetLabelId
          )[0];
          return (
            <div
              id="token-container"
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span id="token">{row.targetToken}</span>
              <span
                id="label"
                style={{
                  backgroundColor: label.colour,
                  color: getFontColour(label.colour),
                }}
              >
                {label.name}
              </span>
            </div>
          );
        } else {
          return <></>;
        }
      case "relation":
        if (row.relationLabelId) {
          label = doc.ontology.filter(
            (label) => label._id.toString() === row.relationLabelId
          )[0];
          return <span>{label.name}</span>;
        } else return <></>;
      default:
        break;
    }
    // }
  };

  const annotationFormatter = (cell, row, rowIndex) => {
    const textProps = {
      text: doc.content,
      textIndex: 1,
      tokens: doc.content.tokens,
      triple: row,
    };

    // console.log("text props", textProps);

    return <AnnotatedText {...textProps} />;
  };

  const rowStyle = (row, rowIndex) => {
    // console.log("row", row, rowIndex);
    // #fff59d

    // console.log(doc.aggregate_annotation);

    if (row.aggregate) {
      return { backgroundColor: "#fffde7" };
    }
  };

  const columns = [
    {
      dataField: "annotators",
      text: "",
      formatter: annotatorFormatter,
    },
    {
      dataField: "sourceLabel",
      text: "Source",
      formatter: entityFormatter,
      formatExtraData: {
        part: "source",
      },
      headerAlign: "center",
    },
    {
      dataField: "relationLabel",
      text: "Relation",
      formatter: entityFormatter,
      formatExtraData: {
        part: "relation",
      },
      headerAlign: "center",
      sort: true,
      hidden: !hasRelationAnnotation,
    },
    {
      dataField: "targetLabel",
      text: "Target",
      formatter: entityFormatter,
      formatExtraData: {
        part: "target",
      },
      headerAlign: "center",
      hidden: !hasRelationAnnotation,
    },
    {
      dataField: "df1",
      isDummyField: true,
      text: "Annotation",
      headerAlign: "center",
      formatter: annotationFormatter,
    },
  ];

  const customPaginationTotal = (from, to, size) => (
    <span>
      Showing {from} to {to} of {size} annotations
    </span>
  );

  const paginationOptions = {
    showTotal: true,
    paginationTotalRenderer: customPaginationTotal,
    sizePerPage: 5,
    hidePageListOnlyOnePage: true,
    hideSizePerPage: true,
    // sizePerPageList: [
    //   {
    //     text: "5",
    //     value: 5,
    //   },
    //   {
    //     text: "10",
    //     value: 10,
    //   },
    // ],
  };

  return (
    <BootstrapTable
      keyField="id"
      data={doc.triples}
      columns={columns}
      ignoreSinglePage
      pagination={paginationFactory(paginationOptions)}
      rowStyle={rowStyle}
    />
  );
};

const AnnotatedText = ({ text, textIndex, tokens, triple }) => {
  // Component for highlighting annotation
  // Applies ellipsis to tokens +2 from source and target (this helps to identify solo entities)
  // Tokens without annotations have opacity to give focus

  // console.log("triple", triple);

  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
  const entityOnly = !triple.targetToken;
  const sliceLower = clamp(triple.sourceTokenStart - 2, 0, tokens.length);
  const sliceUpper = clamp(
    entityOnly ? triple.sourceTokenEnd + 3 : triple.targetTokenEnd + 3,
    0,
    tokens.length
  );

  // console.log("text slicing", sliceLower, sliceUpper, tokens.length);

  const entities = [
    {
      isEntity: true,
      start: triple.sourceTokenStart,
      end: triple.sourceTokenEnd,
      labelId: triple.sourceLabelId,
      suggested: false, // TODO: confirm
    },
    {
      isEntity: true,
      start: triple.targetTokenStart,
      end: triple.targetTokenEnd,
      labelId: triple.targetLabelId,
      suggested: false, // TODO: confirm
    },
  ];

  const highlightToken = (tokenIndex) => {
    if (entityOnly) {
      return (
        triple.sourceTokenStart <= tokenIndex &&
        tokenIndex <= triple.sourceTokenEnd
      );
    } else {
      return (
        (triple.sourceTokenStart <= tokenIndex &&
          tokenIndex <= triple.sourceTokenEnd) ||
        (triple.targetTokenStart <= tokenIndex &&
          tokenIndex <= triple.targetTokenEnd)
      );
    }
  };

  // console.log(
  //   "tokens.slice(sliceLower, sliceUpper)",
  //   tokens.slice(sliceLower, sliceUpper)
  // );

  return (
    <div className="text-container">
      {tokens &&
        tokens.slice(sliceLower, sliceUpper + 1).map((token) => (
          <div
            id="token-container"
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span
              id="token"
              style={{
                opacity: !highlightToken(token.index) && "0.25",
              }}
              annotated={hasMarkup(entities, token.index)}
              pos={markupPosition(entities, token.index)}
            >
              {token.value}
            </span>
            <Spans
              text={text}
              textIndex={textIndex}
              token={token}
              tokenIndex={token.index}
              triple={triple}
            />
          </div>
        ))}
    </div>
  );
};

const Spans = ({ text, textIndex, token, tokenIndex, triple }) => {
  const entityOnly = !triple.targetToken;

  let entities;
  if (entityOnly) {
    entities = [
      {
        part: "source",
        start: triple.sourceTokenStart,
        end: triple.sourceTokenEnd,
        labelId: triple.sourceLabelId,
      },
    ];
  } else {
    entities = [
      {
        part: "source",
        start: triple.sourceTokenStart,
        end: triple.sourceTokenEnd,
        labelId: triple.sourceLabelId,
      },
      {
        part: "target",
        start: triple.targetTokenStart,
        end: triple.targetTokenEnd,
        labelId: triple.targetLabelId,
        relationLabelId: triple.relationLabelId, // Put here as it's in the target label element
      },
    ];
  }

  const spanComponentsMarkup = entities
    .slice()
    .sort((a, b) => b.end - b.start - (a.end - a.start)) // Sorting pushes longer spans to the top
    .filter((span) => span.start <= tokenIndex && tokenIndex <= span.end)
    .map((span) => {
      return (
        <Span
          text={text}
          textIndex={textIndex}
          token={token}
          tokenIndex={tokenIndex}
          span={span}
          suggested={false}
        />
      );
    });

  return spanComponentsMarkup;
};

const Span = ({ tokenIndex, span, suggested }) => {
  const flatOntology = useSelector(selectFlatOntology);
  const spanLabelPos = getSpanLabelPosition(span, tokenIndex);

  const label = flatOntology.filter(
    (l) => l._id.toString() === span.labelId.toString()
  )[0];

  const labelColour = label.colour;
  const fontColour = getFontColour(labelColour);

  // console.log("Span", span);

  return (
    <span
      key={tokenIndex}
      id="label"
      suggested={suggested ? "true" : "false"}
      label-content={label.name}
      pos={spanLabelPos}
      style={{
        backgroundColor: labelColour,
        color: fontColour && fontColour,
        cursor: "pointer",
      }}
    >
      {span.part === "target" && (
        <Badge id="relation-badge" variant="light">
          {
            flatOntology.filter(
              (l) => l._id.toString() === span.relationLabelId
            )[0].name
          }
        </Badge>
      )}
      {label.name}
    </span>
  );
};
