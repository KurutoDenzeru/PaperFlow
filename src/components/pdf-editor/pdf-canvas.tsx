import { useRef, useState, useCallback } from 'react';
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

  const getRelativePosition = useCallback((e: React.MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
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
    if (!isDrawing || !startPoint) return;

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
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">No PDF loaded</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center w-full bg-muted/30">
      {/* Page Navigation */}
      <div className="flex items-center gap-4 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium min-w-32 text-center">
          Page {currentPage} of {numPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= numPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 w-full flex items-start justify-center overflow-auto p-8">
        <div className="max-w-7xl w-full">
          <div
            ref={canvasRef}
            className="relative mx-auto shadow-2xl bg-white"
            style={{
              width: 'fit-content',
              cursor: currentTool === 'select' ? 'default' : 'crosshair',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={() => currentTool === 'select' && onAnnotationSelect(null)}
          >
            <Document
              file={file}
              onLoadSuccess={({ numPages }) => onNumPagesChange(numPages)}
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                rotate={rotation}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>

            {/* Render annotations for current page */}
            {annotations
              .filter(a => a.pageNumber === currentPage)
              .map(renderAnnotation)}

            {/* Render current drawing */}
            {renderCurrentDrawing()}
          </div>
        </div>
      </div>
    </div>
  );
}
