// migrate-to-permission-collections.mjs
// Migrate existing users to use the new permission collection system
// Run this AFTER running initialize-permissions.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBYhOde-S56RUPeYYv7IWku1vbcQN-yz2U",
  authDomain: "set-sft.firebaseapp.com",
  projectId: "set-sft",
  storageBucket: "set-sft.firebasestorage.app",
  messagingSenderId: "438991795948",
  appId: "1:438991795948:web:19b90fc5c5732f0e6e17c9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Migration configuration
const MIGRATION_CONFIG = {
  dryRun: false, // Set to false to perform actual migration
  removeOldPermissions: false // Set to true to remove old permissions object
};

// Map old permission keys to new permission IDs
const PERMISSION_MAPPING = {
  'viewDashboard': 'view_dashboard',
  'viewSubscriptions': 'view_subscriptions',
  'manageSubscriptions': 'manage_subscriptions',
  'viewUsers': 'view_users',
  'manageUsers': 'manage_users',
  'viewReports': 'view_reports',
  'createChildren': 'create_children',
  'manageChildren': 'manage_children',
  'systemConfig': 'system_config'
};

async function migrateUsers() {
  console.log('🚀 Migrating Users to Permission Collections System');
  console.log('===================================================');
  console.log(`Mode: ${MIGRATION_CONFIG.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`Found ${usersSnapshot.size} users\n`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      try {
        // Skip if already migrated (has customPermissions array)
        if (userData.customPermissions && Array.isArray(userData.customPermissions)) {
          console.log(`⏭️  ${userId} - already migrated`);
          skippedCount++;
          continue;
        }

        // Convert old permissions object to new permission IDs array
        const customPermissions = [];
        
        if (userData.permissions && typeof userData.permissions === 'object') {
          Object.entries(userData.permissions).forEach(([key, value]) => {
            if (value === true && PERMISSION_MAPPING[key]) {
              customPermissions.push(PERMISSION_MAPPING[key]);
            }
          });
        }

        // If user has no custom permissions, they'll use role defaults
        // Only set customPermissions if user had different permissions than their role default
        const updateData = {};
        
        // If user is a child with custom permissions, save them
        if (userData.role === 'child' && customPermissions.length > 0) {
          updateData.customPermissions = customPermissions;
        }
        
        // Optionally remove old permissions object
        if (MIGRATION_CONFIG.removeOldPermissions) {
          updateData.permissions = null;
        }

        console.log(`📝 ${userId} (${userData.role})`);
        console.log(`   Permissions: ${customPermissions.length > 0 ? customPermissions.join(', ') : 'Using role defaults'}`);

        if (!MIGRATION_CONFIG.dryRun && Object.keys(updateData).length > 0) {
          await updateDoc(doc(db, 'users', userId), updateData);
          console.log(`   ✅ Migrated`);
        } else if (MIGRATION_CONFIG.dryRun) {
          console.log(`   ✅ Would migrate`);
        }

        migratedCount++;
        console.log('');

      } catch (error) {
        console.error(`   ❌ Error migrating ${userId}:`, error.message);
        errorCount++;
      }
    }

    console.log('===================================================');
    console.log('📊 Migration Summary:');
    console.log('===================================================');
    console.log(`✅ Migrated:    ${migratedCount} users`);
    console.log(`⏭️  Skipped:     ${skippedCount} users`);
    console.log(`❌ Errors:      ${errorCount} users`);
    console.log('===================================================');

    if (MIGRATION_CONFIG.dryRun) {
      console.log('\n⚠️  DRY RUN - No changes made');
      console.log('Set MIGRATION_CONFIG.dryRun = false to migrate');
    } else {
      console.log('\n✅ Migration complete!');
      console.log('\nNext steps:');
      console.log('1. Test user login and permissions');
      console.log('2. Update frontend to use new permission service');
      console.log('3. Add/remove permissions in Firestore Console');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  }

  process.exit(0);
}

migrateUsers();
