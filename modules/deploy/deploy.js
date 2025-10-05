/**
 * Deploy & Versions Module - Project73 v2
 * Zobrazuje informace o verzích z GitHub a Firebase
 */

// GitHub API konfigurace
const GITHUB_REPO = 'MichalD73/project73-v2';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}`;

class DeployModule {
  constructor() {
    this.commits = [];
    this.repoInfo = null;
    this.loading = false;
  }

  async init() {
    console.log('[Deploy] Initializing...');
    this.render();
    await this.loadData();
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="deploy-container">
        <div class="deploy-header">
          <h1>🚀 Deploy & Versions</h1>
          <p>Přehled verzí a změn z GitHub</p>
        </div>

        <div class="deploy-grid">

          <!-- Current Version Card -->
          <div class="deploy-card">
            <div class="card-header">
              <span class="card-icon">📊</span>
              <h2>Aktuální Verze</h2>
            </div>
            <div class="version-info" id="versionInfo">
              <div class="loading-spinner">Načítám...</div>
            </div>
          </div>

          <!-- GitHub Commits Card -->
          <div class="deploy-card wide">
            <div class="card-header">
              <span class="card-icon">📝</span>
              <h2>Poslední Změny (GitHub)</h2>
              <button class="btn-refresh" id="btnRefresh">
                <span>🔄</span>
                <span>Obnovit</span>
              </button>
            </div>
            <div class="commits-list" id="commitsList">
              <div class="loading-spinner">Načítám commity...</div>
            </div>
          </div>

          <!-- Quick Links Card -->
          <div class="deploy-card">
            <div class="card-header">
              <span class="card-icon">🔗</span>
              <h2>Odkazy</h2>
            </div>
            <div class="quick-links">
              <a href="https://github.com/${GITHUB_REPO}" target="_blank" class="link-item">
                <span class="link-icon">📦</span>
                <div class="link-content">
                  <div class="link-title">GitHub Repository</div>
                  <div class="link-desc">Zobrazit zdrojový kód</div>
                </div>
              </a>
              <a href="https://github.com/${GITHUB_REPO}/commits/main" target="_blank" class="link-item">
                <span class="link-icon">📋</span>
                <div class="link-content">
                  <div class="link-title">Commit Historie</div>
                  <div class="link-desc">Všechny změny</div>
                </div>
              </a>
              <a href="https://console.firebase.google.com/project/central-asset-storage/hosting/sites/project73-v2" target="_blank" class="link-item">
                <span class="link-icon">🔥</span>
                <div class="link-content">
                  <div class="link-title">Firebase Console</div>
                  <div class="link-desc">Hosting & Deploy</div>
                </div>
              </a>
              <a href="https://project73-v2.web.app" target="_blank" class="link-item">
                <span class="link-icon">🌐</span>
                <div class="link-content">
                  <div class="link-title">Live Aplikace</div>
                  <div class="link-desc">project73-v2.web.app</div>
                </div>
              </a>
            </div>
          </div>

        </div>
      </div>
    `;

    // Event listeners
    document.getElementById('btnRefresh')?.addEventListener('click', () => this.loadData());
  }

  async loadData() {
    this.loading = true;
    await Promise.all([
      this.loadRepoInfo(),
      this.loadCommits()
    ]);
    this.loading = false;
  }

  async loadRepoInfo() {
    try {
      const response = await fetch(GITHUB_API);
      if (!response.ok) throw new Error('GitHub API error');

      this.repoInfo = await response.json();
      this.renderVersionInfo();
    } catch (error) {
      console.error('[Deploy] Error loading repo info:', error);
      this.renderVersionError();
    }
  }

  async loadCommits() {
    try {
      const response = await fetch(`${GITHUB_API}/commits?per_page=10`);
      if (!response.ok) throw new Error('GitHub API error');

      this.commits = await response.json();
      this.renderCommits();
    } catch (error) {
      console.error('[Deploy] Error loading commits:', error);
      this.renderCommitsError();
    }
  }

  renderVersionInfo() {
    const container = document.getElementById('versionInfo');
    if (!container || !this.repoInfo) return;

    const lastCommit = this.commits[0];
    const lastCommitSha = lastCommit ? lastCommit.sha.substring(0, 7) : 'N/A';
    const lastUpdate = lastCommit ? this.formatDate(lastCommit.commit.author.date) : 'N/A';

    container.innerHTML = `
      <div class="version-item">
        <div class="version-label">Poslední update</div>
        <div class="version-value">${lastUpdate}</div>
      </div>
      <div class="version-item">
        <div class="version-label">GitHub commit</div>
        <div class="version-value mono">${lastCommitSha}</div>
      </div>
      <div class="version-item">
        <div class="version-label">Branch</div>
        <div class="version-value">main</div>
      </div>
      <div class="version-item">
        <div class="version-label">Hosting</div>
        <div class="version-value">project73-v2.web.app</div>
      </div>
      <div class="version-item">
        <div class="version-label">Firebase projekt</div>
        <div class="version-value">central-asset-storage</div>
      </div>
    `;
  }

  renderVersionError() {
    const container = document.getElementById('versionInfo');
    if (!container) return;

    container.innerHTML = `
      <div class="error-message">
        ⚠️ Nepodařilo se načíst informace o verzi
      </div>
    `;
  }

  renderCommits() {
    const container = document.getElementById('commitsList');
    if (!container) return;

    if (this.commits.length === 0) {
      container.innerHTML = '<div class="empty-state">Žádné commity</div>';
      return;
    }

    container.innerHTML = this.commits.map(commit => {
      const message = commit.commit.message.split('\n')[0]; // First line only
      const author = commit.commit.author.name;
      const date = this.formatDate(commit.commit.author.date);
      const sha = commit.sha.substring(0, 7);
      const avatar = commit.author?.avatar_url || '';

      return `
        <div class="commit-item">
          ${avatar ? `<img src="${avatar}" class="commit-avatar" alt="${author}">` : ''}
          <div class="commit-content">
            <div class="commit-message">${this.escapeHtml(message)}</div>
            <div class="commit-meta">
              <span class="commit-author">${this.escapeHtml(author)}</span>
              <span class="commit-separator">•</span>
              <span class="commit-date">${date}</span>
              <span class="commit-separator">•</span>
              <a href="${commit.html_url}" target="_blank" class="commit-sha">${sha}</a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderCommitsError() {
    const container = document.getElementById('commitsList');
    if (!container) return;

    container.innerHTML = `
      <div class="error-message">
        ⚠️ Nepodařilo se načíst commity z GitHubu
      </div>
    `;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'právě teď';
    if (diffMins < 60) return `před ${diffMins} min`;
    if (diffHours < 24) return `před ${diffHours} h`;
    if (diffDays < 7) return `před ${diffDays} dny`;

    return date.toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export function initDeploy() {
  const deploy = new DeployModule();
  deploy.init();
}
