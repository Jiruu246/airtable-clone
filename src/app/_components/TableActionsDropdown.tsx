"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { DropdownBase, DropdownItemBase } from "./DropdownBase";
import { GrUploadOption } from "react-icons/gr";
import { TbPencil } from "react-icons/tb";
import { FaRegEyeSlash } from "react-icons/fa";
import { VscSettings } from "react-icons/vsc";
import { LuCopy } from "react-icons/lu";
import { TiFlowChildren } from "react-icons/ti";
import { IoInformationCircleOutline } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";
import { FaRegTrashAlt } from "react-icons/fa";
import { LuLockKeyhole } from "react-icons/lu";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import { IoChevronDown } from "react-icons/io5";
import { FaPlus } from "react-icons/fa6";
import { GoMail } from "react-icons/go";

interface TableActionsDropdownProps {
  isOpen: boolean;
  tableId: string;
  tableName: string;
  baseId: string;
  onClose?: () => void;
}

export const TableActionsDropdown: React.FC<TableActionsDropdownProps> = ({
  isOpen,
  tableId,
  tableName,
  baseId,
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTableName, setNewTableName] = useState(tableName);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const router = useRouter();
  const utils = api.useUtils();

  // Reset states when dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setNewTableName(tableName);
    }
  }, [isOpen, tableName]);

  const updateTableMutation = api.table.update.useMutation({
    onSuccess: () => {
      void utils.table.getByBaseId.invalidate({ baseId });
      setIsEditing(false);
      onClose?.();
    },
    onError: (error) => {
      alert(`Error updating table: ${error.message}`);
    },
  });

  const deleteTableMutation = api.table.delete.useMutation({
    onSuccess: () => {
      void utils.table.getByBaseId.invalidate({ baseId });
      onClose?.();
      router.push(`/${baseId}`);
    },
    onError: (error) => {
      alert(`Error deleting table: ${error.message}`);
    },
  });

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (newTableName.trim() && newTableName.trim() !== tableName) {
      updateTableMutation.mutate({
        tableId: tableId,
        name: newTableName.trim(),
      });
    } else {
      setIsEditing(false);
      onClose?.();
    }
  };

  const handleCancelEdit = () => {
    setNewTableName(tableName);
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    deleteTableMutation.mutate({ tableId: tableId });
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (!isOpen) return null;

  if (showDeleteConfirm) {
    return (
      <DropdownBase isOpen={true} width="w-64" positionClasses="left-0 mt-1">
        <div className="px-2">
          <h3 className="text-sm font-normal text-gray-900 mb-2">Are you sure you want to delete this table?</h3>
          <p className="text-xs text-gray-600 mb-4">
            Recently deleted tables can be restored from trash.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancelDelete}
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
              disabled={deleteTableMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteTableMutation.isPending}
              className="px-3 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded disabled:opacity-50"
            >
              {deleteTableMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </DropdownBase>
    );
  }

  if (isEditing) {
    return (
      <DropdownBase isOpen={true} width="w-80" positionClasses="left-0 mt-1">
        <div className="p-2">
          <div className="space-y-2 pb-4">
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
              placeholder="Enter table name"
              maxLength={100}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveEdit();
                } else if (e.key === 'Escape') {
                  handleCancelEdit();
                }
              }}
            />
            <div className="flex justify-between items-center">
              <p className="font-light text-gray-500 text-sm">What should each record be called?</p>
              <AiOutlineQuestionCircle className="w-4 h-4 text-gray-400 hover:cursor-pointer" />
            </div>
            <div className="bg-gray-100 text-gray-500 flex justify-between items-center text-sm p-2 rounded-md hover:cursor-pointer">
              <p>Sample</p>
              <IoChevronDown className="w-4 h-4" />
            </div>
            <div className="flex text-xs font-light text-gray-500 justify-start gap-4 items-center">
              <p className="">
                Examples:
              </p>
              <div className="flex gap-2 justify-center items-center">
                <FaPlus className="w-3 h-3" />
                <p>Add Sample</p>
              </div>
              <div className="flex gap-2 justify-center items-center">
                <GoMail className="w-3 h-3" />
                <p>Send Sample</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancelEdit}
              className="px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded"
              disabled={updateTableMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={updateTableMutation.isPending || !newTableName.trim()}
              className="px-2 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded disabled:opacity-50"
            >
              {updateTableMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </DropdownBase>
    );
  }

  return (
    <DropdownBase isOpen={true} width="w-82" positionClasses="left-0 mt-1">
      <DropdownItemBase
        icon={<GrUploadOption className="w-3 h-3" />}
        label="Import data"
        isDivider
        hasArrow
      />
      <DropdownItemBase
        icon={<TbPencil className="w-4 h-4" />}
        label="Rename table"
        onClick={handleEditClick}
      />
      <DropdownItemBase
        icon={<FaRegEyeSlash className="w-4 h-4" />}
        label="Hide table"
      />
      <DropdownItemBase
        icon={<VscSettings className="w-4 h-4" />}
        label="Manage fields"
      />
      <DropdownItemBase
        icon={<LuCopy className="w-4 h-4" />}
        label="Duplicate table"
        isDivider
      />
      <DropdownItemBase
        icon={<TiFlowChildren className="w-4 h-4" />}
        label="Configure date dependencies"
        isDivider
      />
      <DropdownItemBase
        icon={<IoInformationCircleOutline className="w-4 h-4" />}
        label="Edit table description"
      />
      <DropdownItemBase
        icon={<LuLockKeyhole className="w-4 h-4" />}
        label="Edit table permissions"
        isDivider
      />
      <DropdownItemBase
        icon={<IoMdClose className="w-4 h-4" />}
        label="Clear data"
      />
      <DropdownItemBase
        icon={<FaRegTrashAlt className="w-4 h-4" />}
        label="Delete table"
        onClick={handleDeleteClick}
      />
    </DropdownBase>
  );
};