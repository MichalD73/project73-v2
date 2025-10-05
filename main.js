/**
 * Project73 v2 - Main Entry Point
 * Clean, modern, modular rewrite
 */

import { initFirebase, auth, onAuthStateChanged } from './firebase.js';
import navigation from './modules/navigation/navigation.js';

class App {
  constructor() {
    this.currentUser = null;
    this.currentModule = null;
  }

  async init() {
    console.log('[App] Initializing Project73 v2...');

    // Initialize Firebase
    await initFirebase();

    // Initialize navigation
    navigation.init((moduleId) => this.loadModule(moduleId));

    // Setup auth listener
    onAuthStateChanged(auth, (user) => {
      this.handleAuthChange(user);
    });
  }

  handleAuthChange(user) {
    this.currentUser = user;

    if (user) {
      console.log('[App] User signed in:', user.uid);
      // Load default module (Dashboard)
      this.loadModule('board');
    } else {
      console.log('[App] User signed out');
      // Still show app, but modules might be limited
      this.loadModule('board');
    }
  }

  async loadModule(moduleId) {
    console.log('[App] Loading module:', moduleId);
    this.currentModule = moduleId;

    // Clear app container
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading">Načítám...</div>';

    try {
      switch (moduleId) {
        case 'board':
          const { initBoard } = await import('./modules/board/board.js');
          initBoard();
          break;

        case 'deploy':
          const { initDeploy } = await import('./modules/deploy/deploy.js');
          initDeploy();
          break;

        case 'notes':
          const { initNotes } = await import('./modules/notes/notes.js');
          initNotes();
          break;

        case 'grid':
        case 'calendar':
        case 'assets':
        case 'gallery':
        case 'banners':
        case 'mobile':
          // Placeholder for future modules
          app.innerHTML = `
            <div style="padding: 3rem; text-align: center;">
              <h1 style="font-size: 3rem; margin-bottom: 1rem;">🚧</h1>
              <h2 style="color: #667eea; margin-bottom: 0.5rem;">Modul "${moduleId}"</h2>
              <p style="color: #5e6c84;">Tento modul bude implementován brzy...</p>
            </div>
          `;
          break;

        default:
          app.innerHTML = `
            <div style="padding: 3rem; text-align: center;">
              <h1 style="font-size: 3rem; margin-bottom: 1rem;">❓</h1>
              <h2 style="color: #eb5a46; margin-bottom: 0.5rem;">Neznámý modul</h2>
              <p style="color: #5e6c84;">Modul "${moduleId}" nebyl nalezen.</p>
            </div>
          `;
      }
    } catch (error) {
      console.error('[App] Error loading module:', error);
      app.innerHTML = `
        <div style="padding: 3rem; text-align: center;">
          <h1 style="font-size: 3rem; margin-bottom: 1rem;">⚠️</h1>
          <h2 style="color: #eb5a46; margin-bottom: 0.5rem;">Chyba při načítání</h2>
          <p style="color: #5e6c84;">${error.message}</p>
        </div>
      `;
    }
  }
}

// Start app
const app = new App();
app.init();
