import React from "react";
import { TableCell } from "./TableCell";
import type { TableRow, TableColumn, CellPosition } from "./types/DataTable.types";
import type { VirtualItem } from "@tanstack/react-virtual";

export interface VirtualizedRowProps {
  virtualRow: VirtualItem;
  virtualColumns: VirtualItem[];
  row: TableRow;
  columns: TableColumn[];
  cellValues: Record<string, string>;
  selectedCell: CellPosition | null;
  isEditing: boolean;
  editValue: string;
  onCellClick: (rowIndex: number, columnIndex: number) => void;
  onCellDoubleClick: (rowIndex: number, columnIndex: number) => void;
  onEditValueChange: (value: string) => void;
  onStopEditing: () => void;
}

const ROW_INDEX_COLUMN_WIDTH = 84;

export function VirtualizedRow({
  virtualRow,
  virtualColumns,
  row,
  columns,
  cellValues,
  selectedCell,
  isEditing,
  editValue,
  onCellClick,
  onCellDoubleClick,
  onEditValueChange,
  onStopEditing,
}: VirtualizedRowProps) {
  return (
    <div
      className="absolute w-full border-b bg-white border-gray-200 hover:bg-gray-50"
      style={{
        top: `${virtualRow.start}px`,
        height: `${virtualRow.size}px`,
      }}
    >
      {/* Index column */}
      <div
        className="absolute p-2 flex items-center"
        style={{
          left: 0,
          width: `${ROW_INDEX_COLUMN_WIDTH}px`, 
          height: '100%',
        }}
      >
        <div className="flex items-center justify-center w-7">
          <p className="text-[clamp(0.05rem,0.70rem,0.70rem)] font-light text-gray-500">{virtualRow.index + 1}</p>
        </div>
      </div>

      {virtualColumns.map((virtualColumn) => {
        const column = columns[virtualColumn.index];
        const cellKey = `${row?.id}-${column?.id}`;
        const cellValue = cellValues[cellKey] ?? row?.[column?.id ?? ""] ?? "";
        
        const isSelected = selectedCell?.rowIndex === virtualRow.index && 
                          selectedCell?.columnIndex === virtualColumn.index;
        const isCellEditing = isEditing && isSelected;

        if (!column || !row) return null;

        return (
          <TableCell
            key={cellKey}
            value={cellValue}
            type={column.columnType}
            isSelected={isSelected}
            isEditing={isCellEditing}
            editValue={editValue}
            onClick={() => onCellClick(virtualRow.index, virtualColumn.index)}
            onDoubleClick={() => onCellDoubleClick(virtualRow.index, virtualColumn.index)}
            onEditValueChange={onEditValueChange}
            onStopEditing={onStopEditing}
            style={{
              left: `${virtualColumn.start + ROW_INDEX_COLUMN_WIDTH}px`,
              width: `${virtualColumn.size}px`,
            }}
          />
        );
      })}
    </div>
  );
}