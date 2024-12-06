import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function SubscriptionChart() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        if (!auth.currentUser) return;

        const subsQuery = query(
          collection(db, 'subscriptions'),
          where('userId', '==', auth.currentUser.uid)
        );
        const subsSnapshot = await getDocs(subsQuery);
        
        // Process subscription data for chart
        const subscriptionsByMonth = {};
        const now = new Date();
        const monthsToShow = 6;

        // Initialize last 6 months
        for (let i = monthsToShow - 1; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
          subscriptionsByMonth[monthKey] = {
            total: 0,
            active: 0
          };
        }

        // Count subscriptions
        subsSnapshot.forEach(doc => {
          const data = doc.data();
          const startDate = new Date(data.startDate);
          const monthKey = startDate.toLocaleString('default', { month: 'short' }) + ' ' + startDate.getFullYear();
          
          if (subscriptionsByMonth[monthKey]) {
            subscriptionsByMonth[monthKey].total++;
            if (data.status === 'active') {
              subscriptionsByMonth[monthKey].active++;
            }
          }
        });

        const labels = Object.keys(subscriptionsByMonth);
        const totalData = labels.map(month => subscriptionsByMonth[month].total);
        const activeData = labels.map(month => subscriptionsByMonth[month].active);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Total Subscriptions',
              data: totalData,
              borderColor: 'rgb(99, 102, 241)',
              backgroundColor: 'rgba(99, 102, 241, 0.5)',
              tension: 0.4
            },
            {
              label: 'Active Subscriptions',
              data: activeData,
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.5)',
              tension: 0.4
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Subscription Trends'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-80 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="h-80">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
}

export default SubscriptionChart;
