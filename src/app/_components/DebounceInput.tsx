import React, { useState, useEffect, useRef } from "react";

interface DebounceInputProps {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  type?: string;
  disabled?: boolean;
}

export const DebounceInput: React.FC<DebounceInputProps> = ({
  value,
  onChange,
  delay = 500,
  placeholder,
  className = "",
  onKeyDown,
  type = "text",
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (inputValue !== value) {
        onChange(inputValue);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue, delay, onChange, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onChange(inputValue);
  }

  return (
    <input
      type={type}
      value={inputValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      onKeyDown={onKeyDown}
      onBlur={handleBlur}
      disabled={disabled}
    />
  );
};