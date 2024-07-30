import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyBwYza4_4rqH_Xr0RrCtUwOnKqDAONCThU",
    authDomain: "educational-system-6d6a0.firebaseapp.com",
    projectId: "educational-system-6d6a0",
    storageBucket: "educational-system-6d6a0.appspot.com",
    messagingSenderId: "4807114175",
    appId: "1:4807114175:web:8342bba579041f2cc4f50a",
    measurementId: "G-GXG231BYQK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export { firestore };