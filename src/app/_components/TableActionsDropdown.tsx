"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { Dropdown, DropdownItem } from "./Dropdown";
import { MdEdit, MdDelete } from "react-icons/md";

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
    console.log("is Open:", isOpen);
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
        id: tableId,
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
    deleteTableMutation.mutate({ id: tableId });
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (!isOpen) return null;

  if (showDeleteConfirm) {
    return (
      <Dropdown isOpen={true} width="w-80" positionClasses="left-0 mt-1">
        <div className="px-4 py-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Are you sure you want to delete this table?</h3>
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
      </Dropdown>
    );
  }

  if (isEditing) {
    return (
      <Dropdown isOpen={true} width="w-72" positionClasses="left-0 mt-1">
        <div className="px-4 py-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Edit Table Name</h3>
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
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancelEdit}
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
              disabled={updateTableMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={updateTableMutation.isPending || !newTableName.trim()}
              className="px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded disabled:opacity-50"
            >
              {updateTableMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Dropdown>
    );
  }

  return (
    <Dropdown isOpen={true} width="w-48" positionClasses="left-0 mt-1">
      <DropdownItem
        icon={<MdEdit className="w-4 h-4" />}
        label="Edit table name"
        onClick={handleEditClick}
      />
      <DropdownItem
        icon={<MdDelete className="w-4 h-4" />}
        label="Delete table"
        onClick={handleDeleteClick}
        className="text-red-600 hover:bg-red-50"
      />
    </Dropdown>
  );
};