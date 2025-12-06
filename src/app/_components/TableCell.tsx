import React, { useRef, useEffect } from "react";

export interface CellProps {
  value: string;
  type: string;
  isSelected: boolean;
  isEditing: boolean;
  editValue: string;
  onClick: () => void;
  onDoubleClick: () => void;
  onEditValueChange: (value: string) => void;
  onStopEditing: () => void;
}

export function TableCell({
  value,
  type,
  isSelected,
  isEditing,
  editValue,
  onClick,
  onDoubleClick,
  onEditValueChange,
  onStopEditing,
  style,
}: CellProps & { style?: React.CSSProperties }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {

    if (type === "NUM") {
      const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End', '.', '-'
      ];
      if (e.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) {
        return;
      }
      if (allowedKeys.includes(e.key)) {
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        return;
      }

      e.preventDefault();
    }
  };

  return (
    <div
      className={`absolute flex h-full items-center border-r border-gray-200 px-3 cursor-pointer ${
        isSelected
          ? 'ring-2 ring-blue-500 bg-blue-50'
          : 'hover:bg-gray-50'
      }`}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="w-full">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onStopEditing}
            className="w-full border-none bg-transparent p-0 text-sm focus:outline-none"
          />
        ) : (
          <span className="text-sm text-gray-900 truncate block w-full">
            {value ?? "\u00A0"}
          </span>
        )}
      </div>
    </div>
  );
}