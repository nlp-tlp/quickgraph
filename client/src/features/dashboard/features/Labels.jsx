import React, { useState, useEffect } from "react";
import axios from "../../utils/api-interceptor";
import { Spinner } from "react-bootstrap";
import "../../modals/Modals.css";
import { IoTimer } from "react-icons/io5";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const Labels = ({ projectId, type, graphLoaded, setGraphLoaded }) => {
  const [data, setData] = useState();

  useEffect(() => {
    const fetchData = async () => {
      if (!graphLoaded) {
        const response = await axios.post(
          `/api/project/dashboard/overview/plot/${projectId}`,
          { type: type }
        );
        if (response.status === 200) {
          // console.log(response.data);
          setData(response.data);
          setGraphLoaded(true);
        }
      }
    };
    fetchData();
  }, [graphLoaded, type]);

  if (!graphLoaded) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <p>Loading...</p>
        <Spinner animation="border" />
      </div>
    );
  } else if (data && data.datasets.length === 0) {
    return (
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
        <IoTimer style={{ marginRight: "0.5rem", fontSize: "2.5rem" }} />
        <span>No annotations saved yet</span>
      </div>
    );
  } else {
    return (
      <StackedLabelPlot graphLoaded={graphLoaded} data={data} type={type} />
    );
  }
};

const StackedLabelPlot = ({ graphLoaded, data, type }) => {
  let options = {
    plugins: {
      legend: {
        labels: {
          // usePointStyle: true
        },
      },
      title: {
        display: true,
        text: `Distribution of Applied ${
          type === "entity" ? "Entities" : "Relations"
        }`,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: 25,
        left: 25,
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        stacked: true,
        display: true,
        title: { display: true, text: "Count" },
        ticks: {
          stepSize: 10,
        },
        suggestedMax: 10,
      },
      xAxes: [
        {
          maxBarThickness: 100,
        },
      ],
    },
  };

  // Add time options for temporal graphs
  options =
    type === "overall"
      ? {
          ...options,
          scales: {
            x: {
              stacked: false,
              // type: "time",
              // time: { tooltipFormat: "DD T" },
              title: { display: true, text: "Date Saved" },
              ticks: { maxRotation: 0, minRotation: 0 },
            },
            y: {
              // stacked: true,
              display: true,
              title: { display: true, text: "Count of Documents Saved" },
              ticks: { stepSize: 2 },
              suggestedMax: 10,
            },
          },
          plugins: {
            title: {
              display: true,
              text: "Overall Progress Made by Annotators",
            },
          },
        }
      : type === "triple"
      ? {
          ...options,
          indexAxis: "y",
          layout: {
            padding: {
              right: 0,
              left: 0,
            },
          },
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: [
                "Top 20 Triples Types Annotated",
                "(subject, object, relation) | (W refers to weak)",
              ],
            },
            tooltip: { enabled: false },
          },
          scales: {
            x: {
              stacked: true,
              ticks: { stepSize: 1 },
              display: true,
              title: { display: true, text: "Count" },
            },
            y: {
              stacked: true,
              ticks: {
                callback: function (val, index) {
                  const label = this.getLabelForValue(val);
                  if (/\s/.test(label)) {
                    return label.split(" ");
                  } else {
                    return label;
                  }
                },
              },
            },
          },
        }
      : options;

  return (
    <div style={{ width: "100%", height: "400px" }}>
      <Bar options={options} data={data} />
    </div>
  );
};
