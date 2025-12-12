"use client";

import React, { useState } from 'react';
import { IoClose } from "react-icons/io5";
import { DebounceInput } from './DebounceInput';
import { DropdownBase } from './DropdownBase';
import { IoSearch } from "react-icons/io5";

interface SearchDropdownProps {
  searchValue: string;
  onSearchChange?: (searchValue: string) => void;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  searchValue,
  onSearchChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    onSearchChange?.(value);
  };

  const handleClear = () => {
    onSearchChange?.('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        className="text-gray-600 hover:bg-gray-100 p-2 rounded"
        onClick={() => setIsOpen(!isOpen)}
      >
        <IoSearch className="w-4 h-4" />
      </button>
      <DropdownBase
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
      </DropdownBase>
    </div>
  );
};