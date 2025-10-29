import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, GripVertical, Trash2 } from 'lucide-react';
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
  annotations,
  onDeleteAnnotation,
  isOpen,
  onToggle,
}: PDFSidebarProps) {
  const [activeTab, setActiveTab] = useState('pages');

  if (!isOpen) {
    return (
      <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="h-20 rounded-l-none rounded-r-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-background border-r z-40">
      <div className="flex items-center justify-between p-2 border-b">
        <h3 className="font-semibold text-sm">Sidebar</h3>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100%-3rem)]">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="layers">Layers</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="h-[calc(100%-3rem)] mt-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-2">
              {file && Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => (
                <div
                  key={pageNumber}
                  className={`
                    relative group cursor-pointer rounded-lg border-2 overflow-hidden
                    transition-all hover:shadow-md
                    ${currentPage === pageNumber 
                      ? 'border-primary shadow-lg' 
                      : 'border-transparent hover:border-primary/50'
                    }
                  `}
                  onClick={() => onPageChange(pageNumber)}
                >
                  <div className="aspect-[8.5/11] bg-muted flex items-center justify-center">
                    <Document file={file}>
                      <Page
                        pageNumber={pageNumber}
                        width={220}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur p-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium">Page {pageNumber}</span>
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
              ))}
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
                          <p className="text-xs text-muted-foreground">
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
