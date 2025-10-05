# 📋 Menu Konfigurace - Project73 v2

## Jak změnit menu

Veškerá konfigurace menu je na **jednom místě**: `modules/navigation/navigation.js`

### Změna položek menu

Otevři soubor: **`modules/navigation/navigation.js`**

Na začátku souboru najdeš:

```javascript
// === KONFIGURACE MENU ===
// Zde se snadno mění všechny položky menu
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🚀', module: 'board' },
  { id: 'grid', label: 'Grid', icon: '📊', module: 'grid' },
  // ... další položky
];
```

### Přidání nové položky

```javascript
{
  id: 'novy-modul',           // unikátní ID
  label: 'Můj modul',          // text v menu
  icon: '✨',                  // emoji ikona
  module: 'novy-modul'         // ID modulu k načtení
}
```

### Změna pořadí

Prostě přesuň položky v poli nahoru/dolů:

```javascript
const menuItems = [
  { id: 'dashboard', ... },  // první
  { id: 'notes', ... },      // druhý
  { id: 'grid', ... },       // třetí
];
```

### Odstranění položky

Smaž celý řádek s položkou nebo ji zakomentuj:

```javascript
// { id: 'old-module', label: 'Starý modul', icon: '🗑️', module: 'old' },
```

## Design menu

### Barvy a gradient

Navigační lišta používá gradient. Změň v `modules/navigation/navigation.css`:

```css
#main-navigation {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Další barvy gradientu

```css
/* Modrá → Zelená */
background: linear-gradient(135deg, #1e3a8a 0%, #10b981 100%);

/* Oranžová → Růžová */
background: linear-gradient(135deg, #f59e0b 0%, #ec4899 100%);

/* Tmavá → Světlá */
background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
```

### Výška menu

```css
.nav-container {
  height: 64px;  /* změň zde */
}
```

## Struktura souborů

```
modules/navigation/
├── navigation.js    ← KONFIGURACE MENU (menuItems)
└── navigation.css   ← Styling (barvy, layout)
```

## Co dělat po změně

1. **Ulož soubor**
2. **Deploy**: `firebase deploy --only hosting:project73-v2`
3. **Refresh prohlížeč**

Hotovo! ✅
