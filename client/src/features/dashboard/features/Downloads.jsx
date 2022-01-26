import "../../modals/Modals.css";
import "../Dashboard.css";
import { ArcElement, Chart } from "chart.js";
import { useEffect, useState } from "react";
import { Button, Card, Col, Form, FormControl, Row } from "react-bootstrap";
import BootstrapTable from "react-bootstrap-table-next";
import { Doughnut } from "react-chartjs-2";
import { FaUndo } from "react-icons/fa";
import { IoFilter } from "react-icons/io5";
import { useDispatch } from "react-redux";
import axios from "../../utils/api-interceptor";

Chart.register(ArcElement);

export const Downloads = ({ project }) => {
  const dispatch = useDispatch();
  const [data, setData] = useState();
  const [loaded, setLoaded] = useState(false);

  const downloadLabels = async (labelName) => {
    const response = await axios.post(
      `/api/project/download/labels/${labelName}`,
      {
        project_id: project._id,
        preview: false,
        // include_weak_labels: includeWeakLabels,
        annotation_state: "all", // TODO: make button based
      }
    );

    if (response.status === 200) {
      // Prepare for file download
      const fileName = `${project.name}-labels_${labelName.toLowerCase()}`;
      const json = JSON.stringify(response.data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const href = await URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = fileName + ".json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const annotatorFormatter = (cell, row) => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <UserAvatar
          username={row.username}
          avatarColour={row.colour}
          opacity={"1.0"}
        />
      </div>
    );
  };

  const downloadFormatter = (cell, row, rowIndex, formatExtraData) => {
    const downloadType = formatExtraData.downloadType;
    // console.log(downloadType);
    // console.log(cell, row);

    let metrics;
    switch (downloadType) {
      case "triples":
        const tMetrics = [
          { value: data.results[row._id].triples.total, name: "total" },
          { value: data.results[row._id].triples.saved, name: "saved" },
        ];

        metrics = (
          <div className="dl-metrics-container">
            {tMetrics.map((metric) => (
              <span className="dl-metric">
                <span className="dl-metric-value">{metric.value}</span>
                <span className="dl-metric-name">{metric.name}</span>
              </span>
            ))}
          </div>
        );

        break;
      case "entities":
        console.log(data.results[row._id].entities);

        const eMetrics = [
          { value: data.results[row._id].entities.total, name: "total" },
          { value: data.results[row._id].entities.saved, name: "saved" },
          Object.keys(data.results[row._id].entities).includes("gold")
            ? { value: data.results[row._id].entities.gold, name: "gold" }
            : { value: data.results[row._id].entities.silver, name: "silver" },
          { value: data.results[row._id].entities.weak, name: "weak" },
        ];

        metrics = (
          <div className="dl-metrics-container">
            {eMetrics.map((metric) => (
              <span className="dl-metric">
                <span className="dl-metric-value">{metric.value}</span>
                <span className="dl-metric-name">{metric.name}</span>
              </span>
            ))}
          </div>
        );
        break;
      default:
        break;
    }

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {metrics}
      </div>
    );
  };

  const selectFormatter = (cell, row) => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Form.Check
          type="switch"
          id="download-selector"
          checked={true}
          onClick={() => console.log("hi")}
        />
      </div>
    );
  };

  const columns = [
    {
      dataField: "username",
      text: "",
      formatter: annotatorFormatter,
      headerAlign: "center",
    },
    {
      dataField: "df1",
      isDummyField: true,
      text: "Triples",
      formatter: downloadFormatter,
      formatExtraData: {
        downloadType: "triples",
      },
      headerAlign: "center",
      hidden: project && !project.tasks.relationAnnotation,
    },
    {
      dataField: "df2",
      isDummyField: true,
      text: "Entities",
      formatter: downloadFormatter,
      formatExtraData: {
        downloadType: "entities",
      },
      headerAlign: "center",
    },
  ];

  const rowStyle = (row, rowIndex) => {
    if (row.username === "Gold") {
      return { backgroundColor: "#fffde7" };
    }
  };

  return (
    <>
      <Row>
        <Col>
          <DownloadForm
            project={project}
            loaded={loaded}
            setLoaded={setLoaded}
            setData={setData}
            data={data}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            {loaded && (
              <BootstrapTable
                keyField="id"
                data={data.annotators}
                columns={columns}
                rowStyle={rowStyle}
              />
            )}
          </div>
        </Col>
      </Row>
    </>
  );
};

