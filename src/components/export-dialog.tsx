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
