import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  where,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const COLLECTION_NAME = 'subscriptions';

export const createSubscription = async (subscriptionData) => {
  try {
    // Check if plan name already exists
    const existingPlan = await getDocs(
      query(collection(db, COLLECTION_NAME), 
      where('planName', '==', subscriptionData.planName.trim()))
    );
    
    if (!existingPlan.empty) {
      throw new Error('A plan with this name already exists');
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...subscriptionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const getSubscriptions = async () => {
  try {
    const subscriptionsQuery = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(subscriptionsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw error;
  }
};

export const deleteSubscription = async (subscriptionId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, subscriptionId));
  } catch (error) {
    throw error;
  }
};

export const updateSubscription = async (subscriptionId, updateData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, subscriptionId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    throw error;
  }
};

export const validateSubscriptionData = (data) => {
  const errors = [];

  if (!data.planName?.trim()) {
    errors.push('Plan name is required');
  }

  if (!data.price || data.price <= 0) {
    errors.push('Price must be greater than 0');
  }

  if (!data.features?.trim()) {
    errors.push('At least one feature is required');
  }

  if (!data.duration) {
    errors.push('Duration is required');
  }

  return errors;
};
