"use client";

import React, { useRef } from 'react';
import { MdOutlineChevronRight } from "react-icons/md";
import useOutsideClick from './hooks/useClickOutside';
interface DropdownItemBaseProps {
    icon?: React.ReactNode;
    label: string;
    hasArrow?: boolean;
    onClick?: () => void;
    isDivider?: boolean;
    className?: string;
    disabled?: boolean;
}

export const DropdownItemBase: React.FC<DropdownItemBaseProps> = ({
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
            <span className="flex-1 truncate">{label}</span>
            {hasArrow && <MdOutlineChevronRight className="w-4 h-4 text-gray-400" />}
        </>
    );

    const baseClassName = `w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left text-xs rounded-md ${
        disabled 
            ? "text-gray-400 cursor-not-allowed" 
            : "text-gray-700 hover:bg-gray-100 hover:cursor-pointer"
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
            {isDivider && <div className="border-t border-gray-200 my-1 mx-3" />}
        </>
    );
};

interface DropdownBaseProps {
    isOpen: boolean;
    positionClasses?: string;
    width?: string;
    children: React.ReactNode;
    header?: React.ReactNode;
    onClose?: () => void;
}

export const DropdownBase: React.FC<DropdownBaseProps> = ({
    isOpen,
    positionClasses = "top-full mt-1 right-0",
    width = "w-48",
    children,
    header,
    onClose,
}) => {
    const dropdownRef = useRef(null);

    useOutsideClick(dropdownRef, () => {
        onClose?.();
    });

    if (!isOpen) return null;

    return (
        <div 
            ref={dropdownRef} 
            className={`absolute ${positionClasses} ${width} py-2 px-2.5 bg-white rounded-sm shadow-lg shadow-gray-400 border border-gray-200 overflow-visible z-50`}>
            {header && (
                <div className="py-3 mx-3 border-b border-gray-200">
                    {header}
                </div>
            )}
            <div>
                {children}
            </div>
        </div>
    );
};