import { Download, Undo, Redo, Trash2, Plus, RotateCw, MoreVertical, FileIcon, RotateCcw, PenLine } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PDFNavbarProps {
  fileName?: string;
  onExport: () => void;
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
}

export function PDFNavbar({
  fileName = 'Untitled Document',
  onExport,
  onUndo,
  onRedo,
  onDeleteSelected,
  onAddPage,
  onRotate,
  onNewSession,
  onResetSession,
  canUndo,
  canRedo,
  hasSelection,
}: PDFNavbarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(fileName);

  const handleNameChange = (newName: string) => {
    setDisplayName(newName);
    setIsEditingName(false);
  };

  return (
    <TooltipProvider>
      <nav className="w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50 border-b">
        <div className="flex items-start justify-between px-4 gap-4 py-3">
          {/* Left Section - Favicon and Filename + Menubar */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Favicon - 2x2 size (w-10 h-10) */}
            <div className="flex items-center justify-center w-10 h-10 rounded bg-primary/10 shrink-0">
              <FileIcon className="w-6 h-6 text-primary" />
            </div>

            {/* Filename and Menubar Column */}
            <div className="flex flex-col items-start justify-start gap-0 flex-1 min-w-0">
              {/* Filename with Edit */}
              <div className="flex items-center gap-2 min-w-0 w-full">
                {isEditingName ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onBlur={() => handleNameChange(displayName)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNameChange(displayName);
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    autoFocus
                    className="text-base font-medium text-foreground bg-transparent border-b-2 border-primary px-2 py-0 outline-none flex-1 min-w-0"
                  />
                ) : (
                  <>
                    <span className="text-base font-medium text-foreground truncate">{displayName}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingName(true)}
                          className="h-6 w-6 p-0 shrink-0 hover:bg-muted"
                        >
                          <PenLine className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Rename document</TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>

              {/* Menubar Row - Inline with Filename */}
              <div className="flex items-center gap-0.5 w-full">
                {/* File Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs px-2 py-0 h-6 hover:bg-accent">
                      File
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={onExport}>
                      <Download className="w-4 h-4 mr-2" />
                      <span>Export PDF</span>
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
                    <Button variant="ghost" size="sm" className="text-xs px-2 py-0 h-6 hover:bg-accent">
                      Edit
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={onUndo} disabled={!canUndo}>
                      <Undo className="w-4 h-4 mr-2" />
                      <span>Undo</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onRedo} disabled={!canRedo}>
                      <Redo className="w-4 h-4 mr-2" />
                      <span>Redo</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDeleteSelected} disabled={!hasSelection}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      <span>Delete Selected</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Page Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs px-2 py-0 h-6 hover:bg-accent">
                      Page
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={onAddPage}>
                      <Plus className="w-4 h-4 mr-2" />
                      <span>Add Page</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onRotate}>
                      <RotateCw className="w-4 h-4 mr-2" />
                      <span>Rotate Page</span>
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
                    variant="ghost"
                    size="sm"
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="h-8 w-8 px-1"
                  >
                    <Undo className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="h-8 w-8 px-1"
                  >
                    <Redo className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onExport}
                    className="h-8 px-3 text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export as PDF</TooltipContent>
              </Tooltip>
            </div>

            {/* More Menu */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 px-1">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>More options</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onExport}>
                  <Download className="w-4 h-4 mr-2" />
                  <span>Export PDF</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onUndo} disabled={!canUndo}>
                  <Undo className="w-4 h-4 mr-2" />
                  <span>Undo</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRedo} disabled={!canRedo}>
                  <Redo className="w-4 h-4 mr-2" />
                  <span>Redo</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onAddPage}>
                  <Plus className="w-4 h-4 mr-2" />
                  <span>Add Page</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRotate}>
                  <RotateCw className="w-4 h-4 mr-2" />
                  <span>Rotate Page</span>
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
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}
