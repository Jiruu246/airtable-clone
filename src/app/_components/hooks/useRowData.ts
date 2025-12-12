import { api } from "~/trpc/react";

interface UseRowDataProps {
  tableId: string;
  viewId: string;
  refetch: () => Promise<unknown>;
}

export function useRowData({ tableId, viewId, refetch }: UseRowDataProps) {
  const utils = api.useUtils();

  // TODO: Find a better way to optimize refetching after adding rows
  const createRandomRowsMutation = api.table.createRandomRows.useMutation({
    onSuccess: () => {
      void refetch();
      void utils.view.getViewMetadata.invalidate({ viewId: viewId });
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