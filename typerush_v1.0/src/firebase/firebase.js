import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDALq07VLLIJ9pl6ERH2WWMxHrrrC0VSQc",
  authDomain: "typerush-fd843.firebaseapp.com",
  projectId: "typerush-fd843",
  storageBucket: "typerush-fd843.firebasestorage.app",
  messagingSenderId: "4467988039",
  appId: "1:4467988039:web:b4a7edc648808f78220362",
  measurementId: "G-VS0YNJE86V",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
