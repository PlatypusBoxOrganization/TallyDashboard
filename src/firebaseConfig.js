// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection } from "firebase/firestore"; 
import { getStorage } from "firebase/storage";

//const firebaseConfig = {
//  apiKey: "AIzaSyBhXlQv_9b8D1Touw2cTNPrUHXvyljKq28",
//  authDomain: "tellyerpcustom.firebaseapp.com",
//  projectId: "tellyerpcustom",
//  storageBucket: "tellyerpcustom.firebasestorage.app",
//  messagingSenderId: "218291333059",
//  appId: "1:218291333059:web:bfb447071aa74e41317f76",
//  measurementId: "G-5YCRKVK2MW"
//};

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

// Initialize Services
export const auth = getAuth(app); 
export const db = getFirestore(app); 
export const storage = getStorage(app); 

// Collection References
export const subscriptionsRef = collection(db, 'subscriptions');
export const systemLinksRef = collection(db, 'systemLinks');
export const usersRef = collection(db, 'users');

export default app;
