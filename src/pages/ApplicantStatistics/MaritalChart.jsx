import React from "react";
import ReactApexChart from "react-apexcharts";
import getChartColorsArray from "../../components/Common/ChartsDynamicColor";

const MaritalChart = ({ data }) => {
  const chartColors = getChartColorsArray('["--bs-primary", "--bs-success", "--bs-warning", "--bs-danger", "--bs-info", "--bs-secondary"]');

  // Create individual series for each marital status (like the image)
  const series = data.map((item) => ({
    name: item.label || "Unknown",
    data: [parseInt(item.value) || 0],
  }));

  const categories = ["Count"];

  const options = {
    chart: {
      height: 260,
      type: "bar",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        columnWidth: "70%",
        dataLabels: {
          position: "top",
        },
      },
    },
    colors: chartColors,
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: {
        fontSize: "10px",
        colors: ["#304758"],
      },
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
    <div id="marital-chart">
      <ReactApexChart options={options} series={series} type="bar" height={260} className="apex-charts" />
    </div>
  ) : (
    <div className="text-center text-muted py-4">
      <i className="bx bx-bar-chart font-size-24 d-block mb-2 opacity-50"></i>
      <p className="mb-0">No data available</p>
    </div>
  );
};

export default MaritalChart;

