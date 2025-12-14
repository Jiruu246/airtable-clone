import { useState } from "react";
import { api } from "~/trpc/react";

interface UseRowDataProps {
  tableId: string;
  viewId: string;
  searchString?: string;
}

export function useRowData({ tableId, viewId, searchString }: UseRowDataProps) {
  const [isAddingRow, setIsAddingRow] = useState<boolean>(false);
  const utils = api.useUtils();

  const createRandomRowsMutation = api.table.createRandomRows.useMutation({
    onSuccess: () => {
      void utils.view.getViewRowsPaginated.reset({viewId, limit: 80, searchString});
    },
    onError: (error) => {
      console.error("Failed to create random rows:", error);
    },
  });

  const handleAddRows = async (numberOfRows: number) => {
    setIsAddingRow(true);

    const CHUNK_SIZE = 5_000;

    try {
      for (let i = 0; i < numberOfRows; i += CHUNK_SIZE) {
        const chunkSize = Math.min(CHUNK_SIZE, numberOfRows - i);
        await createRandomRowsMutation.mutateAsync({
          tableId: tableId,
          numberOfRows: chunkSize,
        });
      }
    } catch (error) {
      console.error("Error adding rows:", error);
    } finally {
      setIsAddingRow(false);
    }
  };

  return {
    isAddingRow,
    handleAddRows,
  };
}