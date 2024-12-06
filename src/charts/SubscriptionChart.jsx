import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function SubscriptionChart() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt'));
      const subscriptionsQuery = query(collection(db, 'subscriptions'), orderBy('createdAt'));
      
      const [usersSnapshot, subscriptionsSnapshot] = await Promise.all([
        getDocs(usersQuery),
        getDocs(subscriptionsQuery)
      ]);

      // Process data for charts
      const userDates = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return new Date(data.createdAt).toLocaleDateString();
      });

      const subscriptionDates = subscriptionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return new Date(data.createdAt).toLocaleDateString();
      });

      // Combine and sort unique dates
      const allDates = [...new Set([...userDates, ...subscriptionDates])].sort();

      // Count totals per date
      const userData = new Array(allDates.length).fill(0);
      const subscriptionData = new Array(allDates.length).fill(0);

      userDates.forEach(date => {
        const index = allDates.indexOf(date);
        if (index !== -1) {
          userData[index]++;
        }
      });

      subscriptionDates.forEach(date => {
        const index = allDates.indexOf(date);
        if (index !== -1) {
          subscriptionData[index]++;
        }
      });

      setChartData({
        labels: allDates,
        datasets: [
          {
            label: 'Users',
            data: userData,
            backgroundColor: 'rgba(59, 130, 246, 0.8)', // Blue
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.8
          },
          {
            label: 'Subscriptions',
            data: subscriptionData,
            backgroundColor: 'rgba(16, 185, 129, 0.8)', // Green
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.8
          }
        ]
      });

    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Users & Subscriptions Growth',
        padding: {
          top: 10,
          bottom: 30
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

export default SubscriptionChart;
