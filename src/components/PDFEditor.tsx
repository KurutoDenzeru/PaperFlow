import React, { useState, useCallback } from 'react';
import { FileUpload } from './FileUpload';
import { PDFViewer } from './PdfViewer';
import { EditingToolbar, type ToolType } from './EditingToolbar';
import { savePDFWithAnnotations, downloadPDF, fileToArrayBuffer } from '../lib/pdf-utils';
import { Separator } from './ui/separator';
import { toast } from 'sonner';

interface PDFEditorState {
  currentFile: File | null;
  fileUrl: string | null;
  currentPage: number;
  numPages: number;
  activeTool: ToolType | null;
}

export const PDFEditor: React.FC = () => {
  const [state, setState] = useState<PDFEditorState>({
    currentFile: null,
    fileUrl: null,
    currentPage: 1,
    numPages: 0,
    activeTool: null,
  });

  const handleFileSelect = useCallback((file: File, url: string) => {
    console.log('✅ File selected in PDFEditor:', {
      file: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      url,
    });
    setState((prev) => ({
      ...prev,
      currentFile: file,
      fileUrl: url,
      currentPage: 1,
    }));
    toast.success(`Loaded: ${file.name}`);
  }, []);

  const handleFileClear = useCallback(() => {
    console.log('🗑️ PDF cleared');
    setState((prev) => ({
      ...prev,
      currentFile: null,
      fileUrl: null,
      currentPage: 1,
      numPages: 0,
    }));
    toast.info('PDF cleared');
  }, []);

  const handleNumPagesChange = useCallback((pages: number) => {
    setState((prev) => ({
      ...prev,
      numPages: pages,
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      currentPage: page,
    }));
  }, []);

  const handleToolSelect = useCallback((tool: ToolType | null) => {
    setState((prev) => ({
      ...prev,
      activeTool: prev.activeTool === tool ? null : tool,
    }));
  }, []);

  const handleSavePDF = useCallback(async () => {
    if (!state.currentFile) {
      console.warn('⚠️ Save attempted with no file loaded');
      toast.error('No PDF loaded');
      return;
    }

    try {
      console.log('💾 Starting PDF save process...');
      const buffer = await fileToArrayBuffer(state.currentFile);
      console.log(`   ArrayBuffer created: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
      
      const blob = await savePDFWithAnnotations(buffer);
      console.log(`   PDF saved as blob: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
      
      const filename = `${state.currentFile.name.replace('.pdf', '')}_edited.pdf`;
      downloadPDF(blob, filename);
      console.log(`✅ PDF downloaded: ${filename}`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ PDF save error:', {
        message: errorMessage,
        error,
      });
      toast.error('Failed to save PDF');
    }
  }, [state.currentFile]);

  const handleClear = useCallback(() => {
    toast.info('All annotations cleared');
    // Additional clearing logic would go here
  }, []);

  return (
    <div className="h-screen w-full flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900">PDF Editor</h1>
        <p className="text-gray-600 mt-1">Upload and edit your PDF documents</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!state.fileUrl ? (
          // Upload Section
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="w-full max-w-xl">
              <FileUpload
                onFileSelect={handleFileSelect}
                onClear={handleFileClear}
                currentFile={state.currentFile}
              />
            </div>
          </div>
        ) : (
          // Editor Section
          <div className="flex-1 flex flex-col overflow-hidden">
            <EditingToolbar
              activeTool={state.activeTool}
              onToolSelect={handleToolSelect}
              onSave={handleSavePDF}
              onClear={handleClear}
            />

            <Separator />

            <div className="flex-1 overflow-hidden">
              <PDFViewer
                fileUrl={state.fileUrl}
                onNumPagesChange={handleNumPagesChange}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
