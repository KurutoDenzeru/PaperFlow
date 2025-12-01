import { useState, useCallback, useEffect } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { PDFUploadZone } from './pdf-upload-zone';
import { PDFNavbar } from './pdf-navbar';
import { PDFToolbar } from './pdf-toolbar';
import { PDFSidebar } from './pdf-sidebar';
import { PDFCanvas } from './pdf-canvas';
import type { Tool, Annotation, PDFState } from '@/types/pdf';

export function PDFEditor() {
  const isMobile = useIsMobile();

  const [pdfState, setPdfState] = useState<PDFState>({
    file: null,
    numPages: 0,
    currentPage: 1,
    scale: 1.0,
    rotation: 0,
    annotations: [],
  });

  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [clipboard, setClipboard] = useState<Annotation | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'multiple'>('single');

  // Text formatting state
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(16);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  // Collapse sidebar on mobile by default
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('pdfEditorSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        console.log('Loaded session from localStorage:', session);

        // Only restore if file data exists
        if (session.fileName && session.fileData) {
          // Convert base64 back to File
          const binaryString = atob(session.fileData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const file = new File([bytes], session.fileName, { type: 'application/pdf' });

          setPdfState({
            file,
            numPages: session.numPages,
            currentPage: session.currentPage,
            scale: session.scale,
            rotation: session.rotation,
            annotations: session.annotations,
          });

          setHistory([session.annotations]);
          setHistoryIndex(0);

          // Restore color preferences
          if (session.currentColor) setCurrentColor(session.currentColor);
          if (session.strokeColor) setStrokeColor(session.strokeColor);
          if (session.strokeWidth) setStrokeWidth(session.strokeWidth);
          if (session.fontFamily) setFontFamily(session.fontFamily);
          if (session.fontSize) setFontSize(session.fontSize);
          if (session.textBold !== undefined) setTextBold(session.textBold);
          if (session.textItalic !== undefined) setTextItalic(session.textItalic);
          if (session.textUnderline !== undefined) setTextUnderline(session.textUnderline);
          if (session.backgroundColor) setBackgroundColor(session.backgroundColor);
          if (session.textAlign) setTextAlign(session.textAlign);

          toast.success('Session restored!');
        }
      } catch (error) {
        console.error('Error loading session from localStorage:', error);
        localStorage.removeItem('pdfEditorSession');
      }
    }
  }, []); // Only run on mount

  // Update selected text annotation when formatting changes
  useEffect(() => {
    if (selectedAnnotationId && currentTool === 'select') {
      const selectedAnnotation = pdfState.annotations.find(a => a.id === selectedAnnotationId);
      if (selectedAnnotation && selectedAnnotation.type === 'text') {
        const newAnnotations = pdfState.annotations.map(a =>
          a.id === selectedAnnotationId ? {
            ...a,
            fontFamily,
            fontSize,
            bold: textBold,
            italic: textItalic,
            underline: textUnderline,
            color: currentColor,
            backgroundColor,
            textAlign,
          } : a
        );
        setPdfState(prev => ({ ...prev, annotations: newAnnotations }));
        addToHistory(newAnnotations);
      }
    }
  }, [fontFamily, fontSize, textBold, textItalic, textUnderline, currentColor, backgroundColor, textAlign, selectedAnnotationId]);

  // Update selected shape annotation when color changes
  useEffect(() => {
    if (selectedAnnotationId && currentTool === 'select') {
      const selectedAnnotation = pdfState.annotations.find(a => a.id === selectedAnnotationId);
      if (selectedAnnotation && (selectedAnnotation.type === 'rectangle' || selectedAnnotation.type === 'circle' || selectedAnnotation.type === 'line' || selectedAnnotation.type === 'arrow' || selectedAnnotation.type === 'highlight' || selectedAnnotation.type === 'pen' || selectedAnnotation.type === 'eraser')) {
        const newAnnotations = pdfState.annotations.map(a =>
          a.id === selectedAnnotationId ? {
            ...a,
            color: currentColor,
            strokeColor,
            strokeWidth,
          } : a
        );
        setPdfState(prev => ({ ...prev, annotations: newAnnotations }));
        addToHistory(newAnnotations);
      }
    }
  }, [currentColor, strokeColor, strokeWidth, selectedAnnotationId]);

  // Save session to localStorage whenever state changes
  useEffect(() => {
    if (!pdfState.file || pdfState.numPages === 0) return;

    const file = pdfState.file; // Capture in variable to ensure it's not null
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string)?.split(',')[1];
      if (base64) {
        const session = {
          fileName: file.name,
          fileData: base64,
          numPages: pdfState.numPages,
          currentPage: pdfState.currentPage,
          scale: pdfState.scale,
          rotation: pdfState.rotation,
          annotations: pdfState.annotations,
          // Save color and formatting preferences
          currentColor,
          strokeColor,
          strokeWidth,
          fontFamily,
          fontSize,
          textBold,
          textItalic,
          textUnderline,
          backgroundColor,
          textAlign,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('pdfEditorSession', JSON.stringify(session));
        console.log('Saved session to localStorage');
      }
    };
    reader.onerror = () => {
      console.error('Error reading file for localStorage');
    };
    reader.readAsDataURL(file);
  }, [pdfState, currentColor, strokeColor, strokeWidth, fontFamily, fontSize, textBold, textItalic, textUnderline, backgroundColor, textAlign]);

  const addToHistory = useCallback((annotations: Annotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...annotations]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const getNextName = (type: string, annotations: Annotation[]) => {
    const prefix = type.charAt(0).toUpperCase() + type.slice(1);
    const existingNames = new Set(annotations.map(a => a.name));
    let i = 1;
    while (existingNames.has(`${prefix} ${i}`)) {
      i++;
    }
    return `${prefix} ${i}`;
  };

  // Handle copy/paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Command/Control key
      if (e.metaKey || e.ctrlKey) {
        // Copy
        if (e.key === 'c') {
          if (selectedAnnotationId) {
            const annotation = pdfState.annotations.find(a => a.id === selectedAnnotationId);
            if (annotation) {
              setClipboard(annotation);
              toast.success('Copied to clipboard');
            }
          }
        }
        // Paste
        else if (e.key === 'v') {
          if (clipboard) {
            const newId = `annotation-${Date.now()}-${Math.random()}`;
            const offset = 20;
            const newName = getNextName(clipboard.type, pdfState.annotations);

            const newAnnotation: Annotation = {
              ...clipboard,
              id: newId,
              name: newName,
              position: {
                x: clipboard.position.x + offset,
                y: clipboard.position.y + offset,
              },
            };

            // Offset points for path-based annotations
            if ((newAnnotation.type === 'pen' || newAnnotation.type === 'eraser' || newAnnotation.type === 'highlight') && newAnnotation.points) {
              newAnnotation.points = newAnnotation.points.map(p => ({
                x: p.x + offset,
                y: p.y + offset
              }));
            }

            // Offset endPoint for line/arrow
            if ((newAnnotation.type === 'line' || newAnnotation.type === 'arrow') && newAnnotation.endPoint) {
              newAnnotation.endPoint = {
                x: newAnnotation.endPoint.x + offset,
                y: newAnnotation.endPoint.y + offset
              };
            }

            const newAnnotations = [...pdfState.annotations, newAnnotation];
            setPdfState(prev => ({ ...prev, annotations: newAnnotations }));
            addToHistory(newAnnotations);
            setSelectedAnnotationId(newId);
            toast.success('Pasted from clipboard');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId, pdfState.annotations, clipboard, addToHistory]);

  const handleFileSelect = (file: File) => {
    console.log('File selected:', file);
    console.log('File name:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size);
    setPdfState(prev => ({
      ...prev,
      file,
      currentPage: 1,
      annotations: [],
    }));
    setHistory([[]]);
    setHistoryIndex(0);
  };

  const handleAnnotationAdd = (annotation: Annotation | Omit<Annotation, 'id'>) => {
    const id = 'id' in annotation ? annotation.id : `annotation-${Date.now()}-${Math.random()}`;
    const name = annotation.name || getNextName(annotation.type, pdfState.annotations);
    const newAnnotation: Annotation = {
      ...annotation,
      id,
      name,
    };
    const newAnnotations = [...pdfState.annotations, newAnnotation];
    setPdfState(prev => ({ ...prev, annotations: newAnnotations }));
    addToHistory(newAnnotations);

    // Auto-switch back to select mode after placing a shape/text (not for pen or eraser)
    if (currentTool !== 'select' && currentTool !== 'pen' && currentTool !== 'eraser') {
      setCurrentTool('select');
    }
  };

  const handleTextAnnotationSelect = (annotation: Annotation) => {
    // Sync text formatting state from selected annotation
    if (annotation.type === 'text') {
      if (annotation.fontFamily) setFontFamily(annotation.fontFamily);
      if (annotation.fontSize) setFontSize(annotation.fontSize);
      if (annotation.bold !== undefined) setTextBold(annotation.bold);
      if (annotation.italic !== undefined) setTextItalic(annotation.italic);
      if (annotation.underline !== undefined) setTextUnderline(annotation.underline);
      if (annotation.color) setCurrentColor(annotation.color);
      if (annotation.backgroundColor) setBackgroundColor(annotation.backgroundColor);
      if (annotation.textAlign) setTextAlign(annotation.textAlign);
    }
  };

  const handleImageSelect = (imageData: string) => {
    // Create an image annotation at the center of the current page
    const annotation: Omit<Annotation, 'id'> = {
      type: 'image',
      pageNumber: pdfState.currentPage,
      position: { x: 100, y: 100 },
      width: 200,
      height: 200,
      color: 'transparent',
      imageData,
    };
    handleAnnotationAdd(annotation);
    setCurrentTool('select');
  };

  const handleAnnotationUpdate = (id: string, updates: Partial<Annotation>) => {
    const newAnnotations = pdfState.annotations.map(a =>
      a.id === id ? { ...a, ...updates } : a
    );
    setPdfState(prev => ({ ...prev, annotations: newAnnotations }));
    addToHistory(newAnnotations);
  };

  const handleAnnotationDelete = (id: string) => {
    const newAnnotations = pdfState.annotations.filter(a => a.id !== id);
    setPdfState(prev => ({ ...prev, annotations: newAnnotations }));
    addToHistory(newAnnotations);
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedAnnotationId) {
      handleAnnotationDelete(selectedAnnotationId);
      toast.success('Annotation deleted');
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPdfState(prev => ({ ...prev, annotations: [...history[newIndex]] }));
      toast.success('Undo');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPdfState(prev => ({ ...prev, annotations: [...history[newIndex]] }));
      toast.success('Redo');
    }
  };

  const handleRotate = () => {
    setPdfState(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
    toast.success('Page rotated');
  };

  const handleAddPage = () => {
    toast.info('Add page feature - would open dialog to add blank or upload page');
  };

  const handleNewSession = () => {
    // Clear localStorage
    localStorage.removeItem('pdfEditorSession');

    // Reset all state
    setPdfState({
      file: null,
      numPages: 0,
      currentPage: 1,
      scale: 1.0,
      rotation: 0,
      annotations: [],
    });
    setCurrentTool('select');
    setSelectedAnnotationId(null);
    setHistory([[]]);
    setHistoryIndex(0);
    setCurrentColor('#000000');
    setStrokeWidth(2);

    toast.success('New session created');
  };

  const handleResetSession = () => {
    const savedSession = localStorage.getItem('pdfEditorSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session.fileName && session.fileData) {
          // Convert base64 back to File
          const binaryString = atob(session.fileData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const file = new File([bytes], session.fileName, { type: 'application/pdf' });

          setPdfState({
            file,
            numPages: session.numPages,
            currentPage: session.currentPage,
            scale: session.scale,
            rotation: session.rotation,
            annotations: session.annotations,
          });

          setHistory([session.annotations]);
          setHistoryIndex(0);

          toast.success('Session reset to last saved state');
        }
      } catch (error) {
        console.error('Error resetting session:', error);
        toast.error('Failed to reset session');
      }
    } else {
      toast.info('No saved session found');
    }
  };

  const handleDeletePage = async (pageNumber: number) => {
    if (!pdfState.file || pageNumber < 1 || pageNumber > pdfState.numPages) {
      toast.error('Cannot delete page');
      return;
    }

    try {
      const existingPdfBytes = await pdfState.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();

      // Remove the page at the specified index
      if (pageNumber - 1 < pages.length) {
        pdfDoc.removePage(pageNumber - 1);
      }

      // Update annotations - remove those on deleted page and adjust others
      const updatedAnnotations = pdfState.annotations
        .filter(a => a.pageNumber !== pageNumber)
        .map(a => {
          if (a.pageNumber > pageNumber) {
            return { ...a, pageNumber: a.pageNumber - 1 };
          }
          return a;
        });

      // Update PDF state
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const newFile = new File([blob], pdfState.file.name, { type: 'application/pdf' });
      const newNumPages = pdfState.numPages - 1;
      const newCurrentPage = pageNumber > newNumPages ? newNumPages : pageNumber;

      setPdfState(prev => ({
        ...prev,
        file: newFile,
        numPages: newNumPages,
        currentPage: newCurrentPage,
        annotations: updatedAnnotations,
      }));

      addToHistory(updatedAnnotations);
      toast.success(`Page ${pageNumber} deleted`);
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Failed to delete page');
    }
  };

  const handleAnnotationReorder = (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex || oldIndex < 0 || newIndex < 0 || oldIndex >= pdfState.annotations.length || newIndex >= pdfState.annotations.length) {
      return;
    }

    const newAnnotations = [...pdfState.annotations];
    const [movedAnnotation] = newAnnotations.splice(oldIndex, 1);
    newAnnotations.splice(newIndex, 0, movedAnnotation);

    setPdfState(prev => ({ ...prev, annotations: newAnnotations }));
    addToHistory(newAnnotations);
    toast.success('Layer reordered');
  };

  const handlePageReorder = async (oldIndex: number, newIndex: number) => {
    if (!pdfState.file || oldIndex === newIndex || oldIndex < 0 || newIndex < 0 || oldIndex >= pdfState.numPages || newIndex >= pdfState.numPages) {
      return;
    }

    try {
      const existingPdfBytes = await pdfState.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();

      // Get the page to move
      const pageToMove = pages[oldIndex];

      // Remove from old position
      pdfDoc.removePage(oldIndex);

      // Insert at new position
      pdfDoc.insertPage(newIndex, pageToMove);

      // Update annotations - adjust page numbers based on reordering
      const updatedAnnotations = pdfState.annotations.map(a => {
        if (a.pageNumber - 1 === oldIndex) {
          // Page that moved
          return { ...a, pageNumber: newIndex + 1 };
        } else if (oldIndex < newIndex) {
          // Moving down
          if (a.pageNumber - 1 > oldIndex && a.pageNumber - 1 <= newIndex) {
            return { ...a, pageNumber: a.pageNumber - 1 };
          }
        } else {
          // Moving up
          if (a.pageNumber - 1 < oldIndex && a.pageNumber - 1 >= newIndex) {
            return { ...a, pageNumber: a.pageNumber + 1 };
          }
        }
        return a;
      });

      // Save reordered PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const newFile = new File([blob], pdfState.file.name, { type: 'application/pdf' });

      setPdfState(prev => ({
        ...prev,
        file: newFile,
        annotations: updatedAnnotations,
      }));

      addToHistory(updatedAnnotations);
      toast.success('Pages reordered');
    } catch (error) {
      console.error('Error reordering pages:', error);
      toast.error('Failed to reorder pages');
    }
  };

  const handleExport = async () => {
    if (!pdfState.file) return;

    try {
      const existingPdfBytes = await pdfState.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();

      // Group annotations by page
      const annotationsByPage = pdfState.annotations.reduce((acc, annotation) => {
        if (!acc[annotation.pageNumber]) {
          acc[annotation.pageNumber] = [];
        }
        acc[annotation.pageNumber].push(annotation);
        return acc;
      }, {} as Record<number, Annotation[]>);

      // Draw annotations on each page
      for (const [pageNum, annotations] of Object.entries(annotationsByPage)) {
        const pageIndex = parseInt(pageNum) - 1;
        if (pageIndex >= 0 && pageIndex < pages.length) {
          const page = pages[pageIndex];
          const { height } = page.getSize();

          for (const annotation of annotations) {
            const colorMatch = annotation.color.match(/^#([0-9a-f]{6})$/i);
            const color = colorMatch
              ? rgb(
                parseInt(colorMatch[1].substr(0, 2), 16) / 255,
                parseInt(colorMatch[1].substr(2, 2), 16) / 255,
                parseInt(colorMatch[1].substr(4, 2), 16) / 255
              )
              : rgb(1, 0, 0);

            switch (annotation.type) {
              case 'text':
                if (annotation.text) {
                  page.drawText(annotation.text, {
                    x: annotation.position.x,
                    y: height - annotation.position.y - (annotation.fontSize || 16),
                    size: annotation.fontSize || 16,
                    color,
                    opacity: annotation.opacity || 1,
                  });
                }
                break;

              case 'rectangle':
                if (annotation.width && annotation.height) {
                  page.drawRectangle({
                    x: annotation.position.x,
                    y: height - annotation.position.y - annotation.height,
                    width: annotation.width,
                    height: annotation.height,
                    borderColor: color,
                    borderWidth: annotation.strokeWidth || 2,
                    opacity: annotation.opacity || 1,
                  });
                }
                break;

              case 'highlight':
                if (annotation.width && annotation.height) {
                  page.drawRectangle({
                    x: annotation.position.x,
                    y: height - annotation.position.y - annotation.height,
                    width: annotation.width,
                    height: annotation.height,
                    color,
                    opacity: 0.3,
                  });
                }
                break;

              case 'circle':
                if (annotation.width && annotation.height) {
                  page.drawEllipse({
                    x: annotation.position.x + annotation.width / 2,
                    y: height - annotation.position.y - annotation.height / 2,
                    xScale: annotation.width / 2,
                    yScale: annotation.height / 2,
                    borderColor: color,
                    borderWidth: annotation.strokeWidth || 2,
                    opacity: annotation.opacity || 1,
                  });
                }
                break;

              case 'line':
              case 'arrow':
                if (annotation.endPoint) {
                  page.drawLine({
                    start: {
                      x: annotation.position.x,
                      y: height - annotation.position.y,
                    },
                    end: {
                      x: annotation.endPoint.x,
                      y: height - annotation.endPoint.y,
                    },
                    thickness: annotation.strokeWidth || 2,
                    color,
                    opacity: annotation.opacity || 1,
                  });
                }
                break;

              case 'image':
                if (annotation.imageData && annotation.width && annotation.height) {
                  try {
                    // Extract base64 data (remove data:image/xxx;base64, prefix)
                    const base64Data = annotation.imageData.split(',')[1];
                    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                    // Determine image type and embed accordingly
                    let embeddedImage;
                    if (annotation.imageData.startsWith('data:image/png')) {
                      embeddedImage = await pdfDoc.embedPng(imageBytes);
                    } else if (annotation.imageData.startsWith('data:image/jpeg') || annotation.imageData.startsWith('data:image/jpg')) {
                      embeddedImage = await pdfDoc.embedJpg(imageBytes);
                    } else {
                      console.warn('Unsupported image format, skipping:', annotation.imageData.substring(0, 30));
                      break;
                    }

                    page.drawImage(embeddedImage, {
                      x: annotation.position.x,
                      y: height - annotation.position.y - annotation.height,
                      width: annotation.width,
                      height: annotation.height,
                      opacity: annotation.opacity || 1,
                    });
                  } catch (error) {
                    console.error('Failed to embed image:', error);
                  }
                }
                break;
            }
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited-${pdfState.file.name}`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  if (!pdfState.file) {
    return <PDFUploadZone onFileSelect={handleFileSelect} />;
  }

  console.log('PDFEditor: Rendering editor with state:', {
    file: pdfState.file?.name,
    numPages: pdfState.numPages,
    currentPage: pdfState.currentPage,
  });

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <PDFNavbar
        fileName={pdfState.file?.name || 'Untitled Document'}
        onExport={handleExport}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDeleteSelected={handleDeleteSelected}
        onAddPage={handleAddPage}
        onRotate={handleRotate}
        onNewSession={handleNewSession}
        onResetSession={handleResetSession}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        hasSelection={selectedAnnotationId !== null}
        currentPage={pdfState.currentPage}
        numPages={pdfState.numPages}
        scale={pdfState.scale}
        onPageChange={(page) => setPdfState(prev => ({ ...prev, currentPage: page }))}
        onScaleChange={(scale) => setPdfState(prev => ({ ...prev, scale }))}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <PDFToolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        onRotate={handleRotate}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDeleteSelected={handleDeleteSelected}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        hasSelection={selectedAnnotationId !== null}
        currentColor={currentColor}
        onColorChange={setCurrentColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        strokeColor={strokeColor}
        onStrokeColorChange={setStrokeColor}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        selectedAnnotationId={selectedAnnotationId}
        annotations={pdfState.annotations}
        // Text formatting props
        fontFamily={fontFamily}
        onFontFamilyChange={setFontFamily}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        textBold={textBold}
        onTextBoldChange={setTextBold}
        textItalic={textItalic}
        onTextItalicChange={setTextItalic}
        textUnderline={textUnderline}
        onTextUnderlineChange={setTextUnderline}
        backgroundColor={backgroundColor}
        onBackgroundColorChange={setBackgroundColor}
        textAlign={textAlign}
        onTextAlignChange={setTextAlign}
        onImageSelect={handleImageSelect}
      />

      <div className="flex-1 flex overflow-hidden relative w-full">
        <PDFSidebar
          file={pdfState.file}
          numPages={pdfState.numPages}
          currentPage={pdfState.currentPage}
          onPageChange={(page) => setPdfState(prev => ({ ...prev, currentPage: page }))}
          onDeletePage={handleDeletePage}
          onPageReorder={handlePageReorder}
          annotations={pdfState.annotations}
          onAnnotationUpdate={handleAnnotationUpdate}
          onDeleteAnnotation={handleAnnotationDelete}
          onAnnotationReorder={handleAnnotationReorder}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onAnnotationHover={setHoveredAnnotationId}
          onAnnotationSelect={setSelectedAnnotationId}
          selectedAnnotationId={selectedAnnotationId}
        />

        <div className={`flex-1 flex w-full transition-all duration-200 ${sidebarOpen ? 'mr-56 sm:mr-64' : 'mr-0'}`}>
          <PDFCanvas
            file={pdfState.file}
            currentPage={pdfState.currentPage}
            numPages={pdfState.numPages}
            scale={pdfState.scale}
            rotation={pdfState.rotation}
            currentTool={currentTool}
            annotations={pdfState.annotations}
            onAnnotationAdd={handleAnnotationAdd}
            onAnnotationUpdate={handleAnnotationUpdate}
            onAnnotationDelete={handleAnnotationDelete}
            onAnnotationSelect={setSelectedAnnotationId}
            onTextAnnotationSelect={handleTextAnnotationSelect}
            selectedAnnotationId={selectedAnnotationId}
            hoveredAnnotationId={hoveredAnnotationId}
            onPageChange={(page) => setPdfState(prev => ({ ...prev, currentPage: page }))}
            onNumPagesChange={(numPages) => setPdfState(prev => ({ ...prev, numPages }))}
            onScaleChange={(scale) => setPdfState(prev => ({ ...prev, scale }))}
            currentColor={currentColor}
            strokeWidth={strokeWidth}
            strokeColor={strokeColor}
            fontFamily={fontFamily}
            fontSize={fontSize}
            textBold={textBold}
            textItalic={textItalic}
            textUnderline={textUnderline}
            backgroundColor={backgroundColor}
            textAlign={textAlign}
          />
        </div>
      </div>
    </div>
  );
}
