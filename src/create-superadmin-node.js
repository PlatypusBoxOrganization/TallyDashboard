// create-superadmin-node.js
// Node.js Script to Create Super Admin
// Usage: node create-superadmin-node.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
const readline = require('readline');

// Your Firebase configuration
// IMPORTANT: Update this with your actual Firebase config!
const firebaseConfig = {
  apiKey: "AIzaSyBYhOde-S56RUPeYYv7IWku1vbcQN-yz2U",
  authDomain: "set-sft.firebaseapp.com",
  projectId: "set-sft",
  storageBucket: "set-sft.firebasestorage.app",
  messagingSenderId: "438991795948",
  appId: "1:438991795948:web:19b90fc5c5732f0e6e17c9"
};

// Default configuration
const DEFAULT_CONFIG = {
  username: "ADMIN",
  email: "admin@yourdomain.com",
  fullName: "System Administrator",
  password: "Admin@123",  // ⚠️ CHANGE THIS!
  childLimit: 999
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// SHA-256 Password Hashing
async function hashPassword(password) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createSuperAdmin() {
  console.log('\n🔐 Super Admin Creation Wizard');
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
    const userRef = doc(db, 'users', usernameCaps);

    // Check if user already exists
    console.log('\n🔍 Checking if user exists...');
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
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
    const passwordHash = await hashPassword(password);
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

    await setDoc(userRef, superAdminData);

    console.log('\n================================================');
    console.log('✅ SUPER ADMIN CREATED SUCCESSFULLY!');
    console.log('================================================');
    console.log('Login Credentials:');
    console.log(`  Username: ${usernameCaps}`);
    console.log(`  Password: ${password}`);
    console.log('================================================');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
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
console.log('⚠️  Make sure Firebase credentials are correct!');
console.log('Check firebaseConfig at the top of this file.\n');

createSuperAdmin().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
