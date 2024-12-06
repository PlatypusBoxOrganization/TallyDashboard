import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const addDiscount = async (discountData) => {
  try {
    const docRef = await addDoc(collection(db, 'discounts'), {
      ...discountData,
      createdAt: new Date().toISOString(),
      status: 'active'
    });
    return { id: docRef.id, ...discountData };
  } catch (error) {
    console.error('Error adding discount:', error);
    throw error;
  }
};

export const getDiscounts = async () => {
  try {
    const q = query(
      collection(db, 'discounts'),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting discounts:', error);
    throw error;
  }
};

export const deactivateDiscount = async (discountId) => {
  try {
    const discountRef = doc(db, 'discounts', discountId);
    await updateDoc(discountRef, {
      status: 'inactive',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deactivating discount:', error);
    throw error;
  }
};
