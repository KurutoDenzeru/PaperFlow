import { useState, useEffect } from 'react';
import { Download, Image, FileIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ExportOptions, ExportFormat, ExportScope } from '@/types/pdf';


interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => void;
  defaultFormat?: ExportFormat;
  fileName?: string;
  numPages?: number;
  currentPage?: number;
}

export function ExportDialog({ open, onOpenChange, onExport, defaultFormat = 'pdf', fileName, numPages = 1, currentPage = 1 }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);
  const [scope, setScope] = useState<ExportScope>('all');
  const [selectedPage, setSelectedPage] = useState<number>(currentPage);
  // Quality is fixed to 100% (1.0) per request
  const [quality] = useState<number>(1.0);
  const stripTrailingExtensions = (name?: string) => {
    if (!name) return '';
    // Remove one or more trailing extensions (e.g. `.pdf` or `.pdf.pdf` or `.tar.gz`)
    return name.replace(/(\.[^.]+)+$/g, '');
  };

  const [fileNameState, setFileNameState] = useState<string>(() => stripTrailingExtensions(fileName));

  // Sync fileName prop to state when it changes
  useEffect(() => {
    if (fileName) setFileNameState(stripTrailingExtensions(fileName));
  }, [fileName]);

  // Only show the base name (no extension) in the placeholder
  const computedBaseName = fileNameState || stripTrailingExtensions(fileName) || 'Untitled Document';
  const placeholderWithExt = computedBaseName;

  const handleExport = () => {
    // Determine download name (include extension)
    const defaultName = fileNameState || 'export';
    const ext = format === 'pdf' ? '.pdf' : `.${format}`;
    const hasExt = /\.[a-z0-9]+$/i.test(defaultName);
    const downloadName = hasExt ? defaultName : `${defaultName}${ext}`;

    // If current page is selected, override scope with page number
    const finalScope: ExportScope = scope === 'current' ? `page-${selectedPage}` as ExportScope : 'all';
    onExport({ format, scope: finalScope, quality, downloadName });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export
          </DialogTitle>
          <DialogDescription>Choose how to export your document</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">File name</label>
            <Input
              value={fileNameState}
              onChange={(e) => setFileNameState(stripTrailingExtensions(e.target.value))}
              placeholder={placeholderWithExt}
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Format</p>
            <div className="flex gap-2">
              <Button
                variant={format === 'pdf' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat('pdf')}
                className="rounded-lg px-3 py-2"
              >
                <FileIcon className="w-4 h-4 mr-2 inline" /> PDF
              </Button>

              <Button
                variant={format === 'png' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat('png')}
                className="rounded-lg px-3 py-2"
              >
                <Image className="w-4 h-4 mr-2 inline" /> PNG
              </Button>

              <Button
                variant={format === 'jpeg' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat('jpeg')}
                className="rounded-lg px-3 py-2"
              >
                <Image className="w-4 h-4 mr-2 inline" /> JPEG
              </Button>

              <Button
                variant={format === 'webp' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat('webp')}
                className="rounded-lg px-3 py-2"
              >
                <Image className="w-4 h-4 mr-2 inline" /> WebP
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-1">Scope</p>
            <Tabs value={scope} onValueChange={(value) => setScope(value as ExportScope)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">All pages</TabsTrigger>
                <TabsTrigger value="current">Current page</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <div className="text-sm text-muted-foreground">
                  Pages 1 - {numPages}
                </div>
              </TabsContent>
              
              <TabsContent value="current" className="mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Export page:</span>
                  <Select value={selectedPage.toString()} onValueChange={(value) => setSelectedPage(parseInt(value))}>
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
                        <SelectItem key={page} value={page.toString()}>
                          {page}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="outline" onClick={handleExport} className="flex-1">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
