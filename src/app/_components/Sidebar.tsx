"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { GrHomeRounded } from "react-icons/gr";
import { LuStar } from "react-icons/lu";
import { PiShare, PiUsersThree, PiShoppingBagOpen } from "react-icons/pi";
import { IoChevronForward, IoBookOutline } from "react-icons/io5";
import { GoPlus } from "react-icons/go";
import { FaPlus } from "react-icons/fa6";
import { TbUpload } from "react-icons/tb";
import { api } from "~/trpc/react";

interface NavigationItemProps {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  hasChevron?: boolean;
  rightIcon?: ReactNode;
  onClick?: () => void;
}

interface ActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}

// Components
const NavigationItem = ({ 
  icon, 
  label, 
  isActive = false, 
  hasChevron = false, 
  rightIcon, 
  onClick 
}: NavigationItemProps) => {
  const baseClasses = "w-full flex items-center px-3 py-2.5 text-gray-700 rounded-sm";
  const activeClasses = isActive ? "bg-[#f2f4f8]" : "hover:bg-[#f2f4f8] hover:cursor-pointer";
  
  return (
    <button 
      className={`${baseClasses} ${activeClasses}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center justify-center w-5 h-5">{icon}</div>
        <span className="text-sm font-normal">{label}</span>
      </div>
      {hasChevron && (
        <IoChevronForward className="w-3 h-3 transition-transform" />
      )}
      {rightIcon && (
        <div className="flex items-center gap-1">
          {rightIcon}
        </div>
      )}
    </button>
  );
};

const ActionButton = ({ icon, label, onClick }: ActionButtonProps) => (
  <button 
    className="w-full flex items-center gap-1 px-2 py-2 text-gray-800 rounded-sm hover:bg-gray-200 hover:cursor-pointer transition-colors"
    onClick={onClick}
  >
    {icon}
    <span className="text-xs font-normal">{label}</span>
  </button>
);

const CreateButton = ({ onClick }: { onClick?: () => void }) => (
  <div className="pt-2">
    <button 
      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 hover:cursor-pointer text-white rounded-lg transition-colors font-medium text-xs disabled:bg-blue-300 disabled:cursor-not-allowed"
      onClick={onClick}
    >
      <FaPlus className="w-3 h-3" />
      Create
    </button>
  </div>
);

export function Sidebar() {
  const router = useRouter();
  const utils = api.useUtils();
  
  const createBaseMutation = api.base.create.useMutation({
    onSuccess: (newBase) => {
      //TODO: navigate to the new base page before waiting for the table data to be created
      void utils.base.list.invalidate();
      router.push(`/${newBase.id}`);
    },
    onError: (error) => {
      console.error("Failed to create base:", error);
    },
  });

  const handleCreateBase = () => {
    createBaseMutation.mutate({
      name: "Untitled Base",
    });
  };

  return (
    <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-75 bg-white border-r border-gray-200 flex flex-col p-3 z-40">
      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        <NavigationItem
          icon={<GrHomeRounded className="w-4 h-4" />}
          label="Home"
          isActive={true}
        />
        
        <NavigationItem
          icon={<LuStar className="w-5 h-5" />}
          label="Starred"
          hasChevron={true}
        />
        
        <NavigationItem
          icon={<PiShare className="w-5 h-5" />}
          label="Shared"
        />
        
        <NavigationItem
          icon={<PiUsersThree className="w-5 h-5" />}
          label="Workspaces"
          rightIcon={
            <>
              <GoPlus className="w-4 h-4" />
              <IoChevronForward className="w-4 h-4" />
            </>
          }
        />
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-gray-200 py-1 pt-3">
        <div className="flex flex-col mb-2">
          <ActionButton
            icon={<IoBookOutline className="w-4 h-4" />}
            label="Templates and apps"
          />
          
          <ActionButton
            icon={<PiShoppingBagOpen className="w-4 h-4" />}
            label="Marketplace"
          />
          
          <ActionButton
            icon={<TbUpload className="w-4 h-4" />}
            label="Import"
          />
        </div>

        <CreateButton onClick={handleCreateBase} />
      </div>
    </aside>
  );
}