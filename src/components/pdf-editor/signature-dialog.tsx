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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) {
      setPreviewImage(null);
      setMode('upload');
      clearCanvas();
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Reset transform, clear with respect to actual pixel size, then restore transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Optionally fill with white background to avoid transparent edges
    ctx.fillStyle = 'rgba(255,255,255,0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Re-apply DPI scaling if necessary
    const ratio = window.devicePixelRatio || 1;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2; // match setup
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  // Setup high-DPI canvas and drawing attributes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCanvas = () => {
      const ratio = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const dprWidth = Math.round(width * ratio);
      const dprHeight = Math.round(height * ratio);
      if (canvas.width !== dprWidth || canvas.height !== dprHeight) {
        canvas.width = dprWidth;
        canvas.height = dprHeight;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // Reset & apply proper device pixel ratio scaling so drawing matches pointer coordinates
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 2; // visually this will be scaled by ratio
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
    };

    // Initial setup and resize handling
    setupCanvas();
    const onResize = () => setupCanvas();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    lastPos.current = { x, y };
    // Capture pointer so we receive move/up outside the canvas
    try {
      (e.target as HTMLCanvasElement).setPointerCapture?.(e.pointerId);
    } catch (err) {
      // ignore if not supported
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Draw smoothing using quadratic curve to midpoint between last and current
    if (lastPos.current) {
      const last = lastPos.current;
      const midX = (last.x + x) / 2;
      const midY = (last.y + y) / 2;
      ctx.quadraticCurveTo(last.x, last.y, midX, midY);
      ctx.stroke();
      lastPos.current = { x, y };
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
      lastPos.current = { x, y };
    }
  };

  const stopDrawing = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = false;
    lastPos.current = null;
    if (e) {
      try {
        (e.target as HTMLCanvasElement).releasePointerCapture?.(e.pointerId);
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
      const canvas = canvasRef.current;
      if (!canvas) {
        toast.error('No signature to insert');
        return;
      }
      const imageData = canvas.toDataURL('image/png');
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
              <div className="border rounded p-2 bg-white">
                          <canvas
                            ref={canvasRef}
                            className="w-full h-40 bg-white touched"
                            style={{ touchAction: 'none' }}
                            onPointerDown={startDrawing}
                            onPointerMove={draw}
                            onPointerUp={stopDrawing}
                            onPointerCancel={(e) => stopDrawing(e)}
                          />
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
