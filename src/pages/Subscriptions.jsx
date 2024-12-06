import React, { useState, useEffect } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { 
  createSubscription, 
  getSubscriptions, 
  deleteSubscription,
  validateSubscriptionData 
} from '../services/subscriptionService';
import { formatPrice, formatFeatures } from '../utils/formatters';
import { getDiscounts, addDiscount, deactivateDiscount } from '../services/discountService';
import Modal from '../components/Modal';

function Subscriptions() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    planName: '',
    price: '',
    features: '',
    startDate: new Date().toISOString().split('T')[0],
    duration: '1', // Default to 1 month
    status: 'active',
    defaultDiscount: null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [discounts, setDiscounts] = useState([]);
  const [newDiscountData, setNewDiscountData] = useState({
    name: '',
    percentage: '',
    description: ''
  });
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  const durationOptions = [
    { value: '1', label: '1 Month' },
    { value: '3', label: '3 Months' },
    { value: '6', label: '6 Months' },
    { value: '12', label: '12 Months' }
  ];

  useEffect(() => {
    fetchSubscriptions();
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      const discountList = await getDiscounts();
      setDiscounts(discountList);
    } catch (error) {
      console.error('Error loading discounts:', error);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setError('Failed to fetch subscriptions');
    } finally {
      setLoading(false);
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

    // Validate form data
    const validationErrors = validateSubscriptionData(formData);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    try {
      // Validate price
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        setError('Please enter a valid price');
        return;
      }

      // Create features array
      const featuresArray = formData.features
        .split(',')
        .map(feature => feature.trim())
        .filter(feature => feature !== '');

      const subscriptionData = {
        planName: formData.planName.trim(),
        price: priceValue,
        features: formatFeatures(formData.features),
        startDate: formData.startDate,
        duration: parseInt(formData.duration),
        status: formData.status,
        defaultDiscount: formData.defaultDiscount
      };

      await createSubscription(subscriptionData);

      // Reset form and show success message
      setFormData({
        planName: '',
        price: '',
        features: '',
        startDate: new Date().toISOString().split('T')[0],
        duration: '1',
        status: 'active',
        defaultDiscount: null
      });
      setSuccess('Subscription plan created successfully');
      setShowForm(false);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error creating subscription:', error);
      setError(error.message);
    }
  };

  const handleDeleteSubscription = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteSubscription(subscriptionId);
      setSuccess('Subscription plan deleted successfully');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      setError('Failed to delete subscription plan');
      setLoading(false);
    }
  };

  const handleAddDiscount = async () => {
    try {
      if (!newDiscountData.name || !newDiscountData.percentage) {
        setError('Please fill in all required fields');
        return;
      }

      const percentage = parseFloat(newDiscountData.percentage);
      if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
        setError('Please enter a valid discount percentage between 0 and 100');
        return;
      }

      await addDiscount({
        name: newDiscountData.name,
        percentage: percentage,
        description: newDiscountData.description || ''
      });

      await loadDiscounts();
      setNewDiscountData({ name: '', percentage: '', description: '' });
      setError('');
      setIsDiscountModalOpen(false);
    } catch (error) {
      console.error('Error adding discount:', error);
      setError('Failed to add discount');
    }
  };

  const handleRemoveDiscount = async (discountId) => {
    try {
      await deactivateDiscount(discountId);
      // Refresh the discounts list
      const updatedDiscounts = await getDiscounts();
      setDiscounts(updatedDiscounts);
    } catch (error) {
      setError('Failed to remove discount. Please try again.');
    }
  };

  const calculateDiscountedPrice = (price, discount) => {
    if (!discount) return price;
    const discountAmount = price * (discount.percentage / 100);
    return price - discountAmount;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main>
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            {/* Page header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Subscription Plans</h1>
              </div>
              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="btn-sm bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  <svg className="w-4 h-4 fill-current opacity-50 shrink-0" viewBox="0 0 16 16">
                    <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                  </svg>
                  <span className="ml-2">{showForm ? 'Cancel' : 'Add Plan'}</span>
                </button>
                <button
                  onClick={() => setIsDiscountModalOpen(true)}
                  className="btn-sm bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  Manage Discounts
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

            {/* New Subscription Form */}
            {showForm && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-8">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="planName">
                        Plan Name *
                      </label>
                      <input
                        id="planName"
                        name="planName"
                        className="form-input w-full"
                        type="text"
                        value={formData.planName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="price">
                        Price (₹) *
                      </label>
                      <input
                        id="price"
                        name="price"
                        className="form-input w-full"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="startDate">
                        Start Date *
                      </label>
                      <input
                        id="startDate"
                        name="startDate"
                        className="form-input w-full"
                        type="date"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="duration">
                        Duration *
                      </label>
                      <select
                        id="duration"
                        name="duration"
                        className="form-select w-full"
                        value={formData.duration}
                        onChange={handleInputChange}
                        required
                      >
                        {durationOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="status">
                        Status *
                      </label>
                      <select
                        id="status"
                        name="status"
                        className="form-select w-full"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="defaultDiscount">
                        Default Discount
                      </label>
                      <select
                        id="defaultDiscount"
                        name="defaultDiscount"
                        className="form-select w-full"
                        value={formData.defaultDiscount ? formData.defaultDiscount.id : ''}
                        onChange={(e) => {
                          const discount = discounts.find(d => d.id === e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            defaultDiscount: discount || null
                          }));
                        }}
                      >
                        <option value="">No default discount</option>
                        {discounts.map(discount => (
                          <option key={discount.id} value={discount.id}>
                            {discount.name} ({discount.percentage}% off)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1" htmlFor="features">
                        Features (comma-separated) *
                      </label>
                      <textarea
                        id="features"
                        name="features"
                        className="form-textarea w-full"
                        rows="3"
                        value={formData.features}
                        onChange={handleInputChange}
                        placeholder="Enter features separated by commas"
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
                      Save Plan
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Subscriptions List */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-sm border border-gray-200 dark:border-gray-700">
              <div className="p-3">
                {loading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : subscriptions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No subscription plans found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table-auto w-full">
                      <thead className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/20">
                        <tr>
                          <th className="p-2 whitespace-nowrap">
                            <div className="font-semibold text-left">Plan Name</div>
                          </th>
                          <th className="p-2 whitespace-nowrap">
                            <div className="font-semibold text-left">Price</div>
                          </th>
                          <th className="p-2 whitespace-nowrap">
                            <div className="font-semibold text-left">Duration</div>
                          </th>
                          <th className="p-2 whitespace-nowrap">
                            <div className="font-semibold text-left">Start Date</div>
                          </th>
                          <th className="p-2 whitespace-nowrap">
                            <div className="font-semibold text-left">Features</div>
                          </th>
                          <th className="p-2 whitespace-nowrap">
                            <div className="font-semibold text-left">Actions</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700">
                        {subscriptions.map((subscription) => (
                          <tr key={subscription.id}>
                            <td className="p-2 whitespace-nowrap">
                              <div className="text-left font-medium text-gray-800 dark:text-gray-100">
                                {subscription.planName}
                              </div>
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              <div className="text-left font-medium text-green-600">
                                {formatPrice(subscription.price)}
                              </div>
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              <div className="text-left">
                                {subscription.duration} {subscription.duration === 1 ? 'Month' : 'Months'}
                              </div>
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              <div className="text-left">
                                {new Date(subscription.startDate).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="text-left">
                                <ul className="list-disc list-inside">
                                  {Array.isArray(subscription.features) 
                                    ? subscription.features.map((feature, index) => (
                                        <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                                          {feature}
                                        </li>
                                      ))
                                    : typeof subscription.features === 'string'
                                      ? subscription.features.split(',').map((feature, index) => (
                                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                                            {feature.trim()}
                                          </li>
                                        ))
                                      : <li className="text-sm text-gray-600 dark:text-gray-400">No features listed</li>
                                  }
                                </ul>
                              </div>
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              <button
                                onClick={() => handleDeleteSubscription(subscription.id)}
                                className="btn-sm bg-red-500 hover:bg-red-600 text-white"
                                title="Delete Subscription"
                              >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Discount Management Modal */}
      <Modal
        isOpen={isDiscountModalOpen}
        onClose={() => {
          setIsDiscountModalOpen(false);
          setNewDiscountData({ name: '', percentage: '', description: '' });
          setError('');
        }}
        title="Manage Discounts"
      >
        <div className="space-y-6">
          {/* Add New Discount Form */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Add New Discount
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discount Name
                </label>
                <input
                  type="text"
                  value={newDiscountData.name}
                  onChange={(e) => setNewDiscountData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter discount name"
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newDiscountData.percentage}
                  onChange={(e) => setNewDiscountData(prev => ({ ...prev, percentage: e.target.value }))}
                  placeholder="Enter percentage"
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newDiscountData.description}
                  onChange={(e) => setNewDiscountData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description"
                  className="form-input w-full"
                />
              </div>
              <button
                onClick={handleAddDiscount}
                className="w-full btn-sm bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                Add Discount
              </button>
            </div>
          </div>

          {/* Existing Discounts List */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Existing Discounts
            </h4>
            <div className="space-y-2">
              {discounts.map((discount) => (
                <div
                  key={discount.id}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                >
                  <div>
                    <div className="font-medium">{discount.name}</div>
                    <div className="text-sm text-gray-500">{discount.description}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {discount.percentage}% off
                    </span>
                    <button
                      onClick={() => handleRemoveDiscount(discount.id)}
                      className="text-red-500 hover:text-red-700 focus:outline-none"
                      title="Remove discount"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 mt-2">
              {error}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default Subscriptions;
