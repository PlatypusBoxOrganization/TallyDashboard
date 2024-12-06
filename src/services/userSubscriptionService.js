import { 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const COLLECTION_NAME = 'userSubscriptions';

export const getUserSubscriptions = async (userId) => {
  try {
    const userSubsQuery = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(userSubsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    throw error;
  }
};

export const getAllUserSubscriptions = async () => {
  try {
    const subsQuery = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(subsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching all user subscriptions:', error);
    throw error;
  }
};
