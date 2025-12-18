"use client";

import React, { useState } from 'react';
import { LiaToggleOffSolid, LiaToggleOnSolid } from "react-icons/lia";
import { FaRegEyeSlash } from "react-icons/fa";
import type { TableColumn } from './types/DataTable.types';
import { DropdownBase } from './DropdownBase';
import { GoQuestion } from "react-icons/go";
import { ColumnTypes, type ColumnTypeValue } from '~/data/columnTypes';
import { MdTextFormat } from 'react-icons/md';
import { AiOutlineNumber } from 'react-icons/ai';
import { GoGrabber } from "react-icons/go";

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

interface HideFieldsDropdownProps {
  columns: TableColumn[];
  hiddenColumns: Set<string>;
  onToggleColumn?: (columnId: string) => void;
}

export const HideFieldsDropdown: React.FC<HideFieldsDropdownProps> = ({
  columns,
  hiddenColumns,
  onToggleColumn,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs font-light ${hiddenColumns.size > 0 ? 'bg-blue-200 text-gray-900' : 'hover:bg-gray-100 text-gray-600'
          }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaRegEyeSlash className="w-4 h-4" />
        <span>{hiddenColumns.size > 0 ? `${hiddenColumns.size} hidden field${hiddenColumns.size > 1 ? 's' : ''}` : 'Hide fields'}</span>
      </button>
      <DropdownBase
        isOpen={isOpen}
        positionClasses="top-full mt-1 right-0"
        width="w-80"
        header={
          <div className="flex justify-between text-xs font-normal text-gray-400">
            <p>Find a field</p>
            <GoQuestion className="w-4 h-4" />
          </div>
        }
        onClose={() => setIsOpen(false)}
      >
        <div className="w-full flex flex-col gap-1 py-2">
          {columns.map((column) => {
            const isHidden = hiddenColumns.has(column.id);
            return (
                <button
                  key={column.id}
                  className="w-full flex items-center justify-between gap-2 px-2 text-left text-xs hover:cursor-pointer"
                  onClick={() => onToggleColumn?.(column.id)}
                >
                  <div className="flex items-center gap-2 flex-1 text-xs font-normal hover:bg-gray-100 rounded-sm p-1">
                    {isHidden ? <LiaToggleOffSolid className="w-3 h-3 text-gray-400" /> : <LiaToggleOnSolid className="w-3 h-3" />}
                    {getColumnTypeIcon(column.columnType)}
                    <p>{column.name}</p>
                  </div>
                  <GoGrabber className="w-4 h-4 text-gray-600" />
              </button>
            );
          })}
        </div>
        <div className="flex gap-4 justify-between mt-2">
          <button
            className="flex-1 px-3 py-2 text-xs text-center text-gray-500 hover:text-gray-600 bg-gray-100 hover:cursor-pointer rounded-sm"
          >
            Hide all
          </button>
                    <button
            className="flex-1 px-3 py-2 text-xs text-center text-gray-500 hover:text-gray-600 bg-gray-100 hover:cursor-pointer rounded-sm"
          >
            Show all
          </button>
        </div>
      </DropdownBase>
    </div>
  );
};