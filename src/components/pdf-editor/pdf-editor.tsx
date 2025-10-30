import { useState, useCallback } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import { toast } from 'sonner';
import { PDFUploadZone } from './pdf-upload-zone';
import { PDFToolbar } from './pdf-toolbar';
import { PDFSidebar } from './pdf-sidebar';
import { PDFCanvas } from './pdf-canvas';
import type { Tool, Annotation, PDFState } from '@/types/pdf';

export function PDFEditor() {
  const [pdfState, setPdfState] = useState<PDFState>({
    file: null,
    numPages: 0,
    currentPage: 1,
    scale: 1.5,
    rotation: 0,
    annotations: [],
  });

  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentColor, setCurrentColor] = useState('#FF0000');
  const [strokeWidth, setStrokeWidth] = useState(2);

  const addToHistory = useCallback((annotations: Annotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...annotations]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

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

  const handleAnnotationAdd = (annotation: Omit<Annotation, 'id'>) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: `annotation-${Date.now()}-${Math.random()}`,
    };
    const newAnnotations = [...pdfState.annotations, newAnnotation];
    setPdfState(prev => ({ ...prev, annotations: newAnnotations }));
    addToHistory(newAnnotations);
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

  const handleDeletePage = (pageNumber: number) => {
    toast.info(`Delete page ${pageNumber} - would remove page and adjust annotations`);
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
      <PDFToolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        scale={pdfState.scale}
        onScaleChange={(scale) => setPdfState(prev => ({ ...prev, scale }))}
        onRotate={handleRotate}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExport}
        onDeleteSelected={handleDeleteSelected}
        onAddPage={handleAddPage}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        hasSelection={selectedAnnotationId !== null}
        currentColor={currentColor}
        onColorChange={setCurrentColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden relative w-full">
        <PDFSidebar
          file={pdfState.file}
          numPages={pdfState.numPages}
          currentPage={pdfState.currentPage}
          onPageChange={(page) => setPdfState(prev => ({ ...prev, currentPage: page }))}
          onDeletePage={handleDeletePage}
          annotations={pdfState.annotations}
          onDeleteAnnotation={handleAnnotationDelete}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
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
            onAnnotationSelect={setSelectedAnnotationId}
            selectedAnnotationId={selectedAnnotationId}
            onPageChange={(page) => setPdfState(prev => ({ ...prev, currentPage: page }))}
            onNumPagesChange={(numPages) => setPdfState(prev => ({ ...prev, numPages }))}
            currentColor={currentColor}
            strokeWidth={strokeWidth}
          />
        </div>
      </div>
    </div>
  );
}
