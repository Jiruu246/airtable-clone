import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { BaseSidebar } from "~/app/_components/BaseSidebar";
import { BaseHeader } from "~/app/_components/BaseHeader";
import { DataTable } from "~/app/_components/DataTable";

import { IoChevronDown } from "react-icons/io5";
import { GoPlus } from "react-icons/go";
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
import { GoGear } from "react-icons/go";

interface BaseDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BaseDetailPage({ params }: BaseDetailPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { id: baseId } = await params;

  const [base, firstTableData] = await Promise.all([
    api.base.getById({ id: baseId }),
    api.base.getFirstTableData({ id: baseId }),
  ]);

  return (
    <div className="h-screen bg-gray-100 grid grid-cols-[auto_1fr]">
      {/* Header */}
      <BaseSidebar user={session.user} />

      <div className="grid grid-rows-[auto_auto_auto_1fr] overflow-hidden">
        <BaseHeader baseName={base.name} />

        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded">
              <span className="font-medium">{firstTableData?.name}</span>
              <IoChevronDown className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded">
              <IoChevronDown className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded">
              <GoPlus className="w-4 h-4" />
              <span className="text-sm">Add or import</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded">
              <span className="text-sm">Tools</span>
              <IoChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded">
              <RxHamburgerMenu className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded font-medium">
              <RxViewGrid className="w-4 h-4" />
              <span className="text-sm">Grid view</span>
              <IoChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded text-sm">
              <FaRegEyeSlash className="w-4 h-4" />
              <span>Hide fields</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded text-sm">
              <IoFilterOutline className="w-4 h-4" />
              <span>Filter</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded text-sm">
              <BsCardList className="w-4 h-4" />
              <span>Group</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded text-sm">
              <LuArrowUpDown className="w-4 h-4" />
              <span>Sort</span>
            </button>
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
            <button className="text-gray-600 hover:bg-gray-100 p-2 rounded">
              <IoSearch className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area - This takes up remaining space and handles overflow */}
        <div className="grid grid-cols-[256px_1fr] overflow-hidden">
          {/* Sidebar */}
          <div className="bg-white border-r border-gray-200 flex flex-col">
            <div className="p-3 border-b border-gray-200">
              <button className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded w-full text-left text-sm">
                <GoPlus className="w-4 h-4" />
                <span>Create new...</span>
              </button>
            </div>

            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <IoSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Find a view"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <GoGear className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-2">
              <button className="flex items-center gap-2 text-gray-700 bg-gray-100 px-3 py-2 rounded w-full text-left text-sm">
                <RxViewGrid className="w-4 h-4" />
                <span>Grid view</span>
              </button>
            </div>

            <div className="p-3 border-t border-gray-200">
              <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded w-full text-left text-sm">
                <GoPlus className="w-4 h-4" />
                <span>Add...</span>
              </button>
            </div>

            <div className="px-3 py-2 text-xs text-gray-500">
              {firstTableData?.rows.length} records
            </div>
          </div>

          {/* Table Content Area */}
          {firstTableData ? (
            <DataTable data={firstTableData} />
          ) : (
            <div className="bg-white p-12">
              <div className="text-center">
                <div className="text-gray-500 text-xl mb-3">
                  No tables found
                </div>
                <div className="text-gray-400 text-base">
                  This base does not have any tables yet. Create your first table to get started.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}