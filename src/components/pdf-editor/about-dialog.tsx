import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Instagram, X, Info } from 'lucide-react';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Info className="w-5 h-5"/>About PaperFlow</DialogTitle>
          <DialogDescription>
            Lightweight React + TypeScript PDF editor using react-pdf (pdf.js), Tailwind, and shadcn/ui; ideal for responsive interfaces and quick PDF workflows.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">

          <div>
            <p className="font-semibold">Tech Stack:</p>
            <ul className="list-disc pl-5">
              <li>React + TypeScript</li>
              <li>Tailwind CSS</li>
              <li>shadcn/ui components</li>
              <li>lucide-react icons</li>
              <li>react-pdf (pdf.js)</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold">Project Links:</p>
            <div className="flex items-center gap-2 mt-2">
              <Button variant="outline" asChild>
                <a href="https://github.com/KurutoDenzeru/PaperFlow" target="_blank" rel="noreferrer">
                  <Github className="w-4 h-4 mr-2" /> GitHub
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://www.linkedin.com/in/kurtcalacday/" target="_blank" rel="noreferrer">
                  <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://www.instagram.com/krtclcdy/" target="_blank" rel="noreferrer">
                  <Instagram className="w-4 h-4 mr-2" /> Instagram
                </a>
              </Button>
            </div>
          </div>

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

export default AboutDialog;
