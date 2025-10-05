/**
 * Dashboard Module - Project73 v2
 * Kompletní Dashboard s AI Projects a Kanban board
 */

import {
  db,
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  storage,
  ref,
  uploadBytes,
  getDownloadURL
} from '../../firebase.js';

// AI Projects data
const aiProjects = [
  {
    title: "DAY73-Cloud Setup",
    status: "completed",
    description: "Kompletní setup vývojové verze s Git, GitHub, Firebase deploy automation",
    links: [
      { label: "GitHub", url: "https://github.com/MichalD73/DAY73-cloud" },
      { label: "Live", url: "https://onlineday73.web.app/DAY73-cloud/grid-app-test.html" }
    ]
  },
  {
    title: "Manuál stránka",
    status: "completed",
    description: "Interaktivní manuál s přehledem projektu, workflow, moduly a dokumentací",
    links: [
      { label: "Manual", url: "https://onlineday73.web.app/DAY73-cloud/manual.html" }
    ]
  },
  {
    title: "Dashboard",
    status: "completed",
    description: "Dashboard s AI Projects view a My Kanban board integrovaný jako view",
    links: []
  },
  {
    title: "Firebase Setup Notes",
    status: "note",
    description: "Dokumentace Firebase napojení a troubleshooting",
    links: [
      { label: "📄 Přečíst Dokumentaci", url: "FIREBASE-SETUP.md" }
    ]
  },
  {
    title: "Domény & Deploy Setup",
    status: "note",
    description: "Hosting, domény, deploy proces a troubleshooting",
    links: [
      { label: "📄 Přečíst Dokumentaci", url: "DOMAINS-DEPLOY.md" }
    ]
  },
  {
    title: "Dashboard Architecture",
    status: "note",
    description: "Struktura Dashboard, refaktoring na sdílený kód (single source of truth)",
    links: [
      { label: "📄 Přečíst Dokumentaci", url: "DASHBOARD-ARCHITECTURE.md" }
    ]
  },
  {
    title: "Notes Refactoring",
    status: "completed",
    description: "Poznámky 2 - refaktoring na single source of truth + standalone s Auth UI",
    links: [
      { label: "📄 Dokumentace", url: "NOTES-REFACTORING.md" },
      { label: "🔗 Standalone", url: "https://onlineday73.web.app/DAY73-cloud/notes.html" },
      { label: "🔗 Integrované", url: "https://onlineday73.web.app/DAY73-cloud/grid-app-test.html?view=notes" }
    ]
  },
  {
    title: "Komunikační Pattern",
    status: "note",
    description: "Standardizovaný formát pro hlášení dokončené práce - strukturované, proklikové odkazy, jasné informace",
    links: [
      { label: "📄 Přečíst Pattern", url: "COMMUNICATION-PATTERN.md" }
    ]
  },
  {
    title: "Archivační Pattern",
    status: "note",
    description: "Bezpečná archivace starého kódu před smazáním - _archive/ složka, README.txt, kdy smazat, jak obnovit",
    links: [
      { label: "📄 Přečíst Pattern", url: "ARCHIVE-PATTERN.md" }
    ]
  },
  {
    title: "Git Workflow & Doporučení",
    status: "note",
    description: "Současný Git/GitHub backup setup, workflow dokumentace, tiered doporučení na vylepšení (Level 1-3)",
    links: [
      { label: "📄 Přečíst Dokumentaci", url: "GIT-WORKFLOW.md" }
    ]
  },
  {
    title: "Navigation Overflow Menu",
    status: "completed",
    description: "Dropdown menu pro dlouhou navigaci - automaticky skryje položky co se nevejdou do 'Další' dropdown (Chrome bookmarks style)",
    links: [
      { label: "🔗 Live", url: "https://onlineday73.web.app/DAY73-cloud/grid-app-test.html" }
    ]
  },
  {
    title: "Deployment Checklist & Lessons Learned",
    status: "critical",
    description: "KRITICKÁ dokumentace deployment procesu - co dělat VŽDY, co NIKDY nedělat, lessons learned z chyb, pre-deployment checklist",
    links: [
      { label: "🚨 POVINNÉ - Přečíst", url: "DEPLOYMENT-CHECKLIST.md" },
      { label: "📄 Claude Instructions (updated)", url: "CLAUDE-INSTRUCTIONS.md" }
    ]
  },
  {
    title: "AI Confusion Prevention",
    status: "completed",
    description: "Kompletní úklid workspace - archivace starých složek (DAY73/, dist/DAY73/), dokumentace všech složek v .DO-NOT-EDIT-THESE-FOLDERS.md",
    links: [
      { label: "📄 Folder Guide", url: ".DO-NOT-EDIT-THESE-FOLDERS.md" },
      { label: "📦 Archiv", url: "_ARCHIVE_old-versions_20251005/README.md" }
    ]
  },
  {
    title: "Project73 v2",
    status: "in-progress",
    description: "Nová, čistá aplikace od začátku - kompletně oddělená od staré aplikace, moderní ES6+ architektura",
    links: [
      { label: "GitHub", url: "https://github.com/MichalD73/project73-v2" },
      { label: "Live", url: "https://project73-v2.web.app" }
    ]
  }
];

