const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const readline = require('readline');

// Initialize Firebase with your config
const firebaseConfig = {
  apiKey: "AIzaSyBsv6iHjJ97BVZ3v28aSkeP399jYDAyZxI",
  authDomain: "mssheetapp.firebaseapp.com",
  projectId: "mssheetapp",
  storageBucket: "mssheetapp.firebasestorage.app",
  messagingSenderId: "275158879164",
  appId: "1:275158879164:web:d3c40ef20d10968047f9b9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => {
  return new Promise(resolve => rl.question(query, resolve));
};

const setupAdmin = async () => {
  try {
    console.log('Setting up admin user...');
    
    // Get admin credentials
    const email = await askQuestion('Enter admin email: ');
    const password = await askQuestion('Enter admin password (min 6 characters): ');
    const name = await askQuestion('Enter admin name: ');
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create the admin document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name,
      email,
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    
    console.log('✅ Admin user created successfully!');
    console.log(`Admin UID: ${user.uid}`);
    
  } catch (error) {
    console.error('Error setting up admin:', error.message);
  } finally {
    rl.close();
  }
};

// Run the setup
setupAdmin().then(() => process.exit(0));
