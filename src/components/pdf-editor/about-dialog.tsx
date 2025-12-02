import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Instagram, ExternalLink, X } from 'lucide-react';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>About PaperFlow</DialogTitle>
          <DialogDescription>
            Project details, tech stack and social links.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold">PaperFlow</p>
            <p className="text-muted-foreground">A lightweight PDF editor for annotating and signing PDF documents.</p>
          </div>

          <div>
            <p className="font-semibold">Tech Stack</p>
            <ul className="list-disc pl-5">
              <li>React + TypeScript</li>
              <li>Tailwind CSS</li>
              <li>shadcn/ui components</li>
              <li>lucide-react icons</li>
              <li>react-pdf (pdf.js)</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold">Project Links</p>
            <div className="flex items-center gap-2 mt-2">
              <Button variant="ghost" asChild>
                <a href="https://github.com/KurutoDenzeru/PaperFlow" target="_blank" rel="noreferrer">
                  <Github className="w-4 h-4 mr-2" /> GitHub
                </a>
              </Button>
              <Button variant="ghost" asChild>
                <a href="https://www.linkedin.com/in/your-profile" target="_blank" rel="noreferrer">
                  <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                </a>
              </Button>
              <Button variant="ghost" asChild>
                <a href="https://www.instagram.com/your-profile" target="_blank" rel="noreferrer">
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
