import { useRef, useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { Tool, Annotation, Point } from '@/types/pdf';
import { PDFDock } from './pdf-dock';

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
  onAnnotationAdd: (annotation: Annotation | Omit<Annotation, 'id'>) => void;
  onAnnotationUpdate: (id: string, updates: Partial<Annotation>) => void;
  onAnnotationDelete: (id: string) => void;
  onAnnotationSelect: (id: string | null) => void;
  onTextAnnotationSelect?: (annotation: Annotation) => void;
  selectedAnnotationId: string | null;
  hoveredAnnotationId?: string | null;
  onPageChange: (page: number) => void;
  onNumPagesChange: (numPages: number) => void;
  onScaleChange: (scale: number) => void;
  currentColor: string;
  strokeWidth: number;
  strokeColor?: string;
  fontFamily?: string;
  fontSize?: number;
  textBold?: boolean;
  textItalic?: boolean;
  textUnderline?: boolean;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
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
  onAnnotationDelete,
  onAnnotationSelect,
  onTextAnnotationSelect,
  selectedAnnotationId,
  hoveredAnnotationId,
  onPageChange,
  onNumPagesChange,
  onScaleChange,
  currentColor,
  strokeWidth,
  strokeColor = '#000000',
  fontFamily,
  fontSize,
  textBold,
  textItalic,
  textUnderline,
  backgroundColor,
  textAlign,
}: PDFCanvasProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefsMap = useRef<Record<number, HTMLDivElement | null>>({});
  const isScrollingProgrammaticallyRef = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const hasDraggedRef = useRef(false);

  // Drag state for moving annotations
  const [isDragging, setIsDragging] = useState(false);
  const [dragAnnotationId, setDragAnnotationId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });

  // Resize state for resizing annotations
  const [isResizing, setIsResizing] = useState(false);
  const [resizeAnnotationId, setResizeAnnotationId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState<Point>({ x: 0, y: 0 });
  const [resizeStartBounds, setResizeStartBounds] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });

  // Rotation state for rotating annotations
  const [isRotating, setIsRotating] = useState(false);
  const [rotateAnnotationId, setRotateAnnotationId] = useState<string | null>(null);
  const [rotateStartAngle, setRotateStartAngle] = useState(0);
  const [rotateStartRotation, setRotateStartRotation] = useState(0);

  // Canvas drag state for panning when zoomed in
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const [canvasDragStart, setCanvasDragStart] = useState<Point | null>(null);
  const [canvasScrollStart, setCanvasScrollStart] = useState<{ x: number; y: number } | null>(null);

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

  // Handle keyboard events for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected annotation when Delete or Backspace is pressed
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
        e.preventDefault();
        onAnnotationDelete(selectedAnnotationId);
        onAnnotationSelect(null);
      }
    };

    // Add event listener to window
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedAnnotationId, onAnnotationDelete, onAnnotationSelect]);

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
      strokeColor,
      strokeWidth,
      opacity: currentTool === 'highlight' ? 0.3 : 1,
    };

    switch (currentTool) {
      case 'text':
        const id = `text-${Date.now()}`;
        const textAnnotation: Annotation = {
          ...annotation,
          id,
          text: '',
          fontSize: fontSize || 16,
          fontFamily: fontFamily || 'Arial',
          bold: textBold || false,
          italic: textItalic || false,
          underline: textUnderline || false,
          backgroundColor: backgroundColor || 'transparent',
          textAlign: textAlign || 'left',
          width: 200,
          height: (fontSize || 16) * 1.5,
        };
        onAnnotationAdd(textAnnotation);
        setEditingAnnotationId(id);
        onAnnotationSelect(id);
        setIsDrawing(false);
        setStartPoint(null);
        setCurrentPoints([]);
        return;

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

  // Drag handlers for moving annotations
  const handleAnnotationMouseDown = (e: React.MouseEvent, annotation: Annotation) => {
    if (currentTool !== 'select') return;

    // Don't allow dragging lines/arrows directly - only resize via endpoints
    if (annotation.type === 'line' || annotation.type === 'arrow') {
      return;
    }

    e.stopPropagation();
    onAnnotationSelect(annotation.id);
    hasDraggedRef.current = false;

    // If text annotation selected, sync formatting state
    if (annotation.type === 'text' && onTextAnnotationSelect) {
      onTextAnnotationSelect(annotation);
    }

    // Get position relative to the page container (parent)
    const pageContainer = (e.target as HTMLElement).closest('[data-page-num]');
    if (!pageContainer) return;
    
    const rect = pageContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragAnnotationId(annotation.id);
    setDragOffset({
      x: mouseX - annotation.position.x,
      y: mouseY - annotation.position.y,
    });
  };  const handleAnnotationMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragAnnotationId) return;

    hasDraggedRef.current = true;

    const annotation = annotations.find(a => a.id === dragAnnotationId);
    if (!annotation) return;

    // Get the current mouse position relative to the page
    const pageContainer = e.currentTarget as HTMLElement;
    const rect = pageContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPosition = {
      x: mouseX - dragOffset.x,
      y: mouseY - dragOffset.y,
    };

    // For pen annotations, we need to update all points
    if (annotation.type === 'pen' && annotation.points) {
      const deltaX = newPosition.x - annotation.position.x;
      const deltaY = newPosition.y - annotation.position.y;
      const newPoints = annotation.points.map(p => ({
        x: p.x + deltaX,
        y: p.y + deltaY,
      }));
      onAnnotationUpdate(dragAnnotationId, { position: newPosition, points: newPoints });
    }
    // For line/arrow, update endPoint as well
    else if ((annotation.type === 'line' || annotation.type === 'arrow') && annotation.endPoint) {
      const deltaX = newPosition.x - annotation.position.x;
      const deltaY = newPosition.y - annotation.position.y;
      const newEndPoint = {
        x: annotation.endPoint.x + deltaX,
        y: annotation.endPoint.y + deltaY,
      };
      onAnnotationUpdate(dragAnnotationId, { position: newPosition, endPoint: newEndPoint });
    }
    // For other annotations, just update position
    else {
      onAnnotationUpdate(dragAnnotationId, { position: newPosition });
    }
  };

  const handleAnnotationMouseUp = () => {
    setIsDragging(false);
    setDragAnnotationId(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // Resize handlers for resizing annotations
  const handleResizeMouseDown = (e: React.MouseEvent, annotationId: string, handle: string) => {
    if (currentTool !== 'select') return;

    e.stopPropagation();
    e.preventDefault();

    const pageContainer = (e.target as HTMLElement).closest('[data-page-num]');
    if (!pageContainer) return;

    const rect = pageContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const annotation = annotations.find(a => a.id === annotationId);
    if (!annotation) return;

    setIsResizing(true);
    setResizeAnnotationId(annotationId);
    setResizeHandle(handle);
    setResizeStartPos({ x: mouseX, y: mouseY });

    // For line/arrow, capture endpoint positions as bounds
    if ((annotation.type === 'line' || annotation.type === 'arrow') && annotation.endPoint) {
      if (handle === 'start') {
        setResizeStartBounds({
          x: annotation.position.x,
          y: annotation.position.y,
          width: 0,
          height: 0,
        });
      } else if (handle === 'end') {
        const width = annotation.endPoint.x - annotation.position.x;
        const height = annotation.endPoint.y - annotation.position.y;
        setResizeStartBounds({
          x: annotation.position.x,
          y: annotation.position.y,
          width,
          height,
        });
      }
    } else {
      const bounds = getAnnotationBounds(annotation);
      setResizeStartBounds({ ...bounds });
    }
  };

  const handleResizeMouseMove = (e: React.MouseEvent) => {
    if (!isResizing || !resizeAnnotationId || !resizeHandle) return;

    const annotation = annotations.find(a => a.id === resizeAnnotationId);
    if (!annotation) return;

    const pageContainer = e.currentTarget as HTMLElement;
    const rect = pageContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const deltaX = mouseX - resizeStartPos.x;
    const deltaY = mouseY - resizeStartPos.y;

    const minSize = 20;
    let newBounds = { ...resizeStartBounds };

    // Handle line/arrow endpoint dragging
    if ((annotation.type === 'line' || annotation.type === 'arrow') && annotation.endPoint) {
      if (resizeHandle === 'start') {
        // Moving start point - update position
        onAnnotationUpdate(resizeAnnotationId, {
          position: { 
            x: resizeStartBounds.x + deltaX, 
            y: resizeStartBounds.y + deltaY 
          },
        });
        return;
      } else if (resizeHandle === 'end') {
        // Moving end point - calculate new endpoint relative to start point
        const startX = annotation.position.x;
        const startY = annotation.position.y;
        onAnnotationUpdate(resizeAnnotationId, {
          endPoint: {
            x: startX + (resizeStartBounds.width + deltaX),
            y: startY + (resizeStartBounds.height + deltaY),
          },
        });
        return;
      }
    }

    // Handle different resize directions for regular shapes
    switch (resizeHandle) {
      case 'tl': // top-left
        newBounds.x += deltaX;
        newBounds.y += deltaY;
        newBounds.width -= deltaX;
        newBounds.height -= deltaY;
        break;
      case 'tr': // top-right
        newBounds.y += deltaY;
        newBounds.width += deltaX;
        newBounds.height -= deltaY;
        break;
      case 'bl': // bottom-left
        newBounds.x += deltaX;
        newBounds.width -= deltaX;
        newBounds.height += deltaY;
        break;
      case 'br': // bottom-right
        newBounds.width += deltaX;
        newBounds.height += deltaY;
        break;
      case 'top': // top
        newBounds.y += deltaY;
        newBounds.height -= deltaY;
        break;
      case 'bottom': // bottom
        newBounds.height += deltaY;
        break;
      case 'left': // left
        newBounds.x += deltaX;
        newBounds.width -= deltaX;
        break;
      case 'right': // right
        newBounds.width += deltaX;
        break;
    }

    // Enforce minimum size
    if (newBounds.width < minSize) newBounds.width = minSize;
    if (newBounds.height < minSize) newBounds.height = minSize;

    // Update annotation based on type
    if (annotation.type === 'rectangle' || annotation.type === 'circle' || annotation.type === 'highlight' || annotation.type === 'text' || annotation.type === 'image') {
      onAnnotationUpdate(resizeAnnotationId, {
        position: { x: newBounds.x, y: newBounds.y },
        width: newBounds.width,
        height: newBounds.height,
      });
    }
  };

  const handleResizeMouseUp = () => {
    setIsResizing(false);
    setResizeAnnotationId(null);
    setResizeHandle(null);
    setResizeStartPos({ x: 0, y: 0 });
    setResizeStartBounds({ x: 0, y: 0, width: 0, height: 0 });
  };

  // Rotation handlers for rotating annotations
  const handleRotateMouseDown = (e: React.MouseEvent, annotationId: string) => {
    if (currentTool !== 'select') return;

    e.stopPropagation();
    e.preventDefault();

    const pageContainer = (e.target as HTMLElement).closest('[data-page-num]');
    if (!pageContainer) return;

    const annotation = annotations.find(a => a.id === annotationId);
    if (!annotation) return;

    const bounds = getAnnotationBounds(annotation);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    const rect = pageContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate initial angle from center to mouse
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    setIsRotating(true);
    setRotateAnnotationId(annotationId);
    setRotateStartAngle(angle);
    setRotateStartRotation(annotation.rotation || 0);
  };

  const handleRotateMouseMove = (e: React.MouseEvent) => {
    if (!isRotating || !rotateAnnotationId) return;

    const annotation = annotations.find(a => a.id === rotateAnnotationId);
    if (!annotation) return;

    const pageContainer = e.currentTarget as HTMLElement;
    const bounds = getAnnotationBounds(annotation);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    const rect = pageContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate current angle from center to mouse
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const currentAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // Calculate rotation delta
    const angleDelta = currentAngle - rotateStartAngle;
    const newRotation = (rotateStartRotation + angleDelta) % 360;

    onAnnotationUpdate(rotateAnnotationId, { rotation: newRotation });
  };

  const handleRotateMouseUp = () => {
    setIsRotating(false);
    setRotateAnnotationId(null);
    setRotateStartAngle(0);
    setRotateStartRotation(0);
  };

  // Canvas drag handlers for panning when zoomed in
  const handleCanvasDragStart = (e: React.MouseEvent) => {
    // Only allow canvas dragging in select mode and when zoomed in
    if (currentTool !== 'select' || scale <= 1) return;
    
    setIsCanvasDragging(true);
    setCanvasDragStart({ x: e.clientX, y: e.clientY });
    setCanvasScrollStart({
      x: scrollContainerRef.current?.scrollLeft || 0,
      y: scrollContainerRef.current?.scrollTop || 0,
    });
  };

  const handleCanvasDragMove = (e: React.MouseEvent) => {
    if (!isCanvasDragging || !canvasDragStart || !canvasScrollStart || !scrollContainerRef.current) return;

    const deltaX = e.clientX - canvasDragStart.x;
    const deltaY = e.clientY - canvasDragStart.y;

    // Invert delta so dragging right scrolls left (natural panning)
    scrollContainerRef.current.scrollLeft = canvasScrollStart.x - deltaX;
    scrollContainerRef.current.scrollTop = canvasScrollStart.y - deltaY;
  };

  const handleCanvasDragEnd = () => {
    setIsCanvasDragging(false);
    setCanvasDragStart(null);
    setCanvasScrollStart(null);
  };

  // Get bounding box for an annotation
  const getAnnotationBounds = (annotation: Annotation) => {
    switch (annotation.type) {
      case 'text':
        return {
          x: annotation.position.x,
          y: annotation.position.y,
          width: annotation.width || 200,
          height: annotation.height || (annotation.fontSize || 16) * 1.5,
        };
      case 'image':
      case 'rectangle':
      case 'circle':
      case 'highlight':
        return {
          x: annotation.position.x,
          y: annotation.position.y,
          width: annotation.width || 0,
          height: annotation.height || 0,
        };
      case 'line':
      case 'arrow':
        if (!annotation.endPoint) return { x: 0, y: 0, width: 0, height: 0 };
        return {
          x: Math.min(annotation.position.x, annotation.endPoint.x),
          y: Math.min(annotation.position.y, annotation.endPoint.y),
          width: Math.abs(annotation.endPoint.x - annotation.position.x),
          height: Math.abs(annotation.endPoint.y - annotation.position.y),
        };
      case 'pen':
        if (!annotation.points || annotation.points.length === 0) {
          return { x: 0, y: 0, width: 0, height: 0 };
        }
        const xs = annotation.points.map(p => p.x);
        const ys = annotation.points.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        };
      default:
        return { x: 0, y: 0, width: 0, height: 0 };
    }
  };

  // Render hover highlight for annotations
  const renderHoverHighlight = (annotation: Annotation) => {
    if (annotation.id !== hoveredAnnotationId || annotation.id === selectedAnnotationId) return null;

    // Special handling for lines and arrows
    if ((annotation.type === 'line' || annotation.type === 'arrow') && annotation.endPoint) {
      return (
        <>
          {/* Start point indicator */}
          <div
            className="absolute w-4 h-4 bg-yellow-300 border-2 border-yellow-500 rounded-full pointer-events-none"
            style={{
              left: annotation.position.x - 8,
              top: annotation.position.y - 8,
              zIndex: 9,
            }}
          />
          {/* End point indicator */}
          <div
            className="absolute w-4 h-4 bg-yellow-300 border-2 border-yellow-500 rounded-full pointer-events-none"
            style={{
              left: annotation.endPoint.x - 8,
              top: annotation.endPoint.y - 8,
              zIndex: 9,
            }}
          />
        </>
      );
    }

    const bounds = getAnnotationBounds(annotation);
    const padding = 8;

    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: bounds.x - padding,
          top: bounds.y - padding,
          width: bounds.width + padding * 2,
          height: bounds.height + padding * 2,
          border: '2px solid #facc15',
          backgroundColor: 'rgba(250, 204, 21, 0.1)',
          transform: `rotate(${annotation.rotation || 0}deg)`,
          transformOrigin: 'center',
          zIndex: 9,
        }}
      />
    );
  };

  // Render bounding box for selected annotation
  const renderBoundingBox = (annotation: Annotation) => {
    if (annotation.id !== selectedAnnotationId || currentTool !== 'select' || annotation.id === editingAnnotationId) return null;

    // Special handling for lines and arrows - show only endpoint handles
    if ((annotation.type === 'line' || annotation.type === 'arrow') && annotation.endPoint) {
      return (
        <>
          {/* Start point handle */}
          <div
            className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full pointer-events-auto hover:bg-primary transition-colors"
            style={{
              left: annotation.position.x - 8,
              top: annotation.position.y - 8,
              cursor: 'grab',
              zIndex: 10,
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, annotation.id, 'start')}
          />
          {/* End point handle */}
          <div
            className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full pointer-events-auto hover:bg-primary transition-colors"
            style={{
              left: annotation.endPoint.x - 8,
              top: annotation.endPoint.y - 8,
              cursor: 'grab',
              zIndex: 10,
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, annotation.id, 'end')}
          />
        </>
      );
    }

    const bounds = getAnnotationBounds(annotation);
    const padding = 8;

    const cornerHandles = [
      { handle: 'tl', top: -4, left: -4, cursor: 'nw-resize' },
      { handle: 'tr', top: -4, right: -4, cursor: 'ne-resize' },
      { handle: 'bl', bottom: -4, left: -4, cursor: 'sw-resize' },
      { handle: 'br', bottom: -4, right: -4, cursor: 'se-resize' },
    ];

    const edgeHandles = [
      { handle: 'top', top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
      { handle: 'bottom', bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
      { handle: 'left', top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'w-resize' },
      { handle: 'right', top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'e-resize' },
    ];

    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: bounds.x - padding,
          top: bounds.y - padding,
          width: bounds.width + padding * 2,
          height: bounds.height + padding * 2,
          border: '2px dashed #3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          transform: `rotate(${annotation.rotation || 0}deg)`,
          transformOrigin: 'center',
          transition: 'transform 0.05s ease-out',
        }}
      >
        {/* Corner handles */}
        {cornerHandles.map((handle) => (
          <div
            key={handle.handle}
            className="absolute w-3 h-3 bg-white border-2 border-primary rounded-sm pointer-events-auto hover:bg-primary transition-colors"
            style={{
              ...{
                top: handle.top,
                left: handle.left,
                right: handle.right,
                bottom: handle.bottom,
              },
              cursor: handle.cursor,
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, annotation.id, handle.handle)}
          />
        ))}

        {/* Edge handles */}
        {edgeHandles.map((handle) => (
          <div
            key={handle.handle}
            className="absolute w-3 h-3 bg-white border-2 border-primary rounded-sm pointer-events-auto hover:bg-primary transition-colors"
            style={{
              ...{
                top: handle.top,
                left: handle.left,
                right: handle.right,
                bottom: handle.bottom,
                transform: handle.transform,
              },
              cursor: handle.cursor,
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, annotation.id, handle.handle)}
          />
        ))}

        {/* Rotation handle - circular handle at top center */}
        <div
          className="absolute w-4 h-4 bg-white border-2 border-yellow-500 rounded-full pointer-events-auto hover:bg-yellow-500 transition-colors"
          style={{
            top: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            cursor: 'grab',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
          onMouseDown={(e) => handleRotateMouseDown(e, annotation.id)}
        />
      </div>
    );
  };

  const renderAnnotation = (annotation: Annotation) => {
    const isSelected = annotation.id === selectedAnnotationId;
    const commonProps = {
      key: annotation.id,
      onMouseDown: (e: React.MouseEvent) => handleAnnotationMouseDown(e, annotation),
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onAnnotationSelect(annotation.id);
      },
      style: {
        cursor: currentTool === 'select' ? 'pointer' : 'default',
        transform: annotation.rotation ? `rotate(${annotation.rotation}deg)` : undefined,
        transformOrigin: 'center',
        transition: 'transform 0.05s ease-out',
      },
      className: `absolute ${isSelected && currentTool !== 'select' ? 'ring-2 ring-primary' : ''} ${currentTool === 'select' ? 'cursor-pointer' : ''}`,
    };

    const element = (() => {
      switch (annotation.type) {
        case 'text':
          if (editingAnnotationId === annotation.id) {
            return (
              <div
                key={annotation.id}
                style={{
                  position: 'absolute',
                  left: annotation.position.x,
                  top: annotation.position.y,
                  zIndex: 100,
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <textarea
                  autoFocus
                  defaultValue={annotation.text}
                  style={{
                    width: annotation.width ? `${annotation.width}px` : '200px',
                    height: annotation.height ? `${annotation.height}px` : 'auto',
                    color: annotation.color,
                    fontSize: annotation.fontSize,
                    fontFamily: annotation.fontFamily,
                    fontWeight: annotation.bold ? 'bold' : 'normal',
                    fontStyle: annotation.italic ? 'italic' : 'normal',
                    textDecoration: annotation.underline ? 'underline' : 'none',
                    backgroundColor: annotation.backgroundColor && annotation.backgroundColor !== 'transparent' ? annotation.backgroundColor : 'transparent',
                    textAlign: annotation.textAlign || 'left',
                    border: '1px dashed #000',
                    outline: 'none',
                    resize: 'none',
                    overflow: 'hidden',
                    padding: '2px 4px',
                    background: 'transparent',
                  }}
                  onBlur={(e) => {
                    onAnnotationUpdate(annotation.id, { text: e.target.value });
                    setEditingAnnotationId(null);
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                  }}
                />
              </div>
            );
          }

          return (
            <div
              {...commonProps}
              style={{
                ...commonProps.style,
                left: annotation.position.x,
                top: annotation.position.y,
                width: annotation.width,
                height: annotation.height,
                color: annotation.color,
                fontSize: annotation.fontSize,
                fontFamily: annotation.fontFamily,
                fontWeight: annotation.bold ? 'bold' : 'normal',
                fontStyle: annotation.italic ? 'italic' : 'normal',
                textDecoration: annotation.underline ? 'underline' : 'none',
                backgroundColor: annotation.backgroundColor && annotation.backgroundColor !== 'transparent' ? annotation.backgroundColor : 'transparent',
                padding: annotation.backgroundColor && annotation.backgroundColor !== 'transparent' ? '2px 4px' : '0',
                borderRadius: annotation.backgroundColor && annotation.backgroundColor !== 'transparent' ? '2px' : '0',
                textAlign: annotation.textAlign || 'left',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                minWidth: '20px',
                minHeight: '20px',
              }}
              onClick={(e) => {
                commonProps.onClick(e);
                if (!hasDraggedRef.current) {
                  setEditingAnnotationId(annotation.id);
                }
              }}
            >
              {annotation.text || 'Type here'}
            </div>
          );

        case 'image':
          return (
            <div
              {...commonProps}
              style={{
                ...commonProps.style,
                left: annotation.position.x,
                top: annotation.position.y,
                width: annotation.width,
                height: annotation.height,
                overflow: 'hidden',
              }}
            >
              <img
                src={annotation.imageData}
                alt="Annotation"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                }}
              />
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
                backgroundColor: annotation.color === 'transparent' ? 'transparent' : annotation.color,
                opacity: annotation.opacity,
                border: annotation.type === 'rectangle' ? `${annotation.strokeWidth}px solid ${annotation.strokeColor || annotation.color}` : 'none',
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
                backgroundColor: annotation.color === 'transparent' ? 'transparent' : annotation.color,
                border: `${annotation.strokeWidth}px solid ${annotation.strokeColor || annotation.color}`,
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
                backgroundColor: annotation.strokeColor || annotation.color,
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
                    borderLeft: `10px solid ${annotation.strokeColor || annotation.color}`,
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
    })();

    return (
      <>
        {element}
        {renderBoundingBox(annotation)}
        {renderHoverHighlight(annotation)}
      </>
    );
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
          scrollBehavior: 'auto',
          cursor: isCanvasDragging ? 'grabbing' : (currentTool === 'select' && scale > 1 ? 'grab' : 'default'),
        }}
        onMouseDown={handleCanvasDragStart}
        onMouseMove={handleCanvasDragMove}
        onMouseUp={handleCanvasDragEnd}
        onMouseLeave={handleCanvasDragEnd}
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
                className={`relative mx-auto rounded-md bg-white transition-all duration-300 ease-out ${pageNum === currentPage ? 'border-2 border-gray-400 shadow-lg' : 'border border-gray-200'
                  }`}
                style={{
                  width: 'fit-content',
                  maxWidth: scale > 1 ? '90vw' : 'none',
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
                onMouseMove={(e) => {
                  // Handle annotation rotating
                  if (isRotating && currentTool === 'select') {
                    handleRotateMouseMove(e);
                  } else if (isResizing && currentTool === 'select') {
                    handleResizeMouseMove(e);
                  } else if (isDragging && currentTool === 'select') {
                    // Handle annotation dragging
                    handleAnnotationMouseMove(e);
                  } else {
                    handleMouseMove(e);
                  }
                }}
                onMouseUp={(e) => {
                  // Handle annotation resize/drag/rotate end
                  if (isRotating) {
                    handleRotateMouseUp();
                  } else if (isResizing) {
                    handleResizeMouseUp();
                  } else if (isDragging) {
                    handleAnnotationMouseUp();
                  } else {
                    handleMouseUp(e);
                  }
                }}
                onMouseLeave={() => {
                  // Stop resizing, dragging, or rotating if mouse leaves the page
                  if (isRotating) {
                    handleRotateMouseUp();
                  } else if (isResizing) {
                    handleResizeMouseUp();
                  } else if (isDragging) {
                    handleAnnotationMouseUp();
                  }
                }}
                onClick={() => {
                  console.log('Page clicked:', pageNum, 'Current page:', currentPage);
                  // Deselect annotations when clicking in select mode
                  if (currentTool === 'select') {
                    onAnnotationSelect(null);
                  }
                }}
              >
                {/* Scrollable wrapper for zoomed content */}
                <div
                  className="overflow-auto"
                  style={{
                    maxWidth: '100%',
                    maxHeight: scale > 1 ? '80vh' : 'none',
                    display: 'flex',
                    alignItems: scale <= 1 ? 'center' : 'flex-start',
                    justifyContent: 'center',
                  }}
                >
                  {/* Scaled container for PDF and annotations */}
                  <div
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: 'top left',
                      display: 'inline-block',
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
                      scale={1}
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
                </div>
                </div>

                {/* Render current drawing */}
                {pageNum === currentPage && renderCurrentDrawing()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Pagination Dock */}
      <PDFDock
        currentPage={currentPage}
        numPages={numPages}
        scale={scale}
        onPageChange={onPageChange}
        onScaleChange={onScaleChange}
      />
    </div>
  );
}
