import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc, setDoc, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { getAllUserSubscriptions } from '../services/userSubscriptionService';
import { getSubscriptions } from '../services/subscriptionService';
import { formatPrice } from '../utils/formatters';
import UserSubscriptionManager from '../components/UserSubscriptionManager';
import { getDoc } from 'firebase/firestore';
import ChildUserForm from '../components/ChildUserForm';
import PermissionManager from '../components/PermissionManager';
import { getParentChildren, canCreateChild, decrementChildCount } from '../services/roleService';
import ChildLimitEditor from '../components/ChildLimitEditor';
import SuperAdminUserEditor from '../components/SuperAdminUserEditor';
import PasswordResetManager from '../components/PasswordResetManager';
import { isSuperAdmin } from '../services/permissionService';

function Users() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [subscriptions, setSubscriptions] = useState({});
    const [userSubscriptions, setUserSubscriptions] = useState({});
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showChildForm, setShowChildForm] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState('parent');
    const [activeTab, setActiveTab] = useState('myChildren');
    const [myChildren, setMyChildren] = useState([]);
    const [childLimitInfo, setChildLimitInfo] = useState({ canCreate: false, currentCount: 0, limit: 0 });
    const [editingChildLimit, setEditingChildLimit] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [resettingPassword, setResettingPassword] = useState(null);
    const [isUserSuperAdmin, setIsUserSuperAdmin] = useState(false);

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
    const [filterRole, setFilterRole] = useState('all');

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
            setCurrentUser(userData);
            setUserRole(userData.role || 'parent');

            // Check if current user is super admin
            isSuperAdmin(userData.username).then(setIsUserSuperAdmin);

            if (userData.role === 'superadmin') {
                setActiveTab('allUsers');
            } else {
                setActiveTab('myChildren');
            }
        }

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (currentUser && currentUser.username) {
            loadMyChildren();
            loadChildLimitInfo();
        }
    }, [currentUser]);

    const loadMyChildren = async () => {
        if (!currentUser || currentUser.role === 'child') return;

        try {
            const children = await getParentChildren(currentUser.username);
            setMyChildren(children);
        } catch (error) {
            console.error('Error loading children:', error);
        }
    };

    const loadChildLimitInfo = async () => {
        if (!currentUser || currentUser.role === 'child') return;

        try {
            const info = await canCreateChild(currentUser.username);
            setChildLimitInfo(info);
        } catch (error) {
            console.error('Error loading child limit info:', error);
        }
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [users, allSubscriptions, allUserSubscriptions] = await Promise.all([
                fetchUsers(),
                fetchSubscriptions(),
                fetchUserSubscriptions()
            ]);

            const subsMap = {};
            allSubscriptions.forEach(sub => {
                subsMap[sub.id] = sub;
            });
            setSubscriptions(subsMap);

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

    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const usernameCaps = formData.username.trim().toUpperCase();
            const userRef = doc(db, 'users', usernameCaps);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                setError('Username already exists');
                return;
            }

            const passwordHash = await hashPassword(formData.password);

            await setDoc(userRef, {
                fullName: formData.fullName,
                email: formData.email,
                username: usernameCaps,
                mobileNumber: formData.mobileNumber,
                deviceId: formData.deviceId,
                passwordHash,
                createdAt: new Date().toISOString(),
                status: 'active',
                expirationDate: null,
                role: 'parent',
                parentId: null,
                childLimit: 5,
                childCount: 0,
                customPermissions: [
                    'view_dashboard',
                    'view_subscriptions',
                    'manage_subscriptions',
                    'view_users',
                    'view_reports',
                    'create_children',
                    'manage_children',
                    'view_analytics',
                    'export_data'
                ],
                createdBy: currentUser?.username || 'ADMIN'
            });

            setSuccess('Parent user created successfully');
            setShowForm(false);
            setFormData({
                fullName: '',
                email: '',
                username: '',
                password: '',
                mobileNumber: '',
                status: 'active',
                deviceId: ''
            });
            fetchInitialData();

        } catch (err) {
            console.error(err);
            setError('Failed to create user');
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
            loadMyChildren();
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
            loadMyChildren();
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
            loadMyChildren();
        } catch (error) {
            console.error('Error unlinking device:', error);
            setError('Failed to unlink device');
        }
    };

    const handleDeleteUser = async (userId, userRole, parentId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            const { deleteDoc } = await import('firebase/firestore');
            await deleteDoc(doc(db, 'users', userId));

            if (userRole === 'child' && parentId) {
                await decrementChildCount(parentId);
            }

            setSuccess('User deleted successfully');
            fetchInitialData();
            loadMyChildren();
            loadChildLimitInfo();
        } catch (error) {
            console.error('Error deleting user:', error);
            setError('Failed to delete user');
        } finally {
            setLoading(false);
        }
    };

    const getUserSubscriptionInfo = (userId) => {
        const userSubs = userSubscriptions[userId];
        if (!userSubs || userSubs.length === 0) return null;

        const activeSub = userSubs.find(sub => sub.status === 'active');
        if (!activeSub) return userSubs[0];

        const subscription = subscriptions[activeSub.subscriptionId];
        if (!subscription) return activeSub;

        return {
            ...activeSub,
            planName: subscription.plan,
            price: subscription.price
        };
    };

    const handleChildFormSuccess = () => {
        setShowChildForm(false);
        fetchInitialData();
        loadMyChildren();
        loadChildLimitInfo();
    };

    const getFilteredUsers = () => {
        if (activeTab === 'myChildren') {
            return myChildren;
        }

        let filtered = users;

        if (filterRole !== 'all') {
            filtered = filtered.filter(user => user.role === filterRole);
        }

        return filtered;
    };

    const filteredUsers = getFilteredUsers();

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                <main className="grow">
                    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
                        <div className="sm:flex sm:justify-between sm:items-center mb-8">
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                                    Users Management
                                </h1>
                            </div>

                            <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                                {(userRole === 'parent' || userRole === 'superadmin') && activeTab === 'myChildren' && (
                                    <button
                                        className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                                        onClick={() => setShowChildForm(true)}
                                    >
                                        <svg className="w-4 h-4 fill-current opacity-50 shrink-0" viewBox="0 0 16 16">
                                            <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                                        </svg>
                                        <span className="ml-2">Add Child User</span>
                                    </button>
                                )}

                                {userRole === 'superadmin' && activeTab === 'allUsers' && (
                                    <button
                                        className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                                        onClick={() => setShowForm(true)}
                                    >
                                        <svg className="w-4 h-4 fill-current opacity-50 shrink-0" viewBox="0 0 16 16">
                                            <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                                        </svg>
                                        <span className="ml-2">Add Parent User</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {(userRole === 'parent' || userRole === 'superadmin') && (
                            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                                <nav className="-mb-px flex space-x-8">
                                    <button
                                        onClick={() => setActiveTab('myChildren')}
                                        className={`${activeTab === 'myChildren'
                                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                    >
                                        My Children
                                        <span className="ml-2 py-0.5 px-2 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                            {childLimitInfo.currentCount} / {childLimitInfo.limit}
                                        </span>
                                    </button>

                                    {userRole === 'superadmin' && (
                                        <button
                                            onClick={() => setActiveTab('allUsers')}
                                            className={`${activeTab === 'allUsers'
                                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                        >
                                            All Users
                                            <span className="ml-2 py-0.5 px-2 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                {users.length}
                                            </span>
                                        </button>
                                    )}
                                </nav>
                            </div>
                        )}

                        {activeTab === 'allUsers' && userRole === 'superadmin' && (
                            <div className="mb-4 flex items-center space-x-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Role:</label>
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="form-select text-sm"
                                >
                                    <option value="all">All Users</option>
                                    <option value="parent">Parents Only</option>
                                    <option value="child">Children Only</option>
                                    <option value="superadmin">Super Admins</option>
                                </select>
                            </div>
                        )}

                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                                {success}
                            </div>
                        )}

                        {showChildForm && (
                            <div className="mb-6">
                                <ChildUserForm
                                    parentId={currentUser?.username}
                                    onSuccess={handleChildFormSuccess}
                                    onCancel={() => setShowChildForm(false)}
                                />
                            </div>
                        )}

                        {showForm && userRole === 'superadmin' && (
                            <div className="mb-6 bg-white dark:bg-gray-800 shadow-lg rounded-sm border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                                    Create Parent User
                                </h3>
                                <form onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Full Name</label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                className="form-input w-full"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="form-input w-full"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Username</label>
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                className="form-input w-full"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Password</label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className="form-input w-full"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Mobile Number</label>
                                            <input
                                                type="tel"
                                                name="mobileNumber"
                                                value={formData.mobileNumber}
                                                onChange={handleInputChange}
                                                className="form-input w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Device ID (Optional)</label>
                                            <input
                                                type="text"
                                                name="deviceId"
                                                value={formData.deviceId}
                                                onChange={handleInputChange}
                                                className="form-input w-full"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            className="btn bg-gray-500 hover:bg-gray-600 text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                                        >
                                            Create Parent User
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-sm border border-gray-200 dark:border-gray-700">
                            <div className="p-3">
                                {loading ? (
                                    <div className="text-center py-4">Loading...</div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500">
                                        {activeTab === 'myChildren' ? 'No children found' : 'No users found'}
                                    </div>
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
                                                        <div className="font-semibold text-left">Role</div>
                                                    </th>
                                                    {activeTab === 'allUsers' && (
                                                        <th className="p-2 whitespace-nowrap">
                                                            <div className="font-semibold text-left">Parent</div>
                                                        </th>
                                                    )}
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
                                                {filteredUsers.map((user) => {
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
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                                                                        user.role === 'parent' ? 'bg-blue-100 text-blue-800' :
                                                                            'bg-green-100 text-green-800'
                                                                    }`}>
                                                                    {user.role === 'superadmin' ? 'Super Admin' :
                                                                        user.role === 'parent' ? 'Parent' : 'Child'}
                                                                </span>
                                                                {user.role === 'parent' && (
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        {user.childCount || 0}/{user.childLimit || 0} children
                                                                    </div>
                                                                )}
                                                            </td>
                                                            {activeTab === 'allUsers' && (
                                                                <td className="p-2 whitespace-nowrap">
                                                                    <div className="text-left text-sm">
                                                                        {user.parentId ? (
                                                                            <span className="text-indigo-600 dark:text-indigo-400">
                                                                                {user.parentId}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-400">-</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            )}
                                                            <td className="p-2 whitespace-nowrap">
                                                                <div className="text-left">{user.mobileNumber || '-'}</div>
                                                            </td>
                                                            <td className="p-2 whitespace-nowrap">
                                                                <div className={`inline-flex font-medium rounded-full text-center px-2.5 py-0.5 ${user.status === 'active'
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
                                                                        <div className={`text-xs inline-block px-2 py-1 rounded ${subscription.status === 'active'
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
                                                                        onUpdate={() => {
                                                                            fetchInitialData();
                                                                            loadMyChildren();
                                                                        }}
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="p-2 whitespace-nowrap">
                                                                <div className="space-y-1">
                                                                    {/* Permission Manager for Children */}
                                                                    {user.role === 'child' && (
                                                                        <PermissionManager
                                                                            userId={user.id}
                                                                            userName={user.fullName}
                                                                            onUpdate={() => {
                                                                                fetchInitialData();
                                                                                loadMyChildren();
                                                                            }}
                                                                        />
                                                                    )}

                                                                    {/* Edit Child Limit (SA only, parents only) */}
                                                                    {user.role === 'parent' && isUserSuperAdmin && (
                                                                        <button
                                                                            onClick={() => setEditingChildLimit(user)}
                                                                            className="btn-sm bg-orange-500 hover:bg-orange-600 text-white w-full"
                                                                        >
                                                                            📊 Edit Limit
                                                                        </button>
                                                                    )}

                                                                    {/* Full User Editor (SA only, all users) */}
                                                                    {isUserSuperAdmin && (
                                                                        <button
                                                                            onClick={() => setEditingUser(user)}
                                                                            className="btn-sm bg-purple-500 hover:bg-purple-600 text-white w-full"
                                                                        >
                                                                            ⚙️ Edit User
                                                                        </button>
                                                                    )}

                                                                    {/* Reset Password (SA only, all users) */}
                                                                    {isUserSuperAdmin && (
                                                                        <button
                                                                            onClick={() => setResettingPassword(user)}
                                                                            className="btn-sm bg-yellow-500 hover:bg-yellow-600 text-white w-full"
                                                                        >
                                                                            🔑 Reset Password
                                                                        </button>
                                                                    )}

                                                                    {/* Activate/Deactivate */}
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

                                                                    {/* Delete (not for superadmin) */}
                                                                    {user.role !== 'superadmin' && (
                                                                        <button
                                                                            onClick={() => handleDeleteUser(user.id, user.role, user.parentId)}
                                                                            className="btn-sm bg-gray-200 hover:bg-gray-300 text-red-600 flex items-center w-full mt-1"
                                                                            title="Delete User"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v1H9V4a1 1 0 011-1z" />
                                                                            </svg>
                                                                            Delete
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

            {/* Child Limit Editor Modal */}
            {editingChildLimit && isUserSuperAdmin && (
                <ChildLimitEditor
                    userId={editingChildLimit.id}
                    userName={editingChildLimit.fullName}
                    currentLimit={editingChildLimit.childLimit || 5}
                    onUpdate={() => {
                        fetchInitialData();
                        loadMyChildren();
                        loadChildLimitInfo();
                        setEditingChildLimit(null);
                    }}
                    onClose={() => setEditingChildLimit(null)}
                />
            )}

            {/* Super Admin User Editor Modal */}
            {editingUser && isUserSuperAdmin && (
                <SuperAdminUserEditor
                    userId={editingUser.id}
                    userName={editingUser.fullName}
                    userRole={editingUser.role}
                    onUpdate={() => {
                        fetchInitialData();
                        loadMyChildren();
                        loadChildLimitInfo();
                        setEditingUser(null);
                    }}
                    onClose={() => setEditingUser(null)}
                />
            )}

            {/* Password Reset Modal */}
            {resettingPassword && isUserSuperAdmin && (
                <PasswordResetManager
                    userId={resettingPassword.id}
                    userName={resettingPassword.fullName}
                    onUpdate={() => {
                        fetchInitialData();
                        loadMyChildren();
                    }}
                    onClose={() => setResettingPassword(null)}
                />
            )}
        </div>
    );
}

export default Users;