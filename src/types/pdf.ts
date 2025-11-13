export type Tool = 
  | 'select'
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'highlight'
  | 'pen'
  | 'eraser';

export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  type: Tool;
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
  textColor?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface PDFState {
  file: File | null;
  numPages: number;
  currentPage: number;
  scale: number;
  rotation: number;
  annotations: Annotation[];
}
