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
    <header className="bg-white border-b border-gray-200 px-4 h-14">
      <div className="flex items-center justify-between relative h-14">
        {/* Logo and Title */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#0d7f78] rounded flex items-center justify-center">
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
        <nav className="flex items-center gap-6 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full">
          <button className="text-xs font-normal text-gray-900 border-b-2 border-[#0d7f78] h-full flex items-center">
            Data
          </button>
          <button className="text-xs font-normal text-gray-600 hover:text-gray-900 h-full flex items-center">
            Automations
          </button>
          <button className="text-xs font-normal text-gray-600 hover:text-gray-900 h-full flex items-center">
            Interfaces
          </button>
          <button className="text-xs font-normal text-gray-600 hover:text-gray-900 h-full flex items-center">
            Forms
          </button>
        </nav>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded">
            <VscHistory className="w-4 h-4 text-gray-600" />
          </button>
          <div className="text-sm font-light text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full">
            Trial: 11 days left
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-light text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 hover:cursor-pointer shadow-xs hover:shadow-sm transition-shadow duration-200">
            <FiPlayCircle className="w-4 h-4" />
            Launch
          </button>
          <button className="px-3 py-1.5 text-xs font-light text-white bg-[#0d7f78] rounded hover:cursor-pointer">
            Share
          </button>
        </div>
      </div>
    </header>
  );
}