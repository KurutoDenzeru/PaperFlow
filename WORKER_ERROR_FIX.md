# 🆘 PDF Worker Error - Quick Fix Guide

## The Error You're Seeing

```
Warning: Error: Setting up fake worker failed: 
"Failed to fetch dynamically imported module: 
http://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.296/pdf.worker.min.js"
```

And/or on the canvas:
```
Error loading PDF
```

---

## 🎯 Root Cause

The PDF renderer (`react-pdf`) needs a helper file called the **PDF.js worker** to process PDFs. The app tried to load it from the internet (CDN), but failed. This could be due to:

1. **Network connectivity issue**
2. **Your firewall/proxy blocking CDN requests**
3. **The CDN being down or rate-limited**

---

## ✅ Quick Fix (2 Steps)

### **Step 1: Copy Worker File to Public Directory**

Run this command in your terminal:

```bash
mkdir -p public
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/
```

**What this does:**
- Creates a `public` folder (if it doesn't exist)
- Copies the PDF worker file from your dependencies
- Makes it available locally instead of relying on CDN

### **Step 2: Stop and Restart Dev Server**

```bash
# Stop the current server with Ctrl+C, then:
npm run dev
```

### **Step 3: Clear Browser Cache**

Press **Ctrl+Shift+Delete** (Windows/Mac: **Cmd+Shift+Delete**) to open cache clearing, then clear all cache.

---

## ✨ Test It

1. Open `http://localhost:5173` in your browser
2. Press **F12** to open console
3. Upload a PDF
4. Check console for these SUCCESS logs:

```
🔧 PDF.js Worker Setup:
   Version: 5.4.296
   Source: https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.js
   Fallbacks: ...

📤 File selected:
  name: "your-file.pdf"
  size: "X.XX MB"
  type: "application/pdf"

✅ PDF loaded successfully: X pages
```

---

## 📋 Verification Checklist

- [ ] `public/pdf.worker.min.js` file exists
- [ ] Dev server restarted with `npm run dev`
- [ ] Browser cache cleared
- [ ] No error in console ✅
- [ ] PDF uploads and displays ✅

---

## 🔍 If It Still Doesn't Work

### **Check 1: Verify File Was Copied**
```bash
ls -la public/pdf.worker.min.js
```

Should show file size ~4-5MB. If not found, the copy failed.

### **Check 2: Check Console Logs**
Open browser F12 → Console and look for these messages:

✅ Good:
```
🔧 PDF.js Worker Setup:
   Version: 5.4.296
   Source: https://cdn.jsdelivr.net/...
```

❌ Bad:
```
Warning: Error: Setting up fake worker failed...
```

### **Check 3: Verify Server is Serving It**
Visit this in your browser:
```
http://localhost:5173/pdf.worker.min.js
```

You should see JavaScript code, not an error page.

### **Check 4: Hard Refresh**
- Windows: `Ctrl+Shift+R`
- Mac: `Cmd+Shift+R`

This clears the browser cache completely.

---

## 🚀 Alternative: Use a Different CDN

If you don't want to use a local file, try changing the worker source. In `src/components/PdfViewer.tsx`, change this line:

```typescript
// From this:
pdfjs.GlobalWorkerOptions.workerSrc = workerSources[0];

// To this (unpkg CDN):
pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.js';
```

Sometimes different CDNs work better depending on your location/network.

---

## 💡 Why This Happens

- `react-pdf` uses **pdfjs-dist** library to render PDFs
- This library uses a **Web Worker** to process PDFs without blocking the main thread
- The worker file (`pdf.worker.min.js`) must be loaded from somewhere
- By default, it tries to load from CDN (internet)
- By copying it locally, we avoid relying on the internet

---

## 📦 For Production

When you build with `npm run build`, include the worker file:

```bash
npm run build
# The public/ folder files are automatically copied to dist/
# So dist/pdf.worker.min.js will exist in production
```

---

## 🎉 Success!

Once this is fixed:
- PDFs will upload and display instantly
- No more CDN errors
- Works offline (except network PDFs)
- Works in corporate networks
- Much faster loading

---

**Try the 3-step fix above and let me know if it works!** 🚀

If you still have issues, share:
1. The exact error from the console
2. Output of `ls -la public/pdf.worker.min.js`
3. What URL shows when you visit `http://localhost:5173/pdf.worker.min.js`
