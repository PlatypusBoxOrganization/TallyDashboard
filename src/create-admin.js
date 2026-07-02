// create-admin.mjs
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { createHash } from 'crypto';

// ⚠️ UPDATE THESE VALUES ⚠️
const CONFIG = {
  username: "ADMIN",
  email: "admin@example.com",        // ⚠️ CHANGE THIS
  fullName: "System Administrator",
  password: "Admin@123",              // ⚠️ CHANGE THIS
  
  // Your Firebase config (from src/firebaseConfig.js)
  firebase: {
    apiKey: "AIzaSyBYhOde-S56RUPeYYv7IWku1vbcQN-yz2U",
    authDomain: "set-sft.firebaseapp.com",
    projectId: "set-sft",
    storageBucket: "set-sft.firebasestorage.app",
    messagingSenderId: "438991795948",
    appId: "1:438991795948:web:19b90fc5c5732f0e6e17c9"
  }
};

// Initialize Firebase
const app = initializeApp(CONFIG.firebase);
const db = getFirestore(app);

// Hash password
const passwordHash = createHash('sha256').update(CONFIG.password).digest('hex');

// Create super admin
const usernameCaps = CONFIG.username.toUpperCase();

console.log('Creating super admin...');
console.log(`Username: ${usernameCaps}`);
console.log(`Email: ${CONFIG.email}`);

await setDoc(doc(db, 'users', usernameCaps), {
  username: usernameCaps,
  email: CONFIG.email,
  fullName: CONFIG.fullName,
  mobileNumber: '',
  deviceId: '',
  passwordHash: passwordHash,
  createdAt: new Date().toISOString(),
  status: 'active',
  expirationDate: null,
  role: 'superadmin',
  parentId: null,
  childLimit: 999,
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
});

console.log('\n✅ SUPER ADMIN CREATED!');
console.log('========================');
console.log(`Username: ${usernameCaps}`);
console.log(`Password: ${CONFIG.password}`);
console.log('========================');
console.log('⚠️ Change password after first login!\n');

process.exit(0);