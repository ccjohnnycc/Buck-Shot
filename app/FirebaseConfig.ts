import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBhfVwyoXdxtoXJf5ap1v6aABcuK7r_EiY",
    authDomain: "buck-shot-af4b8.firebaseapp.com",
    projectId: "buck-shot-af4b8",
    storageBucket: "buck-shot-af4b8.firebasestorage.app",
    messagingSenderId: "918908934762",
    appId: "1:918908934762:web:9c006642ab85a506f5c813",
    measurementId: "G-H0SFZ0YC0K"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);