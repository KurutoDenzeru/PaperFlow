export type Tool = 
  | 'select'
  | 'text'
  | 'image'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'highlight'
  | 'pen'
  | 'signature'
  | 'eraser';

export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  type: Tool;
  name?: string;
  pageNumber: number;
  position: Point;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  points?: Point[];
  endPoint?: Point;
  rotation?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  imageData?: string;
}

export interface PDFState {
  file: File | null;
  numPages: number;
  currentPage: number;
  scale: number;
  rotation: number;
  annotations: Annotation[];
}

export type ExportFormat = 'pdf' | 'png' | 'jpeg' | 'webp';
export type ExportScope = 'all' | 'current';

export interface ExportOptions {
  format: ExportFormat;
  scope: ExportScope;
  quality?: number;
}
