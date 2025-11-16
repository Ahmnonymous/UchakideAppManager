import React from "react";
import ReactApexChart from "react-apexcharts";
import getChartColorsArray from "../../components/Common/ChartsDynamicColor";

const FileStatusChart = ({ data }) => {
  const chartColors = getChartColorsArray('["--bs-info", "--bs-success", "--bs-warning"]');

  const series = data.map((item) => parseInt(item.value) || 0);
  const labels = data.map((item) => item.label || "Unknown");

  const options = {
    labels: labels,
    colors: chartColors,
    legend: {
      show: true,
      position: "bottom",
      fontSize: "12px",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val, opts) {
        return opts.w.config.series[opts.seriesIndex];
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " files";
        },
      },
    },
  };

  return series.length > 0 && series.some(v => v > 0) ? (
    <div id="file-status-chart">
      <ReactApexChart options={options} series={series} type="donut" height={260} className="apex-charts" />
    </div>
  ) : (
    <div className="text-center text-muted py-4">
      <i className="bx bx-doughnut-chart font-size-24 d-block mb-2 opacity-50"></i>
      <p className="mb-0">No data available</p>
    </div>
  );
};

export default FileStatusChart;

