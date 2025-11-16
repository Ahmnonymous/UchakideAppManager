import React from 'react';
import ReactApexChart from "react-apexcharts";

import getChartColorsArray from "../../components/Common/ChartsDynamicColor";

const JobWidgetCharts = ({ dataColors, series }) => {
    var areacharteathereumColors = getChartColorsArray(dataColors);

    var options = {
        chart: {
            width: 130,
            height: 46,
            type: "area",
            sparkline: {
                enabled: true,
            },
            toolbar: {
                show: false,
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            curve: "smooth",
            width: 1.5,
        },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                inverseColors: false,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [50, 100, 100, 100],
            },
        },
        tooltip: {
            fixed: {
                enabled: false
            },
            x: {
                show: false
            },
            y: {
                title: {
                    formatter: function (seriesName) {
                        return '';
                    }
                }
            },
            marker: {
                show: false
            }
        },
        colors: areacharteathereumColors,
    };
    return (
        <React.Fragment>
            <ReactApexChart
                options={options}
                series={series}
                type="area"
                height="46"
                width="130"
                className="apex-charts"
            />
        </React.Fragment>
    );
};

const StatisticsApplicationsChart = ({ seriesData, dataColors }) => {
    const statisticsApplicationColors = getChartColorsArray(dataColors);
    const metrics = Array.isArray(seriesData?.metrics) ? seriesData.metrics : [];
    const categories = Array.isArray(seriesData?.categories) ? seriesData.categories : [];
    const duration = seriesData?.duration || "year";

    const iconMap = metrics.reduce((acc, metric) => {
        if (metric?.label && metric?.icon) {
            acc[metric.label] = metric.icon;
        }
        return acc;
    }, {});

    const formatDateLabel = (value) => {
        if (!value) {
            return value;
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        if (duration === "week") {
            return date.toLocaleDateString(undefined, {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        }

        return date.toLocaleDateString(undefined, {
            month: "short",
            year: "numeric",
        });
    };

    const formattedCategoryLabels = categories.map((category) => formatDateLabel(category));

    const series = metrics.map((metric) => ({
        name: metric.label,
        type: 'column',
        data: Array.isArray(metric?.data) ? metric.data : []
    }));

    const finalSeries = series.length
        ? series
        : [{
            name: 'No Data',
            type: 'column',
            data: categories.length ? new Array(categories.length).fill(0) : [0]
        }];

    const legendIconMap = series.length ? iconMap : {};

    const resolvedColors = finalSeries.length
        ? finalSeries.map((_, index) => statisticsApplicationColors[index % statisticsApplicationColors.length])
        : statisticsApplicationColors;

    const strokeWidths = finalSeries.map(() => 0);
    const fillOpacities = finalSeries.map(() => 0.85);

    var options = {
        chart: {
            height: 350,
            type: 'line',
            stacked: false,
            toolbar: {
                show: false,
            },
        },
        legend: {
            show: true,
            offsetY: 10,
            labels: {
                useSeriesColors: false
            },
            formatter: function (seriesName) {
                const iconClass = legendIconMap[seriesName] || iconMap[seriesName];
                if (iconClass) {
                    return `<span class="legend-with-icon"><i class="bx ${iconClass} align-middle me-1"></i>${seriesName}</span>`;
                }
                return seriesName;
            }
        },
        stroke: {
            width: strokeWidths,
            curve: 'smooth'
        },
        plotOptions: {
            bar: {
                columnWidth: '30%'
            }
        },
        fill: {
            opacity: fillOpacities,
            gradient: {
                inverseColors: false,
                shade: 'light',
                type: "vertical",
                opacityFrom: 0.85,
                opacityTo: 0.55,
                stops: [0, 100, 100, 100]
            }
        },
        labels: categories,
        colors: resolvedColors,
        markers: {
            size: 0
        },
        xaxis: {
            type: 'datetime'
        },
        tooltip: {
            shared: true,
            intersect: false,
            y: {
                formatter: function (y) {
                    if (typeof y !== "undefined" && y !== null) {
                        const value = Number(y);
                        if (Number.isFinite(value)) {
                            return `${value.toLocaleString()} total`;
                        }
                    }
                    return y;

                }
            },
            x: {
                formatter: function (value, { dataPointIndex }) {
                    return formattedCategoryLabels[dataPointIndex] || formatDateLabel(value);
                }
            }
        }
    };
    return (
        <React.Fragment>
            <ReactApexChart
                options={options}
                series={finalSeries}
                type="line"
                height="350"
                className="apex-charts pb-3"
            />
            <style jsx="true">{`
                .apexcharts-legend.apx-legend-position-bottom.apx-legend-align-left,
                .apexcharts-legend.apx-legend-position-bottom.center {
                    justify-content: flex-start;
                    gap: 1.5rem;
                }

                .apexcharts-legend-marker {
                    margin-right: 0.5rem !important;
                }

                .apexcharts-legend-series {
                    margin: 0.4rem 1.2rem 0.4rem 0 !important;
                }

                .apexcharts-legend-text {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                }

                .apexcharts-legend-text .bx {
                    font-size: 1rem;
                }
            `}</style>
        </React.Fragment>
    );
};

const ReceivedTimeCharts = ({ dataColors }) => {
    var ApplicationReveicedTimeColors = getChartColorsArray(dataColors);

    const series = [{
        name: 'Received Application',
        data: [34, 44, 54, 21, 12, 43, 33, 80, 66]
    }];
    var options = {
        chart: {
            type: 'line',
            height: 378,
            toolbar: {
                show: false,
            },
        },
        // stroke: {
        //     curve: 'stepline',
        // },
        stroke: {
            width: 3,
            curve: 'smooth'
        },
        labels: ['8 PM', '9 PM', '10 PM', '11 PM', '12 PM', '1 AM', '2 AM',
            '3 AM', '4 AM'
        ],
        dataLabels: {
            enabled: false
        },
        colors: ApplicationReveicedTimeColors,
        markers: {
            hover: {
                sizeOffset: 4
            }
        }
    };
    return (
        <React.Fragment>
            <ReactApexChart
                options={options}
                series={series}
                type="line"
                height="378px"
                width="456px"
                className="apex-charts"
            />
        </React.Fragment>
    );
};

export { JobWidgetCharts, StatisticsApplicationsChart, ReceivedTimeCharts };