class DashboardModule {
  constructor() {
    this.kanbanCards = [];
    this.currentEditingCard = null;
    this.currentDetailCardId = null;
    this.draggedCard = null;
  }

  init() {
    console.log('[Dashboard] Initializing...');
    this.render();
    this.renderAIProjects();
    this.loadKanbanCards();
    this.setupPasteHandler();
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="upload-indicator" id="uploadIndicator">📤 Nahrávám obrázek...</div>

      <div class="dashboard-container">
        <div class="dashboard-header">
          <h1>🚀 Project73 Dashboard</h1>
          <p>Přehled projektů a úkolů</p>
        </div>

        <div class="dashboard-grid">

          <!-- AI Projects Section -->
          <div class="dashboard-section">
            <div class="section-header">
              <span class="section-icon">🤖</span>
              <h2>AI Projects</h2>
            </div>

            <div class="project-list" id="aiProjectsList">
              <!-- Projects will be loaded here -->
            </div>
          </div>

          <!-- My Kanban Section -->
          <div class="dashboard-section">
            <div class="section-header">
              <span class="section-icon">👤</span>
              <h2>My Kanban</h2>
            </div>

            <div class="kanban-board">

              <!-- TODO Column -->
              <div class="kanban-column" data-status="todo">
                <div class="kanban-column-header">
                  <div class="kanban-column-title">
                    📌 TODO
                    <span class="kanban-column-count" id="todoCount">0</span>
                  </div>
                </div>
                <div class="kanban-cards" id="todoCards" data-column="todo"></div>
                <button class="kanban-add-card" id="addTodoCard">
                  + Přidat kartu
                </button>
              </div>

              <!-- DOING Column -->
              <div class="kanban-column" data-status="doing">
                <div class="kanban-column-header">
                  <div class="kanban-column-title">
                    🔥 DOING
                    <span class="kanban-column-count" id="doingCount">0</span>
                  </div>
                </div>
                <div class="kanban-cards" id="doingCards" data-column="doing"></div>
                <button class="kanban-add-card" id="addDoingCard">
                  + Přidat kartu
                </button>
              </div>

              <!-- DONE Column -->
              <div class="kanban-column" data-status="done">
                <div class="kanban-column-header">
                  <div class="kanban-column-title">
                    ✅ DONE
                    <span class="kanban-column-count" id="doneCount">0</span>
                  </div>
                </div>
                <div class="kanban-cards" id="doneCards" data-column="done"></div>
                <button class="kanban-add-card" id="addDoneCard">
                  + Přidat kartu
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      <!-- Card Detail Panel -->
      <div class="card-detail-overlay" id="cardDetailOverlay"></div>
      <div class="card-detail-panel" id="cardDetailPanel">
        <div class="card-detail-header">
          <input type="text" id="cardDetailTitle" class="card-detail-title-input" placeholder="Název karty">
          <button id="closeCardDetail" class="btn-close">✕</button>
        </div>
        <div class="card-detail-body">
          <div id="cardDetailEditor" contenteditable="true"></div>
        </div>
      </div>
    `;

    // Add event listeners
    document.getElementById('addTodoCard').addEventListener('click', () => this.showAddCardForm('todo'));
    document.getElementById('addDoingCard').addEventListener('click', () => this.showAddCardForm('doing'));
    document.getElementById('addDoneCard').addEventListener('click', () => this.showAddCardForm('done'));
    document.getElementById('closeCardDetail').addEventListener('click', () => this.closeCardDetail());
    document.getElementById('cardDetailOverlay').addEventListener('click', () => this.closeCardDetail());
  }

  renderAIProjects() {
    const container = document.getElementById('aiProjectsList');
    if (!container) return;

    container.innerHTML = aiProjects.map(project => {
      let statusText = '🔄 Probíhá';
      if (project.status === 'completed') statusText = '✅ Hotovo';
      if (project.status === 'note') statusText = '📝 Poznámka';
      if (project.status === 'critical') statusText = '🚨 Kritické';

      return `
        <div class="project-card ${project.status}">
          <div class="project-title">
            ${project.title}
            <span class="project-status ${project.status}">
              ${statusText}
            </span>
          </div>
          <div class="project-desc">${project.description}</div>
          ${project.links.length > 0 ? `
            <div class="project-links">
              ${project.links.map(link => `
                <a href="${link.url}" target="_blank" class="project-link">${link.label}</a>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  async loadKanbanCards() {
    try {
      const cardsQuery = query(collection(db, 'kanban-cards'), orderBy('createdAt', 'desc'));

      onSnapshot(cardsQuery, (snapshot) => {
        this.kanbanCards = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (!data.archived) {
            this.kanbanCards.push({ id: doc.id, ...data });
          }
        });
        this.renderKanban();
      });
    } catch (error) {
      console.error('[Dashboard] Error loading cards:', error);
    }
  }

