// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection } from "firebase/firestore"; 
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBsv6iHjJ97BVZ3v28aSkeP399jYDAyZxI",
  authDomain: "mssheetapp.firebaseapp.com",
  databaseURL: "https://mssheetapp-default-rtdb.firebaseio.com",
  projectId: "mssheetapp",
  storageBucket: "mssheetapp.firebasestorage.app",
  messagingSenderId: "275158879164",
  appId: "1:275158879164:web:d3c40ef20d10968047f9b9",
  measurementId: "G-Z8FZDDFR8Q"
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
