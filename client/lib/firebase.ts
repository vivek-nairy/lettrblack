import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyApaCpY_uyGd_hbe2e-PSlyS7aovlzd7k8",
  authDomain: "lettrblack.firebaseapp.com",
  projectId: "lettrblack",
  storageBucket: "lettrblack.firebasestorage.app",
  messagingSenderId: "833345889142",
  appId: "1:833345889142:web:0f3108c7c4e1dccee41057"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage }; 