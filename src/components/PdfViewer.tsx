import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker with fallback URLs and detailed logging
const setupPDFWorker = (): void => {
  const pdfVersion = pdfjs.version;
  
  // Multiple worker source options with fallbacks
  const workerSources = [
    // Option 1: CDN jsdelivr (most reliable)
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.js`,
    // Option 2: CDN unpkg
    `https://unpkg.com/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.js`,
    // Option 3: CloudFlare CDN
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfVersion}/pdf.worker.min.js`,
  ];

  // Use the primary CDN source
  pdfjs.GlobalWorkerOptions.workerSrc = workerSources[0];
  console.log('🔧 PDF.js Worker Setup:');
  console.log(`   Version: ${pdfVersion}`);
  console.log(`   Source: ${workerSources[0]}`);
  console.log(`   Fallbacks: ${workerSources.slice(1).join(' | ')}`);
};

// Initialize worker on module load
setupPDFWorker();

interface PDFViewerProps {
  fileUrl: string;
  onNumPagesChange?: (pages: number) => void;
  onPageChange?: (page: number) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  onNumPagesChange,
  onPageChange,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      console.log(`✅ PDF loaded successfully: ${numPages} pages`);
      setNumPages(numPages);
      setError(null);
      onNumPagesChange?.(numPages);
    },
    [onNumPagesChange]
  );

  const handleDocumentLoadError = useCallback(
    (error: Error) => {
      console.error('❌ PDF Loading Error:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      setError(`Failed to load PDF: ${error.message}`);
    },
    []
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (numPages && page >= 1 && page <= numPages) {
        console.log(`📄 Page changed: ${page}/${numPages}`);
        setCurrentPage(page);
        onPageChange?.(page);
      }
    },
    [numPages, onPageChange]
  );

  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.2, 2);
    console.log(`🔍 Zoomed in: ${Math.round(scale * 100)}% → ${Math.round(newScale * 100)}%`);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.2, 0.5);
    console.log(`🔍 Zoomed out: ${Math.round(scale * 100)}% → ${Math.round(newScale * 100)}%`);
    setScale(newScale);
  };

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    console.log(`🔄 Rotated: ${rotation}° → ${newRotation}°`);
    setRotation(newRotation);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max={numPages || 1}
              value={currentPage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePageChange(parseInt(e.target.value) || 1)}
              className="w-16 text-center"
            />
            <span className="text-sm text-gray-600">
              of {numPages || '—'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!numPages || currentPage >= numPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 min-w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 2}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-200" />

          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Document */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4">
        {fileUrl ? (
          <>
            {error && (
              <div className="absolute top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm shadow-lg">
                <p className="text-red-800 text-sm font-semibold">❌ PDF Error</p>
                <p className="text-red-700 text-xs mt-1">{error}</p>
                <p className="text-red-600 text-xs mt-2">Check browser console (F12) for more details</p>
              </div>
            )}
            <div className="bg-white shadow-lg" style={{ transform: `rotate(${rotation}deg)` }}>
              <Document
                file={fileUrl}
                onLoadSuccess={handleDocumentLoadSuccess}
                onError={handleDocumentLoadError}
                loading={<div className="p-8 text-gray-600">📄 Loading PDF...</div>}
                error={
                  <div className="p-8 text-red-600 bg-red-50 rounded border border-red-200">
                    <p className="font-semibold mb-2">❌ Error Loading PDF</p>
                    <p className="text-sm">Failed to load the PDF document. Check the browser console for details.</p>
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  loading={<div className="p-8 text-gray-500">⏳ Rendering page...</div>}
                  error={
                    <div className="p-8 text-red-600">
                      ❌ Error rendering page
                    </div>
                  }
                />
              </Document>
            </div>
          </>
        ) : (
          <div className="text-gray-400 text-center p-8">
            No PDF loaded
          </div>
        )}
      </div>
    </div>
  );
};
