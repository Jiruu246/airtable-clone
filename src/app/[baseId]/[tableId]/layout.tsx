"use client";

import { use, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { TableActionsDropdown } from "~/app/_components/TableActionsDropdown";

import { IoChevronDown } from "react-icons/io5";
import { GoPlus } from "react-icons/go";
import useOutsideClick from "~/app/_components/hooks/useClickOutside";

function QuaterPipeRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="3" height="3" viewBox="0 0 3 3" className="absolute bottom-0 right-0 translate-x-full z-15">
      <path fillRule="evenodd" clipRule="evenodd" d="M0 0C0 1.65686 1.34326 3 3 3H0V0Z" fill="white"></path>
    </svg>);
}

function QuaterPipeLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="3" height="3" viewBox="0 0 3 3" className="absolute bottom-0 left-0 -translate-x-full z-15">
      <path fillRule="evenodd" clipRule="evenodd" d="M3 0C3 1.65686 1.65674 3 0 3H3V0Z" fill="white"></path>
    </svg>);
}
interface TableLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    baseId: string;
    tableId: string;
  }>;
}

export default function TableLayout({ children, params }: TableLayoutProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const tableActionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const utils = api.useUtils();

  const { baseId, tableId } = use(params);

  const { data: currentTable, isLoading } = api.table.getById.useQuery({ tableId: tableId });
  const { data: allTables } = api.table.getByBaseId.useQuery({ baseId });

  const createTableMutation = api.table.createWithSampleData.useMutation({
    onSuccess: (newTable) => {
      void utils.table.getByBaseId.invalidate({ baseId });
      router.push(`/${baseId}/${newTable.id}`);
    },
    onError: (error) => {
      console.error("Failed to create table:", error);
    },
  });

  useOutsideClick(tableActionsRef, () => {
    setIsDropdownOpen(false);
  });

  const handleCreateNewTable = () => {
    createTableMutation.mutate({
      name: "Untitled Table",
      baseId: baseId,
    });
  };

  const handleSwitchTable = (newTableId: string) => {
    if (newTableId !== tableId) {
      router.push(`/${baseId}/${newTableId}`);
    }
  };

  if (isLoading || !currentTable) {
    return null;
  }

  return (
    <div className="grid grid-rows-[auto_1fr] overflow-hidden">
      {/* Tables Navigation */}
      <div className="bg-green-100 border-gray-200 flex items-center justify-between shadow-[inset_0_-5px_5px_-5px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-2 overflow-y-visible max-w-full">
          <div className="flex items-center shrink-0">
            {allTables?.map((table, index) => {
              const isActive = table.id === tableId;
              const isFirst = index === 0;
              const nextActive = allTables[index + 1]?.id === tableId;
              const divider = "relative after:content-[''] after:absolute after:right-0 after:top-1/4 after:h-1/2 after:w-px after:bg-gray-300"

              let classNames = "";
              if (isActive) {
                classNames += `bg-white text-gray-900 shadow-sm shadow-gray-400 z-10
                  ${isFirst ? 'rounded-tr-sm' : 'rounded-t-sm'} `;
              } else {
                classNames += "text-gray-500 hover:bg-black/10 rounded-t-sm hover:text-gray-900 ";
              }

              return (
                <div key={table.id} className="relative shrink-0" ref={isActive ? tableActionsRef : null}>
                  <div className="relative">
                    {isActive && <QuaterPipeLeft />}
                    <button
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-normal hover:cursor-pointer
                        ${classNames} ${!nextActive && !isActive ? divider : ''}`}
                      onClick={() => handleSwitchTable(table.id)}
                      onContextMenu={(e) => {
                        if (isActive) {
                          e.preventDefault();
                          setIsDropdownOpen(true);
                        }
                      }}
                    >
                      <span>{table.name}</span>
                      {isActive && <IoChevronDown className="w-4 h-4" />}
                    </button>
                    {isActive && <QuaterPipeRight />}
                  </div>
                  {isActive && (
                    <TableActionsDropdown
                      isOpen={isDropdownOpen}
                      tableId={currentTable.id}
                      tableName={currentTable.name}
                      baseId={baseId}
                      onClose={() => setIsDropdownOpen(false)}
                    />
                  )}
                </div>
              )
            })}
            <div>
              <IoChevronDown className="w-4 h-4 text-gray-400 mx-2" />
            </div>
            <button
              className="flex items-center gap-2 px-3 py-1.5 shrink-0 text-gray-600 hover:text-gray-700 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCreateNewTable}
              disabled={createTableMutation.isPending}
            >
              <GoPlus className="w-4 h-4" />
              <span className="text-xs font-light">
                {createTableMutation.isPending ? 'Creating...' : 'Add or import'}
              </span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-2 text-gray-700 px-4 py-1.5 rounded">
            <span className="text-xs font-light">Tools</span>
            <IoChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col overflow-hidden bg-white z-15">
        {children}
      </div>
    </div>
  );
}