  renderKanban() {
    ['todo', 'doing', 'done'].forEach(status => {
      const container = document.getElementById(`${status}Cards`);
      if (!container) return;

      const statusCards = this.kanbanCards.filter(c => c.status === status);

      container.innerHTML = statusCards.map(card => `
        <div class="kanban-card"
             draggable="true"
             tabindex="0"
             data-id="${card.id}">
          <div class="kanban-card-title">${card.title}</div>
          ${card.imageUrl ? `
            <img src="${card.imageUrl}"
                 class="kanban-card-image"
                 alt="${card.title}">
          ` : `
            <div class="kanban-card-image-placeholder">
              📷 Ctrl+V pro vložení obrázku
            </div>
          `}
          <div class="kanban-card-desc">${card.description || ''}</div>
        </div>
      `).join('');

      // Update count
      const countEl = document.getElementById(`${status}Count`);
      if (countEl) {
        countEl.textContent = statusCards.length;
      }

      // Add event listeners to cards
      container.querySelectorAll('.kanban-card').forEach(cardEl => {
        const cardId = cardEl.dataset.id;

        cardEl.addEventListener('dblclick', () => this.openCardDetail(cardId));
        cardEl.addEventListener('dragstart', (e) => this.handleDragStart(e));
        cardEl.addEventListener('dragend', (e) => this.handleDragEnd(e));
        cardEl.addEventListener('keydown', (e) => this.handleCardKeydown(e, cardId));

        const imgPlaceholder = cardEl.querySelector('.kanban-card-image-placeholder, .kanban-card-image');
        if (imgPlaceholder) {
          imgPlaceholder.addEventListener('click', () => this.focusCard(cardId));
        }
      });
    });

    this.setupDragAndDrop();
  }

