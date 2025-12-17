import { useState } from "react";
import { api } from "~/trpc/react";
import { useDebouncedCallback } from "use-debounce";
import type { CellPosition, TableRow, TableColumn } from "../types/DataTable.types";

interface UseCellDataProps {
  tableId: string;
  viewId: string;
  rows: TableRow[];
  columns: TableColumn[];
}

export function useCellData({ tableId, viewId, rows, columns }: UseCellDataProps) {
  const [cellValues, setCellValues] = useState<Record<string, string>>({});
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>("");

  const utils = api.useUtils();

  const upsertCellMutation = api.cell.upsert.useMutation({
    onError: (error, variables) => {
      console.error("Failed to upsert cell:", error);

      const key = `${variables.rowId}-${variables.columnId}`;
      setCellValues(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    },
  });

  const debouncedSaveCell = useDebouncedCallback(
    (rowId: string, columnId: string, value: string) => {
      void (async () => {
        try {
          await upsertCellMutation.mutateAsync({
            rowId,
            columnId,
            tableId,
            value: value,
          });
        } catch (error) {
          console.error("Error saving cell:", error);
        }
      })();
    },
    500
  );

  const handleCellChange = (rowId: string, columnId: string, value: string) => {
    const key = `${rowId}-${columnId}`;

    setCellValues(prev => ({
      ...prev,
      [key]: value,
    }));

    utils.view.getViewRowsPaginated.setInfiniteData(
      { viewId: viewId },
      (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            rows: page.rows.map(row =>
              row.id === rowId
                ? { ...row, [columnId]: value }
                : row
            )
          }))
        };
      }
    );

    debouncedSaveCell(rowId, columnId, value);
  };

  const startEditing = (rowIndex: number, columnIndex: number) => {
    const row = rows[rowIndex];
    const column = columns[columnIndex];
    if (!row || !column) return;

    const cellKey = `${row.id}-${column.id}`;
    const currentValue = cellValues[cellKey] ?? row[column.id] ?? "";

    setSelectedCell({ rowIndex, columnIndex });
    setIsEditing(true);
    setEditValue(currentValue);
  };

  const stopEditing = (focusRef?: React.RefObject<HTMLDivElement | null>) => {
    if (!isEditing || !selectedCell) return;

    const row = rows[selectedCell.rowIndex];
    const column = columns[selectedCell.columnIndex];
    if (row && column) {
      handleCellChange(row.id, column.id, editValue);
    }

    setIsEditing(false);
    setEditValue("");
    focusRef?.current?.focus();
  };

  const handleCellClick = (rowIndex: number, columnIndex: number) => {
    setSelectedCell({ rowIndex, columnIndex });
  };

  const handleCellDoubleClick = (rowIndex: number, columnIndex: number) => {
    startEditing(rowIndex, columnIndex);
  };

  return {
    cellValues,
    selectedCell,
    isEditing,
    editValue,
    setSelectedCell,
    setEditValue,
    startEditing,
    stopEditing,
    handleCellClick,
    handleCellDoubleClick,
    handleCellChange,
  };
}