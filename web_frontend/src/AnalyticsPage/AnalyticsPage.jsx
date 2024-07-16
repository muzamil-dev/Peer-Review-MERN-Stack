import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Api from '../Api';
import styles from './AnalyticsPage.module.css';
import LineChart from './LineChart';

const AnalyticsPage = () => {
    const { userId } = useParams();
    const [userAnalytics, setUserAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserAnalytics = async () => {
            try {
                const response = await Api.Analytics.GetAnalyticsForUser(userId);
                setUserAnalytics(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching user analytics:', error);
                setLoading(false);
            }
        };

        fetchUserAnalytics();
    }, [userId]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!userAnalytics) {
        return <div>No data found for user.</div>;
    }

    const chartData = {
        labels: userAnalytics.assignments.map(assignment => assignment.startDate), // Example: ['2024-01-01', '2024-02-01', ...]
        datasets: [
            {
                label: 'Average Rating Over Time',
                data: userAnalytics.assignments.map(assignment => assignment.averageRating), // Example: [3.5, 4.0, ...]
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
        <div className={styles.analyticsPage}>
            <h1 className={styles.headerLarge}>User Analytics</h1>
            <div className={styles.analyticsContent}>
                <h2>{userAnalytics.firstName} {userAnalytics.lastName}'s Analytics</h2>
                <LineChart data={chartData} options={chartOptions} />
                <div className={styles.analyticsSection}>
                    <h3>Total Assignments</h3>
                    <p>{userAnalytics.assignments.length}</p>
                </div>
                <div className={styles.analyticsSection}>
                    <h3>Average Rating</h3>
                    <p>{calculateAverageRating(userAnalytics.assignments)}</p>
                </div>
                {/* Add more sections for other analytics data */}
            </div>
        </div>
    );
};

// Helper function to calculate average rating
const calculateAverageRating = (assignments) => {
    if (assignments.length === 0) return 0;
    const totalRating = assignments.reduce((acc, assignment) => acc + assignment.averageRating, 0);
    return (totalRating / assignments.length).toFixed(1);
};

export default AnalyticsPage;
