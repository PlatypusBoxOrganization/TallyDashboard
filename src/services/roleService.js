// src/services/roleService.js
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  query, 
  where,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Get the count of children for a parent user
 * @param {string} parentId - The username (ID) of the parent
 * @returns {Promise<number>} - Number of children
 */
export async function getChildrenCount(parentId) {
  try {
    const parentDoc = await getDoc(doc(db, 'users', parentId));
    if (!parentDoc.exists()) {
      throw new Error('Parent not found');
    }
    return parentDoc.data().childCount || 0;
  } catch (error) {
    console.error('Error getting children count:', error);
    throw error;
  }
}

/**
 * Get all children for a parent
 * @param {string} parentId - The username (ID) of the parent
 * @returns {Promise<Array>} - Array of child user objects
 */
export async function getParentChildren(parentId) {
  try {
    const q = query(
      collection(db, 'users'),
      where('parentId', '==', parentId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching children:', error);
    throw error;
  }
}

/**
 * Check if a parent can create more children
 * @param {string} parentId - The username (ID) of the parent
 * @returns {Promise<{canCreate: boolean, currentCount: number, limit: number}>}
 */
export async function canCreateChild(parentId) {
  try {
    const parentDoc = await getDoc(doc(db, 'users', parentId));
    if (!parentDoc.exists()) {
      throw new Error('Parent not found');
    }
    
    const parentData = parentDoc.data();
    const currentCount = parentData.childCount || 0;
    const limit = parentData.childLimit || 0;
    
    return {
      canCreate: currentCount < limit,
      currentCount,
      limit
    };
  } catch (error) {
    console.error('Error checking child creation permission:', error);
    throw error;
  }
}

/**
 * Increment parent's child count
 * @param {string} parentId - The username (ID) of the parent
 */
export async function incrementChildCount(parentId) {
  try {
    const parentRef = doc(db, 'users', parentId);
    await updateDoc(parentRef, {
      childCount: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing child count:', error);
    throw error;
  }
}

/**
 * Decrement parent's child count
 * @param {string} parentId - The username (ID) of the parent
 */
export async function decrementChildCount(parentId) {
  try {
    const parentRef = doc(db, 'users', parentId);
    const parentDoc = await getDoc(parentRef);
    
    if (parentDoc.exists()) {
      const currentCount = parentDoc.data().childCount || 0;
      if (currentCount > 0) {
        await updateDoc(parentRef, {
          childCount: increment(-1)
        });
      }
    }
  } catch (error) {
    console.error('Error decrementing child count:', error);
    throw error;
  }
}

/**
 * Get all parent users
 * @returns {Promise<Array>} - Array of parent user objects
 */
export async function getAllParents() {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'parent')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching parents:', error);
    throw error;
  }
}

/**
 * Update child limit for a parent (superadmin only)
 * @param {string} parentId - The username (ID) of the parent
 * @param {number} newLimit - New child limit
 */
export async function updateChildLimit(parentId, newLimit) {
  try {
    const parentRef = doc(db, 'users', parentId);
    await updateDoc(parentRef, {
      childLimit: newLimit
    });
  } catch (error) {
    console.error('Error updating child limit:', error);
    throw error;
  }
}

/**
 * Get user role
 * @param {string} userId - The username (ID) of the user
 * @returns {Promise<string>} - User role ('superadmin', 'parent', 'child')
 */
export async function getUserRole(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    return userDoc.data().role || 'parent'; // default to parent for backward compatibility
  } catch (error) {
    console.error('Error getting user role:', error);
    throw error;
  }
}

/**
 * Check if user is superadmin
 * @param {string} userId - The username (ID) of the user
 * @returns {Promise<boolean>}
 */
export async function isSuperAdmin(userId) {
  try {
    const role = await getUserRole(userId);
    return role === 'superadmin';
  } catch (error) {
    console.error('Error checking superadmin status:', error);
    return false;
  }
}

/**
 * Check if user is parent
 * @param {string} userId - The username (ID) of the user
 * @returns {Promise<boolean>}
 */
export async function isParent(userId) {
  try {
    const role = await getUserRole(userId);
    return role === 'parent';
  } catch (error) {
    console.error('Error checking parent status:', error);
    return false;
  }
}

/**
 * Check if user is child
 * @param {string} userId - The username (ID) of the user
 * @returns {Promise<boolean>}
 */
export async function isChild(userId) {
  try {
    const role = await getUserRole(userId);
    return role === 'child';
  } catch (error) {
    console.error('Error checking child status:', error);
    return false;
  }
}
