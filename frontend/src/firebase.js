import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, // Ensure environment variables are set correctly
  authDomain: "netxplore-9a659.firebaseapp.com",
  projectId: "netxplore-9a659",
  storageBucket: "netxplore-9a659.firebasestorage.app",
  messagingSenderId: "325348993938",
  appId: "1:325348993938:web:b75eafa38d5415606eaf4b",
  measurementId: "G-77GXWL3L8J",
};

export const app = initializeApp(firebaseConfig);
