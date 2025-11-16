import React from "react";
import ReactApexChart from "react-apexcharts";
import getChartColorsArray from "../../components/Common/ChartsDynamicColor";

const SuburbsChart = ({ data }) => {
  const chartColors = getChartColorsArray('["--bs-success"]');

  const series = [
    {
      name: "Applicants",
      data: data.slice(0, 10).map((item) => parseInt(item.value) || 0),
    },
  ];

  const categories = data.slice(0, 10).map((item) => item.label || "Unknown");

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
        horizontal: true,
      },
    },
    colors: chartColors,
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: categories,
    },
    grid: {
      borderColor: "#f1f1f1",
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " applicants";
        },
      },
    },
  };

  return series[0].data.length > 0 && series[0].data.some(v => v > 0) ? (
    <div id="suburbs-chart">
      <ReactApexChart options={options} series={series} type="bar" height={260} className="apex-charts" />
    </div>
  ) : (
    <div className="text-center text-muted py-4">
      <i className="bx bx-bar-chart font-size-24 d-block mb-2 opacity-50"></i>
      <p className="mb-0">No data available</p>
    </div>
  );
};

export default SuburbsChart;

