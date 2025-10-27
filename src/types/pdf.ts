/**
 * PDF Editor Types
 */

export interface PDFDocument {
  file: File;
  numPages: number;
  url: string;
}

export interface EditingState {
  currentPage: number;
  scale: number;
  rotation: number;
}

export interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  page: number;
}

export interface DrawAnnotation {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  page: number;
}

export type Annotation = TextAnnotation | DrawAnnotation;
