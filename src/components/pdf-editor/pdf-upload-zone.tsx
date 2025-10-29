import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PDFUploadZoneProps {
  onFileSelect: (file: File) => void;
}

export function PDFUploadZone({ onFileSelect }: PDFUploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
      toast.success('PDF loaded successfully');
    } else {
      toast.error('Please upload a valid PDF file');
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-background">
      <div
        {...getRootProps()}
        className={`
          w-full max-w-2xl mx-auto p-12 border-2 border-dashed rounded-lg
          transition-all duration-200 cursor-pointer
          ${isDragActive 
            ? 'border-primary bg-primary/5 scale-105' 
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/5'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {isDragActive ? (
            <>
              <Upload className="w-16 h-16 text-primary animate-bounce" />
              <p className="text-lg font-medium text-primary">Drop your PDF here!</p>
            </>
          ) : (
            <>
              <FileText className="w-16 h-16 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold">Upload PDF Document</h3>
                <p className="text-muted-foreground">
                  Drag and drop your PDF file here, or click to browse
                </p>
              </div>
              <Button size="lg" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
              <p className="text-xs text-muted-foreground">
                Supports PDF files up to 50MB
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
