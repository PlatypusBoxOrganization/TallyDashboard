import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, subscriptionsRef, systemLinksRef } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

const SubscriptionManager = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [systemLinks, setSystemLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = getAuth();

  // Fetch user's subscriptions
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const q = query(subscriptionsRef, where("userId", "==", auth.currentUser?.uid));
        const querySnapshot = await getDocs(q);
        const subs = [];
        querySnapshot.forEach((doc) => {
          subs.push({ id: doc.id, ...doc.data() });
        });
        setSubscriptions(subs);

        // Fetch system links for each subscription
        const links = [];
        for (const sub of subs) {
          const linksQuery = query(systemLinksRef, where("subscriptionId", "==", sub.id));
          const linksSnapshot = await getDocs(linksQuery);
          linksSnapshot.forEach((doc) => {
            links.push({ id: doc.id, ...doc.data() });
          });
        }
        setSystemLinks(links);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (auth.currentUser) {
      fetchSubscriptions();
    }
  }, [auth.currentUser]);

  const addSubscription = async (planId) => {
    try {
      const newSubscription = {
        userId: auth.currentUser.uid,
        planId,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      };
      await addDoc(subscriptionsRef, newSubscription);
      // Refresh subscriptions
      window.location.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const linkSystem = async (subscriptionId) => {
    try {
      // Get system unique identifier (e.g., hardware ID)
      const systemId = await getSystemIdentifier();
      
      // Check if system is already linked
      const q = query(systemLinksRef, where("systemId", "==", systemId));
      const existingLinks = await getDocs(q);
      
      if (!existingLinks.empty) {
        throw new Error("This system is already linked to another subscription");
      }

      // Create new system link
      const newLink = {
        subscriptionId,
        systemId,
        linkedAt: new Date().toISOString(),
        status: 'active'
      };
      await addDoc(systemLinksRef, newLink);
      
      // Refresh system links
      window.location.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const unlinkSystem = async (linkId) => {
    try {
      const linkRef = doc(db, 'systemLinks', linkId);
      await updateDoc(linkRef, {
        status: 'inactive',
        unlinkedAt: new Date().toISOString()
      });
      // Refresh system links
      window.location.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  // Helper function to get system identifier
  const getSystemIdentifier = async () => {
    // This is a placeholder. In a real implementation, you would use a library
    // or system API to get a unique hardware identifier
    return 'SYSTEM-' + Math.random().toString(36).substr(2, 9);
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">TallyDashboard Subscription Management</h2>
      
      {/* Active Subscriptions */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Active Subscriptions</h3>
        {subscriptions.length === 0 ? (
          <p className="text-gray-500">No active subscriptions</p>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="border dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-medium text-gray-800 dark:text-white">
                    Plan: {sub.planId}
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {sub.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Valid until: {new Date(sub.endDate).toLocaleDateString()}
                </p>
                
                {/* System Links */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Linked Systems</h5>
                  {systemLinks.filter(link => link.subscriptionId === sub.id).map((link) => (
                    <div key={link.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 rounded p-2 mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        System ID: {link.systemId}
                      </span>
                      <button
                        onClick={() => unlinkSystem(link.id)}
                        className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Unlink
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => linkSystem(sub.id)}
                    className="mt-2 text-sm text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300"
                  >
                    + Link This System
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add New Subscription */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Add New Subscription</h3>
        <div className="flex gap-4">
          <button
            onClick={() => addSubscription('basic')}
            className="bg-violet-500 text-white px-4 py-2 rounded-lg hover:bg-violet-600 transition-colors"
          >
            Add Basic Plan
          </button>
          <button
            onClick={() => addSubscription('pro')}
            className="bg-violet-500 text-white px-4 py-2 rounded-lg hover:bg-violet-600 transition-colors"
          >
            Add Pro Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;
