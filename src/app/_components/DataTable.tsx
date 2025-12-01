"use client";

import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { api } from "~/trpc/react";
import { useDebouncedCallback } from "use-debounce";

interface TableRow {
  id: string;
  [columnId: string]: string | null;
}

interface TableData {
  id: string;
  name: string;
  baseId: string;
  columns: {
    id: string;
    name: string;
    type: string;
    orderIndex: number;
  }[];
  rows: TableRow[];
}

interface DataTableProps {
  data: TableData;
}

interface CellPosition {
  rowIndex: number;
  columnIndex: number;
}

export function DataTable({ data }: DataTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const parentHeaderRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [cellValues, setCellValues] = useState<Record<string, string>>({});
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const sortedColumns = useMemo(
    () => [...data.columns].sort((a, b) => a.orderIndex - b.orderIndex),
    [data.columns],
  );

  const upsertCellMutation = api.cell.upsert.useMutation({
    onError: (error) => {
      console.error("Failed to upsert cell:", error);
    },
  });

  const debouncedSaveCell = useDebouncedCallback(
    (rowId: string, columnId: string, value: string) => {
      void (async () => {
      try {
        await upsertCellMutation.mutateAsync({
          rowId,
          columnId,
          tableId: data.id,
          value: value || null,
        });
      } catch (error) {
        console.error("Error saving cell:", error);
        // TODO: We can do escalation retries
      }
      })();
    },
    500
  );

  const handleCellChange = useCallback(
    (rowId: string, columnId: string, value: string) => {
      const key = `${rowId}-${columnId}`;
      
      setCellValues(prev => ({
        ...prev,
        [key]: value,
      }));

      debouncedSaveCell(rowId, columnId, value);
    },
    [debouncedSaveCell]
  );

  const startEditing = useCallback((rowIndex: number, columnIndex: number) => {
    const row = data.rows[rowIndex];
    const column = sortedColumns[columnIndex];
    if (!row || !column) return;

    const cellKey = `${row.id}-${column.id}`;
    const currentValue = cellValues[cellKey] ?? row[column.id] ?? "";
    
    setEditingCell({ rowIndex, columnIndex });
    setEditValue(currentValue);
    
    // Focus the input after state update
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, [data.rows, sortedColumns, cellValues]);

  const stopEditing = useCallback(() => {
    if (!editingCell) return;

    const row = data.rows[editingCell.rowIndex];
    const column = sortedColumns[editingCell.columnIndex];
    if (row && column) {
      handleCellChange(row.id, column.id, editValue);
    }

    setEditingCell(null);
    setEditValue("");
  }, [editingCell, editValue, data.rows, sortedColumns, handleCellChange]);

  const handleCellClick = useCallback((rowIndex: number, columnIndex: number) => {
    setSelectedCell({ rowIndex, columnIndex });
  }, []);

  const handleCellDoubleClick = useCallback((rowIndex: number, columnIndex: number) => {
    startEditing(rowIndex, columnIndex);
  }, [startEditing]);

  const moveSelection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedCell) return;

    const { rowIndex, columnIndex } = selectedCell;
    let newRowIndex = rowIndex;
    let newColumnIndex = columnIndex;

    switch (direction) {
      case 'up':
        newRowIndex = Math.max(0, rowIndex - 1);
        break;
      case 'down':
        newRowIndex = Math.min(data.rows.length - 1, rowIndex + 1);
        break;
      case 'left':
        newColumnIndex = Math.max(0, columnIndex - 1);
        break;
      case 'right':
        newColumnIndex = Math.min(sortedColumns.length - 1, columnIndex + 1);
        break;
    }

    setSelectedCell({ rowIndex: newRowIndex, columnIndex: newColumnIndex });
  }, [selectedCell, data.rows.length, sortedColumns.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (editingCell) {
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

    // Handle keys during selection
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
  }, [editingCell, selectedCell, stopEditing, moveSelection, startEditing]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Auto-focus the table container to enable keyboard navigation
  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.focus();
    }
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: data.rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: sortedColumns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const virtualColumns = columnVirtualizer.getVirtualItems();

  return (
    <div className="h-full w-full overflow-hidden bg-white">
      {/* Header */}
      <div
        ref={parentHeaderRef}
        className="sticky top-0 z-10 border-b border-gray-200"
        style={{
          height: "40px",
        }}
      >
        <div
          className="relative"
          style={{
            width: `${columnVirtualizer.getTotalSize()}px`,
            height: "100%",
          }}
        >
          {virtualColumns.map((virtualColumn) => {
            const column = sortedColumns[virtualColumn.index];
            return (
              <div
                key={column?.id}
                className="absolute top-0 flex h-full items-center border-r border-gray-200 px-3 font-normal"
                style={{
                  left: `${virtualColumn.start}px`,
                  width: `${virtualColumn.size}px`,
                }}
              >
                <span className="truncate">{column?.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table Body */}
      <div
        ref={parentRef}
        className="h-full overflow-auto focus:outline-none"
        style={{
          height: "calc(100% - 40px)", // Subtract header height
        }}
        tabIndex={0}
      >
        <div
          className="relative"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: `${columnVirtualizer.getTotalSize()}px`,
          }}
        >
          {virtualRows.map((virtualRow) => {
            const row = data.rows[virtualRow.index];
            return (
              <div
                key={row?.id}
                className="absolute w-full border-b border-gray-200 hover:bg-gray-50"
                style={{
                  top: `${virtualRow.start}px`,
                  height: `${virtualRow.size}px`,
                }}
              >
                {virtualColumns.map((virtualColumn) => {
                  const column = sortedColumns[virtualColumn.index];
                  const cellKey = `${row?.id}-${column?.id}`;
                  // Use local value if exists, otherwise use server data
                  const cellValue = cellValues[cellKey] ?? row?.[column?.id ?? ""] ?? "";

                  return (
                    <div
                      key={cellKey}
                      className={`absolute flex h-full items-center border-r border-gray-200 px-3 cursor-pointer ${
                        selectedCell?.rowIndex === virtualRow.index && selectedCell?.columnIndex === virtualColumn.index
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      style={{
                        left: `${virtualColumn.start}px`,
                        width: `${virtualColumn.size}px`,
                      }}
                      onClick={() => handleCellClick(virtualRow.index, virtualColumn.index)}
                      onDoubleClick={() => handleCellDoubleClick(virtualRow.index, virtualColumn.index)}
                    >
                      <div className="w-full">
                        {editingCell?.rowIndex === virtualRow.index && editingCell?.columnIndex === virtualColumn.index ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => stopEditing()}
                            className="w-full border-none bg-transparent p-0 text-sm focus:outline-none"
                            placeholder="Empty"
                          />
                        ) : (
                          <span className="text-sm text-gray-900 truncate block w-full">
                            {cellValue || <span className="text-gray-400">Empty</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}