"use client";

import { use, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { TableActionsDropdown } from "~/app/_components/TableActionsDropdown";

import { IoChevronDown } from "react-icons/io5";
import { GoPlus } from "react-icons/go";

interface TableLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    baseId: string;
    tableId: string;
  }>;
}

export default function TableLayout({ children, params }: TableLayoutProps) {
  const [isTableActionsOpen, setIsTableActionsOpen] = useState(false);
  const tableActionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const utils = api.useUtils();

  const { baseId, tableId } = use(params);

  const { data: currentTable } = api.table.getById.useQuery({ id: tableId });
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tableActionsRef.current && !tableActionsRef.current.contains(event.target as Node)) {
        setIsTableActionsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  if (!currentTable) {
    return (
      <div className="bg-white p-12">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-3">
            Table not found
          </div>
          <div className="text-gray-400 text-base">
            The requested table could not be found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[auto_1fr] overflow-hidden">
      {/* Tables Navigation */}
      <div className="bg-green-100 border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-y-visible max-w-full">
          <div className="flex items-center shrink-0">
            {allTables?.map((table, index) => {
              const isActive = table.id === tableId;
              const isFirst = index === 0;
              const nextActive = allTables[index + 1]?.id === tableId;
              const divider = "relative after:content-[''] after:absolute after:right-0 after:top-1/4 after:h-1/2 after:w-px after:bg-gray-300"

              let classNames = "";
              if (isActive) {
                classNames += `bg-white text-gray-700 border-t border-gray-300 
                  ${isFirst ? 'border-r rounded-tr-sm' : 'border-x rounded-t-sm'} `;
              } else {
                classNames += "text-gray-500 hover:bg-gray-200/60 ";
              }

              return (
                <div key={table.id} className="relative shrink-0" ref={isActive ? tableActionsRef : null}>
                  <button
                    className={`flex items-center font-normal gap-2 px-4 py-2 text-sm hover:cursor-pointer 
                      ${classNames} ${!nextActive && !isActive? divider : ''}`}
                    onClick={() => handleSwitchTable(table.id)}
                    onContextMenu={(e) => {
                      if (isActive) {
                        e.preventDefault();
                        setIsTableActionsOpen(true);
                      }
                    }}
                  >
                    <span>{table.name}</span>
                    {isActive && <IoChevronDown className="w-4 h-4" />}
                  </button>
                  {isActive && (
                    <TableActionsDropdown
                      isOpen={isTableActionsOpen}
                      tableId={currentTable.id}
                      tableName={currentTable.name}
                      baseId={baseId}
                      onClose={() => setIsTableActionsOpen(false)}
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
              <span className="text-sm">
                {createTableMutation.isPending ? 'Creating...' : 'Add or import'}
              </span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-2 text-gray-700 px-3 py-1.5 rounded">
            <span className="text-sm">Tools</span>
            <IoChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {children}
    </div>
  );
}