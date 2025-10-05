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

  // Get container
  const container = document.getElementById('module-content');
  if (!container) return;

  // Render full UI structure immediately (skeleton UI)
  container.innerHTML = `
    <div id="notes-app" class="notes-app">
      <div class="notes-pane notes-pane--folders">
        <div class="notes-pane__header">
          <div class="notes-pane__brand">
            <div class="notes-pane__brand-title">Složky</div>
            <div class="notes-pane__brand-actions">
              <button class="notes-link notes-link--ghost" id="notes-layout-toggle-btn" title="Prohodit layout">⇄</button>
              <button class="notes-link notes-link--ghost" id="notes-folders-toggle-btn" title="Sbalit složky">◀</button>
            </div>
          </div>
        </div>
        <div class="notes-folder-tree" id="notes-folder-tree">
          <p style="padding: 1rem; color: #94a3b8; font-size: 0.875rem;">Načítám složky...</p>
        </div>
      </div>

      <div class="notes-pane notes-pane--list">
        <div class="notes-list-header">
          <div class="notes-list-header__titles">
            <h2 class="notes-list-title" id="notes-list-header-title">Poznámky</h2>
            <p class="notes-list-subtitle" id="notes-list-count-el">Načítám...</p>
          </div>
          <div class="notes-list-header__actions">
            <button class="notes-folders-toggle-inline" id="notes-folders-toggle-inline-btn">
              <span>📁</span>
              <span>Složky</span>
            </button>
            <button class="notes-link notes-link--ghost" id="notes-compact-toggle-btn" title="Kompaktní režim">☰</button>
            <button class="notes-link" id="notes-new-note-btn">+ Nová poznámka</button>
          </div>
        </div>
        <div class="notes-status" id="notes-status-el" style="display: none;"></div>
        <div class="notes-locked" id="notes-list-locked-el" style="display: none;">
          <p>🔒 Přihlas se pro zobrazení poznámek</p>
        </div>
        <div class="notes-empty" id="notes-list-empty-el">
          <p style="padding: 2rem; text-align: center; color: #94a3b8;">📝 Načítám poznámky...</p>
        </div>
        <ul class="notes-list" id="notes-list-el"></ul>
      </div>

      <div class="notes-pane notes-pane--editor">
        <div class="notes-detail-header">
          <div class="notes-detail-meta" id="notes-detail-meta-el">
            <button class="notes-detail-meta__toggle" id="notes-meta-toggle-btn" title="Info o poznámce">
              <span class="notes-detail-meta__toggle-icon">ℹ️</span>
            </button>
            <div class="notes-detail-meta__popover" id="notes-meta-popover-el" data-empty="true" style="display: none;"></div>
          </div>
          <div class="notes-detail-header__actions">
            <button class="notes-detail-btn notes-detail-btn--danger" id="notes-delete-note-btn" style="display: none;">
              <span>🗑️</span>
              <span>Smazat</span>
            </button>
          </div>
        </div>
        <div class="notes-detail-wrapper" id="notes-editor-wrapper-el">
          <div class="notes-detail-empty" id="notes-detail-meta-empty-el">
            <p>👈 Vyberte poznámku nebo vytvořte novou</p>
          </div>
          <form class="notes-detail-form" id="notes-detail-form-el" style="display: none;">
            <div class="notes-detail-editor">
              <div id="notes-editor-surface"></div>
            </div>
            <div class="notes-detail-footer">
              <button type="button" class="notes-detail-btn notes-detail-btn--secondary" id="notes-cancel-btn">Zrušit</button>
              <button type="submit" class="notes-detail-btn notes-detail-btn--primary" id="notes-save-btn">Uložit poznámku</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Add body class for styling
  document.body.classList.add('view-notes');

  // Wait for dependencies in background, then initialize
  waitForDependencies().then(() => {
    if (window.NotesApp && typeof window.NotesApp.init === 'function') {
      window.NotesApp.init();
    } else {
      console.error('NotesApp not available or init not found!');
    }
  }).catch(error => {
    console.error('Failed to load NotesApp:', error);
  });
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
