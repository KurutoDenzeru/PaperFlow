import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronRight, GripVertical, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Annotation } from '@/types/pdf';

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
  onDeleteAnnotation: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function PDFSidebar({
  file,
  numPages,
  currentPage,
  onPageChange,
  onDeletePage,
  onPageReorder,
  annotations,
  onDeleteAnnotation,
  isOpen,
  onToggle,
}: PDFSidebarProps) {
  const [activeTab, setActiveTab] = useState('pages');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [draggedPageNumber, setDraggedPageNumber] = useState<number | null>(null);
  const [dragOverPageNumber, setDragOverPageNumber] = useState<number | null>(null);

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
                  {annotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent group"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-4 h-4 rounded border shrink-0"
                          style={{ backgroundColor: annotation.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1)}
                          </p>
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
