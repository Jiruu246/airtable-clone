"use client";

import React, { useState } from 'react';
import { Dropdown } from './Dropdown';
import { IoClose } from "react-icons/io5";
import { DebounceInput } from './DebounceInput';

interface SearchDropdownProps {
  isOpen: boolean;
  onSearchChange?: (searchValue: string) => void;
  onClose?: () => void;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  isOpen,
  onSearchChange,
  onClose,
}) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearchChange?.(value);
  };

  const handleClear = () => {
    setSearchValue('');
    onSearchChange?.('');
    onClose?.();
  };

  return (
    <Dropdown
      isOpen={isOpen}
      positionClasses="top-full mt-1 right-0"
      width="w-80"
    >
      <div className="p-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <DebounceInput
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="Find in view..."
              className="w-full px-2 text-sm focus:outline-none"
              delay={300}
            />
          </div>
          <button
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Clear search"
          >
            <IoClose className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Dropdown>
  );
};