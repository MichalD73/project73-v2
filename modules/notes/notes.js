// Notes Module for Project73 v2
import { db, auth, storage } from '../../firebase.js';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  writeBatch,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// === KONFIGURACE ===
const COLLECTION_ROOT = 'project73-notes';
const FOLDER_COLLECTION = 'folders';
const NOTE_COLLECTION = 'items';
const DEFAULT_FOLDER_NAME = 'Inbox';
const MAX_NOTES = 400;
const AUTO_SAVE_DELAY_MS = 2500;
const NOTE_IMAGE_STORAGE_ROOT = 'project73_notes';

const DETAIL_MODE = {
  IDLE: 'idle',
  CREATING: 'creating',
  EDITING: 'editing'
};

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link', 'code-block', 'image'],
  ['clean']
];

const STORAGE_KEYS = {
  COMPACT: 'p73_notes_compact_enabled',
  FOLDERS: 'p73_notes_folders_collapsed',
  LAYOUT: 'p73_notes_layout_flipped'
};

const SESSION_KEYS = {
  FOLDER: 'p73_notes_active_folder',
  NOTE: 'p73_notes_active_note'
};

class NotesModule {
  constructor() {
    // State
    this.currentUser = null;
    this.folders = [];
    this.notesCache = [];
    this.currentFolderId = null;
    this.defaultFolderId = null;
    this.currentNoteId = null;
    this.detailMode = DETAIL_MODE.IDLE;

    // Editor
    this.quill = null;
    this.editorDirty = false;
    this.autoSaveTimer = null;
    this.lastSavedDeltaJson = null;
    this.suppressEditorChange = false;

    // UI State
    this.expandedFolders = new Set();
    this.foldersCollapsed = false;
    this.compactMode = false;
    this.layoutFlipped = false;
    this.metaOpen = false;

    // Unsubscribers
    this.authUnsubscribe = null;
    this.folderUnsubscribe = null;
    this.notesUnsubscribe = null;

    // DOM Elements
    this.elements = {};
  }

