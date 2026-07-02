// create-superadmin-admin.js
// Firebase Admin SDK Version
// For server-side execution with service account
// Usage: node create-superadmin-admin.js

const admin = require('firebase-admin');
const readline = require('readline');
const crypto = require('crypto');

// Initialize Firebase Admin with service account
// Download serviceAccountKey.json from Firebase Console
// Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Default configuration
const DEFAULT_CONFIG = {
  username: "ADMIN",
  email: "admin@yourdomain.com",
  fullName: "System Administrator",
  password: "Admin@123",
  childLimit: 999
};

// SHA-256 Password Hashing
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createSuperAdmin() {
  console.log('\n🔐 Super Admin Creation Wizard (Firebase Admin SDK)');
  console.log('================================================\n');

  try {
    // Get user input
    console.log('Enter details (press Enter to use default):');
    console.log('');
    
    const username = await question(`Username [${DEFAULT_CONFIG.username}]: `) || DEFAULT_CONFIG.username;
    const email = await question(`Email [${DEFAULT_CONFIG.email}]: `) || DEFAULT_CONFIG.email;
    const fullName = await question(`Full Name [${DEFAULT_CONFIG.fullName}]: `) || DEFAULT_CONFIG.fullName;
    const password = await question(`Password [${DEFAULT_CONFIG.password}]: `) || DEFAULT_CONFIG.password;
    const childLimit = await question(`Child Limit [${DEFAULT_CONFIG.childLimit}]: `) || DEFAULT_CONFIG.childLimit;

    console.log('\n================================================');
    console.log('Creating super admin with:');
    console.log(`  Username: ${username}`);
    console.log(`  Email: ${email}`);
    console.log(`  Full Name: ${fullName}`);
    console.log(`  Password: ${password}`);
    console.log(`  Child Limit: ${childLimit}`);
    console.log('================================================\n');

    const confirm = await question('Proceed? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('❌ Operation cancelled');
      rl.close();
      process.exit(0);
    }

    const usernameCaps = username.trim().toUpperCase();
    const userRef = db.collection('users').doc(usernameCaps);

    // Check if user already exists
    console.log('\n🔍 Checking if user exists...');
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      console.warn('\n⚠️  User already exists!');
      console.log('Existing user data:', userSnap.data());
      
      const shouldUpdate = await question('\nUpdate to super admin? (yes/no): ');
      
      if (shouldUpdate.toLowerCase() !== 'yes' && shouldUpdate.toLowerCase() !== 'y') {
        console.log('❌ Operation cancelled');
        rl.close();
        process.exit(0);
      }
    }

    // Hash password
    console.log('\n🔐 Hashing password...');
    const passwordHash = hashPassword(password);
    console.log('✅ Password hashed');

    // Create super admin
    console.log('💾 Creating super admin in Firestore...');
    
    const superAdminData = {
      username: usernameCaps,
      email: email,
      fullName: fullName,
      mobileNumber: '',
      deviceId: '',
      passwordHash: passwordHash,
      createdAt: new Date().toISOString(),
      status: 'active',
      expirationDate: null,
      
      // Role fields
      role: 'superadmin',
      parentId: null,
      childLimit: parseInt(childLimit),
      childCount: 0,
      permissions: {
        viewDashboard: true,
        viewSubscriptions: true,
        viewUsers: true,
        manageSubscriptions: true,
        manageUsers: true,
        viewReports: true,
        createChildren: true,
        manageChildren: true,
        systemConfig: true
      },
      createdBy: 'SYSTEM'
    };

    await userRef.set(superAdminData);

    console.log('\n================================================');
    console.log('✅ SUPER ADMIN CREATED SUCCESSFULLY!');
    console.log('================================================');
    console.log('Login Credentials:');
    console.log(`  Username: ${usernameCaps}`);
    console.log(`  Password: ${password}`);
    console.log('================================================');
    console.log('\n⚠️  IMPORTANT:');
    console.log('1. Change the password after first login!');
    console.log('2. Keep serviceAccountKey.json secure!');
    console.log('3. Add serviceAccountKey.json to .gitignore!');
    console.log('\n🎉 You can now login as super admin!\n');

  } catch (error) {
    console.error('\n❌ Failed to create super admin:', error);
    console.error('Error details:', error.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Main
console.log('⚠️  Using Firebase Admin SDK');
console.log('Make sure serviceAccountKey.json is in the same folder!\n');

createSuperAdmin().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
