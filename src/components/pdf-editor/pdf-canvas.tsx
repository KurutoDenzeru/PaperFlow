import { useRef, useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Tool, Annotation, Point } from '@/types/pdf';

// Set worker for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFCanvasProps {
  file: File | null;
  currentPage: number;
  numPages: number;
  scale: number;
  rotation: number;
  currentTool: Tool;
  annotations: Annotation[];
  onAnnotationAdd: (annotation: Omit<Annotation, 'id'>) => void;
  onAnnotationUpdate: (id: string, updates: Partial<Annotation>) => void;
  onAnnotationSelect: (id: string | null) => void;
  selectedAnnotationId: string | null;
  onPageChange: (page: number) => void;
  onNumPagesChange: (numPages: number) => void;
  currentColor: string;
  strokeWidth: number;
}

export function PDFCanvas({
  file,
  currentPage,
  numPages,
  scale,
  rotation,
  currentTool,
  annotations,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationSelect,
  selectedAnnotationId,
  onPageChange,
  onNumPagesChange,
  currentColor,
  strokeWidth,
}: PDFCanvasProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefsMap = useRef<Record<number, HTMLDivElement | null>>({});
  const isScrollingProgrammaticallyRef = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Create URL from file when file changes
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      console.log('PDFCanvas: Created file URL:', url);
      setFileUrl(url);
      return () => {
        console.log('PDFCanvas: Revoking file URL');
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  // Scroll to the current page when it changes
  useEffect(() => {
    const pageElement = pageRefsMap.current[currentPage];
    if (pageElement && scrollContainerRef.current) {
      isScrollingProgrammaticallyRef.current = true;
      // Instant scroll for better responsiveness when clicking
      pageElement.scrollIntoView({ behavior: 'instant', block: 'center' });
      // Reset flag after scroll completes
      setTimeout(() => {
        isScrollingProgrammaticallyRef.current = false;
      }, 200);
    }
  }, [currentPage]);

  // Intersection Observer to detect which page is in view and update pagination
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Don't update if we're programmatically scrolling
        if (isScrollingProgrammaticallyRef.current) return;

        // Find the page that is most visible in the viewport
        let mostVisiblePage: number | null = null;
        let maxVisibility = 0;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const visibility = entry.intersectionRatio;
            if (visibility > maxVisibility) {
              maxVisibility = visibility;
              const pageNum = parseInt(entry.target.getAttribute('data-page-num') || '0', 10);
              if (pageNum > 0) {
                mostVisiblePage = pageNum;
              }
            }
          }
        });

        // Update the current page if we found a visible page
        if (mostVisiblePage !== null) {
          onPageChange(mostVisiblePage);
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.5, // Page must be 50% visible to be considered "current"
      }
    );

    // Observe all pages
    Object.values(pageRefsMap.current).forEach((pageRef) => {
      if (pageRef) observer.observe(pageRef);
    });

    return () => {
      observer.disconnect();
    };
  }, [numPages, onPageChange]);

  const getRelativePosition = useCallback((e: React.MouseEvent): Point => {
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentTool === 'select') return;

    const point = getRelativePosition(e);
    setIsDrawing(true);
    setStartPoint(point);

    if (currentTool === 'pen') {
      setCurrentPoints([point]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;

    if (currentTool === 'pen') {
      const point = getRelativePosition(e);
      setCurrentPoints(prev => [...prev, point]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) {
      // If not drawing, we're in select mode or just clicked
      return;
    }

    const endPoint = getRelativePosition(e);

    const annotation: Omit<Annotation, 'id'> = {
      type: currentTool,
      pageNumber: currentPage,
      position: startPoint,
      color: currentColor,
      strokeWidth,
      opacity: currentTool === 'highlight' ? 0.3 : 1,
    };

    switch (currentTool) {
      case 'text':
        annotation.text = 'Double click to edit';
        annotation.fontSize = 16;
        annotation.fontFamily = 'Arial';
        break;
      case 'rectangle':
      case 'circle':
      case 'highlight':
        annotation.width = Math.abs(endPoint.x - startPoint.x);
        annotation.height = Math.abs(endPoint.y - startPoint.y);
        annotation.position = {
          x: Math.min(startPoint.x, endPoint.x),
          y: Math.min(startPoint.y, endPoint.y),
        };
        break;
      case 'line':
      case 'arrow':
        annotation.endPoint = endPoint;
        break;
      case 'pen':
        annotation.points = currentPoints;
        break;
    }

    onAnnotationAdd(annotation);
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoints([]);
  };

  const renderAnnotation = (annotation: Annotation) => {
    const isSelected = annotation.id === selectedAnnotationId;
    const commonProps = {
      key: annotation.id,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onAnnotationSelect(annotation.id);
      },
      style: {
        cursor: currentTool === 'select' ? 'move' : 'default',
      },
      className: `absolute ${isSelected ? 'ring-2 ring-primary' : ''}`,
    };

    switch (annotation.type) {
      case 'text':
        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              left: annotation.position.x,
              top: annotation.position.y,
              color: annotation.color,
              fontSize: annotation.fontSize,
              fontFamily: annotation.fontFamily,
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              const newText = prompt('Edit text:', annotation.text);
              if (newText !== null) {
                onAnnotationUpdate(annotation.id, { text: newText });
              }
            }}
          >
            {annotation.text}
          </div>
        );

      case 'rectangle':
      case 'highlight':
        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              left: annotation.position.x,
              top: annotation.position.y,
              width: annotation.width,
              height: annotation.height,
              backgroundColor: annotation.color,
              opacity: annotation.opacity,
              border: annotation.type === 'rectangle' ? `${annotation.strokeWidth}px solid ${annotation.color}` : 'none',
            }}
          />
        );

      case 'circle':
        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              left: annotation.position.x,
              top: annotation.position.y,
              width: annotation.width,
              height: annotation.height,
              border: `${annotation.strokeWidth}px solid ${annotation.color}`,
              borderRadius: '50%',
            }}
          />
        );

      case 'line':
      case 'arrow':
        if (!annotation.endPoint) return null;
        const length = Math.sqrt(
          Math.pow(annotation.endPoint.x - annotation.position.x, 2) +
          Math.pow(annotation.endPoint.y - annotation.position.y, 2)
        );
        const angle = Math.atan2(
          annotation.endPoint.y - annotation.position.y,
          annotation.endPoint.x - annotation.position.x
        ) * (180 / Math.PI);

        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              left: annotation.position.x,
              top: annotation.position.y,
              width: length,
              height: annotation.strokeWidth,
              backgroundColor: annotation.color,
              transformOrigin: '0 50%',
              transform: `rotate(${angle}deg)`,
            }}
          >
            {annotation.type === 'arrow' && (
              <div
                style={{
                  position: 'absolute',
                  right: -10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: `10px solid ${annotation.color}`,
                  borderTop: '5px solid transparent',
                  borderBottom: '5px solid transparent',
                }}
              />
            )}
          </div>
        );

      case 'pen':
        if (!annotation.points || annotation.points.length < 2) return null;
        return (
          <svg
            {...commonProps}
            style={{
              ...commonProps.style,
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            <polyline
              points={annotation.points.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={annotation.color}
              strokeWidth={annotation.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: 'all' }}
            />
          </svg>
        );

      default:
        return null;
    }
  };

  const renderCurrentDrawing = () => {
    if (!isDrawing || !startPoint) return null;

    const style: React.CSSProperties = {
      position: 'absolute',
      pointerEvents: 'none',
    };

    if (currentTool === 'pen' && currentPoints.length > 1) {
      return (
        <svg style={{ ...style, left: 0, top: 0, width: '100%', height: '100%' }}>
          <polyline
            points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    return null;
  };

  if (!file) {
    console.log('PDFCanvas: No file provided');
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">No PDF loaded</p>
      </div>
    );
  }

  if (!fileUrl) {
    console.log('PDFCanvas: File URL not ready yet');
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading PDF...</p>
      </div>
    );
  }

  console.log('PDFCanvas: Rendering with file:', file.name);
  console.log('PDFCanvas: numPages:', numPages);
  console.log('PDFCanvas: currentPage:', currentPage);

  // Render at least one page initially even if numPages is 0
  const pagesToRender = numPages > 0 ? numPages : 1;
  console.log('PDFCanvas: Pages to render:', pagesToRender);

  return (
    <div className="flex-1 flex flex-col w-full bg-muted/30 relative overflow-hidden">
      {/* PDF Canvas - Continuous Scroll */}
      <div
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-auto p-4 md:p-8 pb-24"
        style={{
          scrollBehavior: 'auto', // Natural scroll for user, programmatic scroll is instant
        }}
      >
        <div className="flex flex-col items-center w-full">
          <div className="space-y-8">
            {Array.from({ length: pagesToRender }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={pageNum}
                data-page-num={pageNum}
                ref={(el) => {
                  pageRefsMap.current[pageNum] = el;
                }}
                className={`relative mx-auto rounded-md bg-white overflow-hidden transition-all duration-300 ease-out ${
                  pageNum === currentPage ? 'border-2 border-gray-400 shadow-lg' : 'border border-gray-200'
                }`}
                style={{
                  width: 'fit-content',
                  cursor: currentTool === 'select' ? 'default' : 'crosshair',
                }}
                onMouseDown={(e) => {
                  // Check if clicking on a different page to focus it
                  if (pageNum !== currentPage) {
                    console.log('Mouse down on different page:', pageNum, 'Current:', currentPage);
                    onPageChange(pageNum);
                  }
                  // Continue with drawing if not in select mode
                  handleMouseDown(e);
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={() => {
                  console.log('Page clicked:', pageNum, 'Current page:', currentPage);
                  // Deselect annotations when clicking in select mode
                  if (currentTool === 'select') {
                    onAnnotationSelect(null);
                  }
                }}
              >
                <Document
                  file={fileUrl}
                  onLoadSuccess={({ numPages }) => {
                    console.log('PDF loaded successfully. Total pages:', numPages);
                    if (pageNum === 1) {
                      onNumPagesChange(numPages);
                    }
                  }}
                  onLoadError={(error) => {
                    console.error('Error loading PDF:', error);
                  }}
                >
                  <Page
                    pageNumber={pageNum}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    onLoadSuccess={() => {
                      console.log('Page', pageNum, 'rendered successfully');
                    }}
                    onLoadError={(error) => {
                      console.error('Error loading page', pageNum, ':', error);
                    }}
                  />
                </Document>

                {/* Render annotations for this page */}
                {annotations
                  .filter(a => a.pageNumber === pageNum)
                  .map(renderAnnotation)}

                {/* Render current drawing */}
                {pageNum === currentPage && renderCurrentDrawing()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Pagination Dock */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background/95 backdrop-blur border rounded-full shadow-lg p-2 md:p-3 z-50 flex items-center gap-2 md:gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="h-8 w-8 md:h-9 md:w-9 p-0 rounded-full"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-xs md:text-sm font-medium min-w-fit px-2 md:px-3 py-1 bg-muted rounded-full">
          {currentPage} / {numPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
          disabled={currentPage >= numPages}
          className="h-8 w-8 md:h-9 md:w-9 p-0 rounded-full"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
