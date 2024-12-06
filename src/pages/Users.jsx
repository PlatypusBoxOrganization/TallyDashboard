import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { getAllUserSubscriptions } from '../services/userSubscriptionService';
import { getSubscriptions } from '../services/subscriptionService';
import { formatPrice } from '../utils/formatters';
import UserSubscriptionManager from '../components/UserSubscriptionManager';

function Users() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState({});
  const [userSubscriptions, setUserSubscriptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    mobileNumber: '',
    status: 'active',
    deviceId: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [users, allSubscriptions, allUserSubscriptions] = await Promise.all([
        fetchUsers(),
        fetchSubscriptions(),
        fetchUserSubscriptions()
      ]);

      // Process subscriptions into a lookup map
      const subsMap = {};
      allSubscriptions.forEach(sub => {
        subsMap[sub.id] = sub;
      });
      setSubscriptions(subsMap);

      // Process user subscriptions into a lookup map
      const userSubsMap = {};
      allUserSubscriptions.forEach(sub => {
        if (!userSubsMap[sub.userId]) {
          userSubsMap[sub.userId] = [];
        }
        userSubsMap[sub.userId].push(sub);
      });
      setUserSubscriptions(userSubsMap);

      setUsers(users);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersQuery = query(collection(db, 'users'), orderBy('fullName'));
      const snapshot = await getDocs(usersQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  const fetchSubscriptions = async () => {
    try {
      return await getSubscriptions();
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  };

  const fetchUserSubscriptions = async () => {
    try {
      return await getAllUserSubscriptions();
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      throw error;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Add user to Firestore
      await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        fullName: formData.fullName,
        email: formData.email,
        username: formData.username,
        mobileNumber: formData.mobileNumber,
        deviceId: formData.deviceId,
        createdAt: new Date().toISOString(),
        status: 'active'
      });

      setFormData({
        fullName: '',
        email: '',
        username: '',
        password: '',
        mobileNumber: '',
        deviceId: ''
      });
      setSuccess('User created successfully');
      setShowForm(false);
      fetchInitialData();
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.message);
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'inactive',
        updatedAt: new Date().toISOString()
      });
      setSuccess('User deactivated successfully');
      fetchInitialData();
    } catch (error) {
      console.error('Error deactivating user:', error);
      setError('Failed to deactivate user');
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'active',
        updatedAt: new Date().toISOString()
      });
      setSuccess('User activated successfully');
      fetchInitialData();
    } catch (error) {
      console.error('Error activating user:', error);
      setError('Failed to activate user');
    }
  };

  const handleUnlinkDevice = async (userId) => {
    if (!window.confirm('Are you sure you want to unlink this device? The user will need to re-authenticate.')) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        deviceId: '',
        updatedAt: new Date().toISOString()
      });
      setSuccess('Device unlinked successfully');
      fetchInitialData();
    } catch (error) {
      console.error('Error unlinking device:', error);
      setError('Failed to unlink device');
    }
  };

  const getUserSubscriptionInfo = (userId) => {
    const userSubs = userSubscriptions[userId] || [];
    if (userSubs.length === 0) return null;

    // Get the most recent active subscription
    const activeSub = userSubs.find(sub => sub.status === 'active');
    if (!activeSub) return null;

    const plan = subscriptions[activeSub.planId];
    if (!plan) return null;

    return {
      id: activeSub.id,
      planId: activeSub.planId,
      planName: plan.planName,
      price: plan.price,
      status: activeSub.status,
      startDate: new Date(activeSub.createdAt).toLocaleDateString()
    };
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main>
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            {/* Header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Users</h1>
              </div>
              <div>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  <svg className="w-4 h-4 fill-current opacity-50 shrink-0" viewBox="0 0 16 16">
                    <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                  </svg>
                  <span className="ml-2">{showForm ? 'Cancel' : 'Add User'}</span>
                </button>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-600 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-4 bg-green-100 text-green-600 rounded-md">
                {success}
              </div>
            )}

            {/* New User Form */}
            {showForm && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-8">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="fullName">
                        Full Name *
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        className="form-input w-full"
                        type="text"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="email">
                        Email *
                      </label>
                      <input
                        id="email"
                        name="email"
                        className="form-input w-full"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="username">
                        Username *
                      </label>
                      <input
                        id="username"
                        name="username"
                        className="form-input w-full"
                        type="text"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="mobileNumber">
                        Mobile Number
                      </label>
                      <input
                        id="mobileNumber"
                        name="mobileNumber"
                        className="form-input w-full"
                        type="tel"
                        pattern="[0-9]{10}"
                        value={formData.mobileNumber}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="password">
                        Password *
                      </label>
                      <input
                        id="password"
                        name="password"
                        className="form-input w-full"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="btn border-gray-200 hover:border-gray-300 text-gray-600 mr-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                    >
                      Create User
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users List */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-sm border border-gray-200 dark:border-gray-700">
              <div className="p-3">
                {loading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No users found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table-auto w-full">
                      <thead className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/20">
                        <tr>
                          <th className="p-2 whitespace-nowrap">
                            <div className="font-semibold text-left">Name</div>
                          </th>
                          <th className="p-2 whitespace-nowrap">
                            <div className="font-semibold text-left">Email</div>
                          </th>
                          <th className="p-2 whitespace-nowrap">
                            <div className="font-semibold text-left">Username</div>
                          </th>
                          <th className="p-2 whitespace-nowrap">
                            <div className="font-semibold text-left">Mobile</div>
                          </th>
                          <th className="p-2 whitespace-nowrap">
                            <div className="font-semibold text-left">Status</div>
                          </th>
                          <th className="p-2 whitespace-nowrap">
                            <div className="font-semibold text-left">Device</div>
                          </th>
                          <th className="p-2 whitespace-nowrap">
                            <div className="font-semibold text-left">Subscription</div>
                          </th>
                          <th className="p-2 whitespace-nowrap">
                            <div className="font-semibold text-left">Actions</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700">
                        {users.map((user) => {
                          const subscription = getUserSubscriptionInfo(user.id);
                          return (
                            <tr key={user.id}>
                              <td className="p-2 whitespace-nowrap">
                                <div className="text-left font-medium text-gray-800 dark:text-gray-100">
                                  {user.fullName}
                                </div>
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <div className="text-left">{user.email}</div>
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <div className="text-left">{user.username}</div>
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <div className="text-left">{user.mobileNumber || '-'}</div>
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <div className={`text-left inline-flex font-medium rounded-full text-center px-2.5 py-0.5 ${
                                  user.status === 'active' 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'bg-red-100 text-red-600'
                                }`}>
                                  {user.status}
                                </div>
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <div className="text-left">
                                  {user.deviceId ? (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-500">
                                        {user.deviceId.substring(0, 8)}...
                                      </span>
                                      <button
                                        onClick={() => handleUnlinkDevice(user.id)}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded"
                                      >
                                        Unlink
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-500">No device linked</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                {subscription ? (
                                  <div className="text-left">
                                    <div className="font-medium text-gray-800 dark:text-gray-100">
                                      {subscription.planName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {formatPrice(subscription.price)} • Since {subscription.startDate}
                                    </div>
                                    <div className={`text-xs inline-block px-2 py-1 rounded ${
                                      subscription.status === 'active' 
                                        ? 'bg-green-100 text-green-600' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {subscription.status}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500">No active subscription</div>
                                )}
                                <div className="mt-2">
                                  <UserSubscriptionManager
                                    user={user}
                                    subscriptions={subscriptions}
                                    currentSubscription={subscription}
                                    onUpdate={fetchInitialData}
                                  />
                                </div>
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <div className="space-y-1">
                                  {user.status === 'active' ? (
                                    <button
                                      onClick={() => handleDeactivateUser(user.id)}
                                      className="btn-sm bg-red-500 hover:bg-red-600 text-white w-full"
                                    >
                                      Deactivate
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleActivateUser(user.id)}
                                      className="btn-sm bg-green-500 hover:bg-green-600 text-white w-full"
                                    >
                                      Activate
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Users;
