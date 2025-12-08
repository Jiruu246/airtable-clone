"use client";

import React from 'react';
import { MdOutlineChevronRight } from "react-icons/md";

interface DropdownItemProps {
    icon?: React.ReactNode;
    label: string;
    hasArrow?: boolean;
    onClick?: () => void;
    isDivider?: boolean;
    className?: string;
    disabled?: boolean;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
    icon,
    label,
    hasArrow,
    onClick,
    isDivider,
    className = "",
    disabled = false
}) => {
    const content = (
        <>
            {icon && <span className={disabled ? "text-gray-400" : "text-gray-600"}>{icon}</span>}
            <span className="flex-1">{label}</span>
            {hasArrow && <MdOutlineChevronRight className="w-4 h-4 text-gray-400" />}
        </>
    );

    const baseClassName = `w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left text-sm ${
        disabled 
            ? "text-gray-400 cursor-not-allowed" 
            : "text-gray-700 hover:bg-gray-50 hover:cursor-pointer"
    } ${className}`;

    return (
        <>
            <button 
                onClick={disabled ? undefined : onClick} 
                disabled={disabled}
                className={baseClassName}
            >
                {content}
            </button>
            {isDivider && <div className="border-t border-gray-200 my-1" />}
        </>
    );
};

interface DropdownProps {
    isOpen: boolean;
    positionClasses?: string;
    width?: string;
    children: React.ReactNode;
    header?: React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({
    isOpen,
    positionClasses = "top-full mt-1 right-0",
    width = "w-48",
    children,
    header,
}) => {
    if (!isOpen) return null;

    return (
        <div className={`absolute ${positionClasses} ${width} bg-white rounded-lg shadow-lg shadow-gray-400 border border-gray-200 overflow-visible z-50`}>
            {header && (
                <div className="px-4 py-4 border-b border-gray-200">
                    {header}
                </div>
            )}
            <div className="py-1">
                {children}
            </div>
        </div>
    );
};