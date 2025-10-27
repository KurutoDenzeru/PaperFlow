# 🐛 Debugging Guide - PaperFlow PDF Editor

## Console Logging Overview

The application now includes **comprehensive console logging** to help debug PDF loading and processing issues. Open the browser console with **F12** to see detailed logs.

---

## 📊 What Gets Logged

### 1. **PDF.js Worker Setup** (On Page Load)
```
🔧 PDF.js Worker Setup:
   Version: 5.4.296
   Source: https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.js
   Fallbacks: https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.js | ...
```

### 2. **File Selection/Upload** 
#### When you upload via input:
```
📤 File selected:
  name: "document.pdf"
  size: "2.45 MB"
  type: "application/pdf"
  lastModified: "10/27/2025, 2:30:45 PM"

🔗 Object URL created: blob:http://localhost:5173/8f3c4e2a-1b5f-4a2c-9e1d-...
✅ File selected in PDFEditor:
  file: "document.pdf"
  size: "2.45 MB"
  url: "blob:..."
```

#### When you drag & drop:
```
📥 File dropped:
  name: "document.pdf"
  size: "2.45 MB"
  type: "application/pdf"
```

### 3. **PDF Loading**
#### Success:
```
✅ PDF loaded successfully: 15 pages
```

#### Failure:
```
❌ PDF Loading Error: {
  message: "Failed to fetch dynamically imported module: ...",
  name: "Error",
  stack: "Error: Failed to fetch..."
}
```

### 4. **Navigation & Interactions**
```
📄 Page changed: 3/15
🔍 Zoomed in: 100% → 120%
🔍 Zoomed out: 100% → 80%
🔄 Rotated: 0° → 90°
```

### 5. **Save/Download**
```
💾 Starting PDF save process...
   ArrayBuffer created: 2.45 MB
   PDF saved as blob: 2.45 MB
✅ PDF downloaded: document_edited.pdf
```

---

## ❌ Common Errors & Solutions

### **Error: "Failed to fetch dynamically imported module"**

**What it means:** The PDF.js worker file can't be loaded from the CDN.

**Causes & Solutions:**

1. **Network/CORS Issue**
   - Check internet connection
   - Try using a different browser
   - Check browser console for CORS errors
   - Try disabling browser extensions that block requests

2. **CDN Down or Blocked**
   - The app tries 3 CDNs in order:
     1. `cdn.jsdelivr.net` (primary)
     2. `unpkg.com` (fallback)
     3. `cdnjs.cloudflare.com` (fallback)
   - If all fail, you may need a local worker setup

3. **Firewall/Proxy**
   - Check if your network/firewall blocks CDN requests
   - Try from a different network
   - Contact your IT department if in an office

### **Solution: Use Local Worker**

Copy the worker file from node_modules:

```bash
mkdir -p public
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/
```

Then in `src/components/PdfViewer.tsx`, change:
```typescript
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
```

### **Error: "Error Loading PDF" on Canvas**

**What it means:** The worker loaded but the PDF can't be rendered.

**Causes & Solutions:**

1. **Corrupted PDF File**
   - Try a different PDF
   - Re-download the original
   - Check file size isn't 0 bytes

2. **Invalid PDF Format**
   - Some PDFs have non-standard formats
   - Try opening in Adobe Reader first
   - Check file extension is `.pdf`

3. **PDF is Password Protected**
   - The app doesn't support password-protected PDFs yet
   - Remove password first in Adobe Reader
   - Then re-export

---

## 🔍 How to Debug

### **Step 1: Open Browser Console**
- **Windows/Linux:** `Ctrl + Shift + J` or `F12`
- **Mac:** `Cmd + Option + J` or `F12`

### **Step 2: Check for Errors**
Look for messages starting with:
- ✅ = Success (good!)
- ⚠️ = Warning (investigate)
- ❌ = Error (problem!)

### **Step 3: Upload a PDF**
Watch the console as you upload. You should see:
```
📤 File selected: ...
🔗 Object URL created: ...
✅ File selected in PDFEditor: ...
✅ PDF loaded successfully: X pages
```

### **Step 4: If Errors Appear**
- Note the exact error message
- Check "Causes & Solutions" above
- Try the suggested fix
- Retry upload

---

## 📱 Console Commands (Advanced)

You can run these in the browser console to diagnose:

### **Check PDF.js Status**
```javascript
console.log(pdfjs);
console.log(pdfjs.version);
console.log(pdfjs.GlobalWorkerOptions.workerSrc);
```

### **Check Loaded Files**
```javascript
// List all blob URLs created
console.log(performance.getEntriesByType('resource')
  .filter(r => r.name.includes('blob')));
```

### **Check Network Errors**
```javascript
// In console, filter by "Failed" messages
// Look for any CDN requests that failed
```

---

## ✅ Expected Console Output (Success Case)

When everything works, you should see something like:

```
🔧 PDF.js Worker Setup:
   Version: 5.4.296
   Source: https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.js
   Fallbacks: https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.js | ...

[User uploads PDF]

📤 File selected:
  name: "document.pdf"
  size: "2.45 MB"
  type: "application/pdf"
  lastModified: "10/27/2025, 2:30:45 PM"

🔗 Object URL created: blob:http://localhost:5173/8f3c4e2a-1b5f-4a2c-9e1d-...

✅ File selected in PDFEditor:
  file: "document.pdf"
  size: "2.45 MB"
  url: "blob:..."

✅ PDF loaded successfully: 15 pages

[User navigates]

📄 Page changed: 2/15
🔍 Zoomed in: 100% → 120%
```

---

## 🚨 If Nothing Works

1. **Take a Screenshot** of the error message
2. **Copy the console error** (right-click → Copy)
3. **Try these steps:**
   - Clear browser cache: `Ctrl+Shift+Delete`
   - Close and reopen browser
   - Try a different browser
   - Use a different PDF file
   - Restart the dev server: `npm run dev`

4. **Check GitHub Issues:** Search for similar errors
5. **Enable Local Worker** (see solution above)

---

## 📝 Logging Locations

| Component | What's Logged |
|-----------|---------------|
| `PdfViewer.tsx` | Worker setup, PDF load success/error, page navigation, zoom, rotation |
| `FileUpload.tsx` | File selection, drag-drop, file validation |
| `PDFEditor.tsx` | File selection confirmation, PDF save/download |

Each log includes timestamps (automatically by browser console).

---

**Still having issues? Open the browser console, take a screenshot, and share the error messages!** 🤝
