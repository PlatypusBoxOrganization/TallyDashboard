// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection } from "firebase/firestore"; 
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCC-eTl2qhnqcQKu3_mBngo8fp-HuZ-otg",
  authDomain: "dashboard-a5ca8.firebaseapp.com",
  projectId: "dashboard-a5ca8",
  storageBucket: "dashboard-a5ca8.firebasestorage.app",
  messagingSenderId: "186022224200",
  appId: "1:186022224200:web:4da185a4f39e74cc44137d",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app); 
export const db = getFirestore(app); 
export const storage = getStorage(app); 

// Collection References
export const subscriptionsRef = collection(db, 'subscriptions');
export const systemLinksRef = collection(db, 'systemLinks');
export const usersRef = collection(db, 'users');

export default app;
