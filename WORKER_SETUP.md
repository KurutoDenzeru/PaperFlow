# 🔧 PDF.js Worker Configuration

## The Issue

When you load a PDF, you might see this error:

```
Warning: Error: Setting up fake worker failed: "Failed to fetch dynamically 
imported module: http://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.296/pdf.worker.min.js"
```

This happens because `react-pdf` needs a PDF.js **worker file** to process PDFs in a background thread. The app tries to load it from a CDN, which may fail due to:
- Network issues
- CORS restrictions
- CDN being down
- Firewall/corporate proxy blocking

---

## ✅ Current Setup (Attempted Solutions)

The app tries these CDN sources in order:

1. **Primary:** `https://cdn.jsdelivr.net/...` (Most reliable, global CDN)
2. **Fallback 1:** `https://unpkg.com/...` (Alternative CDN)
3. **Fallback 2:** `https://cdnjs.cloudflare.com/...` (Original)

---

## 🚀 Solution: Use Local Worker File

If CDNs don't work, use the worker file from your `node_modules`:

### **Step 1: Copy Worker File**

```bash
mkdir -p public
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/
```

### **Step 2: Update PdfViewer.tsx**

In `src/components/PdfViewer.tsx`, find the `setupPDFWorker()` function and replace it:

```typescript
// Replace the entire setupPDFWorker function with this:
const setupPDFWorker = (): void => {
  const pdfVersion = pdfjs.version;
  
  // Use local worker from public directory
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  console.log('🔧 PDF.js Worker Setup:');
  console.log(`   Version: ${pdfVersion}`);
  console.log(`   Source: /pdf.worker.min.js (local)`);
  console.log('   ✅ Using local worker file');
};
```

### **Step 3: Restart Dev Server**

```bash
npm run dev
```

---

## 📋 Verification Checklist

After making changes, check:

- [ ] `public/pdf.worker.min.js` exists
- [ ] `PdfViewer.tsx` is updated
- [ ] Dev server is restarted
- [ ] Browser cache is cleared (`Ctrl+Shift+Delete`)
- [ ] No errors in browser console (F12)
- [ ] PDF uploads and displays successfully

---

## 🔍 Verify Setup

Open browser console (F12) and check for:

**Should see:**
```
🔧 PDF.js Worker Setup:
   Version: 5.4.296
   Source: /pdf.worker.min.js (local)
   ✅ Using local worker file
```

**Not:**
```
Warning: Error: Setting up fake worker failed...
```

---

## 📦 Build for Production

When building with `npm run build`, the worker file will be included:

```bash
npm run build
# Verify dist/pdf.worker.min.js exists
```

The built app will serve the worker locally, so no CDN issues in production.

---

## 🔄 Comparison: CDN vs Local

| Aspect | CDN | Local |
|--------|-----|-------|
| **Setup** | No setup needed | Copy 1 file |
| **Reliability** | Depends on internet | Always works |
| **Performance** | ~100-300ms from CDN | ~10-50ms local |
| **Size** | Cached by browser | ~4-5 MB |
| **Corporate** | May be blocked | Always works |

---

## ⚠️ Troubleshooting

### Still Getting Worker Error?

1. **Check file exists:**
   ```bash
   ls -la public/pdf.worker.min.js
   ```

2. **Check console logs** (F12):
   - Look for the setup message
   - Should say `(local)` not CDN URL

3. **Hard refresh browser:**
   - `Ctrl + Shift + R` (Windows)
   - `Cmd + Shift + R` (Mac)

4. **Check server is serving the file:**
   - Visit `http://localhost:5173/pdf.worker.min.js` in browser
   - Should show PDF worker JavaScript code

### If You See Network Error in Console

This means the worker file isn't being loaded. Check:
- File exists in `public/` directory
- Dev server is running (`npm run dev`)
- No typos in the path `/pdf.worker.min.js`

---

## 📚 More Information

- [PDF.js Docs](https://mozilla.github.io/pdf.js/)
- [React-PDF Docs](https://reactpdf.org/)
- [pdfjs-dist on npm](https://www.npmjs.com/package/pdfjs-dist)

---

**Once this is set up, PDFs will load reliably without any CDN dependencies!** 🎉
