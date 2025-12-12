"use client";

import React, { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TableHeader } from "./TableHeader";
import { VirtualizedRow } from "./VirtualizedRow";
import { useCellData } from "./hooks/useCellData";
import { useRowData } from "./hooks/useRowData";
import { useColumnData } from "./hooks/useColumnData";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { api } from "~/trpc/react";
import { GoPlus } from "react-icons/go";
import { PiMagicWandThin } from "react-icons/pi";
import type { TableColumn } from "./types/DataTable.types";

const BOTTOM_PADDING = 400;
const ROW_INDEX_COLUMN_WIDTH = 40;

export interface DataTableProps {
  tableId: string;
  viewId: string;
  visibleColumns: TableColumn[];
  searchString?: string;
}

export function DataTable({ tableId, viewId, visibleColumns, searchString }: DataTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const tableContentRef = useRef<HTMLDivElement>(null);
  const metaData = api.view.getViewMetadata.useQuery({ viewId: viewId });

  // The data update is now broken when go back and forth between base, the data is not up to date until a refetch is triggered
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = api.view.getViewRowsPaginated.useInfiniteQuery(
    { viewId: viewId, limit: 50, searchString },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const rows = data?.pages.flatMap(page => page.rows) ?? [];

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 40,
    getScrollElement: () => parentRef.current,
    overscan: 10,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: visibleColumns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
  });

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
  } = useCellData({
    tableId,
    viewId,
    rows,
    columns: visibleColumns,
  });

  const { isAddingRow, handleAddRows } = useRowData({
    tableId,
    viewId,
    refetch,
  });

  const { isAddingColumn, handleAddColumn } = useColumnData({
    tableId,
    viewId,
  });

  const { handleKeyDown } = useKeyboardNavigation({
    tableRef: tableContentRef,
    selectedCell,
    isEditing,
    rowCount: rows.length,
    columnCount: visibleColumns.length,
    setSelectedCell,
    scrollToRow: rowVirtualizer.scrollToIndex,
    scrollToColumn: columnVirtualizer.scrollToIndex,
    setEditValue,
    startEditing,
    stopEditing,
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
      <div
        ref={parentRef}
        className="h-full overflow-auto bg-gray-100"
      >
        <TableHeader
          columns={visibleColumns}
          virtualColumns={virtualColumns}
          totalWidth={columnVirtualizer.getTotalSize() + ROW_INDEX_COLUMN_WIDTH}
          onAddColumn={handleAddColumn}
          isAddingColumn={isAddingColumn}
        />
        <div
          ref={tableContentRef}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className="relative focus:outline-none"
          style={{
            height: `${rowVirtualizer.getTotalSize() + BOTTOM_PADDING}px`,
            width: `${columnVirtualizer.getTotalSize() + ROW_INDEX_COLUMN_WIDTH}px`,
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
                columns={visibleColumns}
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
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                <span>Loading more rows...</span>
              </div>
            </div>
          )}
        </div>
        {/* Floating Footer */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gray-50 border-t border-gray-200 flex items-center px-4 text-sm text-gray-600 shadow-lg z-3">
          <div className="flex items-center gap-2 text-gray-900 font-light text-xs">
            <span>{metaData.data?.totalRows} records</span>
          </div>
        </div>

        {/* Floating Add Record Button */}
        <div className="absolute bottom-9 left-3 flex shadow-lg bg-white rounded-full border border-gray-300 z-4">
          <button
            className=" hover:bg-gray-200 hover:cursor-pointer disabled:cursor-not-allowed text-gray-800  px-4 py-2 rounded-l-full  transition-colors duration-200 flex items-center justify-center"
            onClick={() => handleAddRows(1)}
            disabled={isAddingRow}
          >
            {isAddingRow ? (
              <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin inline-block" />
            ) : (
              <GoPlus className="w-5 h-5" />
            )}
          </button>
          <button
            className="bg-white hover:bg-gray-200 hover:cursor-pointer disabled:cursor-not-allowed text-gray-800 px-4 py-2 rounded-r-full border-l border-gray-300 transition-colors duration-200 flex items-center justify-center gap-2"
            onClick={() => handleAddRows(100000)}
            disabled={isAddingRow}
          >
            {isAddingRow ? (
              <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin inline-block" />
            ) : (
              <PiMagicWandThin className="w-5 h-5" />
            )}
            <span className="text-xs">Add 100,000 rows</span>
          </button>
        </div>
      </div>
    </div>
  );
}