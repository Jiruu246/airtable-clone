import React from 'react';
import { signOut } from "next-auth/react";
import { AiOutlineUser } from "react-icons/ai";
import { PiUsers, PiWrenchLight } from "react-icons/pi";
import { MdOutlineStars, MdOutlineColorLens, MdLogout } from "react-icons/md";
import { VscBell } from "react-icons/vsc";
import { IoLanguageOutline } from "react-icons/io5";
import { GoMail } from "react-icons/go";
import { BsLink45Deg } from "react-icons/bs";
import { GrTrash } from "react-icons/gr";
import { Dropdown, DropdownItem } from "./Dropdown";

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id?: string;
}

interface UserDropdownMenuProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  positionClasses?: string;
}

const UserDropdownMenu: React.FC<UserDropdownMenuProps> = ({ 
  user, 
  isOpen,
  onClose,
  positionClasses
}) => {
  const handleSignOut = () => {
    onClose();
    void signOut({ callbackUrl: "/login" });
  };

  const userHeader = (
    <>
      <div className="font-medium text-gray-900">{user.name ?? 'User'}</div>
      <div className="text-sm text-gray-500">{user.email ?? 'No email'}</div>
    </>
  );

  return (
    <Dropdown 
      isOpen={isOpen} 
      positionClasses={positionClasses} 
      width="w-80"
      header={userHeader}
    >
      <DropdownItem
        icon={<AiOutlineUser className="w-4 h-4" />}
        label="Account"
      />
      
      <DropdownItem
        icon={<PiUsers className="w-4 h-4" />}
        label="Manage groups"
      />
      
      <DropdownItem
        icon={<VscBell className="w-4 h-4" />}
        label="Notification preferences"
        hasArrow
      />
      
      <DropdownItem
        icon={<IoLanguageOutline className="w-4 h-4" />}
        label="Language preferences"
        hasArrow
      />
      
      <DropdownItem
        icon={<MdOutlineColorLens className="w-4 h-4" />}
        label="Appearance"
        hasArrow
        isDivider
      />
      
      <DropdownItem
        icon={<GoMail className="w-4 h-4" />}
        label="Contact sales"
      />
      
      <DropdownItem
        icon={<MdOutlineStars className="w-4 h-4" />}
        label="Upgrade"
      />
      
      <DropdownItem
        icon={<GoMail className="w-4 h-4" />}
        label="Tell a friend"
        isDivider
      />
      
      <DropdownItem
        icon={<BsLink45Deg className="w-4 h-4" />}
        label="Integrations"
      />
      
      <DropdownItem
        icon={<PiWrenchLight className="w-4 h-4" />}
        label="Builder hub"
        isDivider
      />
      
      <DropdownItem
        icon={<GrTrash className="w-4 h-4" />}
        label="Trash"
      />
      
      <DropdownItem
        icon={<MdLogout className="w-4 h-4" />}
        label="Log out"
        onClick={handleSignOut}
      />
    </Dropdown>
  );
};

export default UserDropdownMenu;