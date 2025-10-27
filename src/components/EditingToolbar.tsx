import React from 'react';
import {
  Type,
  Highlighter,
  Pen,
  Trash2,
  Download,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { Button } from './ui/button';

export type ToolType = 'text' | 'highlight' | 'draw' | 'erase';

interface EditingToolbarProps {
  activeTool: ToolType | null;
  onToolSelect: (tool: ToolType | null) => void;
  onSave: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onClear?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const EditingToolbar: React.FC<EditingToolbarProps> = ({
  activeTool,
  onToolSelect,
  onSave,
  onUndo,
  onRedo,
  onClear,
  canUndo = false,
  canRedo = false,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-2 flex-wrap">
      {/* Text & Drawing Tools */}
      <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
        <Button
          variant={activeTool === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToolSelect(activeTool === 'text' ? null : 'text')}
          title="Add Text"
        >
          <Type className="w-4 h-4 mr-1" />
          Text
        </Button>

        <Button
          variant={activeTool === 'highlight' ? 'default' : 'outline'}
          size="sm"
          onClick={() =>
            onToolSelect(activeTool === 'highlight' ? null : 'highlight')
          }
          title="Highlight"
        >
          <Highlighter className="w-4 h-4 mr-1" />
          Highlight
        </Button>

        <Button
          variant={activeTool === 'draw' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToolSelect(activeTool === 'draw' ? null : 'draw')}
          title="Draw"
        >
          <Pen className="w-4 h-4 mr-1" />
          Draw
        </Button>

        <Button
          variant={activeTool === 'erase' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToolSelect(activeTool === 'erase' ? null : 'erase')}
          title="Erase"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Erase
        </Button>
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-2 border-r border-gray-200 px-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto border-l border-gray-200 pl-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="text-red-600 hover:text-red-700"
          title="Clear All"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Clear
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          className="bg-blue-600 hover:bg-blue-700"
          title="Download PDF"
        >
          <Download className="w-4 h-4 mr-1" />
          Save PDF
        </Button>
      </div>
    </div>
  );
};
