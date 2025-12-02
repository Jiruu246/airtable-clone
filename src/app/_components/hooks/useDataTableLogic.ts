import { useState, useCallback } from "react";
import { api } from "~/trpc/react";
import { useDebouncedCallback } from "use-debounce";
import type { CellPosition, TableRow, TableColumn } from "../types/DataTable.types";

interface UseDataTableLogicProps {
  tableId: string;
  rows: TableRow[];
  columns: TableColumn[];
}

export function useDataTableLogic({ tableId, rows, columns }: UseDataTableLogicProps) {
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
            value: value || null,
          });
        } catch (error) {
          console.error("Error saving cell:", error);
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

      utils.table.getTableRowsPaginated.setInfiniteData(
        { id: tableId },
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
    },
    [debouncedSaveCell, utils.table.getTableRowsPaginated, tableId]
  );

  const startEditing = useCallback((rowIndex: number, columnIndex: number) => {
    const row = rows[rowIndex];
    const column = columns[columnIndex];
    if (!row || !column) return;

    const cellKey = `${row.id}-${column.id}`;
    const currentValue = cellValues[cellKey] ?? row[column.id] ?? "";
    
    setSelectedCell({ rowIndex, columnIndex });
    setIsEditing(true);
    setEditValue(currentValue);
  }, [rows, columns, cellValues]);

  const stopEditing = useCallback(() => {
    if (!isEditing || !selectedCell) return;

    const row = rows[selectedCell.rowIndex];
    const column = columns[selectedCell.columnIndex];
    if (row && column) {
      handleCellChange(row.id, column.id, editValue);
    }

    setIsEditing(false);
    setEditValue("");
  }, [isEditing, selectedCell, editValue, rows, columns, handleCellChange]);

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
    columns,
    setSelectedCell,
    setEditValue,
    startEditing,
    stopEditing,
    handleCellClick,
    handleCellDoubleClick,
  };
}