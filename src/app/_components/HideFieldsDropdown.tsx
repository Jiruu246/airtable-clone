"use client";

import React, { useState } from 'react';
import { LiaToggleOffSolid, LiaToggleOnSolid } from "react-icons/lia";
import { FaRegEyeSlash } from "react-icons/fa";
import type { TableColumn } from './types/DataTable.types';
import { DropdownBase, DropdownItemBase } from './DropdownBase';

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
        className={`flex items-center gap-2 text-gray-600  px-3 py-1.5 rounded text-sm ${hiddenColumns.size > 0 ? 'bg-blue-200' : 'hover:bg-gray-100'
          }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaRegEyeSlash className="w-4 h-4" />
        <span>{hiddenColumns.size > 0 ? `${hiddenColumns.size} hidden fields` : 'Hide fields'}</span>
      </button>
      <DropdownBase
        isOpen={isOpen}
        positionClasses="top-full mt-1 right-0"
        width="w-64"
        header={
          <div className="text-sm font-medium text-gray-900">
            Hide fields
          </div>
        }
        onClose={() => setIsOpen(false)}
      >
        {columns.map((column) => {
          const isHidden = hiddenColumns.has(column.id);
          return (
            <DropdownItemBase
              key={column.id}
              icon={isHidden ? <LiaToggleOffSolid className="w-4 h-4" /> : <LiaToggleOnSolid className="w-4 h-4" />}
              label={column.name}
              onClick={() => onToggleColumn?.(column.id)}
              className={`${isHidden ? "text-gray-300" : "text-gray-700"}`}
            />
          );
        })}
      </DropdownBase>
    </div>
  );
};