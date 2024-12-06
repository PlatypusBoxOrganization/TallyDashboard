import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

function SubscriptionStats() {
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalUsers: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!auth.currentUser) return;

        // Get subscriptions
        const subsQuery = query(
          collection(db, 'subscriptions')
        );
        const subsSnapshot = await getDocs(subsQuery);
        
        let activeSubsCount = 0;
        subsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === 'active') {
            activeSubsCount++;
          }
        });

        // Get users
        const usersQuery = query(
          collection(db, 'users')
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        let activeUsersCount = 0;
        usersSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === 'active') {
            activeUsersCount++;
          }
        });

        setStats({
          totalSubscriptions: subsSnapshot.size,
          activeSubscriptions: activeSubsCount,
          totalUsers: usersSnapshot.size,
          activeUsers: activeUsersCount,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatBox = ({ title, value, color }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{title}</h3>
      <div className={`text-2xl font-bold ${color}`}>
        {loading ? '...' : value}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatBox
        title="Total Subscriptions"
        value={stats.totalSubscriptions}
        color="text-violet-600 dark:text-violet-400"
      />
      <StatBox
        title="Active Subscriptions"
        value={stats.activeSubscriptions}
        color="text-green-600 dark:text-green-400"
      />
      <StatBox
        title="Total Users"
        value={stats.totalUsers}
        color="text-blue-600 dark:text-blue-400"
      />
      <StatBox
        title="Active Users"
        value={stats.activeUsers}
        color="text-emerald-600 dark:text-emerald-400"
      />
    </div>
  );
}

export default SubscriptionStats;
