# Quick PWA Reference - Krishna Hotel

## 🚀 Install the App

### Desktop (Chrome/Edge)
1. Look for install icon (⊕) in address bar
2. Click "Install Krishna Hotel"
3. Done! App opens in its own window

### Mobile (Android)
1. Open in Chrome
2. Tap install prompt or Menu → "Add to Home screen"
3. App icon appears on home screen

### Mobile (iOS/Safari)
1. Tap Share button (□↑)
2. Scroll down → "Add to Home Screen"
3. Tap "Add"

## 🔄 Reset Install Prompt

```javascript
// Browser console (F12):
localStorage.removeItem('pwa-install-prompt-dismissed');
// Refresh page
```

## 🎨 Change Favicon

1. Generate at: https://favicon.io/favicon-generator/
2. Replace files in `/public/` folder:
   - `favicon-96x96.png`
   - `web-app-manifest-192x192.png`
   - `web-app-manifest-512x512.png`
   - `apple-touch-icon.png`
3. Clear cache (Ctrl+Shift+Delete)
4. Refresh

## 🧪 Test PWA

```bash
# Check service worker:
DevTools (F12) → Application → Service Workers

# Test offline:
DevTools → Network → Check "Offline" → Refresh

# Run audit:
DevTools → Lighthouse → Generate report
```

## 📱 Features

- ✅ Installable on all devices
- ✅ Works offline
- ✅ Fast loading (cached)
- ✅ Native app feel
- ✅ Auto-update

## 🐛 Quick Fixes

**Prompt not showing?**
→ Clear cache, try incognito mode

**Service worker error?**
→ Check `/public/sw.js` exists

**Icons missing?**
→ Verify files in `/public/` folder

## 📚 Full Guides

- Favicon: `FAVICON_GUIDE.md`
- Testing: `PWA_TESTING.md`
- Changes: `CHANGES_SUMMARY.md`

## 🎯 Theme Colors

- Primary: `#1e40af` (Blue)
- Accent: `#f59e0b` (Gold)
- Background: `#ffffff` (White)

---

**Krishna Hotel** - Professional Hotel Management System
