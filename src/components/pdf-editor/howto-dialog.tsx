import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, HelpCircle } from 'lucide-react';

interface HowToDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HowToDialog({ open, onOpenChange }: HowToDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><HelpCircle className="w-5 h-5" />How to use PaperFlow</DialogTitle>
          <DialogDescription>
            A quick guide on how to use the editor and annotation tools.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Upload a PDF or drag files into the editor.</li>
            <li>Select tools from the toolbar (Text, Image, Shapes, Highlight, Signature).</li>
            <li>To add a signature, click Signature and choose Upload or Draw.</li>
            <li>Drag to move annotations; use handles to resize and rotate.</li>
            <li>Use the Layers tab to manage annotation visibility and order.</li>
            <li>Export your PDF using File → Export PDF or the Export button.</li>
          </ol>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4 mr-2" /> Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default HowToDialog;
