import { useState } from 'react';
import { Download, Image, FileIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import type { ExportOptions, ExportFormat, ExportScope } from '@/types/pdf';


interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => void;
  defaultFormat?: ExportFormat;
}

export function ExportDialog({ open, onOpenChange, onExport, defaultFormat = 'pdf' }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);
  const [scope, setScope] = useState<ExportScope>('all');
  const [quality, setQuality] = useState<number>(0.92);

  const handleExport = () => {
    onExport({ format, scope, quality });
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
            <p className="text-sm font-medium mb-1">Format</p>
            <div className="flex gap-2">
              <button
                type="button"
                className={`rounded-lg px-3 py-2 border ${format === 'pdf' ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
                onClick={() => setFormat('pdf')}
              >
                <FileIcon className="w-4 h-4 mr-2 inline" /> PDF
              </button>

              <button
                type="button"
                className={`rounded-lg px-3 py-2 border ${format === 'png' ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
                onClick={() => setFormat('png')}
              >
                <Image className="w-4 h-4 mr-2 inline" /> PNG
              </button>

              <button
                type="button"
                className={`rounded-lg px-3 py-2 border ${format === 'jpeg' ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
                onClick={() => setFormat('jpeg')}
              >
                <Image className="w-4 h-4 mr-2 inline" /> JPEG
              </button>

              <button
                type="button"
                className={`rounded-lg px-3 py-2 border ${format === 'webp' ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
                onClick={() => setFormat('webp')}
              >
                <Image className="w-4 h-4 mr-2 inline" /> WebP
              </button>
            </div>
          </div>

          {(format === 'png' || format === 'jpeg' || format === 'webp') && (
            <div>
              <p className="text-sm font-medium mb-1">Image quality</p>
              <div className="flex items-center gap-3">
                <Select value={quality.toString()} onValueChange={(val) => setQuality(parseFloat(val))}>
                  <SelectTrigger className="w-40 h-9">
                    <span>{Math.round(quality * 100)}%</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.6">60%</SelectItem>
                    <SelectItem value="0.7">70%</SelectItem>
                    <SelectItem value="0.8">80%</SelectItem>
                    <SelectItem value="0.9">90%</SelectItem>
                    <SelectItem value="0.92">92%</SelectItem>
                    <SelectItem value="1.0">100%</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Higher quality = larger file size</p>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-1">Scope</p>
            <div className="flex gap-2">
              <button
                type="button"
                className={`rounded-lg px-3 py-2 border ${scope === 'all' ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
                onClick={() => setScope('all')}
              >
                All pages
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-2 border ${scope === 'current' ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
                onClick={() => setScope('current')}
              >
                Current page
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleExport} className="flex-1">
              Export
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
