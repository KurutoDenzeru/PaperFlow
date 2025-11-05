import { Download, Undo, Redo, Trash2, Plus, RotateCw, MoreVertical, FileIcon, RotateCcw } from 'lucide-react';
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
  return (
    <TooltipProvider>
      <nav className="w-full h-16 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50 flex items-center justify-between px-4 gap-4">
        {/* Left Section - Logo and Title */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          {/* Favicon */}
          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10">
            <FileIcon className="w-5 h-5 text-primary" />
          </div>

          {/* App Name and Document Title */}
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm font-semibold text-foreground truncate">PaperFlow</h1>
            <p className="text-xs text-muted-foreground truncate max-w-xs">{fileName}</p>
          </div>
        </div>

        {/* Middle Section - File Menu */}
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-sm">
                    File
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>File operations</TooltipContent>
            </Tooltip>
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

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-sm">
                    Edit
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Edit operations</TooltipContent>
            </Tooltip>
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

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-sm">
                    Page
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Page operations</TooltipContent>
            </Tooltip>
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

        {/* Right Section - Quick Actions and More Menu */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          {/* Desktop Quick Actions */}
          <div className="hidden md:flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="h-9 w-9 px-1"
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
                  className="h-9 w-9 px-1"
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
                  className="h-9 px-3 text-sm"
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
                  <Button variant="ghost" size="sm" className="h-9 w-9 md:h-9 md:w-9 px-1">
                    <MoreVertical className="w-5 h-5" />
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
      </nav>
    </TooltipProvider>
  );
}
