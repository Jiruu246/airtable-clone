"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IoIosArrowRoundBack } from "react-icons/io";
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

export function BaseSidebar({ user }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useOutsideClick(userMenuRef, () => {
    setShowUserMenu(false);
  });

  return (
    <aside className="h-screen bg-white border-r border-gray-200 flex flex-col justify-center p-2">
      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        <div 
          className="group p-2 relative"
          onClick={() => router.push('/')}
          >
          <Image
            src="/logo_mono_black.svg"
            alt="Logo"
            width={170}
            height={170}
            className="h-6 w-6 transition-all duration-300 ease-in-out group-hover:scale-0 group-hover:opacity-0"
          />
          <button 
            className="absolute top-2 left-2 transition-all duration-300 ease-in-out scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 hover:cursor-pointer"
          >
            <IoIosArrowRoundBack className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-3 justify-center">
        <button className="p-2 m-auto rounded-full hover:bg-gray-100 hover:cursor-pointer">
          <AiOutlineQuestionCircle className="h-4 w-4" />
        </button>
        <button className="m-auto hover:bg-gray-100 hover:cursor-pointer">
          <GoBell className="h-4 w-4" />
        </button>

        <div className="flex justify-center items-center" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center justify-center space-x-2 p-1 rounded-md hover:cursor-pointer"
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

          <div className="relative">
            <UserDropdownMenu
              user={user}
              isOpen={showUserMenu}
              onClose={() => setShowUserMenu(false)}
              positionClasses="left-full bottom-0 ml-2"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}