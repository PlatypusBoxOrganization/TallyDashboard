// src/services/permissionService.js
// Enhanced version with separate permissions collection
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Get all available permissions from the permissions collection
 * @returns {Promise<Object>} - Object with permission definitions
 */
export async function getAllAvailablePermissions() {
  try {
    const permissionsSnapshot = await getDocs(collection(db, 'permissions'));
    const permissions = {};
    
    permissionsSnapshot.forEach(doc => {
      permissions[doc.id] = doc.data();
    });
    
    return permissions;
  } catch (error) {
    console.error('Error fetching available permissions:', error);
    throw error;
  }
}

/**
 * Get permissions for a specific role from the rolePermissions collection
 * @param {string} role - Role name (superadmin, parent, child)
 * @returns {Promise<Array>} - Array of permission IDs
 */
export async function getRolePermissions(role) {
  try {
    const rolePermDoc = await getDoc(doc(db, 'rolePermissions', role));
    
    if (!rolePermDoc.exists()) {
      console.warn(`No permissions found for role: ${role}`);
      return [];
    }
    
    return rolePermDoc.data().permissions || [];
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    throw error;
  }
}

/**
 * Get user's assigned permissions
 * @param {string} userId - The username (ID) of the user
 * @returns {Promise<Array>} - Array of permission IDs
 */
export async function getUserPermissions(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    // If user has custom permissions, return those
    if (userData.customPermissions && Array.isArray(userData.customPermissions)) {
      return userData.customPermissions;
    }
    
    // Otherwise, get permissions based on role
    return await getRolePermissions(userData.role || 'child');
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    throw error;
  }
}

/**
 * Check if user has a specific permission
 * @param {string} userId - The username (ID) of the user
 * @param {string} permissionId - Permission ID to check
 * @returns {Promise<boolean>}
 */
export async function checkPermission(userId, permissionId) {
  try {
    const userPermissions = await getUserPermissions(userId);
    return userPermissions.includes(permissionId);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Update user's custom permissions
 * @param {string} userId - The username (ID) of the user
 * @param {Array<string>} permissionIds - Array of permission IDs
 * @param {string} currentUserId - The ID of the user making the change (optional)
 */
export async function updateUserPermissions(userId, permissionIds, currentUserId = null) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    // Check if current user is superadmin
    let isSuperAdmin = false;
    if (currentUserId) {
      const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
      if (currentUserDoc.exists()) {
        isSuperAdmin = currentUserDoc.data().role === 'superadmin';
      }
    }
    
    // Prevent modifying superadmin permissions unless you are superadmin
    if (userData.role === 'superadmin' && !isSuperAdmin) {
      throw new Error('Cannot modify superadmin permissions');
    }
    
    await setDoc(userRef, {
      customPermissions: permissionIds
    }, { merge: true });
  } catch (error) {
    console.error('Error updating permissions:', error);
    throw error;
  }
}

/**
 * Get permission details by ID
 * @param {string} permissionId - Permission ID
 * @returns {Promise<Object>} - Permission details
 */
export async function getPermissionDetails(permissionId) {
  try {
    const permDoc = await getDoc(doc(db, 'permissions', permissionId));
    
    if (!permDoc.exists()) {
      return null;
    }
    
    return {
      id: permDoc.id,
      ...permDoc.data()
    };
  } catch (error) {
    console.error('Error fetching permission details:', error);
    throw error;
  }
}

/**
 * Get permissions with full details for a user
 * @param {string} userId - The username (ID) of the user
 * @returns {Promise<Array>} - Array of permission objects with details
 */
export async function getUserPermissionsWithDetails(userId) {
  try {
    const permissionIds = await getUserPermissions(userId);
    const allPermissions = await getAllAvailablePermissions();
    
    return permissionIds.map(id => ({
      id,
      ...allPermissions[id]
    })).filter(p => p.name); // Filter out any invalid permissions
  } catch (error) {
    console.error('Error fetching user permissions with details:', error);
    throw error;
  }
}

/**
 * Get permissions grouped by category
 * @returns {Promise<Object>} - Permissions grouped by category
 */
export async function getPermissionsByCategory() {
  try {
    const allPermissions = await getAllAvailablePermissions();
    const grouped = {};
    
    Object.entries(allPermissions).forEach(([id, permission]) => {
      const category = permission.category || 'Other';
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push({
        id,
        ...permission
      });
    });
    
    return grouped;
  } catch (error) {
    console.error('Error grouping permissions:', error);
    throw error;
  }
}

/**
 * Add a new permission to the system
 * @param {string} permissionId - Unique permission ID
 * @param {Object} permissionData - Permission data
 */
export async function addPermission(permissionId, permissionData) {
  try {
    await setDoc(doc(db, 'permissions', permissionId), {
      name: permissionData.name,
      description: permissionData.description,
      category: permissionData.category || 'General',
      enabled: permissionData.enabled !== false,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding permission:', error);
    throw error;
  }
}

/**
 * Update role default permissions
 * @param {string} role - Role name
 * @param {Array<string>} permissionIds - Array of permission IDs
 */
export async function updateRolePermissions(role, permissionIds) {
  try {
    await setDoc(doc(db, 'rolePermissions', role), {
      permissions: permissionIds,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    throw error;
  }
}

/**
 * Check multiple permissions at once
 * @param {string} userId - The username (ID) of the user
 * @param {Array<string>} permissionIds - Array of permission IDs to check
 * @returns {Promise<Object>} - Object with permission IDs as keys and boolean values
 */
export async function checkMultiplePermissions(userId, permissionIds) {
  try {
    const userPermissions = await getUserPermissions(userId);
    const result = {};
    
    permissionIds.forEach(permId => {
      result[permId] = userPermissions.includes(permId);
    });
    
    return result;
  } catch (error) {
    console.error('Error checking multiple permissions:', error);
    return {};
  }
}

/**
 * Update user's role (superadmin only)
 * @param {string} userId - The username (ID) of the user to update
 * @param {string} newRole - New role ('parent', 'child', 'superadmin')
 * @param {string} currentUserId - The ID of the user making the change
 */
export async function updateUserRole(userId, newRole, currentUserId) {
  try {
    // Check if current user is superadmin
    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== 'superadmin') {
      throw new Error('Only superadmin can change user roles');
    }
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const validRoles = ['parent', 'child', 'superadmin'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid role');
    }
    
    await setDoc(userRef, {
      role: newRole
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

/**
 * Update child limit for a parent user (superadmin only)
 * @param {string} userId - The username (ID) of the parent
 * @param {number} newLimit - New child limit
 * @param {string} currentUserId - The ID of the user making the change
 */
export async function updateChildLimit(userId, newLimit, currentUserId) {
  try {
    // Check if current user is superadmin
    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== 'superadmin') {
      throw new Error('Only superadmin can change child limits');
    }
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    if (userData.role !== 'parent') {
      throw new Error('Can only set child limit for parent users');
    }
    
    await setDoc(userRef, {
      childLimit: parseInt(newLimit)
    }, { merge: true });
  } catch (error) {
    console.error('Error updating child limit:', error);
    throw error;
  }
}

/**
 * Check if current user is superadmin
 * @param {string} userId - The username (ID) of the user
 * @returns {Promise<boolean>}
 */
export async function isSuperAdmin(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return false;
    }
    return userDoc.data().role === 'superadmin';
  } catch (error) {
    console.error('Error checking superadmin status:', error);
    return false;
  }
}
