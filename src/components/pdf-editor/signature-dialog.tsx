import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileSignature, Check, X, Upload, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignatureInsert: (imageData: string) => void;
}

export function SignatureDialog({ open, onOpenChange, onSignatureInsert }: SignatureDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'draw'>('upload');
  // Drawing area is an SVG overlay instead of a pixel canvas for crisp vector lines
  const drawingAreaRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    if (!open) {
      setPreviewImage(null);
      setMode('upload');
      setPoints([]);
    }
  }, [open]);

  const processImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setPreviewImage(imageData);
    };
    reader.onerror = () => {
      toast.error('Error reading image file');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) processImage(files[0]);
  }, [processImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processImage(files[0]);
  }, [processImage]);

  const clearCanvas = useCallback(() => {
    setPoints([]);
    setPreviewImage(null);
  }, []);

  // Not using a pixel canvas; drawing is vector-based SVG so we don't require high-DPI setup

  const startDrawing = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    const svg = svgRef.current;
    const container = drawingAreaRef.current;
    if (!svg || !container) return;
    drawing.current = true;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPoints((prev) => [...prev, { x, y }]);
    lastPos.current = { x, y };
    // Capture pointer so we receive move/up outside the canvas
    try {
      (e.currentTarget as SVGSVGElement).setPointerCapture?.(e.pointerId);
    } catch (err) {
      // ignore if not supported
    }
  };

  const draw = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const container = drawingAreaRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Append point for SVG polyline; we rely on many points for smooth lines
    setPoints((prev) => {
      // Avoid adding too many points if pointer hasn't moved much
      const last = prev[prev.length - 1];
      if (last && Math.hypot(last.x - x, last.y - y) < 0.5) return prev;
      return [...prev, { x, y }];
    });
    lastPos.current = { x, y };
  };

  const stopDrawing = (e?: React.PointerEvent<SVGSVGElement>) => {
    drawing.current = false;
    lastPos.current = null;
    if (e) {
      try {
        (e.currentTarget as SVGSVGElement).releasePointerCapture?.(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  const handleInsert = () => {
    if (mode === 'upload') {
      if (previewImage) {
        onSignatureInsert(previewImage);
        setPreviewImage(null);
        onOpenChange(false);
        toast.success('Signature inserted');
      }
      } else {
      if (points.length === 0) {
        toast.error('No signature to insert');
        return;
      }
      const container = drawingAreaRef.current;
      const rect = container?.getBoundingClientRect();
      const width = rect?.width || 400;
      const height = rect?.height || 120;
      const dpr = window.devicePixelRatio || 1;

      // Build SVG markup
      const strokeWidth = 2 * dpr; // scale stroke width with devicePixelRatio for crispness
      const pointsAttr = points.map(p => `${p.x},${p.y}`).join(' ');
      const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns='http://www.w3.org/2000/svg' width='${Math.round(width * dpr)}' height='${Math.round(height * dpr)}' viewBox='0 0 ${width} ${height}'>\n  <rect width='100%' height='100%' fill='none'/>\n  <polyline fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round' stroke-width='${strokeWidth}' points='${pointsAttr}' />\n</svg>`;
      const imageData = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      onSignatureInsert(imageData);
      clearCanvas();
      onOpenChange(false);
      toast.success('Signature inserted');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="w-5 h-5" />
            Insert Signature
          </DialogTitle>
          <DialogDescription>
            Add a signature by uploading an image or drawing one below. It’ll be added as a resizable, rotatable element.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'upload' | 'draw')}>
              <TabsList className="bg-muted rounded-md p-1">
                <TabsTrigger value="upload" className="h-8 px-3">Upload</TabsTrigger>
                <TabsTrigger value="draw" className="h-8 px-3">Draw</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => { setPreviewImage(null); clearCanvas(); }}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>

          {mode === 'upload' ? (
            !previewImage ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}>
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-2">Drag and drop a signature image here</p>
                <p className="text-xs text-muted-foreground mb-4">or</p>
                <label htmlFor="signature-upload">
                  <Button type="button" variant="secondary" asChild>
                    <span className="cursor-pointer">Browse Files</span>
                  </Button>
                  <input id="signature-upload" type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
                </label>
                <p className="text-xs text-muted-foreground mt-4">Supports: JPG, PNG, GIF, WebP (Max 5MB)</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border bg-muted">
                  <img src={previewImage} alt="Preview" className="w-full h-auto max-h-64 object-contain" />
                </div>
              </div>
            )
          ) : (
            <div className="space-y-2">
              <div ref={drawingAreaRef} className="border rounded p-2 bg-white" style={{ touchAction: 'none' }}>
                <svg
                  ref={svgRef}
                  className="w-full h-40 bg-white"
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerCancel={(e) => stopDrawing(e)}
                >
                  <rect x={0} y={0} width="100%" height="100%" fill="transparent" />
                  {points.length > 0 && (
                    <polyline
                      points={points.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="#000"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleInsert} className="flex-1">
              <Check className="w-4 h-4 mr-2" />
              Insert Signature
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SignatureDialog;
