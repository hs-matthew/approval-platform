import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "",
  authDomain: "approval-platform.firebaseapp.com",
  projectId: "approval-platform",
  storageBucket: "approval-platform.firebasestorage.app",
  messagingSenderId: "369801713653",
  appId: "1:369801713653:web:cb12850f950ba48adb72bc",
  measurementId: "G-YSS476SRLJ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
