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
import { DropdownBase, DropdownItemBase } from './DropdownBase';

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
      <div className="font-normal text-sm text-gray-600">{user.name ?? 'User'}</div>
      <div className="font-normal text-sm text-gray-600">{user.email ?? 'No email'}</div>
    </>
  );

  return (
    <DropdownBase 
      isOpen={isOpen} 
      positionClasses={positionClasses} 
      width="w-80"
      header={userHeader}
    >
      <DropdownItemBase
        icon={<AiOutlineUser className="w-4 h-4" />}
        label="Account"
      />
      
      <DropdownItemBase
        icon={<PiUsers className="w-4 h-4" />}
        label="Manage groups"
      />
      
      <DropdownItemBase
        icon={<VscBell className="w-4 h-4" />}
        label="Notification preferences"
        hasArrow
      />
      
      <DropdownItemBase
        icon={<IoLanguageOutline className="w-4 h-4" />}
        label="Language preferences"
        hasArrow
      />
      
      <DropdownItemBase
        icon={<MdOutlineColorLens className="w-4 h-4" />}
        label="Appearance"
        hasArrow
        isDivider
      />
      
      <DropdownItemBase
        icon={<GoMail className="w-4 h-4" />}
        label="Contact sales"
      />
      
      <DropdownItemBase
        icon={<MdOutlineStars className="w-4 h-4" />}
        label="Upgrade"
      />
      
      <DropdownItemBase
        icon={<GoMail className="w-4 h-4" />}
        label="Tell a friend"
        isDivider
      />
      
      <DropdownItemBase
        icon={<BsLink45Deg className="w-4 h-4" />}
        label="Integrations"
      />
      
      <DropdownItemBase
        icon={<PiWrenchLight className="w-4 h-4" />}
        label="Builder hub"
        isDivider
      />
      
      <DropdownItemBase
        icon={<GrTrash className="w-4 h-4" />}
        label="Trash"
      />
      
      <DropdownItemBase
        icon={<MdLogout className="w-4 h-4" />}
        label="Log out"
        onClick={handleSignOut}
      />
    </DropdownBase>
  );
};

export default UserDropdownMenu;