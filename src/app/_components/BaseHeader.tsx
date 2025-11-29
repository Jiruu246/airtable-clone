"use client";

import Image from "next/image";
import { IoChevronDown } from "react-icons/io5";
import { VscHistory } from "react-icons/vsc";
import { FiPlayCircle } from "react-icons/fi";


interface HeaderProps {
  baseName: string;
}

export function BaseHeader({ baseName }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#0d7f78] rounded flex items-center justify-center">
            <Image
                src="/logo_mono_white.svg"
                alt="Base Logo"
                width={20}
                height={20}
                className="w-5 h-5"
            />
          </div>
          <span className="font-semibold text-gray-900">{baseName}</span>
          <IoChevronDown className="w-4 h-4 text-gray-500" />
        </div>

        {/* Center - Navigation */}
        <nav className="flex items-center gap-6">
          <button className="text-sm font-medium text-gray-900 border-b-2 border-[#0d7f78] py-4">
            Data
          </button>
          <button className="text-sm font-medium text-gray-600 hover:text-gray-900 py-4">
            Automations
          </button>
          <button className="text-sm font-medium text-gray-600 hover:text-gray-900 py-4">
            Interfaces
          </button>
          <button className="text-sm font-medium text-gray-600 hover:text-gray-900 py-4">
            Forms
          </button>
        </nav>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded">
            <VscHistory className="w-4 h-4 text-gray-600" />
          </button>
          <div className="text-sm text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full">
            Trial: 11 days left
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 hover:cursor-pointer shadow-xs hover:shadow-sm transition-shadow duration-200">
            <FiPlayCircle className="w-4 h-4" />
            Launch
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-white bg-[#0d7f78] rounded hover:cursor-pointer">
            Share
          </button>
        </div>
      </div>
    </header>
  );
}