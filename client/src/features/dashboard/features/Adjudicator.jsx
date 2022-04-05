import "../Dashboard.css";
import { useState, useEffect } from "react";
import { Pagination, Spinner, Row, Col, Badge } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import axios from "../../utils/api-interceptor";
import {
  selectProject,
  selectFlatEntityOntology,
} from "../../project/projectSlice";
import { useParams } from "react-router-dom";
import { hasMarkup, markupPosition, getFontColour } from "../../project/utils"; // project/utils
import { getSpanLabelPosition } from "../../project/spans/utils";
import {
  IoEllipsisVertical,
  IoTimer,
  IoInformationCircle,
} from "react-icons/io5";
import { BiGitCommit, BiGitCompare } from "react-icons/bi";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import { HiSortDescending, HiSortAscending } from "react-icons/hi";

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
  const flatEntityOntology = useSelector(selectFlatEntityOntology);
  const entityColourMap =
    flatEntityOntology &&
    Object.assign(
      {},
      ...flatEntityOntology.map((l) => ({ [l.name]: l.colour }))
    );

  console.log(entityColourMap);

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

  return (
    <>
      {docLoaded ? (
        <>
          <Row style={{ marginBottom: "2rem" }}>
            <Col
              sm={12}
              md={8}
              lg={8}
              xl={8}
              xxl={8}
              style={{
                display: "flex",
                justifyContent: "left",
                alignItems: "center",
              }}
            >
              <Text tokens={doc.content.tokens} />
            </Col>
            <Col
              style={{
                display: "flex",
                justifyContent: "right",
                alignItems: "end",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    margin: "auto",
                    marginBottom: "0.25rem",
                  }}
                >
                  {docLoaded &&
                    Object.keys(doc.content.iaa)
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
              </div>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              {/* doc.triples includes single entities  */}
              {doc.triples.length > 0 ? (
                <AdjTable doc={doc} entityColourMap={entityColourMap} />
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
                      <span>No annotations made</span>
                    </>
                  ) : (
                    <>
                      <IoTimer
                        style={{ marginRight: "0.5rem", fontSize: "2.5rem" }}
                      />
                      <span>No annotations made yet</span>
                    </>
                  )}
                </div>
              )}
            </Col>
          </Row>
        </>
      ) : (
        <div
          style={{
            textAlign: "center",
          }}
        >
          <Spinner animation="border" />
        </div>
      )}
    </>
  );
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
    <div>
      <h5 style={{ fontWeight: "bold" }}>Document</h5>
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
    </div>
  );
};

const UserAvatar = ({ username, avatarColour, opacity }) => {
  return (
    <div
      id="avatar"
      style={{
        backgroundColor: avatarColour,
        borderRadius: "50%",
        height: "24px",
        width: "24px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textTransform: "uppercase",
        fontSize: "12px",
        fontWeight: "bold",
        opacity: opacity,
        margin: "2px 2px",
      }}
      title={username}
    >
      {username ? username[0] : "?"}
    </div>
  );
};

const AdjTable = ({ doc, entityColourMap }) => {
  const annotatorFormatter = (cell, row) => {
    console.log(cell, row);

    console.log("doc", doc);

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {row.createdBy.map((annotatorId) => (
          <UserAvatar
            username={
              doc.content.annotators.filter((a) => a._id === annotatorId)[0]
                .username
            }
            avatarColour={
              doc.content.annotators.filter((a) => a._id === annotatorId)[0]
                .colour
            }
            opacity={"1.0"}
          />
        ))}
      </div>
    );
  };

  const entityFormatter = (cell, row, rowIndex, formatExtraData) => {
    // console.log(formatExtraData);

    const triplePart = formatExtraData.part;

    if (!cell) {
      return <span></span>;
    } else {
      switch (triplePart) {
        case "source":
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
                  backgroundColor: entityColourMap[cell],
                  color: getFontColour(entityColourMap[cell]),
                }}
              >
                {cell}
              </span>
            </div>
          );

        case "target":
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
                  backgroundColor: entityColourMap[cell],
                  color: getFontColour(entityColourMap[cell]),
                }}
              >
                {cell}
              </span>
            </div>
          );
        case "relation":
          return <span>{cell}</span>;
        default:
          break;
      }
    }
  };

  const annotationFormatter = (cell, row, rowIndex) => {
    // console.log(cell, row);

    const textProps = {
      text: doc.content,
      textIndex: 1,
      tokens: doc.content.tokens,
      triple: row,
    };

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
    },
    {
      dataField: "targetLabel",
      text: "Target",
      formatter: entityFormatter,
      formatExtraData: {
        part: "target",
      },
      headerAlign: "center",
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
  const focusTokens = [
    ...new Set([
      triple.sourceTokenStart,
      triple.sourceTokenEnd,
      triple.targetTokenStart,
      triple.targetTokenEnd,
    ]),
  ];
  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
  const entityOnly = !triple.targetLabel;
  const sliceLower = clamp(triple.sourceTokenStart - 2, 0, tokens.length);
  const sliceUpper = clamp(
    entityOnly ? triple.sourceTokenEnd + 3 : triple.targetTokenEnd + 3,
    0,
    tokens.length
  );

  return (
    <div className="text-container">
      {tokens &&
        tokens.slice(sliceLower, sliceUpper).map((token) => (
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
                opacity: !focusTokens.includes(token.index) && "0.25",
              }}
              annotated={hasMarkup(text, token.index)}
              pos={markupPosition(text, token.index)}
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
  const entityOnly = !triple.targetLabel;

  let entities;
  if (entityOnly) {
    entities = [
      {
        part: "source",
        start: triple.sourceTokenStart,
        end: triple.sourceTokenEnd,
        label: triple.sourceLabel,
      },
    ];
  } else {
    entities = [
      {
        part: "source",
        start: triple.sourceTokenStart,
        end: triple.sourceTokenEnd,
        label: triple.sourceLabel,
      },
      {
        part: "target",
        start: triple.targetTokenStart,
        end: triple.targetTokenEnd,
        label: triple.sourceLabel,
        relation: triple.relationLabel, // Put here as it's in the target label element
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

  // const spanComponentsSuggestedMarkup = entities
  //   .filter((span) => span.suggested)
  //   .slice()
  //   .sort((a, b) => b.end - b.start - (a.end - a.start))
  //   .filter((span) => span.start <= tokenIndex && tokenIndex <= span.end)
  //   .map((span) => {
  //     return (
  //       <Span
  //         text={text}
  //         textIndex={textIndex}
  //         token={token}
  //         tokenIndex={tokenIndex}
  //         span={span}
  //         spanLabel={span.label}
  //         suggested={true}
  //       />
  //     );
  //   });

  return <>{[...spanComponentsMarkup]}</>; //, ...spanComponentsSuggestedMarkup
};

const Span = ({ tokenIndex, span, suggested }) => {
  const flatEntityOntology = useSelector(selectFlatEntityOntology);
  const spanLabelPos = getSpanLabelPosition(span, tokenIndex);
  const labelColour = flatEntityOntology.filter(
    (l) => l.name.toLowerCase() === span.label.toLowerCase()
  )[0].colour;
  console.log(labelColour);
  const fontColour = getFontColour(labelColour);

  return (
    <span
      id="label"
      suggested={suggested ? "true" : "false"}
      label-content={span.label}
      pos={spanLabelPos}
      style={{
        backgroundColor: labelColour,
        color: fontColour && fontColour,
        cursor: "pointer",
      }}
    >
      {span.part === "target" && (
        <Badge id="relation-badge" variant="light">
          {span.relation}
        </Badge>
      )}
      {span.label}
    </span>
  );
};
