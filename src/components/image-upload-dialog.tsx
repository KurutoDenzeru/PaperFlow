import { useState, useCallback } from 'react';
import { Upload, X, ImagePlus, FileImage, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageSelect: (imageData: string) => void;
}

export function ImageUploadDialog({ open, onOpenChange, onImageSelect }: ImageUploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const processImage = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
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
    if (files.length > 0) {
      processImage(files[0]);
    }
  }, [processImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImage(files[0]);
    }
  }, [processImage]);

  const handleInsert = () => {
    if (previewImage) {
      onImageSelect(previewImage);
      setPreviewImage(null);
      onOpenChange(false);
      toast.success('Image inserted');
    }
  };

  const handleCancel = () => {
    setPreviewImage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            Insert Image
          </DialogTitle>
          <DialogDescription>
            Upload an image to add to your PDF document
          </DialogDescription>
          {/* Clear / Trash actions below description - show when preview is present */}
          {previewImage && (
            <div className="mt-2 flex gap-2 items-center">
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => setPreviewImage(null)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {!previewImage ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-2">
                Drag and drop an image here
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                or
              </p>
              <label htmlFor="image-upload">
                <Button type="button" variant="secondary" asChild>
                  <span className="cursor-pointer">
                    Browse Files
                  </span>
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </label>
              <p className="text-xs text-muted-foreground mt-4">
                Supports: JPG, PNG, GIF, WebP (Max 5MB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
              <div className="flex gap-2">
                <Button onClick={handleInsert} className="flex-1">
                  <ImagePlus className="w-4 h-4 mr-2" />
                  Insert Image
                </Button>
                <Button onClick={handleCancel} variant="outline" className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
