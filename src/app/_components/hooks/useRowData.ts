import { api } from "~/trpc/react";

interface UseRowDataProps {
  tableId: string;
  viewId: string;
  searchString?: string;
}

export function useRowData({ tableId, viewId, searchString }: UseRowDataProps) {
  const utils = api.useUtils();

  const createRandomRowsMutation = api.table.createRandomRows.useMutation({
    onSuccess: () => {
      void utils.view.getViewRowsPaginated.reset({viewId, limit: 80, searchString});
    },
    onError: (error) => {
      console.error("Failed to create random rows:", error);
    },
  });

  const handleAddRows = (numberOfRows: number) => {
    createRandomRowsMutation.mutate({
      tableId: tableId,
      numberOfRows: numberOfRows,
    });
  };

  return {
    isAddingRow: createRandomRowsMutation.isPending,
    handleAddRows,
  };
}