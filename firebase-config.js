import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, getDoc, deleteDoc, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAX0f8aSQLiSFd4LStJn4t4QIucn62vOHI",
  authDomain: "emoke-4b778.firebaseapp.com",
  projectId: "emoke-4b778",
  storageBucket: "emoke-4b778.firebasestorage.app",
  messagingSenderId: "309233084438",
  appId: "1:309233084438:web:1a23ccc36b142ba79aad37"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { 
    auth, 
    db, 
    googleProvider, 
    signInWithPopup, 
    onAuthStateChanged, 
    signOut, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot, 
    doc, 
    setDoc, 
    getDoc, 
    deleteDoc,
    where,
    serverTimestamp
};
