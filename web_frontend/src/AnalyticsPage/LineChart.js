// LineChart.js

import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const LineChart = ({ data, options, backgroundColor }) => {
    const chartOptions = {
        ...options,
        plugins: {
            ...options.plugins,
            tooltip: {
                ...options.plugins.tooltip,
                backgroundColor: 'white', // Ensuring tooltips have a white background
            },
        },
    };

    return <Line data={data} options={chartOptions} style={{ backgroundColor }} />;
};

export default LineChart;
