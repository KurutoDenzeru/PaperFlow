import {
  MousePointer2,
  Type,
  Square,
  Circle,
  Minus,
  MoveRight,
  Highlighter,
  Pen,
  Eraser,
  Undo,
  Redo,
  RotateCw,
  Download,
  Trash2,
  Plus,
  Palette,
  MoreHorizontal,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Tool } from '@/types/pdf';

interface PDFToolbarProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  onRotate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onDeleteSelected: () => void;
  onAddPage: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  currentColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  sidebarOpen?: boolean;
}

const colors = [
  '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
  '#800080', '#008000', '#FFC0CB', '#A52A2A'
];

export function PDFToolbar({
  currentTool,
  onToolChange,
  scale,
  onScaleChange,
  onRotate,
  onUndo,
  onRedo,
  onExport,
  onDeleteSelected,
  onAddPage,
  canUndo,
  canRedo,
  hasSelection,
  currentColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  sidebarOpen = true,
}: PDFToolbarProps) {
  const tools: { tool: Tool; icon: React.ReactNode; label: string }[] = [
    { tool: 'select', icon: <MousePointer2 className="w-4 h-4" />, label: 'Select' },
    { tool: 'text', icon: <Type className="w-4 h-4" />, label: 'Text' },
    { tool: 'rectangle', icon: <Square className="w-4 h-4" />, label: 'Rectangle' },
    { tool: 'circle', icon: <Circle className="w-4 h-4" />, label: 'Circle' },
    { tool: 'line', icon: <Minus className="w-4 h-4" />, label: 'Line' },
    { tool: 'arrow', icon: <MoveRight className="w-4 h-4" />, label: 'Arrow' },
    { tool: 'highlight', icon: <Highlighter className="w-4 h-4" />, label: 'Highlight' },
    { tool: 'pen', icon: <Pen className="w-4 h-4" />, label: 'Pen' },
    { tool: 'eraser', icon: <Eraser className="w-4 h-4" />, label: 'Eraser' },
  ];

  return (
    <TooltipProvider>
      {/* Main Toolbar */}
      <div className={`w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-[88px] z-50 transition-all ${sidebarOpen ? 'sm:mr-0' : 'mr-0'}`}>
        <div className="flex items-center justify-between px-2 md:px-4 py-2 gap-1 md:gap-2 overflow-x-auto">
          {/* Drawing Tools - ToggleGroup */}
          <ToggleGroup
            type="single"
            value={currentTool}
            onValueChange={(value) => {
              if (value) onToolChange(value as Tool);
            }}
            className="flex items-center gap-0.5 md:gap-1 shrink-0"
          >
            {tools.map(({ tool, icon, label }) => (
              <Tooltip key={tool}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value={tool}
                    size="sm"
                    className="h-8 w-8 md:h-9 md:w-9 px-1"
                  >
                    {icon}
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent className="hidden sm:block">{label}</TooltipContent>
              </Tooltip>
            ))}
          </ToggleGroup>

          <Separator orientation="vertical" className="h-6 md:h-8 shrink-0 hidden sm:block" />

          {/* Color Picker */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-8 md:h-9 px-2 shrink-0">
                    <Palette className="w-4 h-4 shrink-0" />
                    <div
                      className="w-3 h-3 md:w-4 md:h-4 rounded border shrink-0"
                      style={{ backgroundColor: currentColor }}
                    />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent className="hidden sm:block">Color</TooltipContent>
            </Tooltip>
            <DropdownMenuContent className="w-48">
              <div className="grid grid-cols-6 gap-2 p-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: color === currentColor ? '#000' : 'transparent'
                    }}
                    onClick={() => onColorChange(color)}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Stroke Width */}
          <div className="hidden md:flex items-center gap-2 px-2 shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Width:</span>
            <Slider
              value={[strokeWidth]}
              onValueChange={(value) => onStrokeWidthChange(value[0])}
              min={1}
              max={10}
              step={1}
              className="w-20"
            />
            <span className="text-xs w-4">{strokeWidth}</span>
          </div>

          <Separator orientation="vertical" className="h-6 md:h-8 shrink-0 hidden md:block" />

          {/* History */}
          <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="h-8 w-8 md:h-9 md:w-9 px-1"
                >
                  <Undo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="hidden sm:block">Undo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="h-8 w-8 md:h-9 md:w-9 px-1"
                >
                  <Redo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="hidden sm:block">Redo</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 md:h-8 shrink-0 hidden md:block" />

          {/* Page Actions - Hidden on small screens */}
          <div className="hidden md:flex items-center gap-0.5 md:gap-1 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onAddPage} className="h-8 w-8 md:h-9 md:w-9 px-1">
                  <Plus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="hidden sm:block">Add Page</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onRotate} className="h-8 w-8 md:h-9 md:w-9 px-1">
                  <RotateCw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="hidden sm:block">Rotate</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDeleteSelected}
                  disabled={!hasSelection}
                  className="h-8 w-8 md:h-9 md:w-9 px-1"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="hidden sm:block">Delete</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 md:h-8 shrink-0 hidden md:block" />

          {/* Export - Always visible */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="default" size="sm" onClick={onExport} className="h-8 px-2 md:px-3 shrink-0 text-xs md:text-sm whitespace-nowrap">
                <Download className="w-4 h-4 md:mr-2 shrink-0" />
                <span className="hidden md:inline">Export</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="hidden sm:block">Export as PDF</TooltipContent>
          </Tooltip>

          {/* Mobile Menu - More Options */}
          <div className="sm:hidden ml-auto">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 px-1">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>More options</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-48">
                {/* Zoom Controls */}
                <div className="px-2 py-1.5 text-sm font-medium">Zoom: {Math.round(scale * 100)}%</div>
                <div className="px-2 py-2 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onScaleChange(Math.max(0.5, scale - 0.25))}
                    className="h-8 w-8 px-1"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Slider
                    value={[scale]}
                    onValueChange={(value) => onScaleChange(value[0])}
                    min={0.5}
                    max={3}
                    step={0.25}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onScaleChange(Math.min(3, scale + 0.25))}
                    className="h-8 w-8 px-1"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>

                <DropdownMenuSeparator />

                {/* Stroke Width */}
                <div className="px-2 py-1.5 text-sm font-medium">Stroke Width: {strokeWidth}</div>
                <div className="px-2 py-2">
                  <Slider
                    value={[strokeWidth]}
                    onValueChange={(value) => onStrokeWidthChange(value[0])}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>

                <DropdownMenuSeparator />

                {/* Page Actions */}
                <DropdownMenuItem onClick={onAddPage}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Page
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRotate}>
                  <RotateCw className="w-4 h-4 mr-2" />
                  Rotate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDeleteSelected} disabled={!hasSelection}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
