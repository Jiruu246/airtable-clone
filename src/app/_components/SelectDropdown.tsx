"use client";

import React, { useState, useRef, useEffect } from 'react';
import { IoChevronDown } from "react-icons/io5";

interface SelectOption {
  key: string;
  value: string;
}

interface SelectDropdownProps {
  options: SelectOption[];
  PreSelectedKey?: string;
  onSelectItem?: (key: string) => void;
  placeholder?: string;
  className?: string;
  controlClassName?: string;
  dropdownClassName?: string;
  disabled?: boolean;
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  options,
  PreSelectedKey,
  onSelectItem,
  placeholder = "Select option",
  className = "",
  controlClassName = "",
  dropdownClassName = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.key === PreSelectedKey);
  const displayValue = selectedOption?.value ?? placeholder;

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const selectOption = (key: string) => {
    onSelectItem?.(key);
    setIsOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        disabled={disabled}
        className={`w-full flex items-center justify-between text-sm border-gray-200 hover:bg-gray-200 ${controlClassName} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <span className="text-gray-700 truncate flex-1 text-left mr-2" title={displayValue}>{displayValue}</span>
        <IoChevronDown className={`w-4 h-4 text-gray-400 shrink-0`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-1 left-0 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-48 overflow-y-auto ${dropdownClassName}`}>
          {options.map((option) => (
            <button
              key={option.key}
              onClick={() => selectOption(option.key)}
              className={`w-full px-3 py-3 text-left text-sm hover:bg-gray-50 text-gray-700 truncate ${
                option.key === PreSelectedKey ? 'bg-gray-50' : ''
              }`}
              title={option.value}
            >
              {option.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};