import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

interface UseHiddenColumnsProps {
  viewId?: string;
}

export function useHiddenColumns({ viewId }: UseHiddenColumnsProps) {
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  const { data: hiddenColumnsFromDb } = api.view.getHiddenColumns.useQuery(
    { viewId: viewId ?? "" },
    { enabled: !!viewId }
  );

  const addHiddenColumnMutation = api.view.addHiddenColumn.useMutation();
  const removeHiddenColumnMutation = api.view.removeHiddenColumn.useMutation();

  useEffect(() => {
    if (hiddenColumnsFromDb) {
      setHiddenColumns(new Set(hiddenColumnsFromDb));
    }
  }, [hiddenColumnsFromDb]);

  const toggleColumn = async (columnId: string) => {
    if (!viewId) return;

    const isCurrentlyHidden = hiddenColumns.has(columnId);
    
    // Optimistically update the UI
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyHidden) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });

    try {
      if (isCurrentlyHidden) {
        await removeHiddenColumnMutation.mutateAsync({
          viewId,
          columnId,
        });
      } else {
        await addHiddenColumnMutation.mutateAsync({
          viewId,
          columnId,
        });
      }
    } catch (error) {
      console.error('Failed to toggle column visibility:', error);
      // Revert the optimistic update on error
      setHiddenColumns(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyHidden) {
          newSet.add(columnId);
        } else {
          newSet.delete(columnId);
        }
        return newSet;
      });
    }
  };

  return {
    hiddenColumns,
    toggleColumn,
    isLoading: addHiddenColumnMutation.isPending || removeHiddenColumnMutation.isPending,
  };
}