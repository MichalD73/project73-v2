# Project73 v2

**Clean. Modern. Modular.**

Complete rewrite of Project73 application with focus on:
- ✅ Clean, maintainable code
- ✅ Modular architecture
- ✅ Modern ES6+ JavaScript
- ✅ Shared Firebase data with v1

## Structure

```
Project73-v2/
├── index.html           # Main HTML
├── main.js              # App entry point
├── firebase.js          # Firebase config
├── style.css            # Global styles
├── modules/
│   ├── workspace/       # Workspace module
│   ├── editor/          # Rich text editor module
│   ├── board/           # Board/Grid module
│   └── collections/     # Collections module
└── public/              # Build output
```

## Firebase

**Project:** central-asset-storage
**Site:** project73-v2
**URL:** https://project73-v2.web.app

**Shared collections with v1:**
- `project73-notes`
- `project73-sessions`
- `project73-workspace2-5`
- `project73_workspace_setups`

## Development

```bash
# Run local server
python3 -m http.server 8000

# Deploy
firebase deploy --only hosting:project73-v2
```

## Modules

Each module is self-contained with:
- `module-name.js` - Logic
- `module-name.css` - Styles
- `module-name.html` - Template (if needed)

## Philosophy

**Old app (v1):**
- 6400 lines in one file
- Messy, hard to maintain
- Lots of legacy code

**New app (v2):**
- Max 500 lines per file
- Clean, modular
- Only what we need

---

**Created:** 2025-10-05
**Author:** Michal + Claude
