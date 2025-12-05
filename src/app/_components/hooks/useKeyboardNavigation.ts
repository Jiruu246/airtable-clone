import { useCallback, useEffect } from "react";
import type { CellPosition } from "../types/DataTable.types";

interface UseKeyboardNavigationProps {
  tableRef: React.RefObject<HTMLDivElement | null>;
  selectedCell: CellPosition | null;
  isEditing: boolean;
  rowCount: number;
  columnCount: number;
  setSelectedCell: (cell: CellPosition | null) => void;
  scrollToRow: (rowIndex: number) => void;
  scrollToColumn: (columnIndex: number) => void;
  setEditValue: (value: string) => void;
  startEditing: (rowIndex: number, columnIndex: number) => void;
  stopEditing: () => void;
}

export function useKeyboardNavigation({
  tableRef,
  selectedCell,
  isEditing,
  rowCount,
  columnCount,
  setSelectedCell,
  scrollToRow,
  scrollToColumn,
  setEditValue,
  startEditing,
  stopEditing,
}: UseKeyboardNavigationProps) {
  const moveSelection = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedCell) return;

    const { rowIndex, columnIndex } = selectedCell;
    let newRowIndex = rowIndex;
    let newColumnIndex = columnIndex;

    switch (direction) {
      case 'up':
        newRowIndex = Math.max(0, rowIndex - 1);
        break;
      case 'down':
        newRowIndex = Math.min(rowCount - 1, rowIndex + 1);
        break;
      case 'left':
        newColumnIndex = Math.max(0, columnIndex - 1);
        break;
      case 'right':
        newColumnIndex = Math.min(columnCount - 1, columnIndex + 1);
        break;
    }

    setSelectedCell({ rowIndex: newRowIndex, columnIndex: newColumnIndex });
    scrollToRow(newRowIndex);
    scrollToColumn(newColumnIndex);
  };

  // TODO: still has bugs when typing outside the grid like in any other input on the screen
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {

    if (!tableRef.current?.contains(document.activeElement)) return;

    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        stopEditing();
        moveSelection('down');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        stopEditing();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        stopEditing();
        moveSelection(e.shiftKey ? 'left' : 'right');
      }
      return;
    }

    if (!selectedCell) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveSelection('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveSelection('down');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveSelection('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveSelection('right');
        break;
      case 'Tab':
        e.preventDefault();
        moveSelection(e.shiftKey ? 'left' : 'right');
        break;
      case 'Enter':
        e.preventDefault();
        startEditing(selectedCell.rowIndex, selectedCell.columnIndex);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          e.preventDefault();
          startEditing(selectedCell.rowIndex, selectedCell.columnIndex);
          setEditValue(e.key);
        }
        break;
    }
  };

  return { handleKeyDown };
}