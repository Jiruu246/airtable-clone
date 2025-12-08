import React, { useState, useRef, useEffect } from "react";
import type { TableColumn } from "./types/DataTable.types";
import type { VirtualItem } from "@tanstack/react-virtual";
import { GoPlus } from "react-icons/go";
import { Dropdown, DropdownItem } from "./Dropdown";
import { FaChevronDown } from "react-icons/fa6";
import { MdTextFormat } from "react-icons/md";
import { AiOutlineNumber } from "react-icons/ai";
import { ColumnTypeList, ColumnTypes, type ColumnTypeValue } from "~/data/columnTypes";

export interface TableHeaderProps {
  columns: TableColumn[];
  virtualColumns: VirtualItem[];
  totalWidth: number;
  onAddColumn?: (columnType: ColumnTypeValue, columnName: string) => void;
  isAddingColumn?: boolean;
}

export function TableHeader({ columns, virtualColumns, totalWidth, onAddColumn, isAddingColumn }: TableHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedColumnType, setSelectedColumnType] = useState<ColumnTypeValue | null>(null);
  const [fieldName, setFieldName] = useState('');
  const useDropdownRef = useRef<HTMLDivElement>(null);
  
  // const { data: columnTypes, isLoading: isLoadingColumnTypes } = api.metadata.getColumnTypes.useQuery();
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (useDropdownRef.current && !useDropdownRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleCreateField = () => {
    if (onAddColumn && fieldName.trim() && selectedColumnType) {
      onAddColumn(selectedColumnType, fieldName.trim());
      handleClose();
    }
  };

  const handleClose = () => {
    setIsDropdownOpen(false);
    setFieldName('');
    setSelectedColumnType(null);
  };

  const getColumnTypeIcon = (columnType: ColumnTypeValue) => {
    switch (columnType) {
      case ColumnTypes.Text.value:
        return <MdTextFormat className="w-4 h-4" />;
      case ColumnTypes.Number.value:
        return <AiOutlineNumber className="w-4 h-4" />;
      default:
        return <MdTextFormat className="w-4 h-4" />;
    }
  };

  return (
    <div
      className="sticky top-0 z-10 bg-gray-50 flex"
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
              className="absolute flex h-full items-center border-r border-b border-gray-200 px-3 font-normal bg-white"
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
      {/* Add Column Button */}
      {onAddColumn && (
        <div
          ref={useDropdownRef}
          className="absolute flex h-full items-center justify-center border-r border-b border-gray-200 hover:bg-gray-200 bg-white"
          style={{
            left: `${totalWidth}px`,
            width: "100px",
          }}
        >
          <div className="relative w-full flex justify-center">
            <button
              onClick={() => setIsDropdownOpen(true)}
              disabled={isAddingColumn}
              className="w-full flex h-8 items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <GoPlus className="h-4 w-4 text-gray-500" />
            </button>

            <Dropdown
              isOpen={isDropdownOpen}
              positionClasses="top-8 mt-1 right-5"
              width="w-112"
            >
              {!selectedColumnType ? (
                <>
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Select column type</h3>
                  </div>
                  {( ColumnTypeList?.map((columnType, index) => (
                      <DropdownItem
                        key={index}
                        icon={getColumnTypeIcon(columnType.value)}
                        label={columnType.name}
                        onClick={() => setSelectedColumnType(columnType.value)}
                      />
                    ))
                  )}
                </>
              ) : (
                <>
                  <div className="p-4">
                    <input
                      type="text"
                      value={fieldName}
                      onChange={(e) => setFieldName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Field name (optional)"
                    />
                  </div>
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => setSelectedColumnType(null)}
                      className="w-full flex items-center text-sm justify-between border border-gray-300 rounded-md px-3 py-2 hover:cursor-pointer"
                    >
                      {selectedColumnType && (
                        <div className="flex gap-2 items-center">
                          {getColumnTypeIcon(selectedColumnType)}
                          <p>{ColumnTypeList?.find(ct => ct.value === selectedColumnType)?.name}</p>
                        </div>
                      )}
                      <FaChevronDown className="w-3 h-3 text-gray-500" />
                    </button>
                      <p className="mt-2 text-xs text-gray-700">{ColumnTypeList?.find(ct => ct.value === selectedColumnType)?.longName}</p>
                  </div>
                  <div className="px-4 pb-4">
                    <p className="text-xs font-light text-gray-700 mb-1">Default</p>
                    <input
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter default value (optional)"
                    />
                  </div>
                  <div className="flex-1 flex gap-2 px-4 pb-4 justify-between text-sm">
                    <div className="flex gap-2 px-2 justify-center items-center rounded-md hover:bg-gray-100 hover:cursor-pointer">
                      <GoPlus className="w-5 h-5 text-gray-500" />
                      <p>Add description</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleClose}
                        className="px-3 py-2 text-gray-700 font-medium rounded-md hover:bg-gray-100 transition-colors hover:cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateField}
                        className="px-3 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-700 transition-colors hover:cursor-pointer"
                      >
                        Create field
                      </button>
                    </div>
                  </div>
                </>
              )}
            </Dropdown>
          </div>
        </div>
      )}
    </div>
  );
}