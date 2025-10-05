/**
 * Project73 v2 - Main Entry Point
 * Clean, modern, modular rewrite
 */

import { initFirebase, auth, onAuthStateChanged } from './firebase.js';

class App {
  constructor() {
    this.modules = {};
    this.currentUser = null;
  }

  async init() {
    console.log('[App] Initializing Project73 v2...');

    // Initialize Firebase
    await initFirebase();

    // Setup auth listener
    onAuthStateChanged(auth, (user) => {
      this.handleAuthChange(user);
    });
  }

  handleAuthChange(user) {
    this.currentUser = user;

    if (user) {
      console.log('[App] User signed in:', user.uid);
      this.loadModules();
    } else {
      console.log('[App] User signed out');
      this.showAuthUI();
    }
  }

  showAuthUI() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="auth-container">
        <h1>Project73 v2</h1>
        <p>Clean. Modern. Modular.</p>
        <button id="sign-in-btn">Sign in with Google</button>
      </div>
    `;

    document.getElementById('sign-in-btn').addEventListener('click', () => {
      this.signIn();
    });
  }

  async signIn() {
    const { signInWithPopup, GoogleAuthProvider } = await import('./firebase.js');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('[App] Sign in error:', error);
    }
  }

  async loadModules() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="main-container">
        <nav id="nav"></nav>
        <main id="content"></main>
      </div>
    `;

    // TODO: Load modules dynamically
    console.log('[App] Modules loaded');
  }
}

// Start app
const app = new App();
app.init();
