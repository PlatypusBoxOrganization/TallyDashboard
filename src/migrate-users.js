// migrate-users.js
// Run this script ONCE to migrate existing users to the new role system
// Usage: node migrate-users.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';

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

// Migration configuration
const MIGRATION_CONFIG = {
  dryRun: false, // Set to true to test without making changes
  defaultChildLimit: 5,
  defaultParentPermissions: {
    viewDashboard: true,
    viewSubscriptions: true,
    viewUsers: true,
    manageSubscriptions: true,
    manageUsers: false,
    viewReports: true,
    createChildren: true,
    manageChildren: true
  }
};

async function migrateUsers() {
  console.log('🚀 Starting User Migration to Role-Based System');
  console.log('================================================');
  console.log(`Mode: ${MIGRATION_CONFIG.dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be written)'}`);
  console.log('');

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  try {
    // Fetch all users
    console.log('📥 Fetching users from Firestore...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`Found ${usersSnapshot.size} users\n`);

    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      try {
        // Skip if user already has role field
        if (userData.role) {
          console.log(`⏭️  Skipping ${userId} - already migrated (role: ${userData.role})`);
          skippedCount++;
          continue;
        }

        // Prepare update data
        const updateData = {
          role: 'parent', // All existing users become parents
          parentId: null,
          childLimit: MIGRATION_CONFIG.defaultChildLimit,
          childCount: 0,
          permissions: MIGRATION_CONFIG.defaultParentPermissions,
          createdBy: 'MIGRATION'
        };

        console.log(`📝 Processing ${userId} (${userData.fullName || 'Unknown'})...`);
        
        if (!MIGRATION_CONFIG.dryRun) {
          await updateDoc(doc(db, 'users', userId), updateData);
          console.log(`   ✅ Migrated successfully`);
        } else {
          console.log(`   ✅ Would migrate with data:`, updateData);
        }

        migratedCount++;
        console.log('');

      } catch (error) {
        console.error(`   ❌ Error migrating ${userId}:`, error.message);
        errorCount++;
        console.log('');
      }
    }

    // Summary
    console.log('================================================');
    console.log('📊 Migration Summary:');
    console.log('================================================');
    console.log(`✅ Migrated:    ${migratedCount} users`);
    console.log(`⏭️  Skipped:     ${skippedCount} users (already migrated)`);
    console.log(`❌ Errors:      ${errorCount} users`);
    console.log(`📋 Total:       ${usersSnapshot.size} users`);
    console.log('================================================');

    if (MIGRATION_CONFIG.dryRun) {
      console.log('\n⚠️  This was a DRY RUN - no changes were made to the database');
      console.log('Set MIGRATION_CONFIG.dryRun = false to perform actual migration');
    } else {
      console.log('\n✅ Migration completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Verify migrated data in Firestore Console');
      console.log('2. Create a super admin user manually');
      console.log('3. Test parent login and child creation');
      console.log('4. Clear user localStorage and re-login');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Verify migration function
async function verifyMigration() {
  console.log('\n🔍 Verifying Migration...\n');
  
  const usersSnapshot = await getDocs(collection(db, 'users'));
  
  let withRole = 0;
  let withoutRole = 0;
  let parentCount = 0;
  let childCount = 0;
  
  usersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.role) {
      withRole++;
      if (data.role === 'parent') parentCount++;
      if (data.role === 'child') childCount++;
    } else {
      withoutRole++;
      console.log(`⚠️  User without role: ${doc.id}`);
    }
  });
  
  console.log('Verification Results:');
  console.log(`- Users with role: ${withRole}`);
  console.log(`- Users without role: ${withoutRole}`);
  console.log(`- Parents: ${parentCount}`);
  console.log(`- Children: ${childCount}`);
  console.log('');
  
  if (withoutRole === 0) {
    console.log('✅ All users have been migrated successfully!');
  } else {
    console.log('⚠️  Some users still need migration');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--verify')) {
    await verifyMigration();
  } else if (args.includes('--help')) {
    console.log('User Migration Script');
    console.log('Usage:');
    console.log('  node migrate-users.js           - Run migration');
    console.log('  node migrate-users.js --verify  - Verify migration status');
    console.log('  node migrate-users.js --help    - Show this help');
    console.log('');
    console.log('Configuration:');
    console.log('  Edit MIGRATION_CONFIG in this file to customize');
  } else {
    await migrateUsers();
    console.log('\nRun with --verify to check migration status');
  }
}

main().catch(console.error);