  showAddCardForm(status) {
    const container = document.getElementById(`${status}Cards`);
    if (!container) return;

    // Remove existing forms
    document.querySelectorAll('.card-form').forEach(form => form.remove());

    const formHtml = `
      <div class="card-form">
        <input type="text"
               id="newCardTitle"
               placeholder="Název karty..."
               autofocus>
        <textarea id="newCardDesc"
                  placeholder="Popis (volitelné)..."></textarea>
        <div class="card-form-buttons">
          <button class="btn btn-primary" id="confirmAddCard" data-status="${status}">
            Přidat kartu
          </button>
          <button class="btn btn-secondary" id="cancelAddCard">
            Zrušit
          </button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', formHtml);

    const titleInput = document.getElementById('newCardTitle');
    titleInput.focus();

    document.getElementById('confirmAddCard').addEventListener('click', () => this.addCard(status));
    document.getElementById('cancelAddCard').addEventListener('click', () => this.cancelCardForm());
  }

  async addCard(status) {
    const title = document.getElementById('newCardTitle')?.value.trim();
    const description = document.getElementById('newCardDesc')?.value.trim();

    if (!title) {
      alert('Zadej název karty');
      return;
    }

    try {
      await addDoc(collection(db, 'kanban-cards'), {
        title,
        description,
        status,
        imageUrl: null,
        createdAt: serverTimestamp()
      });

      this.cancelCardForm();
    } catch (error) {
      console.error('[Dashboard] Error adding card:', error);
      alert('Chyba při vytváření karty: ' + error.message);
    }
  }

  cancelCardForm() {
    document.querySelectorAll('.card-form').forEach(form => form.remove());
  }

  handleDragStart(e) {
    this.draggedCard = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
  }

  handleDragEnd(e) {
    e.target.classList.remove('dragging');
  }

  setupDragAndDrop() {
    const columns = document.querySelectorAll('.kanban-cards');

    columns.forEach(column => {
      column.addEventListener('dragover', (e) => this.handleDragOver(e));
      column.addEventListener('drop', (e) => this.handleDrop(e));
    });
  }

  handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
  }

  async handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    if (!this.draggedCard) return false;

    const newStatus = e.currentTarget.dataset.column;
    const cardId = this.draggedCard.dataset.id;

    try {
      await updateDoc(doc(db, 'kanban-cards', cardId), {
        status: newStatus
      });
    } catch (error) {
      console.error('[Dashboard] Error updating card:', error);
    }

    return false;
  }

  focusCard(cardId) {
    this.currentEditingCard = cardId;
    console.log('[Dashboard] Ready to paste image for card:', cardId);
  }

  setupPasteHandler() {
    document.addEventListener('paste', async (e) => {
      if (!this.currentEditingCard) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();

          const blob = item.getAsFile();
          await this.uploadCardImage(this.currentEditingCard, blob);
          break;
        }
      }
    });
  }

  async uploadCardImage(cardId, blob) {
    const indicator = document.getElementById('uploadIndicator');
    if (indicator) {
      indicator.classList.add('active');
    }

    try {
      const storageRef = ref(storage, `kanban-images/${cardId}-${Date.now()}.png`);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'kanban-cards', cardId), {
        imageUrl: downloadURL
      });

      this.currentEditingCard = null;
    } catch (error) {
      console.error('[Dashboard] Error uploading image:', error);
      alert('Chyba při nahrávání obrázku: ' + error.message);
    } finally {
      if (indicator) {
        indicator.classList.remove('active');
      }
    }
  }

  async handleCardKeydown(e, cardId) {
    if (e.key === 'Backspace' || e.key === 'Delete' || e.keyCode === 8 || e.keyCode === 46) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      e.preventDefault();
      await this.archiveCard(cardId);
    }
  }

  async archiveCard(cardId) {
    try {
      await updateDoc(doc(db, 'kanban-cards', cardId), {
        archived: true,
        archivedAt: new Date()
      });
      console.log('[Dashboard] Card archived:', cardId);
    } catch (error) {
      console.error('[Dashboard] Error archiving card:', error);
      alert('Chyba při archivaci karty: ' + error.message);
    }
  }

  openCardDetail(cardId) {
    const card = this.kanbanCards.find(c => c.id === cardId);
    if (!card) return;

    this.currentDetailCardId = cardId;

    const titleInput = document.getElementById('cardDetailTitle');
    titleInput.value = card.title;

    titleInput.oninput = this.debounce(() => this.saveCardTitle(cardId), 1000);

    const editor = document.getElementById('cardDetailEditor');
    editor.innerHTML = card.body || '<p>Začni psát...</p>';

    document.getElementById('cardDetailOverlay').classList.add('active');
    document.getElementById('cardDetailPanel').classList.add('active');

    setTimeout(() => editor.focus(), 300);

    editor.oninput = this.debounce(() => this.saveCardBody(cardId), 1000);

    editor.onpaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = item.getAsFile();

          const indicator = document.getElementById('uploadIndicator');
          if (indicator) indicator.classList.add('active');

          try {
            const storageRef = ref(storage, `card-body-images/${cardId}-${Date.now()}.png`);
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);

            const img = document.createElement('img');
            img.src = downloadURL;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.margin = '0.5rem 0';

            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              range.insertNode(img);
              range.collapse(false);
            } else {
              editor.appendChild(img);
            }

            await this.saveCardBody(cardId);
          } catch (error) {
            console.error('[Dashboard] Error uploading image:', error);
            alert('Chyba při nahrávání obrázku: ' + error.message);
          } finally {
            if (indicator) indicator.classList.remove('active');
          }
          break;
        }
      }
    };
  }

  closeCardDetail() {
    if (this.currentDetailCardId) {
      this.saveCardTitle(this.currentDetailCardId);
      this.saveCardBody(this.currentDetailCardId);
    }

    document.getElementById('cardDetailOverlay').classList.remove('active');
    document.getElementById('cardDetailPanel').classList.remove('active');
    this.currentDetailCardId = null;
  }

  async saveCardTitle(cardId) {
    const titleInput = document.getElementById('cardDetailTitle');
    const title = titleInput?.value.trim();

    if (!title) return;

    try {
      await updateDoc(doc(db, 'kanban-cards', cardId), {
        title: title
      });
      console.log('[Dashboard] Card title saved');
    } catch (error) {
      console.error('[Dashboard] Error saving card title:', error);
    }
  }

  async saveCardBody(cardId) {
    const editor = document.getElementById('cardDetailEditor');
    const body = editor?.innerHTML;

    try {
      await updateDoc(doc(db, 'kanban-cards', cardId), {
        body: body
      });
      console.log('[Dashboard] Card body saved');
    } catch (error) {
      console.error('[Dashboard] Error saving card body:', error);
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

export function initBoard() {
  const dashboard = new DashboardModule();
  dashboard.init();
}
