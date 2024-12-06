import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { formatPrice } from '../utils/formatters';
import Modal from './Modal';
import { getDiscounts, addDiscount } from '../services/discountService';

function UserSubscriptionManager({ user, subscriptions, currentSubscription, onUpdate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('1');
  const [manualDiscount, setManualDiscount] = useState('');
  const [discounts, setDiscounts] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);
  const [newDiscountData, setNewDiscountData] = useState({
    name: '',
    percentage: '',
    description: ''
  });

  const durationOptions = [
    { value: '1', label: '1 Month' },
    { value: '3', label: '3 Months' },
    { value: '6', label: '6 Months' },
    { value: '12', label: '12 Months' }
  ];

  useEffect(() => {
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
      setIsAddingDiscount(false);
      setNewDiscountData({ name: '', percentage: '', description: '' });
      setError('');
    } catch (error) {
      console.error('Error adding discount:', error);
      setError('Failed to add discount');
    }
  };

  const calculateFinalPrice = (basePrice, duration) => {
    const months = parseInt(duration);
    let discount = 0;
    
    // Duration-based discounts
    if (months === 3) discount = 0.05;      // 5% discount for 3 months
    else if (months === 6) discount = 0.10;  // 10% discount for 6 months
    else if (months === 12) discount = 0.15; // 15% discount for 12 months
    
    // Apply manual discount if provided
    let manualDiscountPercentage = 0;
    if (selectedDiscount) {
      manualDiscountPercentage = selectedDiscount.percentage / 100;
    } else if (manualDiscount) {
      const parsed = parseFloat(manualDiscount);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
        manualDiscountPercentage = parsed / 100;
      }
    }

    // Calculate total price with both discounts
    const durationDiscount = basePrice * months * discount;
    const priceAfterDurationDiscount = basePrice * months - durationDiscount;
    const manualDiscountAmount = priceAfterDurationDiscount * manualDiscountPercentage;
    const finalPrice = priceAfterDurationDiscount - manualDiscountAmount;

    return {
      originalPrice: basePrice * months,
      finalPrice,
      totalDiscount: durationDiscount + manualDiscountAmount,
      discountPercentage: ((durationDiscount + manualDiscountAmount) / (basePrice * months)) * 100
    };
  };

  const handleAssignSubscription = async (subscriptionId) => {
    try {
      setLoading(true);
      setError('');

      // If there's an existing active subscription, deactivate it
      if (currentSubscription) {
        await updateDoc(doc(db, 'userSubscriptions', currentSubscription.id), {
          status: 'inactive',
          updatedAt: new Date().toISOString()
        });
      }

      // Create new subscription assignment
      const subscriptionData = {
        userId: user.id,
        planId: subscriptionId,
        duration: parseInt(selectedDuration),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add discount information if present
      if (selectedDiscount) {
        subscriptionData.discount = {
          id: selectedDiscount.id,
          name: selectedDiscount.name,
          percentage: selectedDiscount.percentage
        };
      } else if (manualDiscount) {
        const parsed = parseFloat(manualDiscount);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
          subscriptionData.discount = {
            percentage: parsed,
            isManual: true
          };
        }
      }

      await addDoc(collection(db, 'userSubscriptions'), subscriptionData);

      onUpdate();
      setIsModalOpen(false);
      setSelectedDuration('1');
      setManualDiscount('');
      setSelectedDiscount(null);
    } catch (error) {
      console.error('Error assigning subscription:', error);
      setError('Failed to assign subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSubscription = async () => {
    if (!currentSubscription) return;

    if (!window.confirm('Are you sure you want to remove this subscription?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      await updateDoc(doc(db, 'userSubscriptions', currentSubscription.id), {
        status: 'inactive',
        updatedAt: new Date().toISOString()
      });

      onUpdate();
    } catch (error) {
      console.error('Error removing subscription:', error);
      setError('Failed to remove subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex space-x-2">
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={loading}
          className="btn-sm bg-indigo-500 hover:bg-indigo-600 text-white"
        >
          {loading ? 'Processing...' : 'Manage Subscription'}
        </button>
        {currentSubscription && (
          <button
            onClick={handleRemoveSubscription}
            disabled={loading}
            className="btn-sm bg-red-500 hover:bg-red-600 text-white"
          >
            Remove
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-500 mt-1">
          {error}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsAddingDiscount(false);
          setNewDiscountData({ name: '', percentage: '', description: '' });
          setError('');
        }}
        title="Select Subscription Plan"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration
              </label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="form-select w-full"
              >
                {durationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Manual Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={manualDiscount}
                onChange={(e) => {
                  setManualDiscount(e.target.value);
                  setSelectedDiscount(null);
                }}
                placeholder="Enter discount %"
                className="form-input w-full"
                disabled={selectedDiscount !== null}
              />
            </div>
          </div>

          {/* Saved Discounts */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Saved Discounts
              </label>
              <button
                onClick={() => setIsAddingDiscount(true)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Add New
              </button>
            </div>
            <div className="space-y-2">
              {discounts.map((discount) => (
                <button
                  key={discount.id}
                  onClick={() => {
                    setSelectedDiscount(discount);
                    setManualDiscount('');
                  }}
                  className={`w-full text-left p-2 rounded-md border ${
                    selectedDiscount?.id === discount.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{discount.name}</div>
                      <div className="text-sm text-gray-500">{discount.description}</div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {discount.percentage}% off
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Add New Discount Form */}
          {isAddingDiscount && (
            <div className="border-t pt-4 mt-4">
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
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddDiscount}
                    className="btn-sm bg-indigo-500 hover:bg-indigo-600 text-white"
                  >
                    Add Discount
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingDiscount(false);
                      setNewDiscountData({ name: '', percentage: '', description: '' });
                    }}
                    className="btn-sm border-gray-200 hover:border-gray-300 text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {Object.values(subscriptions).map((subscription) => {
              const priceDetails = calculateFinalPrice(subscription.price, selectedDuration);
              
              return (
                <div
                  key={subscription.id}
                  className="border dark:border-gray-700 rounded-lg p-4 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors cursor-pointer"
                  onClick={() => handleAssignSubscription(subscription.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {subscription.planName}
                      </h4>
                      <div className="text-sm text-gray-500">
                        {formatPrice(subscription.price)} / month
                      </div>
                    </div>
                    {priceDetails.totalDiscount > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Save {priceDetails.discountPercentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <div className="text-sm text-gray-500">
                      Original: {formatPrice(priceDetails.originalPrice)}
                    </div>
                    {priceDetails.totalDiscount > 0 && (
                      <div className="text-sm text-green-600">
                        Discount: -{formatPrice(priceDetails.totalDiscount)}
                      </div>
                    )}
                    <div className="text-base font-medium text-gray-900 dark:text-gray-100">
                      Final Price: {formatPrice(priceDetails.finalPrice)}
                    </div>
                  </div>

                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Features:
                    </h5>
                    <ul className="text-sm text-gray-500 list-disc list-inside">
                      {subscription.features?.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default UserSubscriptionManager;
