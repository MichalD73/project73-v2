// Notes Module Wrapper for Project73 v2
// Uses original notes-app code with Firebase compatibility layer

import { db, auth, storage } from '../../firebase.js';
import * as firebaseAuth from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import * as firebaseFirestore from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import * as firebaseStorage from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// Setup global firebase object for compatibility
window.firebase = {
  db,
  auth,
  storage,
  ...firebaseAuth,
  ...firebaseFirestore,
  ...firebaseStorage
};

export async function initNotes() {
  console.log('🗒️  Initializing Notes Module (Original UI)...');

  // Wait for Quill and NotesApp to load
  await waitForDependencies();

  // Get container
  const container = document.getElementById('module-content');
  if (!container) return;

  // Add notes app container
  container.innerHTML = '<div id="notes-app"></div>';

  // Add body class for styling
  document.body.classList.add('view-notes');

  // Initialize original NotesApp
  if (window.NotesApp && typeof window.NotesApp.init === 'function') {
    window.NotesApp.init();
  } else {
    console.error('NotesApp not available or init not found!');
  }
}

async function waitForDependencies() {
  let attempts = 0;
  while ((!window.Quill || !window.NotesApp) && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (!window.Quill) {
    throw new Error('Quill failed to load from CDN');
  }

  if (!window.NotesApp) {
    throw new Error('NotesApp failed to load');
  }

  console.log('✅ Quill and NotesApp loaded');
}
