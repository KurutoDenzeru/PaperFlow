import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PDFDockProps {
  currentPage: number;
  numPages: number;
  scale: number;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number) => void;
  viewMode?: 'single' | 'multiple';
  onViewModeChange?: (mode: 'single' | 'multiple') => void;
}

export function PDFDock({
  currentPage,
  numPages,
  scale,
  onPageChange,
  onScaleChange,
  viewMode = 'single',
  onViewModeChange,
}: PDFDockProps) {
  const handleViewModeChange = (mode: 'single' | 'multiple') => {
    onViewModeChange?.(mode);
  };
  return (
    <TooltipProvider>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 mx-auto bg-background/95 backdrop-blur border rounded-lg shadow-lg z-50 flex flex-row items-center justify-center gap-2 p-2 md:p-3 overflow-x-auto">
        {/* Page Navigation Group */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="h-8 w-8 md:h-9 md:w-9 p-0"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Previous page</TooltipContent>
          </Tooltip>

          <span className="text-xs sm:text-sm font-medium min-w-fit px-2 md:px-3 py-1 bg-muted rounded whitespace-nowrap">
            {currentPage}/{numPages}
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
                disabled={currentPage >= numPages}
                className="h-8 w-8 md:h-9 md:w-9 p-0"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Next page</TooltipContent>
          </Tooltip>
        </div>

        {/* Separator - Hidden on mobile, shown on small devices as vertical line */}
        <div className="hidden sm:block w-px h-6 bg-border" />

        {/* Zoom Controls Group */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onScaleChange(Math.max(1, scale - 0.1))}
                disabled={scale <= 1}
                className="h-8 w-8 md:h-9 md:w-9 p-0"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out (100% minimum)</TooltipContent>
          </Tooltip>

          <span className="text-xs sm:text-sm font-medium min-w-fit px-1.5 md:px-2 whitespace-nowrap">
            {Math.round(scale * 100)}%
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onScaleChange(Math.min(2, scale + 0.1))}
                disabled={scale >= 2}
                className="h-8 w-8 md:h-9 md:w-9 p-0"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in (200% maximum)</TooltipContent>
          </Tooltip>
        </div>

        {/* Separator - Hidden on mobile, shown on small devices as vertical line */}
        <div className="hidden sm:block w-px h-6 bg-border" />

        {/* View Mode Group */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === 'single' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('single')}
                className="h-8 w-8 md:h-9 md:w-9 p-0"
                title="Single page view"
              >
                <FileText className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Single page view</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === 'multiple' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('multiple')}
                className="h-8 w-8 md:h-9 md:w-9 p-0"
                title="Multiple pages grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Multiple pages grid view</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
