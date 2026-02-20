# Krishna Hotel - Favicon & Logo Guide

## Current Favicon Files

Your app currently uses these favicon files (visible in the `/public` folder):
- `favicon-96x96.png` (96x96 pixels)
- `web-app-manifest-192x192.png` (192x192 pixels)
- `web-app-manifest-512x512.png` (512x512 pixels)
- `apple-touch-icon.png` (180x180 pixels)
- `favicon.ico` (for browser tabs)

## How to Generate Custom Krishna Hotel Favicons

### Option 1: Favicon.io (Recommended - Free & Easy)

1. Visit: https://favicon.io/favicon-generator/
2. Configure your favicon:
   - **Text**: "KH" or "कृष्ण"
   - **Background**: #1e40af (Blue - matches your theme)
   - **Font Color**: #ffffff (White)
   - **Font Family**: Choose a professional font like "Roboto" or "Poppins"
   - **Font Size**: 80-90
   - **Shape**: Square or Rounded
3. Click "Download" to get all sizes
4. Replace the files in the `/public` folder

### Option 2: RealFaviconGenerator (Advanced)

1. Visit: https://realfavicongenerator.net/
2. Upload a logo image (512x512 PNG recommended)
3. Customize for different platforms:
   - iOS: Add padding and background color
   - Android: Choose theme color (#1e40af)
   - Windows: Select tile color
4. Generate and download
5. Replace files in `/public` folder

### Option 3: Canva (Custom Logo Design)

1. Visit: https://www.canva.com/create/logos/
2. Search for "hotel logo" templates
3. Customize with:
   - Text: "Krishna Hotel" or "कृष्ण होटल"
   - Colors: Blue (#1e40af), Gold (#f59e0b)
   - Add hotel/building icon
4. Export as PNG:
   - 512x512 pixels (high quality)
   - Transparent background
5. Use Favicon.io to convert to all sizes

### Option 4: AI Logo Generators

**LogoAI**: https://www.logoai.com/
- Enter "Krishna Hotel"
- Select hotel/hospitality industry
- Choose blue color scheme
- Download high-resolution PNG

**Looka**: https://looka.com/
- Similar process to LogoAI
- More customization options
- Free preview, paid download

## Design Recommendations

### Colors
- **Primary**: #1e40af (Blue) - Trust, professionalism
- **Accent**: #f59e0b (Gold) - Luxury, premium
- **Text**: #ffffff (White) - Clean, readable

### Symbols to Consider
- 🏨 Hotel building
- 🛏️ Bed icon
- 🔑 Key symbol
- ॐ Om symbol (for Krishna theme)
- Peacock feather (Krishna's symbol)

### Typography
- Modern sans-serif fonts: Roboto, Poppins, Inter
- Traditional fonts: Playfair Display, Merriweather
- Indian fonts: Noto Sans Devanagari (for Hindi text)

## File Naming Convention

After generating, rename your files to match:
```
favicon-96x96.png          → 96x96 pixels
web-app-manifest-192x192.png → 192x192 pixels
web-app-manifest-512x512.png → 512x512 pixels
apple-touch-icon.png       → 180x180 pixels
favicon.ico                → 16x16, 32x32, 48x48 (multi-size)
```

## Quick Steps to Replace

1. Generate your favicons using any method above
2. Download the files
3. Rename them according to the convention
4. Replace files in `/public` folder
5. Clear browser cache (Ctrl+Shift+Delete)
6. Refresh your app

## Testing Your Favicons

1. **Browser Tab**: Check if favicon appears in browser tab
2. **Bookmarks**: Bookmark the page and check icon
3. **Mobile Home Screen**: Install PWA and check home screen icon
4. **PWA Install Prompt**: The icon should appear in the install dialog

## Current PWA Configuration

Your app is configured as a Progressive Web App with:
- ✅ Install prompt (shows after 3 seconds)
- ✅ Offline support
- ✅ Standalone mode (looks like native app)
- ✅ Theme color: #1e40af (blue)
- ✅ Works on all devices

## Need Help?

If you need custom logo design:
- Hire on Fiverr: https://www.fiverr.com/categories/graphics-design/creative-logo-design
- Hire on Upwork: https://www.upwork.com/freelance-jobs/logo-design/
- Use 99designs: https://99designs.com/logo-design

Budget: $5-$50 for basic logo design
