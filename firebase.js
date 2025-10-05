/**
 * Firebase Configuration
 * Shared database with old app, but clean modern setup
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

// Firebase config - SHARED with old app
const firebaseConfig = {
  apiKey: 'AIzaSyDdKzUd-QVHEdHMGl3kbuAKk4p6CjgkgzQ',
  authDomain: 'central-asset-storage.firebaseapp.com',
  projectId: 'central-asset-storage',
  storageBucket: 'central-asset-storage.firebasestorage.app',
  messagingSenderId: '907874309868',
  appId: '1:907874309868:web:5354ee69d6212f3d9937c9'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize function
async function initFirebase() {
  console.log('[Firebase] Initialized');
  return { app, auth, db, storage };
}

// Export everything
export {
  app,
  auth,
  db,
  storage,
  initFirebase,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL
};
