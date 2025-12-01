import { useState } from 'react';
import type { Tool, Annotation } from '@/types/pdf';
import { ImageUploadDialog } from './image-upload-dialog';
import { MousePointer2, Type, Square, Circle, Minus, MoveRight, Highlighter, Pen, Eraser, Undo, Redo, RotateCw, Trash2, Palette, SquareDashed, MoreHorizontal, PanelRight, AlignLeft, AlignCenter, AlignRight, Image } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';

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
  strokeColor?: string;
  onStrokeColorChange?: (color: string) => void;
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
  backgroundColor?: string;
  onBackgroundColorChange?: (color: string) => void;
  textAlign?: 'left' | 'center' | 'right';
  onTextAlignChange?: (align: 'left' | 'center' | 'right') => void;
  onImageSelect?: (imageData: string) => void;
}

const colors = [
  '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
  '#800080', '#008000', '#FFC0CB', '#A52A2A'
];

const mainTools: { tool: Tool | 'shapes'; icon: React.ReactNode; label: string }[] = [
  { tool: 'select', icon: <MousePointer2 className="w-4 h-4" />, label: 'Select' },
  { tool: 'text', icon: <Type className="w-4 h-4" />, label: 'Text' },
  { tool: 'image', icon: <Image className="w-4 h-4" />, label: 'Image' },
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
  strokeColor = '#000000',
  onStrokeColorChange,
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
  backgroundColor,
  onBackgroundColorChange,
  textAlign,
  onTextAlignChange,
  onImageSelect,
}: PDFToolbarProps) {
  const [openColorDropdown, setOpenColorDropdown] = useState<'fill' | 'stroke' | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  
  // Check if selected annotation is a text annotation
  const selectedAnnotation = selectedAnnotationId && annotations ? annotations.find(a => a.id === selectedAnnotationId) : null;
  const isTextAnnotationSelected = selectedAnnotation?.type === 'text';

  const handleImageSelect = (imageData: string) => {
    if (onImageSelect) {
      onImageSelect(imageData);
      setImageDialogOpen(false);
    }
  };

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
                            className={`h-8 w-8 md:h-9 md:w-9 px-1 rounded transition-all flex items-center justify-center cursor-pointer ${
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
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                              currentTool === shapeTool
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-background hover:bg-accent hover:shadow-sm'
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

              // Handle image tool - open dialog
              if (tool === 'image') {
                return (
                  <Tooltip key={tool}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setImageDialogOpen(true)}
                        className={`h-8 w-8 md:h-9 md:w-9 px-1 rounded transition-all flex items-center justify-center cursor-pointer ${
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
              }

              // Regular toggle items
              return (
                <Tooltip key={tool}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onToolChange(tool as Tool)}
                      className={`h-8 w-8 md:h-9 md:w-9 px-1 rounded transition-all flex items-center justify-center cursor-pointer ${
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
          <DropdownMenu open={openColorDropdown === 'fill'} onOpenChange={(open) => {
            if (open) {
              setOpenColorDropdown('fill');
            } else {
              setOpenColorDropdown(null);
            }
          }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-8 md:h-9 px-2 shrink-0">
                    <Palette className="w-4 h-4 shrink-0" />
                    <div
                      className="w-3 h-3 md:w-4 md:h-4 rounded border shrink-0"
                      style={{ 
                        backgroundColor: currentColor === 'transparent' ? 'transparent' : currentColor,
                        backgroundImage: currentColor === 'transparent' ? 'linear-gradient(45deg, transparent 48%, #ccc 48%, #ccc 52%, transparent 52%)' : 'none'
                      }}
                    />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent className="hidden sm:block">Fill Color</TooltipContent>
            </Tooltip>
            <DropdownMenuContent className="w-74">
              <div className="grid grid-cols-6 gap-1 p-1.5">
                <button
                  className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 cursor-pointer flex items-center justify-center ${
                    currentColor === 'transparent' ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                  }`}
                  style={{
                    borderColor: currentColor === 'transparent' ? '#000' : '#e5e7eb',
                    backgroundImage: 'linear-gradient(45deg, transparent 48%, #ccc 48%, #ccc 52%, transparent 52%)'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onColorChange('transparent');
                    setOpenColorDropdown(null);
                  }}
                  title="Transparent"
                >
                  ✕
                </button>
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 cursor-pointer ${
                      color === currentColor ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    }`}
                    style={{
                      backgroundColor: color,
                      borderColor: color === currentColor ? '#000' : '#e5e7eb'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onColorChange(color);
                      setOpenColorDropdown(null);
                    }}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Stroke/Outline Color Picker */}
          {onStrokeColorChange && currentTool !== 'highlight' && (
            <DropdownMenu open={openColorDropdown === 'stroke'} onOpenChange={(open) => {
              if (open) {
                setOpenColorDropdown('stroke');
              } else {
                setOpenColorDropdown(null);
              }
            }}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-8 md:h-9 px-2 shrink-0 flex items-center justify-center">
                      <SquareDashed className="w-4 h-4 shrink-0" />
                      <div className="w-3 h-3 rounded border-2 flex items-center justify-center"
                        style={{ 
                          borderColor: strokeColor === 'transparent' ? '#ccc' : strokeColor,
                          backgroundColor: 'transparent'
                        }}>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent className="hidden sm:block">Stroke Color</TooltipContent>
              </Tooltip>
              <DropdownMenuContent className="w-74">
                <div className="grid grid-cols-6 gap-1 p-1.5">
                  <button
                    className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 cursor-pointer flex items-center justify-center ${
                      strokeColor === 'transparent' ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    }`}
                    style={{
                      borderColor: strokeColor === 'transparent' ? '#000' : '#e5e7eb',
                      backgroundImage: 'linear-gradient(45deg, transparent 48%, #ccc 48%, #ccc 52%, transparent 52%)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStrokeColorChange('transparent');
                      setOpenColorDropdown(null);
                    }}
                    title="Transparent"
                  >
                    ✕
                  </button>
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 cursor-pointer ${
                        color === strokeColor ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                      }`}
                      style={{
                        backgroundColor: color,
                        borderColor: color === strokeColor ? '#000' : '#e5e7eb'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onStrokeColorChange) {
                          onStrokeColorChange(color);
                        }
                        setOpenColorDropdown(null);
                      }}
                    />
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Stroke Width */}
          {currentTool !== 'highlight' && (
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
          )}

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

              {/* Text Formatting Buttons - Bold, Italic, Underline */}
              <div className="hidden md:flex items-center gap-0.5 md:gap-1 shrink-0 bg-muted rounded-lg p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={textBold ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        if (onTextBoldChange) {
                          onTextBoldChange(!textBold);
                        }
                      }}
                      className="h-8 w-8 md:h-9 md:w-9 px-0"
                    >
                      <span className="font-bold">B</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="hidden sm:block">Bold (Ctrl+B)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={textItalic ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        if (onTextItalicChange) {
                          onTextItalicChange(!textItalic);
                        }
                      }}
                      className="h-8 w-8 md:h-9 md:w-9 px-0"
                    >
                      <span className="italic">I</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="hidden sm:block">Italic (Ctrl+I)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={textUnderline ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        if (onTextUnderlineChange) {
                          onTextUnderlineChange(!textUnderline);
                        }
                      }}
                      className="h-8 w-8 md:h-9 md:w-9 px-0"
                    >
                      <span className="underline">U</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="hidden sm:block">Underline (Ctrl+U)</TooltipContent>
                </Tooltip>
              </div>

              {/* Background Color Picker with Icon */}
              <div className="hidden md:flex shrink-0">
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 md:h-9 md:w-9 px-0 shrink-0 relative">
                          <div className="w-4 h-4 rounded border border-foreground/30 flex items-center justify-center"
                            style={{ 
                              backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
                              backgroundImage: backgroundColor === 'transparent' ? 'linear-gradient(45deg, transparent 48%, #ccc 48%, #ccc 52%, transparent 52%)' : 'none'
                            }}>
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="hidden sm:block">Background Color</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent className="w-84">
                    <div className="grid grid-cols-6 gap-3 p-2">
                      <button
                        className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 cursor-pointer flex items-center justify-center ${
                          backgroundColor === 'transparent' ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                        }`}
                        style={{
                          borderColor: backgroundColor === 'transparent' ? '#000' : '#e5e7eb',
                          backgroundImage: 'linear-gradient(45deg, transparent 48%, #ccc 48%, #ccc 52%, transparent 52%)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onBackgroundColorChange) {
                            onBackgroundColorChange('transparent');
                          }
                        }}
                        title="No background"
                      >
                        ✕
                      </button>
                      {colors.map((color) => (
                        <button
                          key={color}
                          className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 cursor-pointer ${
                            color === backgroundColor ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                          }`}
                          style={{
                            backgroundColor: color,
                            borderColor: color === backgroundColor ? '#000' : '#e5e7eb'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onBackgroundColorChange) {
                              onBackgroundColorChange(color);
                            }
                          }}
                        />
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Text Alignment Dropdown */}
              <div className="hidden md:flex shrink-0">
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 md:h-9 md:w-9 px-0 shrink-0">
                          {textAlign === 'left' && <AlignLeft className="w-4 h-4" />}
                          {textAlign === 'center' && <AlignCenter className="w-4 h-4" />}
                          {textAlign === 'right' && <AlignRight className="w-4 h-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="hidden sm:block">Text Alignment</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={() => {
                        if (onTextAlignChange) {
                          onTextAlignChange('left');
                        }
                      }}
                      className={textAlign === 'left' ? 'bg-accent' : ''}
                    >
                      <AlignLeft className="w-4 h-4 mr-2" />
                      <span>Align Left</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (onTextAlignChange) {
                          onTextAlignChange('center');
                        }
                      }}
                      className={textAlign === 'center' ? 'bg-accent' : ''}
                    >
                      <AlignCenter className="w-4 h-4 mr-2" />
                      <span>Align Center</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (onTextAlignChange) {
                          onTextAlignChange('right');
                        }
                      }}
                      className={textAlign === 'right' ? 'bg-accent' : ''}
                    >
                      <AlignRight className="w-4 h-4 mr-2" />
                      <span>Align Right</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}

          <Separator orientation="vertical" className="h-6 md:h-8 shrink-0 hidden md:block" />

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

      {/* Image Upload Dialog */}
      <ImageUploadDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onImageSelect={handleImageSelect}
      />
    </TooltipProvider>
  );
}
