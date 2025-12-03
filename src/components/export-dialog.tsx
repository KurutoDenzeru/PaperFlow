import { useState, useEffect } from 'react';
import { Download, Image, FileIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// No select required - image quality removed
import type { ExportOptions, ExportFormat, ExportScope } from '@/types/pdf';


interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => void;
  defaultFormat?: ExportFormat;
  fileName?: string;
}

export function ExportDialog({ open, onOpenChange, onExport, defaultFormat = 'pdf', fileName }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);
  const [scope, setScope] = useState<ExportScope>('all');
  // Quality is fixed to 100% (1.0) per request
  const [quality] = useState<number>(1.0);
  const [fileNameState, setFileNameState] = useState<string>(() => {
    if (!fileName) return '';
    // Remove extension so we append correct one later
    return fileName.replace(/\.pdf$/i, '');
  });

  // Sync fileName prop to state when it changes
  useEffect(() => {
    if (fileName) setFileNameState(fileName.replace(/\.pdf$/i, ''));
  }, [fileName]);

  const handleExport = () => {
    // Determine download name (include extension)
    const defaultName = fileNameState || 'export';
    const ext = format === 'pdf' ? '.pdf' : `.${format}`;
    const hasExt = /\.[a-z0-9]+$/i.test(defaultName);
    const downloadName = hasExt ? defaultName : `${defaultName}${ext}`;

    onExport({ format, scope, quality, downloadName });
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
            <Input value={fileNameState} onChange={(e) => setFileNameState(e.target.value)} placeholder={fileName || 'Untitled Document'} />
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
            <div className="flex gap-2">
              <Button
                variant={scope === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScope('all')}
                className="rounded-lg px-3 py-2"
              >
                All pages
              </Button>
              <Button
                variant={scope === 'current' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScope('current')}
                className="rounded-lg px-3 py-2"
              >
                Current page
              </Button>
            </div>
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
