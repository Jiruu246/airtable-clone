"use client";

import React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

interface TableRow {
  id: string;
  [columnId: string]: string | null;
}

interface TableData {
  id: string;
  name: string;
  baseId: string;
  columns: {
    id: string;
    name: string;
    type: string;
    orderIndex: number;
  }[];
  rows: TableRow[];
}

interface DataTableProps {
  data: TableData;
}

export function DataTable({ data }: DataTableProps) {
  const columns: ColumnDef<TableRow>[] = React.useMemo(() => {
    return data.columns.map((column) => ({
      id: column.id,
      accessorKey: column.id,
      header: () => (
        <div className="font-semibold text-gray-900">{column.name}</div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string | null;
        return (
          <div className="px-3 py-2 text-sm text-gray-700">
            {value ?? ""}
          </div>
        );
      },
    }));
  }, [data.columns]);

  const table = useReactTable({
    data: data.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!data.rows.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">No data available</div>
          <div className="text-gray-400 text-sm">
            This table doesn&apos;t have any rows yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-gray-50 transition-colors duration-150"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-6 py-3 whitespace-nowrap border-r border-gray-200 last:border-r-0"
                >
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext(),
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}