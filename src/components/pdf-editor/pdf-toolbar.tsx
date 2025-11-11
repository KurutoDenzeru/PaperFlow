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
  Trash2,
  Palette,
  MoreHorizontal,
  PanelRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Tool, Annotation } from '@/types/pdf';

interface PDFToolbarProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  onRotate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelected: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  currentColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  selectedAnnotationId?: string | null;
  annotations?: Annotation[];
  // Text formatting props
  fontFamily?: string;
  onFontFamilyChange?: (font: string) => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  textBold?: boolean;
  onTextBoldChange?: (bold: boolean) => void;
  textItalic?: boolean;
  onTextItalicChange?: (italic: boolean) => void;
  textUnderline?: boolean;
  onTextUnderlineChange?: (underline: boolean) => void;
  textColor?: string;
  onTextColorChange?: (color: string) => void;
  backgroundColor?: string;
  onBackgroundColorChange?: (color: string) => void;
  textAlign?: 'left' | 'center' | 'right';
  onTextAlignChange?: (align: 'left' | 'center' | 'right') => void;
}

const colors = [
  '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
  '#800080', '#008000', '#FFC0CB', '#A52A2A'
];

const mainTools: { tool: Tool | 'shapes'; icon: React.ReactNode; label: string }[] = [
  { tool: 'select', icon: <MousePointer2 className="w-4 h-4" />, label: 'Select' },
  { tool: 'text', icon: <Type className="w-4 h-4" />, label: 'Text' },
  { tool: 'shapes', icon: <Square className="w-4 h-4" />, label: 'Shapes' },
  { tool: 'highlight', icon: <Highlighter className="w-4 h-4" />, label: 'Highlight' },
  { tool: 'pen', icon: <Pen className="w-4 h-4" />, label: 'Pen' },
  { tool: 'eraser', icon: <Eraser className="w-4 h-4" />, label: 'Eraser' },
];

const shapeTools: { tool: Tool; icon: React.ReactNode; label: string }[] = [
  { tool: 'rectangle', icon: <Square className="w-4 h-4" />, label: 'Rectangle' },
  { tool: 'circle', icon: <Circle className="w-4 h-4" />, label: 'Circle' },
  { tool: 'line', icon: <Minus className="w-4 h-4" />, label: 'Line' },
  { tool: 'arrow', icon: <MoveRight className="w-4 h-4" />, label: 'Arrow' },
];

