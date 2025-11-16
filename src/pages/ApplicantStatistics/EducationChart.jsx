import React from "react";
import ReactApexChart from "react-apexcharts";
import getChartColorsArray from "../../components/Common/ChartsDynamicColor";

const EducationChart = ({ data }) => {
  const chartColors = getChartColorsArray('["--bs-warning", "--bs-primary", "--bs-success", "--bs-info", "--bs-danger", "--bs-secondary", "--bs-pink", "--bs-purple"]');

  // Create multiple series for each education level (like the image shows)
  const series = data.slice(0, 10).map((item) => ({
    name: item.label || "Unknown",
    data: [parseInt(item.value) || 0],
  }));

  const categories = ["Count"];

  const options = {
    chart: {
      height: 260,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    colors: chartColors,
    dataLabels: {
      enabled: true,
    },
    xaxis: {
      categories: categories,
      labels: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return Math.round(val);
        },
      },
    },
    grid: {
      borderColor: "#f1f1f1",
    },
    markers: {
      size: 4,
    },
    legend: {
      show: true,
      position: "right",
      fontSize: "10px",
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " applicants";
        },
      },
    },
    responsive: [
      {
        breakpoint: 1200,
        options: {
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  return series.length > 0 && series.some(s => s.data[0] > 0) ? (
    <div id="education-chart">
      <ReactApexChart options={options} series={series} type="line" height={260} className="apex-charts" />
    </div>
  ) : (
    <div className="text-center text-muted py-4">
      <i className="bx bx-line-chart font-size-24 d-block mb-2 opacity-50"></i>
      <p className="mb-0">No data available</p>
    </div>
  );
};

export default EducationChart;

