"use client";

import React, { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TableHeader } from "./TableHeader";
import { VirtualizedRow } from "./VirtualizedRow";
import { useDataTableLogic } from "./hooks/useDataTableLogic";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { api } from "~/trpc/react";
import { GoPlus } from "react-icons/go";
import { PiMagicWandThin } from "react-icons/pi";

export interface DataTableProps {
  tableId: string;
}

export function DataTable({ tableId }: DataTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = api.table.getTableRowsPaginated.useInfiniteQuery(
    { id: tableId, limit: 50 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const createRandomRowsMutation = api.table.createRandomRows.useMutation({
    onSuccess: () => {
      void refetch();
    },
    onError: (error) => {
      console.error("Failed to create random rows:", error);
    },
  });

  const rows = data?.pages.flatMap(page => page.rows) ?? [];

  const columns = data?.pages[0]?.columns ?? [];

  const {
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
  } = useDataTableLogic({
    tableId,
    rows,
    columns,
  });

  useKeyboardNavigation({
    selectedCell,
    isEditing,
    rowCount: rows.length,
    columnCount: columns.length,
    setSelectedCell,
    setEditValue,
    startEditing,
    stopEditing,
  });

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 40,
    getScrollElement: () => parentRef.current,
    overscan: 10,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const virtualColumns = columnVirtualizer.getVirtualItems();

  useEffect(() => {
    if (!parentRef.current) return;

    const scrollElement = parentRef.current;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      if (scrollPercentage > 0.8 && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    };

    scrollElement.addEventListener("scroll", handleScroll);
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="h-full w-full overflow-hidden bg-white relative">
      <TableHeader
        columns={columns}
        virtualColumns={virtualColumns}
        totalWidth={columnVirtualizer.getTotalSize()}
      />

      {/* Table Body */}
      <div
        ref={parentRef}
        className="h-full overflow-auto focus:outline-none"
        style={{
          height: "calc(100% - 40px)",
        }}
        tabIndex={0}
      >
        <div
          className="relative"
          style={{
            height: `${rowVirtualizer.getTotalSize() + 400}px`,
            width: `${columnVirtualizer.getTotalSize()}px`,
          }}
        >
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            if (!row) return null;

            return (
              <VirtualizedRow
                key={row.id}
                virtualRow={virtualRow}
                virtualColumns={virtualColumns}
                row={row}
                columns={columns}
                cellValues={cellValues}
                selectedCell={selectedCell}
                isEditing={isEditing}
                editValue={editValue}
                onCellClick={handleCellClick}
                onCellDoubleClick={handleCellDoubleClick}
                onEditValueChange={setEditValue}
                onStopEditing={stopEditing}
              />
            );
          })}

          {/* Loading indicator */}
          {isFetchingNextPage && (
            <div
              className="absolute left-0 right-0 flex items-center justify-center py-4 text-gray-500"
              style={{
                top: `${rowVirtualizer.getTotalSize()}px`,
                height: "40px",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                <span>Loading more rows...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Footer */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gray-50 border-t border-gray-200 flex items-center px-4 text-sm text-gray-600 shadow-lg">
        <div className="flex items-center gap-2 text-gray-900 font-light text-xs">
          <span>{data?.pages[0]?.totalRows} records</span>
        </div>
      </div>

      {/* Floating Add Record Button */}
      <div className="absolute bottom-9 left-3 flex shadow-lg bg-white rounded-full border border-gray-300">
        <button
          className=" hover:bg-gray-200 text-gray-800  px-4 py-2 rounded-l-full  transition-colors duration-200 flex items-center justify-center"
          onClick={() => {
            createRandomRowsMutation.mutate({
              tableId: tableId,
              numberOfRows: 1,
            });
          }}
          disabled={createRandomRowsMutation.isPending}
        >
          <GoPlus className="w-5 h-5" />
        </button>
        <button
          className="bg-white hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-r-full border-l border-gray-300 transition-colors duration-200 flex items-center justify-center gap-2"
          onClick={() => {
            createRandomRowsMutation.mutate({
              tableId: tableId,
              numberOfRows: 100000,
            });
          }}
          disabled={createRandomRowsMutation.isPending}
        >
          <PiMagicWandThin className="w-5 h-5" />
          <span className="text-xs">Add 100,000 rows</span>
        </button>
      </div>
    </div>
  );
}