export function PDFToolbar({
  currentTool,
  onToolChange,
  onRotate,
  onUndo,
  onRedo,
  onDeleteSelected,
  canUndo,
  canRedo,
  hasSelection,
  currentColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  sidebarOpen = true,
  onToggleSidebar,
  selectedAnnotationId,
  annotations = [],
  // Text formatting props
  fontFamily,
  onFontFamilyChange,
  fontSize,
  onFontSizeChange,
  textBold,
  onTextBoldChange,
  textItalic,
  onTextItalicChange,
  textUnderline,
  onTextUnderlineChange,
  textColor,
  onTextColorChange,
  backgroundColor,
  onBackgroundColorChange,
  textAlign,
  onTextAlignChange,
}: PDFToolbarProps) {
  // Check if selected annotation is a text annotation
  const selectedAnnotation = selectedAnnotationId && annotations ? annotations.find(a => a.id === selectedAnnotationId) : null;
  const isTextAnnotationSelected = selectedAnnotation?.type === 'text';

  return (
    <TooltipProvider>
      {/* Main Toolbar */}
      <div className={`w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-10 z-50 transition-all ${sidebarOpen ? 'sm:mr-0' : 'mr-0'}`}>
        <div className="flex items-center px-2 md:px-4 py-2 gap-2 md:gap-3 overflow-x-auto">
          {/* Drawing Tools - Main Tools with Shapes Dropdown */}
          <div className="flex items-center gap-0.5 md:gap-1 shrink-0 bg-muted rounded-lg p-1">
            {mainTools.map(({ tool, icon, label }) => {
              // Handle shapes dropdown
              if (tool === 'shapes') {
                return (
                  <DropdownMenu key={tool}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={`h-8 w-8 md:h-9 md:w-9 px-1 rounded transition-all flex items-center justify-center ${
                              shapeTools.some(t => t.tool === currentTool)
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'hover:bg-background/50'
                            }`}
                          >
                            {icon}
                          </button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent className="hidden sm:block">{label}</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent className="w-full min-w-56">
                      <div className="grid grid-cols-2 gap-2 p-2">
                        {shapeTools.map(({ tool: shapeTool, icon: shapeIcon, label: shapeLabel }) => (
                          <button
                            key={shapeTool}
                            onClick={() => onToolChange(shapeTool)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              currentTool === shapeTool
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            {shapeIcon}
                            <span>{shapeLabel}</span>
                          </button>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              // Regular toggle items
              return (
                <Tooltip key={tool}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onToolChange(tool as Tool)}
                      className={`h-8 w-8 md:h-9 md:w-9 px-1 rounded transition-all flex items-center justify-center ${
                        currentTool === tool
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'hover:bg-background/50'
                      }`}
                    >
                      {icon}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="hidden sm:block">{label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>

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
            <span className="text-sm text-muted-foreground whitespace-nowrap">Width:</span>
            <Select value={strokeWidth.toString()} onValueChange={(value) => onStrokeWidthChange(parseInt(value))}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((width) => (
                  <SelectItem key={width} value={width.toString()}>
                    {width}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Text Formatting Tools - Show when Text tool is selected OR text annotation is selected */}
          {(currentTool === 'text' || isTextAnnotationSelected) && onFontFamilyChange && (
            <>
              <Separator orientation="vertical" className="h-6 md:h-8 shrink-0 hidden md:block" />

              {/* Font Family */}
              <div className="hidden md:flex items-center gap-2 px-2 shrink-0">
                <Select value={fontFamily || 'Arial'} onValueChange={(value) => onFontFamilyChange(value)}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Courier">Courier</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Size */}
              <div className="hidden md:flex items-center gap-2 px-2 shrink-0">
                <Select value={(fontSize || 16).toString()} onValueChange={(value) => onFontSizeChange?.(parseInt(value))}>
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Text Formatting Buttons */}
              <div className="hidden md:flex items-center gap-0.5 md:gap-1 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={textBold ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onTextBoldChange?.(!textBold)}
                      className="h-8 w-8 md:h-9 md:w-9 px-1 font-bold"
                    >
                      B
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="hidden sm:block">Bold</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={textItalic ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onTextItalicChange?.(!textItalic)}
                      className="h-8 w-8 md:h-9 md:w-9 px-1 italic"
                    >
                      I
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="hidden sm:block">Italic</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={textUnderline ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onTextUnderlineChange?.(!textUnderline)}
                      className="h-8 w-8 md:h-9 md:w-9 px-1 underline"
                    >
                      U
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="hidden sm:block">Underline</TooltipContent>
                </Tooltip>
              </div>

              {/* Text Color */}
              <div className="hidden md:flex shrink-0">
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1 h-8 md:h-9 px-2 shrink-0">
                          <div
                            className="w-3 h-3 md:w-4 md:h-4 rounded border shrink-0"
                            style={{ backgroundColor: textColor || '#000000' }}
                          />
                          <span className="text-xs">A</span>
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="hidden sm:block">Text Color</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent className="w-48">
                    <div className="grid grid-cols-6 gap-2 p-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          className="w-8 h-8 rounded border-2 transition-all hover:scale-110"
                          style={{
                            backgroundColor: color,
                            borderColor: color === (textColor || '#000000') ? '#000' : 'transparent'
                          }}
                          onClick={() => onTextColorChange?.(color)}
                        />
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Background Color */}
              <div className="hidden md:flex shrink-0">
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1 h-8 md:h-9 px-2 shrink-0">
                          <div
                            className="w-3 h-3 md:w-4 md:h-4 rounded border shrink-0"
                            style={{ backgroundColor: backgroundColor || 'transparent', borderColor: '#ccc' }}
                          />
                          <span className="text-xs">BG</span>
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="hidden sm:block">Background Color</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent className="w-48">
                    <div className="grid grid-cols-6 gap-2 p-2">
                      <button
                        className="w-8 h-8 rounded border-2 transition-all hover:scale-110 bg-white"
                        style={{
                          borderColor: backgroundColor === 'transparent' ? '#000' : 'transparent'
                        }}
                        onClick={() => onBackgroundColorChange?.('transparent')}
                        title="No background"
                      >
                        ✕
                      </button>
                      {colors.map((color) => (
                        <button
                          key={color}
                          className="w-8 h-8 rounded border-2 transition-all hover:scale-110"
                          style={{
                            backgroundColor: color,
                            borderColor: color === backgroundColor ? '#000' : 'transparent'
                          }}
                          onClick={() => onBackgroundColorChange?.(color)}
                        />
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Text Alignment */}
              <div className="hidden md:flex items-center gap-0.5 md:gap-1 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={textAlign === 'left' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onTextAlignChange?.('left')}
                      className="h-8 w-8 md:h-9 md:w-9 px-1"
                    >
                      ⬅
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="hidden sm:block">Align Left</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={textAlign === 'center' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onTextAlignChange?.('center')}
                      className="h-8 w-8 md:h-9 md:w-9 px-1"
                    >
                      ⬍
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="hidden sm:block">Align Center</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={textAlign === 'right' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onTextAlignChange?.('right')}
                      className="h-8 w-8 md:h-9 md:w-9 px-1"
                    >
                      ➡
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="hidden sm:block">Align Right</TooltipContent>
                </Tooltip>
              </div>
            </>
          )}

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

          {/* Spacer to push sidebar toggle to the far right */}
          <div className="flex-1" />

          {/* Sidebar Toggle - Far right for desktop, left for mobile */}
          <div className="flex items-center gap-0.5 md:gap-1 shrink-0 ml-auto md:ml-0">
            {onToggleSidebar && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleSidebar}
                    className="h-8 w-8 md:h-9 md:w-9 px-1"
                  >
                    <PanelRight className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="hidden sm:block">
                  {sidebarOpen ? 'Close' : 'Open'} Sidebar
                </TooltipContent>
              </Tooltip>
            )}

            {/* Mobile Menu - More Options */}
            <div className="sm:hidden">
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
                  {/* Stroke Width */}
                  <div className="px-2 py-1.5 text-sm font-medium">Stroke Width</div>
                  <div className="px-2 py-2">
                    <Select value={strokeWidth.toString()} onValueChange={(value) => onStrokeWidthChange(parseInt(value))}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((width) => (
                          <SelectItem key={width} value={width.toString()}>
                            {width}px
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Page Actions */}
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
      </div>
    </TooltipProvider>
  );
}
