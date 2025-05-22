import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyAJtgyqEefDpGum1bJtsij7wj78baGnSBU",
  authDomain: "buckshot-app-v2.firebaseapp.com",
  projectId: "buckshot-app-v2",
  storageBucket: "buckshot-app-v2.appspot.com",
  messagingSenderId: "610651736628",
  appId: "1:610651736628:web:f983649809654936d65861",
  measurementId: "G-RD2P31S9YM"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };