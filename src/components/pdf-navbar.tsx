import { Download, Undo, Redo, Trash2, RotateCw, FileIcon, RotateCcw, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Grid3x3, HelpCircle, Info } from 'lucide-react';
import { useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import HowToDialog from './howto-dialog';
import AboutDialog from './about-dialog';
import { ExportDialog } from './export-dialog';
import type { ExportOptions } from '@/types/pdf';

interface PDFNavbarProps {
  fileName?: string;
  onExport: (options?: ExportOptions) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelected: () => void;
  onAddPage: () => void;
  onRotate: () => void;
  onNewSession: () => void;
  onResetSession: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  currentPage?: number;
  numPages?: number;
  scale?: number;
  onPageChange?: (page: number) => void;
  onScaleChange?: (scale: number) => void;
  viewMode?: 'single' | 'multiple';
  onViewModeChange?: (mode: 'single' | 'multiple') => void;
}

export function PDFNavbar({
  fileName = 'Untitled Document',
  onExport,
  onUndo,
  onRedo,
  onDeleteSelected,
  onAddPage: _onAddPage,
  onRotate,
  onNewSession,
  onResetSession,
  canUndo,
  canRedo,
  hasSelection,
  currentPage = 1,
  numPages = 0,
  scale = 1.0,
  onPageChange,
  onScaleChange,
  viewMode = 'single',
  onViewModeChange,
}: PDFNavbarProps) {
  const MIN_SCALE = 0.4;
  const [howToOpen, setHowToOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  // Remove one or more trailing extensions from the display name (e.g. `.pdf`, `.pdf.pdf`, `.tar.gz`)
  const cleanFileName = fileName ? fileName.replace(/(\.[^.]+)+$/g, '') : fileName;

  return (
    <TooltipProvider>
      <nav className="w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50 border-b">
        <div className="flex items-start justify-between px-4 gap-2 py-1.5">
          {/* Left Section - Favicon and Filename + Menubar */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Favicon - 2x2 size (w-10 h-10) */}
            <div className="flex items-center justify-center w-10 h-10 rounded bg-primary/10 shrink-0">
              <FileIcon className="w-6 h-6 text-primary" />
            </div>

            {/* Filename and Menubar Column */}
            <div className="flex flex-col items-start justify-start gap-0 flex-1 min-w-0">
              {/* Filename Display */}
              <div className="flex items-center gap-2 min-w-0 w-full">
                <span className="text-base font-medium text-foreground truncate">{cleanFileName}</span>
              </div>

              {/* Menubar Row - Inline with Filename */}
              <div className="flex items-center gap-0.5 w-full">
                {/* File Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-sm px-2 py-0 h-6 hover:bg-accent">
                      File
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuItem onClick={() => setExportOpen(true)}>
                      <Download className="w-4 h-4 mr-2" />
                        <span>Export</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onNewSession}>
                      <FileIcon className="w-4 h-4 mr-2" />
                      <span>New Session</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onResetSession}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      <span>Reset Session</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Edit Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-sm px-2 py-0 h-6 hover:bg-accent">
                      Edit
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={onUndo} disabled={!canUndo} className="justify-between">
                      <div className="flex items-center">
                        <Undo className="w-4 h-4 mr-2" />
                        <span>Undo</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">{typeof window !== 'undefined' && navigator.platform.includes('Mac') ? '⌘Z' : 'Ctrl+Z'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onRedo} disabled={!canRedo} className="justify-between">
                      <div className="flex items-center">
                        <Redo className="w-4 h-4 mr-2" />
                        <span>Redo</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">{typeof window !== 'undefined' && navigator.platform.includes('Mac') ? '⌘⇧Z' : 'Ctrl+Shift+Z'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDeleteSelected} disabled={!hasSelection}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      <span>Delete Selected</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Page menu removed: Add Page moved/hidden; Rotate Page moved to View menu */}

                {/* View Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-sm px-2 py-0 h-6 hover:bg-accent">
                      View
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {/* Page Navigation */}
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Page Navigation</p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                          disabled={currentPage <= 1}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium flex-1 text-center">{currentPage}/{numPages}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPageChange?.(Math.min(numPages, currentPage + 1))}
                          disabled={currentPage >= numPages}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <DropdownMenuSeparator />

                    {/* Zoom Controls */}
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Zoom</p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onScaleChange?.(Math.max(MIN_SCALE, scale - 0.1))}
                          disabled={scale <= MIN_SCALE}
                          className="h-8 w-8 p-0"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium flex-1 text-center">{Math.round(scale * 100)}%</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onScaleChange?.(Math.min(2, scale + 0.1))}
                          disabled={scale >= 2}
                          className="h-8 w-8 p-0"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <DropdownMenuSeparator />

                    {/* View Mode */}
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">View Mode</p>
                      <div className="flex gap-1">
                        <Button
                          variant={viewMode === 'single' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onViewModeChange?.('single')}
                          className="flex-1"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Single
                        </Button>
                        <Button
                          variant={viewMode === 'multiple' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onViewModeChange?.('multiple')}
                          className="flex-1"
                        >
                          <Grid3x3 className="w-4 h-4 mr-2" />
                          Multiple
                        </Button>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onRotate}>
                      <RotateCw className="w-4 h-4 mr-2" />
                      <span>Rotate Page</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                  {/* Help Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-sm px-2 py-0 h-6 hover:bg-accent">
                        Help
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuItem onClick={() => setHowToOpen(true)}>
                        <HelpCircle className="w-4 h-4 mr-2" />
                        <span>How to use</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAboutOpen(true)}>
                        <Info className="w-4 h-4 mr-2" />
                        <span>About</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-1 shrink-0 pt-1">
            {/* Desktop Quick Actions */}
              <div className="hidden md:flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExportOpen(true)}
                      className="h-8 px-3 text-sm"
                    >
                    <Download className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export</TooltipContent>
              </Tooltip>
            </div>

            {/* More Menu removed — replaced by Export quick action */}
            {/* Render dialogs here so they sit near the navbar root */}
            <HowToDialog open={howToOpen} onOpenChange={setHowToOpen} />
            <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
            <ExportDialog open={exportOpen} onOpenChange={setExportOpen} onExport={onExport} fileName={fileName} numPages={numPages} currentPage={currentPage} />
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}
