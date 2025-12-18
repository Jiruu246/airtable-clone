"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { DataTable } from "~/app/_components/DataTable";
import { HideFieldsDropdown } from "~/app/_components/HideFieldsDropdown";
import { FilterDropdown } from "~/app/_components/FilterDropdown";
import { SortDropdown } from "~/app/_components/SortDropdown";
import { SearchDropdown } from "~/app/_components/SearchDropdown";
import { useHiddenColumns } from "~/app/_components/hooks/useHiddenColumns";

import { RxHamburgerMenu } from "react-icons/rx";
import { RxViewGrid } from "react-icons/rx";
import { BsCardList } from "react-icons/bs";
import { IoColorFillOutline } from "react-icons/io5";
import { CgFormatLineHeight } from "react-icons/cg";
import { GoShare } from "react-icons/go";
import { IoSearch } from "react-icons/io5";
import { GoPlus } from "react-icons/go";
import { IoChevronDown } from "react-icons/io5";
import { PiGear } from "react-icons/pi";

interface ViewPageProps {
  params: Promise<{
    baseId: string;
    tableId: string;
    viewId: string;
  }>;
}

export default function ViewPage({ params }: ViewPageProps) {
  const [searchString, setSearchString] = useState<string>("");
  const router = useRouter();
  
  const utils = api.useUtils();

  const { baseId, tableId, viewId } = use(params);

  const { data: allViews, isLoading } = api.view.listViewsByTableId.useQuery({ tableId });
  const { data: viewMetadata } = api.view.getViewMetadata.useQuery(
    { viewId: viewId },
    { enabled: !!viewId }
  );
  const { hiddenColumns, toggleColumn } = useHiddenColumns({
    viewId: viewId,
  });
  const createViewMutation = api.view.create.useMutation({
    onSuccess: async (newView) => {
        await utils.view.listViewsByTableId.invalidate({ tableId });
        router.push(`/${baseId}/${tableId}/${newView.id}`);
    },
    onError: (error) => {
        console.error("Failed to create view:", error);
    }
  });

  const handleCreateNewView = () => {
    createViewMutation.mutate({
      name: "Grid View",
      tableId: tableId,
    });
  }

  const handleViewSwitch = (newViewId: string) => {
    if (newViewId !== viewId) {
      router.push(`/${baseId}/${tableId}/${newViewId}`);
    }
  };

  const currentView = allViews?.find(view => view.id === viewId);

  if (isLoading || !allViews || !currentView) {
    return <div className="flex-1 bg-white z-20"></div>;
  }

  return (
    <div className="grid grid-rows-[auto_1fr] overflow-hidden h-full">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-2 py-2 flex items-center justify-between z-11">
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded">
            <RxHamburgerMenu className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 hover:bg-gray-100 hover:cursor-pointer px-2 py-1.5 rounded">
            <RxViewGrid className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-light">{currentView?.name}</span>
            <IoChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <HideFieldsDropdown
            columns={viewMetadata?.columns ?? []}
            hiddenColumns={hiddenColumns}
            onToggleColumn={toggleColumn}
          />
          <FilterDropdown
            columns={viewMetadata?.columns ?? []}
            viewId={viewId}
            searchString={searchString}
          />
          <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-2 py-1.5 rounded text-xs font-light">
            <BsCardList className="w-4 h-4" />
            <span>Group</span>
          </button>
          <SortDropdown
            columns={viewMetadata?.columns ?? []}
            viewId={viewId}
            searchString={searchString}
          />
          <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-2 py-1.5 rounded text-xs font-light">
            <IoColorFillOutline className="w-4 h-4" />
            <span>Color</span>
          </button>
          <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-2 py-1.5 rounded text-xs font-light">
            <CgFormatLineHeight className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-2 py-1.5 rounded text-xs font-light">
            <GoShare className="w-4 h-4" />
            <span>Share and sync</span>
          </button>
          <SearchDropdown
            searchValue={searchString}
            onSearchChange={setSearchString}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-[280px_1fr] overflow-hidden">
        {/* Sidebar */}
        <div className="bg-white border-r border-gray-200 flex flex-col">
          <div className="p-2">
            <button
              className={`flex items-center gap-2 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded w-full text-left text-xs font-normal hover:cursor-pointer
                ${createViewMutation.isPending ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={handleCreateNewView}
              disabled={createViewMutation.isPending}
            >
              {createViewMutation.isPending 
                ? <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" /> 
                : <GoPlus className="w-4 h-4" />}
              <span>{createViewMutation.isPending ? "Creating..." : "Create new..."}</span>
            </button>
          </div>

          <div className="px-3">
            <div className="relative">
              <IoSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Find a view"
                className="w-full pl-9 pr-3 py-2 text-xs rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <PiGear className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-700 hover:cursor-pointer" />
            </div>
          </div>

          {/* View List */}
          <div className="flex-1 p-2">
            {allViews?.map((view) => (
              <button 
                key={view.id}
                className={`flex items-center gap-2 px-3 py-2 rounded w-full text-left text-xs font-normal mb-1 hover:cursor-pointer ${
                  viewId === view.id 
                    ? 'text-gray-700 bg-gray-100' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => handleViewSwitch(view.id)}
              >
                <RxViewGrid className="w-4 h-4 text-blue-500" />
                <span>{view.name}</span>
              </button>
            )) || (
              <div className="text-gray-500 text-sm px-3 py-2">No views available</div>
            )}
          </div>
        </div>

        {/* Table Content Area */}
        <DataTable 
          tableId={tableId}
          viewId={viewId} 
          visibleColumns={viewMetadata ? viewMetadata.columns.filter(col => !hiddenColumns.has(col.id)) : []}
          searchString={searchString}
        />
      </div>
    </div>
  );
}