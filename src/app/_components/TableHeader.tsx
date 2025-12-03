import React from "react";
import type { TableColumn } from "./types/DataTable.types";
import type { VirtualItem } from "@tanstack/react-virtual";

export interface TableHeaderProps {
  columns: TableColumn[];
  virtualColumns: VirtualItem[];
  totalWidth: number;
}

export function TableHeader({ columns, virtualColumns, totalWidth }: TableHeaderProps) {
  return (
    <div
      className="sticky top-0 z-10 border-b border-gray-200"
      style={{
        height: "40px",
      }}
    >
      <div 
        className="relative h-full"
        style={{
          width: `${totalWidth}px`,
        }}
      >
        {virtualColumns.map((virtualColumn) => {
          const column = columns[virtualColumn.index];
          if (!column) return null;

          return (
            <div
              key={column.id}
              className="absolute flex h-full items-center border-r border-gray-200 px-3 font-normal"
              style={{
                left: `${virtualColumn.start}px`,
                width: `${virtualColumn.size}px`,
              }}
            >
              <span className="truncate">{column.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}