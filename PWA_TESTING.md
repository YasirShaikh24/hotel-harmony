# PWA Testing Guide - Krishna Hotel

## Testing the Install Prompt

### First Visit Experience
1. Open the app in a browser (Chrome/Edge recommended)
2. Wait 3 seconds
3. A beautiful install prompt should appear with:
   - Krishna Hotel branding
   - List of benefits
   - "Install Now" button
   - "Maybe Later" button

### Prompt Behavior
- **Install Now**: Installs the app and never shows again
- **Maybe Later**: Dismisses for this session, shows again on next visit
- **X (Close)**: Permanently dismisses, won't show again

### Reset the Prompt (for testing)
```javascript
// Open browser console (F12) and run:
localStorage.removeItem('pwa-install-prompt-dismissed');
// Refresh the page
```

## Testing Installation

### Chrome/Edge (Desktop)
1. Look for install icon in address bar (⊕ or computer icon)
2. Click it or use Menu → Install Krishna Hotel
3. App opens in standalone window
4. Check Start Menu/Applications folder

### Chrome (Android)
1. Open in Chrome browser
2. Tap the install prompt or
3. Menu (⋮) → Add to Home screen
4. Icon appears on home screen
5. Opens fullscreen without browser UI

### Safari (iOS)
1. Open in Safari
2. Tap Share button (□↑)
3. Scroll and tap "Add to Home Screen"
4. Customize name if needed
5. Tap "Add"

### Edge (Windows)
1. Click install icon in address bar
2. Or Settings → Apps → Install Krishna Hotel
3. App appears in Start Menu
4. Can pin to taskbar

## Testing PWA Features

### 1. Standalone Mode
- App should open without browser address bar
- No browser tabs visible
- Full screen experience
- Custom title bar with app name

### 2. Offline Support
```bash
# Test offline functionality:
1. Install the app
2. Open DevTools (F12)
3. Go to Network tab
4. Check "Offline" checkbox
5. Refresh the app
6. Basic pages should still load
```

### 3. Service Worker
```bash
# Check service worker status:
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Service Workers"
4. Should see: /sw.js (activated and running)
```

### 4. Manifest
```bash
# Verify manifest:
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Manifest"
4. Check:
   - Name: Krishna Hotel Management System
   - Short name: Krishna Hotel
   - Theme color: #1e40af
   - Icons: 192x192 and 512x512
   - Display: standalone
```

### 5. Cache Storage
```bash
# Check cached files:
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Cache Storage"
4. Expand "krishna-hotel-v1"
5. Should see cached files
```

## Testing on Different Devices

### Desktop Browsers
- ✅ Chrome 90+ (Full support)
- ✅ Edge 90+ (Full support)
- ✅ Opera 76+ (Full support)
- ⚠️ Firefox (Limited - no install prompt)
- ⚠️ Safari (Limited - no install prompt)

### Mobile Browsers
- ✅ Chrome Android (Full support)
- ✅ Samsung Internet (Full support)
- ✅ Safari iOS 11.3+ (Add to Home Screen)
- ⚠️ Firefox Android (Limited)

### Operating Systems
- ✅ Windows 10/11
- ✅ macOS
- ✅ Linux
- ✅ Android 5.0+
- ✅ iOS 11.3+

## Common Issues & Solutions

### Issue: Install prompt doesn't appear
**Solutions:**
1. Check if already installed (look for app icon)
2. Clear browser cache and cookies
3. Make sure you're using HTTPS (or localhost)
4. Check console for errors (F12)
5. Try incognito/private mode

### Issue: Service worker not registering
**Solutions:**
1. Check browser console for errors
2. Verify `/sw.js` file exists in public folder
3. Make sure HTTPS is enabled
4. Clear service workers: DevTools → Application → Service Workers → Unregister

### Issue: Icons not showing
**Solutions:**
1. Verify icon files exist in `/public` folder:
   - favicon-96x96.png
   - web-app-manifest-192x192.png
   - web-app-manifest-512x512.png
   - apple-touch-icon.png
2. Check manifest.json has correct paths
3. Clear cache and reinstall

### Issue: App not working offline
**Solutions:**
1. Check service worker is active
2. Visit pages while online first (to cache them)
3. Check cache storage in DevTools
4. Update cache version in sw.js if needed

## Performance Testing

### Lighthouse Audit
```bash
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Click "Generate report"
5. Target score: 90+
```

### PWA Checklist
- ✅ Served over HTTPS
- ✅ Responsive design
- ✅ Works offline
- ✅ Installable
- ✅ Fast loading
- ✅ Custom splash screen
- ✅ Theme color
- ✅ Viewport meta tag

## Debugging Tools

### Chrome DevTools
```bash
# PWA debugging:
1. F12 → Application tab
2. Check:
   - Manifest
   - Service Workers
   - Cache Storage
   - Storage (localStorage)
```

### Remote Debugging (Mobile)
```bash
# Android:
1. Enable USB debugging on phone
2. Connect to computer
3. Chrome → chrome://inspect
4. Select your device

# iOS:
1. Enable Web Inspector on iPhone
2. Connect to Mac
3. Safari → Develop → [Your iPhone]
```

## Production Checklist

Before deploying:
- [ ] Test install prompt on multiple browsers
- [ ] Verify all icons are correct size and format
- [ ] Test offline functionality
- [ ] Check service worker is registered
- [ ] Run Lighthouse audit (score 90+)
- [ ] Test on real mobile devices
- [ ] Verify HTTPS is enabled
- [ ] Check manifest.json is accessible
- [ ] Test uninstall and reinstall
- [ ] Verify theme color matches design

## Useful Commands

```bash
# Clear all PWA data (browser console):
localStorage.clear();
sessionStorage.clear();
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));

# Force service worker update:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.update());
});

# Unregister service worker:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

## Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Can I Use PWA](https://caniuse.com/web-app-manifest)

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify all files are in correct locations
3. Test in incognito mode
4. Try different browser
5. Check HTTPS is enabled