const UserAvatar = ({ username, avatarColour, opacity }) => {
  return (
    <div
      id="avatar"
      style={{
        backgroundColor: avatarColour,
        borderRadius: "50%",
        height: "30px",
        width: "30px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textTransform: "uppercase",
        fontSize: "18px",
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

const DownloadForm = ({ project, loaded, setLoaded, setData, data }) => {
  const [filterApplied, setFilterApplied] = useState(false);
  const DEFAULT_FILTERS = {
    iaa: 0,
    quality: "any",
    saved: "any",
    annotators: data
      ? data.annotators.map((a) => a.username).slice(0, 1)
      : ["Gold"],
    annotationType:
      project && project.tasks.relationAnnotation ? "triples" : "entities",
  };
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  console.log("annotators", data && data.annotators);

  useEffect(() => {
    const fetchData = async () => {
      if (!loaded) {
        const response = await axios.post(
          `/api/project/dashboard/effort/${project._id}`,
          { filters: filters }
        );

        if (response.status === 200) {
          setData(response.data);
          console.log(response.data);
          setLoaded(true);
        }
      }
    };
    fetchData();
  }, [loaded]);

  const handleFilterApply = () => {
    setFilterApplied(true);
    // Trigger fetch event
    setLoaded(false);
  };

  const handleFilterReset = () => {
    console.log("resetting filter", filters);
    setFilters(DEFAULT_FILTERS);
    setFilterApplied(false);
    // Trigger fetch event
    setLoaded(false);
  };

  const selectOptions = {
    quality: ["any", "silver", "weak"],
    saved: ["any", "yes", "no"],
    annotationType:
      project && project.tasks.relationAnnotation
        ? ["triples", "entities"]
        : ["entities"],
    annotators: data ? data.annotators.map((a) => a.username) : ["Loading..."],
  };

  useEffect(() => {
    console.log(filters);
  }, [filters]);

  const downloadAnnotations = async (project) => {
    const annotatorNameToId = filters.annotators.map((username) => ({
      username: username,
      _id: data.annotators.filter((a) => a.username === username)[0]._id,
    }));

    const response = await axios.post("/api/project/dashboard/download", {
      projectId: project._id,
      filters: { ...filters, annotators: annotatorNameToId },
    });

    if (response.status === 200) {
      // Prepare for file download
      const fileName = `${project.name}_${filters.annotationType}_annotations_iaa-${filters.iaa}_q-${filters.quality}_s-${filters.saved}`;
      const json = JSON.stringify(response.data, null, 4);
      const blob = new Blob([json], { type: "application/json" });
      const href = await URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = fileName + ".json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card style={{ marginBottom: "1rem" }}>
      <Card.Body style={{ borderBottom: "1px solid rgba(0,0,0,.125)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ display: "flex", flexDirection: "column" }}>
            <Card.Title>Filter</Card.Title>
            <Card.Subtitle style={{ fontSize: "0.8125rem", color: "#607d8b" }}>
              Filter and review project annotations before downloading.
            </Card.Subtitle>
          </span>
          <Button
            size="sm"
            variant="success"
            // disabled
            style={{ height: "2rem" }}
            onClick={() => downloadAnnotations(project)}
          >
            Download Annotations
          </Button>
        </div>
      </Card.Body>
      <Card.Body>
        <Row>
          <Col>
            <Form.Label
              style={{
                marginLeft: "0.25rem",
                fontSize: "0.8125rem",
                fontWeight: "bold",
              }}
            >
              Minimum IAA Threshold
            </Form.Label>
            <FormControl
              type="number"
              placeholder={0}
              value={filters.iaa}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  iaa:
                    e.target.value > 100
                      ? 100
                      : e.target.value < 0
                      ? 0
                      : parseInt(e.target.value),
                })
              }
              size="sm"
            />
          </Col>
          <Col>
            <Form.Label
              style={{
                marginLeft: "0.25rem",
                fontSize: "0.8125rem",
                fontWeight: "bold",
              }}
            >
              Annotation Quality
            </Form.Label>
            <FormControl
              as="select"
              size="sm"
              value={filters.quality}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  quality: e.target.value,
                })
              }
              style={{ textTransform: "capitalize" }}
            >
              {selectOptions.quality.map((value) => (
                <option value={value}>{value}</option>
              ))}
            </FormControl>
          </Col>
          <Col>
            <Form.Label
              style={{
                marginLeft: "0.25rem",
                fontSize: "0.8125rem",
                fontWeight: "bold",
              }}
            >
              Saved
            </Form.Label>
            <FormControl
              as="select"
              size="sm"
              value={filters.saved}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  saved: e.target.value,
                })
              }
              style={{ textTransform: "capitalize" }}
            >
              {selectOptions.saved.map((value) => (
                <option value={value}>{value}</option>
              ))}
            </FormControl>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Label
              style={{
                marginLeft: "0.25rem",
                fontSize: "0.8125rem",
                fontWeight: "bold",
              }}
            >
              Annotations
            </Form.Label>
            <FormControl
              style={{ height: "32px" }}
              as="select"
              multiple
              size="sm"
              value={filters.annotators}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  annotators: [].slice
                    .call(e.target.selectedOptions)
                    .map((item) => item.value),
                })
              }
            >
              {selectOptions.annotators.map((value) => (
                <option value={value}>{value}</option>
              ))}
            </FormControl>
          </Col>
          <Col>
            <Form.Label
              style={{
                marginLeft: "0.25rem",
                fontSize: "0.8125rem",
                fontWeight: "bold",
              }}
            >
              Annotation Type
            </Form.Label>
            <FormControl
              as="select"
              size="sm"
              value={filters.annotationType}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  annotationType: e.target.value,
                })
              }
              style={{ textTransform: "capitalize" }}
            >
              {selectOptions.annotationType.map((value) => (
                <option value={value}>{value}</option>
              ))}
            </FormControl>
          </Col>
          <Col
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "right",
            }}
          >
            <Button
              size="sm"
              variant="secondary"
              style={{ marginRight: "0.125rem" }}
              onClick={handleFilterApply}
            >
              <IoFilter style={{ marginRight: "0.25rem" }} />
              Filter
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!filterApplied}
              onClick={handleFilterReset}
            >
              <FaUndo />
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

const DownloadDonutChart = () => {
  const options = {
    responsive: true,
    maintainAspectRatio: true,
  };

  const data = {
    datasets: [
      /* Outer doughnut data starts*/
      {
        data: [10, 20, 30],
        backgroundColor: [
          "rgb(255, 0, 0)", // red
          "rgb(0, 255, 0)", // green
          "rgb(0, 0, 255)", //blue
        ],
        label: "Doughnut 1",
      },
    ],
    labels: ["Info 1", "Info 2", "Info 3"],
  };
  return (
    <div style={{ height: "200px", width: "200px" }}>
      <Doughnut data={data} options={options} />;
    </div>
  );
};
