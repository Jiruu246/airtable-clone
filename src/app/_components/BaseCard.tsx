"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

import { LuDatabase } from "react-icons/lu";
import { FaRegStar } from "react-icons/fa";
import { IoIosMore } from "react-icons/io";
import { LuPencil } from "react-icons/lu";
import { FiTrash2 } from "react-icons/fi";
import { GoCopy } from "react-icons/go";
import { FaArrowRight } from "react-icons/fa6";
import { PiUsersThree } from "react-icons/pi";
import { PiPaintBrushHousehold } from "react-icons/pi";
import useOutsideClick from "./hooks/useClickOutside";
import { DropdownBase, DropdownItemBase } from "./DropdownBase";

interface BaseCardProps {
  id: string;
  name: string;
  onDelete?: (id: string) => void;
}

export function BaseCard({
  id,
  name,
  onDelete,
}: BaseCardProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const utils = api.useUtils();
  
  const deleteBaseMutation = api.base.delete.useMutation({
    onSuccess: () => {
      void utils.base.list.invalidate();
      onDelete?.(id);
    },
    onError: (error) => {
      console.error('Failed to delete base:', error);
      alert('Failed to delete base. Please try again.');
    },
    onSettled: () => {
      setIsDeleting(false);
    }
  });

  useOutsideClick(dropdownRef, () => {
    setIsDropdownOpen(false);
  });

  const handleCardClick = () => {
    router.push(`/${id}`);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    deleteBaseMutation.mutate({ baseId: id });
    setIsDropdownOpen(false);
  };

  return (
    <div
      onClick={handleCardClick}
      className="max-w-[384px] group relative flex p-4 bg-white border-2 border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer"
    >
      {/* Card buttons */}
      <div 
        className={`absolute top-4 right-4 ${isDropdownOpen ? 'flex' : 'hidden group-hover:flex'} gap-1`}
        onClick={(e) => e.stopPropagation()}>
        <button
          className="border border-gray-200 rounded-md p-1.5 shadow-sm hover:shadow-md hover:cursor-pointer z-10"
        >
          <FaRegStar className="w-4 h-4 text-gray-600" />
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            className="border border-gray-200 rounded-md p-1.5 shadow-sm hover:shadow-md hover:cursor-pointer z-10"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <IoIosMore className="w-4 h-4 text-gray-600" />
          </button>
          
          {/* More Dropdown Menu */}
          <DropdownBase 
            isOpen={isDropdownOpen}
            width="w-60"
            >
            <DropdownItemBase
              icon={<LuPencil className="w-4 h-4" />}
              label="Edit"
            />

            <DropdownItemBase
              icon={<GoCopy className="w-4 h-4" />}
              label="Duplicate"
            />

            <DropdownItemBase
              icon={<FaArrowRight className="w-4 h-4" />}
              label="Move"
            />

            <DropdownItemBase
              icon={<PiUsersThree className="w-4 h-4" />}
              label="Go to workspace"
            />

            <DropdownItemBase
              icon={<PiPaintBrushHousehold className="w-4 h-4" />}
              label="Customize appearance"
              isDivider
            />

            <DropdownItemBase
              icon={<FiTrash2 className="w-4 h-4" />}
              label={isDeleting ? "Deleting..." : "Delete"}
              onClick={handleDelete}
              disabled={isDeleting}
            />
          </DropdownBase>
        </div>
      </div>

      {/* Thumbnail */}
      <div className="bg-[#0d7f78] rounded-xl flex items-center justify-center h-14 w-14">
        <p className="text-xl font-normal text-white">
          {name.slice(0, 2)}
        </p>
      </div>

      {/* Content */}
      <div className="px-4 my-auto">
        <h3 className="text-sm font-light text-gray-900 transition-colors mb-2">
          {name}
        </h3>

        <p className="text-xs text-gray-500 group-hover:hidden">
          Opended just now
        </p>
        <div className="hidden group-hover:flex items-center text-xs gap-2 text-gray-500">
          <LuDatabase className="w-3 h-3" />
          <p>Open data</p>
        </div>
      </div>
    </div>
  );
}