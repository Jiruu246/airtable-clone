"use client";

import { use, useState, useRef, useEffect } from "react";
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
import { FaRegEyeSlash } from "react-icons/fa";
import { IoFilterOutline } from "react-icons/io5";
import { BsCardList } from "react-icons/bs";
import { LuArrowUpDown } from "react-icons/lu";
import { IoColorFillOutline } from "react-icons/io5";
import { CgFormatLineHeight } from "react-icons/cg";
import { GoShare } from "react-icons/go";
import { IoSearch } from "react-icons/io5";
import { GoPlus } from "react-icons/go";
import { IoChevronDown } from "react-icons/io5";

interface ViewPageProps {
  params: Promise<{
    baseId: string;
    tableId: string;
    viewId: string;
  }>;
}

export default function ViewPage({ params }: ViewPageProps) {
  const [isHideFieldsOpen, setIsHideFieldsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchString, setSearchString] = useState<string>("");
  const hideFieldsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const utils = api.useUtils();

  const { baseId, tableId, viewId } = use(params);

  const { data: allViews } = api.view.listViewsByTableId.useQuery({ tableId });
  const { data: viewMetadata } = api.view.getViewMetadata.useQuery(
    { id: viewId },
    { enabled: !!viewId }
  );
  const {data: filterData } = api.view.getViewFilters.useQuery(
    { viewId },
    { enabled: !!viewId }
  );
  const {data: sortData } = api.view.getViewOrdering.useQuery(
    { viewId },
    { enabled: !!viewId }
  );
  const { hiddenColumns, toggleColumn } = useHiddenColumns({
    viewId: viewId,
  });
  const createViewMutation = api.view.create.useMutation({
    onSuccess: (newView) => {
        void utils.view.listViewsByTableId.invalidate({ tableId });
        router.push(`/${baseId}/${tableId}/${newView.id}`);
    },
    onError: (error) => {
        console.error("Failed to create view:", error);
    }
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (hideFieldsRef.current && !hideFieldsRef.current.contains(event.target as Node)) {
        setIsHideFieldsOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  if (!allViews) {
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

  if (!currentView) {
    return (
      <div className="bg-white p-12">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-3">
            View not found
          </div>
          <div className="text-gray-400 text-base">
            The requested view could not be found in this table.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[auto_1fr] overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded">
            <RxHamburgerMenu className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 hover:bg-gray-100 hover:cursor-pointer px-3 py-1.5 rounded font-medium">
            <RxViewGrid className="w-4 h-4 text-blue-500" />
            <span className="text-sm">{currentView?.name}</span>
            <IoChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={hideFieldsRef}>
            <button 
              className={`flex items-center gap-2 text-gray-600  px-3 py-1.5 rounded text-sm ${
                hiddenColumns.size > 0 ? 'bg-blue-200' : 'hover:bg-gray-100'
              }`}
              onClick={() => setIsHideFieldsOpen(!isHideFieldsOpen)}
            >
              <FaRegEyeSlash className="w-4 h-4" />
              <span>{hiddenColumns.size > 0 ? `${hiddenColumns.size} hidden fields` : 'Hide fields'}</span>
            </button>
            <HideFieldsDropdown
              isOpen={isHideFieldsOpen}
              columns={viewMetadata?.columns ?? []}
              hiddenColumns={hiddenColumns}
              onToggleColumn={toggleColumn}
            />
          </div>
          <div className="relative" ref={filterRef}>
            <button 
              className={`flex items-center gap-2 text-gray-600 px-3 py-1.5 rounded text-sm 
                ${filterData?.conditions?.length ? 'bg-green-200' : 'hover:bg-gray-100'}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <IoFilterOutline className="w-4 h-4" />
              <span>Filter</span>
            </button>
            <FilterDropdown
              isOpen={isFilterOpen}
              columns={viewMetadata?.columns ?? []}
              viewId={viewId}
            />
          </div>
          <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded text-sm">
            <BsCardList className="w-4 h-4" />
            <span>Group</span>
          </button>
          <div className="relative" ref={sortRef}>
            <button 
              className={`flex items-center gap-2 text-gray-600 px-3 py-1.5 rounded text-sm 
                ${sortData?.conditions?.length ? 'bg-orange-200' : 'hover:bg-gray-100'}`}
              onClick={() => setIsSortOpen(!isSortOpen)}
            >
              <LuArrowUpDown className="w-4 h-4" />
              <span>Sort</span>
            </button>
            <SortDropdown
              isOpen={isSortOpen}
              columns={viewMetadata?.columns ?? []}
              viewId={viewId}
            />
          </div>
          <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded text-sm">
            <IoColorFillOutline className="w-4 h-4" />
            <span>Color</span>
          </button>
          <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded text-sm">
            <CgFormatLineHeight className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded text-sm">
            <GoShare className="w-4 h-4" />
            <span>Share and sync</span>
          </button>
          <div className="relative">
            <button 
              className="text-gray-600 hover:bg-gray-100 p-2 rounded"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <IoSearch className="w-4 h-4" />
            </button>
            <SearchDropdown
              isOpen={isSearchOpen}
              onSearchChange={setSearchString}
              onClose={() => setIsSearchOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-[256px_1fr] overflow-hidden">
        {/* Sidebar */}
        <div className="bg-white border-r border-gray-200 flex flex-col">
          <div className="p-3">
            <button
              className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded w-full text-left text-sm"
              onClick={handleCreateNewView}
              disabled={createViewMutation.isPending}
            >
              <GoPlus className="w-4 h-4" />
              <span>{createViewMutation.isPending ? "Creating..." : "Create new..."}</span>
            </button>
          </div>

          <div className="px-3">
            <div className="relative">
              <IoSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Find a view"
                className="w-full pl-9 pr-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* View List */}
          <div className="flex-1 p-2">
            {allViews?.map((view) => (
              <button 
                key={view.id}
                className={`flex items-center gap-2 px-3 py-2 rounded w-full text-left text-sm mb-1 ${
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