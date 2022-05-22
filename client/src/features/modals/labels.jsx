import React, { useState, useEffect } from "react";
import axios from "../utils/api-interceptor";
import { Spinner } from "react-bootstrap";
import "./Modals.css";
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

export const Labels = ({ projectId }) => {
  const [data, setData] = useState();

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get(
        `/api/project/labels/distribution/${projectId}`
      );
      if (response.status === 200) {
        // console.log(response.data);
        setData(response.data);
      }
    };
    fetchData();
  }, []);

  if (!data) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <p>Loading label distributions</p>
        <Spinner animation="border" />
      </div>
    );
  } else {
    return <StackedLabelPlot data={data} />;
  }
};

const StackedLabelPlot = ({ data }) => {
  const options = {
    plugins: {
      title: {
        display: false,
      },
      legend: {
        labels: {
          color: "black",
        },
      },
    },
    responsive: true,
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        ticks: {
          stepSize: 1
        }
      },
    },
  };

  return <Bar options={options} data={data} />;
};
