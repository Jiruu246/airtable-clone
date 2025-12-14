"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import { CiSearch  } from "react-icons/ci";
import { RxHamburgerMenu } from "react-icons/rx";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import { GoBell } from "react-icons/go";
import UserDropdownMenu from "./UserDropdown";
import useOutsideClick from "./hooks/useClickOutside";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
  };
}

export function Header({ user }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(userMenuRef, () => {
    setShowUserMenu(false);
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-2xs">
      {/* Logo and Navigation */}
      <div className="flex items-center space-x-5">
        <RxHamburgerMenu className="h-4 w-4 text-gray-600 cursor-pointer" />
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/logo.svg"
            alt="Airtable Logo"
            width={102}
            height={22.2}
          />
        </Link>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-[354px] mx-8">
        <button className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-full bg-white shadow-2xs hover:shadow-lg hover:cursor-pointer transition-shadow duration-200">
          <div className="flex items-end space-x-2">
            <CiSearch className="h-4 w-4 text-gray-700 self-end block" />
            <p className="text-xs text-gray-500 font-light leading-none self-end">Search...</p>
          </div>
          <span className="text-xs text-gray-400">ctrl K</span>
        </button>
      </div>

      {/* User Menu */}
      <div className="flex items-center space-x-3">
        <button className="flex gap-1 p-2 items-end rounded-full hover:bg-gray-100 hover:cursor-pointer">
            <AiOutlineQuestionCircle className="h-4 w-4 self-end block" />
            <p className="text-sm font-light leading-none self-end">Help</p>
        </button>
        <button className="p-1.5 rounded-full border border-gray-300 shadow-sm hover:bg-gray-100 hover:cursor-pointer">
            <GoBell className="h-4 w-4" />
        </button>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1 rounded-md hover:bg-gray-100 hover:cursor-pointer"
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "User"}
                width={25}
                height={25}
                className="rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                </span>
              </div>
            )}
          </button>

          <UserDropdownMenu 
            user={user}
            isOpen={showUserMenu}
            onClose={() => setShowUserMenu(false)}
            positionClasses="right-0 mt-2"
          />
        </div>
      </div>
    </header>
  );
}