  async init() {
    console.log('🗒️  Initializing Notes Module...');

    // Load saved preferences
    this.loadPreferences();

    // Render UI
    this.renderUI();

    // Wait for Quill to load from CDN
    await this.waitForQuill();

    // Initialize Quill editor
    this.initializeQuill();

    // Attach event listeners
    this.attachEventListeners();

    // Start auth listener
    this.authUnsubscribe = onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        this.loadFolders();
      } else {
        this.cleanup();
      }
    });
  }

  async waitForQuill() {
    let attempts = 0;
    while (!window.Quill && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    if (!window.Quill) {
      throw new Error('Quill failed to load from CDN');
    }
  }

  loadPreferences() {
    try {
      this.compactMode = localStorage.getItem(STORAGE_KEYS.COMPACT) === 'true';
      this.foldersCollapsed = localStorage.getItem(STORAGE_KEYS.FOLDERS) === 'true';
      this.layoutFlipped = localStorage.getItem(STORAGE_KEYS.LAYOUT) === 'true';

      this.currentFolderId = sessionStorage.getItem(SESSION_KEYS.FOLDER);
      this.currentNoteId = sessionStorage.getItem(SESSION_KEYS.NOTE);
    } catch (e) {
      console.warn('Failed to load preferences:', e);
    }
  }

  savePreferences() {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPACT, this.compactMode);
      localStorage.setItem(STORAGE_KEYS.FOLDERS, this.foldersCollapsed);
      localStorage.setItem(STORAGE_KEYS.LAYOUT, this.layoutFlipped);

      if (this.currentFolderId) {
        sessionStorage.setItem(SESSION_KEYS.FOLDER, this.currentFolderId);
      }
      if (this.currentNoteId) {
        sessionStorage.setItem(SESSION_KEYS.NOTE, this.currentNoteId);
      }
    } catch (e) {
      console.warn('Failed to save preferences:', e);
    }
  }

  renderUI() {
    const container = document.getElementById('module-content');
    if (!container) return;

    container.innerHTML = `
      <div class="notes-container ${this.compactMode ? 'compact-mode' : ''} ${this.layoutFlipped ? 'layout-flipped' : ''}">

        <!-- Folder Sidebar -->
        <div class="notes-sidebar ${this.foldersCollapsed ? 'collapsed' : ''}">
          <div class="sidebar-header">
            <button class="btn-icon" id="toggleFoldersBtn" title="Sbalit/rozbalit složky">
              <span class="icon">${this.foldersCollapsed ? '▶' : '◀'}</span>
            </button>
            <h3>Složky</h3>
            <button class="btn-icon" id="addFolderBtn" title="Přidat složku">
              <span class="icon">+</span>
            </button>
          </div>
          <div class="folder-tree" id="folderTree">
            <!-- Folders will be rendered here -->
          </div>
        </div>

        <!-- Notes List -->
        <div class="notes-list-panel">
          <div class="list-header">
            <h3 id="listHeaderTitle">Poznámky</h3>
            <div class="list-header-actions">
              <span class="note-count" id="noteCount">0</span>
              <button class="btn-icon" id="compactToggleBtn" title="Kompaktní zobrazení">
                <span class="icon">☰</span>
              </button>
              <button class="btn-icon" id="layoutToggleBtn" title="Přepnout layout">
                <span class="icon">⇄</span>
              </button>
              <button class="btn-primary" id="newNoteBtn">+ Nová poznámka</button>
            </div>
          </div>
          <div class="notes-list" id="notesList">
            <div class="notes-empty" id="notesEmpty">
              <p>📝 Žádné poznámky</p>
              <p class="text-muted">Vytvořte novou poznámku pomocí tlačítka výše</p>
            </div>
          </div>
        </div>

        <!-- Note Editor -->
        <div class="notes-editor-panel">
          <div class="editor-header">
            <div class="editor-status" id="editorStatus">
              <span class="status-text">Připraveno</span>
            </div>
            <div class="editor-actions">
              <button class="btn-icon" id="deleteNoteBtn" title="Smazat poznámku" style="display: none;">
                <span class="icon">🗑️</span>
              </button>
              <button class="btn-icon" id="metaToggleBtn" title="Info o poznámce">
                <span class="icon">ℹ️</span>
              </button>
            </div>
          </div>

          <div class="editor-meta" id="editorMeta" style="display: none;">
            <div class="meta-content" id="metaContent">
              <!-- Metadata will be shown here -->
            </div>
          </div>

          <div class="editor-wrapper" id="editorWrapper">
            <div class="editor-empty" id="editorEmpty">
              <p>👈 Vyberte poznámku nebo vytvořte novou</p>
            </div>
            <div class="editor-surface" id="editorSurface" style="display: none;">
              <div id="quillEditor"></div>
            </div>
          </div>
        </div>

      </div>
    `;

    // Store element references
    this.elements = {
      folderTree: document.getElementById('folderTree'),
      toggleFoldersBtn: document.getElementById('toggleFoldersBtn'),
      addFolderBtn: document.getElementById('addFolderBtn'),
      listHeaderTitle: document.getElementById('listHeaderTitle'),
      noteCount: document.getElementById('noteCount'),
      compactToggleBtn: document.getElementById('compactToggleBtn'),
      layoutToggleBtn: document.getElementById('layoutToggleBtn'),
      newNoteBtn: document.getElementById('newNoteBtn'),
      notesList: document.getElementById('notesList'),
      notesEmpty: document.getElementById('notesEmpty'),
      editorStatus: document.getElementById('editorStatus'),
      deleteNoteBtn: document.getElementById('deleteNoteBtn'),
      metaToggleBtn: document.getElementById('metaToggleBtn'),
      editorMeta: document.getElementById('editorMeta'),
      metaContent: document.getElementById('metaContent'),
      editorWrapper: document.getElementById('editorWrapper'),
      editorEmpty: document.getElementById('editorEmpty'),
      editorSurface: document.getElementById('editorSurface'),
      quillEditor: document.getElementById('quillEditor')
    };
  }

  initializeQuill() {
    if (!window.Quill) {
      console.error('Quill is not loaded!');
      return;
    }

    this.quill = new Quill(this.elements.quillEditor, {
      theme: 'snow',
      modules: {
        toolbar: TOOLBAR_OPTIONS
      },
      placeholder: 'Začněte psát...'
    });

    // Handle text changes with auto-save
    this.quill.on('text-change', () => {
      if (this.suppressEditorChange) return;

      this.editorDirty = true;
      this.updateStatus('Neuloženo');

      // Clear existing timer
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer);
      }

      // Set new auto-save timer
      this.autoSaveTimer = setTimeout(() => {
        this.autoSaveNote();
      }, AUTO_SAVE_DELAY_MS);
    });

    // Handle image uploads
    const toolbar = this.quill.getModule('toolbar');
    toolbar.addHandler('image', () => this.handleImageUpload());
  }

  attachEventListeners() {
    // Folder actions
    this.elements.toggleFoldersBtn.addEventListener('click', () => this.toggleFoldersCollapse());
    this.elements.addFolderBtn.addEventListener('click', () => this.createFolder());

    // List actions
    this.elements.newNoteBtn.addEventListener('click', () => this.createNote());
    this.elements.compactToggleBtn.addEventListener('click', () => this.toggleCompactMode());
    this.elements.layoutToggleBtn.addEventListener('click', () => this.toggleLayout());

    // Editor actions
    this.elements.deleteNoteBtn.addEventListener('click', () => this.deleteCurrentNote());
    this.elements.metaToggleBtn.addEventListener('click', () => this.toggleMeta());
  }

  // === FOLDER MANAGEMENT ===

  async loadFolders() {
    if (!this.currentUser) return;

    const foldersRef = collection(db, COLLECTION_ROOT, FOLDER_COLLECTION, this.currentUser.uid);
    const q = query(foldersRef, orderBy('createdAt', 'asc'));

    this.folderUnsubscribe = onSnapshot(q, async (snapshot) => {
      this.folders = [];
      snapshot.forEach(doc => {
        this.folders.push({ id: doc.id, ...doc.data() });
      });

      // Ensure default folder exists
      if (this.folders.length === 0) {
        await this.createDefaultFolder();
      } else {
        this.defaultFolderId = this.folders.find(f => f.name === DEFAULT_FOLDER_NAME)?.id || this.folders[0].id;

        // Select folder
        if (!this.currentFolderId || !this.folders.find(f => f.id === this.currentFolderId)) {
          this.currentFolderId = this.defaultFolderId;
        }

        this.renderFolders();
        this.loadNotes();
      }
    });
  }

  async createDefaultFolder() {
    if (!this.currentUser) return;

    const foldersRef = collection(db, COLLECTION_ROOT, FOLDER_COLLECTION, this.currentUser.uid);
    const newFolder = {
      name: DEFAULT_FOLDER_NAME,
      parentId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await addDoc(foldersRef, newFolder);
  }

  async createFolder(parentId = null) {
    const name = prompt('Název složky:', 'Nová složka');
    if (!name || !name.trim()) return;

    const foldersRef = collection(db, COLLECTION_ROOT, FOLDER_COLLECTION, this.currentUser.uid);
    const newFolder = {
      name: name.trim(),
      parentId: parentId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await addDoc(foldersRef, newFolder);
  }

  async deleteFolder(folderId) {
    if (!confirm('Opravdu smazat složku? Poznámky zůstanou zachovány.')) return;

    const folderRef = doc(db, COLLECTION_ROOT, FOLDER_COLLECTION, this.currentUser.uid, folderId);
    await deleteDoc(folderRef);

    if (this.currentFolderId === folderId) {
      this.currentFolderId = this.defaultFolderId;
      this.loadNotes();
    }
  }

  selectFolder(folderId) {
    this.currentFolderId = folderId;
    this.currentNoteId = null;
    this.savePreferences();
    this.loadNotes();
    this.renderFolders();
    this.clearEditor();
  }

  renderFolders() {
    if (!this.elements.folderTree) return;

    const rootFolders = this.folders.filter(f => !f.parentId);

    let html = '<div class="folder-list">';
    rootFolders.forEach(folder => {
      html += this.renderFolderItem(folder);
    });
    html += '</div>';

    this.elements.folderTree.innerHTML = html;

    // Attach folder click handlers
    this.elements.folderTree.querySelectorAll('.folder-item').forEach(el => {
      const folderId = el.dataset.folderId;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectFolder(folderId);
      });
    });
  }

  renderFolderItem(folder) {
    const isActive = folder.id === this.currentFolderId;
    const childFolders = this.folders.filter(f => f.parentId === folder.id);
    const hasChildren = childFolders.length > 0;
    const isExpanded = this.expandedFolders.has(folder.id);

    let html = `
      <div class="folder-item ${isActive ? 'active' : ''}" data-folder-id="${folder.id}">
        <span class="folder-icon">📁</span>
        <span class="folder-name">${folder.name}</span>
      </div>
    `;

    if (hasChildren && isExpanded) {
      html += '<div class="folder-children">';
      childFolders.forEach(child => {
        html += this.renderFolderItem(child);
      });
      html += '</div>';
    }

    return html;
  }

  // === NOTE MANAGEMENT ===

  async loadNotes() {
    if (!this.currentUser || !this.currentFolderId) return;

    if (this.notesUnsubscribe) {
      this.notesUnsubscribe();
    }

    const notesRef = collection(db, COLLECTION_ROOT, NOTE_COLLECTION, this.currentUser.uid);
    const q = query(
      notesRef,
      where('folderId', '==', this.currentFolderId),
      orderBy('updatedAt', 'desc')
    );

    this.notesUnsubscribe = onSnapshot(q, (snapshot) => {
      this.notesCache = [];
      snapshot.forEach(doc => {
        this.notesCache.push({ id: doc.id, ...doc.data() });
      });

      this.renderNotes();

      // Auto-select note if needed
      if (this.currentNoteId) {
        const note = this.notesCache.find(n => n.id === this.currentNoteId);
        if (note) {
          this.loadNoteIntoEditor(note);
        } else {
          this.currentNoteId = null;
          this.clearEditor();
        }
      }
    });
  }

  async createNote() {
    if (!this.currentUser || !this.currentFolderId) return;

    const notesRef = collection(db, COLLECTION_ROOT, NOTE_COLLECTION, this.currentUser.uid);

    const newNote = {
      folderId: this.currentFolderId,
      content: { ops: [{ insert: '\n' }] }, // Empty Quill delta
      plainText: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(notesRef, newNote);
    this.currentNoteId = docRef.id;
    this.savePreferences();

    // Load into editor
    const note = { id: docRef.id, ...newNote };
    this.loadNoteIntoEditor(note);

    // Focus editor
    this.quill.focus();
  }

  async deleteCurrentNote() {
    if (!this.currentNoteId || !confirm('Opravdu smazat poznámku?')) return;

    const noteRef = doc(db, COLLECTION_ROOT, NOTE_COLLECTION, this.currentUser.uid, this.currentNoteId);
    await deleteDoc(noteRef);

    this.currentNoteId = null;
    this.clearEditor();
  }

  selectNote(noteId) {
    this.currentNoteId = noteId;
    this.savePreferences();

    const note = this.notesCache.find(n => n.id === noteId);
    if (note) {
      this.loadNoteIntoEditor(note);
    }
  }

  loadNoteIntoEditor(note) {
    if (!this.quill) return;

    this.suppressEditorChange = true;

    // Load content
    if (note.content && note.content.ops) {
      this.quill.setContents(note.content);
      this.lastSavedDeltaJson = JSON.stringify(note.content);
    } else {
      this.quill.setText('');
      this.lastSavedDeltaJson = JSON.stringify({ ops: [{ insert: '\n' }] });
    }

    this.editorDirty = false;
    this.suppressEditorChange = false;

    // Show editor
    this.elements.editorEmpty.style.display = 'none';
    this.elements.editorSurface.style.display = 'block';
    this.elements.deleteNoteBtn.style.display = 'block';

    this.updateStatus('Připraveno');
    this.renderNotes(); // Re-render to highlight
  }

  clearEditor() {
    if (!this.quill) return;

    this.suppressEditorChange = true;
    this.quill.setText('');
    this.suppressEditorChange = false;

    this.currentNoteId = null;
    this.editorDirty = false;
    this.lastSavedDeltaJson = null;

    this.elements.editorEmpty.style.display = 'block';
    this.elements.editorSurface.style.display = 'none';
    this.elements.deleteNoteBtn.style.display = 'none';
    this.elements.editorMeta.style.display = 'none';

    this.updateStatus('Připraveno');
    this.renderNotes();
  }

  async autoSaveNote() {
    if (!this.currentNoteId || !this.editorDirty || !this.quill) return;

    const delta = this.quill.getContents();
    const deltaJson = JSON.stringify(delta);

    // Check if actually changed
    if (deltaJson === this.lastSavedDeltaJson) {
      this.editorDirty = false;
      return;
    }

    this.updateStatus('Ukládám...');

    try {
      const noteRef = doc(db, COLLECTION_ROOT, NOTE_COLLECTION, this.currentUser.uid, this.currentNoteId);
      await updateDoc(noteRef, {
        content: delta,
        plainText: this.quill.getText().trim(),
        updatedAt: serverTimestamp()
      });

      this.lastSavedDeltaJson = deltaJson;
      this.editorDirty = false;
      this.updateStatus('Uloženo');
    } catch (error) {
      console.error('Auto-save failed:', error);
      this.updateStatus('Chyba při ukládání');
    }
  }

  renderNotes() {
    const folder = this.folders.find(f => f.id === this.currentFolderId);
    if (folder) {
      this.elements.listHeaderTitle.textContent = folder.name;
    }

    this.elements.noteCount.textContent = this.notesCache.length;

    if (this.notesCache.length === 0) {
      this.elements.notesEmpty.style.display = 'block';
      return;
    }

    this.elements.notesEmpty.style.display = 'none';

    let html = '';
    this.notesCache.forEach(note => {
      const isActive = note.id === this.currentNoteId;
      const preview = note.plainText?.substring(0, 100) || 'Prázdná poznámka';
      const date = note.updatedAt?.toDate ? this.formatDate(note.updatedAt.toDate()) : '';

      html += `
        <div class="note-item ${isActive ? 'active' : ''}" data-note-id="${note.id}">
          <div class="note-preview">${preview}</div>
          <div class="note-date">${date}</div>
        </div>
      `;
    });

    this.elements.notesList.innerHTML = html;

    // Attach click handlers
    this.elements.notesList.querySelectorAll('.note-item').forEach(el => {
      el.addEventListener('click', () => {
        this.selectNote(el.dataset.noteId);
      });
    });
  }

  // === IMAGE UPLOAD ===

  async handleImageUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      this.updateStatus('Nahrávám obrázek...');

      try {
        // Upload to Firebase Storage
        const fileName = `${Date.now()}_${file.name}`;
        const path = `${NOTE_IMAGE_STORAGE_ROOT}/${this.currentUser.uid}/${fileName}`;
        const fileRef = storageRef(storage, path);

        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);

        // Insert into editor
        const range = this.quill.getSelection(true);
        this.quill.insertEmbed(range.index, 'image', url);
        this.quill.setSelection(range.index + 1);

        this.updateStatus('Obrázek nahrán');
      } catch (error) {
        console.error('Image upload failed:', error);
        this.updateStatus('Chyba při nahrávání');
      }
    };

    input.click();
  }

  // === UI TOGGLES ===

  toggleFoldersCollapse() {
    this.foldersCollapsed = !this.foldersCollapsed;
    this.savePreferences();

    const sidebar = document.querySelector('.notes-sidebar');
    sidebar.classList.toggle('collapsed', this.foldersCollapsed);

    this.elements.toggleFoldersBtn.querySelector('.icon').textContent = this.foldersCollapsed ? '▶' : '◀';
  }

  toggleCompactMode() {
    this.compactMode = !this.compactMode;
    this.savePreferences();

    const container = document.querySelector('.notes-container');
    container.classList.toggle('compact-mode', this.compactMode);
  }

  toggleLayout() {
    this.layoutFlipped = !this.layoutFlipped;
    this.savePreferences();

    const container = document.querySelector('.notes-container');
    container.classList.toggle('layout-flipped', this.layoutFlipped);
  }

  toggleMeta() {
    this.metaOpen = !this.metaOpen;
    this.elements.editorMeta.style.display = this.metaOpen ? 'block' : 'none';

    if (this.metaOpen && this.currentNoteId) {
      const note = this.notesCache.find(n => n.id === this.currentNoteId);
      if (note) {
        const created = note.createdAt?.toDate ? note.createdAt.toDate().toLocaleString('cs-CZ') : 'N/A';
        const updated = note.updatedAt?.toDate ? note.updatedAt.toDate().toLocaleString('cs-CZ') : 'N/A';

        this.elements.metaContent.innerHTML = `
          <div class="meta-row"><strong>Vytvořeno:</strong> ${created}</div>
          <div class="meta-row"><strong>Upraveno:</strong> ${updated}</div>
          <div class="meta-row"><strong>Počet znaků:</strong> ${note.plainText?.length || 0}</div>
        `;
      }
    }
  }

  // === HELPERS ===

  updateStatus(text) {
    this.elements.editorStatus.querySelector('.status-text').textContent = text;
  }

  formatDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Právě teď';
    if (diffMins < 60) return `před ${diffMins} min`;
    if (diffHours < 24) return `před ${diffHours} h`;
    if (diffDays < 7) return `před ${diffDays} d`;

    return date.toLocaleDateString('cs-CZ');
  }

  cleanup() {
    if (this.authUnsubscribe) this.authUnsubscribe();
    if (this.folderUnsubscribe) this.folderUnsubscribe();
    if (this.notesUnsubscribe) this.notesUnsubscribe();
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
  }
}

// Initialize and export
let notesInstance = null;

export function initNotes() {
  if (notesInstance) {
    notesInstance.cleanup();
  }

  notesInstance = new NotesModule();
  notesInstance.init();
}
