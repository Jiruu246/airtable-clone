"use client";

import React from 'react';
import { Dropdown, DropdownItem } from './Dropdown';
import { LiaToggleOffSolid, LiaToggleOnSolid } from "react-icons/lia";
import type { TableColumn } from './types/DataTable.types';

interface HideFieldsDropdownProps {
  isOpen: boolean;
  columns: TableColumn[];
  hiddenColumns: Set<string>;
  onToggleColumn?: (columnId: string) => void;
}

export const HideFieldsDropdown: React.FC<HideFieldsDropdownProps> = ({
  isOpen,
  columns,
  hiddenColumns,
  onToggleColumn,
}) => {
  return (
    <Dropdown 
      isOpen={isOpen}
      positionClasses="top-full mt-1 right-0"
      width="w-64"
      header={
        <div className="text-sm font-medium text-gray-900">
          Hide fields
        </div>
      }
    >
      {columns.map((column) => {
        const isHidden = hiddenColumns.has(column.id);
        return (
          <DropdownItem
            key={column.id}
            icon={isHidden ? <LiaToggleOffSolid className="w-4 h-4" /> : <LiaToggleOnSolid className="w-4 h-4" />}
            label={column.name}
            onClick={() => onToggleColumn?.(column.id)}
            className={`${isHidden ? "text-gray-300" : "text-gray-700"}`}
          />
        );
      })}
    </Dropdown>
  );
};