import { PDFDocument as PDFLibDocument } from 'pdf-lib';

/**
 * PDF Processing Utilities
 */

export async function savePDFWithAnnotations(
  originalPdfBuffer: ArrayBuffer
): Promise<Blob> {
  const pdfDoc = await PDFLibDocument.load(originalPdfBuffer);

  // Save and return as blob
  const pdfBytes = await pdfDoc.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
}

export function downloadPDF(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'edited.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
