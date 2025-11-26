import { useState, useEffect } from 'react';
import type { Annotation } from '@/types/pdf';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronRight, GripVertical, Trash2, FileText, Pencil, Check, X, Type, Square, Circle, Minus, MoveRight, Highlighter, Pen, Eraser, Image as ImageIcon } from 'lucide-react';

// Components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Set worker for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFSidebarProps {
  file: File | null;
  numPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onDeletePage: (page: number) => void;
  onPageReorder: (oldIndex: number, newIndex: number) => void;
  annotations: Annotation[];
  onAnnotationUpdate: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  onAnnotationReorder: (oldIndex: number, newIndex: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  onAnnotationHover?: (id: string | null) => void;
  onAnnotationSelect?: (id: string) => void;
}

export function PDFSidebar({
  file,
  numPages,
  currentPage,
  onPageChange,
  onDeletePage,
  onPageReorder,
  annotations,
  onAnnotationUpdate,
  onDeleteAnnotation,
  onAnnotationReorder,
  isOpen,
  onToggle,
  onAnnotationHover,
  onAnnotationSelect,
}: PDFSidebarProps) {
  const [activeTab, setActiveTab] = useState('pages');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [draggedPageNumber, setDraggedPageNumber] = useState<number | null>(null);
  const [dragOverPageNumber, setDragOverPageNumber] = useState<number | null>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [draggedAnnotationId, setDraggedAnnotationId] = useState<string | null>(null);
  const [dragOverAnnotationId, setDragOverAnnotationId] = useState<string | null>(null);

  // Create URL from file when file changes
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      console.log('PDFSidebar: Created file URL:', url);
      setFileUrl(url);
      return () => {
        console.log('PDFSidebar: Revoking file URL');
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Type className="w-4 h-4" />;
      case 'rectangle':
        return <Square className="w-4 h-4" />;
      case 'circle':
        return <Circle className="w-4 h-4" />;
      case 'line':
        return <Minus className="w-4 h-4" />;
      case 'arrow':
        return <MoveRight className="w-4 h-4" />;
      case 'highlight':
        return <Highlighter className="w-4 h-4" />;
      case 'pen':
        return <Pen className="w-4 h-4" />;
      case 'eraser':
        return <Eraser className="w-4 h-4" />;
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`fixed right-0 top-[--navbar-height] w-56 sm:w-64 h-[calc(100vh-var(--navbar-height))] bg-background border-l z-40 flex flex-col overflow-hidden`}
    >
      <div className="flex items-center justify-between p-2 border-b shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 shrink-0" />
          <h3 className="font-semibold text-sm sm:text-sm truncate">Document Details</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggle} className="h-7 w-7 shrink-0">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex p-1 flex-col overflow-hidden">
        <TabsList className="w-full grid grid-cols-2 shrink-0 text-sm sm:text-sm">
          <TabsTrigger value="pages" className="text-sm">Pages</TabsTrigger>
          <TabsTrigger value="layers" className="text-sm">Layers</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full w-full">
            <div className="p-0.5 sm:p-3 space-y-2 sm:space-y-2">
              {!file || !fileUrl ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Loading PDF...
                </div>
              ) : numPages === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Loading pages...
                </div>
              ) : (
                Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => {
                  console.log('Rendering sidebar page:', pageNumber, 'of', numPages);
                  return (
                    <div
                      key={pageNumber}
                      draggable
                      onDragStart={() => setDraggedPageNumber(pageNumber)}
                      onDragEnd={() => {
                        setDraggedPageNumber(null);
                        setDragOverPageNumber(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverPageNumber(pageNumber);
                      }}
                      onDragLeave={() => setDragOverPageNumber(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedPageNumber && draggedPageNumber !== pageNumber) {
                          onPageReorder(draggedPageNumber - 1, pageNumber - 1);
                          setDraggedPageNumber(null);
                          setDragOverPageNumber(null);
                        }
                      }}
                      className={`
                    relative group cursor-pointer rounded-lg border-2 overflow-hidden
                    transition-all hover:shadow-md
                    ${draggedPageNumber === pageNumber ? 'opacity-50 border-primary' : ''}
                    ${currentPage === pageNumber
                          ? 'border-red-500 shadow-lg'
                          : dragOverPageNumber === pageNumber && draggedPageNumber !== pageNumber
                          ? 'border-2 border-primary/70 bg-primary/5 ring-2 ring-primary/30'
                          : 'border-transparent hover:border-primary/50'
                        }
                  `}
                      onClick={() => onPageChange(pageNumber)}
                    >
                      <div className="aspect-[8.5/11] bg-muted flex items-center justify-center">
                        <Document file={fileUrl}>
                          <Page
                            pageNumber={pageNumber}
                            width={200}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                          />
                        </Document>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur p-1 flex items-center justify-between">
                        <span className="text-sm font-medium">Page {pageNumber}</span>
                        {numPages > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePage(pageNumber);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="layers" className="h-[calc(100%-3rem)] mt-0">
          <ScrollArea className="h-full">
            <div className="p-2">
              {annotations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No annotations yet
                </div>
              ) : (
                <div className="space-y-1">
                  {annotations.map((annotation, index) => (
                    <div
                      key={annotation.id}
                      draggable
                      onDragStart={() => setDraggedAnnotationId(annotation.id)}
                      onDragEnd={() => {
                        setDraggedAnnotationId(null);
                        setDragOverAnnotationId(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverAnnotationId(annotation.id);
                      }}
                      onDragLeave={() => setDragOverAnnotationId(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedAnnotationId && draggedAnnotationId !== annotation.id) {
                          const oldIndex = annotations.findIndex(a => a.id === draggedAnnotationId);
                          const newIndex = index;
                          onAnnotationReorder(oldIndex, newIndex);
                          setDraggedAnnotationId(null);
                          setDragOverAnnotationId(null);
                        }
                      }}
                      onMouseEnter={() => onAnnotationHover?.(annotation.id)}
                      onMouseLeave={() => onAnnotationHover?.(null)}
                      onClick={() => {
                        if (editingLayerId !== annotation.id && !draggedAnnotationId) {
                          onAnnotationSelect?.(annotation.id);
                        }
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg hover:bg-accent group transition-all cursor-move ${
                        draggedAnnotationId === annotation.id ? 'opacity-50 border-2 border-primary' : ''
                      } ${
                        dragOverAnnotationId === annotation.id && draggedAnnotationId !== annotation.id
                          ? 'border-2 border-primary/70 bg-primary/5 ring-2 ring-primary/30'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="cursor-move shrink-0">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-muted-foreground shrink-0">
                          {getAnnotationIcon(annotation.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingLayerId === annotation.id ? (
                            <div className="flex items-center gap-1 mb-1">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="h-7 text-xs px-1"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    onAnnotationUpdate(annotation.id, { name: editingName });
                                    setEditingLayerId(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingLayerId(null);
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAnnotationUpdate(annotation.id, { name: editingName });
                                  setEditingLayerId(null);
                                }}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingLayerId(null);
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/name">
                              <p 
                                className="text-sm font-medium truncate cursor-pointer"
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setEditingLayerId(annotation.id);
                                  setEditingName(annotation.name || annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1));
                                }}
                              >
                                {annotation.name || annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1)}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 opacity-0 group-hover/name:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingLayerId(annotation.id);
                                  setEditingName(annotation.name || annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1));
                                }}
                              >
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                              </Button>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Page {annotation.pageNumber}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => onDeleteAnnotation(annotation.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
