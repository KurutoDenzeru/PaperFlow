import React, { useRef, useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from './ui/button';

interface FileUploadProps {
  onFileSelect: (file: File, url: string) => void;
  onClear?: () => void;
  currentFile?: File | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onClear,
  currentFile,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type === 'application/pdf') {
        const url = URL.createObjectURL(file);
        onFileSelect(file, url);
      } else if (file) {
        alert('Please select a valid PDF file');
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files?.[0];
      if (file && file.type === 'application/pdf') {
        const url = URL.createObjectURL(file);
        onFileSelect(file, url);
      } else if (file) {
        alert('Please drop a valid PDF file');
      }
    },
    [onFileSelect]
  );

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onClear?.();
  };

  return (
    <div className="w-full">
      {!currentFile ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Upload PDF
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop your PDF here, or click to browse
          </p>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Select PDF
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <File className="w-6 h-6 text-red-500" />
            <div>
              <p className="font-semibold text-gray-800">{currentFile.name}</p>
              <p className="text-sm text-gray-600">
                {(currentFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-gray-500 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
