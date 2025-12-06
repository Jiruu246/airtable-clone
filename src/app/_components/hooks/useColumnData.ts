import { api } from "~/trpc/react";

interface UseColumnDataProps {
  tableId: string;
  viewId: string;
}

export function useColumnData({ tableId, viewId }: UseColumnDataProps) {
  const utils = api.useUtils();

  const addColumnMutation = api.table.addColumn.useMutation({
    onSuccess: () => {
      void utils.view.getViewMetadata.invalidate({ id: viewId });
    },
    onError: (error) => {
      console.error("Failed to add column:", error);
    },
  });

  const handleAddColumn = (columnTypeId: string, columnName: string) => {
    addColumnMutation.mutate({
      tableId: tableId,
      columnTypeId: columnTypeId,
      columnName: columnName,
    });
  };

  return {
    isAddingColumn: addColumnMutation.isPending,
    handleAddColumn,
  };
}