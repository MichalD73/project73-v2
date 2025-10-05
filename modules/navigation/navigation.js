/**
 * Navigation Module - Project73 v2
 * Moderní top navigace s přihlášením
 *
 * MENU ITEMS CONFIG - změň zde pro úpravu menu:
 */

import { auth, signInWithPopup, GoogleAuthProvider, signOut } from '../../firebase.js';

// === KONFIGURACE MENU ===
// Zde se snadno mění všechny položky menu
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🚀', module: 'board' },
  { id: 'grid', label: 'Grid', icon: '📊', module: 'grid' },
  { id: 'notes', label: 'Poznámky', icon: '📝', module: 'notes' },
  { id: 'calendar', label: 'Kalendář', icon: '📅', module: 'calendar' },
  { id: 'assets', label: 'Assets', icon: '🎨', module: 'assets' },
  { id: 'gallery', label: 'Galerie', icon: '🖼️', module: 'gallery' },
  { id: 'banners', label: 'Banery', icon: '🎯', module: 'banners' },
  { id: 'mobile', label: 'Mobil', icon: '📱', module: 'mobile' },
  { id: 'deploy', label: 'Deploy', icon: '🚀', module: 'deploy' }
];

class NavigationModule {
  constructor() {
    this.currentUser = null;
    this.currentModule = 'board'; // default module
    this.onModuleChange = null; // callback for module switching
  }

  init(onModuleChange) {
    this.onModuleChange = onModuleChange;
    this.render();
    this.setupAuthListener();
  }

  render() {
    // Check if nav already exists
    let nav = document.getElementById('main-navigation');
    if (!nav) {
      nav = document.createElement('nav');
      nav.id = 'main-navigation';
      document.body.insertBefore(nav, document.body.firstChild);
    }

    nav.innerHTML = `
      <div class="nav-container">
        <!-- Logo / Brand -->
        <div class="nav-brand">
          <span class="brand-icon">⚡</span>
          <span class="brand-name">Project73</span>
          <span class="brand-version">v2</span>
        </div>

        <!-- Menu Items -->
        <div class="nav-menu" id="navMenu">
          ${menuItems.map(item => `
            <button
              class="nav-item ${item.id === this.currentModule ? 'active' : ''}"
              data-module="${item.module}"
              data-id="${item.id}">
              <span class="nav-icon">${item.icon}</span>
              <span class="nav-label">${item.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- User Section -->
        <div class="nav-user" id="navUser">
          <div class="user-loading">
            <span class="loading-spinner">⏳</span>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Menu item clicks
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const moduleId = e.currentTarget.dataset.module;
        const itemId = e.currentTarget.dataset.id;
        this.switchModule(itemId, moduleId);
      });
    });
  }

  switchModule(itemId, moduleId) {
    // Update active state
    this.setActiveModule(itemId);

    this.currentModule = itemId;

    // Call callback if provided
    if (this.onModuleChange) {
      this.onModuleChange(moduleId);
    }
  }

  setActiveModule(itemId) {
    // Update active state in navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-id="${itemId}"]`)?.classList.add('active');
  }

  syncWithURL(moduleId) {
    // Find menu item by module ID
    const menuItem = menuItems.find(item => item.module === moduleId);
    if (menuItem) {
      this.setActiveModule(menuItem.id);
      this.currentModule = menuItem.id;
    }
  }

  setupAuthListener() {
    auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      this.renderUserSection();
    });
  }

  renderUserSection() {
    const userSection = document.getElementById('navUser');
    if (!userSection) return;

    if (this.currentUser) {
      // User is signed in
      userSection.innerHTML = `
        <div class="user-info">
          <img
            src="${this.currentUser.photoURL}"
            alt="${this.currentUser.displayName}"
            class="user-avatar"
          >
          <div class="user-details">
            <div class="user-name">${this.currentUser.displayName}</div>
            <div class="user-email">${this.currentUser.email}</div>
          </div>
          <button class="btn-signout" id="btnSignOut" title="Odhlásit se">
            <span>🚪</span>
          </button>
        </div>
      `;

      document.getElementById('btnSignOut')?.addEventListener('click', () => this.handleSignOut());
    } else {
      // User is not signed in
      userSection.innerHTML = `
        <button class="btn-signin" id="btnSignIn">
          <span class="signin-icon">🔐</span>
          <span class="signin-text">Přihlásit se</span>
        </button>
      `;

      document.getElementById('btnSignIn')?.addEventListener('click', () => this.handleSignIn());
    }
  }

  async handleSignIn() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      console.log('[Nav] User signed in');
    } catch (error) {
      console.error('[Nav] Sign in error:', error);
      alert('Chyba při přihlášení: ' + error.message);
    }
  }

  async handleSignOut() {
    try {
      await signOut(auth);
      console.log('[Nav] User signed out');
    } catch (error) {
      console.error('[Nav] Sign out error:', error);
      alert('Chyba při odhlášení: ' + error.message);
    }
  }

  // Public API for updating active module from outside
  setActiveModule(itemId) {
    this.currentModule = itemId;
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-id="${itemId}"]`)?.classList.add('active');
  }
}

// Export singleton instance
const navigation = new NavigationModule();
export default navigation;
