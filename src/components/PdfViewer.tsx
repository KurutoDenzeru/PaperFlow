import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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

  const handleDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      onNumPagesChange?.(numPages);
    },
    [onNumPagesChange]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (numPages && page >= 1 && page <= numPages) {
        setCurrentPage(page);
        onPageChange?.(page);
      }
    },
    [numPages, onPageChange]
  );

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

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
          <div className="bg-white shadow-lg" style={{ transform: `rotate(${rotation}deg)` }}>
            <Document
              file={fileUrl}
              onLoadSuccess={handleDocumentLoadSuccess}
              loading={<div className="p-8">Loading PDF...</div>}
              error={<div className="p-8 text-red-600">Error loading PDF</div>}
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                loading={<div className="p-8">Loading page...</div>}
              />
            </Document>
          </div>
        ) : (
          <div className="text-gray-400 text-center p-8">
            No PDF loaded
          </div>
        )}
      </div>
    </div>
  );
};
