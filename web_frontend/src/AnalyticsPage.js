import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Api from './Api';
import './AnalyticsPage.css';
import LineChart from './LineChart';

const AnalyticsPage = () => {
    const { userId } = useParams();
    const [analytics, setAnalytics] = useState({});

    const fetchAnalytics = async () => {
        try {
            const data = await Api.Analytics.getUserAnalytics(userId);
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [userId]);

    const chartData = {
        labels: analytics.dates, // Example: ['January', 'February', 'March', 'April']
        datasets: [
            {
                label: 'Average Rating Over Time',
                data: analytics.ratings, // Example: [3.5, 4.0, 4.5, 5.0]
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Average Rating Over Time',
            },
        },
    };

    return (
        <div className="analytics-page">
            <h1 className="header-large">User Analytics</h1>
            <div className="analytics-content">
                <h2>{analytics.userName}'s Analytics</h2>
                <LineChart data={chartData} options={chartOptions} />
                <div className="analytics-section">
                    <h3>Total Assignments</h3>
                    <p>{analytics.totalAssignments}</p>
                </div>
                <div className="analytics-section">
                    <h3>Average Rating</h3>
                    <p>{analytics.averageRating}</p>
                </div>
                <div className="analytics-section">
                    <h3>Completed Assignments</h3>
                    <p>{analytics.completedAssignments}</p>
                </div>
                <div className="analytics-section">
                    <h3>Past Due Assignments</h3>
                    <p>{analytics.pastDueAssignments}</p>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
