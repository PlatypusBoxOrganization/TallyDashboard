// initialize-permissions.mjs
// Script to create the permissions collection in Firestore
// Run once: node initialize-permissions.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBYhOde-S56RUPeYYv7IWku1vbcQN-yz2U",
  authDomain: "set-sft.firebaseapp.com",
  projectId: "set-sft",
  storageBucket: "set-sft.firebasestorage.app",
  messagingSenderId: "438991795948",
  appId: "1:438991795948:web:19b90fc5c5732f0e6e17c9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Default permissions structure
const PERMISSIONS = {
  'view_dashboard': {
    name: 'View Dashboard',
    description: 'Access to the main dashboard and statistics',
    category: 'Dashboard',
    enabled: true
  },
  'view_subscriptions': {
    name: 'View Subscriptions',
    description: 'View subscription plans and details',
    category: 'Subscriptions',
    enabled: true
  },
  'manage_subscriptions': {
    name: 'Manage Subscriptions',
    description: 'Create, edit, and delete subscription plans',
    category: 'Subscriptions',
    enabled: true
  },
  'view_users': {
    name: 'View Users',
    description: 'View user list and information',
    category: 'Users',
    enabled: true
  },
  'manage_users': {
    name: 'Manage Users',
    description: 'Create, edit, and delete users',
    category: 'Users',
    enabled: true
  },
  'view_reports': {
    name: 'View Reports',
    description: 'Access to reports and analytics',
    category: 'Reports',
    enabled: true
  },
  'create_children': {
    name: 'Create Child Users',
    description: 'Ability to create child user accounts',
    category: 'Users',
    enabled: true
  },
  'manage_children': {
    name: 'Manage Child Users',
    description: 'Edit and manage child user accounts and permissions',
    category: 'Users',
    enabled: true
  },
  'system_config': {
    name: 'System Configuration',
    description: 'Access to system-wide configuration and settings',
    category: 'System',
    enabled: true
  },
  'view_analytics': {
    name: 'View Analytics',
    description: 'Access to advanced analytics and insights',
    category: 'Reports',
    enabled: true
  },
  'export_data': {
    name: 'Export Data',
    description: 'Export data to CSV, Excel, or other formats',
    category: 'Data',
    enabled: true
  },
  'import_data': {
    name: 'Import Data',
    description: 'Import data from external sources',
    category: 'Data',
    enabled: true
  }
};

// Default role permissions
const ROLE_PERMISSIONS = {
  'superadmin': {
    permissions: [
      'view_dashboard',
      'view_subscriptions',
      'manage_subscriptions',
      'view_users',
      'manage_users',
      'view_reports',
      'create_children',
      'manage_children',
      'system_config',
      'view_analytics',
      'export_data',
      'import_data'
    ]
  },
  'parent': {
    permissions: [
      'view_dashboard',
      'view_subscriptions',
      'manage_subscriptions',
      'view_users',
      'view_reports',
      'create_children',
      'manage_children',
      'view_analytics',
      'export_data'
    ]
  },
  'child': {
    permissions: [
      'view_dashboard',
      'view_subscriptions',
      'view_reports'
    ]
  }
};

async function initializePermissions() {
  console.log('🚀 Initializing Permissions System');
  console.log('===================================\n');

  try {
    // Create permissions collection
    console.log('📝 Creating permissions collection...');
    let permCount = 0;
    
    for (const [permId, permData] of Object.entries(PERMISSIONS)) {
      await setDoc(doc(db, 'permissions', permId), {
        ...permData,
        createdAt: new Date().toISOString()
      });
      console.log(`  ✅ Created: ${permData.name}`);
      permCount++;
    }
    
    console.log(`\n✅ Created ${permCount} permissions\n`);

    // Create role permissions
    console.log('👥 Creating role permissions...');
    
    for (const [role, roleData] of Object.entries(ROLE_PERMISSIONS)) {
      await setDoc(doc(db, 'rolePermissions', role), {
        ...roleData,
        updatedAt: new Date().toISOString()
      });
      console.log(`  ✅ ${role}: ${roleData.permissions.length} permissions`);
    }

    console.log('\n===================================');
    console.log('✅ PERMISSIONS INITIALIZED!');
    console.log('===================================');
    console.log('\nCollections created:');
    console.log('  - permissions (12 permissions)');
    console.log('  - rolePermissions (3 roles)');
    console.log('\nYou can now:');
    console.log('  1. Add/remove permissions in Firestore Console');
    console.log('  2. Update role permissions');
    console.log('  3. Assign custom permissions to users');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error initializing permissions:', error);
  }

  process.exit(0);
}

initializePermissions();
