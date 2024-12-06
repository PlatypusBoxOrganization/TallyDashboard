import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import SubscriptionChart from '../charts/SubscriptionChart';
import UserSubscriptionAssignment from '../components/UserSubscriptionAssignment';
import { formatPrice } from '../utils/formatters';

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPlans: 0,
    activePlans: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    annualRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchStats();
    // Set up refresh interval
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Clear previous stats first
      setStats(prev => ({
        ...prev,
        totalPlans: 0,
        activePlans: 0,
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0,
        annualRevenue: 0
      }));

      // Fetch users
      const usersQuery = query(collection(db, 'users'));
      const activeUsersQuery = query(collection(db, 'users'), where('status', '==', 'active'));
      const usersSnapshot = await getDocs(usersQuery);
      const activeUsersSnapshot = await getDocs(activeUsersQuery);

      // Fetch subscription plans with fresh query
      const plansQuery = query(collection(db, 'subscriptions'));
      const activePlansQuery = query(collection(db, 'subscriptions'), where('status', '==', 'active'));
      const plansSnapshot = await getDocs(plansQuery);
      const activePlansSnapshot = await getDocs(activePlansQuery);

      // Get all subscription plans
      const plans = {};
      plansSnapshot.forEach(doc => {
        const plan = doc.data();
        plans[doc.id] = plan;
      });

      // Fetch user subscriptions with fresh query
      const userSubscriptionsQuery = query(collection(db, 'userSubscriptions'));
      const activeUserSubscriptionsQuery = query(collection(db, 'userSubscriptions'), where('status', '==', 'active'));
      const userSubscriptionsSnapshot = await getDocs(userSubscriptionsQuery);
      const activeUserSubscriptionsSnapshot = await getDocs(activeUserSubscriptionsQuery);

      // Calculate revenue
      let monthlyRevenue = 0;
      let annualRevenue = 0;

      // Calculate revenue from active subscriptions
      activeUserSubscriptionsSnapshot.forEach(doc => {
        const subscription = doc.data();
        const plan = plans[subscription.planId];
        if (plan) {
          monthlyRevenue += plan.price || 0;
          annualRevenue += (plan.price || 0) * 12;
        }
      });

      // Update stats with fresh data
      setStats({
        totalUsers: usersSnapshot.size || 0,
        activeUsers: activeUsersSnapshot.size || 0,
        totalPlans: plansSnapshot.size || 0,
        activePlans: activePlansSnapshot.size || 0,
        totalSubscriptions: userSubscriptionsSnapshot.size || 0,
        activeSubscriptions: activeUserSubscriptionsSnapshot.size || 0,
        monthlyRevenue,
        annualRevenue
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Reset stats on error
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalPlans: 0,
        activePlans: 0,
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0,
        annualRevenue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main>
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            {/* Refresh Button */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
              <button
                onClick={fetchStats}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
              >
                <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8Z"
                  />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Last Update Time */}
            {lastUpdate && (
              <div className="text-sm text-gray-500 mb-4">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}

            {/* Dashboard content */}
            <div className="grid grid-cols-12 gap-6">
              {/* Subscription Stats */}
              <div className="col-span-12 sm:col-span-6 xl:col-span-3">
                <div className="flex flex-col bg-white dark:bg-gray-800 shadow-lg rounded-sm border border-gray-200 dark:border-gray-700 p-5">
                  <div className="grow">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Total Plans</h3>
                    <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">{stats.totalPlans}</div>
                    <div className="text-sm text-gray-500">Active Plans: {stats.activePlans}</div>
                  </div>
                </div>
              </div>

              {/* Active Subscriptions */}
              <div className="col-span-12 sm:col-span-6 xl:col-span-3">
                <div className="flex flex-col bg-white dark:bg-gray-800 shadow-lg rounded-sm border border-gray-200 dark:border-gray-700 p-5">
                  <div className="grow">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Active Subscriptions</h3>
                    <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">{stats.activeSubscriptions}</div>
                    <div className="text-sm text-gray-500">Total: {stats.totalSubscriptions}</div>
                  </div>
                </div>
              </div>

              {/* Monthly Revenue */}
              <div className="col-span-12 sm:col-span-6 xl:col-span-3">
                <div className="flex flex-col bg-white dark:bg-gray-800 shadow-lg rounded-sm border border-gray-200 dark:border-gray-700 p-5">
                  <div className="grow">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Monthly Revenue</h3>
                    <div className="text-3xl font-bold text-green-600 mb-1">{formatPrice(stats.monthlyRevenue)}</div>
                    <div className="text-sm text-gray-500">Per Month</div>
                  </div>
                </div>
              </div>

              {/* Annual Revenue */}
              <div className="col-span-12 sm:col-span-6 xl:col-span-3">
                <div className="flex flex-col bg-white dark:bg-gray-800 shadow-lg rounded-sm border border-gray-200 dark:border-gray-700 p-5">
                  <div className="grow">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Annual Revenue</h3>
                    <div className="text-3xl font-bold text-green-600 mb-1">{formatPrice(stats.annualRevenue)}</div>
                    <div className="text-sm text-gray-500">Per Year</div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="col-span-12">
                <SubscriptionChart />
              </div>

              {/* User Subscription Assignment */}
              <div className="col-span-12">
                <UserSubscriptionAssignment onAssign={fetchStats} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;